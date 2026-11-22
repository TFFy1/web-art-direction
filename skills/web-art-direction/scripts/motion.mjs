// Scroll-motion probe: scrolls a fresh page with wheel events, records how visible elements
// change between steps, and builds a filmstrip contact sheet so a reviewer can see motion in stills.
const MAX_SCROLL = 16000;
const STEP_FRACTION = 0.3;
const STEP_WAIT_MS = 320;
const MAX_FRAMES = 24;
const FRAME_COLS = 4;
const FRAME_WIDTH = 360;
const MAX_TRACKED = 1800;
const MIN_AREA = 1600;
const NAV_MAX_HEIGHT = 160;

function sample() {
  const vh = innerHeight, vw = innerWidth;
  const out = [];
  let n = window.__probeN || 0;
  for (const el of document.querySelectorAll('body *')) {
    if (out.length >= 1800) break;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 1600 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (!el.dataset.probe) el.dataset.probe = String(++n);
    out.push([el.dataset.probe, Math.round(r.top), Math.round(r.left), Math.round(r.width), Math.round(r.height),
      +(+s.opacity).toFixed(2), s.transform, s.clipPath, s.filter, s.position, el.parentElement?.dataset.probe || '']);
  }
  window.__probeN = n;
  return { y: Math.round(scrollY), items: out };
}

function libraries() {
  const anims = document.getAnimations ? document.getAnimations() : [];
  const cssScroll = anims.filter((a) => a.timeline && /ScrollTimeline|ViewTimeline/.test(a.timeline.constructor.name)).length;
  const scripts = [...document.scripts].map((s) => s.src).join(' ');
  const canvases = [...document.querySelectorAll('canvas')].filter((c) => { const r = c.getBoundingClientRect(); return r.width * r.height > 0.15 * innerWidth * innerHeight; }).length;
  return {
    gsap: !!window.gsap || /gsap/i.test(scripts),
    scrollTrigger: !!window.ScrollTrigger || /ScrollTrigger/i.test(scripts),
    lenis: !!window.lenis || !!window.Lenis || /lenis/i.test(scripts) || document.documentElement.classList.contains('lenis'),
    cssScrollTimelines: cssScroll,
    largeCanvases: canvases,
  };
}

function rotation(t) {
  const m = /matrix\(([^)]+)\)/.exec(t || '');
  if (!m) return 0;
  const [a, b] = m[1].split(',').map(Number);
  return Math.round(Math.atan2(b, a) * 180 / Math.PI);
}

function analyse(steps) {
  const tracks = new Map();
  for (const st of steps) for (const [id, top, left, w, h, op, tf, clip, filter, pos, parent] of st.items) {
    if (!tracks.has(id)) tracks.set(id, []);
    tracks.get(id).push({ y: st.y, top, left, w, h, op, tf, clip, filter, pos, parent });
  }
  const kinds = { pinned: new Set(), horizontal: new Set(), scale: new Set(), rotate: new Set(), clip: new Set(), filter: new Set(), opacity: new Set(), parallax: new Set() };
  const scrubbed = new Set();
  for (const [id, t] of tracks) {
    if (t.length < 2) continue;
    if (t[0].pos === 'fixed' && t[0].h < NAV_MAX_HEIGHT) continue;
    const values = { op: new Set(), w: new Set(), left: new Set() };
    let still = 0, maxStill = 0;
    for (let i = 1; i < t.length; i++) {
      const a = t[i - 1], b = t[i];
      const dy = b.y - a.y;
      if (dy <= 0) continue;
      const docShift = (b.top + b.y) - (a.top + a.y);
      if (Math.abs(b.top - a.top) <= 3 && a.pos !== 'fixed') { still += dy; maxStill = Math.max(maxStill, still); } else still = 0;
      if (Math.abs(b.left - a.left) > 40 && Math.abs(b.w - a.w) < 8) kinds.horizontal.add(id);
      if (a.w > 0 && Math.abs(b.w - a.w) / a.w > 0.03 && Math.abs(b.left - a.left) < 200) kinds.scale.add(id);
      if (Math.abs(rotation(b.tf) - rotation(a.tf)) >= 2) kinds.rotate.add(id);
      if (a.clip !== b.clip) kinds.clip.add(id);
      if (a.filter !== b.filter) kinds.filter.add(id);
      if (Math.abs(b.op - a.op) >= 0.2) kinds.opacity.add(id);
      if (Math.abs(docShift) > 20 && Math.abs(docShift) < dy * 0.9) kinds.parallax.add(id);
      values.op.add(b.op); values.w.add(b.w); values.left.add(b.left);
    }
    if (maxStill >= 600 && t[0].h > 200) kinds.pinned.add(id);
    if (values.op.size >= 4 || values.w.size >= 4 || values.left.size >= 4) scrubbed.add(id);
  }
  // Count only the outermost element of each moving group, so one animated card is not counted once per child.
  const parentOf = new Map();
  for (const [id, t] of tracks) parentOf.set(id, t[0].parent);
  const roots = (set) => [...set].filter((id) => { let p = parentOf.get(id); while (p) { if (set.has(p)) return false; p = parentOf.get(p); } return true; }).length;
  const counts = Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, roots(v)]));
  return { counts, scrubbed: roots(scrubbed), tracked: tracks.size };
}

export async function probeMotion(browser, url, { settleMs = 1500, viewport = { width: 1440, height: 900 } } = {}) {
  const page = await browser.newPage({ viewport });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(settleMs);
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), MAX_SCROLL);
    const step = Math.round(viewport.height * STEP_FRACTION);
    const total = Math.ceil(height / step);
    const frameEvery = Math.max(1, Math.ceil(total / MAX_FRAMES));
    const steps = [], frames = [];
    let lastY = -1, stuck = 0;
    for (let i = 0; i <= total && stuck < 4; i++) {
      if (i) await page.mouse.wheel(0, step);
      await page.waitForTimeout(STEP_WAIT_MS);
      const s = await page.evaluate(sample);
      steps.push(s);
      stuck = s.y === lastY ? stuck + 1 : 0;
      lastY = s.y;
      if (i % frameEvery === 0 && frames.length < MAX_FRAMES) frames.push({ y: s.y, buf: await page.screenshot({ type: 'jpeg', quality: 55 }) });
    }
    const libs = await page.evaluate(libraries);
    const result = analyse(steps);
    return { libraries: libs, ...result, steps: steps.length, scrolled: lastY, frames };
  } finally { await page.close(); }
}

export async function filmstrip(browser, frames, outPath, { viewport = { width: 1440, height: 900 } } = {}) {
  const h = Math.round(FRAME_WIDTH * viewport.height / viewport.width);
  const cells = frames.map((f) => `<figure><img src="data:image/jpeg;base64,${f.buf.toString('base64')}"><figcaption>y=${f.y}</figcaption></figure>`).join('');
  const html = `<!doctype html><style>body{margin:0;background:#111;font:11px ui-monospace,monospace;color:#bbb}main{display:grid;grid-template-columns:repeat(${FRAME_COLS},${FRAME_WIDTH}px);gap:6px;padding:6px}figure{margin:0}img{display:block;width:${FRAME_WIDTH}px;height:${h}px;object-fit:cover}figcaption{padding:2px 0}</style><main>${cells}</main>`;
  const page = await browser.newPage({ viewport: { width: FRAME_COLS * (FRAME_WIDTH + 6) + 6, height: 400 } });
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 80, fullPage: true });
  } finally { await page.close(); }
}

export function motionTells(m) {
  const tells = [];
  const c = m.counts;
  const rich = c.pinned + c.horizontal + c.scale + c.rotate + c.clip + c.filter;
  const any = rich + c.opacity + c.parallax;
  if (!any && !m.libraries.largeCanvases) tells.push({ rule: 'no-scroll-motion', detail: 'nothing changes as the page scrolls' });
  else if (!rich && !m.libraries.largeCanvases) tells.push({ rule: 'fade-up-only', detail: `only opacity/translate reveals (${c.opacity} fades, ${c.parallax} shifts)` });
  if (!c.pinned && !c.horizontal && m.scrubbed < 2 && !m.libraries.largeCanvases) tells.push({ rule: 'no-signature-scene', detail: 'no pinned, horizontal or scrubbed scroll scene' });
  return tells;
}
