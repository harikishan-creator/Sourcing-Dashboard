/**
 * mcpClient.js — Server-side only
 * Redesigned for short-timeout serverless (Vercel Hobby = 10s)
 * Each exported function does ONE fast operation only
 */

const MCP_URL   = process.env.MCP_URL   || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN = process.env.MCP_TOKEN || '';

const FACILITIES = ['astrotalk', 'MSKT_FZP', 'Emiza_MMB', 'AT_global'];

let _sessionId = null;

function parseResponse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
  const dataLines = trimmed.split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => l.slice(5).trim())
    .filter(l => l && l !== '[DONE]');
  if (!dataLines.length) throw new Error(`No SSE data: ${text.slice(0, 200)}`);
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try { const obj = JSON.parse(dataLines[i]); if ('result' in obj || 'error' in obj) return obj; } catch {}
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
}

async function mcpPost(method, params = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': `Bearer ${MCP_TOKEN}`,
  };
  if (_sessionId) headers['mcp-session-id'] = _sessionId;
  const res = await fetch(MCP_URL, {
    method: 'POST', headers,
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
    protocolVersion: '2024-11-05', capabilities: {},
    clientInfo: { name: 'weekly-dashboard', version: '1.0.0' },
  });
}

function extractJobCode(result) {
  const text = typeof result === 'string' ? result :
    (result?.content?.[0]?.text || JSON.stringify(result));
  try { const j = JSON.parse(text); if (j.jobCode) return j.jobCode; } catch {}
  const m = text.match(/[a-f0-9]{24}-[a-f0-9]{32}/);
  return m ? m[0] : null;
}

function num(v) { const n = parseFloat(String(v || 0).replace(/,/g, '')); return isNaN(n) ? 0 : n; }

export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];
  function parseLine(line) {
    const vals = []; let cur = '', inQ = false, i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i += 2; continue; } inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += ch; i++;
    }
    vals.push(cur); return vals;
  }
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseLine(line); const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

// ── TRIGGER: start one export job, return jobCode immediately ─────────────────
export async function triggerJob(type, facility) {
  const now   = new Date();
  const d7    = new Date(now); d7.setDate(d7.getDate() - 7);
  const d15   = new Date(now); d15.setDate(d15.getDate() - 15);
  const d30   = new Date(now); d30.setDate(d30.getDate() - 30);
  const start60 = new Date(now); start60.setDate(start60.getDate() - 60);

  let result;
  if (type === 'inventory') {
    result = await mcpPost('tools/call', { name: 'create_export_job', arguments: {
      exportJobTypeName: 'Inventory Snapshot', facilityCode: facility,
    }});
  } else if (type === 'drr7') {
    result = await mcpPost('tools/call', { name: 'create_sale_order_export', arguments: {
      startDate: d7.toISOString(), endDate: now.toISOString(),
      preset: 'sku_drr', facilityCode: facility,
    }});
  } else if (type === 'drr15') {
    result = await mcpPost('tools/call', { name: 'create_sale_order_export', arguments: {
      startDate: d15.toISOString(), endDate: now.toISOString(),
      preset: 'sku_drr', facilityCode: facility,
    }});
  } else if (type === 'drr30') {
    result = await mcpPost('tools/call', { name: 'create_sale_order_export', arguments: {
      startDate: d30.toISOString(), endDate: now.toISOString(),
      preset: 'sku_drr', facilityCode: facility,
    }});
  } else if (type === 'po') {
    result = await mcpPost('tools/call', { name: 'create_export_job', arguments: {
      exportJobTypeName: 'Purchase Orders', facilityCode: facility,
      startDateISO: start60.toISOString(), endDateISO: now.toISOString(),
      dateFilterId: 'addedOn',
    }});
  } else if (type === 'grn') {
    const start30 = new Date(now); start30.setDate(start30.getDate() - 30);
    result = await mcpPost('tools/call', { name: 'create_export_job', arguments: {
      exportJobTypeName: 'GRN', facilityCode: facility,
      startDateISO: start30.toISOString(), endDateISO: now.toISOString(),
      dateFilterId: 'addedOn',
    }});
  } else {
    throw new Error(`Unknown job type: ${type}`);
  }

  const jobCode = extractJobCode(result);
  if (!jobCode) {
    const text = result?.content?.[0]?.text || JSON.stringify(result);
    throw new Error(`No jobCode for ${type}/${facility}: ${text.slice(0, 200)}`);
  }
  return jobCode;
}

// ── POLL: check status of one job ─────────────────────────────────────────────
export async function pollJob(jobCode, facility) {
  const result = await mcpPost('tools/call', {
    name: 'get_export_job_status',
    arguments: { jobCode, facilityCode: facility },
  });
  const text = result?.content?.[0]?.text || JSON.stringify(result);
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = {}; }
  const st  = (parsed?.status || '').toUpperCase();
  const url = parsed?.filePath || '';
  if ((st === 'COMPLETE' || st === 'SUCCESSFUL') && url) return { status: 'DONE', url };
  if (st === 'FAILED') return { status: 'FAILED', error: parsed?.message || 'Unknown' };
  return { status: 'RUNNING' };
}

// ── DOWNLOAD: fetch CSV from URL ──────────────────────────────────────────────
export async function downloadCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
  const text = await res.text();
  return parseCSV(text);
}

// ── Helpers exported for use in frontend merging ──────────────────────────────
export { num, FACILITIES };
