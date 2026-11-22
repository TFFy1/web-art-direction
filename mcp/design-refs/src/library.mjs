import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import { config, limits } from './config.mjs';

const TIERS = ['A', 'B', 'C', '?'];
const VIEWS = ['desktop', 'full', 'mobile', 'shot'];
const SLUG = /^[a-z0-9-]{1,120}$/;
const CATEGORY = /^[a-z0-9-]{1,40}$/;
// The design decision a reference teaches, so a builder can look up "a 404 page" or "type-led" across industries.
export const FACETS = [
  'layout', 'type', 'color', 'imagery', 'copy', 'motion', 'scroll', '3d', 'effects', 'sections', 'components', 'micro-interactions',
  'app-shell', 'data-viz',
  'page-404', 'page-auth', 'page-settings', 'page-pricing', 'page-changelog', 'page-careers', 'page-docs', 'page-article',
  'page-case-study', 'page-about', 'page-contact', 'page-legal', 'page-checkout', 'page-onboarding',
  'state-empty', 'state-error', 'state-loading', 'state-success',
];
const FACET = z.enum(FACETS);

export const schemas = {
  search: z.object({
    category: z.string().regex(CATEGORY).optional(),
    tier: z.union([z.enum(TIERS), z.array(z.enum(TIERS)).max(4)]).optional(),
    moves: z.array(z.string().max(60)).max(10).optional(),
    match: z.enum(['all', 'any']).default('any'),
    facet: z.union([FACET, z.array(FACET).max(8)]).optional(),
    text: z.string().max(100).optional(),
    limit: z.number().int().min(1).max(limits.searchMaxResults).default(12),
  }).strict().default({}),
  get: z.object({ id: z.string().regex(SLUG) }).strict(),
  image: z.object({
    id: z.string().regex(SLUG),
    view: z.enum(VIEWS).optional(),
    top: z.number().int().min(0).max(50_000).optional(),
    height: z.number().int().min(100).max(limits.imageMaxSliceHeight).optional(),
    width: z.number().int().min(200).max(limits.imageMaxWidth).default(limits.imageDefaultWidth),
  }).strict(),
  tag: z.object({
    id: z.string().regex(SLUG),
    tier: z.enum(TIERS).optional(),
    moves: z.array(z.string().regex(/^[a-z0-9-]{1,60}$/)).max(12).optional(),
    facets: z.array(FACET).max(8).optional(),
    note: z.string().max(400).optional(),
  }).strict(),
  lessonsList: z.object({
    scope: z.string().max(40).optional(),
    text: z.string().max(100).optional(),
  }).strict().default({}),
  lessonsAdd: z.object({
    rule: z.string().min(10).max(300),
    why: z.string().min(10).max(500),
    scope: z.enum(['composition', 'type', 'color', 'imagery', 'copy', 'motion', 'components', 'mobile', 'process', 'general']).default('general'),
    evidence: z.string().max(300).optional(),
  }).strict(),
};

let indexCache = null;

async function loadIndex() {
  if (indexCache) return indexCache;
  const raw = JSON.parse(await fs.readFile(path.join(config.refsDir, 'index.json'), 'utf8'));
  indexCache = raw;
  return raw;
}

async function saveIndex(index) {
  index.generated = new Date().toISOString();
  index.count = index.entries.length;
  const file = path.join(config.refsDir, 'index.json');
  await fs.writeFile(`${file}.tmp`, JSON.stringify(index, null, 2));
  await fs.rename(`${file}.tmp`, file);
  indexCache = index;
}

const summary = (e) => ({ id: e.id, name: e.name, category: e.category, tier: e.tier, moves: e.moves, facets: e.facets || [], note: e.note, url: e.url, views: Object.keys(e.files) });

export async function search(q) {
  const { entries } = await loadIndex();
  const tiers = q.tier ? [q.tier].flat() : null;
  const text = q.text?.toLowerCase();
  const facets = q.facet ? [q.facet].flat() : null;
  const rows = entries.filter((e) => {
    if (facets && !facets.some((f) => (e.facets || []).includes(f))) return false;
    if (q.category && e.category !== q.category) return false;
    if (tiers && !tiers.includes(e.tier)) return false;
    if (q.moves?.length) {
      const hit = q.match === 'all' ? q.moves.every((m) => e.moves.includes(m)) : q.moves.some((m) => e.moves.includes(m));
      if (!hit) return false;
    }
    if (text && !`${e.name} ${e.note} ${e.moves.join(' ')} ${(e.facets || []).join(' ')} ${e.url}`.toLowerCase().includes(text)) return false;
    return true;
  });
  const order = { A: 0, B: 1, C: 2, '?': 3 };
  rows.sort((a, b) => order[a.tier] - order[b.tier]);
  return { total: rows.length, results: rows.slice(0, q.limit).map(summary) };
}

export async function get({ id }) {
  const { entries } = await loadIndex();
  const e = entries.find((x) => x.id === id);
  if (!e) throw new UserError(`No reference with id "${id}". Use refs.search() to find ids.`);
  return e;
}

export async function moves() {
  const { entries } = await loadIndex();
  const map = new Map();
  for (const e of entries) for (const m of e.moves) {
    const row = map.get(m) || { move: m, count: 0, tierA: [] };
    row.count += 1;
    if (e.tier === 'A' && row.tierA.length < 4) row.tierA.push(e.id);
    map.set(m, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function stats() {
  const { entries } = await loadIndex();
  const count = (k) => entries.reduce((a, e) => ((a[e[k]] = (a[e[k]] || 0) + 1), a), {});
  const byFacet = {};
  for (const e of entries) for (const f of e.facets || []) byFacet[f] = (byFacet[f] || 0) + 1;
  return { total: entries.length, byCategory: count('category'), byTier: count('tier'), byFacet };
}

function resolveFile(entry, view) {
  const chosen = view || (entry.files.desktop ? 'desktop' : 'shot');
  const rel = entry.files[chosen];
  if (!rel) throw new UserError(`Reference "${entry.id}" has no "${chosen}" view. Available: ${Object.keys(entry.files).join(', ') || 'none'}.`);
  const abs = path.resolve(config.refsDir, rel);
  if (!abs.startsWith(config.refsDir + path.sep)) throw new Error('Path escapes library root');
  return { view: chosen, abs };
}

export async function image(q) {
  const entry = await get({ id: q.id });
  const { view, abs } = resolveFile(entry, q.view);
  const meta = await sharp(abs).metadata();
  const top = q.top ?? 0;
  if (top >= meta.height) throw new UserError(`top ${top} is past the end of this image (height ${meta.height}).`);
  const defaultHeight = view === 'full' ? limits.fullPageDefaultSliceHeight : meta.height;
  const height = Math.min(q.height ?? defaultHeight, meta.height - top);
  const width = Math.min(q.width, meta.width);
  const buf = await sharp(abs).extract({ left: 0, top, width: meta.width, height }).resize({ width }).jpeg({ quality: 75 }).toBuffer();
  return {
    data: buf.toString('base64'),
    mimeType: 'image/jpeg',
    info: { id: entry.id, name: entry.name, view, source: { width: meta.width, height: meta.height }, slice: { top, height }, returnedWidth: width, more: top + height < meta.height },
  };
}

export async function tag(q) {
  const index = await loadIndex();
  const e = index.entries.find((x) => x.id === q.id);
  if (!e) throw new UserError(`No reference with id "${q.id}".`);
  if (q.tier) e.tier = q.tier;
  if (q.moves) e.moves = q.moves;
  if (q.facets) e.facets = q.facets;
  if (q.note !== undefined) e.note = q.note;
  e.updatedAt = new Date().toISOString();
  await saveIndex(index);
  return summary(e);
}

export async function addEntry(entry) {
  const index = await loadIndex();
  const i = index.entries.findIndex((x) => x.id === entry.id);
  if (i >= 0) index.entries[i] = { ...index.entries[i], ...entry, tier: index.entries[i].tier, moves: index.entries[i].moves, facets: index.entries[i].facets, note: index.entries[i].note };
  else index.entries.push(entry);
  await saveIndex(index);
  return summary(entry);
}

async function loadLessons() {
  try { return JSON.parse(await fs.readFile(config.lessonsFile, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return { lessons: [] }; throw e; }
}

const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2));
function similarity(a, b) {
  const A = words(a); const B = words(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}
const DUPLICATE_THRESHOLD = 0.8;

export async function lessonsList(q) {
  const { lessons } = await loadLessons();
  const text = q.text?.toLowerCase();
  return lessons
    .filter((l) => (!q.scope || l.scope === q.scope) && (!text || `${l.rule} ${l.why}`.toLowerCase().includes(text)))
    .sort((a, b) => b.seen - a.seen);
}

export async function lessonsAdd(q) {
  const store = await loadLessons();
  const now = new Date().toISOString();
  const dup = store.lessons.find((l) => similarity(l.rule, q.rule) >= DUPLICATE_THRESHOLD);
  if (dup) {
    dup.seen += 1;
    dup.lastSeen = now;
    if (q.evidence) dup.evidence = [...(dup.evidence || []), q.evidence].slice(-5);
    await writeLessons(store);
    return { status: 'reinforced', lesson: dup };
  }
  const lesson = { id: `L${String(store.lessons.length + 1).padStart(3, '0')}`, rule: q.rule, why: q.why, scope: q.scope, evidence: q.evidence ? [q.evidence] : [], seen: 1, added: now, lastSeen: now };
  store.lessons.push(lesson);
  await writeLessons(store);
  return { status: 'added', lesson };
}

async function writeLessons(store) {
  await fs.writeFile(`${config.lessonsFile}.tmp`, JSON.stringify(store, null, 2));
  await fs.rename(`${config.lessonsFile}.tmp`, config.lessonsFile);
}

export class UserError extends Error {}
