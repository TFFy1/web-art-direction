import dns from 'node:dns/promises';
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { z } from 'zod';
import { config, limits } from './config.mjs';
import { UserError, addEntry } from './library.mjs';

export const schemas = {
  measure: z.object({ url: z.string().url().max(500) }).strict(),
  capture: z.object({
    url: z.string().url().max(500),
    category: z.string().regex(/^[a-z0-9-]{1,40}$/),
    name: z.string().min(1).max(80),
  }).strict(),
};

const CONSENT = /^(accept( all)?( cookies)?|allow( all)?( cookies)?|agree|i agree|got it|ok(ay)?|accept & close|continue|alle akzeptieren|tout accepter|accepter|aceptar( todo| todas)?|accetta( tutto)?)$/i;
const CLOSE_LABEL = /close|dismiss|fermer|cerrar|schlie|chiudi/i;
const CLOSE_TEXT = /^(no,? thanks?|close|×|✕|x|not now|maybe later|skip)$/i;
const CLICKABLE = 'button, a, [role="button"], input[type="button"], input[type="submit"]';
const TOP_BANNER_ZONE = 140;
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff');
}

const hostVerdicts = new Map();
async function hostIsPublic(hostname) {
  if (hostVerdicts.has(hostname)) return hostVerdicts.get(hostname);
  let ok = false;
  try {
    const addrs = net.isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true });
    ok = addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address));
  } catch { ok = false; }
  hostVerdicts.set(hostname, ok);
  return ok;
}

async function assertPublicUrl(raw) {
  const u = new URL(raw);
  if (!['http:', 'https:'].includes(u.protocol)) throw new UserError('Only http and https URLs are allowed.');
  if (u.port && !['80', '443'].includes(u.port)) throw new UserError('Only default ports are allowed.');
  if (u.username || u.password) throw new UserError('URLs with credentials are not allowed.');
  if (!(await hostIsPublic(u.hostname))) throw new UserError('That host is not reachable from this server.');
  return u.href;
}

// Small containers (512 MB on Railway's free plan) OOM-kill the renderer on heavy pages without these.
const LOW_MEMORY_ARGS = ['--disable-dev-shm-usage', '--disable-gpu', '--renderer-process-limit=1', '--disable-extensions', '--disable-background-networking', '--js-flags=--max-old-space-size=256'];
const MEASURE_BLOCKED = new Set(['image', 'media']);
const CAPTURE_BLOCKED = new Set(['media']);

let browserPromise = null;
function browser() {
  if (!browserPromise) {
    const launching = chromium.launch({ headless: true, args: LOW_MEMORY_ARGS }).then((b) => {
      // A crashed Chrome (out of memory on a heavy page) must not poison every later call.
      b.on('disconnected', () => { if (browserPromise === launching) browserPromise = null; });
      return b;
    }).catch((e) => { browserPromise = null; throw e; });
    browserPromise = launching;
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) await (await browserPromise).close().catch(() => {});
  browserPromise = null;
}

async function guardedContext(options, blockedTypes) {
  const ctx = await (await browser()).newContext({ locale: 'en-US', serviceWorkers: 'block', acceptDownloads: false, ...options });
  await ctx.route('**/*', async (route) => {
    try {
      if (blockedTypes.has(route.request().resourceType())) return route.abort('blockedbyclient');
      const u = new URL(route.request().url());
      if (['data:', 'blob:'].includes(u.protocol)) return route.continue();
      if (!['http:', 'https:'].includes(u.protocol) || !(await hostIsPublic(u.hostname))) return route.abort('blockedbyclient');
      return route.continue();
    } catch { return route.abort('blockedbyclient'); }
  });
  return ctx;
}

async function dismissConsent(page) {
  for (const frame of page.frames()) {
    const buttons = await frame.$$(CLICKABLE).catch(() => []);
    for (const b of buttons.slice(0, 300)) {
      const t = ((await b.innerText().catch(() => '')) || (await b.getAttribute('value').catch(() => '')) || '').trim();
      if (CONSENT.test(t) && await b.isVisible().catch(() => false)) { await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(800); return; }
    }
  }
}

async function dismissOverlays(page) {
  const candidates = await page.$$(CLICKABLE).catch(() => []);
  for (const c of candidates.slice(0, 400)) {
    if (!await c.isVisible().catch(() => false)) continue;
    const label = (await c.getAttribute('aria-label').catch(() => '')) || '';
    const text = ((await c.innerText().catch(() => '')) || '').trim();
    const inOverlay = await c.evaluate((el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (n.getAttribute('role') === 'dialog' || n.getAttribute('aria-modal') === 'true' || s.position === 'fixed' || s.position === 'sticky') return true;
      }
      return false;
    }).catch(() => false);
    const box = await c.boundingBox().catch(() => null);
    const topBanner = box && box.y < TOP_BANNER_ZONE && CLOSE_LABEL.test(label);
    if (topBanner || (inOverlay && (CLOSE_LABEL.test(label) || CLOSE_TEXT.test(text)))) { await c.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(500); }
  }
  await page.keyboard.press('Escape').catch(() => {});
}

async function open(page, url) {
  try { await page.goto(url, { waitUntil: 'load', timeout: limits.navTimeoutMs }); }
  catch { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: limits.navTimeoutMs }); }
  await page.waitForTimeout(limits.settleMs);
  await dismissConsent(page);
  await dismissOverlays(page);
}

async function walk(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(h, limits.captureMaxHeight); y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(220); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  return page.evaluate(() => document.documentElement.scrollHeight);
}

function measureInPage() {
  const hex = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (a === 0) return null;
    return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0; };
  const pageH = document.documentElement.scrollHeight;
  const vw = window.innerWidth;

  const role = (sel) => {
    const el = [...document.querySelectorAll(sel)].find(visible);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { text: el.innerText.trim().slice(0, 80), family: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: parseFloat(s.fontSize), weight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, transform: s.textTransform, color: hex(s.color) };
  };

  const sizeWeight = new Map(); const familyWeight = new Map(); const fg = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim(); if (t.length < 2) continue;
    const el = n.parentElement; if (!el || !visible(el)) continue;
    const s = getComputedStyle(el);
    const size = Math.round(parseFloat(s.fontSize));
    sizeWeight.set(size, (sizeWeight.get(size) || 0) + t.length);
    const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    familyWeight.set(fam, (familyWeight.get(fam) || 0) + t.length);
    const c = hex(s.color); if (c) fg.set(c, (fg.get(c) || 0) + t.length);
  }
  const share = (m, n) => { const tot = [...m.values()].reduce((a, b) => a + b, 0) || 1; return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ value: k, share: Math.round((v / tot) * 1000) / 10 })); };

  const bg = new Map(); const radii = new Map(); const shadows = new Map();
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    const area = Math.min(r.width, vw) * Math.min(r.height, 4000);
    const b = hex(s.backgroundColor); if (b && area > 2000) bg.set(b, (bg.get(b) || 0) + area);
    if (s.borderRadius !== '0px' && area > 1000) radii.set(s.borderRadius, (radii.get(s.borderRadius) || 0) + 1);
    if (s.boxShadow !== 'none') shadows.set(s.boxShadow.slice(0, 80), (shadows.get(s.boxShadow.slice(0, 80)) || 0) + 1);
  }

  const root = document.querySelector('main') || document.body;
  let blocks = [...root.children].filter(visible);
  if (blocks.length === 1 && blocks[0].children.length > 2) blocks = [...blocks[0].children].filter(visible);
  const sections = blocks.map((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    const heading = el.querySelector('h1, h2, h3');
    return { tag: el.tagName.toLowerCase(), top: Math.round(r.top + window.scrollY), height: Math.round(r.height), background: hex(s.backgroundColor), heading: heading ? heading.innerText.trim().slice(0, 90) : null, images: el.querySelectorAll('img, picture, video, canvas, svg').length, links: el.querySelectorAll('a, button').length, words: (el.innerText || '').split(/\s+/).filter(Boolean).length };
  }).filter((s) => s.height > 120).slice(0, 30);

  const widths = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.maxWidth !== 'none' && s.maxWidth.endsWith('px')) { const w = parseFloat(s.maxWidth); if (w >= 600) widths.set(w, (widths.get(w) || 0) + 1); }
  }

  const btn = [...document.querySelectorAll('a, button')].filter(visible).find((el) => { const s = getComputedStyle(el); return hex(s.backgroundColor) && parseFloat(s.paddingLeft) >= 8; });
  const bs = btn ? getComputedStyle(btn) : null;

  return {
    title: document.title,
    pageHeight: pageH,
    viewportsTall: Math.round((pageH / window.innerHeight) * 10) / 10,
    roles: { h1: role('h1'), h2: role('h2'), h3: role('h3'), body: role('p'), nav: role('nav a, header a'), button: role('button, a[class*="button" i], a[class*="btn" i]') },
    typeScale: share(sizeWeight, 10),
    fontFamilies: share(familyWeight, 6),
    textColors: share(fg, 6),
    backgroundColors: share(bg, 8),
    radii: share(radii, 5),
    shadows: share(shadows, 3),
    contentMaxWidths: share(widths, 4),
    primaryButton: bs ? { text: btn.innerText.trim().slice(0, 40), background: hex(bs.backgroundColor), color: hex(bs.color), radius: bs.borderRadius, padding: bs.padding, font: `${bs.fontWeight} ${bs.fontSize}` } : null,
    sections,
  };
}

export async function measure({ url }) {
  const safe = await assertPublicUrl(url);
  const ctx = await guardedContext({ viewport: DESKTOP }, MEASURE_BLOCKED);
  try {
    const page = await ctx.newPage();
    await open(page, safe);
    await walk(page);
    return { url: page.url(), ...(await page.evaluate(measureInPage)) };
  } finally { await ctx.close(); }
}

const slugOf = (u) => { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 120); };

const capturesInFlight = new Set();

export async function capture(args) {
  const slug = slugOf(args.url);
  if (capturesInFlight.has(slug)) throw new UserError(`A capture of ${slug} is already running.`);
  capturesInFlight.add(slug);
  try { return await captureOne(args, slug); }
  finally { capturesInFlight.delete(slug); }
}

async function captureOne({ url, category, name }, slug) {
  const safe = await assertPublicUrl(url);
  const dir = path.join(config.refsDir, category, slug);
  if (!dir.startsWith(config.refsDir + path.sep)) throw new Error('Path escapes library root');
  await fs.mkdir(dir, { recursive: true });
  const files = {};
  const notes = [];
  let pageHeight = null; let title = null; let finalUrl = safe;

  const desk = await guardedContext({ viewport: DESKTOP }, CAPTURE_BLOCKED);
  try {
    const p = await desk.newPage();
    await open(p, safe);
    finalUrl = p.url(); title = await p.title();
    pageHeight = await walk(p);
    await dismissConsent(p); await dismissOverlays(p); await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(dir, 'desktop.jpg'), type: 'jpeg', quality: 80 });
    files.desktop = `${category}/${slug}/desktop.jpg`;
    const tall = pageHeight > limits.captureMaxHeight;
    await p.screenshot({ path: path.join(dir, 'full.jpg'), type: 'jpeg', quality: 60, fullPage: true, clip: { x: 0, y: 0, width: DESKTOP.width, height: tall ? limits.captureMaxHeight : pageHeight } });
    files.full = `${category}/${slug}/full.jpg`;
  } catch (e) { notes.push(`desktop: ${e.message.split('\n')[0]}`); }
  finally { await desk.close(); }

  const mob = await guardedContext({ viewport: MOBILE, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: MOBILE_UA }, CAPTURE_BLOCKED);
  try {
    const p = await mob.newPage();
    await open(p, safe);
    await p.screenshot({ path: path.join(dir, 'mobile.jpg'), type: 'jpeg', quality: 75 });
    files.mobile = `${category}/${slug}/mobile.jpg`;
  } catch (e) { notes.push(`mobile: ${e.message.split('\n')[0]}`); }
  finally { await mob.close(); }

  if (!files.desktop) throw new UserError(`Could not capture ${safe}. ${notes.join('; ')}`);
  const meta = { cat: category, src: 'capture', url: safe, name, slug, capturedAt: new Date().toISOString(), status: 'ok', notes, finalUrl, title, pageHeight };
  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  const entry = await addEntry({ id: slug, category, source: 'capture', name, url: safe, capturedAt: meta.capturedAt, pageHeight, files, tier: '?', moves: [], note: '' });
  return { ...entry, notes, reminder: 'New captures start at tier "?". Look at the image, then call refs.tag() with a tier, moves and a note.' };
}
