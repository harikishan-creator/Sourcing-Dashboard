/**
 * pages/api/uniware.js — Secure Vercel API proxy
 *
 * Flow per request:
 *   1. init()  → POST initialize to MCP → captures mcp-session-id header
 *   2. fetch*  → POST tools/call using that session ID
 *
 * MCP_TOKEN never reaches the browser.
 */

import { init, fetchInventory, fetchPurchaseOrders, fetchGRN } from '../../lib/mcpClient';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.MCP_TOKEN) return res.status(500).json({ error: 'MCP_TOKEN not configured' });

  const { type = 'all' } = req.query;

  try {
    // Step 1: Initialize MCP session — must happen before any tool calls
    await init();

    // Step 2: Fetch requested data
    if (type === 'inventory') {
      const inventory = await fetchInventory();
      return res.status(200).json({ inventory, fetchedAt: new Date().toISOString() });
    }

    if (type === 'po') {
      const po = await fetchPurchaseOrders();
      return res.status(200).json({ po, fetchedAt: new Date().toISOString() });
    }

    if (type === 'grn') {
      const grn = await fetchGRN();
      return res.status(200).json({ grn, fetchedAt: new Date().toISOString() });
    }

    // type=all — run sequentially so session stays valid
    const result = { inventory: [], po: {}, grn: [], errors: {}, fetchedAt: new Date().toISOString() };

    try { result.inventory = await fetchInventory(); }
    catch (e) { result.errors.inventory = e.message; }

    try { result.po = await fetchPurchaseOrders(); }
    catch (e) { result.errors.po = e.message; }

    try { result.grn = await fetchGRN(); }
    catch (e) { result.errors.grn = e.message; }

    return res.status(200).json(result);

  } catch (err) {
    console.error('[/api/uniware]', err);
    return res.status(500).json({ error: err.message });
  }
}
