import http from 'node:http';
import crypto from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config, limits } from './config.mjs';
import { API_DOC } from './api-doc.mjs';
import { runInSandbox } from './sandbox.mjs';
import { createDispatcher, publicError } from './dispatch.mjs';
import { prepareLibrary, flush } from './sync.mjs';
import { closeBrowser } from './browser.mjs';
import { stats } from './library.mjs';

const windows = new Map();
function takeQuota(key, max, windowMs) {
  const now = Date.now();
  const hits = (windows.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now); windows.set(key, hits);
  return true;
}
const quota = (kind) => {
  const ok = kind === 'capture' ? takeQuota('capture', limits.capturesPerHour, 3_600_000) : takeQuota('measure', limits.measuresPerHour, 3_600_000);
  if (!ok) throw publicError(`Hourly ${kind} limit reached. Try again later.`);
};

function buildServer() {
  const server = new McpServer({ name: 'design-refs', version: '0.1.0' });

  server.registerTool('refs_api', {
    title: 'Design references: API',
    description: 'Describe the design-reference library API (screenshots of professional websites graded A/B/C, live site measurement, capture, and the design lessons memory). Call once before refs_run.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => {
    const s = await stats();
    return { content: [{ type: 'text', text: `${API_DOC}\n## Library now\n${JSON.stringify(s)}` }] };
  });

  server.registerTool('refs_run', {
    title: 'Design references: run code',
    description: 'Run JavaScript against the design-reference API in a sandbox (see refs_api). Body of an async function; return a value. Can search references, attach screenshots, measure live sites, capture new ones, and read or add design lessons.',
    inputSchema: { code: z.string().min(1).max(limits.codeMaxChars).describe('Body of an async function using refs.* and lessons.*') },
    annotations: { readOnlyHint: false, openWorldHint: true },
  }, async ({ code }) => {
    if (!takeQuota('run', limits.runsPerMinute, 60_000)) return { isError: true, content: [{ type: 'text', text: 'Rate limit reached. Try again in a minute.' }] };
    const images = [];
    const result = await runInSandbox(code, createDispatcher({ images, quota }));
    const body = result.ok ? JSON.stringify(result.value ?? null, null, 2) : result.error;
    const text = [result.logs.length ? `logs:\n${result.logs.join('\n')}` : null, result.ok ? `result:\n${body}` : `error:\n${body}`].filter(Boolean).join('\n\n');
    return { isError: !result.ok, content: [{ type: 'text', text: text.slice(0, limits.resultMaxChars) }, ...images] };
  });

  return server;
}

function authorized(req) {
  if (config.allowNoAuth) return true;
  const header = req.headers.authorization || '';
  const given = Buffer.from(header.startsWith('Bearer ') ? header.slice(7) : '');
  const expected = Buffer.from(config.token);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limits.bodyMaxBytes) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined); } catch { reject(Object.assign(new Error('bad json'), { status: 400 })); } });
    req.on('error', reject);
  });
}

const send = (res, status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };

async function startHttp() {
  if (!config.token && !config.allowNoAuth) throw new Error('MCP_TOKEN is required for HTTP mode (or ALLOW_NO_AUTH=1 for local testing only).');
  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/healthz') return send(res, 200, { status: 'ok' });
    if (url.pathname !== '/mcp') return send(res, 404, { error: 'not found' });
    if (!authorized(req)) return send(res, 401, { error: 'unauthorized' });
    if (req.method !== 'POST') return send(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
    try {
      const body = await readBody(req);
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => { transport.close(); server.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (e) {
      if (e.status) return send(res, e.status, { error: e.message });
      console.error('[http]', e);
      if (!res.headersSent) send(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
    }
  });
  await new Promise((r) => httpServer.listen(config.port, r));
  console.error(`[design-refs] listening on :${config.port}/mcp`);
  return httpServer;
}

async function main() {
  const mode = await prepareLibrary();
  console.error(`[design-refs] library ${mode} at ${config.refsDir}`);
  let httpServer = null;
  if (process.argv.includes('--stdio')) await buildServer().connect(new StdioServerTransport());
  else httpServer = await startHttp();

  const shutdown = async (sig) => {
    console.error(`[design-refs] ${sig}, shutting down`);
    httpServer?.close();
    await flush();
    await closeBrowser();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((e) => { console.error('[design-refs] fatal:', e.message); process.exit(1); });
