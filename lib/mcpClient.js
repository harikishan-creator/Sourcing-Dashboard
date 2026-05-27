/**
 * mcpClient.js — Server-side only (Vercel serverless)
 * Fixed based on live API testing:
 * - Status is "COMPLETE" not "SUCCESSFUL"
 * - Inventory Snapshot has no DRR — fetched from Sale Orders export
 * - DRR calculated from raw order rows (count per SKU / days)
 * - Category filter: Bracelets and Pendants, Crystals, Frame, Murti, Vastu
 * - Category names normalised to remove duplicates
 */

const MCP_URL       = process.env.MCP_URL           || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN     = process.env.MCP_TOKEN         || '';
const FACILITY_CODE = process.env.MCP_FACILITY_CODE || 'MSKT_FZP';

// Only show these 5 categories (normalised lowercase match)
const ALLOWED_CATEGORIES = [
  'bracelets and pendants',
  'bracelets & pendants',
  'crystals',
  'frame',
  'murti',
  'vastu',
];

// Normalise category name — merge variants
function normaliseCategory(raw) {
  const s = (raw || '').trim().toLowerCase();
  if (s === 'bracelets & pendants' || s === 'bracelets and pendants') return 'Bracelets and Pendants';
  if (s === 'crystals') return 'Crystals';
  if (s === 'frame') return 'Frame';
  if (s === 'murti') return 'Murti';
  if (s === 'vastu') return 'Vastu';
  return null; // not in allowed list
}

let _sessionId = null;

// ── SSE / JSON response parser ────────────────────────────────────────────────
function parseResponse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  const dataLines = trimmed.split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => l.slice(5).trim())
    .filter(l => l && l !== '[DONE]');
  if (!dataLines.length) throw new Error(`No data in response: ${text.slice(0, 200)}`);
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
  catch (err) { throw new Error(`Parse error: ${err.message} | raw: ${text.slice(0, 300)}`); }
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

// ── Initialize session ────────────────────────────────────────────────────────
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

// ── Poll export job — accepts COMPLETE or SUCCESSFUL ──────────────────────────
async function pollExport(jobCode, maxWait = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 8000));
    const res    = await callTool('get_export_job_status', { jobCode, facilityCode: FACILITY_CODE });
    const text   = extractText(res);
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = {}; }
    const st  = (parsed?.status || '').toUpperCase();
    const url = parsed?.filePath || '';
    if ((st === 'COMPLETE' || st === 'SUCCESSFUL') && url) return url;
    if (st === 'FAILED') throw new Error(`Export job ${jobCode} failed`);
  }
  throw new Error(`Export job ${jobCode} timed out`);
}

async function fetchCSVFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  return res.text();
}

function extractJobCode(text) {
  try {
    const j = JSON.parse(text);
    return j.jobCode || j.job_code || j.code || null;
  } catch {
    const m = text.match(/"jobCode":\s*"([^"]+)"/);
    return m ? m[1] : null;
  }
}

// ── Calculate DRR from raw order rows ────────────────────────────────────────
// Orders CSV has one row per order item with SKU and date
// DRR = total orders for SKU / number of days in range
function calcDRRFromOrders(rows, days) {
  const counts = {};
  rows.forEach(r => {
    const sku = (r['Item SKU Code'] || r['Item SkuCode'] || '').trim();
    if (!sku) return;
    counts[sku] = (counts[sku] || 0) + 1;
  });
  const drr = {};
  Object.entries(counts).forEach(([sku, total]) => {
    drr[sku] = Math.round((total / days) * 10) / 10; // 1 decimal
  });
  return drr;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-LEVEL FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fetchInventory
 * 1. Get Inventory Snapshot (stock levels)
 * 2. Get Sale Order exports for last 7, 15, 30 days (DRR calculation)
 * 3. Merge: DOC = Inventory / DRR Max
 * 4. Filter to allowed categories only
 * 5. Normalise category names
 */
export async function fetchInventory() {
  const now = new Date();

  // Dates for DRR windows
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d15 = new Date(now); d15.setDate(d15.getDate() - 15);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);

  // Step 1: Trigger all 4 export jobs in parallel
  const [invJobRes, drr7JobRes, drr15JobRes, drr30JobRes] = await Promise.all([
    callTool('create_export_job', {
      exportJobTypeName: 'Inventory Snapshot',
      facilityCode: FACILITY_CODE,
    }),
    callTool('create_sale_order_export', {
      startDate: d7.toISOString(), endDate: now.toISOString(),
      preset: 'sku_drr', facilityCode: FACILITY_CODE,
    }),
    callTool('create_sale_order_export', {
      startDate: d15.toISOString(), endDate: now.toISOString(),
      preset: 'sku_drr', facilityCode: FACILITY_CODE,
    }),
    callTool('create_sale_order_export', {
      startDate: d30.toISOString(), endDate: now.toISOString(),
      preset: 'sku_drr', facilityCode: FACILITY_CODE,
    }),
  ]);

  const invJobCode  = extractJobCode(extractText(invJobRes));
  const drr7Code    = extractJobCode(extractText(drr7JobRes));
  const drr15Code   = extractJobCode(extractText(drr15JobRes));
  const drr30Code   = extractJobCode(extractText(drr30JobRes));

  if (!invJobCode) throw new Error('No jobCode from Inventory Snapshot');

  // Step 2: Poll all jobs (sequential to avoid session conflicts)
  const invUrl  = await pollExport(invJobCode);
  const drr7Url  = drr7Code  ? await pollExport(drr7Code)  : null;
  const drr15Url = drr15Code ? await pollExport(drr15Code) : null;
  const drr30Url = drr30Code ? await pollExport(drr30Code) : null;

  // Step 3: Download and parse CSVs
  const [invRows, drr7Rows, drr15Rows, drr30Rows] = await Promise.all([
    fetchCSVFromUrl(invUrl).then(parseCSV),
    drr7Url  ? fetchCSVFromUrl(drr7Url).then(parseCSV)  : Promise.resolve([]),
    drr15Url ? fetchCSVFromUrl(drr15Url).then(parseCSV) : Promise.resolve([]),
    drr30Url ? fetchCSVFromUrl(drr30Url).then(parseCSV) : Promise.resolve([]),
  ]);

  // Step 4: Calculate DRR maps
  const drr7Map  = calcDRRFromOrders(drr7Rows,  7);
  const drr15Map = calcDRRFromOrders(drr15Rows, 15);
  const drr30Map = calcDRRFromOrders(drr30Rows, 30);

  // Step 5: Build inventory map with DOC calculated
  const skuMap = new Map();
  invRows.forEach(r => {
    const sku = (r['Item SkuCode'] || r['Item SKU Code'] || '').trim();
    if (!sku) return;

    const rawCat = r['Category Name'] || r['Category'] || '';
    const cat    = normaliseCategory(rawCat);
    if (!cat) return; // skip categories not in allowed list

    const inv    = num(r['Inventory'] || 0);
    const drr7   = drr7Map[sku]  || 0;
    const drr15  = drr15Map[sku] || 0;
    const drr30  = drr30Map[sku] || 0;
    const drrMax = Math.max(drr7, drr15, drr30);
    const doc    = drrMax > 0 ? Math.round(inv / drrMax) : 0;

    skuMap.set(sku, {
      sku,
      name:    (r['Item Type Name'] || sku).trim(),
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
 * Uses Purchase Orders export (last 60 days, max 3 months per UC API)
 * Returns PO_BY_SKU map
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
  const jobCode = extractJobCode(extractText(jobRes));
  if (!jobCode) throw new Error('No jobCode from Purchase Orders export');

  const csvUrl = await pollExport(jobCode);
  const rows   = parseCSV(await fetchCSVFromUrl(csvUrl));

  // Actual PO CSV columns (verified):
  // PO Code, Created, Delivery Date, Item Type Name, Item SkuCode, Category,
  // Vendor Name, Order Quantity, Recieved Quantity, Rejected Quantity,
  // Pending Quantity, PO Ageing (Days), Unit Price, Total, Purchase Order Status
  const PO_BY_SKU = {};
  rows.forEach(r => {
    const sku = (r['Item SkuCode'] || r['item_skucode'] || '').trim();
    if (!sku) return;
    if (!PO_BY_SKU[sku]) PO_BY_SKU[sku] = [];
    PO_BY_SKU[sku].push({
      po:       (r['PO Code']     || '—').trim(),
      vendor:   (r['Vendor Name'] || '—').trim(),
      poDate:   (r['Created']     || '—').split(' ')[0],
      delDate:  (r['Delivery Date'] || '—').split(' ')[0],
      ordered:  num(r['Order Quantity']    || 0),
      rcvd:     num(r['Recieved Quantity'] || 0),
      rejected: num(r['Rejected Quantity'] || 0),
      pending:  num(r['Pending Quantity']  || 0),
      ageing:   num(r['PO Ageing (Days)']  || 0),
      unitPrice:num(r['Unit Price']        || 0),
      total:    num(r['Total']             || 0),
      status:   (r['Purchase Order Status'] || 'COMPLETE').toUpperCase().replace(/ /g, '_'),
      itemName: (r['Item Type Name'] || sku).trim(),
      category: (r['Category']       || '').trim(),
    });
  });
  return PO_BY_SKU;
}

/**
 * fetchGRN
 * GRN export last 30 days
 */
export async function fetchGRN() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);

  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'GRN',
    facilityCode:      FACILITY_CODE,
    startDateISO:      start.toISOString(),
    endDateISO:        now.toISOString(),
    dateFilterId:      'addedOn',
  });
  const jobCode = extractJobCode(extractText(jobRes));
  if (!jobCode) return [];
  try {
    const csvUrl = await pollExport(jobCode);
    return parseCSV(await fetchCSVFromUrl(csvUrl));
  } catch { return []; }
}
