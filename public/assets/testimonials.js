/* Testimonials — paper-note stack.
   Next: the clip pops off, the front note lifts (its corner curling up), turns away
   to the right and slides in behind; the notes beneath shuffle up and the new front
   note catches a sweep of light while its words ink in.
   Previous: the back note slides out to the left and covers the stack, shading the
   note it lands on. Arrows, keyboard ← →, and swipe. One note: no controls. */
(() => {
  const root = document.querySelector('[data-tm]');
  if (!root) return;
  const stack = root.querySelector('[data-tm-stack]');
  const cards = [...stack.querySelectorAll('[data-tcard]')];
  const clip = stack.querySelector('.tm__clip');
  const arrows = [...root.querySelectorAll('[data-tm-dir]')];
  const count = root.querySelector('.tm__count');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = cards.length;
  if (!n) return;

  // Every transform uses the same function list so the browser can blend them.
  const T = (p) => `perspective(1600px) translate(${p.x}%, ${p.y}%) rotateY(${p.ry}deg) rotate(${p.r}deg) scale(${p.s})`;
  const P = (x, y, ry, r, s) => ({ x, y, ry, r, s });
  const POSES = [P(0, 0, 0, -3.5, 1), P(2.4, 1.6, 0, 2.6, 0.985), P(-2.2, 3, 0, -6.5, 0.97), P(1.2, 4, 0, 5, 0.96)];
  const pose = (d) => POSES[Math.min(d, POSES.length - 1)];
  const pad = (v) => String(v).padStart(2, '0');

  // Effects layers and word spans, once.
  cards.forEach((c) => {
    ['curl', 'sheen', 'shade'].forEach((k) => {
      const el = document.createElement('span');
      el.className = `tcard__fx tcard__${k}`;
      el.setAttribute('aria-hidden', 'true');
      c.appendChild(el);
    });
    let w = 0;
    c.querySelectorAll('.tcard__text p').forEach((p) => {
      const words = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      words.forEach((word, i) => {
        const s = document.createElement('span');
        s.className = 'tw';
        s.style.setProperty('--w', w++);
        s.textContent = word;
        p.appendChild(s);
        if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      });
    });
  });
  const fx = (c, k) => c.querySelector(`.tcard__${k}`);

  let order = cards.map((_, i) => i); // order[0] is the front card
  let busy = false;

  const paint = (instant, mover) => {
    order.forEach((ci, depth) => {
      const c = cards[ci];
      if (instant) c.style.transition = 'none';
      c.style.setProperty('--lag', c === mover ? '0s' : `${depth * 0.06}s`);
      c.style.transform = T(pose(depth));
      c.style.zIndex = String(50 - depth);
      const front = depth === 0;
      c.classList.toggle('is-front', front);
      c.inert = !front;
      c.setAttribute('aria-hidden', front ? 'false' : 'true');
      if (instant) { c.offsetWidth; c.style.transition = ''; }
    });
    const now = root.querySelector('[data-tm-now]');
    if (now) now.textContent = pad(order[0] + 1);
  };

  // A band of light sweeps across the note that has just come to the front.
  const sheen = (c, delay) => {
    const s = fx(c, 'sheen');
    setTimeout(() => {
      s.classList.remove('is-run');
      void s.offsetWidth;
      s.classList.add('is-run');
      setTimeout(() => s.classList.remove('is-run'), 1200);
    }, delay);
  };

  const go = (dir) => {
    if (n < 2 || busy) return;
    busy = true;
    const dur = reduce ? 0 : 1150;
    const oldFront = cards[order[0]];
    let mover;
    if (dir > 0) {
      mover = oldFront;
      order = [...order.slice(1), order[0]];
    } else {
      mover = cards[order[n - 1]];
      order = [order[n - 1], ...order.slice(0, n - 1)];
    }
    const fromDepth = dir > 0 ? 0 : n - 1;
    if (dir > 0 && !reduce) mover.classList.add('is-leaving');
    paint(false, mover);
    if (reduce) { busy = false; return; }

    const w = mover.offsetWidth;
    mover.classList.add('is-lifted');

    if (dir > 0) {
      const back = 50 - (n - 1);
      // lift → turn away to the right → slide in underneath
      mover.animate([
        { transform: T(pose(fromDepth)), zIndex: 70, easing: 'cubic-bezier(.3, 0, .2, 1)' },
        { transform: T(P(-1, -4, 0, -1.5, 1.035)), offset: 0.16, easing: 'cubic-bezier(.5, 0, .3, 1)' },
        { transform: T(P(88, -8, -32, 14, 1)), zIndex: 70, offset: 0.5, easing: 'cubic-bezier(.4, 0, .2, 1)' },
        { zIndex: back, offset: 0.501 },
        { transform: T(P(34, 3, -8, 8, 0.97)), offset: 0.8, easing: 'ease-out' },
        { transform: T(pose(n - 1)), zIndex: back }
      ], { duration: dur });
      fx(mover, 'curl').animate([
        { width: '0px', easing: 'ease-out' }, { width: `${w * 0.3}px`, offset: 0.16 }, { width: `${w * 0.38}px`, offset: 0.5, easing: 'ease-in' }, { width: '0px', offset: 0.82 }, { width: '0px' }
      ], { duration: dur });
      setTimeout(() => mover.classList.remove('is-leaving'), dur * 0.5);
      sheen(cards[order[0]], dur * 0.5);
    } else {
      // out to the left → hover above the stack → drop on and settle
      mover.animate([
        { transform: T(pose(fromDepth)), zIndex: 40, easing: 'cubic-bezier(.4, 0, .2, 1)' },
        { transform: T(P(-88, -8, 32, -14, 1)), zIndex: 40, offset: 0.4, easing: 'cubic-bezier(.4, 0, .2, 1)' },
        { zIndex: 70, offset: 0.401 },
        { transform: T(P(-4, -6, 0, -5, 1.06)), offset: 0.72, easing: 'cubic-bezier(.5, 0, .5, 1)' },
        { transform: T(P(0, 0.6, 0, -3.2, 0.995)), offset: 0.88, easing: 'ease-out' },
        { transform: T(pose(0)), zIndex: 70 }
      ], { duration: dur });
      // The note being covered darkens for a moment under the new one.
      fx(oldFront, 'shade').animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: dur });
      sheen(mover, dur * 0.7);
    }
    setTimeout(() => mover.classList.remove('is-lifted'), dur);

    // The clip pops off, waits, then snaps back on with a little wobble.
    clip?.animate([
      { transform: 'translate(0, 0) rotate(-24deg)', easing: 'cubic-bezier(.2, .8, .3, 1)' },
      { transform: 'translate(-14px, -62px) rotate(-66deg)', offset: 0.22 },
      { transform: 'translate(-12px, -58px) rotate(-60deg)', offset: 0.64, easing: 'cubic-bezier(.6, 0, .9, .5)' },
      { transform: 'translate(0, 4px) rotate(-18deg)', offset: 0.82, easing: 'ease-out' },
      { transform: 'translate(0, 0) rotate(-28deg)', offset: 0.92, easing: 'ease-in-out' },
      { transform: 'translate(0, 0) rotate(-24deg)' }
    ], { duration: dur });

    setTimeout(() => { busy = false; }, dur * 0.75);
  };

  if (n > 1) {
    root.querySelector('[data-tm-total]').textContent = pad(n);
    arrows.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.tmDir))));
    root.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    let x0 = null; let y0 = 0;
    stack.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
    stack.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; const dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    });
    stack.addEventListener('pointercancel', () => { x0 = null; });
  } else {
    arrows.forEach((b) => { b.hidden = true; });
    if (count) count.hidden = true;
  }

  // Start with the first note in the markup on top.
  paint(true);
})();
