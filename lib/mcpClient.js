/**
 * mcpClient.js — Server-side only (Vercel serverless)
 * Verified against live API 27-May-2026
 *
 * Facilities: astrotalk, MSKT_FZP, Emiza_MMB, AT_global
 * Categories (exact from live data):
 *   "Bracelets & Pendants" / "Bracelets and Pendants" → "Bracelets and Pendants"
 *   "Crystal"  → "Crystals"
 *   "Frame"    → "Frame"
 *   "Murti "   → "Murti"  (trailing space in UC)
 *   "Vastu"    → "Vastu"
 *
 * DRR formula (per user spec):
 *   DRR 7d  = total units sold last 7 days  / 7
 *   DRR 15d = total units sold last 15 days / 15
 *   DRR 30d = total units sold last 30 days / 30
 *   DRR Max = max(drr7, drr15, drr30)
 *   DOC     = Inventory / DRR Max
 */

const MCP_URL = process.env.MCP_URL || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN = process.env.MCP_TOKEN || '';

// 4 facilities to aggregate
const FACILITIES = ['astrotalk', 'MSKT_FZP', 'Emiza_MMB', 'AT_global'];

// Exact category names found in live CSV data → normalised display name
function normaliseCategory(raw) {
  const s = (raw || '').trim().toLowerCase();
  if (s === 'bracelets & pendants' || s === 'bracelets and pendants') return 'Bracelets and Pendants';
  if (s === 'crystal' || s === 'crystals') return 'Crystals';
  if (s === 'frame') return 'Frame';
  if (s === 'murti') return 'Murti';
  if (s === 'vastu') return 'Vastu';
  return null; // skip all other categories
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
  if (!dataLines.length) throw new Error(`No SSE data: ${text.slice(0, 200)}`);
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(dataLines[i]);
      if ('result' in obj || 'error' in obj) return obj;
    } catch { /* try previous */ }
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
}

// ── Core POST ─────────────────────────────────────────────────────────────────
async function mcpPost(method, params = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
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

// Verified regex: 24-hex + '-' + 32-hex
function extractJobCode(result) {
  const text = extractText(result);
  try { const j = JSON.parse(text); if (j.jobCode) return j.jobCode; } catch {}
  const m = text.match(/[a-f0-9]{24}-[a-f0-9]{32}/);
  return m ? m[0] : null;
}

function num(v) {
  const n = parseFloat(String(v || 0).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

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

// ── Poll export job ───────────────────────────────────────────────────────────
async function pollExport(jobCode, facilityCode, maxWait = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 8000));
    const res  = await callTool('get_export_job_status', { jobCode, facilityCode });
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

// ── DRR from sale order rows ──────────────────────────────────────────────────
// Each row = 1 unit sold. DRR = total rows for SKU / days
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

// Trigger sale export for ONE facility and return DRR map
async function fetchDRRForFacility(facilityCode, startDate, endDate, days) {
  try {
    const jobRes  = await callTool('create_sale_order_export', {
      startDate, endDate,
      preset: 'sku_drr',
      facilityCode,
    });
    const jobCode = extractJobCode(jobRes);
    if (!jobCode) return {};
    const url  = await pollExport(jobCode, facilityCode);
    const rows = parseCSV(await fetchCSV(url));
    return calcDRR(rows, days);
  } catch (e) {
    console.error(`DRR fetch failed for ${facilityCode}:`, e.message);
    return {};
  }
}

// Merge DRR maps from multiple facilities (sum counts)
function mergeDRRMaps(...maps) {
  const merged = {};
  maps.forEach(map => {
    Object.entries(map).forEach(([sku, val]) => {
      merged[sku] = (merged[sku] || 0) + val;
    });
  });
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIGH-LEVEL FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fetchInventory
 * 1. Fetch Inventory Snapshot for all 4 facilities (sequential)
 * 2. Fetch DRR 7d, 15d, 30d for all 4 facilities (sequential)
 * 3. Merge inventory by SKU, sum inventory across facilities
 * 4. Calculate: DRR Max = max(7d,15d,30d), DOC = Inventory / DRR Max
 * 5. Filter to 5 allowed categories, normalise names
 */
export async function fetchInventory() {
  const now = new Date();
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d15 = new Date(now); d15.setDate(d15.getDate() - 15);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);

  const nowISO = now.toISOString();
  const d7ISO  = d7.toISOString();
  const d15ISO = d15.toISOString();
  const d30ISO = d30.toISOString();

  // ── Step 1: Inventory Snapshot per facility (sequential) ──
  const invByFacility = {};
  for (const fac of FACILITIES) {
    try {
      const jobRes  = await callTool('create_export_job', {
        exportJobTypeName: 'Inventory Snapshot',
        facilityCode: fac,
      });
      const jobCode = extractJobCode(jobRes);
      if (!jobCode) continue;
      const url  = await pollExport(jobCode, fac);
      const rows = parseCSV(await fetchCSV(url));
      invByFacility[fac] = rows;
    } catch (e) {
      console.error(`Inventory fetch failed for ${fac}:`, e.message);
      invByFacility[fac] = [];
    }
  }

  // ── Step 2: DRR per facility, per window (sequential) ──
  const drr7Maps  = {};
  const drr15Maps = {};
  const drr30Maps = {};

  for (const fac of FACILITIES) {
    drr7Maps[fac]  = await fetchDRRForFacility(fac, d7ISO,  nowISO, 7);
    drr15Maps[fac] = await fetchDRRForFacility(fac, d15ISO, nowISO, 15);
    drr30Maps[fac] = await fetchDRRForFacility(fac, d30ISO, nowISO, 30);
  }

  // ── Step 3: Merge DRR across all facilities ──
  const drr7Map  = mergeDRRMaps(...Object.values(drr7Maps));
  const drr15Map = mergeDRRMaps(...Object.values(drr15Maps));
  const drr30Map = mergeDRRMaps(...Object.values(drr30Maps));

  // ── Step 4: Build SKU map — aggregate inventory across facilities ──
  // Use MSKT_FZP as the category/name source (most complete)
  const skuMap = new Map();

  for (const [fac, rows] of Object.entries(invByFacility)) {
    rows.forEach(r => {
      const sku = (r['Item SkuCode'] || r['Item SKU Code'] || '').trim();
      if (!sku) return;

      const cat = normaliseCategory(r['Category Name'] || r['Category'] || '');
      if (!cat) return; // skip non-allowed categories

      const inv = num(r['Inventory'] || 0);

      if (skuMap.has(sku)) {
        // Add inventory from this facility to existing entry
        const existing = skuMap.get(sku);
        existing.inv        += inv;
        existing.invBlocked += num(r['Inventory Blocked'] || 0);
        existing.invBad     += num(r['Bad Inventory']     || 0);
        existing.openPO     += num(r['Open Purchase']     || 0);
        existing.openSale   += num(r['Open Sale']         || 0);
      } else {
        skuMap.set(sku, {
          sku,
          name:       (r['Item Type Name'] || sku).trim(),
          cat,
          inv,
          invBlocked: num(r['Inventory Blocked'] || 0),
          invBad:     num(r['Bad Inventory']     || 0),
          openPO:     num(r['Open Purchase']     || 0),
          openSale:   num(r['Open Sale']         || 0),
          drr7:   0, drr15: 0, drr30: 0, drrMax: 0, doc: 0,
        });
      }
    });
  }

  // ── Step 5: Attach DRR and calculate DOC ──
  skuMap.forEach((item, sku) => {
    const drr7   = drr7Map[sku]  || 0;
    const drr15  = drr15Map[sku] || 0;
    const drr30  = drr30Map[sku] || 0;
    const drrMax = Math.max(drr7, drr15, drr30);
    // DOC = Inventory / DRR Max
    // If no sales history: DOC = 999 (infinite cover)
    const doc = drrMax > 0 ? Math.round(item.inv / drrMax) : (item.inv > 0 ? 999 : 0);

    item.drr7   = drr7;
    item.drr15  = drr15;
    item.drr30  = drr30;
    item.drrMax = drrMax;
    item.doc    = doc;
  });

  return Array.from(skuMap.values());
}

/**
 * fetchPurchaseOrders
 * PO export for all 4 facilities, last 60 days
 * Returns combined PO_BY_SKU map
 */
export async function fetchPurchaseOrders() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 60);
  const startISO = start.toISOString();
  const nowISO   = now.toISOString();

  const PO_BY_SKU = {};

  for (const fac of FACILITIES) {
    try {
      const jobRes  = await callTool('create_export_job', {
        exportJobTypeName: 'Purchase Orders',
        facilityCode:      fac,
        startDateISO:      startISO,
        endDateISO:        nowISO,
        dateFilterId:      'addedOn',
      });
      const jobCode = extractJobCode(jobRes);
      if (!jobCode) continue;

      const url  = await pollExport(jobCode, fac);
      const rows = parseCSV(await fetchCSV(url));

      rows.forEach(r => {
        const sku = (r['Item SkuCode'] || r['item_skucode'] || '').trim();
        if (!sku) return;
        if (!PO_BY_SKU[sku]) PO_BY_SKU[sku] = [];
        PO_BY_SKU[sku].push({
          po:        (r['PO Code']     || '—').trim(),
          vendor:    (r['Vendor Name'] || '—').trim(),
          poDate:    (r['Created']     || '—').split(' ')[0],
          delDate:   (r['Delivery Date'] || '—').split(' ')[0],
          ordered:   num(r['Order Quantity']     || 0),
          rcvd:      num(r['Recieved Quantity']  || 0),
          rejected:  num(r['Rejected Quantity']  || 0),
          pending:   num(r['Pending Quantity']   || 0),
          ageing:    num(r['PO Ageing (Days)']   || 0),
          unitPrice: num(r['Unit Price']         || 0),
          total:     num(r['Total']              || 0),
          status:    (r['Purchase Order Status'] || 'COMPLETE').toUpperCase().replace(/ /g, '_'),
          itemName:  (r['Item Type Name'] || sku).trim(),
          category:  (r['Category']       || '').trim(),
          facility:  fac,
        });
      });
    } catch (e) {
      console.error(`PO fetch failed for ${fac}:`, e.message);
    }
  }

  return PO_BY_SKU;
}

/**
 * fetchGRN — last 30 days across all facilities
 */
export async function fetchGRN() {
  const now   = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);
  const allRows = [];

  for (const fac of FACILITIES) {
    try {
      const jobRes  = await callTool('create_export_job', {
        exportJobTypeName: 'GRN',
        facilityCode:      fac,
        startDateISO:      start.toISOString(),
        endDateISO:        now.toISOString(),
        dateFilterId:      'addedOn',
      });
      const jobCode = extractJobCode(jobRes);
      if (!jobCode) continue;
      const url  = await pollExport(jobCode, fac);
      const rows = parseCSV(await fetchCSV(url));
      allRows.push(...rows);
    } catch { /* skip facility */ }
  }

  return allRows;
}
