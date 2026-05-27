/**
 * pages/api/uniware.js
 *
 * Redesigned for Vercel Hobby (10s timeout) and Pro (300s):
 *
 * Single job per request — frontend calls multiple times:
 *   POST /api/uniware { action: 'trigger', type: 'inventory', facility: 'MSKT_FZP' }
 *     → { jobCode, facility, type }
 *   POST /api/uniware { action: 'poll', jobCode, facility }
 *     → { status, url } or { status: 'RUNNING' }
 *   POST /api/uniware { action: 'download', url }
 *     → { rows }
 *   GET  /api/uniware?type=ping
 *     → { ok: true }  (health check)
 */

import { init, triggerJob, pollJob, downloadCSV, parseDRR, parseInventoryRows, parsePORows } from '../../lib/mcpClient';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (!process.env.MCP_TOKEN) return res.status(500).json({ error: 'MCP_TOKEN not configured' });

  // Health check
  if (req.method === 'GET' && req.query.type === 'ping') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { action, type, facility, jobCode, url, days } = req.body || {};

  try {
    await init();

    if (action === 'trigger') {
      // Trigger one export job and return jobCode immediately
      const code = await triggerJob(type, facility);
      return res.status(200).json({ jobCode: code, facility, type });
    }

    if (action === 'poll') {
      // Poll one job — returns fast
      const result = await pollJob(jobCode, facility);
      return res.status(200).json(result);
    }

    if (action === 'download') {
      // Download CSV and parse it — returns rows
      const rows = await downloadCSV(url);
      return res.status(200).json({ rows });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
