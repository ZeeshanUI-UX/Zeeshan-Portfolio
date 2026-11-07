// Portfolio Admin — dashboard for editing the site's content.
// Content lives in the GitHub repo (content/*.json); saving commits it and
// Vercel republishes the site. Pages are previewed with the same templates
// that build the live site.
import { renderHome, renderProject, CHIP_ICONS } from '/admin/render.mjs';

/* ====================================================================== */
/* small helpers                                                           */
/* ====================================================================== */
const app = document.getElementById('app');
const clone = (o) => JSON.parse(JSON.stringify(o));
const snap = (o) => JSON.stringify(o, (k, v) => (k.startsWith('_') ? undefined : v));
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}

const I = {
  dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  hero: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  quote: '<path d="M7 7h4v6H5V9a2 2 0 0 1 2-2zM15 7h4v6h-6V9a2 2 0 0 1 2-2zM5 13c0 3 2 4 4 4M13 13c0 3 2 4 4 4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
};
const icon = (name) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = I[name]; return s; };
const chev = () => { const s = icon('down'); s.classList.add('chev'); return s; };

function toast(msg, kind = '') {
  const t = h('div', { class: `toast ${kind ? 'toast--' + kind : ''}` }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 7000 : 3800);
}

function modal({ title, text, body, confirm = 'OK', danger = false, cancel = 'Cancel', onConfirm }) {
  return new Promise((resolve) => {
    const close = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    const ok = h('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, type: 'submit' }, confirm);
    const form = h('form', { class: 'modal__card', onsubmit: async (e) => {
      e.preventDefault();
      if (onConfirm) { const r = await onConfirm(); if (r === false) return; }
      close(true);
    } },
      h('h2', {}, title), text ? h('p', {}, text) : null, body || null,
      h('div', { class: 'modal__actions' }, cancel ? h('button', { class: 'btn', type: 'button', onclick: () => close(false) }, cancel) : null, ok));
    const wrap = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', onclick: (e) => { if (e.target === wrap) close(false); } }, form);
    document.body.append(wrap);
    document.addEventListener('keydown', onKey);
    setTimeout(() => (form.querySelector('input, textarea') || ok).focus(), 30);
  });
}

async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, {
    method, credentials: 'same-origin',
    headers: { 'X-Admin-Request': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await r.json(); } catch { /* empty */ }
  if (r.status === 401 && path !== '/api/login') { showLogin('Your session ended. Please sign in again.'); throw Object.assign(new Error('signed out'), { silent: true }); }
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status, data });
  return data;
}

/* ====================================================================== */
/* state                                                                   */
/* ====================================================================== */
const S = {
  site: null, projects: [], sha: null,
  orig: { site: '', projects: new Map() }, // _key -> snapshot
  deleted: new Set(), uploads: new Map(), // image path -> local object URL (until published)
  status: 'idle', publishing: null, info: {},
};
let keySeq = 0;

function loadInto(data) {
  S.site = data.site;
  S.projects = data.projects.map((p) => ({ ...p, _key: 'k' + (++keySeq) }));
  S.sha = data.sha;
  S.orig.site = snap(S.site);
  S.orig.projects = new Map(S.projects.map((p) => [p._key, snap(p)]));
  S.deleted.clear();
}
const siteDirty = () => snap(S.site) !== S.orig.site;
const projectDirty = (p) => S.orig.projects.get(p._key) !== snap(p);
const dirtyProjects = () => S.projects.filter(projectDirty);
const isDirty = () => siteDirty() || dirtyProjects().length > 0 || S.deleted.size > 0;
const ordered = () => [...S.projects].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
const visibleProjects = () => ordered().filter((p) => p.visible !== false);

addEventListener('beforeunload', (e) => { if (S.site && isDirty()) { e.preventDefault(); e.returnValue = ''; } });

/* ====================================================================== */
/* form building blocks (each binds to obj[key] and reports changes)       */
/* ====================================================================== */
let onChange = () => {};
const changed = () => { onChange(); updateStatus(); };

function fieldWrap(opts, control) {
  const lab = h('label', {}, opts.label, opts.required ? h('span', { class: 'req' }, '*') : null, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null);
  return h('div', { class: `field ${opts.wide ? 'wide' : ''}` }, lab, control);
}

function text(obj, key, opts = {}) {
  const tag = opts.area ? 'textarea' : 'input';
  const el = h(tag, { class: opts.area ? '' : 'input', placeholder: opts.placeholder || '', maxlength: opts.max || null, rows: opts.rows || null });
  el.value = obj[key] ?? '';
  const counter = opts.max && opts.area ? h('div', { class: 'count-hint' }) : null;
  const sync = () => { if (counter) counter.textContent = `${el.value.length} / ${opts.max}`; };
  el.addEventListener('input', () => { obj[key] = el.value; sync(); changed(); });
  sync();
  const f = fieldWrap(opts, el);
  if (counter) f.append(counter);
  return f;
}

function paras(obj, key, opts = {}) {
  if (!Array.isArray(obj[key])) obj[key] = [];
  const box = h('div', { class: 'items' });
  const draw = () => {
    box.innerHTML = '';
    obj[key].forEach((t, i) => {
      const ta = h('textarea', { rows: 3, maxlength: opts.max || null });
      ta.value = t;
      ta.addEventListener('input', () => { obj[key][i] = ta.value; changed(); });
      const rm = h('button', { class: 'icon-btn', type: 'button', title: 'Remove paragraph', disabled: obj[key].length <= (opts.min || 0), onclick: () => { obj[key].splice(i, 1); draw(); changed(); } }, icon('trash'));
      box.append(h('div', { style: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start' } }, ta, rm));
    });
    if (!opts.maxItems || obj[key].length < opts.maxItems) box.append(h('div', {}, h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { obj[key].push(''); draw(); changed(); } }, icon('plus'), opts.addLabel || 'Add paragraph')));
  };
  draw();
  return fieldWrap(opts, box);
}

function color(obj, key, opts = {}) {
  const pick = h('input', { type: 'color' });
  const txt = h('input', { class: 'input', maxlength: 9 });
  const set = (v) => { txt.value = v || ''; if (/^#[0-9a-f]{6}$/i.test(v || '')) pick.value = v; };
  set(obj[key]);
  pick.addEventListener('input', () => { obj[key] = pick.value.toUpperCase(); txt.value = obj[key]; changed(); });
  txt.addEventListener('input', () => { obj[key] = txt.value.trim(); if (/^#[0-9a-f]{6}$/i.test(obj[key])) pick.value = obj[key]; changed(); });
  return fieldWrap(opts, h('div', { class: 'color' }, pick, txt));
}

function toggle(obj, key, opts = {}) {
  const input = h('input', { type: 'checkbox' });
  input.checked = opts.invert ? obj[key] === false : obj[key] !== false && Boolean(obj[key] ?? opts.default);
  input.addEventListener('change', () => { obj[key] = opts.invert ? !input.checked : input.checked; changed(); opts.onToggle?.(); });
  return h('div', { class: `field ${opts.wide ? 'wide' : ''}` }, h('label', { class: 'toggle' }, input, h('span'), opts.label), opts.hint ? h('div', { class: 'hint' }, opts.hint) : null);
}

function select(obj, key, opts = {}) {
  const el = h('select', {}, opts.options.map(([v, l]) => h('option', { value: v }, l)));
  el.value = obj[key] ?? opts.options[0][0];
  el.addEventListener('change', () => { obj[key] = el.value; changed(); opts.onSelect?.(); });
  return fieldWrap(opts, el);
}

function tags(obj, key, opts = {}) {
  if (!Array.isArray(obj[key])) obj[key] = [];
  const box = h('div', { class: 'tags' });
  const input = h('input', { placeholder: opts.placeholder || 'Type and press Enter' });
  const draw = () => {
    box.querySelectorAll('.tag').forEach((t) => t.remove());
    obj[key].forEach((t, i) => box.insertBefore(h('span', { class: 'tag' }, t, h('button', { type: 'button', 'aria-label': `Remove ${t}`, onclick: () => { obj[key].splice(i, 1); draw(); changed(); } }, icon('x'))), input));
    input.disabled = opts.maxItems && obj[key].length >= opts.maxItems;
  };
  const add = () => {
    const parts = input.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    for (const p of parts) if (!opts.maxItems || obj[key].length < opts.maxItems) obj[key].push(p);
    input.value = ''; draw(); changed();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input.value && obj[key].length) { obj[key].pop(); draw(); changed(); }
  });
  input.addEventListener('blur', add);
  box.append(input);
  draw();
  return fieldWrap(opts, box);
}

/* ---------- images ---------- */
const MAX_UPLOAD = 2.9 * 1024 * 1024;
async function prepareImage(file) {
  if (!/^image\//.test(file.type) || file.type === 'image/svg+xml') throw new Error('Choose a PNG, JPG, WebP, AVIF or GIF image.');
  if (file.type === 'image/gif') { if (file.size > MAX_UPLOAD) throw new Error('GIFs must be under 3 MB.'); return file; }
  const bmp = await createImageBitmap(file);
  let width = Math.min(bmp.width, 2400), quality = 0.86;
  for (let tries = 0; tries < 6; tries++) {
    const scale = width / bmp.width;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await new Promise((r) => c.toBlob(r, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', quality));
    if (blob.size <= MAX_UPLOAD) return blob;
    width = Math.round(width * 0.8); quality = Math.max(0.6, quality - 0.08);
  }
  throw new Error('That image is too large. Try a smaller one.');
}
const toBase64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
async function uploadFile(file) {
  const blob = await prepareImage(file);
  const res = await api('/api/upload', { method: 'POST', body: { name: file.name, data: await toBase64(blob) } });
  S.uploads.set(res.path, URL.createObjectURL(blob));
  return res.path;
}
const imgSrc = (p) => S.uploads.get(p) || p || '';

function image(obj, key, opts = {}) {
  const thumb = h('div', { class: 'img__thumb' });
  const pathEl = h('div', { class: 'img__path' });
  const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/avif,image/gif', class: 'sr' });
  const rm = h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => { obj[key] = ''; draw(); changed(); } }, 'Remove');
  const draw = () => {
    const v = obj[key];
    thumb.classList.toggle('has', Boolean(v));
    thumb.style.backgroundImage = v ? `url("${imgSrc(v)}")` : '';
    thumb.textContent = v ? '' : 'No image';
    pathEl.textContent = v || (opts.hint || '');
    rm.hidden = !v || opts.required;
  };
  const doUpload = async (f) => {
    if (!f) return;
    const spin = h('div', { class: 'spin' }, 'Uploading…');
    thumb.append(spin);
    try { obj[key] = await uploadFile(f); draw(); changed(); toast('Image uploaded. It goes live when you Save.', 'ok'); }
    catch (err) { if (!err.silent) toast(err.message, 'bad'); }
    finally { spin.remove(); file.value = ''; }
  };
  file.addEventListener('change', () => doUpload(file.files[0]));
  thumb.addEventListener('dragover', (e) => { e.preventDefault(); thumb.classList.add('drag'); });
  thumb.addEventListener('dragleave', () => thumb.classList.remove('drag'));
  thumb.addEventListener('drop', (e) => { e.preventDefault(); thumb.classList.remove('drag'); doUpload(e.dataTransfer.files[0]); });
  draw();
  const pick = h('label', { class: 'btn btn--sm' }, obj[key] ? 'Replace image' : 'Upload image', file);
  return fieldWrap({ ...opts, hint: null }, h('div', { class: 'img' }, thumb, h('div', {}, h('div', { class: 'img__actions' }, pick, rm), pathEl)));
}

/* ---------- repeatable list ---------- */
function list(arr, opts) {
  const box = h('div', { class: 'items' });
  const draw = () => {
    box.innerHTML = '';
    arr.forEach((item, i) => {
      const body = h('div', { class: 'item__body' });
      opts.render(item, body, i);
      const title = h('b', {}, opts.title(item, i) || `Item ${i + 1}`);
      const el = h('div', { class: `item ${opts.collapsed ? 'closed' : ''}` },
        h('div', { class: 'item__head' },
          h('span', { class: 'num' }, i + 1), title,
          opts.fixed ? null : h('button', { class: 'icon-btn', type: 'button', title: 'Move up', disabled: i === 0, onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; draw(); changed(); } }, icon('up')),
          opts.fixed ? null : h('button', { class: 'icon-btn', type: 'button', title: 'Move down', disabled: i === arr.length - 1, onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; draw(); changed(); } }, icon('down')),
          opts.fixed ? null : h('button', { class: 'icon-btn', type: 'button', title: 'Delete', disabled: arr.length <= (opts.min || 0), onclick: async () => {
            if (opts.confirmDelete && !(await modal({ title: 'Delete this item?', text: `“${opts.title(item, i) || 'Item ' + (i + 1)}” will be removed when you save.`, confirm: 'Delete', danger: true }))) return;
            arr.splice(i, 1); draw(); changed();
          } }, icon('trash')),
          opts.collapsed ? h('button', { class: 'icon-btn', type: 'button', title: 'Show / hide', onclick: () => el.classList.toggle('closed') }, icon('edit')) : null),
        body);
      body.addEventListener('input', () => { title.textContent = opts.title(item, i) || `Item ${i + 1}`; });
      box.append(el);
    });
    if (!opts.fixed && (!opts.max || arr.length < opts.max)) {
      box.append(h('div', { class: 'add' }, h('button', { class: 'btn btn--sm', type: 'button', onclick: () => {
        arr.push(opts.create()); draw(); changed();
        const last = box.querySelectorAll('.item'); const it = last[last.length - 1];
        it?.classList.remove('closed'); it?.scrollIntoView({ behavior: 'smooth', block: 'center' }); it?.querySelector('input, textarea')?.focus();
      } }, icon('plus'), opts.addLabel || 'Add')));
    }
  };
  draw();
  return h('div', { class: `field ${opts.wide === false ? '' : 'wide'}` }, opts.label ? h('div', { class: 'label' }, opts.label, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null) : null, box);
}

const grid = (cols, ...kids) => h('div', { class: `grid ${cols === 3 ? 'grid--3' : cols === 4 ? 'grid--4' : ''}` }, ...kids);
function section(title, sub, open, ...kids) {
  const d = h('details', { class: 'card section', open: open || null },
    h('summary', {}, h('div', {}, h('h2', {}, title), sub ? h('p', {}, sub) : null), chev()),
    h('div', { class: 'body' }, ...kids));
  return d;
}

/* ====================================================================== */
/* preview                                                                 */
/* ====================================================================== */
let previewSource = null; // () => html
let previewMode = 'desktop';
const swapUploads = (html) => { for (const [p, u] of S.uploads) html = html.split(p).join(u); return html; };

function previewPanel(title) {
  const frameBox = h('div', { class: 'preview__frame' });
  const iframe = h('iframe', { title: 'Page preview', loading: 'lazy' });
  frameBox.append(iframe);
  const seg = h('div', { class: 'seg' },
    ['desktop', 'mobile'].map((m) => h('button', { type: 'button', class: previewMode === m ? 'on' : '', onclick: (e) => { previewMode = m; seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); fit(); } }, m === 'desktop' ? 'Desktop' : 'Phone')));
  const panel = h('div', { class: 'card preview' }, h('div', { class: 'preview__bar' }, h('b', {}, title), seg), frameBox);
  const fit = () => {
    const w = previewMode === 'desktop' ? 1440 : 390;
    const scale = Math.min(1, frameBox.clientWidth / w);
    iframe.style.width = w + 'px';
    iframe.style.height = frameBox.clientHeight / scale + 'px';
    iframe.style.transform = `scale(${scale})`;
    iframe.style.left = previewMode === 'mobile' ? `${Math.max(0, (frameBox.clientWidth - w * scale) / 2)}px` : '0';
  };
  const refresh = () => {
    if (!previewSource) return;
    const y = iframe.contentWindow?.scrollY || 0;
    try { iframe.srcdoc = swapUploads(previewSource()); }
    catch (err) { iframe.srcdoc = `<p style="font:14px sans-serif;padding:20px;color:#c0392b">Preview can't show yet: ${err.message}</p>`; }
    iframe.onload = () => { try { iframe.contentWindow.scrollTo(0, y); } catch { /* empty */ } };
  };
  new ResizeObserver(fit).observe(frameBox);
  setTimeout(() => { fit(); refresh(); }, 0);
  return { panel, refresh: debounce(refresh, 450) };
}

/* ====================================================================== */
/* shell                                                                   */
/* ====================================================================== */
const NAV = [
  ['Overview', [['#/', 'dash', 'Dashboard']]],
  ['Work', [['#/projects', 'folder', 'Projects', () => S.projects.length], ['#/more-work', 'list', 'More work']]],
  ['Home page', [['#/hero', 'hero', 'Hero & numbers'], ['#/skills', 'spark', 'Hello & skills'], ['#/about', 'user', 'About & timeline'], ['#/testimonials', 'quote', 'Testimonials', () => S.site.testimonials.items.length], ['#/contact', 'mail', 'Contact & links']]],
  ['Settings', [['#/settings', 'gear', 'Name & search'], ['#/history', 'clock', 'History & undo']]],
];

let statusEl, saveBtn;
function updateStatus() {
  if (!statusEl) return;
  const dirty = isDirty();
  statusEl.className = 'status';
  let label = 'All changes are live';
  if (S.status === 'saving') { statusEl.classList.add('busy'); label = 'Saving…'; }
  else if (S.status === 'publishing') { statusEl.classList.add('busy'); label = 'Publishing… (about a minute)'; }
  else if (S.status === 'error') { statusEl.classList.add('err'); label = 'Save failed'; }
  else if (dirty) { statusEl.classList.add('dirty'); label = 'Unsaved changes'; }
  statusEl.querySelector('span').textContent = label;
  saveBtn.disabled = !dirty || S.status === 'saving';
}

function shell(title, crumbs, content) {
  const route = location.hash || '#/';
  const side = h('nav', { class: 'side', 'aria-label': 'Admin' },
    h('div', { class: 'side__brand' }, h('img', { src: '/assets/img/logo.svg', alt: '' }), h('div', {}, h('b', {}, 'Portfolio Admin'), h('span', {}, S.site.person.name))),
    NAV.map(([group, links]) => [h('div', { class: 'side__group' }, group), links.map(([href, ic, label, count]) => {
      const on = href === '#/' ? route === '#/' || route === '#' : route === href || route.startsWith(href + '/');
      return h('a', { href, class: on ? 'on' : '' }, icon(ic), label, count ? h('span', { class: 'count' }, count()) : null);
    })]),
    h('div', { class: 'side__foot' },
      h('a', { href: '/', target: '_blank', rel: 'noopener' }, icon('ext'), 'View live site'),
      h('a', { href: '#', onclick: async (e) => { e.preventDefault(); if (isDirty() && !(await modal({ title: 'Sign out?', text: 'You have unsaved changes. They will be lost.', confirm: 'Sign out', danger: true }))) return; await fetch('/api/logout', { method: 'POST' }); S.site = null; showLogin(); } }, icon('out'), 'Sign out')));
  statusEl = h('div', { class: 'status' }, h('i'), h('span'));
  saveBtn = h('button', { class: 'btn btn--primary', type: 'button', onclick: save }, 'Save & publish');
  const shellEl = h('div', { class: 'shell' }, side,
    h('div', { class: 'main' },
      h('header', { class: 'top' },
        h('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-label': 'Menu', onclick: () => shellEl.classList.toggle('nav-open') }, icon('menu')),
        h('div', { class: 'top__title' }, crumbs ? [h('a', { class: 'top__crumb', href: crumbs[0] }, crumbs[1]), ' / '] : null, title),
        statusEl, saveBtn),
      content));
  app.replaceChildren(shellEl);
  updateStatus();
}

/* ====================================================================== */
/* pages                                                                   */
/* ====================================================================== */
function pageOverview() {
  const live = visibleProjects();
  const info = S.info;
  const setup = !info.github ? h('div', { class: 'notice' }, 'Saving is not set up yet: add GITHUB_TOKEN in Vercel → Settings → Environment Variables.') : null;
  shell('Dashboard', null, h('div', { class: 'page' },
    h('h1', {}, `Welcome back, ${S.site.person.name.split(' ')[0]}`),
    h('p', { class: 'lead' }, 'Edit anything on your portfolio, then press “Save & publish”. Your live site updates about a minute later.'),
    setup,
    h('div', { class: 'stats' },
      [[live.length, 'Projects on the site'], [S.projects.length - live.length, 'Hidden projects'], [S.site.moreWork.items.length + S.site.moreWork.extra.length, 'More work entries'], [S.site.testimonials.items.filter((t) => t.visible !== false).length, 'Testimonials shown']]
        .map(([n, l]) => h('div', { class: 'card stat' }, h('b', {}, n), h('span', {}, l)))),
    h('div', { class: 'quick' },
      [['#/projects/new', 'Add a new project', 'Create a case study page with screens and details.'], ['#/projects', 'Edit projects', 'Change text, images, order, or hide a project.'], ['#/testimonials', 'Add a testimonial', 'Pin a real review from a client.'], ['#/hero', 'Edit the home hero', 'Heading and the numbers beside your photo.'], ['#/about', 'Update About me', 'Bio, photo and work timeline.'], ['#/history', 'Undo a change', 'Restore the site to an earlier save.']]
        .map(([href, t, s]) => h('a', { class: 'card', href }, h('b', {}, t), h('span', {}, s))))));
}

function pageProjects() {
  const listEl = h('div', { class: 'plist' });
  const draw = () => {
    listEl.innerHTML = '';
    const ps = ordered();
    if (!ps.length) listEl.append(h('div', { class: 'card empty' }, 'No projects yet. Add your first one.'));
    ps.forEach((p, i) => {
      const isNew = !S.orig.projects.has(p._key);
      const move = (d) => { const j = i + d; [ps[i], ps[j]] = [ps[j], ps[i]]; ps.forEach((q, k) => (q.order = k + 1)); draw(); changed(); };
      listEl.append(h('div', { class: 'card prow' },
        h('div', { class: 'prow__img', style: { backgroundImage: p.cardImage ? `url("${imgSrc(p.cardImage)}")` : '' } }),
        h('div', {},
          h('h3', {}, p.name || 'Untitled project'),
          h('p', {}, p.title || ''),
          h('div', { class: 'prow__tags' },
            p.visible === false ? h('span', { class: 'pill pill--off' }, 'Hidden') : h('span', { class: 'pill pill--ok' }, 'On the site'),
            isNew ? h('span', { class: 'pill pill--new' }, 'New, not saved') : projectDirty(p) ? h('span', { class: 'pill pill--new' }, 'Edited') : null,
            (p.cardTags || []).map((t) => h('span', { class: 'pill' }, t)))),
        h('div', { class: 'prow__actions' },
          h('button', { class: 'icon-btn', title: 'Move up', disabled: i === 0, onclick: () => move(-1) }, icon('up')),
          h('button', { class: 'icon-btn', title: 'Move down', disabled: i === ps.length - 1, onclick: () => move(1) }, icon('down')),
          h('button', { class: 'icon-btn', title: p.visible === false ? 'Show on site' : 'Hide from site', onclick: () => { p.visible = p.visible === false; draw(); changed(); } }, icon('eye')),
          !isNew ? h('a', { class: 'icon-btn', title: 'Open live page', href: `/projects/${p.slug}/`, target: '_blank', rel: 'noopener' }, icon('ext')) : null,
          h('a', { class: 'btn btn--sm', href: `#/projects/${p._key}` }, icon('edit'), 'Edit'),
          h('button', { class: 'icon-btn', title: 'Delete project', onclick: () => deleteProject(p).then(draw) }, icon('trash')))));
    });
  };
  draw();
  shell('Projects', null, h('div', { class: 'page' },
    h('div', { class: 'head-row' },
      h('div', {}, h('h1', {}, 'Projects'), h('p', { class: 'lead' }, 'Case studies on your home page, in this order. Each one has its own page.')),
      h('a', { class: 'btn btn--primary', href: '#/projects/new' }, icon('plus'), 'Add project')),
    listEl));
}

async function deleteProject(p) {
  const input = h('input', { class: 'input', placeholder: p.name });
  const ok = await modal({
    title: `Delete “${p.name}”?`, text: 'Its page will be removed from your site when you save. You can bring it back later from History.',
    body: h('div', { class: 'field' }, h('label', {}, 'Type the project name to confirm'), input),
    confirm: 'Delete project', danger: true,
    onConfirm: () => { if (input.value.trim() !== p.name.trim()) { input.focus(); toast('The name doesn’t match.', 'bad'); return false; } return true; },
  });
  if (!ok) return;
  S.projects = S.projects.filter((q) => q !== p);
  if (S.orig.projects.has(p._key)) S.deleted.add(JSON.parse(S.orig.projects.get(p._key)).slug);
  changed();
  toast(`“${p.name}” will be deleted when you save.`);
  if (location.hash.startsWith('#/projects/')) location.hash = '#/projects';
}

function blankProject(name, slug, mode) {
  const phone = mode === 'phone';
  return {
    slug, order: (Math.max(0, ...S.projects.map((p) => p.order || 0))) + 1, visible: false, name,
    cardTags: ['Category', phone ? 'Mobile App' : 'Web App'], cardImage: '', cardAlt: `${name} preview`,
    title: 'One-line description of the product', description: `${name} is …`,
    accent: '#111111', accentInk: '#FFFFFF', lightCover: false,
    meta: [{ label: 'Role', value: 'Product & UI/UX Designer' }, { label: 'Project', value: '' }, { label: 'Discipline', value: phone ? 'UX / UI · iOS & Android' : 'UX / UI · Web app' }, { label: 'Tools', value: 'Figma · FigJam' }],
    coverImage: '', coverCaption: '',
    facts: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
    challenge: { heading: 'The problem in one line', paragraphs: ['', '', 'The goal: '] },
    wideImage: '', colors: ['#111111', '#FFFFFF', '#888888', '#F5F5F5'],
    fonts: { display: 'Inter', displayRole: 'Display', body: 'Inter', bodyRole: 'Body', previewFont: "Inter, sans-serif" },
    modules: [],
    rows: [
      { eyebrow: 'The Process', heading: '', text: '', image: '', caption: '' },
      { eyebrow: 'The Structure', heading: '', text: '', image: '', caption: '' },
      { eyebrow: 'The Solution', heading: '', text: '', image: '', caption: '' },
    ],
    outcome: [{ title: '', text: '' }, { title: '', text: '' }, { title: '', text: '' }],
    gallery: { phones: phone, items: [] },
    screens: { mode: phone ? 'phone' : 'web', desktop: { image: '', caption: '' }, second: { image: '', caption: '' } },
    _key: 'k' + (++keySeq),
  };
}

async function newProject() {
  const name = h('input', { class: 'input', placeholder: 'e.g. Flujo' });
  const slug = h('input', { class: 'input', placeholder: 'flujo' });
  let touched = false;
  name.addEventListener('input', () => { if (!touched) slug.value = slugify(name.value); });
  slug.addEventListener('input', () => { touched = true; });
  const kind = h('div', { class: 'choice' },
    h('label', {}, h('input', { type: 'radio', name: 'kind', value: 'web', checked: true }), h('b', {}, 'Web app'), h('span', {}, 'Two desktop screens at the end')),
    h('label', {}, h('input', { type: 'radio', name: 'kind', value: 'phone' }), h('b', {}, 'Mobile app'), h('span', {}, 'Desktop + phone, phone gallery')));
  let created = null;
  const ok = await modal({
    title: 'Add a project', text: 'You can change everything after this. New projects start hidden until you switch them on.',
    body: h('div', {},
      h('div', { class: 'field' }, h('label', {}, 'Project name'), name),
      h('div', { class: 'field' }, h('label', {}, 'Page address', h('span', { class: 'hint' }, 'yoursite/projects/…')), slug),
      h('div', { class: 'field' }, h('div', { class: 'label' }, 'Type'), kind)),
    confirm: 'Create project',
    onConfirm: () => {
      const n = name.value.trim(), s = slugify(slug.value || n);
      if (!n) { toast('Give the project a name.', 'bad'); name.focus(); return false; }
      if (!s) { toast('Add a page address.', 'bad'); slug.focus(); return false; }
      if (S.projects.some((p) => p.slug === s) || ['flujo', 'aces-awards', 'deut', 'wepaak'].includes(s) && !S.projects.some((p) => p.slug === s)) {
        if (S.projects.some((p) => p.slug === s)) { toast('Another project already uses that address.', 'bad'); slug.focus(); return false; }
      }
      created = blankProject(n, s, kind.querySelector('input:checked').value);
      return true;
    },
  });
  if (!ok || !created) { location.hash = '#/projects'; return; }
  S.projects.push(created);
  S.deleted.delete(created.slug);
  changed();
  location.hash = `#/projects/${created._key}`;
}

function pageProject(key) {
  const p = S.projects.find((q) => q._key === key);
  if (!p) { location.hash = '#/projects'; return; }
  const isNew = !S.orig.projects.has(p._key);
  const pv = previewPanel('Preview of this page');
  previewSource = () => {
    const list = visibleProjects();
    const withMe = list.some((q) => q === p) ? list : [...list, p];
    return renderProject(p, S.site, withMe);
  };
  onChange = pv.refresh;

  const ed = h('div', { class: 'editor' },
    h('div', { class: 'head-row' },
      h('div', {}, h('h1', {}, p.name || 'Project'), h('p', { class: 'lead' }, isNew ? 'New project — fill in the sections, upload images, switch it on, then Save & publish.' : `Live at /projects/${p.slug}/`)),
      h('div', { style: { display: 'flex', gap: '8px' } },
        h('button', { class: 'btn btn--sm', onclick: () => duplicate(p) }, icon('copy'), 'Duplicate'),
        h('button', { class: 'btn btn--sm btn--danger', onclick: () => deleteProject(p) }, icon('trash'), 'Delete'))),

    section('Basics', 'Name, home-page card and colours', true,
      grid(2,
        toggle(p, 'visible', { label: 'Show this project on the site', wide: true }),
        text(p, 'name', { label: 'Project name', required: true, max: 80 }),
        isNew ? text(p, 'slug', { label: 'Page address', hint: 'a–z, 0–9, dashes', max: 60 }) : h('div', { class: 'field' }, h('label', {}, 'Page address'), h('input', { class: 'input', value: `/projects/${p.slug}/`, disabled: true })),
        text(p, 'title', { label: 'Short title', hint: 'used in search results', required: true, max: 160, wide: true }),
        text(p, 'description', { label: 'Description', hint: 'one or two sentences for search results', area: true, max: 600, wide: true }),
        tags(p, 'cardTags', { label: 'Card tags', hint: 'up to 2 look best', maxItems: 4, wide: true }),
        image(p, 'cardImage', { label: 'Home-page card image', hint: 'landscape, 738 × 553 or larger', required: true }),
        text(p, 'cardAlt', { label: 'Card image description', hint: 'for screen readers', max: 200 }),
        color(p, 'accent', { label: 'Accent colour', hint: 'numbers, dots, progress bar' }),
        color(p, 'accentInk', { label: 'Text colour on accent' }))),

    section('Top of the page', 'Details row, cover image and key numbers', false,
      list(p.meta, { label: 'Details row', fixed: true, title: (m) => m.label, render: (m, b) => b.append(grid(2, text(m, 'label', { label: 'Label', max: 40 }), text(m, 'value', { label: 'Value', max: 120 }))) }),
      grid(2,
        image(p, 'coverImage', { label: 'Cover image', hint: 'wide, about 2300 × 1270', required: true }),
        h('div', {}, text(p, 'coverCaption', { label: 'Cover caption', max: 120 }), toggle(p, 'lightCover', { label: 'Cover is light (dark project name)' }))),
      list(p.facts, { label: 'Key numbers', fixed: true, title: (f) => [f.value, f.label].filter(Boolean).join(' · '), render: (f, b) => b.append(grid(2, text(f, 'value', { label: 'Number', max: 12, placeholder: '14' }), text(f, 'label', { label: 'What it counts', max: 80, placeholder: 'Sidebar modules' }))) })),

    section('The Challenge', 'Heading and up to 3 short paragraphs', false,
      text(p.challenge, 'heading', { label: 'Heading', required: true, max: 140 }),
      paras(p.challenge, 'paragraphs', { label: 'Paragraphs', max: 1200, maxItems: 6 })),

    section('Visual identity', 'Wide image, colours and fonts', false,
      image(p, 'wideImage', { label: 'Wide image', hint: 'wide, about 2300 × 1270' }),
      h('div', { class: 'field' }, h('div', { class: 'label' }, 'Colour palette (4)'), grid(4, ...[0, 1, 2, 3].map((i) => color(p.colors, i, { label: `Colour ${i + 1}` })))),
      grid(2,
        text(p.fonts, 'display', { label: 'Display font', max: 60 }), text(p.fonts, 'displayRole', { label: 'Used for', max: 40 }),
        text(p.fonts, 'body', { label: 'Body font', max: 60 }), text(p.fonts, 'bodyRole', { label: 'Used for', max: 40 }),
        text(p.fonts, 'previewFont', { label: '“Aa” sample font', hint: 'CSS font list, e.g. Georgia, serif', max: 120, wide: true }))),

    section('Scope', 'Modules you designed (shown as chips)', false,
      tags(p, 'modules', { label: 'Modules', hint: 'press Enter after each', maxItems: 40 })),

    section('Process, Structure & Solution', 'Three text + image sections', false,
      list(p.rows, { fixed: true, title: (r) => `${r.eyebrow || ''}${r.heading ? ' — ' + r.heading : ''}`, render: (r, b) => b.append(
        grid(2, text(r, 'eyebrow', { label: 'Label', max: 40 }), text(r, 'heading', { label: 'Heading', max: 140 })),
        text(r, 'text', { label: 'Text', area: true, max: 1500 }),
        grid(2, image(r, 'image', { label: 'Image', hint: 'device mockup or screen, 4:3 works best' }), text(r, 'caption', { label: 'Caption', max: 120 }))) })),

    section('The Outcome', 'Three results', false,
      list(p.outcome, { fixed: true, title: (o) => o.title, render: (o, b) => b.append(text(o, 'title', { label: 'Title', max: 80 }), text(o, 'text', { label: 'Text', area: true, max: 400 })) })),

    section('Screen gallery', 'Every screen opens large when clicked', false,
      toggle(p.gallery, 'phones', { label: 'Phone screens (4 per row, dark frames)' }),
      list(p.gallery.items, { addLabel: 'Add screen', collapsed: true, confirmDelete: false, max: 40, title: (g) => g.title, create: () => ({ image: '', title: '', subtitle: '' }),
        render: (g, b) => b.append(grid(2, image(g, 'image', { label: 'Screen', required: true }), h('div', {}, text(g, 'title', { label: 'Title', max: 80 }), text(g, 'subtitle', { label: 'Subtitle', max: 120 })))) })),

    section('Every Screen', 'The two large screens at the end', false,
      select(p.screens, 'mode', { label: 'Layout', options: [['web', 'Two desktop screens'], ['phone', 'Desktop + phone']], onSelect: () => pv.refresh() }),
      grid(2,
        image(p.screens.desktop, 'image', { label: 'Large screen' }), text(p.screens.desktop, 'caption', { label: 'Caption', max: 80 }),
        image(p.screens.second, 'image', { label: 'Second screen', hint: 'for a phone, upload the plain screen' }), text(p.screens.second, 'caption', { label: 'Caption', max: 80 }))));

  // slug edits on new projects
  shell(p.name || 'Project', ['#/projects', 'Projects'], h('div', { class: 'page page--split' }, ed, pv.panel));
}

function duplicate(p) {
  const copy = clone(p);
  copy._key = 'k' + (++keySeq);
  copy.name = p.name + ' copy';
  let s = p.slug + '-copy', n = 2;
  while (S.projects.some((q) => q.slug === s)) s = `${p.slug}-copy-${n++}`;
  copy.slug = s; copy.visible = false; copy.order = Math.max(...S.projects.map((q) => q.order || 0)) + 1;
  S.projects.push(copy);
  changed();
  toast('Copy created (hidden). Rename it and add its own content.');
  location.hash = `#/projects/${copy._key}`;
}

/* ---------- home-page editors (all preview the home page) ---------- */
function homePage(title, lead, ...sections) {
  const pv = previewPanel('Preview of the home page');
  previewSource = () => renderHome(S.site, visibleProjects());
  onChange = pv.refresh;
  shell(title, null, h('div', { class: 'page page--split' }, h('div', { class: 'editor' }, h('h1', {}, title), h('p', { class: 'lead' }, lead), ...sections), pv.panel));
}

function pageHero() {
  const s = S.site;
  homePage('Hero & numbers', 'The big heading and the numbers beside your photo.',
    section('Heading', null, true, grid(2,
      text(s.hero, 'script', { label: 'Script line', hint: 'small handwritten text', max: 40 }),
      text(s.hero, 'title', { label: 'Big heading', required: true, max: 40 }),
      text(s.hero, 'ariaLabel', { label: 'Heading for screen readers', max: 120, wide: true }),
      text(s.hero, 'photoAlt', { label: 'Photo description', max: 200, wide: true }))),
    section('Numbers', 'e.g. 2+ Years, 20+ Products', true,
      list(s.hero.stats, { max: 4, addLabel: 'Add number', title: (x) => `${x.value}${x.suffix} ${x.label}`, create: () => ({ label: '', value: '', suffix: '+' }),
        render: (x, b) => b.append(grid(3, text(x, 'value', { label: 'Number', max: 6 }), text(x, 'suffix', { label: 'After', max: 4 }), text(x, 'label', { label: 'Label', max: 30 }))) })));
}

function chipEditor(c, b) {
  b.append(grid(2,
    text(c, 'label', { label: 'Skill', required: true, max: 40 }),
    select(c, 'icon', { label: 'Icon', options: Object.keys(CHIP_ICONS).map((k) => [k, k[0].toUpperCase() + k.slice(1)]) }),
    color(c, 'bg', { label: 'Icon background' }), color(c, 'color', { label: 'Icon colour' })));
}
function pageSkills() {
  const s = S.site;
  homePage('Hello & skills', 'The sentence that reveals word by word, with skill chips on both sides.',
    section('Sentence', null, true, text(s.hello, 'eyebrow', { label: 'Label', max: 40 }), text(s.hello, 'text', { label: 'Sentence', area: true, required: true, max: 300 })),
    section('Skills on the left', null, false, list(s.hello.chipsLeft, { max: 5, addLabel: 'Add skill', title: (c) => c.label, create: () => ({ label: '', icon: 'grid', bg: '#111111', color: '#FFFFFF' }), render: chipEditor })),
    section('Skills on the right', null, false, list(s.hello.chipsRight, { max: 5, addLabel: 'Add skill', title: (c) => c.label, create: () => ({ label: '', icon: 'grid', bg: '#111111', color: '#FFFFFF' }), render: chipEditor })));
}

function pageMoreWork() {
  const s = S.site, m = s.moreWork;
  homePage('More work', 'Project titles under your case studies. Hovering a row shows its preview image.',
    section('Section text', null, true, grid(2,
      text(s.projectsSection, 'eyebrow', { label: 'Projects label', max: 40 }), text(s.projectsSection, 'title', { label: 'Projects heading', required: true, max: 80 }),
      text(m, 'title', { label: '“More work” title', max: 40 }), text(m, 'footnote', { label: 'Note before the Behance link', max: 200 }),
      text(m, 'buttonClosed', { label: 'Button text', max: 40 }), text(m, 'buttonOpen', { label: 'Button text when open', max: 40 }))),
    section('Rows with pages', 'Always visible, with a hover preview image', true,
      list(m.items, { max: 12, addLabel: 'Add row', collapsed: true, confirmDelete: true, title: (r) => r.name, create: () => ({ name: '', desc: '', tag: '', link: s.links.behance, image: '' }),
        render: (r, b) => b.append(grid(2, text(r, 'name', { label: 'Name', required: true, max: 60 }), text(r, 'tag', { label: 'Tag', max: 40 }),
          text(r, 'desc', { label: 'Description', max: 200, wide: true }), text(r, 'link', { label: 'Link', hint: '/projects/… or https://', max: 300, wide: true })),
          image(r, 'image', { label: 'Hover preview image' })) })),
    section('Extra projects', 'Shown after “See all projects”, each links to Behance', false,
      list(m.extra, { max: 60, addLabel: 'Add project', collapsed: true, confirmDelete: true, title: (r) => r.name, create: () => ({ name: '', desc: '', tag: '', link: '' }),
        render: (r, b) => b.append(grid(2, text(r, 'name', { label: 'Name', required: true, max: 60 }), text(r, 'tag', { label: 'Tag', hint: 'optional', max: 40 }),
          text(r, 'desc', { label: 'Description', hint: 'empty = “Case study on Behance”', max: 200, wide: true }), text(r, 'link', { label: 'Link', hint: 'empty = your Behance', max: 300, wide: true }))) })));
}

function pageAbout() {
  const a = S.site.about;
  homePage('About & timeline', 'Your photo, bio and work history.',
    section('About', null, true,
      grid(2, text(a, 'eyebrow', { label: 'Label', max: 40 }), text(a, 'title', { label: 'Heading', max: 80 }), text(a, 'titleDim', { label: 'Heading, grey part', max: 60 }), text(a, 'photoAlt', { label: 'Photo description', max: 200 })),
      image(a, 'photo', { label: 'Photo', hint: '711 × 520 or larger', required: true }),
      text(a, 'bio', { label: 'Bio', area: true, rows: 6, required: true, max: 1500 })),
    section('Work timeline', 'Newest first', true,
      list(a.timeline, { max: 10, addLabel: 'Add job', title: (t) => `${t.role}${t.company ? ' · ' + t.company : ''}`, create: () => ({ role: '', company: '', from: '', to: 'Now' }),
        render: (t, b) => b.append(grid(2, text(t, 'role', { label: 'Role', required: true, max: 80 }), text(t, 'company', { label: 'Company', max: 60 }), text(t, 'from', { label: 'From', max: 20, placeholder: 'Mar 2025' }), text(t, 'to', { label: 'To', max: 20, placeholder: 'Now' }))) })));
}

function pageTestimonials() {
  const tm = S.site.testimonials;
  homePage('Testimonials', 'Only add real reviews, with the person’s permission.',
    section('Reviews', 'Shown as a stack of paper notes. Arrows appear with 2 or more.', true,
      text(tm, 'title', { label: 'Section title', max: 40 }),
      list(tm.items, { max: 30, addLabel: 'Add testimonial', confirmDelete: true, title: (r) => `${r.name || 'New testimonial'}${r.visible === false ? ' (hidden)' : ''}`, create: () => ({ name: '', role: '', rating: 5, visible: true, text: [''] }),
        render: (r, b) => {
          const stars = h('select', {}, [5, 4, 3, 2, 1].map((n) => h('option', { value: n }, '★'.repeat(n) + '☆'.repeat(5 - n))));
          stars.value = r.rating || 5;
          stars.addEventListener('change', () => { r.rating = +stars.value; changed(); });
          b.append(grid(2, text(r, 'name', { label: 'Name', required: true, max: 60 }), text(r, 'role', { label: 'Role · Company', max: 100 }),
            h('div', { class: 'field' }, h('label', {}, 'Rating'), stars), toggle(r, 'visible', { label: 'Show on the site' })),
            paras(r, 'text', { label: 'Their words', max: 900, maxItems: 4, min: 1 }));
        } })),
    section('Invitation card', '“Write a Review” card after your reviews', false,
      toggle(tm.invite, 'visible', { label: 'Show the invitation card' }),
      paras(tm.invite, 'text', { label: 'Text', max: 600, maxItems: 4 }),
      grid(2, text(tm.invite, 'button', { label: 'Button', max: 30 }), text(tm.invite, 'buttonActive', { label: 'Button when clicked', max: 30 }),
        text(tm.invite, 'emailSubject', { label: 'Email subject', max: 80 }), text(tm.invite, 'linkText', { label: 'LinkedIn link text', max: 60 }))));
}

function pageContact() {
  const c = S.site.contact, l = S.site.links;
  homePage('Contact & links', 'The dark contact card at the bottom of every page, and your profile links.',
    section('Your links', 'Used in the menu, About and footer', true, grid(2,
      text(l, 'email', { label: 'Email', required: true, max: 120 }), text(l, 'linkedin', { label: 'LinkedIn', max: 300 }),
      text(l, 'behance', { label: 'Behance', max: 300 }), text(l, 'instagram', { label: 'Instagram', max: 300 }), text(l, 'x', { label: 'X (Twitter)', max: 300 }),
      toggle(S.site, 'projectMenuBehance', { label: 'Show Behance in the menu on project pages' }))),
    section('Contact card', null, true,
      grid(2, text(c, 'eyebrow', { label: 'Label', max: 60 }), text(c, 'copyright', { label: 'Copyright line', hint: 'after ©', max: 80 }), text(c, 'titleA', { label: 'Heading', max: 30 }), text(c, 'titleB', { label: 'Heading, grey part', max: 30 })),
      paras(c, 'text', { label: 'Text lines', max: 200, maxItems: 3 }),
      grid(2, text(c, 'button', { label: 'Button', max: 30 }), text(c, 'buttonActive', { label: 'Button when clicked', max: 30 }))));
}

function pageSettings() {
  const s = S.site;
  homePage('Name & search', 'How your name appears and how the site looks in Google and when shared.',
    section('You', null, true, grid(2,
      text(s.person, 'name', { label: 'Your name', required: true, max: 80 }), text(s.person, 'jobTitle', { label: 'Job title', required: true, max: 80 }),
      text(s.person, 'worksFor', { label: 'Company', max: 80 }), text(s.person, 'country', { label: 'Country code', hint: 'e.g. PK', max: 4 }))),
    section('Search & sharing', null, true,
      text(s.seo, 'title', { label: 'Page title', required: true, max: 120 }),
      text(s.seo, 'description', { label: 'Search description', area: true, max: 300 }),
      text(s.seo, 'shareDescription', { label: 'Share description', hint: 'shown on LinkedIn, WhatsApp…', area: true, max: 300 }),
      text(s.seo, 'ogImage', { label: 'Share image address', max: 300 })));
}

async function pageHistory() {
  previewSource = null; onChange = () => {};
  const box = h('div', { class: 'card hist' }, h('div', { class: 'empty' }, 'Loading…'));
  shell('History & undo', null, h('div', { class: 'page' },
    h('h1', {}, 'History & undo'),
    h('p', { class: 'lead' }, 'Every save is kept. Restoring brings all text, projects and testimonials back to how they were at that save (it becomes a new save you can undo too).'),
    box));
  try {
    const { items } = await api('/api/history');
    box.innerHTML = '';
    if (!items.length) box.append(h('div', { class: 'empty' }, 'No saves yet.'));
    items.forEach((it, i) => box.append(h('div', { class: 'hist__row' },
      h('div', {}, h('b', {}, it.message), h('span', {}, new Date(it.date).toLocaleString())),
      i === 0 ? h('span', { class: 'pill pill--ok' }, 'Current') : h('button', { class: 'btn btn--sm', onclick: () => restore(it) }, 'Restore'))));
  } catch (err) { if (!err.silent) box.replaceChildren(h('div', { class: 'empty' }, err.message)); }
}

async function restore(it) {
  if (isDirty()) { toast('Save or discard your current changes first.', 'bad'); return; }
  if (!(await modal({ title: 'Restore this version?', text: `Your site will go back to “${it.message}” (${new Date(it.date).toLocaleString()}).`, confirm: 'Restore' }))) return;
  try {
    S.status = 'saving'; updateStatus();
    const r = await api('/api/history', { method: 'POST', body: { sha: it.sha } });
    loadInto(await api('/api/content'));
    afterSave(r.sha, 'Restored. Publishing now…');
    pageHistory();
  } catch (err) { S.status = 'error'; updateStatus(); if (!err.silent) toast(err.message, 'bad'); }
}

/* ====================================================================== */
/* save & publish                                                          */
/* ====================================================================== */
function summary() {
  const parts = [];
  if (siteDirty()) parts.push('home page');
  const dp = dirtyProjects();
  for (const p of dp) parts.push(S.orig.projects.has(p._key) ? p.name : `new project ${p.name}`);
  for (const s of S.deleted) parts.push(`delete ${s}`);
  return 'Update ' + (parts.join(', ') || 'content');
}

function checkBeforeSave() {
  const t = S.site.testimonials.items.find((r) => r.visible !== false && (!r.name?.trim() || !r.text?.some((x) => x.trim())));
  if (t) return 'A testimonial needs a name and their words (or switch it off).';
  for (const p of S.projects) {
    if (!projectDirty(p)) continue;
    const need = [[p.name, 'a name'], [p.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug), 'a valid page address'], [p.title, 'a short title'], [p.cardImage, 'a card image'], [p.coverImage, 'a cover image'], [p.challenge?.heading, 'a challenge heading']];
    const miss = need.find(([v]) => !v);
    if (miss) return `“${p.name || 'New project'}” needs ${miss[1]} before saving.`;
    if (S.projects.filter((q) => q.slug === p.slug).length > 1) return `Two projects use the address “${p.slug}”.`;
  }
  return null;
}

async function save() {
  if (!isDirty() || S.status === 'saving') return;
  const problem = checkBeforeSave();
  if (problem) { toast(problem, 'bad'); return; }
  S.status = 'saving'; updateStatus();
  try {
    const body = { baseSha: S.sha, message: summary(), deleted: [...S.deleted], projects: dirtyProjects() };
    if (siteDirty()) body.site = S.site;
    const r = await api('/api/content', { method: 'POST', body });
    // Saved: the current state becomes the new baseline.
    S.orig.site = snap(S.site);
    S.orig.projects = new Map(S.projects.map((p) => [p._key, snap(p)]));
    S.deleted.clear();
    afterSave(r.sha, 'Saved. Publishing your site now…');
    route();
  } catch (err) {
    S.status = 'error'; updateStatus();
    if (err.silent) return;
    if (err.status === 409) {
      await modal({ title: 'Content changed elsewhere', text: 'Someone (maybe you in another tab) saved changes after you opened this page. Reload to get the latest version, then make your edits again.', confirm: 'Reload', cancel: 'Not now', onConfirm: () => { addEventListener('beforeunload', (e) => e.stopImmediatePropagation(), true); location.reload(); } });
    } else toast(err.message, 'bad');
  }
}

function afterSave(sha, msg) {
  S.sha = sha || S.sha;
  S.status = 'publishing'; updateStatus();
  toast(msg, 'ok');
  const started = Date.now();
  const target = S.sha;
  clearInterval(S.publishing);
  S.publishing = setInterval(async () => {
    try {
      const b = await fetch('/build.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json());
      if (b.sha === target) {
        clearInterval(S.publishing); S.status = 'idle'; updateStatus();
        toast('Your changes are live.', 'ok');
        return;
      }
    } catch { /* not built yet */ }
    if (Date.now() - started > 4 * 60 * 1000) { clearInterval(S.publishing); S.status = 'idle'; updateStatus(); toast('Publishing is taking longer than usual. Check Vercel if it doesn’t appear soon.'); }
  }, 6000);
}

/* ====================================================================== */
/* login                                                                   */
/* ====================================================================== */
function showLogin(message) {
  clearInterval(S.publishing);
  const key = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', required: true, placeholder: 'Your Admin Key' });
  const code = S.info.totp ? h('input', { class: 'input', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]{6}', maxlength: 6, required: true, placeholder: '6-digit code' }) : null;
  const err = h('div', { class: 'login__err', hidden: !message }, message || '');
  const btn = h('button', { class: 'btn btn--primary', type: 'submit' }, 'Sign in');
  const show = h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => { key.type = key.type === 'password' ? 'text' : 'password'; show.textContent = key.type === 'password' ? 'Show' : 'Hide'; } }, 'Show');
  const form = h('form', { class: 'login__card', onsubmit: async (e) => {
    e.preventDefault();
    btn.disabled = true; btn.textContent = 'Checking…'; err.hidden = true;
    try {
      await api('/api/login', { method: 'POST', body: { key: key.value, code: code?.value } });
      key.value = '';
      await start();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
      btn.disabled = false; btn.textContent = 'Sign in'; key.select();
    }
  } },
    h('img', { class: 'login__logo', src: '/assets/img/logo.svg', alt: '' }),
    h('h1', {}, 'Portfolio Admin'),
    h('p', {}, 'Sign in with your Admin Key to manage your portfolio.'),
    err,
    !S.info.ready ? h('div', { class: 'notice' }, 'Not set up yet: add ADMIN_KEY (20+ characters) and SESSION_SECRET in Vercel → Settings → Environment Variables, then redeploy.') : null,
    h('div', { class: 'field' }, h('label', {}, 'Admin Key', h('span', { style: { marginLeft: 'auto' } }, show)), key),
    code ? h('div', { class: 'field' }, h('label', {}, 'Authenticator code'), code) : null,
    btn,
    h('div', { class: 'login__note' }, 'Visitors can only view your portfolio. This page is private.'));
  app.replaceChildren(h('main', { class: 'login' }, form));
  setTimeout(() => key.focus(), 30);
}

/* ====================================================================== */
/* router & start                                                          */
/* ====================================================================== */
function route() {
  if (!S.site) return;
  const r = (location.hash || '#/').slice(1);
  document.querySelector('.shell')?.classList.remove('nav-open');
  previewSource = null; onChange = () => {};
  if (r === '/' || r === '') return pageOverview();
  if (r === '/projects') return pageProjects();
  if (r === '/projects/new') return newProject();
  if (r.startsWith('/projects/')) return pageProject(r.split('/')[2]);
  const pages = { '/more-work': pageMoreWork, '/hero': pageHero, '/skills': pageSkills, '/about': pageAbout, '/testimonials': pageTestimonials, '/contact': pageContact, '/settings': pageSettings, '/history': pageHistory };
  (pages[r] || pageOverview)();
  scrollTo(0, 0);
}
addEventListener('hashchange', route);
addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && S.site) { e.preventDefault(); save(); } });

async function start() {
  S.info = await fetch('/api/session', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
  if (!S.info.admin) return showLogin();
  try {
    loadInto(await api('/api/content'));
    route();
  } catch (err) {
    if (err.silent) return;
    app.replaceChildren(h('main', { class: 'login' }, h('div', { class: 'login__card' }, h('h1', {}, 'Can’t load content'), h('p', {}, err.message), h('button', { class: 'btn btn--primary', onclick: start }, 'Try again'))));
  }
}
start();
