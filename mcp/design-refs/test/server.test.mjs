import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const PORT = 7391;
const TOKEN = 'test-token-0123456789abcdefghij';
const URL_MCP = new URL(`http://127.0.0.1:${PORT}/mcp`);
let child; let dataDir; let client;

async function fixture() {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'design-refs-'));
  const dir = path.join(dataDir, 'refs', 'saas', 'example-com');
  await fs.mkdir(dir, { recursive: true });
  await sharp({ create: { width: 1440, height: 900, channels: 3, background: '#224466' } }).jpeg().toFile(path.join(dir, 'desktop.jpg'));
  await sharp({ create: { width: 1440, height: 5000, channels: 3, background: '#664422' } }).jpeg().toFile(path.join(dir, 'full.jpg'));
  const entries = [
    { id: 'example-com', category: 'saas', source: 'test', name: 'Example', url: 'https://example.com/', files: { desktop: 'saas/example-com/desktop.jpg', full: 'saas/example-com/full.jpg' }, tier: 'A', moves: ['type-as-hero'], facets: ['type', 'page-404'], note: 'fixture' },
    { id: 'other-com', category: 'ecommerce', source: 'test', name: 'Other', url: 'https://other.com/', files: {}, tier: 'C', moves: ['purple-blue-gradient'], note: 'counter' },
  ];
  await fs.writeFile(path.join(dataDir, 'refs', 'index.json'), JSON.stringify({ entries }));
}

async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/healthz`); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

before(async () => {
  await fixture();
  child = spawn(process.execPath, ['src/server.mjs'], { env: { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), MCP_TOKEN: TOKEN, RUN_WALL_MS: '3000', DATA_REPO: '', GITHUB_TOKEN: '' }, stdio: ['ignore', 'inherit', 'inherit'] });
  await waitForHealth();
  client = new Client({ name: 'test', version: '0.0.0' });
  await client.connect(new StreamableHTTPClientTransport(URL_MCP, { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } }));
});

after(async () => {
  await client?.close();
  child?.kill('SIGTERM');
  await fs.rm(dataDir, { recursive: true, force: true });
});

const run = (code) => client.callTool({ name: 'refs_run', arguments: { code } });
const textOf = (r) => r.content.find((c) => c.type === 'text').text;

test('rejects requests without the bearer token', async () => {
  const r = await fetch(URL_MCP, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
  const wrong = await fetch(URL_MCP, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer nope' }, body: '{}' });
  assert.equal(wrong.status, 401);
});

test('exposes exactly two tools', async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ['refs_api', 'refs_run']);
});

test('refs_api describes the API and library size', async () => {
  const r = await client.callTool({ name: 'refs_api', arguments: {} });
  assert.match(textOf(r), /declare const refs/);
  assert.match(textOf(r), /"total":2/);
});

test('search filters by tier and category', async () => {
  const r = await run(`return await refs.search({ tier: 'A' });`);
  const out = JSON.parse(textOf(r).split('result:\n')[1]);
  assert.equal(out.total, 1);
  assert.equal(out.results[0].id, 'example-com');
});

test('search filters by facet, and tag rejects unknown facets', async () => {
  const parse = (r) => JSON.parse(textOf(r).split('result:\n')[1]);
  const one = parse(await run(`return await refs.search({ facet: 'page-404' });`));
  assert.deepEqual(one.results.map((r) => r.id), ['example-com']);
  assert.deepEqual(one.results[0].facets, ['type', 'page-404']);
  const none = parse(await run(`return await refs.search({ facet: ['3d', 'effects'] });`));
  assert.equal(none.total, 0);
  const stats = parse(await run(`return await refs.stats();`));
  assert.equal(stats.byFacet['page-404'], 1);
  const bad = await run(`return await refs.tag('other-com', { facets: ['sparkles'] });`);
  assert.equal(bad.isError, true);
});

test('image attaches a resized slice and reports paging', async () => {
  const r = await run(`return await refs.image('example-com', { view: 'full', top: 1000, height: 2000, width: 400 });`);
  assert.notEqual(r.isError, true);
  const img = r.content.find((c) => c.type === 'image');
  assert.ok(img && img.data.length > 100);
  const meta = await sharp(Buffer.from(img.data, 'base64')).metadata();
  assert.equal(meta.width, 400);
  const info = JSON.parse(textOf(r).split('result:\n')[1]);
  assert.deepEqual(info.slice, { top: 1000, height: 2000 });
  assert.equal(info.more, true);
});

test('invalid arguments return a readable error, not a crash', async () => {
  const r = await run(`return await refs.image('../../etc/passwd');`);
  assert.equal(r.isError, true);
  assert.match(textOf(r), /Invalid arguments for image/);
});

test('missing view is reported', async () => {
  const r = await run(`return await refs.image('other-com');`);
  assert.equal(r.isError, true);
  assert.match(textOf(r), /has no "shot" view\. Available: none/);
});

test('sandbox has no host access', async () => {
  const r = await run(`return [typeof require, typeof process, typeof fetch, typeof __host, typeof __log, typeof __c, typeof globalThis.Deno];`);
  const out = JSON.parse(textOf(r).split('result:\n')[1]);
  assert.deepEqual(out, Array(7).fill('undefined'));
});

test('runaway code is interrupted', async () => {
  const r = await run(`while (true) {}`);
  assert.equal(r.isError, true);
});

test('console.log output comes back', async () => {
  const r = await run(`console.log('hello', { a: 1 }); return 1;`);
  assert.match(textOf(r), /logs:\nhello/);
});

test('lessons add, reinforce and list', async () => {
  const add = (rule) => run(`return await lessons.add({ rule: ${JSON.stringify(rule)}, why: 'Because the critic saw it twice on hero sections.', scope: 'composition' });`);
  const first = JSON.parse(textOf(await add('Never stack a logo wall directly under the hero headline on the first screen.')).split('result:\n')[1]);
  assert.equal(first.status, 'added');
  const second = JSON.parse(textOf(await add('Never stack a logo wall directly under the hero headline on first screen')).split('result:\n')[1]);
  assert.equal(second.status, 'reinforced');
  assert.equal(second.lesson.seen, 2);
  const list = JSON.parse(textOf(await run(`return await lessons.list({ scope: 'composition' });`)).split('result:\n')[1]);
  assert.equal(list.length, 1);
});

test('measure and capture refuse private addresses', async () => {
  for (const url of ['http://127.0.0.1/', 'http://localhost/', 'http://169.254.169.254/latest/meta-data', 'http://10.0.0.1/', 'file:///etc/passwd', 'https://example.com:8443/']) {
    const r = await run(`return await refs.measure(${JSON.stringify(url)});`);
    assert.equal(r.isError, true, url);
  }
});

test('image rejects a top past the end of the picture', async () => {
  const r = await run(`return await refs.image('example-com', { view: 'full', top: 49000 });`);
  assert.equal(r.isError, true);
  assert.match(textOf(r), /past the end of this image/);
});

test('at most six images per run', async () => {
  const r = await run(`for (let i = 0; i < 7; i++) await refs.image('example-com', { width: 200 });`);
  assert.equal(r.isError, true);
  assert.match(textOf(r), /At most 6 images/);
});
