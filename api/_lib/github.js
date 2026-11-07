// Reads and writes the site's content in its GitHub repository.
//   GITHUB_TOKEN   fine-grained token with "Contents: read and write" on this repo only
//   GITHUB_REPO    owner/name (default: ZeeshanUI-UX/Zeeshan-Portfolio)
//   GITHUB_BRANCH  branch Vercel publishes (default: main)
const API = 'https://api.github.com';
const repo = () => process.env.GITHUB_REPO || 'ZeeshanUI-UX/Zeeshan-Portfolio';
const branch = () => process.env.GITHUB_BRANCH || 'main';

async function gh(path, opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw Object.assign(new Error('GITHUB_TOKEN is not set in Vercel.'), { status: 500 });
  const r = await fetch(API + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'zeeshan-portfolio-admin',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!r.ok) {
    const text = await r.text();
    throw Object.assign(new Error(`GitHub ${r.status}: ${text.slice(0, 200)}`), { status: r.status === 404 ? 404 : 502, ghStatus: r.status });
  }
  return r.status === 204 ? null : r.json();
}

export async function headSha() {
  const ref = await gh(`/repos/${repo()}/git/ref/heads/${branch()}`);
  return ref.object.sha;
}

/** All files under `prefix` at commit `sha`: [{ path, sha }]. */
export async function treeFiles(sha, prefix) {
  const commit = await gh(`/repos/${repo()}/git/commits/${sha}`);
  const tree = await gh(`/repos/${repo()}/git/trees/${commit.tree.sha}?recursive=1`);
  return tree.tree.filter((t) => t.type === 'blob' && t.path.startsWith(prefix));
}

export async function blobText(blobSha) {
  const b = await gh(`/repos/${repo()}/git/blobs/${blobSha}`);
  return Buffer.from(b.content, 'base64').toString('utf8');
}

/**
 * The sha a save may build on. Image uploads add commits too, so the branch
 * can move while the dashboard is open; that's fine as long as content/ is
 * the same as when it was loaded. Otherwise returns null (a real conflict).
 */
export async function safeBase(baseSha) {
  const head = await headSha();
  if (!baseSha || head === baseSha) return head;
  const [a, b] = await Promise.all([treeFiles(baseSha, 'content/'), treeFiles(head, 'content/')]);
  const key = (list) => list.map((f) => `${f.path}:${f.sha}`).sort().join('|');
  return key(a) === key(b) ? head : null;
}

/** Reads content/ at the latest commit (or a given one). */
export async function readContent(sha) {
  const at = sha || await headSha();
  const files = await treeFiles(at, 'content/');
  const texts = await Promise.all(files.map(async (f) => [f.path, await blobText(f.sha)]));
  const map = Object.fromEntries(texts);
  const site = JSON.parse(map['content/site.json']);
  const projects = Object.entries(map)
    .filter(([p]) => /^content\/projects\/[^/]+\.json$/.test(p))
    .map(([, t]) => JSON.parse(t))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return { sha: at, site, projects };
}

/**
 * One commit with any number of changes.
 * changes: [{ path, text } | { path, base64 } | { path, blobSha } | { path, delete: true }]
 * Fails with status 409 if the branch moved past `expectSha`.
 */
export async function commit(changes, message, expectSha) {
  // Without an expected sha (image uploads), retry if another commit landed
  // in between: two images uploaded at once must not fail.
  for (let attempt = 0; ; attempt++) {
    try { return await commitOnce(changes, message, expectSha); }
    catch (err) { if (expectSha || attempt >= 3 || err.ghStatus !== 422) throw err; }
  }
}

async function commitOnce(changes, message, expectSha) {
  const head = await headSha();
  if (expectSha && head !== expectSha) throw Object.assign(new Error('Content changed since you opened it.'), { status: 409, head });
  const base = await gh(`/repos/${repo()}/git/commits/${head}`);
  const tree = [];
  for (const c of changes) {
    if (c.delete) { tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null }); continue; }
    if (c.blobSha) { tree.push({ path: c.path, mode: '100644', type: 'blob', sha: c.blobSha }); continue; }
    const blob = await gh(`/repos/${repo()}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify(c.base64 != null ? { content: c.base64, encoding: 'base64' } : { content: c.text, encoding: 'utf-8' }),
    });
    tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await gh(`/repos/${repo()}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
  const newCommit = await gh(`/repos/${repo()}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
  });
  await gh(`/repos/${repo()}/git/refs/heads/${branch()}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) });
  return newCommit.sha;
}

/** Recent commits that changed content/: [{ sha, message, date }] */
export async function history(limit = 25) {
  const list = await gh(`/repos/${repo()}/commits?sha=${branch()}&path=content&per_page=${limit}`);
  return list.map((c) => ({ sha: c.sha, message: c.commit.message.split('\n')[0], date: c.commit.author.date }));
}
