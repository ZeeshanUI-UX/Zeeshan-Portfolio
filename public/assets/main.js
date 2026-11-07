(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let lenis = null;
  if (!reduce && window.Lenis && !/nosmooth/.test(location.search)) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // A new page always opens at its top (unless the link targets a #section):
  // the site, not the browser, decides where a page starts.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => { if (!location.hash) { window.scrollTo(0, 0); lenis?.scrollTo(0, { immediate: true, force: true }); } };
  toTop();
  addEventListener('load', toTop);

  const scrollToHash = (hash) => {
    const el = hash === '#top' ? document.body : $(hash);
    if (!el) return false;
    if (lenis) lenis.scrollTo(hash === '#top' ? 0 : el, { offset: -20, force: true });
    else (hash === '#top' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    if (!(url.hash === '#top' || $(url.hash))) return;
    e.preventDefault();
    // Close the menu first: while it is open the page is locked and smooth scroll is paused,
    // so a scroll started before closing would be ignored.
    const wasOpen = document.documentElement.classList.contains('menu-open');
    closeMenu();
    const go = () => scrollToHash(url.hash);
    if (wasOpen) requestAnimationFrame(() => requestAnimationFrame(go)); else go();
    history.replaceState(null, '', url.hash === '#top' ? url.pathname : url.hash);
  });
  if (location.hash) setTimeout(() => scrollToHash(location.hash), 300);

  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  function closeMenu() {
    document.documentElement.classList.remove('menu-open');
    burger?.setAttribute('aria-expanded', 'false'); burger?.setAttribute('aria-label', 'Open menu');
    menu?.setAttribute('aria-hidden', 'true');
    lenis?.start();
  }
  burger?.addEventListener('click', () => {
    const open = !document.documentElement.classList.contains('menu-open');
    if (!open) return closeMenu();
    document.documentElement.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
    menu.setAttribute('aria-hidden', 'false');
    lenis?.stop();
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  $$('[data-chars]').forEach((el) => {
    const text = el.textContent; el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, wi, arr) => {
      const mask = document.createElement('span'); mask.className = 'display-mask'; mask.setAttribute('aria-hidden', 'true');
      [...word].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--ci', i++); mask.appendChild(s); });
      el.appendChild(mask);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });
  $$('[data-split] .w').forEach((w, i) => { const s = document.createElement('span'); s.textContent = w.textContent; w.textContent = ''; w.appendChild(s); w.style.setProperty('--wi', i); });
  const words = $('[data-words]');
  if (words) {
    const t = words.textContent.trim(); words.setAttribute('aria-label', t); words.textContent = '';
    t.split(/\s+/).forEach((w, i, a) => { const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w; words.appendChild(s); if (i < a.length - 1) words.appendChild(document.createTextNode(' ')); });
  }

  const intro = () => {
    $$('[data-chars], [data-draw], [data-hero-media]').forEach((el) => el.classList.add('is-in'));
    setTimeout(() => { introDone = true; heroMediaImgs.forEach((im) => (im.style.transition = 'none')); req(); }, 2100);
  };
  let introDone = false;
  const heroMediaImgs = $$('[data-hero-media] img'); // the portrait is stacked layers
  const heroMediaImg = heroMediaImgs[0];
  // Start the intro only once the fonts are in and the portrait is decoded, so
  // nothing half-loaded is ever shown (capped at 2.5s on slow connections).
  const gateImgs = heroMediaImgs.length ? heroMediaImgs : $$('.cs-cover img');
  const ready = [document.fonts?.ready, ...gateImgs.map((im) => im.decode?.().catch(() => {}))].filter(Boolean);
  Promise.race([Promise.all(ready), new Promise((r) => setTimeout(r, 2500))])
    .then(() => requestAnimationFrame(() => requestAnimationFrame(intro)));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll?.('[data-count]').forEach(count);
      if (en.target.matches('[data-count]')) count(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal], [data-split], .chips').forEach((el) => io.observe(el));

  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const end = +el.dataset.count; const dur = reduce ? 0 : 1600; const t0 = performance.now();
    const step = (t) => { const p = dur ? clamp((t - t0) / dur, 0, 1) : 1; el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
    setTimeout(() => requestAnimationFrame(step), 900);
  }

  const nav = $('[data-nav]');
  let lastY = 0;
  const sections = $$('main section[id], footer[id]');
  const links = $$('.nav__links a');

  const heroTitle = $('[data-hero-title]');
  const heroMedia = $$('[data-hero-media] img');
  const showcase = $('[data-showcase]');
  const cols = $$('[data-col]');
  const tilt = $('[data-tilt]');
  const wordEls = words ? $$('.w', words) : [];
  const parallax = $$('[data-parallax]');
  const chipGroups = $$('.chips');

  const progress = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1); };

  function onScroll() {
    const y = scrollY;
    nav?.classList.toggle('is-scrolled', y > 40);
    if (!document.documentElement.classList.contains('menu-open')) nav?.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.8);
    lastY = y;

    if (links.length && document.body.classList.contains('page-home')) {
      let current = 'top';
      sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.45) current = s.id; });
      links.forEach((l) => l.classList.toggle('is-active', l.hash === '#' + current));
    }

    if (reduce) return;

    if (heroTitle && y < innerHeight * 1.5) {
      heroTitle.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      heroTitle.style.opacity = String(clamp(1 - y / (innerHeight * 0.9), 0, 1));
      if (heroMedia.length && introDone) heroMedia.forEach((im) => (im.style.transform = `scale(${1 + y * 0.00012}) translate3d(0, ${y * 0.08}px, 0)`));
    }

    if (showcase) {
      const p = progress(showcase);
      cols.forEach((c) => { const dir = +c.dataset.col; c.style.transform = `translate3d(0, ${(p - 0.5) * dir * -28}%, 0)`; });
    }

    if (wordEls.length) {
      const r = words.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
      const n = Math.round(p * wordEls.length);
      wordEls.forEach((w, i) => w.classList.toggle('on', i < n));
    }

    if (chipGroups.length && innerWidth > 1180) {
      const p = progress(chipGroups[0].closest('.hello'));
      chipGroups.forEach((g, i) => { g.style.transform = `translate3d(0, ${(p - 0.5) * (i ? -90 : 90)}px, 0)`; });
    } else chipGroups.forEach((g) => (g.style.transform = ''));

    if (tilt) { const p = progress(tilt); tilt.style.rotate = `${(0.5 - p) * 10 - 1.5}deg`; }

    parallax.forEach((el) => { const p = progress(el.parentElement); el.style.transform = `translate3d(0, ${(p - 0.5) * -100 * +el.dataset.parallax}%, 0)`; });
  }
  let ticking = false;
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScroll();

  if (finePointer && !reduce) {
    const cursor = $('[data-cursor-el]');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; if (cursor) cursor.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(loop); };
    loop();
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => { if (!cursor) return; cursor.firstElementChild.textContent = el.dataset.cursor; cursor.classList.add('on'); });
      el.addEventListener('pointerleave', () => cursor?.classList.remove('on'));
    });

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25, y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)'; el.style.transform = ''; setTimeout(() => (el.style.transition = ''), 600); });
    });

    const card = $('.contact__card'); const glow = $('.contact__glow');
    card?.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); glow.style.left = `${e.clientX - r.left}px`; glow.style.top = `${e.clientY - r.top}px`; });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/"]');
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || reduce) return;
    const url = new URL(a.href);
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    document.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in', fill: 'forwards' }).onfinish = () => (location.href = a.href);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) document.body.getAnimations().forEach((a) => a.cancel()); });
})();
