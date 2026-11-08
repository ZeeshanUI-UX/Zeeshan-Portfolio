// POST /api/upload { name, data (base64) } → { path }
// Saves an image into the repo without publishing (the next Save publishes it).
import { randomBytes } from 'node:crypto';
import { guard } from './_lib/auth.js';
import { commit } from './_lib/github.js';
import { fail } from './_lib/http.js';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const TYPES = [
  ['webp', (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP'],
  ['png', (b) => b[0] === 0x89 && b.slice(1, 4).toString() === 'PNG'],
  ['jpg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['avif', (b) => b.slice(4, 12).toString() === 'ftypavif'],
  ['gif', (b) => b.slice(0, 3).toString() === 'GIF'],
  // Short videos play like GIFs (silent, looping) and are far smaller.
  ['mp4', (b) => b.slice(4, 8).toString() === 'ftyp' && /^(isom|iso\d|mp4\d|avc1|M4V |dash|qt  )/.test(b.slice(8, 12).toString())],
  ['webm', (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3],
];

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    if (!guard(req, res, { write: true })) return;
    const { name, data } = req.body || {};
    const buf = Buffer.from(String(data || ''), 'base64');
    if (!buf.length) return res.status(400).json({ error: 'The image is empty.' });
    if (buf.length > 3 * 1024 * 1024) return res.status(413).json({ error: 'Files must be under 3 MB.' });
    const type = TYPES.find(([, test]) => test(buf));
    if (!type) return res.status(415).json({ error: 'Use a WebP, PNG, JPG, AVIF or GIF image, or an MP4 / WebM video.' });

    const base = String(name || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
    const d = new Date();
    const path = `public/assets/img/uploads/${d.getUTCFullYear()}/${base}-${randomBytes(3).toString('hex')}.${type[0]}`;
    // "[upload]" commits are skipped by Vercel (see scripts/ignore-build.mjs).
    await commit([{ path, base64: buf.toString('base64') }], `[upload] ${path.split('/').pop()}`);
    res.status(200).json({ path: path.replace(/^public/, ''), size: buf.length });
  } catch (err) { fail(res, err); }
}
