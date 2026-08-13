import { useState, useEffect, useCallback, useMemo } from 'react';

const ACCESS_TOKEN = (typeof window!=='undefined') ? (new URLSearchParams(window.location.search).get('t')||'') : '';
const _authHeaders = () => (ACCESS_TOKEN ? { 'x-access-token': ACCESS_TOKEN } : {});

/* ============================================================================
   Procurement Overview — Products dashboard subpage
   Data: Uniware PO export (last 90d) via /api/uniware  (trigger → poll → download)
   Scope: selectable month (or cumulative Since Jul) · committed = APPROVED+COMPLETE · value ex-GST
   Sections: A) 10 dashboard categories  B) Packaging (PKC*)  C) Certificates/Cards (CF*)
   Cost difference baseline = the month before the selected period, qty-weighted per vendor+SKU;
   CF_0001_D & CF_0029_GC split by printing type (Digital ≥ ₹1, Offset < ₹1).
   Change the constants below to move the window / baseline.
============================================================================ */

/* ---- reporting period ----
   The Overview has a month selector. START_MONTH sets the earliest selectable month.
   Each option = one calendar month (window), with baseline = the previous month.
   A cumulative "Since {START}" option is also offered.
   NOTE: the Uniware PO export returns only the last ~90 days, so months older than
   ~3 months back will read as empty (a note is shown for those). */
const START_YEAR = 2026, START_MONTH0 = 6;   // 6 = July (0-based)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const iso = (d) => d.toISOString().slice(0, 10);
const monthLabel = (y, m) => `${MONTHS[m]} ${y}`;

// list of selectable periods: cumulative first, then each month START..current (newest first)
function periodOptions(today = new Date()) {
  const cy = today.getUTCFullYear(), cm = today.getUTCMonth();
  const months = [];
  let y = START_YEAR, m = START_MONTH0;
  while (y < cy || (y === cy && m <= cm)) { months.push({ y, m }); m++; if (m > 11) { m = 0; y++; } }
  const opts = months.reverse().map(({ y, m }) => ({
    key: `${y}-${String(m + 1).padStart(2, '0')}`, label: MONTHS[m] + ' ' + String(y).slice(2), y, m, kind: 'month',
  }));
  opts.push({ key: 'cumulative', label: `Since ${MONTHS[START_MONTH0]}`, kind: 'cumulative' });
  return opts;
}

// resolve a selection key -> {winStart, winEnd, baseFrom, baseTo, winLabel, baseLabel}
function periodFor(key, today = new Date()) {
  const cy = today.getUTCFullYear(), cm = today.getUTCMonth();
  const isCurrentMonth = (y, m) => y === cy && m === cm;
  const monthPeriod = (y, m) => {
    const first = new Date(Date.UTC(y, m, 1));
    const last  = new Date(Date.UTC(y, m + 1, 0));
    const bFrom = new Date(Date.UTC(y, m - 1, 1));
    const bTo   = new Date(Date.UTC(y, m, 0));
    return {
      winStart: iso(first),
      winEnd: isCurrentMonth(y, m) ? iso(today) : iso(last),
      baseFrom: iso(bFrom), baseTo: iso(bTo),
      winLabel: isCurrentMonth(y, m) ? `${monthLabel(y, m)} (to date)` : monthLabel(y, m),
      baseLabel: monthLabel(bFrom.getUTCFullYear(), bFrom.getUTCMonth()),
    };
  };
  if (key === 'cumulative') {
    const bFrom = new Date(Date.UTC(START_YEAR, START_MONTH0 - 1, 1));
    const bTo   = new Date(Date.UTC(START_YEAR, START_MONTH0, 0));
    return {
      winStart: iso(new Date(Date.UTC(START_YEAR, START_MONTH0, 1))), winEnd: iso(today),
      baseFrom: iso(bFrom), baseTo: iso(bTo),
      winLabel: `${MONTHS[START_MONTH0]} ${START_YEAR} → today`,
      baseLabel: monthLabel(bFrom.getUTCFullYear(), bFrom.getUTCMonth()),
    };
  }
  const [yy, mm] = key.split('-').map(Number);
  return monthPeriod(yy, mm - 1);
}

const PO_FACILITIES = ['astrotalk', 'MSKT_FZP'];
const COMMIT = new Set(['APPROVED', 'COMPLETE']);
const TEN = new Set(['Bracelets and Pendants','Crystal','Frame','Murti','RING',
                     'Rudraksha','Selenite','Vastu','Wall Hanging','Womens Jewellery']);
const PT_SKUS = new Set(['CF_0001_D', 'CF_0029_GC']);

/* ---------- helpers ---------- */
const num = (x) => { const n = parseFloat(String(x ?? '').replace(/,/g, '')); return isNaN(n) ? 0 : n; };
const cdate = (r) => (r['Created'] || '').slice(0, 10);
const rateOf = (rej, recd) => { const i = recd + rej; return i > 0 ? (rej / i) * 100 : 0; };
const ptype = (u) => (u >= 1.0 ? 'Digital' : 'Offset');
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const qty = (n) => Math.round(n).toLocaleString('en-IN');
const pct = (n) => n.toFixed(1) + '%';
const scopeOf = (r) => {
  const s = (r['Item SkuCode'] || '').toUpperCase();
  if (s.startsWith('PKC')) return 'PKG';
  if (s.startsWith('CF')) return 'CERT';
  if (TEN.has((r['Category'] || '').trim())) return 'MAIN';
  return 'OUT';
};

/* ---------- aggregation ---------- */
function aggregate(rows, PER) {
  const win  = rows.filter(r => cdate(r) >= PER.winStart && cdate(r) <= PER.winEnd && COMMIT.has(r['Purchase Order Status']));
  const june = rows.filter(r => cdate(r) >= PER.baseFrom && cdate(r) <= PER.baseTo && COMMIT.has(r['Purchase Order Status']));

  const section = (tag) => {
    const w = win.filter(r => scopeOf(r) === tag);
    const j = june.filter(r => scopeOf(r) === tag);
    const val = w.reduce((a, r) => a + num(r['Order Quantity']) * num(r['Unit Price']), 0);
    const ord = w.reduce((a, r) => a + num(r['Order Quantity']), 0);
    const recd = w.reduce((a, r) => a + num(r['Recieved Quantity']), 0);
    const rej = w.reduce((a, r) => a + num(r['Rejected Quantity']), 0);
    const meta = {
      val, ord, recd, rej,
      pos: new Set(w.map(r => r['PO Code'])).size,
      vendors: new Set(w.map(r => (r['Vendor Name'] || '').trim())).size,
      skus: new Set(w.map(r => r['Item SkuCode'])).size,
      rejrate: rateOf(rej, recd),
    };
    // group helper
    const groupBy = (list, keyFn) => {
      const m = new Map();
      for (const r of list) {
        const k = keyFn(r);
        if (!m.has(k)) m.set(k, { val: 0, ord: 0, recd: 0, rej: 0, skus: new Set(), vends: new Set(), pos: new Set(), name: r['Item Type Name'] || '', cat: r['Category'] || '' });
        const g = m.get(k); const q = num(r['Order Quantity']), u = num(r['Unit Price']);
        g.val += q * u; g.ord += q; g.recd += num(r['Recieved Quantity']); g.rej += num(r['Rejected Quantity']);
        g.skus.add(r['Item SkuCode']); g.vends.add((r['Vendor Name'] || '').trim()); g.pos.add(r['PO Code']);
      }
      return m;
    };
    const cat = [...groupBy(w, r => (r['Category'] || '').trim())]
      .map(([c, d]) => ({ k: c, skus: d.skus.size, vendors: d.vends.size, pos: d.pos.size, ord: d.ord, recd: d.recd, val: d.val, rej: d.rej, rejrate: rateOf(d.rej, d.recd) }))
      .sort((a, b) => b.val - a.val);
    const vend = [...groupBy(w, r => (r['Vendor Name'] || '').trim())]
      .map(([v, d]) => ({ k: v, pos: d.pos.size, skus: d.skus.size, ord: d.ord, recd: d.recd, val: d.val, rej: d.rej, rejrate: rateOf(d.rej, d.recd) }))
      .sort((a, b) => b.val - a.val);
    const sku = [...groupBy(w, r => r['Item SkuCode'])]
      .map(([s, d]) => ({ k: s, name: d.name, cat: d.cat, ord: d.ord, recd: d.recd, val: d.val, rej: d.rej, rejrate: rateOf(d.rej, d.recd), pend: d.ord - d.recd, fill: d.ord ? (d.recd / d.ord) * 100 : 0 }))
      .sort((a, b) => b.val - a.val);

    // cost difference — June baseline, vendor+SKU; printing-type for PT_SKUS
    const wmap = (list, excludePT) => {
      const m = new Map();
      for (const r of list) {
        if (excludePT && PT_SKUS.has(r['Item SkuCode'])) continue;
        const k = (r['Vendor Name'] || '').trim() + '||' + r['Item SkuCode'];
        const q = num(r['Order Quantity']), u = num(r['Unit Price']);
        if (q > 0 && u > 0) { if (!m.has(k)) m.set(k, [0, 0]); const a = m.get(k); a[0] += q * u; a[1] += q; }
      }
      const out = new Map();
      for (const [k, a] of m) if (a[1] > 0) out.set(k, [a[0] / a[1], a[1]]);
      return out;
    };
    const nameOf = {}; w.forEach(r => { nameOf[r['Item SkuCode']] = r['Item Type Name']; });
    const cost = [];
    // printing-type rows (only where the SKU is in this section)
    for (const s of PT_SKUS) {
      if (!w.some(r => r['Item SkuCode'] === s)) continue;
      for (const typ of ['Digital', 'Offset']) {
        const js = j.filter(r => r['Item SkuCode'] === s && ptype(num(r['Unit Price'])) === typ);
        const ws = w.filter(r => r['Item SkuCode'] === s && ptype(num(r['Unit Price'])) === typ);
        if (!ws.length) continue;
        const jq = js.reduce((a, r) => a + num(r['Order Quantity']), 0);
        const jsp = js.reduce((a, r) => a + num(r['Order Quantity']) * num(r['Unit Price']), 0);
        const wq = ws.reduce((a, r) => a + num(r['Order Quantity']), 0);
        const wsp = ws.reduce((a, r) => a + num(r['Order Quantity']) * num(r['Unit Price']), 0);
        if (jq === 0) continue;
        const bp = jsp / jq, wp = wsp / wq, delta = bp - wp;
        cost.push({ vendor: `${typ} (printing)`, sku: s, name: ws[0]['Item Type Name'], base: bp, win: wp, chg: wp - bp, chgpct: bp ? (delta / bp) * 100 : 0, wq, impact: delta * wq });
      }
    }
    const bmap = wmap(j, true), wmp = wmap(w, true);
    for (const [k, [wp, wq]] of wmp) {
      if (bmap.has(k)) {
        const [bp] = bmap.get(k); const [v, s] = k.split('||'); const delta = bp - wp;
        cost.push({ vendor: v, sku: s, name: nameOf[s] || '', base: bp, win: wp, chg: wp - bp, chgpct: bp ? (delta / bp) * 100 : 0, wq, impact: delta * wq });
      }
    }
    cost.sort((a, b) => a.impact - b.impact);
    const saved = cost.filter(c => c.impact >= 0).reduce((a, c) => a + c.impact, 0);
    const paid = cost.filter(c => c.impact < 0).reduce((a, c) => a - c.impact, 0);

    const catVend = [...groupBy(w, r => (r['Category'] || '').trim() + '||' + (r['Vendor Name'] || '').trim())]
      .map(([k, d]) => { const [c, v] = k.split('||'); return { cat: c, vendor: v, skus: d.skus.size, ord: d.ord, recd: d.recd, val: d.val }; })
      .sort((a, b) => a.cat.localeCompare(b.cat) || b.val - a.val);

    // per-entity breakdowns for drill-down
    const gv = (list, keyFn) => {
      const m = new Map();
      for (const r of list) {
        const k = keyFn(r); if (k === null) continue;
        if (!m.has(k)) m.set(k, { val:0, ord:0, recd:0, rej:0, skus:new Set(), vends:new Set(), cats:new Set() });
        const g = m.get(k); const q = num(r['Order Quantity']), u = num(r['Unit Price']);
        g.val += q*u; g.ord += q; g.recd += num(r['Recieved Quantity']); g.rej += num(r['Rejected Quantity']);
        g.skus.add(r['Item SkuCode']); g.vends.add((r['Vendor Name']||'').trim()); g.cats.add((r['Category']||'').trim());
      }
      return m;
    };
    const byCat = {}, byVend = {};
    for (const c of cat.map(x => x.k)) {
      const rowsC = w.filter(r => (r['Category']||'').trim() === c);
      const vend2 = [...gv(rowsC, r => (r['Vendor Name']||'').trim())].map(([k,d]) => ({ k, skus:d.skus.size, ord:d.ord, recd:d.recd, val:d.val, rej:d.rej, rejrate: rateOf(d.rej,d.recd) })).sort((a,b)=>b.val-a.val);
      const sku2  = [...gv(rowsC, r => r['Item SkuCode'])].map(([k,d]) => ({ k, name:(rowsC.find(r=>r['Item SkuCode']===k)||{})['Item Type Name']||'', ord:d.ord, recd:d.recd, val:d.val, rej:d.rej, rejrate: rateOf(d.rej,d.recd) })).sort((a,b)=>b.val-a.val);
      byCat[c] = { meta: cat.find(x=>x.k===c), vendors: vend2, skus: sku2 };
    }
    for (const v of vend.map(x => x.k)) {
      const rowsV = w.filter(r => (r['Vendor Name']||'').trim() === v);
      const cats2 = [...gv(rowsV, r => (r['Category']||'').trim())].map(([k,d]) => ({ k, skus:d.skus.size, ord:d.ord, recd:d.recd, val:d.val, rej:d.rej, rejrate: rateOf(d.rej,d.recd) })).sort((a,b)=>b.val-a.val);
      const sku2  = [...gv(rowsV, r => r['Item SkuCode'])].map(([k,d]) => ({ k, name:(rowsV.find(r=>r['Item SkuCode']===k)||{})['Item Type Name']||'', cat:(rowsV.find(r=>r['Item SkuCode']===k)||{})['Category']||'', ord:d.ord, recd:d.recd, val:d.val, rej:d.rej, rejrate: rateOf(d.rej,d.recd) })).sort((a,b)=>b.val-a.val);
      byVend[v] = { meta: vend.find(x=>x.k===v), cats: cats2, skus: sku2 };
    }
    return { meta, cat, vend, sku, cost, catVend, byCat, byVend, costNet: saved - paid, saved, paid };
  };

  const MAIN = section('MAIN'), PKG = section('PKG'), CERT = section('CERT');
  return { MAIN, PKG, CERT, grand: MAIN.meta.val + PKG.meta.val + CERT.meta.val, fetchedAt: new Date() };
}

/* ---------- data fetch (mirrors Dashboard.js runJob) ---------- */
async function runJob(type, facility) {
  const t = await fetch('/api/uniware', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: JSON.stringify({ action: 'trigger', type, facility }),
  });
  const trig = await t.json();
  if (trig.rows) return trig.rows;               // Redis cache hit with rows
  const jobCode = trig.jobCode;
  if (!jobCode || trig.error) return [];
  if (jobCode === 'KV_CACHED') return trig.rows || [];
  let url = null;
  for (let i = 0; i < 30; i++) {
    const p = await fetch('/api/uniware', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ..._authHeaders() },
      body: JSON.stringify({ action: 'poll', jobCode, facility }),
    });
    const pd = await p.json();
    if (pd.status === 'DONE' && pd.url) { url = pd.url; break; }
    await new Promise(res => setTimeout(res, 2000));
  }
  if (!url) return [];
  const d = await fetch('/api/uniware', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: JSON.stringify({ action: 'download', url, type, facility }),
  });
  const dd = await d.json();
  return dd.rows || [];
}

/* ---------- small UI atoms ---------- */
const Kpi = ({ label, value, sub, tone }) => (
  <div className={`ov-kpi ${tone || ''}`}>
    <div className="ov-kpi-val">{value}</div>
    <div className="ov-kpi-lbl">{label}</div>
    {sub && <div className="ov-kpi-sub">{sub}</div>}
  </div>
);

function Table({ cols, rows, foot, onRowClick, searchable, placeholder }) {
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const shown = ql
    ? rows.filter(r => cols.some(c => String(c.get(r) ?? '').toLowerCase().includes(ql)))
    : rows;
  return (
    <div className="ov-tablewrap">
      {searchable && (
        <div className="ov-searchrow">
          <span className="ov-searchicon">⌕</span>
          <input className="ov-search" value={q} onChange={e => setQ(e.target.value)}
                 placeholder={placeholder || 'Search…'} />
          {ql && <span className="ov-searchcount">{shown.length} of {rows.length}</span>}
          {ql && <button className="ov-searchclear" onClick={() => setQ('')} aria-label="Clear">×</button>}
        </div>
      )}
      <table className="ov-table">
        <thead><tr>{cols.map((c, i) => <th key={i} className={c.num ? 'r' : ''}>{c.h}</th>)}</tr></thead>
        <tbody>
          {shown.map((row, ri) => (
            <tr key={ri} className={onRowClick ? 'clickable' : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}>{cols.map((c, ci) => {
              const v = c.get(row);
              const cls = (c.num ? 'r ' : '') + (c.cls ? c.cls(row) : '');
              return <td key={ci} className={cls.trim()}>{v}</td>;
            })}</tr>
          ))}
          {shown.length === 0 && (
            <tr><td colSpan={cols.length} style={{ textAlign: 'center', color: 'var(--mut)', padding: '18px' }}>No matches</td></tr>
          )}
        </tbody>
        {foot && !ql && <tfoot><tr>{foot.map((f, i) => <td key={i} className={f.num ? 'r' : ''}>{f.v}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

/* ---------- module-level cache ----------
   Survives tab switches (component unmount/remount) within one page load, so
   switching away from Products and back does NOT refetch. A full page reload
   clears it (fresh data); the Refresh button forces a refetch on demand. */
let _rowsCache = null;
let _fetchedAt = null;

/* ---------- main component ---------- */
export default function Overview() {
  const [rows, setRows] = useState(_rowsCache);       // reuse cached rows if present
  const [fetchedAt, setFetchedAt] = useState(_fetchedAt);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [view, setView] = useState('overview');   // 'overview' | 'details'
  const [section, setSection] = useState('MAIN');  // MAIN | PKG | CERT
  const [subtab, setSubtab] = useState('categories');
  const [drill, setDrill] = useState(null);   // { kind:'category'|'vendor', key } or null
  const openDrill = (kind, key) => { setDrill({ kind, key }); setView('drill'); };
  const OPTIONS = useMemo(() => periodOptions(), []);
  const [selKey, setSelKey] = useState(() => OPTIONS[0].key);  // default: current month
  const PER = useMemo(() => periodFor(selKey), [selKey]);

  const load = useCallback(async (force = false) => {
    if (!force && _rowsCache) {           // already have data → no refetch on tab switch
      setRows(_rowsCache); setFetchedAt(_fetchedAt); return;
    }
    setLoading(true); setErr(null);
    try {
      const all = [];
      for (const fac of PO_FACILITIES) {
        const r = await runJob('po', fac);
        all.push(...r);
      }
      if (!all.length) throw new Error('No PO rows returned from Uniware.');
      _rowsCache = all; _fetchedAt = new Date();
      setRows(all); setFetchedAt(_fetchedAt);
    } catch (e) { setErr(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  // First open → fetch. Return visits (remount) → use cache, no refetch.
  useEffect(() => { if (!_rowsCache) load(); }, [load]);

  const data = useMemo(() => (rows ? aggregate(rows, PER) : null), [rows, PER]);

  if (loading || !data) {
    return (
      <div className="ov-root ov-center">
        <div className="ov-spinner" />
        <p>{err ? '' : 'Pulling live purchase orders from Uniware…'}</p>
        {err && <div className="ov-err"><p>Couldn’t load procurement data — {err}</p><button className="ov-btn" onClick={() => load(true)}>Try again</button></div>}
        <style jsx global>{styles}</style>
      </div>
    );
  }

  const sec = data[section];
  const secName = { MAIN: '10 Dashboard Categories', PKG: 'Packaging (PKC)', CERT: 'Certificates & Cards (CF)' }[section];
  const asOf = (fetchedAt || data.fetchedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  /* ---------------- OVERVIEW (summary) ---------------- */
  if (view === 'overview') {
    return (
      <div className="ov-root">
        <header className="ov-head">
          <div>
            <div className="ov-eyebrow">Procurement · {PER.winLabel}</div>
            <h1>Overview</h1>
          </div>
          <div className="ov-headright">
            <span className="ov-asof">Live · {asOf}</span>
            <button className="ov-btn" onClick={() => load(true)}>↻ Refresh</button>
          </div>
        </header>

        <div className="ov-monthbar" role="tablist" aria-label="Reporting period">
          {OPTIONS.map(o => (
            <button key={o.key} className={`ov-month ${selKey === o.key ? 'on' : ''} ${o.kind === 'cumulative' ? 'cum' : ''}`}
              onClick={() => setSelKey(o.key)} aria-pressed={selKey === o.key}>{o.label}</button>
          ))}
        </div>

        <div className="ov-kpis">
          <Kpi label="Total procurement" value={inr(data.grand)} sub="ex-GST · committed POs" tone="accent" />
          <Kpi label="Qty received" value={qty(data.MAIN.meta.recd + data.PKG.meta.recd + data.CERT.meta.recd)} sub="units inwarded" />
          <Kpi label="Rejection rate" value={pct(rejAll(data))} sub={`${qty(data.MAIN.meta.rej + data.PKG.meta.rej + data.CERT.meta.rej)} units`} tone="warn" />
          <Kpi label={`Net cost vs ${PER.baseLabel}`} value={inr(data.MAIN.costNet + data.PKG.costNet + data.CERT.costNet)}
               sub={(data.MAIN.costNet + data.PKG.costNet + data.CERT.costNet) >= 0 ? 'saved' : 'extra paid'}
               tone={(data.MAIN.costNet + data.PKG.costNet + data.CERT.costNet) >= 0 ? 'good' : 'warn'} />
        </div>

        <div className="ov-sections">
          {[['MAIN', '10 Dashboard Categories', 'accent'], ['PKG', 'Packaging (PKC)', 'plum'], ['CERT', 'Certificates & Cards (CF)', 'gold']].map(([k, label, tone]) => {
            const s = data[k];
            return (
              <button key={k} className={`ov-seccard ${tone}`} onClick={() => { setSection(k); setSubtab('categories'); setView('details'); }}>
                <div className="ov-seccard-h">{label}</div>
                <div className="ov-seccard-val">{inr(s.meta.val)}</div>
                <div className="ov-seccard-meta">
                  <span>{s.meta.skus} SKUs</span><span>{s.meta.vendors} vendors</span><span>{pct(s.meta.rejrate)} rej</span>
                </div>
                <div className="ov-seccard-cta">View in depth →</div>
              </button>
            );
          })}
        </div>

        <div className="ov-two">
          <div className="ov-card">
            <h3>Top categories by spend</h3>
            <Table
              cols={[
                { h: 'Category', get: r => r.k },
                { h: 'Value', num: true, get: r => inr(r.val) },
                { h: 'Share', num: true, get: r => pct(r.val / data.MAIN.meta.val * 100) },
              ]}
              rows={data.MAIN.cat.slice(0, 6)}
              onRowClick={r => openDrill('category', r.k)}
            />
            <div className="ov-drillhint">Tap a category for its vendors, items &amp; rejection →</div>
          </div>
          <div className="ov-card">
            <h3>Top vendors by spend</h3>
            <Table
              cols={[
                { h: 'Vendor', get: r => r.k },
                { h: 'Value', num: true, get: r => inr(r.val) },
                { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
              ]}
              rows={data.MAIN.vend.slice(0, 6)}
              onRowClick={r => openDrill('vendor', r.k)}
            />
            <div className="ov-drillhint">Tap a vendor for its items, categories &amp; rejection →</div>
          </div>
        </div>

        {data.grand === 0 && <p className="ov-empty">No committed POs found for {PER.winLabel}. Note: Uniware only returns ~90 days of PO history, so months older than that read as empty.</p>}
        <p className="ov-note">Baseline for cost difference = {PER.baseLabel} (the month before the selected period). CF_0001_D & CF_0029_GC compared by printing type (Digital ≥ ₹1, Offset &lt; ₹1). Values exclusive of GST; committed (APPROVED + COMPLETE) POs only.</p>
        <style jsx global>{styles}</style>
      </div>
    );
  }


  /* ---------------- DRILL-DOWN (single category or vendor) ---------------- */
  if (view === 'drill' && drill) {
    const isCat = drill.kind === 'category';
    const rec = isCat ? sec.byCat[drill.key] : sec.byVend[drill.key];
    const m = rec && rec.meta;
    const back = () => { setDrill(null); setView('overview'); };
    if (!rec || !m) {
      return (
        <div className="ov-root">
          <header className="ov-head"><div><button className="ov-back" onClick={back}>← Overview</button><h1>{drill.key}</h1></div></header>
          <p className="ov-note">No data for this {drill.kind} in {PER.winLabel}.</p>
          <style jsx global>{styles}</style>
        </div>
      );
    }
    return (
      <div className="ov-root">
        <header className="ov-head">
          <div>
            <button className="ov-back" onClick={back}>← Overview</button>
            <h1>{drill.key}</h1>
            <div className="ov-eyebrow">{isCat ? 'Category' : 'Vendor'} · {PER.winLabel}</div>
          </div>
          <button className="ov-closebtn" onClick={back} title="Close" aria-label="Close">×</button>
        </header>

        <div className="ov-kpis">
          <Kpi label="Procurement value" value={inr(m.val)} sub="ex-GST" tone="accent" />
          <Kpi label={isCat ? 'Vendors' : 'Categories'} value={isCat ? m.vendors : (rec.cats ? rec.cats.length : 0)} />
          <Kpi label="Items (SKUs)" value={m.skus} />
          <Kpi label="Rejection rate" value={pct(m.rejrate)} sub={`${qty(m.rej)} units`} tone={m.rejrate >= 5 ? 'warn' : ''} />
        </div>

        {isCat ? (
          <>
            <div className="ov-card">
              <div className="ov-cardhead"><h3>Vendors supplying {drill.key}</h3><button className="ov-cardclose" onClick={back} title="Close" aria-label="Close">×</button></div>
              <Table
                cols={[
                  { h: 'Vendor', get: r => r.k },
                  { h: 'Items', num: true, get: r => r.skus },
                  { h: 'Ordered', num: true, get: r => qty(r.ord) },
                  { h: 'Received', num: true, get: r => qty(r.recd) },
                  { h: 'Value', num: true, get: r => inr(r.val) },
                  { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
                ]}
                rows={rec.vendors}
                onRowClick={r => openDrill('vendor', r.k)}
                searchable placeholder="Search vendors…"
              />
            </div>
            <div className="ov-card">
              <div className="ov-cardhead"><h3>Items in {drill.key}</h3><button className="ov-cardclose" onClick={back} title="Close" aria-label="Close">×</button></div>
              <Table
                cols={[
                  { h: 'Item', get: r => r.name || r.k },
                  { h: 'Ordered', num: true, get: r => qty(r.ord) },
                  { h: 'Received', num: true, get: r => qty(r.recd) },
                  { h: 'Value', num: true, get: r => inr(r.val) },
                  { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
                ]}
                rows={rec.skus}
                searchable placeholder="Search items…"
              />
            </div>
          </>
        ) : (
          <>
            <div className="ov-card">
              <div className="ov-cardhead"><h3>Categories from {drill.key}</h3><button className="ov-cardclose" onClick={back} title="Close" aria-label="Close">×</button></div>
              <Table
                cols={[
                  { h: 'Category', get: r => r.k },
                  { h: 'Items', num: true, get: r => r.skus },
                  { h: 'Ordered', num: true, get: r => qty(r.ord) },
                  { h: 'Received', num: true, get: r => qty(r.recd) },
                  { h: 'Value', num: true, get: r => inr(r.val) },
                  { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
                ]}
                rows={rec.cats}
                onRowClick={r => openDrill('category', r.k)}
                searchable placeholder="Search categories…"
              />
            </div>
            <div className="ov-card">
              <div className="ov-cardhead"><h3>Items from {drill.key}</h3><button className="ov-cardclose" onClick={back} title="Close" aria-label="Close">×</button></div>
              <Table
                cols={[
                  { h: 'Item', get: r => r.name || r.k },
                  { h: 'Category', get: r => r.cat },
                  { h: 'Ordered', num: true, get: r => qty(r.ord) },
                  { h: 'Received', num: true, get: r => qty(r.recd) },
                  { h: 'Value', num: true, get: r => inr(r.val) },
                  { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
                ]}
                rows={rec.skus}
                searchable placeholder="Search items…"
              />
            </div>
          </>
        )}
        <style jsx global>{styles}</style>
      </div>
    );
  }

  /* ---------------- DETAILS (in-depth subpage) ---------------- */
  const SUBTABS = section === 'MAIN'
    ? [['categories', 'Categories'], ['vendors', 'Vendors'], ['skus', 'SKUs'], ['received', 'Received'], ['cost', 'Cost Difference'], ['rejection', 'Rejection'], ['catvend', 'Category Vendors']]
    : [['vendors', 'Vendors'], ['skus', 'SKUs'], ['cost', 'Cost Difference']];

  return (
    <div className="ov-root">
      <header className="ov-head">
        <div>
          <button className="ov-back" onClick={() => setView('overview')}>← Overview</button>
          <h1>{secName}</h1>
          <div className="ov-eyebrow">{PER.winLabel} · {inr(sec.meta.val)} · {sec.meta.skus} SKUs · {sec.meta.vendors} vendors · {sec.meta.pos} POs</div>
        </div>
        <div className="ov-headright">
          <button className="ov-closebtn" onClick={() => setView('overview')} title="Close" aria-label="Close">×</button>
          <div className="ov-segwrap">
            {['MAIN', 'PKG', 'CERT'].map(k => (
              <button key={k} className={`ov-seg ${section === k ? 'on' : ''}`}
                onClick={() => { setSection(k); setSubtab(k === 'MAIN' ? 'categories' : 'vendors'); }}>
                {{ MAIN: 'Categories', PKG: 'Packaging', CERT: 'Certificates' }[k]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="ov-subnav">
        {SUBTABS.map(([id, label]) => (
          <button key={id} className={`ov-subtab ${subtab === id ? 'on' : ''}`} onClick={() => setSubtab(id)}>{label}</button>
        ))}
      </nav>

      <div className="ov-detailbody">
        {subtab === 'categories' && section === 'MAIN' && (
          <Table
            cols={[
              { h: 'Category', get: r => r.k }, { h: 'SKUs', num: true, get: r => r.skus },
              { h: 'Vendors', num: true, get: r => r.vendors }, { h: 'POs', num: true, get: r => r.pos },
              { h: 'Ordered', num: true, get: r => qty(r.ord) }, { h: 'Received', num: true, get: r => qty(r.recd) },
              { h: 'Value (ex-GST)', num: true, get: r => inr(r.val) },
            ]}
            rows={sec.cat}
            onRowClick={section === 'MAIN' ? (r => openDrill('category', r.k)) : undefined}
            foot={[{ v: 'TOTAL' }, { v: '', num: true }, { v: '', num: true }, { v: '', num: true }, { v: '', num: true }, { v: '', num: true }, { v: inr(sec.meta.val), num: true }]}
          />
        )}
        {subtab === 'vendors' && (
          <Table
            cols={[
              { h: 'Vendor', get: r => r.k }, { h: 'POs', num: true, get: r => r.pos }, { h: 'SKUs', num: true, get: r => r.skus },
              { h: 'Ordered', num: true, get: r => qty(r.ord) }, { h: 'Received', num: true, get: r => qty(r.recd) },
              { h: 'Value (ex-GST)', num: true, get: r => inr(r.val) },
            ]}
            rows={sec.vend}
            onRowClick={r => openDrill('vendor', r.k)}
            searchable placeholder="Search vendors…"
            foot={[{ v: 'TOTAL' }, { v: '', num: true }, { v: '', num: true }, { v: '', num: true }, { v: '', num: true }, { v: inr(sec.meta.val), num: true }]}
          />
        )}
        {subtab === 'skus' && (
          <Table
            cols={[
              { h: 'SKU', get: r => r.k }, { h: 'Item', get: r => r.name }, { h: 'Category', get: r => r.cat },
              { h: 'Ordered', num: true, get: r => qty(r.ord) }, { h: 'Received', num: true, get: r => qty(r.recd) },
              { h: 'Value (ex-GST)', num: true, get: r => inr(r.val) },
            ]}
            rows={sec.sku}
            searchable placeholder="Search items…"
            foot={[{ v: 'TOTAL' }, { v: '' }, { v: '' }, { v: '', num: true }, { v: '', num: true }, { v: inr(sec.meta.val), num: true }]}
          />
        )}
        {subtab === 'received' && section === 'MAIN' && (
          <Table
            cols={[
              { h: 'SKU', get: r => r.k }, { h: 'Item', get: r => r.name }, { h: 'Category', get: r => r.cat },
              { h: 'Ordered', num: true, get: r => qty(r.ord) }, { h: 'Received', num: true, get: r => qty(r.recd) },
              { h: 'Pending', num: true, get: r => qty(r.pend) }, { h: 'Fill %', num: true, get: r => pct(r.fill) },
            ]}
            rows={[...sec.sku].sort((a, b) => b.recd - a.recd)}
            searchable placeholder="Search items…"
          />
        )}
        {subtab === 'cost' && (
          <>
            <div className="ov-costbar">
              <span className="good">Saved {inr(sec.saved)}</span>
              <span className="bad">Paid more {inr(sec.paid)}</span>
              <span className={sec.costNet >= 0 ? 'good' : 'bad'}>Net {inr(sec.costNet)}</span>
            </div>
            <Table
              cols={[
                { h: 'Vendor / Printing', get: r => r.vendor }, { h: 'SKU', get: r => r.sku }, { h: 'Item', get: r => r.name },
                { h: `${PER.baseLabel} ₹`, num: true, get: r => r.base.toFixed(2) }, { h: 'Window ₹', num: true, get: r => r.win.toFixed(2) },
                { h: 'Change %', num: true, get: r => pct(r.chgpct), cls: r => r.impact >= 0 ? 'good' : 'bad' },
                { h: 'Qty', num: true, get: r => qty(r.wq) },
                { h: 'Saved / (Paid more)', num: true, get: r => inr(r.impact), cls: r => r.impact >= 0 ? 'good' : 'bad' },
              ]}
              rows={sec.cost}
              searchable placeholder="Search item / vendor…"
            />
          </>
        )}
        {subtab === 'rejection' && section === 'MAIN' && (
          <>
            <h3 className="ov-subh">By category</h3>
            <Table
              cols={[
                { h: 'Category', get: r => r.k }, { h: 'Ordered', num: true, get: r => qty(r.ord) },
                { h: 'Received', num: true, get: r => qty(r.recd) }, { h: 'Rejected', num: true, get: r => qty(r.rej) },
                { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
              ]}
              rows={[...sec.cat].sort((a, b) => b.rej - a.rej)}
            />
            <h3 className="ov-subh">By vendor</h3>
            <Table
              cols={[
                { h: 'Vendor', get: r => r.k }, { h: 'Received', num: true, get: r => qty(r.recd) },
                { h: 'Rejected', num: true, get: r => qty(r.rej) },
                { h: 'Rej %', num: true, get: r => pct(r.rejrate), cls: r => r.rejrate >= 10 ? 'bad' : r.rejrate >= 5 ? 'mid' : '' },
              ]}
              rows={[...sec.vend].filter(v => v.rej > 0).sort((a, b) => b.rej - a.rej)}
            />
          </>
        )}
        {subtab === 'catvend' && section === 'MAIN' && (
          <Table
            cols={[
              { h: 'Category', get: r => r.cat }, { h: 'Vendor', get: r => r.vendor }, { h: 'SKUs', num: true, get: r => r.skus },
              { h: 'Ordered', num: true, get: r => qty(r.ord) }, { h: 'Received', num: true, get: r => qty(r.recd) },
              { h: 'Value (ex-GST)', num: true, get: r => inr(r.val) },
            ]}
            rows={sec.catVend}
            searchable placeholder="Search category / vendor…"
          />
        )}
      </div>
      <style jsx global>{styles}</style>
    </div>
  );
}

function rejAll(d) {
  const rej = d.MAIN.meta.rej + d.PKG.meta.rej + d.CERT.meta.rej;
  const recd = d.MAIN.meta.recd + d.PKG.meta.recd + d.CERT.meta.recd;
  return rateOf(rej, recd);
}

/* ---------- styles (warm-paper dashboard aesthetic) ---------- */
const styles = `
.ov-root{--bg:#F7F5EF;--card:#FFFDF7;--line:#E7E1D4;--ink:#3D3A32;--mut:#8C8676;--accent:#8A5A2B;--accentbg:#F0E7D8;--plum:#6B3FA0;--gold:#9C6B1F;--good:#2E7D4F;--bad:#9E2B25;--mid:#B4791F;
  background:var(--bg);color:var(--ink);padding:20px 22px;min-height:100%;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-feature-settings:'tnum' 1;}
.ov-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:360px;color:var(--mut);}
.ov-spinner{width:30px;height:30px;border:3px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:ovspin .8s linear infinite;}
@keyframes ovspin{to{transform:rotate(360deg)}}
.ov-err{text-align:center;color:var(--bad);}
.ov-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.ov-head h1{font-size:30px;font-weight:700;letter-spacing:-.02em;margin:2px 0;}
.ov-eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);font-weight:600;}
.ov-headright{display:flex;align-items:center;gap:10px;}
.ov-asof{font-size:11px;color:var(--mut);}
.ov-btn{background:var(--accent);color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;}
.ov-btn:hover{filter:brightness(1.06);}
.ov-back{background:none;border:none;color:var(--accent);font-size:13px;font-weight:600;cursor:pointer;padding:0;margin-bottom:4px;}
.ov-head{position:sticky;top:0;z-index:20;background:var(--bg);padding-top:6px;}
.ov-closebtn{background:var(--card);border:1px solid var(--line);border-radius:8px;width:34px;height:34px;font-size:20px;line-height:1;color:var(--mut);cursor:pointer;flex:none;}
.ov-closebtn:hover{border-color:var(--accent);color:var(--accent);}
.ov-cardhead{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ov-cardhead h3{margin:0;}
.ov-cardclose{background:none;border:none;font-size:20px;line-height:1;color:var(--mut);cursor:pointer;padding:0 4px;border-radius:6px;}
.ov-cardclose:hover{color:var(--accent);}
.ov-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:18px;}
.ov-kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;}
.ov-kpi-val{font-size:26px;font-weight:700;letter-spacing:-.02em;}
.ov-kpi-lbl{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:600;margin-top:4px;}
.ov-kpi-sub{font-size:12px;color:var(--mut);margin-top:2px;}
.ov-kpi.accent .ov-kpi-val{color:var(--accent);}
.ov-kpi.good .ov-kpi-val{color:var(--good);}
.ov-kpi.warn .ov-kpi-val{color:var(--bad);}
.ov-sections{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px;}
.ov-seccard{text-align:left;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:16px 18px;cursor:pointer;transition:transform .12s,box-shadow .12s;}
.ov-seccard.plum{border-left-color:var(--plum);} .ov-seccard.gold{border-left-color:var(--gold);}
.ov-seccard:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.06);}
.ov-seccard-h{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);font-weight:700;}
.ov-seccard-val{font-size:24px;font-weight:700;margin:6px 0;letter-spacing:-.02em;}
.ov-seccard-meta{display:flex;gap:12px;font-size:12px;color:var(--mut);}
.ov-seccard-cta{margin-top:10px;font-size:12px;font-weight:600;color:var(--accent);}
.ov-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
@media(max-width:720px){.ov-two{grid-template-columns:1fr;}}
.ov-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;}
.ov-card h3{font-size:13px;font-weight:700;margin:0 0 8px;letter-spacing:-.01em;}
.ov-tablewrap{overflow-x:auto;}
.ov-table{width:100%;border-collapse:collapse;font-size:13px;}
.ov-table th{text-align:left;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);font-weight:700;padding:7px 10px;border-bottom:1px solid var(--line);white-space:nowrap;}
.ov-table td{padding:7px 10px;border-bottom:1px solid var(--line);white-space:nowrap;}
.ov-table th.r,.ov-table td.r{text-align:right;}
.ov-table tbody tr:hover{background:var(--accentbg);}
.ov-table td.good{color:var(--good);font-weight:600;} .ov-table td.bad{color:var(--bad);font-weight:600;} .ov-table td.mid{color:var(--mid);font-weight:600;}
.ov-table tfoot td{padding:8px 10px;font-weight:700;border-top:2px solid var(--ink);}
.ov-subnav{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;border-bottom:1px solid var(--line);}
.ov-subtab{background:none;border:none;border-bottom:2px solid transparent;padding:8px 12px;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;}
.ov-subtab.on{color:var(--accent);border-bottom-color:var(--accent);}
.ov-segwrap{display:flex;background:var(--accentbg);border-radius:8px;padding:3px;}
.ov-seg{background:none;border:none;padding:6px 12px;font-size:12px;font-weight:600;color:var(--mut);border-radius:6px;cursor:pointer;}
.ov-seg.on{background:var(--card);color:var(--accent);box-shadow:0 1px 3px rgba(0,0,0,.08);}
.ov-detailbody .ov-tablewrap{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 8px;margin-bottom:14px;}
.ov-subh{font-size:13px;font-weight:700;margin:6px 2px 8px;}
.ov-costbar{display:flex;gap:18px;margin-bottom:12px;font-size:14px;font-weight:700;}
.ov-costbar .good{color:var(--good);} .ov-costbar .bad{color:var(--bad);}
.ov-note{font-size:11.5px;color:var(--mut);line-height:1.5;margin-top:8px;}
.ov-table tr.clickable{cursor:pointer;}
.ov-table tr.clickable:hover td{background:var(--accentbg);}
.ov-table tr.clickable td:first-child{position:relative;}
.ov-table tr.clickable:hover td:first-child{color:var(--accent);font-weight:600;}
.ov-drillhint{font-size:11px;color:var(--mut);margin-top:8px;font-style:italic;}
.ov-searchrow{display:flex;align-items:center;gap:8px;padding:6px 4px 10px;position:relative;}
.ov-searchicon{color:var(--mut);font-size:15px;}
.ov-search{flex:1;max-width:340px;padding:7px 11px;border:1px solid var(--line);border-radius:8px;font-size:13px;font-family:inherit;background:var(--card);color:var(--ink);}
.ov-search:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(138,90,43,.12);}
.ov-searchcount{font-size:11.5px;color:var(--mut);}
.ov-searchclear{border:none;background:none;color:var(--mut);font-size:18px;line-height:1;cursor:pointer;padding:0 4px;}
.ov-searchclear:hover{color:var(--accent);}
.ov-monthbar{display:flex;gap:6px;flex-wrap:wrap;margin:-6px 0 16px;}
.ov-month{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:12.5px;font-weight:600;color:var(--mut);cursor:pointer;transition:all .12s;}
.ov-month:hover{border-color:var(--accent);color:var(--accent);}
.ov-month.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.ov-month.cum{margin-left:6px;border-style:dashed;}
.ov-month.cum.on{border-style:solid;}
.ov-empty{background:#FBF4E9;border:1px solid #E7CfA0;color:#8a6a2b;border-radius:10px;padding:12px 14px;font-size:13px;margin:6px 0 12px;}
`;
