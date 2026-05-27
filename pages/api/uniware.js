/**
 * pages/api/uniware.js — Secure Vercel proxy
 * 4 facilities × (1 inventory + 3 DRR + 1 PO + 1 GRN) = ~16 sequential jobs
 * Each job takes ~15-20s → total ~4-5 min
 * Vercel Pro max = 300s
 */

import { init, fetchInventory, fetchPurchaseOrders, fetchGRN } from '../../lib/mcpClient';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.MCP_TOKEN) return res.status(500).json({ error: 'MCP_TOKEN not configured' });

  const { type = 'all' } = req.query;

  try {
    await init();

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

    // type=all
    const result = { inventory: [], po: {}, grn: [], errors: {}, fetchedAt: new Date().toISOString() };
    try { result.inventory = await fetchInventory(); } catch (e) { result.errors.inventory = e.message; }
    try { result.po = await fetchPurchaseOrders(); }   catch (e) { result.errors.po = e.message; }
    try { result.grn = await fetchGRN(); }             catch (e) { result.errors.grn = e.message; }
    return res.status(200).json(result);

  } catch (err) {
    console.error('[/api/uniware]', err);
    return res.status(500).json({ error: err.message });
  }
}
