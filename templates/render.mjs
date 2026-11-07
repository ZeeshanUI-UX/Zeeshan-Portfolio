// Page templates for the portfolio. Pure functions (no Node or browser APIs),
// so the same code builds the live site and draws the live preview in /admin.
//
//   renderHome(site, projects)              -> index.html
//   renderProject(project, site, projects)  -> projects/<slug>/index.html
//
// `site` is content/site.json, `projects` the visible featured projects in order.

export const BASE_URL = 'https://zeeshan-munawar.vercel.app';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ESC[c]);
const fix2 = (n) => n.toFixed(2);
const img = (p) => esc(p || '');

/* ---------- shared pieces ---------- */

const FONTS = 'https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=League+Gothic:wdth@75..100&family=Ms+Madi&family=Orbitron:wght@800&family=Reem+Kufi+Fun:wght@400;500&display=swap';

const ICON = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6S16 11.2 16 13v3" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.4l4.4 5.8L17.5 3Zm-1.1 16.2h1.7L7.1 4.7H5.2l11.2 14.5Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>',
};

// Skill chip icons (Hello section). Each takes the chip's icon colour.
export const CHIP_ICONS = {
  grid: (c) => `<svg viewBox="0 0 24 24" fill="${c}"><rect x="5" y="5" width="6" height="6" rx="1.4"/><rect x="13" y="5" width="6" height="6" rx="1.4"/><rect x="5" y="13" width="6" height="6" rx="1.4"/><rect x="13" y="13" width="6" height="6" rx="1.4"/></svg>`,
  panel: (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><rect x="5.5" y="5.5" width="13" height="13" rx="2"/><path d="M10 5.5v13" /></svg>`,
  search: (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="5.5"/><path d="m15.5 15.5 3.5 3.5"/></svg>`,
  flow: (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M7 8.5h7a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h8"/><circle cx="17" cy="18.5" r="1.4" fill="${c}"/></svg>`,
  frame: (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5V8M16 5h1.5A1.5 1.5 0 0 1 19 6.5V8M8 19H6.5A1.5 1.5 0 0 1 5 17.5V16M16 19h1.5a1.5 1.5 0 0 0 1.5-1.5V16"/></svg>`,
  handoff: (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M6 6l3 3M9 6 6 9M15 15l3 3M18 15l-3 3"/><path d="M8 15c0-4 4-4 4-8m0 0-2 2m2-2 2 2"/></svg>`,
};

function headTop(title, desc, url, ogImage, shareDesc = desc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(shareDesc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fafafa">
<link rel="icon" href="/assets/img/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
`;
}

function menuSocial(l, withBehance) {
  return `<div class="menu__social"><a class="menu__mail" href="mailto:${esc(l.email)}">${esc(l.email)}</a><a href="${esc(l.instagram)}" target="_blank" rel="noopener">Instagram</a><a href="${esc(l.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>${withBehance && l.behance ? `<a href="${esc(l.behance)}" target="_blank" rel="noopener">Behance</a>` : ''}<a href="${esc(l.x)}" target="_blank" rel="noopener">X (Twitter)</a></div>`;
}

const DOCK = `<div class="dock" data-dock>
  <a class="zbtn zbtn--sm" href="#contact" data-label="Let’s Talk" data-label-active="Let’s Go">Let’s Talk</a>
  <button class="dock__menu" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu" data-burger>
    <span class="dock__lines" aria-hidden="true"><span></span><span></span><span></span></span>
  </button>
</div>`;

function socialIcons(l) {
  return `<li><a href="${esc(l.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a></li><li><a href="${esc(l.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.linkedin}</a></li><li><a href="${esc(l.x)}" target="_blank" rel="noopener" aria-label="X (Twitter)">${ICON.x}</a></li>`;
}

function contactFooter(site, home) {
  const c = site.contact, l = site.links;
  const text = c.text.map(esc).join('<br>');
  const icons = socialIcons(l);
  return `<footer class="contact" id="contact">
  <div class="contact__card" data-reveal="scale">
    <div class="contact__glow" aria-hidden="true"></div>
    <div class="contact__body">
      <p class="eyebrow eyebrow--dark" data-reveal><span>${esc(c.eyebrow)}</span></p>
      <h2 class="contact__title" data-split><span class="w">${esc(c.titleA)}</span> <span class="w dim">${esc(c.titleB)}</span></h2>
      <p class="contact__text" data-reveal style="--d:.15s">${text}</p>
      <div data-reveal style="--d:.25s"><a class="zbtn zbtn--light" href="mailto:${esc(l.email)}" data-label="${esc(c.button)}" data-label-active="${esc(c.buttonActive)}">${esc(c.button)}</a></div>
      <a class="contact__mail" href="mailto:${esc(l.email)}" data-reveal style="--d:.3s">${esc(l.email)}</a>
    </div>
    <div class="contact__foot">
      <p class="copy">© ${esc(c.copyright)}</p>
      ${home ? `<ul class="socials socials--ring">\n        ${icons}\n      </ul>` : `<ul class="socials socials--ring">${icons}</ul>`}
    </div>
  </div>
</footer>
<div class="cursor" aria-hidden="true" data-cursor-el><span>View</span></div>
<script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js" defer></script>
<script src="/assets/main.js" defer></script>
<script src="/assets/upgrade.js" defer></script>
`;
}

/* ---------- home ---------- */

export function renderHome(site, projects) {
  const s = site, l = s.links, h = s.hero;
  const url = BASE_URL + '/';
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: s.person.name, jobTitle: s.person.jobTitle, url, email: 'mailto:' + l.email, worksFor: { '@type': 'Organization', name: s.person.worksFor }, address: { '@type': 'PostalAddress', addressCountry: s.person.country }, sameAs: [l.linkedin, l.instagram, l.x] }).replace(/</g, '\\u003c');
  const stats = h.stats.map((st) => `<div><dt>${esc(st.label)}</dt><dd><span data-count="${esc(st.value)}">${esc(st.value)}</span>${esc(st.suffix)}</dd></div>`).join('');
  const cards = projects.map((p) => p.cardImage);
  const tiles = (order) => order.map((i) => cards[i % cards.length]).filter(Boolean).map((c) => `<div class="tile"><img src="${img(c)}" alt="" loading="lazy"></div>`).join('');
  const n = cards.length || 1;
  const colA = [0, 2, 1, 3].map((i) => i % n), colB = [1, 3, 0, 2].map((i) => i % n);
  const chips = (list, side) => list.map((c, i) => `<li class="chip chip--${side}" style="--i:${i}" data-chip><span class="chip__ico" style="background:${esc(c.bg)}">${(CHIP_ICONS[c.icon] || CHIP_ICONS.grid)(esc(c.color))}</span>${esc(c.label)}</li>`).join('');
  const caseCards = projects.map((p, i) => `<article class="case" data-reveal style="--d:${i % 2 ? '0.12s' : '0s'}">
  <a class="case__link" href="/projects/${esc(p.slug)}/" data-cursor="View">
    <div class="case__media"><img src="${img(p.cardImage)}" width="738" height="553" alt="${esc(p.cardAlt || p.name + ' preview')}" loading="lazy"></div>
    <div class="case__meta">
      <h3>${esc(p.name)}</h3>
      <ul>${p.cardTags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
  </a>
</article>`).join('\n');
  const mw = s.moreWork;
  const tones = ['#0b0b0b', '#3f4a1d', '#a4a400', '#2a2a2a', '#5b6b25'];
  const mainRows = mw.items.map((r) => `\n        <li data-peek="${img(r.image)}"><a href="${esc(r.link)}" data-cursor="View"><b>${esc(r.name)}</b><em>${esc(r.desc)}</em><i>${esc(r.tag)}</i></a></li>`).join('');
  const extraRows = mw.extra.map((r, k) => {
    const link = r.link || l.behance;
    const tag = (r.tag ? r.tag + ' · ' : '') + 'Behance ↗';
    return `\n        <li class="more__extra" hidden style="--i:${k}" data-peek-text="${esc(r.name)}" data-peek-tone="${tones[k % tones.length]}"><a href="${esc(link)}" target="_blank" rel="noopener" data-cursor="Behance"><b>${esc(r.name)}</b><em>${esc(r.desc || 'Case study on Behance')}</em><i>${esc(tag)}</i></a></li>`;
  }).join('');
  const a = s.about;
  const timeline = a.timeline.map((t, i) => `<li data-reveal style="--d:${i ? (i * 0.08).toFixed(2).replace(/0$/, '') : '0'}s"><span>${esc(t.role)}</span><span>${esc(t.company)}</span><span>${esc(t.from)} <b>${ICON.arrow}</b> ${esc(t.to)}</span></li>`).join('');
  const tm = s.testimonials;
  const reviews = tm.items.filter((r) => r.visible !== false);
  const reviewCards = reviews.map((r) => {
    const rating = Math.max(0, Math.min(5, Number(r.rating) || 0));
    const stars = Array.from({ length: 5 }, (_, k) => (k < rating ? ICON.star : ICON.star.replace('<path', '<path opacity=".25"'))).join('');
    return `        <article class="tcard" data-tcard>
          <div class="tcard__stars" role="img" aria-label="Rated ${rating} out of 5">${stars}</div>
          <blockquote class="tcard__text">${r.text.map((p) => `<p>${esc(p)}</p>`).join('')}</blockquote>
          <footer class="tcard__sign"><span class="tcard__name">— ${esc(r.name)}</span><span class="tcard__meta">${esc(r.role)}</span></footer>
        </article>
`;
  }).join('');
  const inv = tm.invite;
  const total = String(reviews.length + (inv.visible === false ? 0 : 1)).padStart(2, '0');
  const invite = inv.visible === false ? '' : `        <article class="tcard tcard--invite" data-tcard>
          <div class="tcard__stars tcard__stars--empty" aria-hidden="true">${ICON.star.repeat(5)}</div>
          <blockquote class="tcard__text">${inv.text.map((p) => `<p>${esc(p)}</p>`).join('')}</blockquote>
          <footer class="tcard__sign tcard__sign--invite">
            <a class="zbtn zbtn--sm" href="mailto:${esc(l.email)}?subject=${encodeURIComponent(inv.emailSubject)}" data-label="${esc(inv.button)}" data-label-active="${esc(inv.buttonActive)}">${esc(inv.button)}</a>
            <a class="tcard__link" href="${esc(l.linkedin)}" target="_blank" rel="noopener">${esc(inv.linkText)}</a>
          </footer>
        </article>
`;

  return headTop(s.seo.title, s.seo.description, url, s.seo.ogImage, s.seo.shareDescription || s.seo.description) +
`<link rel="preload" href="/assets/img/hero-hd-1.avif" as="image" type="image/avif" fetchpriority="high">
<link rel="preload" href="/assets/img/hero-hd-2.avif" as="image" type="image/avif" fetchpriority="high">
<link rel="stylesheet" href="/assets/style.css">
<link rel="stylesheet" href="/assets/upgrade.css">
<link rel="stylesheet" href="/assets/testimonials.css">
<link rel="stylesheet" href="/assets/work.css">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="page-home">
<a class="skip" href="#main">Skip to content</a>
<header class="nav" data-nav>
  <div class="nav__inner">
    <a class="nav__logo" href="/" aria-label="${esc(s.person.name)} — home">
      <img src="/assets/img/logo.svg" width="59" height="59" alt="">
    </a>
  </div>
</header>
<div class="menu" id="menu" data-menu aria-hidden="true">
  <nav aria-label="Menu">
    <a href="#top" style="--i:0"><small>01</small>Home</a><a href="#about" style="--i:1"><small>02</small>About</a><a href="#projects" style="--i:2"><small>03</small>Projects</a><a href="#experts" style="--i:3"><small>04</small>Expertise</a><a href="#contact" style="--i:4"><small>05</small>Contact</a>
  </nav>
  ${menuSocial(l, true)}
</div>
${DOCK}
<main id="main">
  <section class="hero" id="top">
    <div class="hero__title" data-hero-title>
      <span class="script hero__script" data-draw>${esc(h.script)}</span>
      <h1 class="display display--hero" aria-label="${esc(h.ariaLabel)}" data-chars data-fit>${esc(h.title)}</h1>
    </div>
    <div class="hero__stage">
      <div class="hero__media" data-hero-media>
        <img src="/assets/img/hero-hd-1.avif" width="1800" height="1013" alt="${esc(h.photoAlt)}" fetchpriority="high"><img class="hero__layer" src="/assets/img/hero-hd-2.avif" width="1800" height="1013" alt="" aria-hidden="true" fetchpriority="high"><img class="hero__layer" src="/assets/img/hero-hd-3.avif" width="1800" height="1013" alt="" aria-hidden="true">
      </div>
      <dl class="stats" data-reveal style="--d:1.1s">
        ${stats}
      </dl>
    </div>
  </section>

  <section class="showcase" aria-label="Recent work preview" data-showcase>
    <div class="showcase__grid">
      <div class="showcase__col" data-col="-1">${tiles(colA)}</div>
      <div class="showcase__col" data-col="1">${tiles(colB)}</div>
    </div>
    <a class="showcase__cta" href="#projects" aria-label="See recent work" data-magnetic>
      <span class="showcase__label">See Recent Work</span>
      <span class="showcase__btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.6c.6 0 1.2.25 1.6.7L12 6h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z"/></svg></span>
    </a>
  </section>

  <section class="hello" id="experts">
    <p class="script-eyebrow" data-reveal><span class="script">${esc(s.hello.eyebrow)}</span></p>
    <div class="hello__wrap">
      <ul class="chips chips--left" aria-label="Skills">${chips(s.hello.chipsLeft, 'l')}</ul>
      <p class="hello__text" data-words>${esc(s.hello.text)}</p>
      <ul class="chips chips--right" aria-label="More skills">${chips(s.hello.chipsRight, 'r')}</ul>
    </div>
  </section>

  <section class="section cases" id="projects">
    <p class="eyebrow " data-reveal><span>${esc(s.projectsSection.eyebrow)}</span></p>
    <h2 class="h2" data-reveal style="--d:.08s">${esc(s.projectsSection.title)}</h2>
    <div class="cases__grid">
${caseCards}</div>
    <div class="more" data-reveal data-more>
      <p class="more__title">${esc(mw.title)}</p>
      <ul class="more__list" id="more-list">${mainRows}${extraRows}
      </ul>
      <div class="more__foot">
${mw.extra.length ? `        <button class="more__btn" type="button" aria-controls="more-list" aria-expanded="false" data-more-toggle><span class="more__btn-label" data-open="${esc(mw.buttonOpen)}" data-closed="${esc(mw.buttonClosed)}">${esc(mw.buttonClosed)}</span><span class="more__btn-count">+${mw.extra.length}</span><span class="more__btn-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>\n` : ''}        <p class="more__also">${esc(mw.footnote)} <a href="${esc(l.behance)}" target="_blank" rel="noopener">Behance ↗</a></p>
      </div>
      <div class="more__peek" aria-hidden="true"></div>
    </div>
  </section>

  <section class="section about" id="about">
    <p class="eyebrow " data-reveal><span>${esc(a.eyebrow)}</span></p>
    <h2 class="h2" data-reveal style="--d:.08s">${esc(a.title)} <span class="dim">${esc(a.titleDim)}</span></h2>
    <div class="about__grid">
      <div class="about__left">
        <figure class="about__photo" data-tilt data-reveal>
          <img src="${img(a.photo)}" width="711" height="520" alt="${esc(a.photoAlt)}" loading="lazy">
        </figure>
        <div class="about__id" data-reveal style="--d:.15s">
          <ul class="socials">${socialIcons(l)}</ul>
          <div><strong>${esc(s.person.name)}</strong><span>${esc(s.person.jobTitle)}</span></div>
        </div>
      </div>
      <div class="about__right">
        <div class="about__bio" data-reveal>
          <p>${esc(a.bio)}</p>
          <i class="about__smile" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0"/><path d="M9 9.8h.01M15 9.8h.01" stroke-width="2.4"/></svg></i>
        </div>
        <ol class="timeline">
          ${timeline}
        </ol>
      </div>
    </div>
  </section>

  <section class="section tm" id="testimonials" aria-labelledby="tm-title" data-tm>
    <div class="tm__panel">
      <h2 class="tm__title" id="tm-title" data-reveal>${esc(tm.title)}</h2>

      <div class="tm__stage" data-reveal="scale" style="--d:.18s">
        <button class="tm__arrow tm__arrow--prev" type="button" data-tm-dir="-1" aria-label="Previous testimonial"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>

        <div class="tm__stack" data-tm-stack aria-roledescription="carousel" aria-label="Testimonials">
          <span class="tm__paper tm__paper--a" aria-hidden="true"></span>
          <span class="tm__paper tm__paper--b" aria-hidden="true"></span>
          <svg class="tm__clip" viewBox="0 0 40 110" aria-hidden="true"><path d="M27 34V86a11 11 0 0 1-22 0V22a8 8 0 0 1 16 0v58a4.5 4.5 0 0 1-9 0V34" fill="none" stroke-width="3.6" stroke-linecap="round"/></svg>
          <!--
            Each <article class="tcard"> is one testimonial. Add REAL reviews only (with
            permission), above the invitation card:
            <article class="tcard" data-tcard>
              (five star <svg>s inside <div class="tcard__stars" role="img" aria-label="Rated 5 out of 5">)
              <blockquote class="tcard__text"><p>Their words…</p></blockquote>
              <footer class="tcard__sign"><span class="tcard__name">— Name</span><span class="tcard__meta">Role · Company</span></footer>
            </article>
            With two or more notes the arrows and counter appear automatically.
          -->
${reviewCards}${invite}        </div>

        <button class="tm__arrow tm__arrow--next" type="button" data-tm-dir="1" aria-label="Next testimonial"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </div>
      <p class="tm__count" aria-live="polite"><b data-tm-now>01</b> / <span data-tm-total>${total}</span></p>
    </div>
  </section>
</main>

` + contactFooter(s, true) +
`<script src="/assets/testimonials.js" defer></script>
<script src="/assets/work.js" defer></script>
</body>
</html>
`;
}

/* ---------- project page ---------- */

export function projectDescription(p) {
  const d = `${p.name} case study — ${p.title}. ${p.description}`;
  if (d.length < 160) return d;
  const cut = d.slice(0, 157);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

export function renderProject(p, site, projects) {
  const l = site.links;
  const idx = projects.findIndex((q) => q.slug === p.slug);
  const nxt = projects.length > 1 ? projects[(idx + 1) % projects.length] : null;
  const url = `${BASE_URL}/projects/${p.slug}/`;
  const title = `${p.name} — Case Study · ${site.person.name}`;
  const meta = p.meta.map((m, k) => `<div data-reveal style="--d:${fix2(0.6 + k * 0.08)}s"><dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd></div>`).join('');
  const facts = p.facts.map((f, k) => `<div class="cs-fact" data-reveal style="--d:${fix2(k * 0.08)}s"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('');
  const ch = p.challenge.paragraphs.map((t, k) => `<p data-reveal style="--d:${fix2(k * 0.08)}s">${esc(t)}</p>`).join('');
  const cols = p.colors.map((c) => `<li style="--c:${esc(c)}"><span></span><code>${esc(c)}</code></li>`).join('');
  const f = p.fonts;
  const mods = p.modules.map((m, k) => `<li style="--i:${k}"><b>${String(k + 1).padStart(2, '0')}</b>${esc(m)}</li>`).join('');
  const rows = p.rows.map((r, k) => `
  <section class="cs-block cs-row${k === 1 ? ' cs-row--flip' : ''}">
    <div class="cs-row__text" data-reveal>
      <span class="script">${esc(r.eyebrow)}</span>
      <h2 class="anton">${esc(r.heading)}<span class="dot">.</span></h2>
      <p>${esc(r.text)}</p>
    </div>
    <figure class="cs-row__fig" data-reveal style="--d:.1s">
      <div class="cs-row__img"><img src="${img(r.image)}" alt="${esc(p.name)} — ${esc(r.caption)}" loading="lazy"></div>
      <figcaption><span>${esc(r.caption)}</span><span>${esc(p.name)}</span></figcaption>
    </figure>
  </section>`).join('');
  const out = p.outcome.map((o, k) => `<li data-reveal style="--d:${((k + 1) / 10).toFixed(1)}s"><b>${String(k + 1).padStart(2, '0')}</b><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></li>`).join('');
  const gal = p.gallery.items.map((g, k) => `<figure data-reveal style="--d:${fix2((k % 3) * 0.08)}s"><img src="${img(g.image)}" alt="${esc(p.name)} — ${esc(g.title)}" loading="lazy"><figcaption><b>${esc(g.title)}</b><span>${esc(g.subtitle)}</span></figcaption></figure>`).join('');
  const sc = p.screens;
  const phone = sc.mode === 'phone';
  const screens = phone
    ? `<figure class="cs-screen cs-screen--desk" data-reveal><img src="${img(sc.desktop.image)}" alt="${esc(p.name)} ${esc(sc.desktop.caption)}" loading="lazy"><figcaption>${esc(sc.desktop.caption)}</figcaption></figure>
      <figure class="cs-screen cs-screen--mob" data-reveal style="--d:.1s"><div class="phone"><img src="${img(sc.second.image)}" alt="${esc(p.name)} ${esc(sc.second.caption)}" loading="lazy" style="object-position:50% 0"></div><figcaption>${esc(sc.second.caption)}</figcaption></figure>`
    : `<figure class="cs-screen cs-screen--desk" data-reveal><img src="${img(sc.desktop.image)}" alt="${esc(p.name)} ${esc(sc.desktop.caption)}" loading="lazy"><figcaption>${esc(sc.desktop.caption)}</figcaption></figure>
      <figure class="cs-screen cs-screen--desk" data-reveal style="--d:.1s"><img src="${img(sc.second.image)}" alt="${esc(p.name)} ${esc(sc.second.caption)}" loading="lazy"><figcaption>${esc(sc.second.caption)}</figcaption></figure>`;
  const next = nxt ? `
    <hr class="cs-rule" data-reveal>
    <a class="cs-next" href="/projects/${esc(nxt.slug)}/" data-reveal data-cursor="Next">
      <span class="script">Thank you for scrolling</span>
      <span class="anton cs-next__title">Next — ${esc(nxt.name)}</span>
      <span class="cs-next__img"><img src="${img(nxt.cardImage)}" alt="" loading="lazy"></span>
      <i class="cs-next__arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></i>
    </a>` : '';

  return headTop(title, projectDescription(p), url, BASE_URL + p.coverImage) +
`<link rel="stylesheet" href="/assets/style.css">
<link rel="stylesheet" href="/assets/upgrade.css">
<link rel="stylesheet" href="/assets/work.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body class="page-case page-work" style="--acc:${esc(p.accent)};--acc-ink:${esc(p.accentInk)}">
<a class="skip" href="#main">Skip to content</a>
<header class="nav" data-nav>
  <div class="nav__inner">
    <a class="nav__logo" href="/" aria-label="${esc(site.person.name)} — home"><img src="/assets/img/logo.svg" width="59" height="59" alt=""></a>
  </div>
</header>
<div class="menu" id="menu" data-menu aria-hidden="true">
  <nav aria-label="Menu"><a href="/#top" style="--i:0"><small>01</small>Home</a><a href="/#about" style="--i:1"><small>02</small>About</a><a href="/#projects" style="--i:2"><small>03</small>Projects</a><a href="/#experts" style="--i:3"><small>04</small>Expertise</a><a href="#contact" style="--i:4"><small>05</small>Contact</a></nav>
  ${menuSocial(l, site.projectMenuBehance)}
</div>
${DOCK}
<main id="main">
  <section class="cs-hero" id="top">
    <div class="hero__title" data-hero-title>
      <span class="script hero__script hero__script--case" data-draw>Selected Project</span>
      <h1 class="display display--case" aria-label="${esc(p.name)} — project case study" data-chars data-fit="0.84">PROJECT CASE STUDY</h1>
    </div>
    <dl class="cs-meta">
      ${meta}
    </dl>
    <figure class="cs-cover${p.lightCover ? ' cs-cover--light' : ''}" data-reveal="clip">
      <div class="cs-cover__img" data-parallax="0.12"><img src="${img(p.coverImage)}" alt="${esc(p.name)} — cover visual" fetchpriority="high"></div>
      <figcaption class="script">${esc(p.coverCaption)}</figcaption>
      <p class="cs-cover__name">${esc(p.name)}</p>
    </figure>
    <div class="cs-facts">${facts}</div>
  </section>

  <section class="cs-block cs-challenge">
    <div class="cs-head" data-reveal>
      <span class="script">The Challenge</span>
      <h2 class="anton">${esc(p.challenge.heading)}<span class="dot">.</span></h2>
    </div>
    <div class="cs-copy">${ch}</div>
  </section>

  <section class="cs-block cs-visuals">
    <figure class="cs-wide" data-reveal="clip"><div data-parallax="0.08"><img src="${img(p.wideImage)}" alt="" loading="lazy"></div></figure>
    <div class="cs-duo">
      <div class="cs-panel cs-colors" data-reveal>
        <p class="cs-panel__label">Colors</p>
        <ul>${cols}</ul>
      </div>
      <div class="cs-panel cs-fonts" data-reveal style="--d:.1s">
        <p class="cs-panel__label">Fonts</p>
        <div class="cs-fonts__spec"><span class="aa" style="font-family:${esc(f.previewFont)}">Aa</span><div><strong>${esc(f.display)}</strong><em>${esc(f.displayRole)}</em><strong>${esc(f.body)}</strong><em>${esc(f.bodyRole)}</em></div></div>
        <p class="cs-fonts__glyphs">ABCDEFGHIJKLM<br>abcdefghijklm 0123456789</p>
      </div>
    </div>
  </section>

  <section class="cs-block">
    <div class="cs-head" data-reveal>
      <span class="script">The Scope</span>
      <h2 class="anton">${p.modules.length} modules, designed end to end<span class="dot">.</span></h2>
    </div>
    <ul class="cs-mods" data-reveal>${mods}</ul>
  </section>
${rows}

  <section class="cs-block">
    <div class="cs-dark" data-reveal="scale">
      <div class="cs-head cs-head--light">
        <span class="script">The Outcome</span>
        <h2 class="anton">Three things shaped<br>the design<span class="dot">.</span></h2>
      </div>
      <ol class="cs-three">
        ${out}
      </ol>
    </div>
  </section>

  <section class="cs-block">
    <div class="cs-center" data-reveal>
      <span class="script">Screen Gallery</span>
      <h2 class="anton">A closer look<span class="dot">.</span></h2>
    </div>
    <div class="cs-gallery${p.gallery.phones ? ' cs-gallery--phones' : ''}">${gal}</div>
  </section>

  <section class="cs-block cs-screens">
    <div class="cs-center" data-reveal>
      <span class="script">Every Screen</span>
      <h2 class="anton">${phone ? 'Designed beyond the desktop' : 'Built for the desktop'}<span class="dot">.</span></h2>
    </div>
    <div class="${phone ? 'cs-screens__grid' : 'cs-screens__grid cs-screens__grid--web'}">
      ${screens}
    </div>${next}
  </section>
</main>

` + contactFooter(site, false) +
`<script src="/assets/work.js" defer></script>
</body>
</html>
`;
}

export function renderSitemap(projects, legacy) {
  const urls = [BASE_URL + '/', ...legacy.map((s) => `${BASE_URL}/projects/${s}/`), ...projects.map((p) => `${BASE_URL}/projects/${p.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
}
