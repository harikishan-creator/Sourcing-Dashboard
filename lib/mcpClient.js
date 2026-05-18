/**
 * mcpClient.js
 * Server-side only — runs in Vercel serverless functions.
 * The MCP_TOKEN is NEVER sent to the browser.
 */

const MCP_URL          = process.env.MCP_URL           || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN        = process.env.MCP_TOKEN         || '';
const FACILITY_CODE    = process.env.MCP_FACILITY_CODE || 'MSKT_FZP';

let _sessionId = null;   // reused within the same lambda invocation

// ── Core JSON-RPC caller ──────────────────────────────────────────────────────
async function mcpCall(method, params = {}) {
  const headers = {
    'Content-Type':  'application/json',
    'Accept':        'application/json, text/event-stream',
    'Authorization': `Bearer ${MCP_TOKEN}`,
  };
  if (_sessionId) headers['mcp-session-id'] = _sessionId;

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id:      Date.now(),
    method,
    params,
  });

  const res = await fetch(MCP_URL, { method: 'POST', headers, body });

  // Capture / refresh session ID
  const sid = res.headers.get('mcp-session-id');
  if (sid) _sessionId = sid;

  const text = await res.text();

  // Parse SSE or plain JSON response
  // SSE format can be:
  //   event: message\ndata: {...}\n\n
  //   data: {...}\n\n
  // Plain JSON: {...}
  let json;
  try {
    // Try plain JSON first
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      json = JSON.parse(trimmed);
    } else {
      // SSE format — extract all data: lines, pick last one with valid JSON
      const dataLines = text
        .split('\n')
        .filter(l => l.startsWith('data:'))
        .map(l => l.replace(/^data:\s*/, '').trim())
        .filter(l => l && l !== '[DONE]');

      if (!dataLines.length) throw new Error(`No data in SSE response: ${text.slice(0, 200)}`);

      // Find last line that parses as JSON containing jsonrpc result
      let parsed = null;
      for (let i = dataLines.length - 1; i >= 0; i--) {
        try {
          const candidate = JSON.parse(dataLines[i]);
          if (candidate.result !== undefined || candidate.error !== undefined || candidate.jsonrpc) {
            parsed = candidate;
            break;
          }
        } catch { /* try next */ }
      }
      if (!parsed) parsed = JSON.parse(dataLines[dataLines.length - 1]);
      json = parsed;
    }
  } catch (err) {
    throw new Error(`Failed to parse MCP response: ${err.message} — raw: ${text.slice(0, 300)}`);
  }

  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

// ── Initialize session ────────────────────────────────────────────────────────
async function init() {
  return mcpCall('initialize', {
    protocolVersion: '2024-11-05',
    capabilities:    {},
    clientInfo:      { name: 'weekly-dashboard', version: '1.0.0' },
  });
}

// ── Tool caller ───────────────────────────────────────────────────────────────
async function callTool(name, args = {}) {
  return mcpCall('tools/call', { name, arguments: args });
}

// ── Poll export job until SUCCESSFUL ─────────────────────────────────────────
async function pollExport(jobCode, maxWait = 60000) {
  const start    = Date.now();
  const interval = 5000;
  while (Date.now() - start < maxWait) {
    const res    = await callTool('get_export_job_status', { jobCode, facilityCode: FACILITY_CODE });
    const status = extractText(res);
    let parsed;
    try { parsed = JSON.parse(status); } catch { parsed = status; }

    const st  = parsed?.status || parsed?.jobStatus || '';
    const url = parsed?.filePath || parsed?.downloadUrl || '';

    if (st === 'SUCCESSFUL' && url) return url;
    if (st === 'FAILED') throw new Error(`Export job ${jobCode} failed`);

    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Export job ${jobCode} timed out after ${maxWait / 1000}s`);
}

// ── Download CSV from signed URL ──────────────────────────────────────────────
async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  return res.text();
}

// ── Parse CSV text → array of objects ────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  function parseLine(line) {
    const vals = [];
    let cur = '', inQ = false, i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i += 2; continue; }
        inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        vals.push(cur); cur = '';
      } else cur += ch;
      i++;
    }
    vals.push(cur);
    return vals;
  }

  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] !== undefined ? vals[i] : '').trim(); });
    return obj;
  });
}

function extractText(result) {
  if (!result) return '{}';
  if (typeof result === 'string') return result;
  if (result.content) {
    for (const b of result.content) {
      if (b.type === 'text') return b.text;
    }
  }
  return JSON.stringify(result);
}

function num(v) {
  const n = parseFloat(String(v || 0).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

function fmtDate(d) { return d ? String(d).split('T')[0].split(' ')[0] : '—'; }

// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-LEVEL DATA FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fetchInventory
 * Uses "Inventory Snapshot" export → returns INV array for the dashboard
 */
export async function fetchInventory() {
  await init();

  // Trigger export
  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Inventory Snapshot',
    facilityCode:      FACILITY_CODE,
  });
  const jobText = extractText(jobRes);
  let jobCode;
  try {
    const j = JSON.parse(jobText);
    jobCode = j.jobCode || j.job_code || j.code;
  } catch {
    const m = jobText.match(/[A-Z0-9_-]{6,}/);
    jobCode = m ? m[0] : null;
  }
  if (!jobCode) throw new Error('No jobCode returned from Inventory Snapshot export');

  const csvUrl  = await pollExport(jobCode);
  const csvText = await fetchCSV(csvUrl);
  const rows    = parseCSV(csvText);

  // Normalise to dashboard shape
  const skuMap = new Map();
  rows.forEach(r => {
    const sku = (r['Item SKU Code'] || r['itemSkuCode'] || r['sku'] || '').trim();
    if (!sku) return;
    skuMap.set(sku, {
      sku,
      name:   (r['Item Type Name'] || r['itemTypeName'] || r['name'] || sku).trim(),
      cat:    (r['Category'] || r['category'] || 'Uncategorised').trim(),
      drr7:   num(r['Last 7 days DRR']  || r['drr7']  || 0),
      drr15:  num(r['Last 15 days DRR'] || r['drr15'] || 0),
      drr30:  num(r['Last 30 days DRR'] || r['drr30'] || 0),
      drrMax: num(r['DRR Max']          || r['drrMax'] || 0),
      inv:    num(r['Inventory']        || r['availableInventory'] || r['inventory'] || 0),
      openPO: num(r['Open Purchase']    || r['openPO'] || 0),
      doc:    num(r['Days of Cover']    || r['daysOfCover'] || r['doc'] || 0),
    });
  });
  return Array.from(skuMap.values());
}

/**
 * fetchDRR
 * Uses "Sale Orders" export with sku_drr preset (last 30 days)
 * Merges DRR values into existing inventory array
 */
export async function fetchDRR() {
  await init();

  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);

  const jobRes  = await callTool('create_sale_order_export', {
    startDate:    start.toISOString(),
    endDate:      now.toISOString(),
    preset:       'sku_drr',
    facilityCode: FACILITY_CODE,
  });
  const jobText = extractText(jobRes);
  let jobCode;
  try {
    const j = JSON.parse(jobText);
    jobCode = j.jobCode || j.job_code || j.code;
  } catch {
    const m = jobText.match(/[A-Z0-9_-]{6,}/);
    jobCode = m ? m[0] : null;
  }
  if (!jobCode) throw new Error('No jobCode from DRR export');

  const csvUrl  = await pollExport(jobCode);
  const csvText = await fetchCSV(csvUrl);
  return parseCSV(csvText);
}

/**
 * fetchPurchaseOrders
 * Searches last 90 days of POs then fetches details for each
 */
export async function fetchPurchaseOrders() {
  await init();

  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 90);

  const searchRes  = await callTool('search_purchase_orders', {
    createdStart: start.toISOString(),
    createdEnd:   now.toISOString(),
  });
  const searchText = extractText(searchRes);
  let poCodes = [];
  try {
    const parsed = JSON.parse(searchText);
    poCodes = parsed.purchaseOrderCodes || parsed.codes || parsed.data || [];
  } catch { /* empty */ }

  if (!poCodes.length) return {};

  // Fetch details for each PO (cap at 50 to avoid timeout)
  const limited = poCodes.slice(0, 50);
  const PO_BY_SKU = {};

  await Promise.allSettled(limited.map(async (poCode) => {
    try {
      const detRes  = await callTool('get_purchase_order_details', {
        purchaseOrderCode: poCode,
        facilityCode:      FACILITY_CODE,
      });
      const detText = extractText(detRes);
      const det     = JSON.parse(detText);
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
          po:       poCode,
          vendor,
          poDate:   created,
          delDate,
          ordered:  num(item.quantity || item.orderedQuantity || 0),
          rcvd:     num(item.receivedQuantity || item.grnQuantity || 0),
          pending:  num(item.pendingQuantity  || item.quantity - (item.receivedQuantity || 0) || 0),
          status,
          itemName: (item.itemTypeName || sku).trim(),
        });
      });
    } catch { /* skip failed PO */ }
  }));

  return PO_BY_SKU;
}

/**
 * fetchGRN
 * Uses "Astrotalk GRN" export for last 30 days
 */
export async function fetchGRN() {
  await init();

  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);

  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Astrotalk GRN',
    facilityCode:      FACILITY_CODE,
    startDateISO:      start.toISOString(),
    endDateISO:        now.toISOString(),
    dateFilterId:      'addedOn',
  });
  const jobText = extractText(jobRes);
  let jobCode;
  try {
    const j = JSON.parse(jobText);
    jobCode = j.jobCode || j.job_code || j.code;
  } catch {
    const m = jobText.match(/[A-Z0-9_-]{6,}/);
    jobCode = m ? m[0] : null;
  }
  if (!jobCode) return [];

  const csvUrl  = await pollExport(jobCode);
  const csvText = await fetchCSV(csvUrl);
  return parseCSV(csvText);
}
