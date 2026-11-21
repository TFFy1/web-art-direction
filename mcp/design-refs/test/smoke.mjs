// Live smoke test against a running server: node test/smoke.mjs <mcp-url> <token> [--capture]
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const [url, token] = process.argv.slice(2);
const withCapture = process.argv.includes('--capture');
if (!url || !token) { console.error('usage: node test/smoke.mjs <mcp-url> <token> [--capture]'); process.exit(2); }

const client = new Client({ name: 'smoke', version: '0.0.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
const run = async (label, code) => {
  const t0 = Date.now();
  const r = await client.callTool({ name: 'refs_run', arguments: { code } }, undefined, { timeout: 180_000 });
  const text = r.content.find((c) => c.type === 'text')?.text || '';
  const imgs = r.content.filter((c) => c.type === 'image').length;
  console.log(`\n## ${label} ${r.isError ? 'ERROR' : 'ok'} ${Date.now() - t0}ms images=${imgs}\n${text.slice(0, 1500)}`);
  return r;
};

const api = await client.callTool({ name: 'refs_api', arguments: {} });
console.log('refs_api chars:', api.content[0].text.length, api.content[0].text.split('## Library now')[1]);

await run('search tier-A saas + 2 hero images', `
const { total, results } = await refs.search({ category: 'saas', tier: 'A', limit: 2 });
for (const r of results) await refs.image(r.id, { width: 800 });
return { total, ids: results.map(r => r.id) };`);

await run('page through a full page', `return await refs.image('stripe-com', { view: 'full', top: 900, height: 1800, width: 700 });`);

await run('moves vocabulary top 8', `return (await refs.moves()).slice(0, 8);`);

await run('lessons', `return (await lessons.list()).map(l => l.id + ' ' + l.rule.slice(0, 60));`);

await run('measure linear.app', `
const m = await refs.measure('https://linear.app/');
return { title: m.title, viewportsTall: m.viewportsTall, h1: m.roles.h1, body: m.roles.body, typeScale: m.typeScale.slice(0, 6), families: m.fontFamilies, bg: m.backgroundColors.slice(0, 4), button: m.primaryButton, sections: m.sections.slice(0, 8).map(s => [s.top, s.height, s.background, s.heading]) };`);

if (withCapture) {
  await run('capture a new site + tag it', `
const c = await refs.capture('https://www.are.na/', 'creative', 'Are.na');
await refs.image(c.id, { width: 800 });
return await refs.tag(c.id, { tier: 'B', moves: ['smoke-test'], note: 'captured by smoke test' });`);
}

await client.close();
