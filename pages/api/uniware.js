/**
 * pages/api/uniware.js — Secure Vercel proxy
 * Each action completes in < 10s (Vercel Hobby limit)
 * Cache handled client-side in browser sessionStorage
 */

import { init, triggerJob, pollJob, downloadCSV } from '../../lib/mcpClient';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (!process.env.MCP_TOKEN) return res.status(500).json({ error: 'MCP_TOKEN not configured' });

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true });
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

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('[/api/uniware]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
