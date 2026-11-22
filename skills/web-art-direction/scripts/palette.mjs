// Palette probe: screenshots the page with photos, video and canvases hidden, then measures how much
// of what the designer painted is saturated color, and in which hues. A break color is rare and deliberate.
const MAX_HEIGHT = 16000;
const SAMPLE_WIDTH = 360;
const CHROMA_MIN = 0.32;
const HUE_BUCKET_DEG = 15;
const CLUSTER_MIN_SHARE = 0.002;
const NO_ACCENT_SHARE = 0.002;
const COMPETING_SHARE = 0.01;
const COMPETING_COUNT = 3;
const FLOOD_SHARE = 0.45;

function hideMedia() {
  for (const el of document.querySelectorAll('img, picture, video, canvas, iframe')) el.style.visibility = 'hidden';
  for (const el of document.querySelectorAll('body *')) if (/url\(/.test(getComputedStyle(el).backgroundImage)) el.style.backgroundImage = 'none';
}

async function measure([sampleWidth, chromaMin, bucketDeg, firstScreenFraction]) {
  const img = document.querySelector('img');
  await img.decode();
  const w = sampleWidth, h = Math.round(img.naturalHeight * sampleWidth / img.naturalWidth);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const buckets = Math.round(360 / bucketDeg);
  const tally = (rows) => {
    const n = new Array(buckets).fill(0), sum = Array.from({ length: buckets }, () => [0, 0, 0]);
    let total = 0, accent = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      total++;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), ch = mx - mn;
      if (ch < chromaMin) continue;
      accent++;
      let hue = mx === r ? (g - b) / ch : mx === g ? 2 + (b - r) / ch : 4 + (r - g) / ch;
      hue = ((hue * 60) + 360) % 360;
      const k = Math.floor(hue / bucketDeg) % buckets;
      n[k]++; sum[k][0] += data[i]; sum[k][1] += data[i + 1]; sum[k][2] += data[i + 2];
    }
    return { n, sum, total, accent };
  };
  return { page: tally(h), firstScreen: tally(Math.min(h, Math.round(h * firstScreenFraction))), bucketDeg };
}

// Contiguous runs of hue buckets above the threshold, walked around the circle from a cold bucket.
function clusters({ n, sum, total }, bucketDeg, minShare) {
  const hot = n.map((v) => v / total >= minShare);
  const cold = hot.indexOf(false);
  const runs = [];
  let run = null;
  for (let j = 1; j <= n.length; j++) {
    const k = (Math.max(cold, 0) + j) % n.length;
    if (hot[k]) (run ||= []).push(k);
    else if (run) { runs.push(run); run = null; }
  }
  if (run) runs.push(run);
  return runs.map((ks) => {
    const count = ks.reduce((t, k) => t + n[k], 0);
    const rgb = [0, 1, 2].map((i) => ks.reduce((t, k) => t + sum[k][i], 0) / count);
    const peak = ks.reduce((p, k) => (n[k] > n[p] ? k : p), ks[0]);
    return { hue: peak * bucketDeg + bucketDeg / 2, hex: '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''), share: +(count / total).toFixed(4) };
  }).sort((x, y) => y.share - x.share);
}

export async function probePalette(browser, url, { settleMs = 1500, viewport = { width: 1440, height: 900 } } = {}) {
  const page = await browser.newPage({ viewport });
  let shot, height;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(settleMs);
    await page.evaluate(hideMedia);
    height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), MAX_HEIGHT);
    shot = await page.screenshot({ type: 'png', fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height } });
  } finally { await page.close(); }
  const lab = await browser.newPage();
  try {
    await lab.setContent(`<img src="data:image/png;base64,${shot.toString('base64')}">`, { waitUntil: 'load' });
    const m = await lab.evaluate(measure, [SAMPLE_WIDTH, CHROMA_MIN, HUE_BUCKET_DEG, viewport.height / height]);
    const summary = (t) => ({ accentShare: +(t.accent / t.total).toFixed(4), clusters: clusters(t, m.bucketDeg, CLUSTER_MIN_SHARE) });
    return { page: summary(m.page), firstScreen: summary(m.firstScreen) };
  } finally { await lab.close(); }
}

export function paletteTells(p) {
  const tells = [];
  const list = (cs) => cs.map((c) => `${c.hex} ${(c.share * 100).toFixed(1)}%`).join(', ');
  if (p.page.accentShare < NO_ACCENT_SHARE) tells.push({ rule: 'no-break-color', detail: `only ${(p.page.accentShare * 100).toFixed(2)}% of the painted page is saturated: there is no accent to give the system its spark` });
  const competing = p.page.clusters.filter((c) => c.share >= COMPETING_SHARE);
  if (competing.length >= COMPETING_COUNT) tells.push({ rule: 'competing-accents', detail: `${competing.length} saturated hues compete (${list(competing)}): pick one break color and make the rest neutral` });
  if (p.page.accentShare > FLOOD_SHARE) tells.push({ rule: 'accent-flood', detail: `${(p.page.accentShare * 100).toFixed(0)}% of the page is saturated (${list(p.page.clusters.slice(0, 3))}): an accent shocks because it is rare` });
  return tells;
}
