// lib/access.js — verifies the signed data-token minted by the Inventory-Portal
// shell and enforces tab access on the Products data API.
//
// Env vars (Vercel → Sourcing-Dashboard project):
//   SESSION_SECRET  — MUST be the SAME value as the Inventory-Portal project.
//   ACCESS_ENFORCE  — set to "true" to turn the wall ON. Anything else = log-only
//                     (lets you deploy the code first, set env, then flip it on).

const crypto = require('crypto');
const { SESSION_SECRET, ACCESS_ENFORCE } = process.env;

function verifyToken(token) {
  try {
    if (!SESSION_SECRET) return null;
    const [data, sig] = String(token).split('.');
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function extractToken(req) {
  // header preferred; fall back to query (?t=) or JSON body {t}
  const h = req.headers['x-access-token'] || req.headers['authorization'];
  if (h) return h.replace(/^Bearer\s+/i, '').trim();
  if (req.query && req.query.t) return req.query.t;
  if (req.body && req.body.t) return req.body.t;
  return null;
}

// Returns { ok:true, email } or { ok:false, status, reason }
function checkAccess(req, required = 'products') {
  const need = Array.isArray(required) ? required : [required];
  const enforce = String(ACCESS_ENFORCE).toLowerCase() === 'true';
  const token = extractToken(req);
  const payload = token ? verifyToken(token) : null;
  const allowed = !!(payload && Array.isArray(payload.tabs) && need.some(t => payload.tabs.includes(t)));

  if (allowed) return { ok: true, email: payload.email };

  const reason = !token ? 'no access token'
              : !payload ? 'invalid or expired token'
              : `none of [${need.join(', ')}] permitted`;

  if (!enforce) {
    // log-only mode: allow through but record the miss (for safe rollout)
    console.warn('[access] would block:', reason, '(ACCESS_ENFORCE off)');
    return { ok: true, email: payload && payload.email, softAllowed: true };
  }
  return { ok: false, status: 403, reason };
}

module.exports = { checkAccess, verifyToken };
