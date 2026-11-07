/* upgrade.js — loaded after main.js
   1. Builds the animated primary button markup for every .zbtn
   2. Fits the hero heading to the page width (no overflow, no clipping)
   3. Menu: circular reveal from the icon button, focus trap, inert page
   4. Project pages: intro hooks, heading word masks, reading progress */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- 1. Primary buttons ---------- */
  const SPLASH = [
    ["M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362", 1],
    ["M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893", 1],
    ["M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272", .3],
    ["M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449", .3],
    ["M230.578 57.4476C230.578 57.4476 225.785 41.5051 236.061 30.4998C246.337 19.4945 244.686 12.9998 244.686 12.9998", 1],
    ["M230.578 150.528C230.578 150.528 225.785 166.471 236.061 177.476C246.337 188.481 244.686 194.976 244.686 194.976", 1],
    ["M170.392 57.0278C170.392 57.0278 173.89 42.1322 169.571 29.54C165.252 16.9478 168.751 2.05227 168.751 2.05227", .3],
    ["M170.392 150.948C170.392 150.948 173.89 165.844 169.571 178.436C165.252 191.028 168.751 205.924 168.751 205.924", .3],
    ["M112.609 57.4476C112.609 57.4476 117.401 41.5051 107.125 30.4998C96.8492 19.4945 98.5 12.9998 98.5 12.9998", 1],
    ["M112.609 150.528C112.609 150.528 117.401 166.471 107.125 177.476C96.8492 188.481 98.5 194.976 98.5 194.976", 1],
    ["M62.2941 64.9917C62.2941 64.9917 55.4671 49.8089 40.4932 48.2295C25.5194 46.6501 23.7159 36.5272 23.7159 36.5272", .3],
    ["M62.2941 145.984C62.2941 145.984 55.4671 161.167 40.4932 162.746C25.5194 164.326 23.7159 174.449 23.7159 174.449", .3],
  ];
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const chars = (t) => [...t].map((c, i) => {
    const ch = c === " " ? " " : c;
    return `<span data-label="${esc(ch)}" style="--i:${i + 1}">${esc(ch)}</span>`;
  }).join("");
  const splash = SPLASH.map(([d, o]) => `<path stroke-linecap="round" stroke-width="3"${o < 1 ? ` stroke-opacity="${o}"` : ""} d="${d}"></path>`).join("");

  function buildButton(btn) {
    if (btn.dataset.zbReady) return;
    const label = (btn.dataset.label || btn.textContent).trim();
    const active = (btn.dataset.labelActive || label).trim();
    if (!btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", label);
    btn.innerHTML = `
      <span class="bg" aria-hidden="true"></span>
      <svg class="splash" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 342 208">${splash}</svg>
      <span class="wrap" aria-hidden="true">
        <svg class="path" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 221 42" preserveAspectRatio="none">
          <path stroke-linecap="round" stroke-width="3" vector-effect="non-scaling-stroke" d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855"></path>
        </svg>
        <span class="outline"></span>
        <span class="content">
          <span class="char state-1">${chars(label)}</span>
          <span class="icon"><span class="arrow"></span></span>
          <span class="char state-2">${chars(active)}</span>
        </span>
      </span>`;
    btn.dataset.zbReady = "1";
  }
  // Arrow lands just left of the active label, whatever its length.
  function placeArrows() {
    $$(".zbtn").forEach((btn) => {
      const icon = $(".icon", btn), content = $(".content", btn), s2 = $(".char.state-2", btn);
      if (!icon || !content.clientWidth) return;
      const shift = (content.clientWidth - s2.offsetWidth) / 2 - icon.offsetWidth - 12 - icon.offsetLeft;
      btn.style.setProperty("--arrow-shift", `${Math.round(shift)}px`);
    });
  }
  $$(".zbtn").forEach(buildButton);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(placeArrows);
  addEventListener("resize", placeArrows);
  // Hash-link buttons keep focus after scrolling; release it so they reset.
  $$('.zbtn[href^="#"]').forEach((b) => b.addEventListener("click", () => setTimeout(() => b.blur(), 1700)));

  /* ---------- 2. Hero heading: fit to width ----------
     Sizes [data-fit] headings to a share of their section's width (desktop: the
     data-fit value, mobile: 92%) and publishes the size as --hero-fs so the
     script line and the portrait overlap scale with it. Works with any font. */
  const fits = $$("[data-fit]");
  function fitHeadings() {
    fits.forEach((h) => {
      const host = h.closest("section") || h.parentElement;
      host.style.setProperty("--hero-fs", "100px");
      const w = h.getBoundingClientRect().width;
      if (!w) return;
      const share = innerWidth > 768 ? parseFloat(h.dataset.fit) || 0.62 : 0.92;
      const size = Math.min(320, (host.clientWidth * share * 100) / w);
      host.style.setProperty("--hero-fs", `${size.toFixed(2)}px`);
    });
  }
  let fitQueued = false;
  const queueFit = () => { if (!fitQueued) { fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fitHeadings(); }); } };
  if (fits.length) {
    fitHeadings();
    document.fonts?.ready.then(fitHeadings);
    document.fonts?.addEventListener?.("loadingdone", queueFit);
    addEventListener("resize", queueFit);
  }

  /* ---------- 3. Menu: reveal origin + accessibility ----------
     main.js opens/closes the menu via the [data-burger] button in the dock.
     Here: the circle grows from that button, focus moves into the menu,
     Tab stays inside it, the rest of the page is inert, and focus returns
     to the button on close. */
  const menu = $("[data-menu]");
  const toggle = $("[data-burger]");
  const setOrigin = () => {
    if (!menu || !toggle) return;
    const r = toggle.getBoundingClientRect();
    menu.style.setProperty("--mx", `${Math.round(r.left + r.width / 2)}px`);
    menu.style.setProperty("--my", `${Math.round(r.top + r.height / 2)}px`);
  };
  toggle?.addEventListener("pointerdown", setOrigin);
  toggle?.addEventListener("keydown", setOrigin);
  const outside = $$("body > header, body > main, body > footer, [data-dock] .zbtn");
  const menuLinks = () => (menu ? $$("a", menu) : []);
  let wasOpen = false;
  new MutationObserver(() => {
    const open = root.classList.contains("menu-open");
    if (open === wasOpen) return;
    wasOpen = open;
    outside.forEach((el) => el.toggleAttribute("inert", open));
    if (open) setTimeout(() => menuLinks()[0]?.focus({ preventScroll: true }), 350);
    else if (menu?.contains(document.activeElement) || document.activeElement === document.body) toggle?.focus({ preventScroll: true });
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
  addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !root.classList.contains("menu-open") || !toggle) return;
    const items = [toggle, ...menuLinks()];
    const i = items.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
    e.preventDefault();
    items[next].focus();
  });

  /* ---------- 4. Project pages ----------
     The cover joins the page intro (main.js adds .is-in to [data-hero-media]),
     the meta row waits for the heading, headings rise word by word as their
     section scrolls in, and a thin bar shows reading progress. */
  const csHero = $(".cs-hero");
  if (csHero) {
    const cover = $(".cs-cover", csHero);
    cover?.setAttribute("data-hero-media", "");

    const heading = $(".display[data-chars]", csHero);
    const markReady = () => { if (heading?.classList.contains("is-in")) csHero.classList.add("is-ready"); };
    if (heading) new MutationObserver(markReady).observe(heading, { attributes: true, attributeFilter: ["class"] });
    else csHero.classList.add("is-ready");
    setTimeout(() => csHero.classList.add("is-ready"), 4000); // never leave the meta row hidden

    const name = $(".cs-cover__name", csHero);
    if (name) {
      const t = name.textContent; name.setAttribute("aria-label", t); name.textContent = "";
      [...t].forEach((c, i) => {
        const s = document.createElement("span");
        s.className = "cn"; s.setAttribute("aria-hidden", "true");
        s.style.setProperty("--ci", i); s.textContent = c === " " ? " " : c;
        name.appendChild(s);
      });
    }

    $$("main .anton").forEach((h) => {
      let wi = 0;
      const wrap = (node) => {
        const outer = document.createElement("span"); outer.className = "aw";
        const inner = document.createElement("span"); inner.style.setProperty("--wi", wi++);
        inner.appendChild(node); outer.appendChild(inner);
        return outer;
      };
      [...h.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(" ") : wrap(document.createTextNode(part)));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.classList.contains("dot")) {
          n.replaceWith(wrap(n.cloneNode(true)));
        }
      });
    });

    // Fully clipped elements never count as visible, so wipes are triggered by
    // their row instead of by themselves.
    const wipeIO = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$(".cs-row__fig, .cs-screen--desk", en.target).forEach((el) => el.classList.add("in"));
      wipeIO.unobserve(en.target);
    }), { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    $$(".cs-row, .cs-screens__grid").forEach((el) => wipeIO.observe(el));

    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const bar = document.createElement("div");
      bar.className = "cs-progress"; bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
      let queued = false;
      const update = () => {
        queued = false;
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
      };
      const q = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
      addEventListener("scroll", q, { passive: true });
      addEventListener("resize", q);
      update();
    }
  }
})();
