import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';

// ── SKU → Category map ───────────────────────────────────────────────────────
// Using var (not const) to avoid temporal dead zone in bundled output
/* eslint-disable no-var */
var SKU_CAT_MAP = {"BP_0012":"Bracelets and Pendants","BP_0035":"Bracelets and Pendants","BP_0037":"Bracelets and Pendants","BP_0039":"Bracelets and Pendants","BP_0040":"Bracelets and Pendants","BP_0044":"Bracelets and Pendants","BP_0045":"Bracelets and Pendants","BP_0054":"Bracelets and Pendants","BP_0055":"Bracelets and Pendants","BP_0056":"Bracelets and Pendants","BP_0060":"Bracelets and Pendants","BP_0068":"Bracelets and Pendants","BP_0074":"Bracelets and Pendants","BP_0077":"Bracelets and Pendants","BP_0084":"Bracelets and Pendants","BP_0086":"Bracelets and Pendants","BP_0095":"Bracelets and Pendants","BP_0205":"Bracelets and Pendants","BP_0309":"Bracelets and Pendants","BP_0323":"Bracelets and Pendants","BP_0324":"Bracelets and Pendants","BP_0360":"Bracelets and Pendants","BP_0372":"Bracelets and Pendants","BP_0374":"Bracelets and Pendants","BP_0375":"Bracelets and Pendants","BP_0386":"Bracelets and Pendants","BP_0388":"Bracelets and Pendants","BP_0389":"Bracelets and Pendants","BP_0390":"Bracelets and Pendants","BP_0391":"Bracelets and Pendants","BP_0395":"Bracelets and Pendants","BP_0398":"Bracelets and Pendants","BP_0399":"Bracelets and Pendants","BP_0400":"Bracelets and Pendants","BP_0401":"Bracelets and Pendants","BP_0402":"Bracelets and Pendants","BP_0403":"Bracelets and Pendants","BP_0404":"Bracelets and Pendants","BP_0405":"Bracelets and Pendants","BP_0406":"Bracelets and Pendants","BP_0407":"Bracelets and Pendants","BP_0408":"Bracelets and Pendants","BP_0409":"Bracelets and Pendants","BP_0411":"Crystal","BP_0412":"Bracelets and Pendants","BP_0413":"Bracelets and Pendants","BP_0414":"Bracelets and Pendants","BP_0415":"Bracelets and Pendants","BP_0416":"Bracelets and Pendants","BP_0417":"Bracelets and Pendants","BP_0418":"Bracelets and Pendants","BP_0420":"Bracelets and Pendants","BP_0421":"Bracelets and Pendants","BP_0422":"Bracelets and Pendants","BP_0425":"Bracelets and Pendants","BP_0426":"Bracelets and Pendants","BP_0427":"Bracelets and Pendants","BP_0428":"Bracelets and Pendants","BP_0429":"Bracelets and Pendants","BP_0430":"Bracelets and Pendants","BP_0431":"Bracelets and Pendants","BP_0432":"Bracelets and Pendants","BP_0433":"Bracelets and Pendants","BP_0434":"Bracelets and Pendants","BP_0435":"Bracelets and Pendants","BP_0436":"Bracelets and Pendants","BP_0437":"Bracelets and Pendants","BP_0438":"Bracelets and Pendants","BP_0439":"Bracelets and Pendants","BP_0440":"Bracelets and Pendants","BP_0441":"Bracelets and Pendants","BP_0442":"Bracelets and Pendants","BP_0443":"Bracelets and Pendants","BP_0444":"Bracelets and Pendants","BP_0445":"Bracelets and Pendants","BP_0446":"Bracelets and Pendants","BP_0447":"Bracelets and Pendants","BP_0448":"Bracelets and Pendants","BP_0449":"Bracelets and Pendants","BP_0450":"Bracelets and Pendants","BP_0451":"Bracelets and Pendants","BP_0452":"Bracelets and Pendants","BP_0453":"Bracelets and Pendants","BP_0454":"Bracelets and Pendants","BP_0456":"Bracelets and Pendants","BP_0457":"Bracelets and Pendants","BP_0458":"Bracelets and Pendants","BP_0459":"Bracelets and Pendants","BP_0460":"Bracelets and Pendants","BP_0461":"Bracelets and Pendants","BP_0462":"Bracelets and Pendants","BP_0463":"Bracelets and Pendants","BP_0464":"Bracelets and Pendants","BP_0465":"Bracelets and Pendants","BP_0466":"Bracelets and Pendants","BP_0467":"Bracelets and Pendants","BP_0468":"Bracelets and Pendants","BP_0469":"Bracelets and Pendants","BP_0470":"Bracelets and Pendants","BP_2001":"Bracelets and Pendants","BP_2002":"Bracelets and Pendants","BP_2003":"Bracelets and Pendants","BP_2004":"Bracelets and Pendants","CRY_0148":"Crystal","CRY_0149":"Crystal","CRY_0150":"Crystal","CRY_0153":"Crystal","CRY_0156":"Crystal","CRY_0157":"Crystal","CRY_0158":"Crystal","CRY_0160":"Crystal","CRY_0161":"Crystal","CRY_0168":"Crystal","CRY_0169":"Crystal","CRY_0170":"Crystal","CRY_0171":"Crystal","CRY_0172":"Crystal","CRY_0184":"Crystal","CRY_0185":"Crystal","CRY_0186":"Crystal","CRY_0187":"Crystal","CRY_0188":"Crystal","CRY_0204":"Crystal","CRY_0205":"Crystal","CRY_0206":"Crystal","CRY_0207":"Crystal","CRY_0221":"Crystal","CRY_0222":"Crystal","CRY_0223":"Crystal","CRY_0232":"Crystal","CRY_0233":"Crystal","CRY_0234":"Crystal","CRY_0235":"Crystal","CRY_0236":"Crystal","CRY_0238":"Crystal","CRY_0239":"Crystal","CRY_0241":"Crystal","CRY_0243":"Crystal","CRY_0245":"Crystal","CRY_213":"Crystal","CRY_214":"Crystal","F_0012":"Frame","F_0013":"Frame","F_0015":"Frame","F_0021":"Frame","F_0024":"Frame","F_0025":"Frame","F_0026":"Frame","F_0027":"Frame","F_0028":"Frame","F_0030":"Frame","F_1007":"Frame","M_1003":"Murti","M_1008":"Murti","M_1017":"Murti","M_1026":"Murti","M_1030":"Murti","M_1032":"Murti","M_1033":"Murti","M_1035":"Murti","M_1036":"Murti","M_1037":"Murti","M_1040":"Murti","RD_0122_01":"Rudraksha","RD_0122_03":"Rudraksha","RD_0122_04":"Rudraksha","RD_0122_05":"Rudraksha","RD_0122_06":"Rudraksha","RD_0122_07":"Rudraksha","RD_0122_GM":"Rudraksha","RD_0123_5":"Rudraksha","RD_0123_5_05":"Rudraksha","RD_0123_5_07":"Rudraksha","RD_0123_7":"Rudraksha","RD_0126":"Rudraksha","RD_0128":"Rudraksha","RD_0144_07":"Rudraksha","RD_0144_SHP":"Rudraksha","RD_0144_SP":"Rudraksha","SEL_0001":"Selenite","SEL_0004":"Selenite","VST_1002":"Vastu","VST_1003":"Vastu","VST_1004":"Vastu","VST_1005":"Vastu","VST_1006":"Vastu","VST_1007":"Vastu","VST_1008":"Vastu","VST_1009":"Vastu","VST_1013":"Vastu","WH_2001":"Wall Hanging","WJ_0001":"Womens Jewellery","WJ_0002":"Womens Jewellery","WJ_0003":"Womens Jewellery","WJ_0004":"Womens Jewellery","WJ_0005":"Womens Jewellery","WJ_0006":"Womens Jewellery","WJ_0007":"Womens Jewellery","WJ_0009":"Womens Jewellery","WJ_0010":"Womens Jewellery"};

// ── helpers ─────────────────────────────────────────────────────────────────
function rnd(v) { return Math.round(v || 0); } // safe round for display──
function num(v) { const n = parseFloat(String(v || 0).replace(/,/g, '')); return isNaN(n) ? 0 : n; }
function fmtDate(d) { return d ? String(d).split('T')[0] : '—'; }

const BUCKETS = [
  { label: 'DOC > 90',  min: 91, max: Infinity },
  { label: 'DOC 60–90', min: 61, max: 90 },
  { label: 'DOC 30–60', min: 31, max: 60 },
  { label: 'DOC 15–30', min: 16, max: 30 },
  { label: 'DOC < 15',  min: 0,  max: 15 },
];

function getAction(r) {
  const d = r.doc;
  if (d === 0 && r.inv === 0) return { label: 'Procure now', cls: 'ab-procure-urgent' };
  if (d <= 15)  return { label: 'Procure',    cls: 'ab-procure'   };
  if (d <= 30)  return { label: 'Watch',      cls: 'ab-watch'     };
  if (d <= 60)  return { label: 'Healthy',    cls: 'ab-healthy'   };
  if (d <= 90)  return { label: 'Overstock',  cls: 'ab-overstock' };
  if (d <= 180) return { label: 'Liquidate',  cls: 'ab-liquidate' };
  return               { label: 'Dead stock', cls: 'ab-deadstock'  };
}

function isSpike(r) { return r.drr7 > 0 && r.drr30 > 0 && (r.drr7 / r.drr30) >= 1.5; }
function isDeclining(r) {
  // 7d DRR must be lower than BOTH 15d and 30d, and there must be some sales history
  return r.drr30 > 0 && r.drr7 < r.drr15 && r.drr7 < r.drr30;
}
function spikePriority(r) { const rt = r.drr7 / r.drr30; return (rt >= 3 || r.doc < 15) ? 1 : rt >= 2 ? 2 : 3; }

function docGradColor(doc) {
  const t = Math.min(doc / 15, 1);
  return `rgb(${Math.round(139 + (252 - 139) * t)},${Math.round(28 + (235 - 28) * t)},${Math.round(28 + (235 - 28) * t)})`;
}

// ── sub-components ────────────────────────────────────────────────────────────
function ActionBadge({ r }) {
  const a = getAction(r);
  return <span className={`badge ${a.cls}`}>{a.label}</span>;
}

function DocBadge({ doc }) {
  if (doc > 60)  return <span className="badge" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(192,120,32,.3)' }}>{doc}d</span>;
  if (doc > 30)  return <span className="badge" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(192,120,32,.2)' }}>{doc}d</span>;
  if (doc > 15)  return <span className="badge" style={{ background: 'var(--blue-dim)',  color: 'var(--blue)',  border: '1px solid rgba(26,95,165,.25)' }}>{doc}d</span>;
  const bg = docGradColor(doc);
  return <span className="badge" style={{ background: bg, color: doc < 5 ? '#FFE0E0' : '#3A0A0A', border: `1px solid ${bg}` }}>{doc}d</span>;
}

function StatusPill({ status }) {
  if (status === 'COMPLETE')               return <span className="sp-comp">Complete</span>;
  if (status === 'APPROVED')               return <span className="sp-appr">Approved</span>;
  if (status === 'WAITING_FOR_APPROVAL')   return <span className="sp-wait">Pending</span>;
  return <span className="sp-wait">{status}</span>;
}

function POCell({ r, poBySkuMap, onOpen }) {
  const pos  = poBySkuMap[r.sku] || [];
  const open = pos.filter(p => p.pending > 0);
  if (!pos.length) return <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>—</span>;
  if (open.length) return <button className="po-btn" onClick={() => onOpen(r.sku, r.name)}>{open.length} open PO{open.length !== 1 ? 's' : ''}</button>;
  return <button className="po-btn-none" onClick={() => onOpen(r.sku, r.name)}>all received</button>;
}

// ── main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [inv,       setInv]       = useState([]);
  const [poBySkuMap, setPoBySkuMap] = useState({});
  const [grnData,   setGrnData]   = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [status,    setStatus]    = useState('idle'); // idle | loading | ok | error

  const [activeTab,   setActiveTab]   = useState('doc');
  const [catFilter,   setCatFilter]   = useState('');
  const [poSearch,    setPoSearch]    = useState('');
  const [poStatusF,   setPoStatusF]   = useState('');
  const [skuPanel,    setSkuPanel]    = useState(null);  // { cat, bucketIdx }
  const [poPanel,     setPoPanel]     = useState(null);  // { sku, name }
  const [toast,       setToast]       = useState(null);
  const [dataSource,  setDataSource]  = useState('mcp');   // 'mcp' | 'csv'
  const [invLoaded,   setInvLoaded]   = useState(false);
  const [poLoaded,    setPoLoaded]    = useState(false);

  // ── toast ──
  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── CSV helpers ──
  function parseCSV(text) {
    const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n');
    if (lines.length < 2) return [];
    function parseLine(line) {
      const vals=[]; let cur='',inQ=false,i=0;
      while(i<line.length){const ch=line[i];if(ch==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i+=2;continue;}inQ=!inQ;}else if(ch===','&&!inQ){vals.push(cur);cur='';}else cur+=ch;i++;}
      vals.push(cur); return vals;
    }
    const headers=parseLine(lines[0]).map(h=>h.trim());
    return lines.slice(1).filter(l=>l.trim()).map(line=>{const vals=parseLine(line);const obj={};headers.forEach((h,i)=>{obj[h]=(vals[i]??'').trim();});return obj;});
  }

  function handleInvCSV(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = parseCSV(e.target.result);
        const skuMap = new Map();
        rows.forEach(r => {
          const sku = (r['Item SKU Code']||'').trim();
          if (!sku) return;
          skuMap.set(sku, {
            sku, name:(r['Item Type Name']||sku).trim(), cat:SKU_CAT_MAP[sku]||r['Category']||'Uncategorised',
            drr7:Math.round(num(r['Last 7 days DRR'])), drr15:Math.round(num(r['Last 15 days DRR'])), drr30:Math.round(num(r['Last 30 days DRR'])),
            drrMax:Math.round(num(r['DRR Max'])), inv:num(r['Inventory']), openPO:num(r['Open Purchase']), doc:Math.round(num(r['Days of Cover'])),
          });
        });
        setInv(Array.from(skuMap.values()).map(r => ({
          ...r,
          drr7:   Math.round(r.drr7   || 0),
          drr15:  Math.round(r.drr15  || 0),
          drr30:  Math.round(r.drr30  || 0),
          drrMax: Math.round(r.drrMax || 0),
        })));
        setInvLoaded(true); setDataSource('csv'); setStatus('ok');
        showToast(`✓ ${skuMap.size} SKUs loaded from ${file.name}`, 'ok');
      } catch(err) { showToast('CSV parse error: '+err.message,'err'); }
    };
    reader.readAsText(file);
  }

  function handlePOCSV(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = parseCSV(e.target.result);
        const bySkuMap = {};
        rows.forEach(r => {
          // Support both old format (item_skucode) and new Unicommerce export format (Item SkuCode)
          const sku = (r['Item SkuCode'] || r['item_skucode'] || '').trim();
          if (!sku) return;
          if (!bySkuMap[sku]) bySkuMap[sku] = [];
          bySkuMap[sku].push({
            po:       (r['PO Code']   || r['po_code']   || '—').trim(),
            vendor:   (r['Vendor Name'] || r['vendor_name'] || '—').trim(),
            poDate:   (r['Created']   || r['created']   || '—').split(' ')[0],
            delDate:  (r['Delivery Date'] || r['delivery_date'] || '—').split(' ')[0],
            ordered:  num(r['Order Quantity']    || r['order_quantity']    || 0),
            rcvd:     num(r['Recieved Quantity'] || r['recieved_quantity'] || 0),
            rejected: num(r['Rejected Quantity'] || r['rejected_quantity'] || 0),
            pending:  num(r['Pending Quantity']  || r['pending_quantity']  || 0),
            ageing:   num(r['PO Ageing (Days)']  || 0),
            pctPending: (r['% Pending'] || '0'),
            unitPrice:num(r['Unit Price'] || 0),
            total:    num(r['Total'] || 0),
            status:   (r['Purchase Order Status'] || r['purchase_order_status'] || 'APPROVED').toUpperCase().replace(/ /g,'_'),
            itemName: (r['Item Type Name'] || r['item_type_name'] || sku).trim(),
            category: (r['Category'] || '').trim(),
            facility: (r['Facility'] || '').trim(),
          });
        });
        setPoBySkuMap(bySkuMap);
        const total = Object.values(bySkuMap).flat().length;
        setPoLoaded(true); setDataSource('csv');
        showToast(`✓ ${total} PO lines loaded from ${file.name}`, 'ok');
      } catch(err) { showToast('CSV parse error: '+err.message,'err'); }
    };
    reader.readAsText(file);
  }

  function clearCSV() {
    setInv([]); setPoBySkuMap([]); setGrnData([]);
    setInvLoaded(false); setPoLoaded(false); setDataSource('mcp'); setStatus('idle');
    showToast('Data cleared','ok');
  }

  // ── Fetch with client-side 24h cache ──
  const fetchAll = useCallback(async (forceFullFetch = false) => {
    setLoading(true);
    setStatus('loading');

    const FACILITIES = ['astrotalk', 'MSKT_FZP', 'Emiza_MMB', 'AT_global'];
    const CACHE_KEY = 'dashboard_cache_v1';
    const FULL_FETCH_MS = 24 * 60 * 60 * 1000; // 24 hours

    // Check if full fetch needed (>24h since last)
    let needFull = forceFullFetch;
    if (!needFull) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts } = JSON.parse(cached);
          needFull = (Date.now() - ts) >= FULL_FETCH_MS;
        } else {
          needFull = true;
        }
      } catch { needFull = true; }
    }

    showToast(needFull ? '📦 Full fetch (30d DRR)…' : '⚡ Delta fetch (48h)…', 'info');

    // Helper: trigger → poll → download one job
    const runJob = async (type, facility) => {
      try {
        const t = await fetch('/api/uniware', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trigger', type, facility }),
        });
        const { jobCode, error: e } = await t.json();
        if (e || !jobCode) return [];
        for (let i = 0; i < 25; i++) {
          await new Promise(r => setTimeout(r, 8000));
          const p = await fetch('/api/uniware', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll', jobCode, facility }),
          });
          const pd = await p.json();
          if (pd.status === 'DONE') {
            const d = await fetch('/api/uniware', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'download', url: pd.url }),
            });
            const { rows } = await d.json();
            return rows || [];
          }
          if (pd.status === 'FAILED') return [];
        }
      } catch {}
      return [];
    };

    try {
      // Step 1: Always get inventory snapshots
      showToast('Fetching inventory…', 'info');
      const invData = {};
      for (const fac of FACILITIES) invData[fac] = await runJob('inventory', fac);

      // Step 2: DRR - full (7d+15d+30d) or delta (48h)
      showToast(needFull ? 'Fetching 7d/15d/30d sales…' : 'Fetching 48h delta…', 'info');
      // Optimized: fetch only 30d export per facility (was 3 jobs per facility)
      // 7d and 15d DRR derived by filtering rows by 'Created' date — saves 8 jobs
      const drr30Data = {};
      for (const fac of FACILITIES) {
        drr30Data[fac] = await runJob('drr30', fac);
      }

      // Step 3: PO - full fetch or from cache
      let poBySkuMapNew = {};
      let cachedPO = {};
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) cachedPO = JSON.parse(cached).po || {};
      } catch {}

      if (needFull) {
        showToast('Fetching POs…', 'info');
        for (const fac of FACILITIES) {
          const rows = await runJob('po', fac);
          rows.forEach(r => {
            const sku = (r['Item SkuCode']||r['item_skucode']||'').trim();
            if (!sku) return;
            if (!poBySkuMapNew[sku]) poBySkuMapNew[sku] = [];
            const n = v => { const x = parseFloat(String(v||0).replace(/,/g,'')); return isNaN(x)?0:x; };
            poBySkuMapNew[sku].push({
              po:(r['PO Code']||'—').trim(), vendor:(r['Vendor Name']||'—').trim(),
              poDate:(r['Created']||'—').split(' ')[0], delDate:(r['Delivery Date']||'—').split(' ')[0],
              ordered:n(r['Order Quantity']), rcvd:n(r['Recieved Quantity']),
              rejected:n(r['Rejected Quantity']), pending:n(r['Pending Quantity']),
              ageing:n(r['PO Ageing (Days)']), unitPrice:n(r['Unit Price']),
              total:n(r['Total']),
              status:(r['Purchase Order Status']||'COMPLETE').toUpperCase().replace(/ /g,'_'),
              itemName:(r['Item Type Name']||sku).trim(), facility: fac,
            });
          });
        }
      } else {
        poBySkuMapNew = cachedPO;
      }

      // Step 4: Calculate DRR & DOC
      // calcDRR: counts rows per SKU within a date window
      const calcDRR = (rows, days) => {
        const cutoff = Date.now() - days * 86400000;
        const c = {};
        (rows||[]).forEach(r => {
          const s = (r['Item SKU Code']||r['Item SkuCode']||'').trim();
          if (!s) return;
          // Filter by Created date for window-specific DRR
          const created = r['Created'] ? new Date(r['Created']).getTime() : 0;
          if (created >= cutoff) c[s] = (c[s]||0) + 1;
        });
        const d = {};
        Object.entries(c).forEach(([s,t]) => { d[s] = rnd(t/days); });
        return d;
      };
      const merge = (...maps) => {
        const m = {};
        maps.forEach(mp => Object.entries(mp||{}).forEach(([k,v]) => { m[k]=(m[k]||0)+v; }));
        Object.keys(m).forEach(k => { m[k] = rnd(m[k]); });
        return m;
      };

      // All 3 DRR windows from the single 30d export — saves 8 export jobs
      const drr7Map  = merge(...FACILITIES.map(f => calcDRR(drr30Data[f], 7)));
      const drr15Map = merge(...FACILITIES.map(f => calcDRR(drr30Data[f], 15)));
      const drr30Map = merge(...FACILITIES.map(f => calcDRR(drr30Data[f], 30)));

      const skuMap = new Map();
      FACILITIES.forEach(fac => {
        (invData[fac]||[]).forEach(r => {
          const sku = (r['Item SkuCode']||r['Item SKU Code']||'').trim();
          if (!sku || !SKU_CAT_MAP[sku]) return;
          const inv = parseFloat(r['Inventory']||0);
          if (skuMap.has(sku)) {
            const e = skuMap.get(sku);
            e.inv += inv;
            e.openPO += parseFloat(r['Open Purchase']||0);
          } else {
            skuMap.set(sku, {
              sku, name:(r['Item Type Name']||sku).trim(),
              cat: SKU_CAT_MAP[sku], inv,
              openPO:parseFloat(r['Open Purchase']||0),
              drr7:0, drr15:0, drr30:0, drrMax:0, doc:0,
            });
          }
        });
      });

      skuMap.forEach((item, sku) => {
        const d7=rnd(drr7Map[sku]||0), d15=rnd(drr15Map[sku]||0), d30=rnd(drr30Map[sku]||0);
        const dMax = Math.max(d7, d15, d30);
        item.drr7=d7; item.drr15=d15; item.drr30=d30; item.drrMax=dMax;
        item.doc = dMax>0 ? rnd(item.inv/dMax) : (item.inv>0 ? 999 : 0);
      });

      const inventory = Array.from(skuMap.values());

      // Save to sessionStorage
      if (needFull) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), po: poBySkuMapNew }));
        } catch {}
      }

      setInv(inventory);
      setPoBySkuMap(poBySkuMapNew);
      setGrnData([]);
      setFetchedAt(new Date().toISOString());
      setErrors({});
      setStatus('ok');
      showToast(`✓ ${inventory.length} SKUs loaded (${needFull?'full':'delta'})`, 'ok');

    } catch (err) {
      setStatus('error');
      showToast('Fetch failed: ' + err.message, 'err');
    } finally {
      setLoading(false);
    }
  }, [showToast]);


  // Auto-fetch disabled — click 'Refresh from Uniware' manually when MCP token is ready
  // useEffect(() => { fetchAll(); }, []);

  // ── derived data (all in one block to prevent bundler reordering TDZ) ──
  var whitelistedInv = inv.filter(r => SKU_CAT_MAP[r.sku]);
  var cats        = [...new Set(whitelistedInv.map(r => r.cat))].sort();
  var filteredInv = catFilter ? whitelistedInv.filter(r => r.cat === catFilter) : whitelistedInv;
  var spikes      = whitelistedInv.filter(isSpike).map(r => ({ ...r, ratio: r.drr7 / r.drr30, priority: spikePriority(r) })).sort((a, b) => a.priority - b.priority || b.ratio - a.ratio);
  var declining   = whitelistedInv.filter(isDeclining).map(r => ({ ...r, dropRatio: r.drr30 > 0 ? rnd((1 - r.drr7 / r.drr30) * 100) : 0 })).sort((a, b) => b.dropRatio - a.dropRatio);
  var pn  = whitelistedInv.filter(r => r.doc === 0 && r.inv === 0).length;
  var pc  = whitelistedInv.filter(r => r.doc > 0 && r.doc <= 15).length;
  var ovs = whitelistedInv.filter(r => r.doc > 60 && r.doc <= 180).length;
  var ds  = whitelistedInv.filter(r => r.doc > 180).length;
  var sp  = spikes.length;
  var ol  = Object.values(poBySkuMap).flat().filter(p => p.pending > 0).length;

  // PO tab rows
  var allPORows = Object.entries(poBySkuMap).flatMap(([sku, pos]) => pos.map(p => ({ ...p, sku })));
  var filteredPO = allPORows
    .filter(r => {
      const q = poSearch.toLowerCase();
      return (!q || r.sku.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q) || (r.po || '').toLowerCase().includes(q))
          && (!poStatusF || r.status === poStatusF);
    })
    .sort((a, b) => { const ord = { WAITING_FOR_APPROVAL: 0, APPROVED: 1, COMPLETE: 2 }; return (ord[a.status] || 1) - (ord[b.status] || 1) || b.pending - a.pending; });

  // SKU panel items
  var skuPanelItems = [];
  if (skuPanel) {
    const { cat, bucketIdx } = skuPanel;
    const isSpikeBucket = bucketIdx === 5;
    skuPanelItems = inv.filter(r => {
      if (r.cat !== cat) return false;
      if (isSpikeBucket) return isSpike(r);
      const d = r.doc;
      if (bucketIdx === 0) return d > 90;
      if (bucketIdx === 1) return d >= 61 && d <= 90;
      if (bucketIdx === 2) return d >= 31 && d <= 60;
      if (bucketIdx === 3) return d >= 16 && d <= 30;
      if (bucketIdx === 4) return d >= 0  && d <= 15;
      return false;
    });
    if (isSpikeBucket) skuPanelItems.sort((a, b) => spikePriority(a) - spikePriority(b));
    else skuPanelItems.sort((a, b) => a.doc - b.doc); // ascending DOC
  }

  var invMap = Object.fromEntries(whitelistedInv.map(r => [r.sku, r.name]));

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Weekly Review Dashboard</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="shell">
        {/* TOP BAR */}
        <div className="top-bar">
          <div className="brand">
            <div className="brand-icon"><i className="ti ti-chart-dots-3" /></div>
            <div className="brand-text">
              <h1>Weekly Review Dashboard</h1>
              <p>inventory · doc · drr · actions · pos · facility: MSKT_FZP</p>
            </div>
          </div>
          <div className="top-right">
            <button className="btn-refresh" onClick={() => fetchAll(false)} disabled={loading}>
              <i className={`ti ${loading ? 'ti-loader-2 spin' : 'ti-refresh'}`} style={{ fontSize: 13 }} />
              {loading ? 'Fetching…' : 'Refresh from Uniware'}
            </button>
            <button className="btn-refresh" onClick={() => fetchAll(true)} disabled={loading} title="Force full 30-day fetch" style={{fontSize:11,padding:'7px 10px'}}>
              <i className="ti ti-refresh-alert" style={{ fontSize: 13 }} />
              Full fetch
            </button>
            <div className="time-chip">
              <span className={`live-dot ${status === 'loading' ? 'fetching' : status === 'error' ? 'error' : status === 'ok' ? '' : 'idle'}`} />
              <span>
                {status === 'idle'    && 'Upload CSV or click Refresh from Uniware'}
                {status === 'loading' && 'Fetching live data…'}
                {status === 'error'   && 'MCP unavailable — use CSV upload'}
                {status === 'ok'      && fetchedAt && `Live · ${new Date(fetchedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} IST`}
              </span>
            </div>
          </div>
        </div>

        {/* CSV UPLOAD ZONE */}
        <div className="upload-zone" style={{marginBottom:'1.25rem'}}>
          <div className="upload-inner">
            <div className="upload-left">
              <div className="upload-icon"><i className="ti ti-upload" /></div>
              <div className="upload-text">
                <h3>Upload Unicommerce CSV exports <span style={{fontSize:10,fontWeight:400,color:'var(--text3)',marginLeft:6}}>(fallback while MCP is being fixed)</span></h3>
                <p>Inventory reorder sheet + GRN / PO details export</p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <label className={`slot ${invLoaded?'loaded':''}`} style={{cursor:'pointer'}}>
                <i className="ti ti-table" style={{fontSize:14,color:'var(--blue)'}} />
                <span className="sl">Inventory CSV</span>
                <span className="ss">{invLoaded?'✓ loaded':'click to upload'}</span>
                <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files[0]&&handleInvCSV(e.target.files[0])} />
              </label>
              <label className={`slot ${poLoaded?'loaded':''}`} style={{cursor:'pointer'}}>
                <i className="ti ti-clipboard-list" style={{fontSize:14,color:'var(--amber-mid)'}} />
                <span className="sl">PO / GRN CSV</span>
                <span className="ss">{poLoaded?'✓ loaded':'click to upload'}</span>
                <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files[0]&&handlePOCSV(e.target.files[0])} />
              </label>
              <button className="clear-btn" onClick={clearCSV}><i className="ti ti-refresh" style={{fontSize:13}} />Clear</button>
            </div>
          </div>
          <div className="upload-hint">
            <span className="hl">Inventory cols:</span>
            {['Item SKU Code','Item Type Name','Category','Last 7 days DRR','Last 15 days DRR','Last 30 days DRR','DRR Max','Inventory','Open Purchase','Days of Cover'].map(c=><span key={c} className="cc">{c}</span>)}
            <span className="hl" style={{marginLeft:6}}>PO cols:</span>
            {['PO Code','Item SkuCode','Item Type Name','Vendor Name','Created','Delivery Date','Order Quantity','Recieved Quantity','Rejected Quantity','Pending Quantity','Purchase Order Status','Unit Price','Total'].map(c=><span key={c} className="cc">{c}</span>)}
          </div>
        </div>

        {/* ERROR STRIP — only show if no CSV data loaded */}
        {Object.values(errors).some(Boolean) && inv.length === 0 && (
          <div className="error-strip">
            <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} />
            <span>Partial data: {Object.entries(errors).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>
          </div>
        )}

        {/* SKELETON / LOADING */}
        {loading && inv.length === 0 && (
          <div className="skeleton-wrap">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        )}

        {/* METRICS */}
        {inv.length > 0 && (
          <div className="metrics">
            {[
              { lbl: 'Procure now',          val: pn,  sub: 'doc=0 · no stock',  cls: 'c-red',    icon: 'ti-alert-circle'   },
              { lbl: 'Procure',              val: pc,  sub: 'doc 1–15 days',     cls: 'c-red',    icon: 'ti-shopping-cart'  },
              { lbl: 'Overstock/Liquidate',  val: ovs, sub: 'doc 61–180 days',   cls: 'c-blue',   icon: 'ti-archive'        },
              { lbl: 'Dead stock',           val: ds,  sub: 'doc > 180 days',    cls: 'c-teal',   icon: 'ti-ban'            },
              { lbl: 'Sales spikes',         val: sp,  sub: '7d drr ≥ 1.5× 30d',cls: 'c-amber',  icon: 'ti-flame'          },
              { lbl: 'Open PO lines',        val: ol,  sub: 'pending delivery',  cls: 'c-green',  icon: 'ti-clipboard-list' },
            ].map(c => (
              <div key={c.lbl} className={`mc ${c.cls}`}>
                <div className="lbl"><i className={`ti ${c.icon}`} style={{ fontSize: 11 }} /> {c.lbl}</div>
                <div className="val">{c.val}</div>
                <div className="sub">{c.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        <div className="tab-bar">
          {[
            { id: 'doc',    icon: 'ti-layout-grid',    label: 'DOC ranges'  },
            { id: 'po',     icon: 'ti-clipboard-list', label: 'Open POs'    },
            { id: 'spikes', icon: 'ti-flame',          label: 'Sales spikes'},
            { id: 'declining', icon: 'ti-trending-down', label: 'Declining'   },
          ].map(t => (
            <button key={t.id} className={`tb ${activeTab === t.id ? 'active' : ''}`} onClick={() => { setActiveTab(t.id); setSkuPanel(null); setPoPanel(null); }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} />{t.label}
            </button>
          ))}
        </div>

        {/* PO PANEL (SKU drill) */}
        {poPanel && (
          <div className="panel-wrap open" style={{ marginBottom: '1.25rem' }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>{poPanel.sku}</h3>
                  <p>{poPanel.name} · {(poBySkuMap[poPanel.sku] || []).length} PO lines · {(poBySkuMap[poPanel.sku] || []).filter(p => p.pending > 0).length} open</p>
                </div>
                <button className="close-btn" onClick={() => setPoPanel(null)}>×</button>
              </div>
              <div className="pb">
                <table className="po-tbl">
                  <thead><tr><th>PO code</th><th>Vendor</th><th>PO date</th><th>Delivery date</th><th style={{ textAlign: 'right' }}>Ordered</th><th style={{ textAlign: 'right' }}>Received</th><th style={{ textAlign: 'right' }}>Pending</th><th>Progress</th><th>Status</th></tr></thead>
                  <tbody>
                    {(poBySkuMap[poPanel.sku] || []).map((r, i) => {
                      const pct = r.ordered > 0 ? Math.round((r.rcvd / r.ordered) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td><span className="po-code-pill">{r.po}</span></td>
                          <td style={{ fontSize: 11, color: 'var(--text2)' }}>{r.vendor}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{r.poDate}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{r.delDate}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{r.ordered.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{r.rcvd.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{r.pending > 0 ? <span className="pending-red">{r.pending.toLocaleString()}</span> : r.pending}</td>
                          <td><div className="pct-lbl">{pct}%</div><div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div></td>
                          <td><StatusPill status={r.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SKU PANEL */}
        {skuPanel && (
          <div className="panel-wrap open" style={{ marginBottom: '1.25rem' }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>{skuPanel.cat} · {skuPanel.bucketIdx === 5 ? 'Spikes' : BUCKETS[skuPanel.bucketIdx]?.label}</h3>
                  <p>{skuPanelItems.length} sku{skuPanelItems.length !== 1 ? 's' : ''} · {skuPanelItems.filter(isSpike).length} spike{skuPanelItems.filter(isSpike).length !== 1 ? 's' : ''}</p>
                </div>
                <button className="close-btn" onClick={() => { setSkuPanel(null); setPoPanel(null); }}>×</button>
              </div>
              <div className="pb">
                <table className="detail">
                  <thead><tr>
                    <th>Action</th><th>SKU</th><th>Item</th>
                    <th className="r">7d DRR</th><th className="r">15d DRR</th><th className="r">30d DRR</th>
                    <th className="r">DOC</th><th className="r">Inventory</th><th>Open POs</th>
                  </tr></thead>
                  <tbody>
                    {skuPanelItems.map((r, i) => {
                      const sp2 = isSpike(r);
                      return (
                        <tr key={i} className={r.doc < 15 ? 'critical-row' : sp2 ? 'spike-row' : ''}>
                          <td><ActionBadge r={r} /></td>
                          <td><span className="sku-code">{r.sku}</span></td>
                          <td><span style={{ fontWeight: 500 }}>{r.name}</span>{sp2 && <span className="spike-tag"><i className="ti ti-flame" />spike</span>}</td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: r.drr7 > r.drr30 ? 700 : 400, color: r.drr7 > r.drr30 ? 'var(--amber-mid)' : 'var(--text2)' }}>{rnd(r.drr7)}</td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{rnd(r.drr15)}</td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{rnd(r.drr30)}</td>
                          <td className="r"><DocBadge doc={r.doc} /></td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{r.inv.toLocaleString()}</td>
                          <td><POCell r={r} poBySkuMap={poBySkuMap} onOpen={(sku, name) => setPoPanel({ sku, name })} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="panel-legend">
                {[
                  { cls: 'ab-procure-urgent', label: 'Procure now', note: 'DOC=0' },
                  { cls: 'ab-procure',        label: 'Procure',     note: '1–15d' },
                  { cls: 'ab-watch',          label: 'Watch',       note: '16–30d' },
                  { cls: 'ab-healthy',        label: 'Healthy',     note: '31–60d' },
                  { cls: 'ab-overstock',      label: 'Overstock',   note: '61–90d' },
                  { cls: 'ab-liquidate',      label: 'Liquidate',   note: '91–180d' },
                  { cls: 'ab-deadstock',      label: 'Dead stock',  note: '>180d'  },
                ].map(a => (
                  <span key={a.cls} className="pl-item">
                    <span className={`badge ${a.cls}`} style={{ fontSize: 9, padding: '1px 6px' }}>{a.label}</span>{a.note}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DOC TAB ── */}
        {activeTab === 'doc' && (
          <div className="card">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="card-title"><i className="ti ti-layout-grid" style={{ fontSize: 15, color: 'var(--blue)' }} />Items by DOC range</span>
                <span className="card-chip">{whitelistedInv.length} skus</span>
              </div>
              <select className="filter-input" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ minWidth: 150 }}>
                <option value="">All categories</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {inv.length === 0
                ? <div className="empty-state"><i className="ti ti-table-off" /><p>{loading ? 'Loading inventory from Uniware…' : 'No inventory data yet — click Refresh'}</p></div>
                : (
                  <table className="matrix">
                    <thead><tr>
                      <th className="cat-th">Category</th>
                      <th>DOC &gt;90</th><th>DOC 60–90</th><th>DOC 30–60</th><th>DOC 15–30</th><th>DOC &lt;15</th>
                      <th><i className="ti ti-flame" style={{ color: 'var(--amber-mid)', fontSize: 11 }} /> Spikes</th>
                    </tr></thead>
                    <tbody>
                      {[...new Set(filteredInv.map(r => r.cat))].sort().map(cat => {
                        const items      = filteredInv.filter(r => r.cat === cat);
                        const spikeItems = items.filter(isSpike);
                        return (
                          <tr key={cat}>
                            <td className="cat-lbl">{cat}</td>
                            {BUCKETS.map((b, bi) => {
                              const m = items.filter(r => {
                                const d = r.doc;
                                if (bi === 0) return d > 90;
                                if (bi === 1) return d >= 61 && d <= 90;
                                if (bi === 2) return d >= 31 && d <= 60;
                                if (bi === 3) return d >= 16 && d <= 30;
                                if (bi === 4) return d >= 0  && d <= 15;
                                return false;
                              });
                              if (!m.length) return <td key={bi}><span className="doc-empty">—</span></td>;
                              if (bi === 4) {
                                const avg = Math.round(m.reduce((s, r) => s + r.doc, 0) / m.length);
                                const bg  = docGradColor(avg);
                                return <td key={bi}><span className="doc-cell" style={{ background: bg, color: avg < 5 ? '#FFE0E0' : '#3A0A0A', borderColor: bg }} onClick={() => { setPoPanel(null); setSkuPanel({ cat, bucketIdx: bi }); }}>{m.length}</span></td>;
                              }
                              return <td key={bi}><span className="doc-cell" onClick={() => { setPoPanel(null); setSkuPanel({ cat, bucketIdx: bi }); }}>{m.length}</span></td>;
                            })}
                            <td>
                              {spikeItems.length
                                ? <span className="spike-pill" onClick={() => { setPoPanel(null); setSkuPanel({ cat, bucketIdx: 5 }); }}><i className="ti ti-flame" style={{ fontSize: 11 }} />{spikeItems.length}</span>
                                : <span className="spike-zero">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
            </div>
            <div className="matrix-footer">
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', marginRight: 4, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--mono)' }}>DOC &lt;15 gradient:</span>
              {[{ bg: '#8B1C1C', label: '0d stockout' }, { bg: '#C03030', label: '5d' }, { bg: '#E88080', label: '10d' }, { bg: '#F5C0C0', label: '14d' }].map(l => (
                <span key={l.label} className="leg-item"><span className="leg-dot" style={{ background: l.bg }} />{l.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── PO TAB ── */}
        {activeTab === 'po' && (
          <div className="card">
            <div className="card-head">
              <span className="card-title"><i className="ti ti-clipboard-list" style={{ fontSize: 15, color: 'var(--blue)' }} />Open purchase orders</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="filter-input" placeholder="Search SKU, vendor, PO…" value={poSearch} onChange={e => setPoSearch(e.target.value)} style={{ width: 185 }} />
                <select className="filter-input" value={poStatusF} onChange={e => setPoStatusF(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="WAITING_FOR_APPROVAL">Pending approval</option>
                  <option value="COMPLETE">Complete</option>
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {allPORows.length === 0
                ? <div className="empty-state"><i className="ti ti-clipboard-off" /><p>{loading ? 'Loading POs from Uniware…' : 'No PO data — click Refresh'}</p></div>
                : (
                  <table className="po-tbl">
                    <thead><tr><th>PO code</th><th>SKU</th><th>Item</th><th>Category</th><th>Vendor</th><th>PO date</th><th>Delivery</th><th style={{ textAlign: 'right' }}>Ordered</th><th style={{ textAlign: 'right' }}>Received</th><th style={{ textAlign: 'right' }}>Rejected</th><th style={{ textAlign: 'right' }}>Pending</th><th style={{ textAlign: 'right' }}>Unit Price</th><th style={{ textAlign: 'right' }}>Total</th><th>Ageing</th><th>Progress</th><th>Status</th></tr></thead>
                    <tbody>
                      {filteredPO.length === 0
                        ? <tr><td colSpan={16} style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>no matching records</td></tr>
                        : filteredPO.map((r, i) => {
                            const pct = r.ordered > 0 ? Math.round((r.rcvd / r.ordered) * 100) : 0;
                            return (
                              <tr key={i}>
                                <td><span className="po-code-pill">{r.po}</span></td>
                                <td><span className="sku-code">{r.sku}</span></td>
                                <td style={{ fontSize: 11, color: 'var(--text2)', maxWidth: 140 }}>{invMap[r.sku] || r.itemName || '—'}</td>
                                <td style={{ fontSize: 11, color: 'var(--text3)' }}>{r.category || '—'}</td>
                                <td style={{ fontSize: 11, color: 'var(--text2)' }}>{r.vendor}</td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{r.poDate}</td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{r.delDate}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{r.ordered.toLocaleString()}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{r.rcvd.toLocaleString()}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: r.rejected > 0 ? 'var(--amber-mid)' : 'var(--text3)' }}>{r.rejected?.toLocaleString() || 0}</td>
                                <td style={{ textAlign: 'right' }}>{r.pending > 0 ? <span className="pending-red">{r.pending.toLocaleString()}</span> : r.pending}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>₹{r.unitPrice?.toLocaleString('en-IN') || '—'}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600 }}>₹{r.total?.toLocaleString('en-IN') || '—'}</td>
                                <td style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: r.ageing > 30 ? 'var(--red-mid)' : 'var(--text3)' }}>{r.ageing || '—'}d</td>
                                <td><div className="pct-lbl">{pct}%</div><div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div></td>
                                <td><StatusPill status={r.status} /></td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        )}

        {/* ── SPIKES TAB ── */}
        {activeTab === 'spikes' && (
          <div className="card">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="card-title"><i className="ti ti-flame" style={{ fontSize: 15, color: 'var(--amber-mid)' }} />Sales spikes</span>
                <span className="card-chip">7d DRR &gt; 15d &amp; 30d · ratio ≥ 1.5×</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {inv.length === 0
                ? <div className="empty-state"><i className="ti ti-flame-off" /><p>{loading ? 'Loading…' : 'No data — click Refresh'}</p></div>
                : spikes.length === 0
                  ? <div className="empty-state"><i className="ti ti-circle-check" style={{ color: 'var(--green)' }} /><p>No spikes detected</p></div>
                  : (
                    <table className="detail">
                      <thead><tr>
                        <th style={{ width: 34 }}>Pri</th><th>Action</th><th>SKU</th><th>Item</th><th>Category</th>
                        <th className="r">7d DRR</th><th className="r">15d DRR</th><th className="r">30d DRR</th>
                        <th className="r">Ratio</th><th className="r">DOC</th><th className="r">Inventory</th><th>Open POs</th>
                      </tr></thead>
                      <tbody>
                        {spikes.map((r, i) => {
                          const rBg  = r.ratio >= 3 ? 'var(--red-dim)' : r.ratio >= 2 ? 'var(--amber-dim)' : 'var(--green-dim)';
                          const rClr = r.ratio >= 3 ? 'var(--red-mid)' : r.ratio >= 2 ? 'var(--amber-mid)' : 'var(--green)';
                          return (
                            <tr key={i} className={r.doc < 15 ? 'critical-row' : 'spike-row'}>
                              <td><span className={`priority-ring pr-${r.priority}`}>{r.priority}</span></td>
                              <td><ActionBadge r={r} /></td>
                              <td><span className="sku-code">{r.sku}</span></td>
                              <td><span style={{ fontWeight: 500 }}>{r.name}</span></td>
                              <td><span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', fontSize: 9 }}>{r.cat}</span></td>
                              <td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--amber-mid)' }}>{rnd(r.drr7)}</td>
                              <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{rnd(r.drr15)}</td>
                              <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{rnd(r.drr30)}</td>
                              <td className="r"><span className="ratio-badge" style={{ background: rBg, color: rClr }}>{r.ratio.toFixed(1)}×</span></td>
                              <td className="r"><DocBadge doc={r.doc} /></td>
                              <td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{r.inv.toLocaleString()}</td>
                              <td><POCell r={r} poBySkuMap={poBySkuMap} onOpen={(sku, name) => setPoPanel({ sku, name })} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
            </div>
          </div>
        )}

        {/* ── GRN TAB ── */}
        {activeTab === 'declining' && (
          <div className="card">
            <div className="card-head">
              <span className="card-title">
                <i className="ti ti-trending-down" style={{ fontSize: 15, color: 'var(--red-mid)' }} />
                Declining Sales
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>7d DRR &lt; 15d DRR and 30d DRR</span>
              </span>
              <span className="card-chip">{declining.length} skus</span>
            </div>
            {declining.length === 0
              ? <div className="empty-state"><i className="ti ti-trending-down" /><p>{loading ? 'Loading…' : 'No declining SKUs — all items are stable or growing'}</p></div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="detail">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>ITEM</th>
                        <th>CATEGORY</th>
                        <th className="r">7D DRR</th>
                        <th className="r">15D DRR</th>
                        <th className="r">30D DRR</th>
                        <th className="r">DROP %</th>
                        <th className="r">INVENTORY</th>
                        <th className="r">DOC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {declining.map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg3)' }}>
                          <td><span className="sku-badge">{r.sku}</span></td>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          <td style={{ color: 'var(--text3)', fontSize: 11 }}>{r.cat}</td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--red-mid)', fontWeight: 700 }}>{rnd(r.drr7)}</td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{rnd(r.drr15)}</td>
                          <td className="r" style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{rnd(r.drr30)}</td>
                          <td className="r">
                            <span style={{
                              background: r.dropRatio > 50 ? 'var(--red-dim)' : r.dropRatio > 25 ? 'var(--amber-dim)' : 'var(--bg3)',
                              color: r.dropRatio > 50 ? 'var(--red-mid)' : r.dropRatio > 25 ? 'var(--amber-mid)' : 'var(--text2)',
                              padding: '2px 7px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600
                            }}>−{r.dropRatio}%</span>
                          </td>
                          <td className="r" style={{ fontFamily: 'var(--mono)' }}>{r.inv.toLocaleString()}</td>
                          <td className="r"><DocBadge doc={r.doc} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && <div className={`toast show ${toast.type}`}>{toast.msg}</div>}

      <style jsx global>{`
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#F2EFE9;--bg2:#FAFAF7;--bg3:#F0EDE6;--bg4:#E8E4DC;
          --border:#D8D3C8;--border2:#C8C2B4;
          --text:#1E1C18;--text2:#5A5649;--text3:#9A9285;
          --blue:#1A5FA5;--blue-dim:#D6E6F7;--blue-mid:#4A8FD4;
          --green:#3B6D11;--green-dim:#DCF0C8;
          --amber:#7A4A08;--amber-dim:#FAEEDA;--amber-mid:#C07820;
          --red:#8B1C1C;--red-dim:#FCEAEA;--red-mid:#C03030;
          --purple:#3C348A;--purple-dim:#E8E6F8;
          --teal:#0F5E44;--teal-dim:#CFF0E4;
          --mono:'JetBrains Mono',monospace;--sans:'Inter',sans-serif;
        }
        body{font-family:var(--sans);color:var(--text);font-size:13px;background:var(--bg);line-height:1.5}
        .shell{padding:1.25rem 1.5rem 2rem;min-height:100vh}
        .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:10px}
        .brand{display:flex;align-items:center;gap:12px}
        .brand-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#1A5FA5,#4A8FD4);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(26,95,165,.25)}
        .brand-icon i{color:#fff;font-size:19px}
        .brand-text h1{font-size:18px;font-weight:700;letter-spacing:-0.5px}
        .brand-text p{font-size:11px;color:var(--text3);font-family:var(--mono);margin-top:1px}
        .top-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .time-chip{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;color:var(--text2);background:var(--bg2);padding:6px 12px;border-radius:20px;border:1px solid var(--border)}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#ccc;flex-shrink:0}
        .live-dot.fetching{background:var(--amber-mid);animation:pulse 1s infinite}
        .live-dot.error{background:var(--red-mid)}
        .live-dot.idle{background:#ccc}
        .live-dot:not(.fetching):not(.error):not(.idle){background:#3B8A2A;box-shadow:0 0 5px rgba(59,138,42,.5)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .btn-refresh{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);font-size:12px;font-family:var(--mono);font-weight:500;cursor:pointer;transition:all .15s}
        .btn-refresh:hover{border-color:var(--blue-mid);color:var(--blue)}
        .btn-refresh:disabled{opacity:.5;cursor:not-allowed}
        .upload-zone{background:var(--bg2);border:1.5px dashed var(--border2);border-radius:14px;padding:1.25rem 1.5rem}
        .upload-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
        .upload-left{display:flex;align-items:center;gap:12px}
        .upload-icon{width:42px;height:42px;border-radius:10px;background:var(--blue-dim);border:1px solid rgba(26,95,165,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .upload-icon i{font-size:20px;color:var(--blue)}
        .upload-text h3{font-size:13px;font-weight:600;margin-bottom:2px}
        .upload-text p{font-size:11px;color:var(--text3);font-family:var(--mono)}
        .slot{display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg3);font-size:11px;font-family:var(--mono);transition:all .15s}
        .slot:hover{border-color:var(--blue-mid);background:var(--blue-dim)}
        .slot .sl{font-weight:500;color:var(--text2)}
        .slot .ss{font-size:10px;color:var(--text3);margin-left:2px}
        .slot.loaded{border-color:var(--green);background:var(--green-dim)}
        .slot.loaded .sl,.slot.loaded .ss{color:var(--green)}
        .clear-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text3);font-size:11px;font-family:var(--mono);cursor:pointer;transition:all .15s}
        .clear-btn:hover{border-color:var(--red-mid);color:var(--red);background:var(--red-dim)}
        .upload-hint{margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:6px;align-items:center}
        .hl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-family:var(--mono)}
        .cc{background:var(--blue-dim);border:1px solid rgba(26,95,165,.2);border-radius:4px;padding:1px 6px;font-size:10px;color:var(--blue);font-family:var(--mono)}
        .spin{animation:spin .8s linear infinite;display:inline-block}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .error-strip{display:flex;align-items:center;gap:8px;background:var(--amber-dim);border:1px solid rgba(192,120,32,.3);color:var(--amber);padding:8px 14px;border-radius:8px;font-size:11px;font-family:var(--mono);margin-bottom:1rem}
        .skeleton-wrap{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:1.25rem}
        .skeleton-card{height:90px;border-radius:12px;background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:1.25rem}
        @media(max-width:720px){.metrics{grid-template-columns:repeat(3,1fr)}}
        .mc{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;position:relative;overflow:hidden}
        .mc::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:12px 12px 0 0}
        .mc.c-blue::after{background:var(--blue-mid)}.mc.c-green::after{background:#4A8A1A}
        .mc.c-amber::after{background:var(--amber-mid)}.mc.c-red::after{background:var(--red-mid)}
        .mc.c-teal::after{background:#1A8A62}.mc.c-purple::after{background:#6058C0}
        .mc .lbl{font-size:9px;font-family:var(--mono);color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em}
        .mc .val{font-size:28px;font-weight:700;letter-spacing:-1px;line-height:1;font-family:var(--mono)}
        .mc .sub{font-size:10px;color:var(--text3);margin-top:7px;font-family:var(--mono)}
        .mc.c-blue .val{color:var(--blue)}.mc.c-green .val{color:var(--green)}
        .mc.c-amber .val{color:var(--amber-mid)}.mc.c-red .val{color:var(--red-mid)}
        .mc.c-teal .val{color:var(--teal)}.mc.c-purple .val{color:var(--purple)}
        .tab-bar{display:flex;gap:4px;margin-bottom:1.25rem;background:var(--bg3);padding:4px;border-radius:10px;width:fit-content;border:1px solid var(--border)}
        .tb{display:flex;align-items:center;gap:7px;padding:7px 16px;font-size:12px;font-family:var(--sans);border:none;border-radius:7px;cursor:pointer;background:none;color:var(--text3);font-weight:500;transition:all .15s}
        .tb:hover{color:var(--text);background:var(--bg4)}
        .tb.active{background:var(--bg2);color:var(--text);border:1px solid var(--border2);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}
        .card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:8px}
        .card-title{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px}
        .card-chip{font-size:10px;padding:2px 8px;background:var(--bg3);color:var(--text3);border-radius:20px;font-weight:500;border:1px solid var(--border);font-family:var(--mono)}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 2rem;gap:12px;text-align:center}
        .empty-state i{font-size:32px;color:var(--text3)}
        .empty-state p{font-size:12px;color:var(--text3);font-family:var(--mono)}
        table.matrix{width:100%;border-collapse:collapse}
        table.matrix th{padding:9px 14px;text-align:center;font-size:9px;font-weight:600;color:var(--text3);white-space:nowrap;background:var(--bg3);letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--border)}
        table.matrix th.cat-th{text-align:left;min-width:160px;padding-left:18px}
        table.matrix td{padding:10px 14px;border-top:1px solid var(--border);text-align:center;vertical-align:middle}
        table.matrix td.cat-lbl{text-align:left;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);padding-left:18px;font-family:var(--mono)}
        table.matrix tbody tr:hover td{background:var(--bg3)}
        .doc-cell{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:28px;padding:0 10px;border:1px solid var(--border2);border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;background:var(--bg3);color:var(--text);font-family:var(--mono);transition:all .15s}
        .doc-cell:hover{border-color:var(--blue-mid);color:var(--blue);background:var(--blue-dim)}
        .doc-empty{color:var(--text3);font-size:13px;font-family:var(--mono)}
        .spike-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;background:var(--amber-dim);color:var(--amber);border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid rgba(192,120,32,.3);transition:all .15s;font-family:var(--mono)}
        .spike-zero{color:var(--text3);font-size:13px;font-family:var(--mono)}
        .matrix-footer{display:flex;gap:14px;flex-wrap:wrap;padding:9px 18px;background:var(--bg3);border-top:1px solid var(--border)}
        .leg-item{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text3);font-family:var(--mono)}
        .leg-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
        .panel-wrap{display:none;margin-bottom:1.25rem}.panel-wrap.open{display:block}
        .panel{background:var(--bg2);border-radius:12px;border:1.5px solid var(--blue-mid);overflow:hidden;box-shadow:0 4px 20px rgba(26,95,165,.12)}
        .panel-head{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 18px 11px;border-bottom:1px solid var(--border)}
        .panel-head h3{font-size:14px;font-weight:700;margin-bottom:3px}
        .panel-head p{font-size:11px;color:var(--text3);font-family:var(--mono)}
        .close-btn{background:var(--bg3);border:1px solid var(--border2);border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:16px;line-height:27px;text-align:center;color:var(--text3);flex-shrink:0}
        .pb{overflow-x:auto}
        table.detail{width:100%;border-collapse:collapse;min-width:680px}
        table.detail th{padding:8px 14px;text-align:left;font-size:9px;font-weight:600;color:var(--text3);background:var(--bg3);white-space:nowrap;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--border);font-family:var(--mono)}
        table.detail th.r{text-align:right}
        table.detail td{padding:9px 14px;border-top:1px solid var(--border);font-size:12px;vertical-align:middle}
        table.detail td.r{text-align:right}
        table.detail tbody tr:hover td{background:var(--bg3)}
        .sku-code{font-family:var(--mono);font-size:11px;color:var(--blue);font-weight:600;white-space:nowrap;background:var(--blue-dim);padding:2px 7px;border-radius:5px;border:1px solid rgba(26,95,165,.15)}
        .spike-tag{display:inline-flex;align-items:center;gap:3px;font-size:9px;color:var(--amber);margin-left:6px;background:var(--amber-dim);padding:1px 6px;border-radius:20px;border:1px solid rgba(192,120,32,.3);font-family:var(--mono);font-weight:600;text-transform:uppercase}
        .badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;font-family:var(--mono);gap:3px}
        .ab-procure-urgent{background:#8B1C1C;color:#FFD0D0;border:1px solid rgba(139,28,28,.5)}
        .ab-procure{background:var(--red-dim);color:var(--red);border:1px solid rgba(192,48,48,.3)}
        .ab-watch{background:var(--amber-dim);color:var(--amber);border:1px solid rgba(192,120,32,.3)}
        .ab-healthy{background:var(--green-dim);color:var(--green);border:1px solid rgba(59,109,17,.3)}
        .ab-overstock{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(26,95,165,.25)}
        .ab-liquidate{background:var(--purple-dim);color:var(--purple);border:1px solid rgba(60,52,138,.25)}
        .ab-deadstock{background:var(--bg3);color:var(--text3);border:1px solid var(--border2)}
        .po-btn{font-size:10px;padding:4px 10px;border:1px solid rgba(26,95,165,.3);border-radius:20px;cursor:pointer;background:var(--blue-dim);color:var(--blue);font-family:var(--mono);font-weight:600;white-space:nowrap;transition:all .12s}
        .po-btn-none{font-size:10px;padding:4px 10px;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:none;color:var(--text3);font-family:var(--mono);font-weight:500;white-space:nowrap}
        table.po-tbl{width:100%;border-collapse:collapse;min-width:700px}
        table.po-tbl th{padding:8px 14px;text-align:left;font-size:9px;font-weight:600;color:var(--text3);background:var(--bg3);white-space:nowrap;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--border);font-family:var(--mono)}
        table.po-tbl td{padding:9px 14px;border-top:1px solid var(--border);font-size:12px;vertical-align:middle}
        table.po-tbl tbody tr:hover td{background:var(--bg3)}
        .po-code-pill{display:inline-block;padding:2px 8px;background:var(--blue-dim);color:var(--blue);border-radius:5px;font-size:10px;font-family:var(--mono);font-weight:600;border:1px solid rgba(26,95,165,.15)}
        .pending-red{color:var(--red-mid);font-weight:700;font-family:var(--mono)}
        .prog-track{width:64px;height:4px;background:var(--bg4);border-radius:2px;overflow:hidden;margin-top:3px;border:1px solid var(--border)}
        .prog-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--blue-mid),#5BA8F5)}
        .pct-lbl{font-size:10px;color:var(--text3);font-family:var(--mono)}
        .sp-wait{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:var(--amber-dim);color:var(--amber);border:1px solid rgba(192,120,32,.3);font-family:var(--mono);text-transform:uppercase}
        .sp-appr{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:var(--blue-dim);color:var(--blue);border:1px solid rgba(26,95,165,.25);font-family:var(--mono);text-transform:uppercase}
        .sp-comp{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;background:var(--green-dim);color:var(--green);border:1px solid rgba(59,109,17,.25);font-family:var(--mono);text-transform:uppercase}
        .critical-row td{background:#FBEAEA!important}.critical-row:hover td{background:#F5D8D8!important}
        .spike-row{background:#FFFBF2}.spike-row:hover td{background:#FFF3D0!important}
        .priority-ring{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:10px;font-weight:700;flex-shrink:0;font-family:var(--mono)}
        .pr-1{background:var(--red-dim);color:var(--red-mid);border:1.5px solid rgba(192,48,48,.4)}
        .pr-2{background:var(--amber-dim);color:var(--amber);border:1.5px solid rgba(192,120,32,.4)}
        .pr-3{background:var(--green-dim);color:var(--green);border:1.5px solid rgba(59,109,17,.4)}
        .ratio-badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;font-family:var(--mono)}
        .panel-legend{display:flex;gap:12px;flex-wrap:wrap;padding:9px 18px;background:var(--bg3);border-top:1px solid var(--border)}
        .pl-item{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text3);font-family:var(--mono)}
        .filter-input{font-size:11px;padding:6px 11px;border:1px solid var(--border2);border-radius:7px;background:var(--bg2);color:var(--text);font-family:var(--mono);transition:border-color .12s;font-weight:500}
        .filter-input:focus{outline:none;border-color:var(--blue-mid)}
        .toast{position:fixed;bottom:24px;right:24px;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:10px 16px;font-size:12px;font-family:var(--mono);color:var(--text);display:flex;align-items:center;gap:8px;z-index:999;opacity:0;transform:translateY(8px);transition:all .25s;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.12)}
        .toast.show{opacity:1;transform:translateY(0)}
        .toast.ok{border-color:rgba(59,109,17,.4);color:var(--green)}
        .toast.err{border-color:rgba(192,48,48,.4);color:var(--red-mid)}
        .toast.info{border-color:rgba(26,95,165,.4);color:var(--blue)}
      `}</style>
    </>
  );
}
