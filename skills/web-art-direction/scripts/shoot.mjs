// Screenshot a build for review and scan it for mechanical tells.
// usage: node shoot.mjs <file-or-url> <out-dir>
import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { probeMotion, filmstrip, motionTells } from './motion.mjs';
import { probePalette, paletteTells } from './palette.mjs';

const SLICE_HEIGHT = 1800;
const MAX_HEIGHT = 16000;
const SETTLE_MS = 1500;
const FULL_HD = 1920;
const MIN_JPEG_QUALITY = 80;
const ICON_MAX_PX = 120;

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const root = execSync('npm root -g').toString().trim();
  return createRequire(path.join(root, 'noop.js'))('playwright');
}

const [target, outDir] = process.argv.slice(2);
if (!target || !outDir) { console.error('usage: node shoot.mjs <file-or-url> <out-dir>'); process.exit(2); }
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
await fs.mkdir(outDir, { recursive: true });

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });

async function settle(page) {
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(SETTLE_MS);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(h, MAX_HEIGHT); y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  return page.evaluate(() => document.documentElement.scrollHeight);
}

function scan() {
  const out = [];
  const add = (rule, detail) => out.push({ rule, detail });
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const text = (el) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 80);

  for (const h of document.querySelectorAll('h1, h2')) {
    if (!visible(h)) continue;
    let prev = h.previousElementSibling;
    if (!prev && h.parentElement) prev = h.parentElement.previousElementSibling;
    if (prev && visible(prev)) {
      const s = getComputedStyle(prev); const t = text(prev);
      const small = parseFloat(s.fontSize) <= 14; const caps = s.textTransform === 'uppercase' || (t && t === t.toUpperCase() && /[A-Z]/.test(t));
      const pill = parseFloat(s.borderRadius) >= 10 && s.backgroundColor !== 'rgba(0, 0, 0, 0)';
      if (t && t.length < 60 && small && (caps || pill || parseFloat(s.letterSpacing) > 0.5)) add('eyebrow-above-heading', `"${t}" above "${text(h)}"`);
    }
  }
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if ((s.backgroundClip === 'text' || s.webkitBackgroundClip === 'text') && s.backgroundImage.includes('gradient')) add('gradient-text', text(el));
  }
  const purple = /rgba?\((\d+),\s*(\d+),\s*(\d+)/g;
  for (const el of document.querySelectorAll('body, body > *, section, header, main > *')) {
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg.includes('gradient')) continue;
    const hues = [...bg.matchAll(purple)].map(([, r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 0.15) return null; let h = mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn); return ((h * 60) + 360) % 360; }).filter((h) => h !== null);
    if (hues.some((h) => h >= 240 && h <= 300)) add('purple-blue-gradient', `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`);
  }
  const groups = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const kids = [...el.children].filter(visible);
    if (kids.length < 3 || kids.length > 6) continue;
    const boxes = kids.map((k) => k.getBoundingClientRect());
    const sameRow = boxes.every((b) => Math.abs(b.top - boxes[0].top) < 4);
    const sameSize = boxes.every((b) => Math.abs(b.width - boxes[0].width) < 4 && Math.abs(b.height - boxes[0].height) < 24);
    const cardLike = kids.every((k) => k.querySelector('h3, h4, strong') && (k.querySelector('svg, img, i') || getComputedStyle(k).borderRadius !== '0px'));
    if (sameRow && sameSize && cardLike && boxes[0].width < 520) groups.set(el, kids.length);
  }
  if (groups.size >= 2) add('repeated-equal-card-rows', `${groups.size} rows of equal icon/heading cards`);
  else if (groups.size === 1) add('equal-card-row', 'one row of equal icon/heading cards (fine once, check it is the right container)');

  // Status dots ("● Live", "● October · closed") read as a template's idea of a live product.
  const isDot = (cs, w, h) => w >= 4 && w <= 12 && Math.abs(w - h) <= 1 && parseFloat(cs.borderTopLeftRadius) >= w / 2 - 1 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
  const hasDot = (el) => {
    // Only a dot set beside a label counts; unread badges on icons and avatars have no text next to them.
    for (const p of ['::before', '::after']) { const ps = getComputedStyle(el, p); if (ps.content !== 'none' && isDot(ps, parseFloat(ps.width), parseFloat(ps.height)) && text(el)) return true; }
    const r = el.getBoundingClientRect();
    return el.children.length === 0 && isDot(getComputedStyle(el), r.width, r.height) && !!el.parentElement && !!text(el.parentElement);
  };
  const dotted = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el), t = text(el);
    const pill = t && r.height >= 14 && r.height <= 48 && r.width <= 360 && parseFloat(s.borderTopLeftRadius) >= r.height / 2 - 2 && (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.borderTopWidth) > 0);
    const chrome = el.closest('header, nav, [role="banner"]') && t && t.length < 40;
    if (!pill && !chrome) continue;
    if (/^[●•◉⬤]/.test(t) || hasDot(el) || [...el.querySelectorAll('*')].some(hasDot)) dotted.add(el);
  }
  for (const el of dotted) {
    if ([...dotted].some((d) => d !== el && el.contains(d))) continue;
    add('status-dot', `"${text(el).slice(0, 40)}"${el.closest('header, nav, [role="banner"]') ? ' in the nav' : ''}`);
  }

  const controls = [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="switch"], input, select, summary')].filter(visible);
  const animated = controls.filter((el) => getComputedStyle(el).transitionDuration.split(',').some((d) => parseFloat(d) > 0));
  if (controls.length >= 5 && animated.length / controls.length < 0.3) add('static-controls', `${animated.length} of ${controls.length} interactive elements have any transition`);
  let activeRules = 0;
  const walk = (rules) => { for (const r of rules) { if (r.selectorText && r.selectorText.includes(':active')) activeRules++; if (r.cssRules) walk(r.cssRules); } };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch { /* cross-origin sheet */ } }
  if (controls.length >= 5 && !activeRules) add('no-press-feedback', 'no :active style anywhere: buttons do not answer a press (ignore if a library such as Motion whileTap handles it)');

  const body = document.body.innerText;
  const phrases = ['elevate', 'unlock', 'seamless', 'supercharge', 'revolutioniz', 'empower', 'streamline', 'effortless', 'next-level', 'game-changer', "today's fast-paced", 'all-in-one platform', 'welcome back', 'cutting-edge', 'world-class', 'take your', 'to the next level'];
  for (const p of phrases) { const n = body.toLowerCase().split(p).length - 1; if (n) add('stock-phrase', `"${p}" x${n}`); }
  const dashes = (body.match(/—/g) || []).length; if (dashes > 2) add('em-dashes', `${dashes} em dashes in visible copy`);
  // Emoji_Presentation (or a pictograph forced to emoji style) excludes text dingbats like ✓ ✔ ✕ that UIs use legitimately.
  const emoji = (body.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu) || []).length; if (emoji) add('emoji-in-copy', `${emoji} emoji`);
  const families = new Set([...document.querySelectorAll('h1, h2, h3, p, a, button')].filter(visible).map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()));
  if ([...families].some((f) => /^(Inter|DM Sans|Plus Jakarta Sans|Poppins|Montserrat|system-ui|-apple-system|Arial|Helvetica)$/i.test(f)) && families.size === 1) add('single-default-sans', [...families].join(', '));
  const h1 = document.querySelector('h1'); if (h1 && parseFloat(getComputedStyle(h1).fontSize) < 48) add('timid-display-size', `h1 is ${getComputedStyle(h1).fontSize}`);
  const sections = [...document.querySelectorAll('main > section, body > section, main > div, body > div > section')].filter(visible).map((s) => Math.round(s.getBoundingClientRect().height / 50) * 50);
  if (sections.length >= 5 && new Set(sections).size <= 2) add('uniform-section-heights', sections.join(','));
  const imgs = [...document.querySelectorAll('img')].filter((i) => visible(i) && (!i.complete || i.naturalWidth === 0)).map((i) => i.src.slice(0, 100));
  if (imgs.length) add('broken-images', imgs.join(' '));
  if (document.documentElement.scrollWidth > window.innerWidth + 1) add('horizontal-overflow', `${document.documentElement.scrollWidth}px wide at ${window.innerWidth}px`);
  return out;
}

// Photos must be full HD at the source: long edge >= 1920px, or 3x the rendered width for small images.
async function imageQuality([fullHd, minQ, iconMax]) {
  const out = [];
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = src; });
  const items = [...document.querySelectorAll('img')].filter(visible).map((i) => ({ src: i.currentSrc || i.src, w: i.getBoundingClientRect().width, nat: [i.naturalWidth, i.naturalHeight] }));
  for (const el of document.querySelectorAll('body *')) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = /url\(["']?([^"')]+)["']?\)/.exec(bg);
    if (m && visible(el) && !m[1].startsWith('data:image/svg')) items.push({ src: m[1], w: el.getBoundingClientRect().width, nat: null });
  }
  for (const it of items) {
    if (/\.svg(\?|$)/i.test(it.src) || it.src.startsWith('data:image/svg')) continue;
    const nat = it.nat && it.nat[0] ? it.nat : await load(it.src);
    if (!nat) continue;
    const need = it.w <= iconMax ? it.w * 3 : fullHd;
    if (Math.max(...nat) < need) out.push({ rule: 'low-res-image', detail: `${nat[0]}x${nat[1]} shown ${Math.round(it.w)}px wide: ${it.src.slice(0, 90)}` });
    const q = /[?&]q=(\d+)/.exec(it.src);
    if (q && +q[1] < minQ) out.push({ rule: 'low-image-quality', detail: `q=${q[1]}: ${it.src.slice(0, 90)}` });
  }
  return out;
}

const report = { url, shots: {}, tells: {} };
try {
  const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const h = await settle(desk);
  await desk.screenshot({ path: path.join(outDir, 'desktop.jpg'), type: 'jpeg', quality: 85 });
  report.shots.desktop = 'desktop.jpg';
  report.pageHeight = h;
  report.tells.desktop = [...await desk.evaluate(scan), ...await desk.evaluate(imageQuality, [FULL_HD, MIN_JPEG_QUALITY, ICON_MAX_PX])];
  const total = Math.min(h, MAX_HEIGHT);
  report.shots.slices = [];
  for (let top = 0, i = 1; top < total; top += SLICE_HEIGHT, i++) {
    const name = `desktop-slice-${String(i).padStart(2, '0')}.jpg`;
    await desk.screenshot({ path: path.join(outDir, name), type: 'jpeg', quality: 80, fullPage: true, clip: { x: 0, y: top, width: 1440, height: Math.min(SLICE_HEIGHT, total - top) } });
    report.shots.slices.push(name);
  }

  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mh = await settle(mob);
  await mob.screenshot({ path: path.join(outDir, 'mobile.jpg'), type: 'jpeg', quality: 80 });
  await mob.screenshot({ path: path.join(outDir, 'mobile-full.jpg'), type: 'jpeg', quality: 70, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(mh, 9000) } });
  report.shots.mobile = 'mobile.jpg';
  report.shots.mobileFull = 'mobile-full.jpg';
  report.tells.mobile = (await mob.evaluate(scan)).filter((t) => ['horizontal-overflow', 'broken-images'].includes(t.rule)).map((t) => ({ ...t, rule: `mobile-${t.rule}` }));
  await mob.close();
  await desk.close();

  const motion = await probeMotion(browser, url, { settleMs: SETTLE_MS });
  await filmstrip(browser, motion.frames, path.join(outDir, 'filmstrip.jpg'));
  report.shots.filmstrip = 'filmstrip.jpg';
  const { frames, ...motionData } = motion;
  report.motion = motionData;
  report.tells.motion = motionTells(motion);
  report.palette = await probePalette(browser, url, { settleMs: SETTLE_MS });
  report.tells.palette = paletteTells(report.palette);
} finally { await browser.close(); }

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
const all = [...report.tells.desktop, ...report.tells.mobile, ...report.tells.motion, ...report.tells.palette];
console.log(`shots in ${outDir}: desktop.jpg, ${report.shots.slices.length} slices, mobile.jpg, mobile-full.jpg, filmstrip.jpg`);
console.log(`motion: ${JSON.stringify(report.motion.counts)} scrubbed=${report.motion.scrubbed} libs=${JSON.stringify(report.motion.libraries)}`);
console.log(`palette: ${(report.palette.page.accentShare * 100).toFixed(1)}% saturated; ${report.palette.page.clusters.map((c) => `${c.hex} ${(c.share * 100).toFixed(1)}%`).join(', ') || 'no accent hues'}`);
console.log(all.length ? `tells (${all.length}):\n${all.map((t) => `- ${t.rule}: ${t.detail}`).join('\n')}` : 'tells: none');
