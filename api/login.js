// POST /api/login { key, code? }  → sets the admin session cookie.
import { configured, keyMatches, codeMatches, totpEnabled, sessionCookie, clientIp, lockedFor, recordFail, recordSuccess } from './_lib/auth.js';
import { only } from './_lib/http.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!only(req, res, 'POST')) return;
  if (!configured()) return res.status(503).json({ error: 'The admin panel is not set up yet: ADMIN_KEY (20+ characters) and SESSION_SECRET are missing in Vercel.' });
  if (req.headers['x-admin-request'] !== '1') return res.status(403).json({ error: 'Request blocked.' });

  const ip = clientIp(req);
  const locked = lockedFor(ip);
  if (locked) return res.status(429).json({ error: `Too many wrong attempts. Try again in ${Math.ceil(locked / 60000)} minutes.` });

  const { key, code } = req.body || {};
  const ok = keyMatches(key) && codeMatches(code);
  if (!ok) {
    recordFail(ip);
    await wait(700 + Math.random() * 500); // slows guessing
    return res.status(401).json({ error: totpEnabled() ? 'Wrong Admin Key or code.' : 'Wrong Admin Key.' });
  }
  recordSuccess(ip);
  res.setHeader('Set-Cookie', sessionCookie());
  res.status(200).json({ ok: true });
}
