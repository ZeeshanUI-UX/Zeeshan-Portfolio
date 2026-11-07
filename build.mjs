// Builds the site into dist/: copies public/ (styles, scripts, images, older
// project pages, admin dashboard) and renders the pages that come from content/.
// No dependencies; Vercel runs `node build.mjs` on every change.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderHome, renderProject, renderSitemap } from './templates/render.mjs';

const root = new URL('.', import.meta.url).pathname;
const out = join(root, 'dist');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

export function loadContent() {
  const site = read('content/site.json');
  const dir = join(root, 'content/projects');
  const all = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => read('content/projects/' + f));
  all.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name));
  return { site, all, projects: all.filter((p) => p.visible !== false) };
}

const { site, all, projects } = loadContent();

rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'public'), out, { recursive: true });

// Older project pages stay as hand-made HTML in public/projects/.
const legacyDirs = readdirSync(join(root, 'public/projects')).filter((d) => existsSync(join(root, 'public/projects', d, 'index.html')) && !all.some((p) => p.slug === d));
const listed = site.moreWork.items.map((r) => (r.link.match(/^\/projects\/([^/]+)\/$/) || [])[1]).filter((s) => legacyDirs.includes(s));
const legacy = [...listed, ...legacyDirs.filter((d) => !listed.includes(d))];

writeFileSync(join(out, 'index.html'), renderHome(site, projects));
for (const p of projects) {
  mkdirSync(join(out, 'projects', p.slug), { recursive: true });
  writeFileSync(join(out, 'projects', p.slug, 'index.html'), renderProject(p, site, projects));
}
// A hidden or deleted project must not stay reachable from an old build copy.
for (const p of all) if (p.visible === false) rmSync(join(out, 'projects', p.slug), { recursive: true, force: true });
writeFileSync(join(out, 'sitemap.xml'), renderSitemap(projects, legacy));

// The admin dashboard previews pages with the same templates as the build.
mkdirSync(join(out, 'admin'), { recursive: true });
cpSync(join(root, 'templates/render.mjs'), join(out, 'admin/render.mjs'));
// Lets the dashboard tell when a save has finished publishing.
writeFileSync(join(out, 'build.json'), JSON.stringify({ sha: process.env.VERCEL_GIT_COMMIT_SHA || null, builtAt: new Date().toISOString() }));

console.log(`Built ${projects.length} project pages (${all.length - projects.length} hidden), ${legacy.length} older pages.`);
