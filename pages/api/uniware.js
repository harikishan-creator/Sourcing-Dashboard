/**
 * pages/api/uniware.js — Secure Vercel proxy
 *
 * Smart fetch strategy:
 *   FULL FETCH  (once per day):    Inventory Snapshot + 30d/15d/7d DRR + PO
 *   DELTA FETCH (subsequent calls): Inventory Snapshot + 48h DRR only (fast)
 *
 * Each individual action completes in < 10s (Vercel Hobby limit).
 */

import { init, triggerJob, pollJob, downloadCSV } from '../../lib/mcpClient';
import { shouldDoFullFetch, getCachedInventory, getCachedPO, saveCache, getLastFullFetch } from './cache';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (!process.env.MCP_TOKEN) return res.status(500).json({ error: 'MCP_TOKEN not configured' });

  // Health / info check
  if (req.method === 'GET') {
    const needFull = shouldDoFullFetch();
    const lastFull = getLastFullFetch();
    return res.status(200).json({
      ok: true,
      needFullFetch: needFull,
      lastFullFetch: lastFull,
      mode: needFull ? 'full' : 'delta',
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { action, type, facility, jobCode, url } = req.body || {};

  try {
    await init();

    if (action === 'trigger') {
      const code = await triggerJob(type, facility);
      return res.status(200).json({ jobCode: code, facility, type });
    }

    if (action === 'poll') {
      const result = await pollJob(jobCode, facility);
      return res.status(200).json(result);
    }

    if (action === 'download') {
      const rows = await downloadCSV(url);
      return res.status(200).json({ rows });
    }

    if (action === 'save_cache') {
      const { inventory, po } = req.body;
      saveCache(inventory, po);
      return res.status(200).json({ saved: true });
    }

    if (action === 'get_cache') {
      return res.status(200).json({
        inventory: getCachedInventory(),
        po:        getCachedPO(),
        lastFullFetch: getLastFullFetch(),
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
