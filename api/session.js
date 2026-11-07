// GET /api/session → { admin, totp, ready }
import { hasSession, totpEnabled, configured } from './_lib/auth.js';
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).json({ admin: hasSession(req), totp: totpEnabled(), ready: configured(), github: Boolean(process.env.GITHUB_TOKEN) });
}
