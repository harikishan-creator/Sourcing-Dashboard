/**
 * pages/api/uniware.js — Secure Vercel proxy with Upstash Redis shared cache
 * Strategy: cache ALL job results server-side (shared across all users)
 * - inventory:  TTL 30 min  (changes frequently)
 * - drr48h:     TTL 1h      (intraday sales)
 * - drr30:      TTL 6h      (30d window, slow to change)
 * - po:         TTL 2h      (POs change a few times a day)
 *
 * First user of the day triggers the fetch + caches result.
 * Every subsequent user gets it instantly from Redis (~50ms).
 * Manual "Full Fetch" button bypasses cache (forceRefresh=true).
 */

import { init, triggerJob, pollJob, downloadCSV } from '../../lib/mcpClient';
import { Redis } from '@upstash/redis';

export const config = { maxDuration: 60 };

// TTLs in seconds
const TTL = {
  inventory: 30 * 60,   // 30 min
  drr48h:    60 * 60,   // 1 hour
  drr30:     6 * 60 * 60, // 6 hours
  po:        2 * 60 * 60, // 2 hours
};

let redis = null;
function getRedis() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function cacheKey(type, facility) {
  return `inv_cache_v2_${type}_${facility}`;
}

// Compute DRR maps from raw rows (runs server-side, returns compact map)
function computeDRRMaps(rows) {
  const now = Date.now();
  const cut7  = now - 7  * 86400000;
  const cut15 = now - 15 * 86400000;
  const cut30 = now - 30 * 86400000;
  const c7 = {}, c15 = {}, c30 = {};
  (rows || []).forEach(r => {
    const s = (r['Item SKU Code'] || r['Item SkuCode'] || '').trim();
    if (!s) return;
    const t = r['Created'] ? new Date(r['Created']).getTime() : 0;
    if (t >= cut7)  c7[s]  = (c7[s]  || 0) + 1;
    if (t >= cut15) c15[s] = (c15[s] || 0) + 1;
    if (t >= cut30) c30[s] = (c30[s] || 0) + 1;
  });
  const map = {};
  [...new Set([...Object.keys(c7), ...Object.keys(c15), ...Object.keys(c30)])].forEach(s => {
    map[s] = {
      d7:  Math.round((c7[s]  || 0) / 7),
      d15: Math.round((c15[s] || 0) / 15),
      d30: Math.round((c30[s] || 0) / 30),
    };
  });
  return map;
}

// Run a full job: trigger → poll → download → return rows
async function runFullJob(type, facility) {
  const jobCode = await triggerJob(type, facility);
  if (!jobCode) throw new Error(`trigger failed: ${type}/${facility}`);

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000)); // poll every 3s
    const pd = await pollJob(jobCode, facility);
    if (pd.status === 'DONE') {
      const rows = await downloadCSV(pd.url);
      return rows || [];
    }
    if (pd.status === 'FAILED') throw new Error(`job failed: ${type}/${facility}`);
  }
  throw new Error(`job timeout: ${type}/${facility}`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.MCP_TOKEN) return res.status(500).json({ error: 'MCP_TOKEN not configured' });
  if (req.method === 'GET')   return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { action, type, facility, jobCode, url, forceRefresh } = req.body || {};

  try {
    await init();

    // ── TRIGGER ───────────────────────────────────────────────────────────────
    if (action === 'trigger') {
      const r = getRedis();

      // Check Redis cache first (unless forceRefresh)
      if (r && !forceRefresh) {
        try {
          const cached = await r.get(cacheKey(type, facility));
          if (cached && cached.rows !== undefined) {
            const ageMin = Math.round((Date.now() - cached.ts) / 60000);
            console.log(`[Redis] HIT ${type}/${facility} — ${cached.rows.length} rows, ${ageMin}m old`);

            // For DRR types, return pre-computed drrMap directly
            if ((type === 'drr30' || type === 'drr48h') && cached.drrMap) {
              return res.status(200).json({
                jobCode:  'KV_CACHED',
                facility, type,
                drrMap:   cached.drrMap,
                cachedAt: cached.ts,
                ageMin,
              });
            }
            // For inventory/po, return rows directly
            return res.status(200).json({
              jobCode:  'KV_CACHED',
              facility, type,
              rows:     cached.rows,
              cachedAt: cached.ts,
              ageMin,
            });
          }
        } catch(e) { console.warn('[Redis] Read error:', e.message); }
      }

      // Cache miss — trigger the Unicommerce job normally
      const code = await triggerJob(type, facility);
      return res.status(200).json({ jobCode: code, facility, type });
    }

    // ── POLL ──────────────────────────────────────────────────────────────────
    if (action === 'poll') {
      if (jobCode === 'KV_CACHED') return res.status(200).json({ status: 'DONE', url: 'KV_CACHED' });
      const result = await pollJob(jobCode, facility);
      return res.status(200).json(result);
    }

    // ── DOWNLOAD ──────────────────────────────────────────────────────────────
    if (action === 'download') {
      if (url === 'KV_CACHED') return res.status(200).json({ rows: [], fromCache: true });

      const rows = await downloadCSV(url);

      // Save to Redis cache
      const r = getRedis();
      if (r) {
        try {
          const ttl = TTL[type] || 3600;
          const payload = { rows, ts: Date.now() };
          // For DRR, also pre-compute and store the map
          if (type === 'drr30' || type === 'drr48h') {
            payload.drrMap = computeDRRMaps(rows);
          }
          await r.set(cacheKey(type, facility), payload, { ex: ttl });
          console.log(`[Redis] CACHED ${type}/${facility} — ${rows.length} rows, TTL ${ttl}s`);
        } catch(e) { console.warn('[Redis] Write error:', e.message); }
      }

      return res.status(200).json({ rows });
    }

    // ── PREFETCH (background job — called by cron or manually) ───────────────
    // Runs all jobs for all facilities and warms the cache
    // Call: POST /api/uniware { action: 'prefetch', forceRefresh: true }
    if (action === 'prefetch') {
      const FACILITIES = ['astrotalk', 'MSKT_FZP', 'Emiza_MMB', 'AT_global'];
      const TYPES = ['inventory', 'drr30', 'po'];
      const r = getRedis();
      if (!r) return res.status(500).json({ error: 'Redis not configured' });

      const results = [];
      for (const t of TYPES) {
        const facList = t === 'po' ? ['astrotalk', 'MSKT_FZP'] : FACILITIES;
        for (const fac of facList) {
          try {
            const rows = await runFullJob(t, fac);
            const ttl = TTL[t] || 3600;
            const payload = { rows, ts: Date.now() };
            if (t === 'drr30' || t === 'drr48h') payload.drrMap = computeDRRMaps(rows);
            await r.set(cacheKey(t, fac), payload, { ex: ttl });
            results.push({ type: t, facility: fac, rows: rows.length, ok: true });
            console.log(`[Prefetch] ${t}/${fac} — ${rows.length} rows cached`);
          } catch(e) {
            results.push({ type: t, facility: fac, ok: false, error: e.message });
            console.error(`[Prefetch] ${t}/${fac} failed:`, e.message);
          }
        }
      }
      return res.status(200).json({ ok: true, results });
    }

    // ── INVALIDATE CACHE ──────────────────────────────────────────────────────
    if (action === 'invalidate_cache') {
      const r = getRedis();
      if (r) {
        const FACILITIES = ['astrotalk', 'MSKT_FZP', 'Emiza_MMB', 'AT_global'];
        const TYPES = ['inventory', 'drr30', 'drr48h', 'po'];
        for (const t of TYPES)
          for (const fac of FACILITIES)
            await r.del(cacheKey(t, fac)).catch(() => {});
        console.log('[Redis] All caches invalidated');
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch(err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
