/**
 * pages/api/uniware.js — Secure Vercel proxy with Upstash Redis cache
 * drr30/MSKT_FZP: computed server-side, only DRR maps cached (~5KB, 6h TTL)
 * Shared across all team members via Upstash Redis
 */

import { init, triggerJob, pollJob, downloadCSV } from '../../lib/mcpClient';
import { Redis } from '@upstash/redis';

export const config = { maxDuration: 60 };

const KV_KEY = 'drrmap_mskt_fzp_v1';
const KV_TTL = 6 * 60 * 60; // 6 hours

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

// Compute DRR maps from raw rows (runs server-side)
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
  const allSkus = new Set([...Object.keys(c7), ...Object.keys(c15), ...Object.keys(c30)]);
  allSkus.forEach(s => {
    map[s] = {
      d7:  Math.round((c7[s]  || 0) / 7),
      d15: Math.round((c15[s] || 0) / 15),
      d30: Math.round((c30[s] || 0) / 30),
    };
  });
  return map;  // { 'BP_0429': { d7: 938, d15: 511, d30: 381 }, ... }
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
      // Check Redis for pre-computed DRR map for MSKT_FZP
      if (type === 'drr30' && facility === 'MSKT_FZP' && !forceRefresh) {
        const r = getRedis();
        if (r) {
          try {
            const cached = await r.get(KV_KEY);
            if (cached && cached.map) {
              const ageMin = Math.round((Date.now() - cached.ts) / 60000);
              console.log('[Redis] HIT drrmap/MSKT_FZP —', Object.keys(cached.map).length, 'SKUs,', ageMin, 'min old');
              return res.status(200).json({
                jobCode:   'KV_CACHED',
                facility,  type,
                drrMap:    cached.map,   // pre-computed { sku: {d7,d15,d30} }
                cachedAt:  cached.ts,
              });
            }
          } catch (e) { console.warn('[Redis] Read error:', e.message); }
        }
      }
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

      // For drr30/MSKT_FZP: compute maps server-side and cache them (~5KB)
      if (type === 'drr30' && facility === 'MSKT_FZP') {
        const drrMap = computeDRRMaps(rows);
        const r = getRedis();
        if (r) {
          try {
            await r.set(KV_KEY, { map: drrMap, ts: Date.now() }, { ex: KV_TTL });
            console.log('[Redis] CACHED drrmap/MSKT_FZP —', Object.keys(drrMap).length, 'SKUs');
          } catch (e) { console.warn('[Redis] Write error:', e.message); }
        }
        // Return rows as normal — client will compute its own maps from rows
        // (or we could return drrMap directly — client handles both)
      }

      return res.status(200).json({ rows });
    }

    // ── INVALIDATE CACHE ──────────────────────────────────────────────────────
    if (action === 'invalidate_cache') {
      const r = getRedis();
      if (r) { await r.del(KV_KEY); console.log('[Redis] Cache invalidated'); }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
