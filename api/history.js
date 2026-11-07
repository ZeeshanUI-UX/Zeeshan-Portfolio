// GET  /api/history         → recent saves
// POST /api/history { sha } → restore all content to how it was at that save
import { guard } from './_lib/auth.js';
import { history, treeFiles, headSha, commit } from './_lib/github.js';
import { fail } from './_lib/http.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!guard(req, res)) return;
      return res.status(200).json({ items: await history() });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    if (!guard(req, res, { write: true })) return;
    const sha = String(req.body?.sha || '');
    if (!/^[0-9a-f]{40}$/.test(sha)) return res.status(400).json({ error: 'Pick a version to restore.' });

    const head = await headSha();
    const [then, now] = await Promise.all([treeFiles(sha, 'content/'), treeFiles(head, 'content/')]);
    const thenMap = new Map(then.map((f) => [f.path, f.sha]));
    const changes = [];
    // Blob shas let us restore without downloading: point paths back at old blobs.
    for (const f of then) if (now.find((n) => n.path === f.path)?.sha !== f.sha) changes.push({ path: f.path, blobSha: f.sha });
    for (const f of now) if (!thenMap.has(f.path)) changes.push({ path: f.path, delete: true });
    if (!changes.length) return res.status(200).json({ sha: head, unchanged: true });
    const out = await commit(changes, `Restore content to ${sha.slice(0, 7)}\n\nRestored from the admin dashboard.`, head);
    res.status(200).json({ sha: out });
  } catch (err) { fail(res, err); }
}
