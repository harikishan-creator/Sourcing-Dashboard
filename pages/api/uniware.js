/**
 * pages/api/uniware.js — Secure Vercel proxy with KV cache
 * drr30/MSKT_FZP is cached in Vercel KV for 6 hours (shared across all users)
 */

import { init, triggerJob, pollJob, downloadCSV } from '../../lib/mcpClient';

export const config = { maxDuration: 60 };

// KV cache key and TTL
const KV_KEY   = 'drr30_mskt_fzp';
const KV_TTL   = 6 * 60 * 60; // 6 hours in seconds

// Lazy-load KV to avoid build errors if env vars not set
async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS — allow packaging.html and other Vercel deployments
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
      // Check KV cache for drr30/MSKT_FZP (the slow job)
      if (type === 'drr30' && facility === 'MSKT_FZP' && !forceRefresh) {
        const kv = await getKV();
        if (kv) {
          try {
            const cached = await kv.get(KV_KEY);
            if (cached) {
              // Return a special jobCode indicating cached data is available
              console.log('[KV] Cache hit for drr30/MSKT_FZP');
              return res.status(200).json({ 
                jobCode: 'KV_CACHED', 
                facility, 
                type,
                cachedRows: cached.rows,
                cachedAt: cached.ts,
              });
            }
          } catch (kvErr) {
            console.warn('[KV] Read error:', kvErr.message);
          }
        }
      }

      const code = await triggerJob(type, facility);
      return res.status(200).json({ jobCode: code, facility, type });
    }

    // ── POLL ──────────────────────────────────────────────────────────────────
    if (action === 'poll') {
      // KV_CACHED jobs are already done
      if (jobCode === 'KV_CACHED') {
        return res.status(200).json({ status: 'DONE', url: 'KV_CACHED' });
      }
      const result = await pollJob(jobCode, facility);
      return res.status(200).json(result);
    }

    // ── DOWNLOAD ──────────────────────────────────────────────────────────────
    if (action === 'download') {
      // KV_CACHED — rows already returned in trigger response, this is a no-op
      if (url === 'KV_CACHED') {
        return res.status(200).json({ rows: [], fromCache: true });
      }

      const rows = await downloadCSV(url);

      // Save drr30/MSKT_FZP to KV cache after download
      if (type === 'drr30' && facility === 'MSKT_FZP') {
        const kv = await getKV();
        if (kv) {
          try {
            await kv.set(KV_KEY, { rows, ts: Date.now() }, { ex: KV_TTL });
            console.log(`[KV] Cached drr30/MSKT_FZP — ${rows.length} rows, TTL ${KV_TTL}s`);
          } catch (kvErr) {
            console.warn('[KV] Write error:', kvErr.message);
          }
        }
      }

      return res.status(200).json({ rows });
    }

    // ── CACHE INVALIDATE (called by Full Fetch button) ────────────────────────
    if (action === 'invalidate_cache') {
      const kv = await getKV();
      if (kv) {
        await kv.del(KV_KEY);
        console.log('[KV] Cache invalidated');
      }
      return res.status(200).json({ ok: true, invalidated: KV_KEY });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
