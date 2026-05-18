/**
 * pages/api/uniware.js
 *
 * Secure server-side proxy for the Uniware MCP server.
 * The MCP_TOKEN env var is NEVER exposed to the browser.
 *
 * GET /api/uniware?type=inventory   → INV array
 * GET /api/uniware?type=po          → PO_BY_SKU map
 * GET /api/uniware?type=drr         → DRR rows (CSV)
 * GET /api/uniware?type=grn         → GRN rows (CSV)
 * GET /api/uniware?type=all         → { inventory, po, grn, fetchedAt }
 */

import { fetchInventory, fetchPurchaseOrders, fetchGRN } from '../../lib/mcpClient';

export const config = {
  maxDuration: 60,   // Vercel Pro allows up to 300s; free tier 60s
};

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check — make sure MCP token is configured
  if (!process.env.MCP_TOKEN) {
    return res.status(500).json({ error: 'MCP_TOKEN not configured on server' });
  }

  const { type = 'all' } = req.query;

  try {
    switch (type) {

      case 'inventory': {
        const inventory = await fetchInventory();
        return res.status(200).json({ inventory, fetchedAt: new Date().toISOString() });
      }

      case 'po': {
        const po = await fetchPurchaseOrders();
        return res.status(200).json({ po, fetchedAt: new Date().toISOString() });
      }

      case 'grn': {
        const grn = await fetchGRN();
        return res.status(200).json({ grn, fetchedAt: new Date().toISOString() });
      }

      case 'all': {
        // Fetch inventory + POs in parallel; GRN is supplementary
        const [inventory, po, grn] = await Promise.allSettled([
          fetchInventory(),
          fetchPurchaseOrders(),
          fetchGRN(),
        ]);

        return res.status(200).json({
          inventory:  inventory.status  === 'fulfilled' ? inventory.value  : [],
          po:         po.status         === 'fulfilled' ? po.value         : {},
          grn:        grn.status        === 'fulfilled' ? grn.value        : [],
          errors: {
            inventory: inventory.status  === 'rejected' ? inventory.reason?.message  : null,
            po:        po.status         === 'rejected' ? po.reason?.message         : null,
            grn:       grn.status        === 'rejected' ? grn.reason?.message        : null,
          },
          fetchedAt: new Date().toISOString(),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown type: ${type}` });
    }
  } catch (err) {
    console.error('[/api/uniware] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
