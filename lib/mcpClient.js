/**
 * mcpClient.js — Server-side only (Vercel serverless)
 * 
 * Protocol:
 *   1. POST initialize  → get mcp-session-id from response header
 *   2. POST tools/call  → include mcp-session-id header in every request
 * 
 * Each Vercel invocation is stateless — we initialize fresh every time.
 * The MCP_TOKEN is NEVER sent to the browser.
 */

const MCP_URL       = process.env.MCP_URL           || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN     = process.env.MCP_TOKEN         || '';
const FACILITY_CODE = process.env.MCP_FACILITY_CODE || 'MSKT_FZP';

// Session state — lives only for this lambda invocation
let _sessionId = null;

// ── SSE / JSON response parser ────────────────────────────────────────────────
function parseResponse(text) {
  const trimmed = text.trim();
  // Plain JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  // SSE: may contain "event: message\ndata: {...}" or just "data: {...}"
  const dataLines = trimmed
    .split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => l.slice(5).trim())
    .filter(l => l && l !== '[DONE]');

  if (!dataLines.length) throw new Error(`No data in response: ${text.slice(0, 200)}`);

  // Find the last line that is valid JSON with jsonrpc fields
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(dataLines[i]);
      if ('result' in obj || 'error' in obj || obj.jsonrpc) return obj;
    } catch { /* try previous */ }
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
}

// ── Core POST ────────────────────────────────────────────────────────────────
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

  // Always capture session ID if server sends one
  const sid = res.headers.get('mcp-session-id');
  if (sid) _sessionId = sid;

  const text = await res.text();
  let json;
  try {
    json = parseResponse(text);
  } catch (err) {
    throw new Error(`Parse error: ${err.message} | raw: ${text.slice(0, 300)}`);
  }

  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

// ── Initialize (fresh session per lambda invocation) ─────────────────────────
export async function init() {
  _sessionId = null; // reset so first call has no session header
  await mcpPost('initialize', {
    protocolVersion: '2024-11-05',
    capabilities:    {},
    clientInfo:      { name: 'weekly-dashboard', version: '1.0.0' },
  });
  // _sessionId is now set from the response header
}

// ── Tool caller ───────────────────────────────────────────────────────────────
async function callTool(name, args = {}) {
  return mcpPost('tools/call', { name, arguments: args });
}

// ── Poll export job until SUCCESSFUL ─────────────────────────────────────────
async function pollExport(jobCode, maxWait = 55000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const res = await callTool('get_export_job_status', { jobCode, facilityCode: FACILITY_CODE });
    const text = extractText(res);
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = {}; }

    const st  = parsed?.status || parsed?.jobStatus || '';
    const url = parsed?.filePath || parsed?.downloadUrl || parsed?.fileUrl || '';

    if (st === 'SUCCESSFUL' && url) return url;
    if (st === 'FAILED') throw new Error(`Export job ${jobCode} failed`);

    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Export job ${jobCode} timed out`);
}

// ── Download CSV ──────────────────────────────────────────────────────────────
async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  return res.text();
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];
  function parseLine(line) {
    const vals = []; let cur = '', inQ = false, i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i+=2; continue; } inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += ch;
      i++;
    }
    vals.push(cur);
    return vals;
  }
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

function extractText(result) {
  if (!result) return '{}';
  if (typeof result === 'string') return result;
  if (Array.isArray(result.content)) {
    for (const b of result.content) if (b.type === 'text') return b.text;
  }
  if (result.content?.[0]?.text) return result.content[0].text;
  return JSON.stringify(result);
}

function num(v) { const n = parseFloat(String(v||0).replace(/,/g,'')); return isNaN(n) ? 0 : n; }
function fmtDate(d) { return d ? String(d).split('T')[0].split(' ')[0] : '—'; }

function extractJobCode(text) {
  try {
    const j = JSON.parse(text);
    return j.jobCode || j.job_code || j.code || j.data?.jobCode || null;
  } catch {
    const m = text.match(/\b([A-Z0-9_-]{6,})\b/);
    return m ? m[0] : null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-LEVEL FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchInventory() {
  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Inventory Snapshot',
    facilityCode:      FACILITY_CODE,
  });
  const jobCode = extractJobCode(extractText(jobRes));
  if (!jobCode) throw new Error('No jobCode from Inventory Snapshot export');

  const csvUrl  = await pollExport(jobCode);
  const rows    = parseCSV(await fetchCSV(csvUrl));

  const skuMap = new Map();
  rows.forEach(r => {
    const sku = (r['Item SKU Code'] || r['itemSkuCode'] || r['sku'] || '').trim();
    if (!sku) return;
    skuMap.set(sku, {
      sku,
      name:   (r['Item Type Name']  || r['name']     || sku).trim(),
      cat:    (r['Category']        || r['category'] || 'Uncategorised').trim(),
      drr7:   num(r['Last 7 days DRR']  || r['drr7']  || 0),
      drr15:  num(r['Last 15 days DRR'] || r['drr15'] || 0),
      drr30:  num(r['Last 30 days DRR'] || r['drr30'] || 0),
      drrMax: num(r['DRR Max']          || r['drrMax'] || 0),
      inv:    num(r['Inventory']        || r['availableInventory'] || 0),
      openPO: num(r['Open Purchase']    || r['openPO'] || 0),
      doc:    num(r['Days of Cover']    || r['daysOfCover'] || r['doc'] || 0),
    });
  });
  return Array.from(skuMap.values());
}

export async function fetchPurchaseOrders() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 90);

  const searchRes  = await callTool('search_purchase_orders', {
    createdStart: start.toISOString(),
    createdEnd:   now.toISOString(),
  });
  const searchText = extractText(searchRes);
  let poCodes = [];
  try {
    const p = JSON.parse(searchText);
    poCodes = p.purchaseOrderCodes || p.codes || p.data || [];
  } catch { /* empty */ }

  if (!poCodes.length) return {};

  const PO_BY_SKU = {};
  await Promise.allSettled(poCodes.slice(0, 50).map(async poCode => {
    try {
      const detRes  = await callTool('get_purchase_order_details', { purchaseOrderCode: poCode, facilityCode: FACILITY_CODE });
      const det     = JSON.parse(extractText(detRes));
      const items   = det.purchaseOrderItems || det.items || [];
      const vendor  = det.vendorName || det.vendor || '—';
      const created = fmtDate(det.created || det.createdDate);
      const delDate = fmtDate(det.expectedDeliveryDate || det.deliveryDate);
      const status  = (det.status || 'APPROVED').toUpperCase().replace(/ /g, '_');
      items.forEach(item => {
        const sku = (item.itemSKUCode || item.skuCode || item.sku || '').trim();
        if (!sku) return;
        if (!PO_BY_SKU[sku]) PO_BY_SKU[sku] = [];
        PO_BY_SKU[sku].push({
          po: poCode, vendor, poDate: created, delDate,
          ordered:  num(item.quantity || item.orderedQuantity || 0),
          rcvd:     num(item.receivedQuantity || item.grnQuantity || 0),
          pending:  num(item.pendingQuantity  || 0),
          status, itemName: (item.itemTypeName || sku).trim(),
        });
      });
    } catch { /* skip failed PO */ }
  }));
  return PO_BY_SKU;
}

export async function fetchGRN() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);

  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Astrotalk GRN',
    facilityCode:      FACILITY_CODE,
    startDateISO:      start.toISOString(),
    endDateISO:        now.toISOString(),
    dateFilterId:      'addedOn',
  });
  const jobCode = extractJobCode(extractText(jobRes));
  if (!jobCode) return [];

  try {
    const csvUrl = await pollExport(jobCode);
    return parseCSV(await fetchCSV(csvUrl));
  } catch { return []; }
}
