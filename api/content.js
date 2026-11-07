// GET  /api/content         → latest content { sha, site, projects }
// POST /api/content         → save: { baseSha, site, projects, deleted, message }
//                              one commit; Vercel then publishes the site.
import { guard } from './_lib/auth.js';
import { readContent, commit, safeBase } from './_lib/github.js';
import { validateSite, validateProject, Invalid, SLUG } from './_lib/validate.js';
import { fail } from './_lib/http.js';

const json = (o) => JSON.stringify(o, null, 2) + '\n';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!guard(req, res)) return;
      return res.status(200).json(await readContent());
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    if (!guard(req, res, { write: true })) return;

    const { baseSha, site, projects = [], deleted = [], message } = req.body || {};
    if (!Array.isArray(projects) || !Array.isArray(deleted)) throw new Invalid('Bad request.');
    const changes = [];
    if (site) changes.push({ path: 'content/site.json', text: json(validateSite(site)) });
    const slugs = new Set();
    for (const p of projects) {
      const clean = validateProject(p);
      if (slugs.has(clean.slug)) throw new Invalid(`Two projects use the address “${clean.slug}”.`);
      slugs.add(clean.slug);
      changes.push({ path: `content/projects/${clean.slug}.json`, text: json(clean) });
    }
    for (const s of deleted) {
      if (!SLUG.test(s)) throw new Invalid('Bad project address.');
      if (!slugs.has(s)) changes.push({ path: `content/projects/${s}.json`, delete: true });
    }
    if (!changes.length) return res.status(200).json({ sha: baseSha, unchanged: true });

    const summary = String(message || 'Update content from the dashboard').slice(0, 120).replace(/[\r\n]+/g, ' ');
    let sha;
    for (let attempt = 0; !sha; attempt++) {
      const base = await safeBase(baseSha);
      if (!base) return res.status(409).json({ error: 'Content changed since you opened it.' });
      try { sha = await commit(changes, `${summary}\n\nSaved from the admin dashboard.`, base); }
      catch (err) { if (attempt >= 2 || (err.ghStatus !== 422 && err.status !== 409)) throw err; } // an upload landed meanwhile
    }
    res.status(200).json({ sha });
  } catch (err) { fail(res, err); }
}
