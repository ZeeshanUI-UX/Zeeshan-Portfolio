// Checks content before it is saved, so a slip in the dashboard can never
// publish a broken page or an unsafe link.

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR = /^#[0-9a-fA-F]{3,8}$/;

export class Invalid extends Error {
  constructor(msg) { super(msg); this.status = 400; }
}

const str = (v, where, max = 2000, required = false) => {
  if (v == null) v = '';
  if (typeof v !== 'string' && typeof v !== 'number') throw new Invalid(`${where} must be text.`);
  v = String(v);
  if (required && !v.trim()) throw new Invalid(`${where} can't be empty.`);
  if (v.length > max) throw new Invalid(`${where} is too long (max ${max} characters).`);
  return v;
};
const list = (v, where, max = 100) => {
  if (!Array.isArray(v)) throw new Invalid(`${where} must be a list.`);
  if (v.length > max) throw new Invalid(`${where} has too many items (max ${max}).`);
  return v;
};
// Site paths or web addresses only (no javascript: and similar).
const link = (v, where, required = false) => {
  v = str(v, where, 500, required).trim();
  if (v && !/^(https?:\/\/|mailto:|\/)/i.test(v)) throw new Invalid(`${where} must start with https://, mailto: or /`);
  return v;
};
const image = (v, where, required = false) => {
  v = str(v, where, 500, required).trim();
  if (v && !/^(\/assets\/img\/|https:\/\/)/.test(v)) throw new Invalid(`${where} must be an uploaded image.`);
  return v;
};
const color = (v, where) => {
  v = str(v, where, 20, true).trim();
  if (!COLOR.test(v)) throw new Invalid(`${where} must be a colour like #1A2B3C.`);
  return v;
};
const font = (v, where) => {
  v = str(v, where, 120);
  if (/[;{}<>]/.test(v)) throw new Invalid(`${where} contains characters that aren't allowed.`);
  return v;
};

export function validateProject(p) {
  if (!p || typeof p !== 'object') throw new Invalid('Project data is missing.');
  const n = p.name ? `“${p.name}”` : 'Project';
  if (!SLUG.test(p.slug || '')) throw new Invalid(`${n}: the page address may only use a–z, 0–9 and dashes.`);
  const out = {
    slug: p.slug,
    order: Number.isFinite(+p.order) ? +p.order : 999,
    visible: p.visible !== false,
    name: str(p.name, `${n} name`, 80, true),
    cardTags: list(p.cardTags || [], `${n} card tags`, 4).map((t, i) => str(t, `${n} tag ${i + 1}`, 40)),
    cardImage: image(p.cardImage, `${n} card image`, true),
    cardAlt: str(p.cardAlt, `${n} card image description`, 200),
    title: str(p.title, `${n} short title`, 160, true),
    description: str(p.description, `${n} description`, 600),
    accent: color(p.accent, `${n} accent colour`),
    accentInk: color(p.accentInk, `${n} accent text colour`),
    lightCover: Boolean(p.lightCover),
    meta: list(p.meta, `${n} details`, 6).map((m, i) => ({ label: str(m.label, `${n} detail ${i + 1} label`, 40), value: str(m.value, `${n} detail ${i + 1}`, 120) })),
    coverImage: image(p.coverImage, `${n} cover image`, true),
    coverCaption: str(p.coverCaption, `${n} cover caption`, 120),
    facts: list(p.facts, `${n} key numbers`, 6).map((f, i) => ({ value: str(f.value, `${n} number ${i + 1}`, 12), label: str(f.label, `${n} number ${i + 1} label`, 80) })),
    challenge: {
      heading: str(p.challenge?.heading, `${n} challenge heading`, 140, true),
      paragraphs: list(p.challenge?.paragraphs || [], `${n} challenge text`, 6).map((t, i) => str(t, `${n} challenge paragraph ${i + 1}`, 1200)),
    },
    wideImage: image(p.wideImage, `${n} wide image`),
    colors: list(p.colors, `${n} colours`, 4).map((c, i) => color(c, `${n} colour ${i + 1}`)),
    fonts: {
      display: str(p.fonts?.display, `${n} display font`, 60), displayRole: str(p.fonts?.displayRole, `${n} display font use`, 40),
      body: str(p.fonts?.body, `${n} body font`, 60), bodyRole: str(p.fonts?.bodyRole, `${n} body font use`, 40),
      previewFont: font(p.fonts?.previewFont, `${n} preview font`),
    },
    modules: list(p.modules, `${n} modules`, 40).map((m, i) => str(m, `${n} module ${i + 1}`, 60)),
    rows: list(p.rows, `${n} story sections`, 3).map((r, i) => ({
      eyebrow: str(r.eyebrow, `${n} section ${i + 1} label`, 40), heading: str(r.heading, `${n} section ${i + 1} heading`, 140),
      text: str(r.text, `${n} section ${i + 1} text`, 1500), image: image(r.image, `${n} section ${i + 1} image`),
      caption: str(r.caption, `${n} section ${i + 1} caption`, 120),
    })),
    outcome: list(p.outcome, `${n} outcomes`, 3).map((o, i) => ({ title: str(o.title, `${n} outcome ${i + 1} title`, 80), text: str(o.text, `${n} outcome ${i + 1} text`, 400) })),
    gallery: {
      phones: Boolean(p.gallery?.phones),
      items: list(p.gallery?.items || [], `${n} gallery`, 40).map((g, i) => ({ image: image(g.image, `${n} gallery image ${i + 1}`, true), title: str(g.title, `${n} gallery title ${i + 1}`, 80), subtitle: str(g.subtitle, `${n} gallery subtitle ${i + 1}`, 120) })),
    },
    screens: {
      mode: p.screens?.mode === 'phone' ? 'phone' : 'web',
      desktop: { image: image(p.screens?.desktop?.image, `${n} desktop screen`), caption: str(p.screens?.desktop?.caption, `${n} desktop caption`, 80) },
      second: { image: image(p.screens?.second?.image, `${n} second screen`), caption: str(p.screens?.second?.caption, `${n} second caption`, 80) },
    },
  };
  if (out.rows.length !== 3) throw new Invalid(`${n} needs exactly 3 story sections (Process, Structure, Solution).`);
  if (out.outcome.length !== 3) throw new Invalid(`${n} needs exactly 3 outcomes.`);
  return out;
}

export function validateSite(s) {
  if (!s || typeof s !== 'object') throw new Invalid('Home page data is missing.');
  const t = (v, w, m, r) => str(v, w, m, r);
  const chip = (c, i, side) => ({
    label: t(c.label, `${side} skill ${i + 1}`, 40, true),
    icon: ['grid', 'panel', 'search', 'flow', 'frame', 'handoff'].includes(c.icon) ? c.icon : 'grid',
    bg: color(c.bg, `${side} skill ${i + 1} background`), color: color(c.color, `${side} skill ${i + 1} icon colour`),
  });
  return {
    person: { name: t(s.person?.name, 'Your name', 80, true), jobTitle: t(s.person?.jobTitle, 'Job title', 80, true), worksFor: t(s.person?.worksFor, 'Company', 80), country: t(s.person?.country, 'Country code', 4) },
    seo: { title: t(s.seo?.title, 'Page title', 120, true), description: t(s.seo?.description, 'Search description', 300), shareDescription: t(s.seo?.shareDescription, 'Share description', 300), ogImage: link(s.seo?.ogImage, 'Share image') },
    links: { email: t(s.links?.email, 'Email', 120, true), instagram: link(s.links?.instagram, 'Instagram link'), linkedin: link(s.links?.linkedin, 'LinkedIn link'), behance: link(s.links?.behance, 'Behance link'), x: link(s.links?.x, 'X link'), meeting: link(s.links?.meeting, 'Meeting link') },
    projectMenuBehance: Boolean(s.projectMenuBehance),
    hero: {
      script: t(s.hero?.script, 'Hero script line', 40), title: t(s.hero?.title, 'Hero heading', 40, true), ariaLabel: t(s.hero?.ariaLabel, 'Hero heading (screen readers)', 120),
      photo: image(s.hero?.photo, 'Hero photo'), photoAlt: t(s.hero?.photoAlt, 'Hero photo description', 200),
      stats: list(s.hero?.stats || [], 'Hero numbers', 4).map((x, i) => ({ label: t(x.label, `Number ${i + 1} label`, 30), value: t(x.value, `Number ${i + 1}`, 6), suffix: t(x.suffix, `Number ${i + 1} suffix`, 4) })),
    },
    hello: {
      eyebrow: t(s.hello?.eyebrow, 'Hello label', 40), text: t(s.hello?.text, 'Hello sentence', 300, true),
      chipsLeft: list(s.hello?.chipsLeft || [], 'Left skills', 5).map((c, i) => chip(c, i, 'Left')),
      chipsRight: list(s.hello?.chipsRight || [], 'Right skills', 5).map((c, i) => chip(c, i, 'Right')),
    },
    projectsSection: { eyebrow: t(s.projectsSection?.eyebrow, 'Projects label', 40), title: t(s.projectsSection?.title, 'Projects heading', 80, true) },
    moreWork: {
      title: t(s.moreWork?.title, 'More work title', 40), buttonClosed: t(s.moreWork?.buttonClosed, 'Button text', 40), buttonOpen: t(s.moreWork?.buttonOpen, 'Button text (open)', 40),
      footnote: t(s.moreWork?.footnote, 'More work note', 200),
      items: list(s.moreWork?.items || [], 'More work rows', 12).map((r, i) => ({ name: t(r.name, `Row ${i + 1} name`, 60, true), desc: t(r.desc, `Row ${i + 1} description`, 200), tag: t(r.tag, `Row ${i + 1} tag`, 40), link: link(r.link, `Row ${i + 1} link`, true), image: image(r.image, `Row ${i + 1} preview image`) })),
      extra: list(s.moreWork?.extra || [], 'Extra projects', 60).map((r, i) => ({ name: t(r.name, `Extra project ${i + 1} name`, 60, true), desc: t(r.desc, `Extra project ${i + 1} description`, 200), tag: t(r.tag, `Extra project ${i + 1} tag`, 40), link: link(r.link, `Extra project ${i + 1} link`) })),
    },
    about: {
      eyebrow: t(s.about?.eyebrow, 'About label', 40), title: t(s.about?.title, 'About heading', 80), titleDim: t(s.about?.titleDim, 'About heading (grey part)', 60),
      photo: image(s.about?.photo, 'About photo', true), photoAlt: t(s.about?.photoAlt, 'About photo description', 200), bio: t(s.about?.bio, 'Bio', 1500, true),
      timeline: list(s.about?.timeline || [], 'Timeline', 10).map((x, i) => ({ role: t(x.role, `Job ${i + 1} role`, 80, true), company: t(x.company, `Job ${i + 1} company`, 60), from: t(x.from, `Job ${i + 1} start`, 20), to: t(x.to, `Job ${i + 1} end`, 20) })),
    },
    testimonials: {
      title: t(s.testimonials?.title, 'Testimonials title', 40),
      items: list(s.testimonials?.items || [], 'Testimonials', 30).map((r, i) => ({
        name: t(r.name, `Testimonial ${i + 1} name`, 60, true), role: t(r.role, `Testimonial ${i + 1} role`, 100),
        rating: Math.max(1, Math.min(5, Math.round(+r.rating || 5))), visible: r.visible !== false,
        text: list(r.text || [], `Testimonial ${i + 1} text`, 4).map((p, k) => t(p, `Testimonial ${i + 1} paragraph ${k + 1}`, 900)).filter((p) => p.trim()),
      })),
      invite: {
        visible: s.testimonials?.invite?.visible !== false,
        text: list(s.testimonials?.invite?.text || [], 'Invitation text', 4).map((p, k) => t(p, `Invitation paragraph ${k + 1}`, 600)),
        button: t(s.testimonials?.invite?.button, 'Invitation button', 30), buttonActive: t(s.testimonials?.invite?.buttonActive, 'Invitation button (clicked)', 30),
        emailSubject: t(s.testimonials?.invite?.emailSubject, 'Review email subject', 80), linkText: t(s.testimonials?.invite?.linkText, 'LinkedIn link text', 60),
      },
    },
    contact: {
      eyebrow: t(s.contact?.eyebrow, 'Contact label', 60), titleA: t(s.contact?.titleA, 'Contact heading', 30), titleB: t(s.contact?.titleB, 'Contact heading (grey part)', 30),
      text: list(s.contact?.text || [], 'Contact text', 3).map((p, k) => t(p, `Contact line ${k + 1}`, 200)),
      button: t(s.contact?.button, 'Contact button', 30), buttonActive: t(s.contact?.buttonActive, 'Contact button (clicked)', 30), copyright: t(s.contact?.copyright, 'Copyright line', 80),
      buttonToMeeting: Boolean(s.contact?.buttonToMeeting), dockToMeeting: Boolean(s.contact?.dockToMeeting),
    },
  };
}
