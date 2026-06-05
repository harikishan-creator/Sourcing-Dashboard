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
  return r.drr30 > 0 && r.drr7 < r.drr15 && r.drr7 < r.drr30;
}

// ── Forecast (30-day based, weighted DRR) ─────────────────────────────────────
var LEAD_DAYS_DEFAULT = 7;

function weightedDRR(r) {
  // Weighted: recent sales matter more. 7d=50%, 15d=30%, 30d=20%
  // Smooths spikes without needing 90-day data
  if (r.drr7 === 0 && r.drr15 === 0 && r.drr30 === 0) return 0;
  return Math.round(r.drr7 * 0.5 + r.drr15 * 0.3 + r.drr30 * 0.2);
}

function forecastSKU(r, poList, leadDays) {
  var wdrr   = weightedDRR(r);
  var inv    = r.inv || 0;
  var today  = Date.now();
  var DAY    = 86400000;

  // DOC based on weighted DRR (more stable than max DRR)
  var wdoc   = wdrr > 0 ? Math.round(inv / wdrr) : (inv > 0 ? 999 : 0);

  // Key dates
  var stockoutMs  = wdrr > 0 ? today + wdoc * DAY : null;
  var reorderMs   = stockoutMs ? stockoutMs - leadDays * DAY : null;
  var daysLeft    = reorderMs ? Math.round((reorderMs - today) / DAY) : null;

  // 60-day need = how many units needed to cover next 60 days
  var need60      = wdrr > 0 ? Math.max(0, wdrr * 60 - inv) : 0;

  // Open PO coverage (non-closed POs only)
  var openPOUnits = (poList || [])
    .filter(function(p) { return p.status !== 'CLOSED' && p.status !== 'CANCELLED'; })
    .reduce(function(s, p) { return s + (p.pending || 0); }, 0);

  var netNeed     = Math.max(0, need60 - openPOUnits);

  // Trend: compare recent 7d vs baseline 30d
  var trendPct    = r.drr30 > 0 ? Math.round((r.drr7 - r.drr30) / r.drr30 * 100) : 0;
  var trend       = trendPct >= 20 ? 'rising' : trendPct <= -20 ? 'falling' : 'stable';

  // Urgency
  var urgency = 'ok';
  if (wdrr === 0)                          urgency = 'no_sales';
  else if (inv === 0)                      urgency = 'stockout';
  else if (daysLeft !== null && daysLeft <= 0)  urgency = 'overdue';
  else if (daysLeft !== null && daysLeft <= 7)  urgency = 'urgent';
  else if (daysLeft !== null && daysLeft <= 14) urgency = 'soon';

  var fmt = function(ms) {
    if (!ms) return '—';
    return new Date(ms).toISOString().split('T')[0];
  };

  return { wdrr, wdoc, stockoutDate: fmt(stockoutMs), reorderDate: fmt(reorderMs),
           daysLeft, need60, openPOUnits, netNeed, trend, trendPct, urgency };
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


function POPlanTable({ items, showUrgency }) {
  const fmt = n => Math.round(n).toLocaleString('en-IN');
  const fmtK = n => n>=100000?(n/100000).toFixed(1)+'L':n>=1000?(n/1000).toFixed(1)+'K':String(Math.round(n));
  if (!items || items.length === 0) return (
    <div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:13}}>
      <i className="ti ti-circle-check" style={{fontSize:28,display:'block',marginBottom:8,color:'var(--green)'}} />
      No orders needed — all items have sufficient stock
    </div>
  );
  return (
    <div style={{overflowX:'auto'}}>
      <table className="detail">
        <thead>
          <tr>
            <th>SKU</th>
            <th>ITEM</th>
            <th>CAT</th>
            <th>VENDOR</th>
            <th className="r" title="Sales in last 24 hours" style={{color:'var(--amber)'}}>1D SALES</th>
            <th className="r">DRR MAX</th>
            <th className="r">INVENTORY</th>
            <th className="r">OPEN PO</th>
            <th className="r" title="Inventory ÷ DRR Max">INV COVER</th>
            <th className="r" title="DRR Max × 45 days">TARGET (45d)</th>
            <th className="r" style={{color:'var(--blue)'}}>PO QTY NEEDED</th>
            {showUrgency && <th>URGENCY</th>}
          </tr>
        </thead>
        <tbody>
          {items.map(function(r, i) {
            var urgCfg = {
              today: {bg:'var(--red-dim)',   col:'var(--red)',     label:'🔴 Order Today'},
              '7d':  {bg:'var(--amber-dim)', col:'var(--amber)',   label:'🟠 Within 7d'},
              '15d': {bg:'#fef3c7',          col:'#92400e',        label:'🟡 Within 15d'},
              ok:    {bg:'var(--green-dim)', col:'var(--green)',   label:'🟢 OK'},
            };
            var uc = urgCfg[r.urgency] || urgCfg.ok;
            return (
              <tr key={i} style={{background: i%2===0?'transparent':'var(--bg3)'}}>
                <td><span className="sku-badge">{r.sku}</span></td>
                <td style={{fontWeight:500,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td>
                <td style={{color:'var(--text3)',fontSize:11}}>{r.cat}</td>
                <td style={{color:'var(--text2)',fontSize:11,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.vendor}>{r.vendor}</td>
                <td className="r" style={{fontFamily:'var(--mono)',fontWeight:700,color:(r.last1d||0)>0?'var(--green)':'var(--text3)'}}>{r.last1d||0}</td>
                <td className="r" style={{fontFamily:'var(--mono)',color:'var(--text2)'}}>{fmt(r.drrMax)}</td>
                <td className="r" style={{fontFamily:'var(--mono)',color: r.inv===0?'var(--red)':'var(--text)'}}>{fmt(r.inv)}</td>
                <td className="r" style={{fontFamily:'var(--mono)',color:'var(--blue)'}}>{fmt(r.openPO)}</td>
                <td className="r"><span style={{fontFamily:'var(--mono)',fontWeight:600,
                    color:r.doc<=7?'var(--red)':r.doc<=15?'var(--amber)':'var(--text2)'}}>{r.doc}d</span></td>
                <td className="r" style={{fontFamily:'var(--mono)',color:'var(--text3)'}}>{fmt(r.targetStock)}</td>
                <td className="r">
                  <span style={{fontFamily:'var(--mono)',fontWeight:700,fontSize:13,
                      background:'var(--blue-dim)',color:'var(--blue)',
                      border:'1px solid var(--blue-mid)',borderRadius:5,padding:'2px 8px'}}>
                    {fmtK(r.poNeeded)}
                  </span>
                </td>
                {showUrgency && (
                  <td><span style={{background:uc.bg,color:uc.col,padding:'2px 8px',
                      borderRadius:4,fontSize:10,fontWeight:600,whiteSpace:'nowrap'}}>{uc.label}</span></td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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
  const [leadDays,    setLeadDays]    = useState(LEAD_DAYS_DEFAULT);
  const [forecastFilter, setForecastFilter] = useState('');
  const [forecastSubTab, setForecastSubTab] = useState('table'); // 'table' | 'vendor' | 'today' | '7d' | '15d'
  const TARGET_DAYS = 45; // 45-day stock target for PO planning
  const [docFilter,      setDocFilter]      = useState(''); // 'procure_now'|'procure'|'overstock'|'deadstock' // urgency or trend filter
  const [tabSearch,   setTabSearch]   = useState('');
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



  // ── CSV helpers (fallback when MCP is unavailable) ─────────────────────────
  function parseCSV(text) {
    const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n');
    if (lines.length < 2) return [];
    function parseLine(line) {
      const vals=[]; let cur='',inQ=false,i=0;
      while(i<line.length){const ch=line[i];if(ch==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i+=2;continue;}inQ=!inQ;}else if(ch===','&&!inQ){vals.push(cur);cur='';}else cur+=ch;i++;}
      vals.push(cur); return vals;
    }
    const headers=parseLine(lines[0]).map(h=>h.trim());
    return lines.slice(1).filter(l=>l.trim()).map(line=>{
      const vals=parseLine(line);const obj={};
      headers.forEach((h,i)=>{obj[h]=(vals[i]??'').trim();});
      return obj;
    });
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
            drr7:Math.round(num(r['Last 7 days DRR']||0)),
            drr15:Math.round(num(r['Last 15 days DRR']||0)),
            drr30:Math.round(num(r['Last 30 days DRR']||0)),
            inv:num(r['Inventory']||0), openPO:num(r['Open Purchase']||0),
            doc:Math.round(num(r['Days of Cover']||0)),
            primaryVendor:(r['Primary Vendor']||'').trim(),
            secondaryVendor:(r['Secondary Vendor']||'').trim(),
            poc:(r['POC']||'').trim(),
          });
        });
        setInv(Array.from(skuMap.values()).map(r => {
          const d7=Math.round(r.drr7||0), d15=Math.round(r.drr15||0), d30=Math.round(r.drr30||0);
          return {...r, drr7:d7, drr15:d15, drr30:d30, drrMax:Math.max(d7,d15,d30), last1d:Math.round(num(r['Last 1 days DRR']||r['Last 1 Days Sale']||0))};
        }));
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
          const sku = (r['Item SkuCode']||r['item_skucode']||'').trim();
          if (!sku) return;
          if (!bySkuMap[sku]) bySkuMap[sku] = [];
          bySkuMap[sku].push({
            po:(r['PO Code']||'—').trim(),
            vendor:(r['Vendor Name']||'—').trim(),
            poDate:(r['Created']||'—').split(' ')[0],
            delDate:(r['Delivery Date']||'—').split(' ')[0],
            ordered:num(r['Order Quantity']||0),
            rcvd:num(r['Recieved Quantity']||0),
            rejected:num(r['Rejected Quantity']||0),
            pending:num(r['Pending Quantity']||0),
            unitPrice:num(r['Unit Price']||0),
            total:num(r['Total']||0),
            status:(r['Purchase Order Status']||'APPROVED').toUpperCase().replace(/ /g,'_'),
            itemName:(r['Item Type Name']||sku).trim(),
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
    setInv([]); setPoBySkuMap({}); setGrnData([]);
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

    // Helper: trigger → poll → download one job (with 2s poll interval for speed)
    const runJob = async (type, facility, forceRefresh = false) => {
      try {
        const t = await fetch('/api/uniware', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trigger', type, facility, forceRefresh }),
        });
        const trigData = await t.json();
        const { jobCode, error: e, cachedRows } = trigData;

        // KV cache hit — rows returned immediately
        if (jobCode === 'KV_CACHED' && cachedRows) {
          const cacheAge = trigData.cachedAt ? Math.round((Date.now()-trigData.cachedAt)/60000) : '?';
          showToast('⚡ drr30/MSKT_FZP from shared cache (' + cacheAge + 'm old)', 'ok');
          return cachedRows;
        }

        if (e || !jobCode) return [];

        // Normal flow: poll until done
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
              body: JSON.stringify({ action: 'download', url: pd.url, type, facility }),
            });
            const { rows } = await d.json();
            return rows || [];
          }
          if (pd.status === 'FAILED') return [];
        }
      } catch {}
      return [];
    };;

    try {
      // Step 1: Inventory snapshots — sequential
      showToast('Fetching inventory…', 'info');
      const invData = {};
      for (const fac of FACILITIES) invData[fac] = await runJob('inventory', fac);

      // Step 2: DRR 30d export — sequential
      // drr30/MSKT_FZP uses KV cache (fast if cached, slow only on first load of day)
      showToast('Fetching 30d sales…', 'info');
      const drr30Data = {};
      for (const fac of FACILITIES) drr30Data[fac] = await runJob('drr30', fac, forceFullFetch);

      // Step 3: PO — full fetch or from cache
      let poBySkuMapNew = {};
      let cachedPO = {};
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) cachedPO = JSON.parse(cached).po || {};
      } catch {}

      if (needFull) {
        showToast('Fetching POs…', 'info');
        const PO_FACILITIES = ['astrotalk', 'MSKT_FZP'];
        for (const fac of PO_FACILITIES) {
          const rows = await runJob('po', fac);
          (rows || []).forEach(r => {
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
      // calcDRR: sums ORDERED QUANTITY per SKU within date window (not row count)
      const calcDRR = (rows, days) => {
        const cutoff = Date.now() - days * 86400000;
        const c = {};
        (rows||[]).forEach(r => {
          const s = (r['Item SKU Code']||r['Item SkuCode']||'').trim();
          if (!s) return;
          const created = r['Created'] ? new Date(r['Created']).getTime() : 0;
          if (created >= cutoff) {
            const qty = parseFloat(
              r['Ordered Quantity'] || r['Total Quantity'] ||
              r['ordered_quantity'] || r['Quantity'] || 1
            ) || 1;
            c[s] = (c[s]||0) + qty;
          }
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
      // Last 1 day sales — count rows from LAST 24 HOURS only (no division)
      const calcLast1d = (rows) => {
        const cutoff = Date.now() - 86400000; // exactly 24 hours
        const c = {};
        (rows||[]).forEach(r => {
          const s = (r['Item SKU Code']||r['Item SkuCode']||'').trim();
          if (!s) return;
          const created = r['Created'] ? new Date(r['Created']).getTime() : 0;
          if (created >= cutoff) c[s] = (c[s]||0) + 1;
        });
        return c;
      };
      const last1dMaps = FACILITIES.map(f => calcLast1d(drr30Data[f]));
      const last1dMap = merge(...last1dMaps);

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
            // Update vendor fields if not yet set
            if (!e.primaryVendor) e.primaryVendor = (r['Primary Vendor']||'').trim();
            if (!e.needAfterOpenPO) e.needAfterOpenPO = Math.max(0, parseFloat(r['Need After Open Po']||r['Need After Open PO']||0));
          } else {
            skuMap.set(sku, {
              sku, name:(r['Item Type Name']||sku).trim(),
              cat: SKU_CAT_MAP[sku], inv,
              openPO:parseFloat(r['Open Purchase']||0),
              drr7:0, drr15:0, drr30:0, drrMax:0, doc:0,
              primaryVendor:   (r['Primary Vendor']||'').trim(),
              secondaryVendor: (r['Secondary Vendor']||'').trim(),
              poc:             (r['POC']||'').trim(),
              needAfterOpenPO: Math.max(0, parseFloat(r['Need After Open Po']||r['Need After Open PO']||0)),
            });
          }
        });
      });

      skuMap.forEach((item, sku) => {
        const d7=rnd(drr7Map[sku]||0), d15=rnd(drr15Map[sku]||0), d30=rnd(drr30Map[sku]||0);
        const dMax = Math.max(d7, d15, d30);
        item.drr7=d7; item.drr15=d15; item.drr30=d30; item.drrMax=dMax;
        item.last1d = rnd(last1dMap[sku] || 0);
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
  useEffect(() => {
    // Clear stale sessionStorage cache on load to always get fresh data
    try { sessionStorage.removeItem('inv_cache_v2'); } catch(e) {}
    fetchAll();
  }, []); // Auto-fetch on page load

  // ── derived data (all in one block to prevent bundler reordering TDZ) ──
  var whitelistedInv = inv.filter(r => SKU_CAT_MAP[r.sku]);
  var cats        = [...new Set(whitelistedInv.map(r => r.cat))].sort();
  var _docQ    = tabSearch.toLowerCase();
  var filteredInv = whitelistedInv
    .filter(r => !catFilter || r.cat === catFilter)
    .filter(r => !_docQ || r.sku.toLowerCase().includes(_docQ) || r.name.toLowerCase().includes(_docQ))
    .filter(r => {
      if (!docFilter) return true;
      if (docFilter === 'procure_now') return r.doc === 0 && r.inv === 0;
      if (docFilter === 'procure')     return r.doc > 0 && r.doc <= 15;
      if (docFilter === 'overstock')   return r.doc > 60 && r.doc <= 180;
      if (docFilter === 'deadstock')   return r.doc > 180;
      return true;
    });
  var _spikeQ  = tabSearch.toLowerCase();
  var spikes      = whitelistedInv.filter(isSpike)
    .filter(r => !_spikeQ || r.sku.toLowerCase().includes(_spikeQ) || r.name.toLowerCase().includes(_spikeQ))
    .map(r => ({ ...r, ratio: r.drr7 / r.drr30, priority: spikePriority(r) }))
    .sort((a, b) => a.priority - b.priority || b.ratio - a.ratio);
  var _declQ   = tabSearch.toLowerCase();
  var declining   = whitelistedInv.filter(isDeclining)
    .filter(r => !_declQ || r.sku.toLowerCase().includes(_declQ) || r.name.toLowerCase().includes(_declQ))
    .map(r => ({ ...r, dropRatio: r.drr30 > 0 ? rnd((1 - r.drr7 / r.drr30) * 100) : 0 }))
    .sort((a, b) => b.dropRatio - a.dropRatio);
  var _fcQ     = tabSearch.toLowerCase();
  var forecast    = whitelistedInv
    .filter(function(r) { return (r.drr30 > 0 || r.drr15 > 0 || r.drr7 > 0) && (!_fcQ || r.sku.toLowerCase().includes(_fcQ) || r.name.toLowerCase().includes(_fcQ)); })
    .map(function(r) { return Object.assign({}, r, forecastSKU(r, poBySkuMap[r.sku], leadDays)); })
    .filter(function(r) {
      if (!forecastFilter) return true;
      if (['stockout','overdue','urgent','soon','ok','no_sales'].includes(forecastFilter)) return r.urgency === forecastFilter;
      if (forecastFilter === 'rising')  return r.trend === 'rising';
      if (forecastFilter === 'falling') return r.trend === 'falling';
      return true;
    })
    .sort(function(a, b) {
      var o = { stockout:0, overdue:1, urgent:2, soon:3, ok:4, no_sales:5 };
      return (o[a.urgency]||4) - (o[b.urgency]||4) || (a.daysLeft||999) - (b.daysLeft||999);
    });
  // ── PO Plan data (45-day target) ───────────────────────────────────────────
  var poplan = whitelistedInv
    .filter(function(r) { return r.drr30 > 0 || r.drr7 > 0; })
    .map(function(r) {
      var wdrr       = weightedDRR(r);
      var drrMax     = r.drrMax || wdrr;
      var inv        = r.inv || 0;
      var openPO     = (poBySkuMap[r.sku] || [])
        .filter(function(p) { return p.pending > 0 && p.status !== 'CLOSED' && p.status !== 'CANCELLED'; })
        .reduce(function(s, p) { return s + p.pending; }, 0);
      // Vendor = supplier of most recent PO for this SKU (fully from Uniware PO data)
      var skuPOs = (poBySkuMap[r.sku] || []).filter(function(p) { return p.vendor && p.vendor !== '—'; });
      var vendor = 'No Vendor Data';
      if (skuPOs.length > 0) {
        // Sort by PO date descending — most recent first
        skuPOs.sort(function(a, b) {
          return new Date(b.poDate || 0) - new Date(a.poDate || 0);
        });
        vendor = skuPOs[0].vendor;
      }
      var targetStock = drrMax * TARGET_DAYS;
      var poNeeded   = Math.max(0, Math.ceil(targetStock - inv - openPO));
      var doc        = drrMax > 0 ? Math.round(inv / drrMax * 10) / 10 : 999;
      // needAfterOpenPO = (DRR Max × 45) − Inventory − Open PO (fully from Uniware)
      var needAfterOpenPO = Math.max(0, targetStock - inv - openPO);
      var hasOpenPO = openPO > 0;
      // Conditions: lead time = 10d, no open PO, and still short of 45d target
      // Order Today  = DOC <= 10 AND no open PO AND still need stock
      // Next 7 days  = DOC <= 17 (10+7) AND no open PO AND still need stock
      // Next 15 days = DOC <= 25 (10+15) AND no open PO AND still need stock
      var needsOrder = needAfterOpenPO > 0;
      var urgency = (!hasOpenPO && needsOrder && doc <= 10) ? 'today'
                  : (!hasOpenPO && needsOrder && doc <= 17) ? '7d'
                  : (!hasOpenPO && needsOrder && doc <= 25) ? '15d'
                  : 'ok';
      return Object.assign({}, r, { wdrr, drrMax, inv, openPO, vendor, targetStock, poNeeded, doc, urgency });
    })
    .filter(function(r) { return r.poNeeded > 0 && r.urgency !== 'ok'; })
    .sort(function(a, b) {
      var o = { today:0, '7d':1, '15d':2, ok:3 };
      return (o[a.urgency]||3) - (o[b.urgency]||3) || a.doc - b.doc;
    });

  var pplan_today = poplan.filter(function(r) { return r.urgency === 'today'; });
  var pplan_7d    = poplan.filter(function(r) { return r.urgency === '7d'; });   // excludes 'today'
  var pplan_15d   = poplan.filter(function(r) { return r.urgency === '15d'; });  // excludes 'today' and '7d'

  // Group by vendor for vendor view
  var poplanByVendor = {};
  poplan.forEach(function(r) {
    if (!poplanByVendor[r.vendor]) poplanByVendor[r.vendor] = [];
    poplanByVendor[r.vendor].push(r);
  });
  var vendorsSorted = Object.keys(poplanByVendor).sort(function(a, b) {
    var minA = Math.min.apply(null, poplanByVendor[a].map(function(r) { return r.doc; }));
    var minB = Math.min.apply(null, poplanByVendor[b].map(function(r) { return r.doc; }));
    return minA - minB;
  });

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
            <button className="btn-refresh" onClick={() => { try{sessionStorage.clear();}catch(e){} fetchAll(true); }} disabled={loading} title="Clear cache and force full refresh" style={{fontSize:11,padding:'7px 10px',background:'var(--amber)',color:'#fff'}}>
              <i className="ti ti-trash" style={{fontSize:11}} /> Clear Cache &amp;
            </button>
            <button className="btn-refresh" onClick={async () => {
              // Invalidate KV cache so fresh data is fetched for everyone
              try { await fetch('/api/uniware',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'invalidate_cache'})}); } catch {}
              fetchAll(true);
            }} disabled={loading} title="Force full fetch — clears shared cache for whole team" style={{fontSize:11,padding:'7px 10px'}}>
              <i className="ti ti-refresh-alert" style={{ fontSize: 13 }} />
              Full fetch
            </button>
            <div className="time-chip">
              <span className={`live-dot ${status === 'loading' ? 'fetching' : status === 'error' ? 'error' : status === 'ok' ? '' : 'idle'}`} />
              <span>
                {status === 'idle'    && 'Upload CSV or click Refresh from Uniware'}
                {status === 'loading' && 'Fetching live data…'}
                {status === 'error'   && 'MCP unavailable — use CSV upload as fallback'}
                {status === 'ok'      && fetchedAt && `Live · ${new Date(fetchedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} IST`}
              </span>
            </div>
          </div>
        </div>

        {/* CSV UPLOAD ZONE — fallback when MCP unavailable */}
        {status !== 'ok' && <div className="upload-zone" style={{marginBottom:'1.25rem'}}>
          <div className="upload-inner">
            <div className="upload-left">
              <div className="upload-icon"><i className="ti ti-upload" /></div>
              <div className="upload-text">
                <h3>Upload Unicommerce CSV exports <span style={{fontSize:10,fontWeight:400,color:'var(--text3)',marginLeft:6}}>(fallback when MCP is unavailable)</span></h3>
                <p>Inventory reorder sheet + PO details export</p>
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <label className="ul-btn">
                <span className="sl">Inventory CSV</span>
                <span className="ss">{invLoaded?'✓ loaded':'click to upload'}</span>
                <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files[0]&&handleInvCSV(e.target.files[0])} />
              </label>
              <label className="ul-btn">
                <span className="sl">PO / GRN CSV</span>
                <span className="ss">{poLoaded?'✓ loaded':'click to upload'}</span>
                <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files[0]&&handlePOCSV(e.target.files[0])} />
              </label>
              <button className="clear-btn" onClick={clearCSV}><i className="ti ti-refresh" style={{fontSize:13}} />Clear</button>
            </div>
          </div>
          <div className="upload-hint">
            <span className="sh-cols">INVENTORY COLS:</span>
            {['Item SKU Code','Item Type Name','Category','Last 7 days DRR','Last 15 days DRR','Last 30 days DRR','DRR Max','Inventory','Open Purchase','Days of Cover'].map(c=>(
              <span key={c} className="sh-pill">{c}</span>
            ))}
            <span className="sh-cols" style={{marginLeft:8}}>PO COLS:</span>
            {['PO Code','Item SkuCode','Item Type Name','Vendor Name','Created','Delivery Date','Order Quantity','Recieved Quantity','Pending Quantity','Purchase Order Status','Unit Price','Total'].map(c=>(
              <span key={c} className="sh-pill">{c}</span>
            ))}
          </div>
        </div>}

        {/* ERROR STRIP */}
        {Object.values(errors).some(Boolean) && inv.length === 0 && activeTab !== 'forecast' && (
          <div className="error-strip">
            <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} />
            <span>Partial data: {Object.entries(errors).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>
          </div>
        )}

        {/* SKELETON / LOADING */}
        {loading && inv.length === 0 && activeTab !== 'forecast' && (
          <div className="skeleton-wrap">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        )}

        {/* METRICS */}
        {inv.length > 0 && activeTab !== 'forecast' && (
          <div className="metrics">
            {[
              { lbl: 'Procure now',          val: pn,  sub: 'doc=0 · no stock',  cls: 'c-red',    icon: 'ti-alert-circle',   tab: 'doc',     docFilter: 'procure_now' },
              { lbl: 'Procure',              val: pc,  sub: 'doc 1–15 days',     cls: 'c-red',    icon: 'ti-shopping-cart',  tab: 'doc',     docFilter: 'procure'     },
              { lbl: 'Overstock/Liquidate',  val: ovs, sub: 'doc 61–180 days',   cls: 'c-blue',   icon: 'ti-archive',        tab: 'doc',     docFilter: 'overstock'   },
              { lbl: 'Dead stock',           val: ds,  sub: 'doc > 180 days',    cls: 'c-teal',   icon: 'ti-ban',            tab: 'doc',     docFilter: 'deadstock'   },
              { lbl: 'Sales spikes',         val: sp,  sub: '7d drr ≥ 1.5× 30d',cls: 'c-amber',  icon: 'ti-flame',          tab: 'spikes'                           },
              { lbl: 'Open PO lines',        val: ol,  sub: 'pending delivery',  cls: 'c-green',  icon: 'ti-clipboard-list', tab: 'po'                               },
            ].map(c => (
              <div key={c.lbl} className={`mc ${c.cls}`}
                onClick={() => {
                  if (c.tab) {
                    setActiveTab(c.tab);
                    setSkuPanel(null);
                    setPoPanel(null);
                    setTabSearch('');
                    setForecastFilter('');
                    setDocFilter('');
                    if (c.docFilter)      setDocFilter(c.docFilter);
                    if (c.forecastFilter) setForecastFilter(c.forecastFilter);
                  }
                }}
                style={{ cursor: c.tab ? 'pointer' : 'default',
                         transition: 'transform .12s, box-shadow .12s' }}
                onMouseEnter={e => { if (c.tab) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
              >
                <div className="lbl"><i className={`ti ${c.icon}`} style={{ fontSize: 11 }} /> {c.lbl}</div>
                <div className="val">{c.val}</div>
                <div className="sub">{c.sub}{c.tab ? <span style={{fontSize:9,opacity:.6,marginLeft:4}}>↗</span> : null}</div>
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
            { id: 'forecast',  icon: 'ti-crystal-ball',  label: 'Forecast'    },
          ].map(t => (
            <button key={t.id} className={`tb ${activeTab === t.id ? 'active' : ''}`} onClick={() => { setActiveTab(t.id); setSkuPanel(null); setPoPanel(null); setTabSearch(''); setForecastFilter(''); setDocFilter(''); }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} />{t.label}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        {['doc','spikes','declining'].includes(activeTab) && (
          <div style={{position:'relative',marginBottom:'0.5rem',maxWidth:340}}>
            <i className="ti ti-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
              color:'var(--text3)',fontSize:13,pointerEvents:'none'}} />
            <input
              type="text"
              placeholder={`Search SKU or item name in ${activeTab}…`}
              value={tabSearch}
              onChange={e => setTabSearch(e.target.value)}
              style={{width:'100%',padding:'7px 10px 7px 30px',border:'1px solid var(--border)',
                borderRadius:8,fontFamily:'var(--mono)',fontSize:12,background:'var(--bg2)',
                color:'var(--text)',outline:'none'}}
            />
            {tabSearch && (
              <button onClick={() => setTabSearch('')}
                style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
                  background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:14,
                  lineHeight:1,padding:2}}>×</button>
            )}
          </div>
        )}

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
                    <th className="r" title="Sales in last 24h" style={{color:'var(--amber)'}}>1D SALES</th><th className="r">7d DRR</th><th className="r">15d DRR</th><th className="r">30d DRR</th>
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
                          <td className="r" style={{fontFamily:'var(--mono)',fontWeight:700,color:(r.last1d||0)>0?'var(--green)':'var(--text3)'}}>{r.last1d||0}</td><td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: r.drr7 > r.drr30 ? 700 : 400, color: r.drr7 > r.drr30 ? 'var(--amber-mid)' : 'var(--text2)' }}>{rnd(r.drr7)}</td>
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
              <div style={{position:'relative',minWidth:200,maxWidth:260}}>
                  <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',
                    transform:'translateY(-50%)',color:'var(--text3)',fontSize:12,pointerEvents:'none'}} />
                  <input type="text" placeholder="Search SKU or name…" value={tabSearch}
                    onChange={e => setTabSearch(e.target.value)}
                    style={{width:'100%',padding:'5px 26px 5px 26px',border:'1px solid var(--border)',
                      borderRadius:7,fontFamily:'var(--mono)',fontSize:11,background:'var(--bg2)',
                      color:'var(--text)',outline:'none'}} />
                  {tabSearch && <button onClick={()=>setTabSearch('')} style={{position:'absolute',right:7,
                    top:'50%',transform:'translateY(-50%)',background:'none',border:'none',
                    cursor:'pointer',color:'var(--text3)',fontSize:13,lineHeight:1,padding:0}}>×</button>}
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
              <div style={{position:'relative',minWidth:200,maxWidth:260}}>
                  <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',
                    transform:'translateY(-50%)',color:'var(--text3)',fontSize:12,pointerEvents:'none'}} />
                  <input type="text" placeholder="Search SKU or name…" value={tabSearch}
                    onChange={e => setTabSearch(e.target.value)}
                    style={{width:'100%',padding:'5px 26px 5px 26px',border:'1px solid var(--border)',
                      borderRadius:7,fontFamily:'var(--mono)',fontSize:11,background:'var(--bg2)',
                      color:'var(--text)',outline:'none'}} />
                  {tabSearch && <button onClick={()=>setTabSearch('')} style={{position:'absolute',right:7,
                    top:'50%',transform:'translateY(-50%)',background:'none',border:'none',
                    cursor:'pointer',color:'var(--text3)',fontSize:13,lineHeight:1,padding:0}}>×</button>}
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
                        <th className="r" title="Sales in last 24h" style={{color:'var(--amber)'}}>1D SALES</th><th className="r">7d DRR</th><th className="r">15d DRR</th><th className="r">30d DRR</th>
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
                              <td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: (r.last1d||0)>0?'var(--green)':'var(--text3)' }}>{r.last1d||0}</td>
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
              <div style={{position:'relative',minWidth:200,maxWidth:260}}>
                  <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',
                    transform:'translateY(-50%)',color:'var(--text3)',fontSize:12,pointerEvents:'none'}} />
                  <input type="text" placeholder="Search SKU or name…" value={tabSearch}
                    onChange={e => setTabSearch(e.target.value)}
                    style={{width:'100%',padding:'5px 26px 5px 26px',border:'1px solid var(--border)',
                      borderRadius:7,fontFamily:'var(--mono)',fontSize:11,background:'var(--bg2)',
                      color:'var(--text)',outline:'none'}} />
                  {tabSearch && <button onClick={()=>setTabSearch('')} style={{position:'absolute',right:7,
                    top:'50%',transform:'translateY(-50%)',background:'none',border:'none',
                    cursor:'pointer',color:'var(--text3)',fontSize:13,lineHeight:1,padding:0}}>×</button>}
                </div>
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
                        <th className="r" title="Sales in last 24h" style={{color:'var(--amber)'}}>1D SALES</th>
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
                          <td className="r" style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: (r.last1d||0)>0?'var(--green)':'var(--text3)' }}>{r.last1d||0}</td>
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

        {activeTab === 'forecast' && (
          <div className="card">

            {/* Header */}
            <div className="card-head" style={{flexWrap:'wrap',gap:8}}>
              <span className="card-title">
                <i className="ti ti-crystal-ball" style={{fontSize:15,color:'var(--purple)'}} />
                Inventory Forecast & PO Planner
              </span>
              <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexWrap:'wrap'}}>
                {forecastSubTab === 'table' && <>
                  <span style={{fontSize:11,color:'var(--text3)'}}>Lead time:</span>
                  <input type="number" min="1" max="90" value={leadDays}
                    onChange={e => setLeadDays(Math.max(1, parseInt(e.target.value)||7))}
                    style={{width:52,padding:'3px 6px',border:'1px solid var(--border)',borderRadius:6,
                            fontFamily:'var(--mono)',fontSize:12,background:'var(--bg2)'}} />
                  <span style={{fontSize:11,color:'var(--text3)'}}>days</span>
                  <span className="card-chip">{forecast.length} skus</span>
                </>}
                {forecastSubTab === 'vendor' && <span className="card-chip">{vendorsSorted.length} vendors · {poplan.length} SKUs</span>}
                {forecastSubTab === 'today' && <span className="card-chip" style={{background:'var(--red-dim)',color:'var(--red)',border:'1px solid var(--red-mid)'}}>{pplan_today.length} SKUs · order today</span>}
                {forecastSubTab === '7d'    && <span className="card-chip" style={{background:'var(--amber-dim)',color:'var(--amber)',border:'1px solid var(--amber-mid)'}}>{pplan_7d.length} SKUs · within 7 days</span>}
                {forecastSubTab === '15d'   && <span className="card-chip" style={{background:'#fef3c7',color:'#92400e',border:'1px solid #fde68a'}}>{pplan_15d.length} SKUs · within 15 days</span>}
                {(forecastSubTab === 'table') && (
                  <div style={{position:'relative',minWidth:200,maxWidth:260}}>
                    <i className="ti ti-search" style={{position:'absolute',left:8,top:'50%',
                      transform:'translateY(-50%)',color:'var(--text3)',fontSize:12,pointerEvents:'none'}} />
                    <input type="text" placeholder="Search SKU or name…" value={tabSearch}
                      onChange={e => setTabSearch(e.target.value)}
                      style={{width:'100%',padding:'5px 26px 5px 26px',border:'1px solid var(--border)',
                        borderRadius:7,fontFamily:'var(--mono)',fontSize:11,background:'var(--bg2)',
                        color:'var(--text)',outline:'none'}} />
                    {tabSearch && <button onClick={()=>setTabSearch('')} style={{position:'absolute',right:7,
                      top:'50%',transform:'translateY(-50%)',background:'none',border:'none',
                      cursor:'pointer',color:'var(--text3)',fontSize:13,lineHeight:1,padding:0}}>×</button>}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-tabs */}
            <div style={{display:'flex',gap:0,borderBottom:'2px solid var(--border)',marginBottom:14,overflowX:'auto'}}>
              {[
                {id:'table',  icon:'ti-table',        label:'Forecast Table'},
                {id:'vendor', icon:'ti-building-store',label:'Vendor-wise PO View'},
                {id:'today',  icon:'ti-alert-circle',  label:'Order Today',  count:pplan_today.length, col:'var(--red)'},
                {id:'7d',     icon:'ti-clock',         label:'Next 7 Days',  count:pplan_7d.length,    col:'var(--amber)'},
                {id:'15d',    icon:'ti-calendar',      label:'Next 15 Days', count:pplan_15d.length,   col:'#92400e'},
              ].map(function(t) {
                var isActive = forecastSubTab === t.id;
                return (
                  <button key={t.id} onClick={() => setForecastSubTab(t.id)}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',border:'none',
                      background:'transparent',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:500,
                      color: isActive ? (t.col||'var(--blue)') : 'var(--text3)',
                      borderBottom: isActive ? ('2px solid '+(t.col||'var(--blue)')) : '2px solid transparent',
                      marginBottom:-2,whiteSpace:'nowrap',transition:'all .15s'}}>
                    <i className={'ti '+t.icon} style={{fontSize:13}} />
                    {t.label}
                    {t.count !== undefined && (
                      <span style={{background:isActive?(t.col||'var(--blue)'):'var(--bg3)',
                        color:isActive?'#fff':(t.col||'var(--text2)'),
                        borderRadius:10,padding:'1px 7px',fontSize:10,fontWeight:700}}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── SUB-TAB: FORECAST TABLE ── */}
            {forecastSubTab === 'table' && (<>
            {/* Summary strip */}
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              {[
                {label:'🔴 Stockout',    filter:'stockout', val:forecast.filter(r=>r.urgency==='stockout').length, bg:'var(--red-dim)',   col:'var(--red-mid)'},
                {label:'🔴 Overdue',     filter:'overdue',  val:forecast.filter(r=>r.urgency==='overdue').length,  bg:'var(--red-dim)',   col:'var(--red-mid)'},
                {label:'🟠 Reorder ≤7d', filter:'urgent',   val:forecast.filter(r=>r.urgency==='urgent').length,   bg:'var(--amber-dim)', col:'var(--amber-mid)'},
                {label:'🟡 Reorder ≤14d',filter:'soon',     val:forecast.filter(r=>r.urgency==='soon').length,     bg:'var(--amber-dim)', col:'var(--amber-mid)'},
                {label:'🟢 Healthy',     filter:'ok',       val:forecast.filter(r=>r.urgency==='ok').length,       bg:'var(--green-dim)', col:'var(--green)'},
                {label:'↑ Rising',       filter:'rising',   val:forecast.filter(r=>r.trend==='rising').length,     bg:'var(--blue-dim)',  col:'var(--blue)'},
                {label:'↓ Falling',      filter:'falling',  val:forecast.filter(r=>r.trend==='falling').length,    bg:'var(--red-dim)',   col:'var(--red-mid)'},
              ].map(({label,val,bg,col,filter}) => {
                var isActive = forecastFilter === filter;
                return (
                  <div key={label}
                    onClick={() => setForecastFilter(isActive ? '' : filter)}
                    style={{background:isActive?col:bg,
                            border:`2px solid ${isActive?col:col+'44'}`,
                            borderRadius:8,padding:'7px 12px',minWidth:90,textAlign:'center',
                            cursor:'pointer',transition:'all .15s',
                            boxShadow:isActive?`0 2px 8px ${col}44`:'none',
                            transform:isActive?'scale(1.04)':'scale(1)'}}>
                    <div style={{fontSize:22,fontWeight:700,
                                 color:isActive?'#fff':col,fontFamily:'var(--mono)'}}>{val}</div>
                    <div style={{fontSize:10,color:isActive?'rgba(255,255,255,.85)':col,marginTop:1}}>
                      {label}{isActive?' ✕':''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Methodology note */}
            <div style={{background:'var(--blue-dim)',border:'1px solid rgba(26,95,165,.2)',borderRadius:8,
                         padding:'8px 14px',marginBottom:14,fontSize:11,color:'var(--blue)',lineHeight:1.6}}>
              <strong>How forecast is calculated (30-day data):</strong>
              &nbsp;Weighted DRR = (7d × 50%) + (15d × 30%) + (30d × 20%) &nbsp;·&nbsp;
              Stockout date = Today + (Inventory ÷ Weighted DRR) &nbsp;·&nbsp;
              Reorder by = Stockout − {leadDays}d lead time &nbsp;·&nbsp;
              60-day need = (Weighted DRR × 60) − Current Inventory − Open POs
            </div>

            {forecast.length === 0
              ? <div className="empty-state">
                  <i className="ti ti-crystal-ball" />
                  <p>{loading ? 'Loading…' : 'No data yet — click Refresh from Uniware'}</p>
                </div>
              : (
                <div style={{overflowX:'auto'}}>
                  <table className="detail">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>ITEM</th>
                        <th>CAT</th>
                        <th className="r" title="Sales in last 24h" style={{color:'var(--amber)'}}>1D SALES</th>
                        <th title="Weighted DRR = 7d×50% + 15d×30% + 30d×20%">W.DRR</th>
                        <th className="r">7D</th>
                        <th className="r">30D</th>
                        <th className="r">INV</th>
                        <th className="r">DOC</th>
                        <th className="r">STOCKOUT</th>
                        <th className="r">REORDER BY</th>
                        <th className="r">DAYS LEFT</th>
                        <th className="r">NEED 60D</th>
                        <th className="r">OPEN PO</th>
                        <th className="r">NET NEED</th>
                        <th className="r">TREND</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.map(function(r, i) {
                        var urgCfg = {
                          stockout: {bg:'var(--red-dim)',   col:'var(--red-mid)',   label:'🔴 Stockout'},
                          overdue:  {bg:'var(--red-dim)',   col:'var(--red-mid)',   label:'🔴 Overdue'},
                          urgent:   {bg:'var(--amber-dim)', col:'var(--amber-mid)', label:'🟠 ≤7d'},
                          soon:     {bg:'var(--amber-dim)', col:'var(--amber-mid)', label:'🟡 ≤14d'},
                          ok:       {bg:'var(--green-dim)', col:'var(--green)',     label:'🟢 OK'},
                          no_sales: {bg:'var(--bg3)',       col:'var(--text3)',     label:'⚪ No Sales'},
                        };
                        var uc  = urgCfg[r.urgency] || urgCfg.ok;
                        var trendCol  = r.trend==='rising'?'var(--green)':r.trend==='falling'?'var(--red-mid)':'var(--text3)';
                        var trendIcon = r.trend==='rising'?'↑':r.trend==='falling'?'↓':'→';
                        var rowBg = r.urgency==='stockout'||r.urgency==='overdue' ? 'rgba(139,28,28,.04)' : i%2===0?'transparent':'var(--bg3)';
                        return (
                          <tr key={i} style={{background:rowBg}}>
                            <td><span className="sku-badge">{r.sku}</span></td>
                            <td style={{fontWeight:500,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td>
                            <td style={{color:'var(--text3)',fontSize:11}}>{r.cat}</td>
                            <td className="r" style={{fontFamily:'var(--mono)',fontWeight:700,color:(r.last1d||0)>0?'var(--green)':'var(--text3)'}}>{r.last1d||0}</td>
                <td className="r" style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--blue)'}}
                                title={'7d×0.5 + 15d×0.3 + 30d×0.2 = '+r.wdrr}>
                              {r.wdrr}
                            </td>
                            <td className="r" style={{fontFamily:'var(--mono)',fontSize:11,
                                color:r.drr7>r.drr30?'var(--amber-mid)':'var(--text3)'}}>{rnd(r.drr7)}</td>
                            <td className="r" style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{rnd(r.drr30)}</td>
                            <td className="r" style={{fontFamily:'var(--mono)'}}>{r.inv.toLocaleString()}</td>
                            <td className="r"><DocBadge doc={r.wdoc} /></td>
                            <td className="r" style={{fontFamily:'var(--mono)',fontSize:11,
                                color:r.wdoc<15?'var(--red-mid)':'var(--text2)'}}>{r.stockoutDate}</td>
                            <td className="r" style={{fontFamily:'var(--mono)',fontSize:11,
                                color:r.daysLeft!==null&&r.daysLeft<=7?'var(--red-mid)':'var(--text2)'}}>{r.reorderDate}</td>
                            <td className="r">
                              {r.daysLeft===null ? '—' : (
                                <span style={{fontFamily:'var(--mono)',fontWeight:700,
                                    color:r.daysLeft<=0?'var(--red-mid)':r.daysLeft<=7?'var(--amber-mid)':'var(--text2)'}}>
                                  {r.daysLeft<=0 ? Math.abs(r.daysLeft)+'d ago' : r.daysLeft+'d'}
                                </span>
                              )}
                            </td>
                            <td className="r" style={{fontFamily:'var(--mono)'}}>{r.need60.toLocaleString()}</td>
                            <td className="r" style={{fontFamily:'var(--mono)',color:'var(--blue)'}}>{r.openPOUnits.toLocaleString()}</td>
                            <td className="r">
                              <span style={{fontFamily:'var(--mono)',fontWeight:700,
                                  color:r.netNeed>0?'var(--red-mid)':'var(--green)'}}>
                                {r.netNeed>0 ? r.netNeed.toLocaleString() : '✓ Covered'}
                              </span>
                            </td>
                            <td className="r">
                              <span style={{fontFamily:'var(--mono)',fontWeight:600,color:trendCol}}>
                                {trendIcon} {r.trendPct>0?'+':''}{r.trendPct}%
                              </span>
                            </td>
                            <td>
                              <span style={{background:uc.bg,color:uc.col,padding:'2px 8px',
                                  borderRadius:4,fontSize:10,fontWeight:600,whiteSpace:'nowrap'}}>
                                {uc.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>)}

            {/* ── SUB-TAB: VENDOR-WISE PO VIEW ── */}
            {forecastSubTab === 'vendor' && (
              <div>
                <div style={{background:'var(--blue-dim)',border:'1px solid rgba(26,95,165,.2)',borderRadius:8,
                    padding:'8px 14px',marginBottom:14,fontSize:11,color:'var(--blue)',lineHeight:1.6}}>
                  <strong>PO Planning (45-day target):</strong>
                  &nbsp;PO Qty = max(0, DRR Max × 45 − Inventory − Open PO) &nbsp;·&nbsp;
                  Items grouped by Primary Vendor &nbsp;·&nbsp; Sorted by most critical first
                </div>
                {vendorsSorted.length === 0
                  ? <div className="empty-state"><i className="ti ti-building-store" /><p>No POs needed — all items covered</p></div>
                  : vendorsSorted.map(function(vendor) {
                    var vitems = poplanByVendor[vendor];
                    var totalQty = vitems.reduce(function(s,r){return s+r.poNeeded;},0);
                    var critCount = vitems.filter(function(r){return r.urgency==='today';}).length;
                    var fmt = function(n){return Math.round(n).toLocaleString('en-IN');};
                    var fmtK = function(n){return n>=100000?(n/100000).toFixed(1)+'L':n>=1000?(n/1000).toFixed(1)+'K':String(Math.round(n));};
                    return (
                      <div key={vendor} style={{marginBottom:12,border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                            background:'var(--bg3)',padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <i className="ti ti-building-store" style={{fontSize:14,color:'var(--blue)'}} />
                            <div>
                              <div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>{vendor}</div>
                              <div style={{fontSize:11,color:'var(--text3)'}}>{vitems.length} SKU{vitems.length!==1?'s':''}{critCount>0 && <span style={{color:'var(--red)',fontWeight:600,marginLeft:6}}>· {critCount} critical today</span>}</div>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            {critCount>0 && <span style={{background:'var(--red-dim)',color:'var(--red)',border:'1px solid var(--red-mid)',borderRadius:5,padding:'3px 10px',fontSize:11,fontWeight:600}}>🔴 {critCount} today</span>}
                            <span style={{background:'var(--blue-dim)',color:'var(--blue)',border:'1px solid var(--blue-mid)',borderRadius:5,padding:'3px 10px',fontSize:12,fontWeight:700}}>PO qty: {fmtK(totalQty)}</span>
                          </div>
                        </div>
                        <POPlanTable items={vitems} showUrgency={true} />
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* ── SUB-TAB: ORDER TODAY ── */}
            {forecastSubTab === 'today' && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',
                    background:'var(--red-dim)',border:'1px solid var(--red-mid)',borderRadius:8}}>
                  <i className="ti ti-alert-circle" style={{fontSize:18,color:'var(--red)'}} />
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--red)'}}>
                      {pplan_today.length} SKUs must be ordered TODAY — DOC ≤ 10d, no open PO, stock needed
                    </div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
                      DOC ≤ 10d, no open PO, still need stock · Total PO qty: {pplan_today.reduce(function(s,r){return s+r.poNeeded;},0).toLocaleString('en-IN')} units
                    </div>
                  </div>
                </div>
                <POPlanTable items={pplan_today} showUrgency={false} />
              </div>
            )}

            {/* ── SUB-TAB: NEXT 7 DAYS ── */}
            {forecastSubTab === '7d' && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',
                    background:'var(--amber-dim)',border:'1px solid var(--amber-mid)',borderRadius:8}}>
                  <i className="ti ti-clock" style={{fontSize:18,color:'var(--amber)'}} />
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--amber)'}}>
                      {pplan_7d.length} SKUs — stock runs out within 17 days (10d lead + 7d), no open PO
                    </div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
                      DOC ≤ 17d (lead 10d + 7d), no open PO, still need stock · Total PO qty: {pplan_7d.reduce(function(s,r){return s+r.poNeeded;},0).toLocaleString('en-IN')} units
                    </div>
                  </div>
                </div>
                <POPlanTable items={pplan_7d} showUrgency={true} />
              </div>
            )}

            {/* ── SUB-TAB: NEXT 15 DAYS ── */}
            {forecastSubTab === '15d' && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',
                    background:'#fef3c7',border:'1px solid #fde68a',borderRadius:8}}>
                  <i className="ti ti-calendar" style={{fontSize:18,color:'#92400e'}} />
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#92400e'}}>
                      {pplan_15d.length} SKUs — stock runs out within 25 days (10d lead + 15d), no open PO
                    </div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
                      DOC ≤ 25d (lead 10d + 15d), no open PO, still need stock · Total PO qty: {pplan_15d.reduce(function(s,r){return s+r.poNeeded;},0).toLocaleString('en-IN')} units
                    </div>
                  </div>
                </div>
                <POPlanTable items={pplan_15d} showUrgency={true} />
              </div>
            )}

          </div>
        )}

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
        
        .upload-text p{font-size:11px;color:var(--text3);font-family:var(--mono)}
        .slot{display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg3);font-size:11px;font-family:var(--mono);transition:all .15s}
        .slot:hover{border-color:var(--blue-mid);background:var(--blue-dim)}
        .slot .sl{font-weight:500;color:var(--text2)}
        .slot .ss{font-size:10px;color:var(--text3);margin-left:2px}
        .slot.loaded{border-color:var(--green);background:var(--green-dim)}
        .slot.loaded .sl,.slot.loaded .ss{color:var(--green)}
.upload-zone{background:var(--bg2);border:1.5px dashed var(--border2);border-radius:14px;padding:1.25rem 1.5rem}
        .upload-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
        .upload-left{display:flex;align-items:center;gap:12px}
        .upload-icon{width:42px;height:42px;border-radius:10px;background:var(--blue-dim);border:1px solid rgba(26,95,165,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .upload-icon i{font-size:20px;color:var(--blue)}
        .upload-text h3{font-size:13px;font-weight:600;margin-bottom:2px}
        .upload-text p{font-size:11px;color:var(--text3)}
        .upload-hint{margin-top:10px;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
        .sh-cols{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
        .sh-pill{font-size:10px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:1px 6px;color:var(--text2);font-family:var(--mono)}
        .ul-btn{display:flex;flex-direction:column;align-items:center;padding:6px 14px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;cursor:pointer;min-width:110px;transition:background .15s}
        .ul-btn:hover{background:var(--blue-dim)}
        .sl{font-size:11px;font-weight:600;color:var(--text)}
        .ss{font-size:10px;color:var(--text3);margin-top:1px}
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
        .tab-bar{display:flex;gap:4px;margin-bottom:0.5rem;background:var(--bg3);padding:4px;border-radius:10px;width:fit-content;border:1px solid var(--border)}
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
