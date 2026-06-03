/**
 * mcpClient.js — Server-side only
 * Redesigned for short-timeout serverless (Vercel Hobby = 10s)
 * Each exported function does ONE fast operation only
 */

const MCP_URL   = process.env.MCP_URL   || 'https://corona-staging.astrotalk.store/mcp';
const MCP_TOKEN = process.env.MCP_TOKEN || '';

const SKU_WHITELIST = {
  "BP_0012":"Bracelets and Pendants",
  "BP_0035":"Bracelets and Pendants",
  "BP_0037":"Bracelets and Pendants",
  "BP_0039":"Bracelets and Pendants",
  "BP_0040":"Bracelets and Pendants",
  "BP_0044":"Bracelets and Pendants",
  "BP_0045":"Bracelets and Pendants",
  "BP_0054":"Bracelets and Pendants",
  "BP_0055":"Bracelets and Pendants",
  "BP_0056":"Bracelets and Pendants",
  "BP_0060":"Bracelets and Pendants",
  "BP_0068":"Bracelets and Pendants",
  "BP_0074":"Bracelets and Pendants",
  "BP_0077":"Bracelets and Pendants",
  "BP_0084":"Bracelets and Pendants",
  "BP_0086":"Bracelets and Pendants",
  "BP_0095":"Bracelets and Pendants",
  "BP_0205":"Bracelets and Pendants",
  "BP_0309":"Bracelets and Pendants",
  "BP_0323":"Bracelets and Pendants",
  "BP_0324":"Bracelets and Pendants",
  "BP_0360":"Bracelets and Pendants",
  "BP_0372":"Bracelets and Pendants",
  "BP_0374":"Bracelets and Pendants",
  "BP_0375":"Bracelets and Pendants",
  "BP_0386":"Bracelets and Pendants",
  "BP_0388":"Bracelets and Pendants",
  "BP_0389":"Bracelets and Pendants",
  "BP_0390":"Bracelets and Pendants",
  "BP_0391":"Bracelets and Pendants",
  "BP_0395":"Bracelets and Pendants",
  "BP_0398":"Bracelets and Pendants",
  "BP_0399":"Bracelets and Pendants",
  "BP_0400":"Bracelets and Pendants",
  "BP_0401":"Bracelets and Pendants",
  "BP_0402":"Bracelets and Pendants",
  "BP_0403":"Bracelets and Pendants",
  "BP_0404":"Bracelets and Pendants",
  "BP_0405":"Bracelets and Pendants",
  "BP_0406":"Bracelets and Pendants",
  "BP_0407":"Bracelets and Pendants",
  "BP_0408":"Bracelets and Pendants",
  "BP_0409":"Bracelets and Pendants",
  "BP_0411":"Crystal",
  "BP_0412":"Bracelets and Pendants",
  "BP_0413":"Bracelets and Pendants",
  "BP_0414":"Bracelets and Pendants",
  "BP_0415":"Bracelets and Pendants",
  "BP_0416":"Bracelets and Pendants",
  "BP_0417":"Bracelets and Pendants",
  "BP_0418":"Bracelets and Pendants",
  "BP_0420":"Bracelets and Pendants",
  "BP_0421":"Bracelets and Pendants",
  "BP_0422":"Bracelets and Pendants",
  "BP_0425":"Bracelets and Pendants",
  "BP_0426":"Bracelets and Pendants",
  "BP_0427":"Bracelets and Pendants",
  "BP_0428":"Bracelets and Pendants",
  "BP_0429":"Bracelets and Pendants",
  "BP_0430":"Bracelets and Pendants",
  "BP_0431":"Bracelets and Pendants",
  "BP_0432":"Bracelets and Pendants",
  "BP_0433":"Bracelets and Pendants",
  "BP_0434":"Bracelets and Pendants",
  "BP_0435":"Bracelets and Pendants",
  "BP_0436":"Bracelets and Pendants",
  "BP_0437":"Bracelets and Pendants",
  "BP_0438":"Bracelets and Pendants",
  "BP_0439":"Bracelets and Pendants",
  "BP_0440":"Bracelets and Pendants",
  "BP_0441":"Bracelets and Pendants",
  "BP_0442":"Bracelets and Pendants",
  "BP_0443":"Bracelets and Pendants",
  "BP_0444":"Bracelets and Pendants",
  "BP_0445":"Bracelets and Pendants",
  "BP_0446":"Bracelets and Pendants",
  "BP_0447":"Bracelets and Pendants",
  "BP_0448":"Bracelets and Pendants",
  "BP_0449":"Bracelets and Pendants",
  "BP_0450":"Bracelets and Pendants",
  "BP_0451":"Bracelets and Pendants",
  "BP_0452":"Bracelets and Pendants",
  "BP_0453":"Bracelets and Pendants",
  "BP_0454":"Bracelets and Pendants",
  "BP_0456":"Bracelets and Pendants",
  "BP_0457":"Bracelets and Pendants",
  "BP_0458":"Bracelets and Pendants",
  "BP_0459":"Bracelets and Pendants",
  "BP_0460":"Bracelets and Pendants",
  "BP_0461":"Bracelets and Pendants",
  "BP_0462":"Bracelets and Pendants",
  "BP_0463":"Bracelets and Pendants",
  "BP_0464":"Bracelets and Pendants",
  "BP_0465":"Bracelets and Pendants",
  "BP_0466":"Bracelets and Pendants",
  "BP_0467":"Bracelets and Pendants",
  "BP_0468":"Bracelets and Pendants",
  "BP_0469":"Bracelets and Pendants",
  "BP_0470":"Bracelets and Pendants",
  "BP_2001":"Bracelets and Pendants",
  "BP_2002":"Bracelets and Pendants",
  "BP_2003":"Bracelets and Pendants",
  "BP_2004":"Bracelets and Pendants",
  "CRY_0148":"Crystal",
  "CRY_0149":"Crystal",
  "CRY_0150":"Crystal",
  "CRY_0153":"Crystal",
  "CRY_0156":"Crystal",
  "CRY_0157":"Crystal",
  "CRY_0158":"Crystal",
  "CRY_0160":"Crystal",
  "CRY_0161":"Crystal",
  "CRY_0168":"Crystal",
  "CRY_0169":"Crystal",
  "CRY_0170":"Crystal",
  "CRY_0171":"Crystal",
  "CRY_0172":"Crystal",
  "CRY_0184":"Crystal",
  "CRY_0185":"Crystal",
  "CRY_0186":"Crystal",
  "CRY_0187":"Crystal",
  "CRY_0188":"Crystal",
  "CRY_0204":"Crystal",
  "CRY_0205":"Crystal",
  "CRY_0206":"Crystal",
  "CRY_0207":"Crystal",
  "CRY_0221":"Crystal",
  "CRY_0222":"Crystal",
  "CRY_0223":"Crystal",
  "CRY_0232":"Crystal",
  "CRY_0233":"Crystal",
  "CRY_0234":"Crystal",
  "CRY_0235":"Crystal",
  "CRY_0236":"Crystal",
  "CRY_0238":"Crystal",
  "CRY_0239":"Crystal",
  "CRY_0241":"Crystal",
  "CRY_0243":"Crystal",
  "CRY_0245":"Crystal",
  "CRY_213":"Crystal",
  "CRY_214":"Crystal",
  "F_0012":"Frame",
  "F_0013":"Frame",
  "F_0015":"Frame",
  "F_0021":"Frame",
  "F_0024":"Frame",
  "F_0025":"Frame",
  "F_0026":"Frame",
  "F_0027":"Frame",
  "F_0028":"Frame",
  "F_0030":"Frame",
  "F_1007":"Frame",
  "M_1003":"Murti",
  "M_1008":"Murti",
  "M_1017":"Murti",
  "M_1026":"Murti",
  "M_1030":"Murti",
  "M_1032":"Murti",
  "M_1033":"Murti",
  "M_1035":"Murti",
  "M_1036":"Murti",
  "M_1037":"Murti",
  "M_1040":"Murti",
  "RD_0122_01":"Rudraksha",
  "RD_0122_03":"Rudraksha",
  "RD_0122_04":"Rudraksha",
  "RD_0122_05":"Rudraksha",
  "RD_0122_06":"Rudraksha",
  "RD_0122_07":"Rudraksha",
  "RD_0122_GM":"Rudraksha",
  "RD_0123_5":"Rudraksha",
  "RD_0123_5_05":"Rudraksha",
  "RD_0123_5_07":"Rudraksha",
  "RD_0123_7":"Rudraksha",
  "RD_0126":"Rudraksha",
  "RD_0128":"Rudraksha",
  "RD_0144_07":"Rudraksha",
  "RD_0144_SHP":"Rudraksha",
  "RD_0144_SP":"Rudraksha",
  "SEL_0001":"Selenite",
  "SEL_0004":"Selenite",
  "VST_1002":"Vastu",
  "VST_1003":"Vastu",
  "VST_1004":"Vastu",
  "VST_1005":"Vastu",
  "VST_1006":"Vastu",
  "VST_1007":"Vastu",
  "VST_1008":"Vastu",
  "VST_1009":"Vastu",
  "VST_1013":"Vastu",
  "WH_2001":"Wall Hanging",
  "WJ_0001":"Womens Jewellery",
  "WJ_0002":"Womens Jewellery",
  "WJ_0003":"Womens Jewellery",
  "WJ_0004":"Womens Jewellery",
  "WJ_0005":"Womens Jewellery",
  "WJ_0006":"Womens Jewellery",
  "WJ_0007":"Womens Jewellery",
  "WJ_0009":"Womens Jewellery",
  "WJ_0010":"Womens Jewellery",
};

export { SKU_WHITELIST };

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
    const start90 = new Date(now); start90.setDate(start90.getDate() - 90);
    result = await mcpPost('tools/call', { name: 'create_export_job', arguments: {
      exportJobTypeName: 'Purchase Orders', facilityCode: facility,
      startDateISO: start90.toISOString(), endDateISO: now.toISOString(),
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
