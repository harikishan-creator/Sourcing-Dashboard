/**
 * mcpClient.js — Server-side only (Vercel serverless)
 *
 * Based on Unicommerce MCP Usage Guide.
 * Flow: initialize → get mcp-session-id → call tools with that session ID
 * MCP_TOKEN = MCP_SECRET (our auth to the MCP server)
 * The MCP server handles UC OAuth internally via UC_USERNAME/UC_PASSWORD
 */

const MCP_URL       = process.env.MCP_URL           || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN     = process.env.MCP_TOKEN         || '';
const FACILITY_CODE = process.env.MCP_FACILITY_CODE || 'MSKT_FZP';

let _sessionId = null;

// ── SSE / JSON response parser ────────────────────────────────────────────────
function parseResponse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  // SSE format: "event: message\ndata: {...}\n\n"
  const dataLines = trimmed
    .split('\n')
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
    capabilities:    {},
    clientInfo:      { name: 'weekly-dashboard', version: '1.0.0' },
  });
}

// ── Tool caller ───────────────────────────────────────────────────────────────
async function callTool(name, args = {}) {
  return mcpPost('tools/call', { name, arguments: args });
}

// ── Extract text from MCP tool result ────────────────────────────────────────
function extractText(result) {
  if (!result) return '{}';
  if (typeof result === 'string') return result;
  if (Array.isArray(result.content)) {
    for (const b of result.content) if (b.type === 'text') return b.text;
  }
  return JSON.stringify(result);
}

function num(v) { const n = parseFloat(String(v||0).replace(/,/g,'')); return isNaN(n) ? 0 : n; }
function fmtDate(d) { return d ? String(d).split('T')[0].split(' ')[0] : '—'; }

// ── Parse CSV text → array of objects ────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n');
  if (lines.length < 2) return [];
  function parseLine(line) {
    const vals=[]; let cur='',inQ=false,i=0;
    while(i<line.length){
      const ch=line[i];
      if(ch==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i+=2;continue;}inQ=!inQ;}
      else if(ch===','&&!inQ){vals.push(cur);cur='';}
      else cur+=ch;
      i++;
    }
    vals.push(cur); return vals;
  }
  const headers=parseLine(lines[0]).map(h=>h.trim());
  return lines.slice(1).filter(l=>l.trim()).map(line=>{
    const vals=parseLine(line);
    const obj={};
    headers.forEach((h,i)=>{obj[h]=(vals[i]??'').trim();});
    return obj;
  });
}

// ── Poll export job until SUCCESSFUL ─────────────────────────────────────────
// Per docs: GET /get_export_job_status, poll every 5-10s, status → SUCCESSFUL|FAILED
async function pollExport(jobCode, maxWait = 55000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 6000)); // poll every 6s per docs
    const res  = await callTool('get_export_job_status', {
      jobCode,
      facilityCode: FACILITY_CODE,
    });
    const text   = extractText(res);
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = {}; }

    const st  = (parsed?.status || parsed?.jobStatus || '').toUpperCase();
    const url = parsed?.filePath || parsed?.downloadUrl || parsed?.fileUrl || '';

    // Accept both SUCCESSFUL and COMPLETE as done (Unicommerce uses COMPLETE)
    if ((st === 'SUCCESSFUL' || st === 'COMPLETE') && url) return url;
    if (st === 'FAILED') throw new Error(`Export job ${jobCode} failed: ${parsed?.message || ''}`);
    // QUEUED / PROCESSING — keep polling
  }
  throw new Error(`Export job ${jobCode} timed out after ${maxWait/1000}s`);
}

async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  return res.text();
}

function extractJobCode(text) {
  try {
    const j = JSON.parse(text);
    // Per docs response shape
    return j.jobCode || j.job_code || j.code || j.data?.jobCode || null;
  } catch {
    const m = text.match(/\b([A-Z0-9]{6,})\b/);
    return m ? m[0] : null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-LEVEL FETCHERS  (based on verified MCP tool signatures from docs)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fetchInventory
 * Uses create_export_job with exportJobTypeName="Inventory Snapshot"
 * Per docs: registered template — no exportColumns needed, no date filter
 */
export async function fetchInventory() {
  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Inventory Snapshot',
    facilityCode:      FACILITY_CODE,
  });
  const jobText = extractText(jobRes);
  const jobCode = extractJobCode(jobText);
  if (!jobCode) throw new Error(`No jobCode from Inventory Snapshot. Response: ${jobText.slice(0,300)}`);

  const csvUrl = await pollExport(jobCode);
  const rows   = parseCSV(await fetchCSV(csvUrl));

  const skuMap = new Map();
  rows.forEach(r => {
    const sku = (r['Item SkuCode'] || r['Item SKU Code'] || r['itemSkuCode'] || r['sku'] || '').trim();
    if (!sku) return;
    // Actual columns from Unicommerce Inventory Snapshot CSV:
    // Facility,Item Type Name,Item SkuCode,EAN,Category Name,MRP,Open Sale,
    // Inventory,Inventory Blocked,Bad Inventory,Putaway Pending,Open Purchase,...
    skuMap.set(sku, {
      sku,
      name:   (r['Item Type Name']  || r['name']     || sku).trim(),
      cat:    (r['Category Name']   || r['Category'] || r['category'] || 'Uncategorised').trim(),
      drr7:   num(r['Last 7 days DRR']  || r['drr7']  || 0),
      drr15:  num(r['Last 15 days DRR'] || r['drr15'] || 0),
      drr30:  num(r['Last 30 days DRR'] || r['drr30'] || 0),
      drrMax: num(r['DRR Max']          || r['drrMax'] || 0),
      inv:    num(r['Inventory'] || r['availableInventory'] || r['goodInventory'] || 0),
      invBlocked: num(r['Inventory Blocked'] || 0),
      invBad:     num(r['Bad Inventory']     || 0),
      openPO: num(r['Open Purchase'] || r['openPO'] || 0),
      openSale: num(r['Open Sale']   || 0),
      doc:    num(r['Days of Cover'] || r['daysOfCover'] || r['doc'] || 0),
    });
  });
  return Array.from(skuMap.values());
}

/**
 * fetchDRR
 * Uses create_sale_order_export with preset=sku_drr (per docs)
 * Returns last 30 days of DRR data
 */
export async function fetchDRR() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);

  const jobRes  = await callTool('create_sale_order_export', {
    startDate:    start.toISOString(),
    endDate:      now.toISOString(),
    preset:       'sku_drr',
    facilityCode: FACILITY_CODE,
  });
  const jobText = extractText(jobRes);
  const jobCode = extractJobCode(jobText);
  if (!jobCode) throw new Error(`No jobCode from DRR export. Response: ${jobText.slice(0,300)}`);

  const csvUrl = await pollExport(jobCode);
  return parseCSV(await fetchCSV(csvUrl));
}

/**
 * fetchPurchaseOrders
 * Uses search_purchase_orders (last 90 days) → get_purchase_order_details per PO
 * Per docs: search returns purchaseOrderCodes list
 */
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
      const detRes  = await callTool('get_purchase_order_details', {
        purchaseOrderCode: poCode,
        facilityCode:      FACILITY_CODE,
      });
      const det    = JSON.parse(extractText(detRes));
      const items  = det.purchaseOrderItems || det.items || [];
      const vendor = det.vendorName || det.vendor || '—';
      const status = (det.status || 'APPROVED').toUpperCase().replace(/ /g, '_');

      items.forEach(item => {
        const sku = (item.itemSKUCode || item.skuCode || item.sku || '').trim();
        if (!sku) return;
        if (!PO_BY_SKU[sku]) PO_BY_SKU[sku] = [];
        PO_BY_SKU[sku].push({
          po:       poCode,
          vendor,
          poDate:   fmtDate(det.created   || det.createdDate),
          delDate:  fmtDate(det.expectedDeliveryDate || det.deliveryDate),
          ordered:  num(item.quantity         || item.orderedQuantity || 0),
          rcvd:     num(item.receivedQuantity || item.grnQuantity     || 0),
          rejected: num(item.rejectedQuantity || 0),
          pending:  num(item.pendingQuantity  || 0),
          unitPrice:num(item.unitPrice        || 0),
          total:    num(item.total            || 0),
          status,
          itemName: (item.itemTypeName || sku).trim(),
          category: (item.category    || '').trim(),
        });
      });
    } catch { /* skip failed PO */ }
  }));
  return PO_BY_SKU;
}

/**
 * fetchGRN
 * Uses create_export_job with exportJobTypeName="GRN" (registered template)
 * Per docs: dateFilterId = "addedOn"
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
  const jobText = extractText(jobRes);
  const jobCode = extractJobCode(jobText);
  if (!jobCode) return [];

  try {
    const csvUrl = await pollExport(jobCode);
    return parseCSV(await fetchCSV(csvUrl));
  } catch { return []; }
}

/**
 * fetchPurchaseOrdersExport
 * Alternative: uses create_export_job with "Purchase Orders" (registered template)
 * Per docs: dateFilterId = "addedOn", returns full PO detail CSV
 */
export async function fetchPurchaseOrdersExport() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 60); // max 3 months per UC API

  const jobRes  = await callTool('create_export_job', {
    exportJobTypeName: 'Purchase Orders',
    facilityCode:      FACILITY_CODE,
    startDateISO:      start.toISOString(),
    endDateISO:        now.toISOString(),
    dateFilterId:      'addedOn',
  });
  const jobText = extractText(jobRes);
  const jobCode = extractJobCode(jobText);
  if (!jobCode) throw new Error(`No jobCode from Purchase Orders export. Response: ${jobText.slice(0,300)}`);

  const csvUrl = await pollExport(jobCode);
  const rows   = parseCSV(await fetchCSV(csvUrl));

  // Normalise to PO_BY_SKU map
  const PO_BY_SKU = {};
  rows.forEach(r => {
    const sku = (r['Item SkuCode'] || r['item_skucode'] || r['sku'] || '').trim();
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
      status:   (r['Purchase Order Status'] || 'APPROVED').toUpperCase().replace(/ /g,'_'),
      itemName: (r['Item Type Name'] || sku).trim(),
      category: (r['Category']       || '').trim(),
      facility: (r['Facility']       || '').trim(),
    });
  });
  return PO_BY_SKU;
}
