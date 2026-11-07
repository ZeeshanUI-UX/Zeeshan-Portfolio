/* work.js
   1. Case-study screen gallery: lightbox
   2. Home "More work": cursor-following preview that swaps per row,
      and the "See all projects" toggle */
(() => {
  /* ---------- 1. Gallery lightbox ---------- */
  const figs = [...document.querySelectorAll('.cs-gallery figure')];
  if (figs.length) {
    const lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('data-lenis-prevent', ''); lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Screen preview');
    lb.innerHTML = '<button type="button" aria-label="Close">✕</button><div><img alt=""><p></p></div>';
    document.body.appendChild(lb);
    const img = lb.querySelector('img'), cap = lb.querySelector('p'), close = lb.querySelector('button');
    let last = null;
    const open = (f) => {
      const src = f.querySelector('img');
      img.src = src.currentSrc || src.src; img.alt = src.alt;
      cap.textContent = f.querySelector('figcaption b')?.textContent || '';
      last = document.activeElement;
      lb.classList.add('on'); close.focus({ preventScroll: true });
    };
    const shut = () => { lb.classList.remove('on'); last?.focus?.({ preventScroll: true }); };
    figs.forEach((f) => {
      f.tabIndex = 0; f.setAttribute('role', 'button');
      f.addEventListener('click', () => open(f));
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(f); } });
    });
    close.addEventListener('click', shut);
    lb.addEventListener('click', (e) => { if (e.target === lb) shut(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('on')) shut(); });
  }

  /* ---------- 2. More work ---------- */
  const more = document.querySelector('[data-more]');
  if (!more) return;
  const list = more.querySelector('.more__list');
  const peek = more.querySelector('.more__peek');
  const toggle = more.querySelector('[data-more-toggle]');
  const extras = [...more.querySelectorAll('.more__extra')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Preview: one layer per row, built once; the active layer wipes in over the last.
  if (peek && canHover && !reduce) {
    const layers = new Map();
    const layerFor = (li) => {
      if (layers.has(li)) return layers.get(li);
      let el;
      if (li.dataset.peek) {
        el = document.createElement('img'); el.src = li.dataset.peek; el.alt = ''; el.decoding = 'async';
      } else {
        el = document.createElement('div'); el.className = 'more__peek-card';
        el.style.setProperty('--tone', li.dataset.peekTone || '#111');
        el.innerHTML = `<small>On Behance</small><b></b>`;
        el.querySelector('b').textContent = li.dataset.peekText || '';
      }
      peek.appendChild(el); layers.set(li, el);
      return el;
    };
    // Preload the four project images so the first swap is instant.
    [...list.querySelectorAll('li[data-peek]')].forEach(layerFor);

    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, s = .6, ts = .6, raf = 0, current = null;
    const loop = () => {
      const dx = tx - x;
      x += dx * .16; y += (ty - y) * .16; s += (ts - s) * .18;
      vx += (dx * .04 - vx) * .2; // tilt follows horizontal speed
      peek.style.setProperty('--px', `${x.toFixed(1)}px`);
      peek.style.setProperty('--py', `${y.toFixed(1)}px`);
      peek.style.setProperty('--pr', `${Math.max(-8, Math.min(8, vx)).toFixed(2)}deg`);
      peek.style.setProperty('--ps', s.toFixed(3));
      raf = (Math.abs(dx) > .1 || Math.abs(ts - s) > .002 || Math.abs(vx) > .02) ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const show = (li) => {
      if (li === current) return;
      const prev = current ? layers.get(current) : null;
      const next = layerFor(li);
      if (prev) { prev.classList.remove('is-on'); prev.classList.add('is-off'); setTimeout(() => prev.classList.remove('is-off'), 650); }
      next.classList.remove('is-off'); void next.offsetWidth; next.classList.add('is-on');
      current = li;
    };
    list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('li');
      if (!li || li.hidden) return;
      // Sit beside the cursor (never under it), flipping left near the right edge.
      const half = peek.offsetWidth / 2 + 56;
      tx = e.clientX + half > innerWidth - 16 - peek.offsetWidth / 2 + 56 ? e.clientX - half : e.clientX + half;
      ty = Math.max(peek.offsetHeight / 2 + 12, Math.min(innerHeight - peek.offsetHeight / 2 - 12, e.clientY - 10));
      if (!peek.classList.contains('on')) { x = tx; y = ty + 40; peek.classList.add('on'); }
      ts = 1; show(li); kick();
    });
    list.addEventListener('pointerleave', () => {
      peek.classList.remove('on'); ts = .6; kick();
      if (current) { layers.get(current).classList.remove('is-on'); current = null; }
    });
    addEventListener('scroll', () => { if (peek.classList.contains('on')) { peek.classList.remove('on'); ts = .6; if (current) { layers.get(current).classList.remove('is-on'); current = null; } } }, { passive: true });
  }

  // See all projects
  if (toggle && extras.length) {
    const label = toggle.querySelector('.more__btn-label');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? label.dataset.open : label.dataset.closed;
      if (open) {
        extras.forEach((li) => { li.hidden = false; li.classList.remove('is-leaving'); li.classList.add('is-shown'); });
      } else {
        extras.forEach((li) => { li.classList.remove('is-shown'); if (!reduce) li.classList.add('is-leaving'); });
        setTimeout(() => {
          extras.forEach((li) => { li.hidden = true; li.classList.remove('is-leaving'); });
          const r = more.getBoundingClientRect();
          if (r.top < 0) (window.lenis ? window.lenis.scrollTo(more, { offset: -80 }) : more.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
        }, reduce ? 0 : 360);
      }
      dispatchEvent(new Event('resize')); // let scroll-driven effects re-measure
    });
  }
})();
