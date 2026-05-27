/**
 * mcpClient.js — Server-side only (Vercel serverless)
 * Verified against live API 27-May-2026:
 * - Job status = "COMPLETE" (not SUCCESSFUL)
 * - jobCode extracted via regex: [a-f0-9]{24}-[a-f0-9]{32}
 * - Inventory columns: Item SkuCode, Category Name, Inventory
 * - Sales columns: Item SKU Code (one row per unit sold)
 * - DRR jobs must be SEQUENTIAL (parallel triggers "already scheduled" error)
 * - Actual categories: "Bracelets & Pendants", "Bracelets and Pendants",
 *   "Crystal", "Frame", "Murti " (trailing space), "Vastu"
 */

const MCP_URL       = process.env.MCP_URL           || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN     = process.env.MCP_TOKEN         || '';
const FACILITY_CODE = process.env.MCP_FACILITY_CODE || 'MSKT_FZP';

// Normalise category → one of 5 allowed, or null to skip
function normaliseCategory(raw) {
  const s = (raw || '').trim().toLowerCase();
  if (s === 'bracelets & pendants' || s === 'bracelets and pendants') return 'Bracelets and Pendants';
  if (s === 'crystal' || s === 'crystals') return 'Crystals';
  if (s === 'frame') return 'Frame';
  if (s === 'murti') return 'Murti';
  if (s === 'vastu') return 'Vastu';
  return null;
}

let _sessionId = null;

// ── SSE / JSON parser ─────────────────────────────────────────────────────────
function parseResponse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  const dataLines = trimmed.split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => l.slice(5).trim())
    .filter(l => l && l !== '[DONE]');
  if (!dataLines.length) throw new Error(`No data in SSE: ${text.slice(0, 200)}`);
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(dataLines[i]);
      if ('result' in obj || 'error' in obj || obj.jsonrpc) return obj;
    } catch { /* try previous */ }
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
}

// ── Core POST ─────────────────────────────────────────────────────────────────
async function mcpPost(method, params = {}) {
  const headers = {
    'Content-Type':  'application/json',
    'Accept':        'application/json, text/event-stream',
    'Authorization': `Bearer ${MCP_TOKEN}`,
  };
  if (_sessionId) headers['mcp-session-id'] = _sessionId;

  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const sid = res.headers.get('mcp-session-id');
  if (sid) _sessionId = sid;

  const text = await res.text();
  let json;
  try { json = parseResponse(text); }
  catch (e) { throw new Error(`Parse error: ${e.message} | raw: ${text.slice(0, 300)}`); }
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

export async function init() {
  _sessionId = null;
  await mcpPost('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'weekly-dashboard', version: '1.0.0' },
  });
}

async function callTool(name, args = {}) {
  return mcpPost('tools/call', { name, arguments: args });
}

function extractText(result) {
  if (!result) return '{}';
  if (typeof result === 'string') return result;
  if (Array.isArray(result.content)) {
    for (const b of result.content) if (b.type === 'text') return b.text;
  }
  return JSON.stringify(result);
}

// Extract jobCode using verified regex pattern
function extractJobCode(result) {
  const text = extractText(result);
  // Try JSON first
  try {
    const j = JSON.parse(text);
    if (j.jobCode) return j.jobCode;
  } catch { /* fall through */ }
  // Regex: 24-char hex + '-' + 32-char hex (verified format)
  const m = text.match(/[a-f0-9]{24}-[a-f0-9]{32}/);
  return m ? m[0] : null;
}

function num(v) { const n = parseFloat(String(v || 0).replace(/,/g, '')); return isNaN(n) ? 0 : n; }

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];
  function parseLine(line) {
    const vals = []; let cur = '', inQ = false, i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i += 2; continue; } inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += ch;
      i++;
    }
    vals.push(cur); return vals;
  }
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

// ── Poll until COMPLETE or SUCCESSFUL ────────────────────────────────────────
async function pollExport(jobCode, maxWait = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 8000));
    const res  = await callTool('get_export_job_status', { jobCode, facilityCode: FACILITY_CODE });
    const text = extractText(res);
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = {}; }
    const st  = (parsed?.status || '').toUpperCase();
    const url = parsed?.filePath || '';
    if ((st === 'COMPLETE' || st === 'SUCCESSFUL') && url) return url;
    if (st === 'FAILED') throw new Error(`Export job failed: ${parsed?.message || ''}`);
  }
  throw new Error(`Export job ${jobCode} timed out`);
}

async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  return res.text();
}

// ── DRR calculation ───────────────────────────────────────────────────────────
// Each row in sale order CSV = 1 unit sold
// DRR = total rows for SKU / number of days
function calcDRR(rows, days) {
  const counts = {};
  rows.forEach(r => {
    const sku = (r['Item SKU Code'] || r['Item SkuCode'] || '').trim();
    if (sku) counts[sku] = (counts[sku] || 0) + 1;
  });
  const drr = {};
  Object.entries(counts).forEach(([sku, total]) => {
    drr[sku] = Math.round((total / days) * 10) / 10;
  });
  return drr;
}

// ── Trigger sale order export and wait ───────────────────────────────────────
async function fetchSaleOrderDRR(startDate, endDate, days) {
  try {
    const jobRes  = await callTool('create_sale_order_export', {
      startDate, endDate,
      preset: 'sku_drr',
      facilityCode: FACILITY_CODE,
    });
    const jobCode = extractJobCode(jobRes);
    if (!jobCode) return {};
    const url  = await pollExport(jobCode);
    const rows = parseCSV(await fetchCSV(url));
    return calcDRR(rows, days);
  } catch { return {}; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-LEVEL FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fetchInventory
 * Steps (SEQUENTIAL — parallel triggers "already scheduled" on UC side):
 *   1. Inventory Snapshot → stock levels
 *   2. DRR 7d  → sale order rows last 7 days
 *   3. DRR 15d → sale order rows last 15 days
 *   4. DRR 30d → sale order rows last 30 days
 *   5. Merge: DRR Max = max(7d,15d,30d), DOC = Inventory / DRR Max
 *   6. Filter to 5 allowed categories, normalise names
 */
export async function fetchInventory() {
  const now = new Date();
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d15 = new Date(now); d15.setDate(d15.getDate() - 15);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);

  // Step 1: Trigger Inventory Snapshot
  const invJobRes = await callTool('create_export_job', {
    exportJobTypeName: 'Inventory Snapshot',
    facilityCode: FACILITY_CODE,
  });
  const invJobCode = extractJobCode(invJobRes);
  if (!invJobCode) throw new Error('No jobCode from Inventory Snapshot');

  // Step 2: Poll inventory
  const invUrl  = await pollExport(invJobCode);
  const invRows = parseCSV(await fetchCSV(invUrl));

  // Steps 3-5: DRR exports SEQUENTIALLY (UC rejects parallel same-type jobs)
  const drr7Map  = await fetchSaleOrderDRR(d7.toISOString(),  now.toISOString(), 7);
  const drr15Map = await fetchSaleOrderDRR(d15.toISOString(), now.toISOString(), 15);
  const drr30Map = await fetchSaleOrderDRR(d30.toISOString(), now.toISOString(), 30);

  // Step 6: Build final inventory array
  const skuMap = new Map();
  invRows.forEach(r => {
    const sku = (r['Item SkuCode'] || r['Item SKU Code'] || '').trim();
    if (!sku) return;

    // Normalise and filter category
    const cat = normaliseCategory(r['Category Name'] || r['Category'] || '');
    if (!cat) return; // skip non-allowed categories

    const inv    = num(r['Inventory'] || 0);
    const drr7   = drr7Map[sku]  || 0;
    const drr15  = drr15Map[sku] || 0;
    const drr30  = drr30Map[sku] || 0;
    const drrMax = Math.max(drr7, drr15, drr30);

    // DOC = Inventory / DRR Max (0 if no sales)
    const doc = drrMax > 0 ? Math.round(inv / drrMax) : (inv > 0 ? 999 : 0);

    skuMap.set(sku, {
      sku,
      name:       (r['Item Type Name'] || sku).trim(),
      cat,
      drr7,
      drr15,
      drr30,
      drrMax,
      inv,
      invBlocked: num(r['Inventory Blocked'] || 0),
      invBad:     num(r['Bad Inventory']     || 0),
      openPO:     num(r['Open Purchase']     || 0),
      openSale:   num(r['Open Sale']         || 0),
      doc,
    });
  });

  return Array.from(skuMap.values());
}

/**
 * fetchPurchaseOrders
 * Purchase Orders export — last 60 days (UC max = 3 months)
 */
export async function fetchPurchaseOrders() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 60);

  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Purchase Orders',
    facilityCode:      FACILITY_CODE,
    startDateISO:      start.toISOString(),
    endDateISO:        now.toISOString(),
    dateFilterId:      'addedOn',
  });
  const jobCode = extractJobCode(jobRes);
  if (!jobCode) throw new Error('No jobCode from Purchase Orders export');

  const url  = await pollExport(jobCode);
  const rows = parseCSV(await fetchCSV(url));

  // Verified PO CSV columns (from live test)
  const PO_BY_SKU = {};
  rows.forEach(r => {
    const sku = (r['Item SkuCode'] || r['item_skucode'] || '').trim();
    if (!sku) return;
    if (!PO_BY_SKU[sku]) PO_BY_SKU[sku] = [];
    PO_BY_SKU[sku].push({
      po:        (r['PO Code']     || '—').trim(),
      vendor:    (r['Vendor Name'] || '—').trim(),
      poDate:    (r['Created']     || '—').split(' ')[0],
      delDate:   (r['Delivery Date'] || '—').split(' ')[0],
      ordered:   num(r['Order Quantity']    || 0),
      rcvd:      num(r['Recieved Quantity'] || 0),
      rejected:  num(r['Rejected Quantity'] || 0),
      pending:   num(r['Pending Quantity']  || 0),
      ageing:    num(r['PO Ageing (Days)']  || 0),
      unitPrice: num(r['Unit Price']        || 0),
      total:     num(r['Total']             || 0),
      status:    (r['Purchase Order Status'] || 'COMPLETE').toUpperCase().replace(/ /g, '_'),
      itemName:  (r['Item Type Name'] || sku).trim(),
      category:  (r['Category']       || '').trim(),
    });
  });
  return PO_BY_SKU;
}

/**
 * fetchGRN — last 30 days
 */
export async function fetchGRN() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);
  try {
    const jobRes  = await callTool('create_export_job', {
      exportJobTypeName: 'GRN',
      facilityCode:      FACILITY_CODE,
      startDateISO:      start.toISOString(),
      endDateISO:        now.toISOString(),
      dateFilterId:      'addedOn',
    });
    const jobCode = extractJobCode(jobRes);
    if (!jobCode) return [];
    const url = await pollExport(jobCode);
    return parseCSV(await fetchCSV(url));
  } catch { return []; }
}
