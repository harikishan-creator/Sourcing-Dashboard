/**
 * pages/api/uniware.js — Secure Vercel proxy with Upstash Redis cache
 * drr30/MSKT_FZP cached for 6 hours — shared across all team members
 */

import { init, triggerJob, pollJob, downloadCSV } from '../../lib/mcpClient';
import { Redis } from '@upstash/redis';

export const config = { maxDuration: 60 };

const KV_KEY = 'drr30_mskt_fzp';
const KV_TTL = 6 * 60 * 60; // 6 hours in seconds

// Init Redis — uses UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
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

export default async function handler(req, res) {
  // CORS
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
      // Check Redis cache for drr30/MSKT_FZP
      if (type === 'drr30' && facility === 'MSKT_FZP' && !forceRefresh) {
        const r = getRedis();
        if (r) {
          try {
            const cached = await r.get(KV_KEY);
            if (cached) {
              console.log('[Redis] Cache hit drr30/MSKT_FZP —', cached.rows?.length, 'rows');
              return res.status(200).json({
                jobCode:    'KV_CACHED',
                facility,
                type,
                cachedRows: cached.rows,
                cachedAt:   cached.ts,
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

      // Cache drr30/MSKT_FZP in Redis after download
      if (type === 'drr30' && facility === 'MSKT_FZP') {
        const r = getRedis();
        if (r) {
          try {
            await r.set(KV_KEY, { rows, ts: Date.now() }, { ex: KV_TTL });
            console.log('[Redis] Cached drr30/MSKT_FZP —', rows.length, 'rows, TTL 6h');
          } catch (e) { console.warn('[Redis] Write error:', e.message); }
        }
      }
      return res.status(200).json({ rows });
    }

    // ── INVALIDATE CACHE (Full Fetch button) ──────────────────────────────────
    if (action === 'invalidate_cache') {
      const r = getRedis();
      if (r) {
        await r.del(KV_KEY);
        console.log('[Redis] Cache invalidated');
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
