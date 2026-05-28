/**
 * pages/api/cache.js
 * 
 * Simple server-side cache using Vercel's filesystem (ephemeral, per-instance).
 * Stores last full-fetch timestamp and job results.
 * 
 * Cache strategy:
 *   - Full fetch (30d DRR + inventory): once per day (>= 24h since last)
 *   - Delta fetch (48h DRR only): on every subsequent refresh same day
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CACHE_FILE = join('/tmp', 'dashboard-cache.json');
const FULL_FETCH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function readCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch { /* ignore */ }
  return { lastFullFetch: null, inventory: null, po: null };
}

function writeCache(data) {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function shouldDoFullFetch() {
  const cache = readCache();
  if (!cache.lastFullFetch) return true;
  const age = Date.now() - new Date(cache.lastFullFetch).getTime();
  return age >= FULL_FETCH_INTERVAL_MS;
}

export function getCachedInventory() {
  return readCache().inventory || null;
}

export function getCachedPO() {
  return readCache().po || null;
}

export function saveCache(inventory, po) {
  writeCache({
    lastFullFetch: new Date().toISOString(),
    inventory,
    po,
  });
}

export function getLastFullFetch() {
  return readCache().lastFullFetch;
}
