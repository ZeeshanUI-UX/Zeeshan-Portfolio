// Admin authentication: one secret Admin Key (+ optional authenticator code).
//
// Environment variables (Vercel → Settings → Environment Variables):
//   ADMIN_KEY       your Admin Key (at least 20 characters). Only the server reads it.
//   SESSION_SECRET  long random string used to sign the login cookie.
//   TOTP_SECRET     optional: base32 secret for a 6-digit authenticator code.
//
// Changing ADMIN_KEY or SESSION_SECRET signs every session out at once.
import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const COOKIE = 'zm_admin';
const SESSION_HOURS = 12;
const MIN_KEY_LENGTH = 20;

const sha256 = (s) => createHash('sha256').update(String(s)).digest();
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function secrets() {
  const key = process.env.ADMIN_KEY || '';
  const secret = process.env.SESSION_SECRET || '';
  if (key.length < MIN_KEY_LENGTH || secret.length < 32) return null;
  return { key, secret, keyId: sha256(key).toString('hex').slice(0, 16) };
}

export const totpEnabled = () => Boolean(process.env.TOTP_SECRET);
export const configured = () => Boolean(secrets());

/* ---------- key and code checks ---------- */

export function keyMatches(given) {
  const s = secrets();
  if (!s || typeof given !== 'string') return false;
  return timingSafeEqual(sha256(given), sha256(s.key)); // equal-length digests: no length leak
}

function base32Decode(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of str.toUpperCase().replace(/[^A-Z2-7]/g, '')) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totpAt(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', secret).update(buf).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1e6).padStart(6, '0');
}

export function codeMatches(code) {
  if (!totpEnabled()) return true;
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  const secret = base32Decode(process.env.TOTP_SECRET);
  const now = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((d) => {
    const want = totpAt(secret, now + d);
    return timingSafeEqual(Buffer.from(want), Buffer.from(String(code)));
  });
}

/* ---------- attempt limiting ----------
   Serverless instances keep this in memory while warm, so it slows guessing on
   each instance; combined with a long key and the authenticator code, guessing
   is not practical. */
const attempts = new Map(); // ip -> { fails, until }
const MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000;

export const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

export function lockedFor(ip) {
  const a = attempts.get(ip);
  if (!a || !a.until) return 0;
  const left = a.until - Date.now();
  if (left <= 0) { attempts.delete(ip); return 0; }
  return left;
}
export function recordFail(ip) {
  const a = attempts.get(ip) || { fails: 0, until: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) { a.until = Date.now() + LOCK_MS; a.fails = 0; }
  attempts.set(ip, a);
  if (attempts.size > 5000) attempts.clear();
}
export const recordSuccess = (ip) => attempts.delete(ip);

/* ---------- signed session cookie ---------- */

function sign(payload, s) {
  return b64url(createHmac('sha256', s.secret).update(payload + '.' + s.keyId).digest());
}

export function sessionCookie() {
  const s = secrets();
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = b64url(JSON.stringify({ exp, n: b64url(randomBytes(9)) }));
  const value = `${payload}.${sign(payload, s)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function hasSession(req) {
  const s = secrets();
  if (!s) return false;
  const raw = String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig) return false;
  const want = sign(payload, s);
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}

/* ---------- request guard ----------
   Every admin request needs a valid session. Changes also need the dashboard's
   own header and a same-site origin, which blocks requests forged by other sites. */
export function guard(req, res, { write = false } = {}) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!hasSession(req)) { res.status(401).json({ error: 'Please sign in again.' }); return false; }
  if (write) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = req.headers.origin;
    if (req.headers['x-admin-request'] !== '1' || (origin && new URL(origin).host !== host)) {
      res.status(403).json({ error: 'Request blocked.' });
      return false;
    }
  }
  return true;
}
