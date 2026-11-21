import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { config, limits } from './config.mjs';

const run = promisify(execFile);
const enabled = () => Boolean(config.dataRepo && config.githubToken);

function authArgs() {
  const basic = Buffer.from(`x-access-token:${config.githubToken}`).toString('base64');
  return ['-c', `http.extraHeader=Authorization: Basic ${basic}`];
}

async function git(args, opts = {}) {
  try {
    return await run('git', [...authArgs(), ...args], { cwd: config.dataDir, maxBuffer: 16 * 1024 * 1024, ...opts });
  } catch (e) {
    const err = new Error(`git ${args[0]} failed (exit ${e.code})`);
    err.stderr = String(e.stderr || '').replaceAll(config.githubToken, '***');
    throw err;
  }
}

export async function prepareLibrary() {
  const hasIndex = await fs.access(path.join(config.refsDir, 'index.json')).then(() => true, () => false);
  if (!enabled()) {
    if (!hasIndex) throw new Error(`No library at ${config.refsDir} and no DATA_REPO/GITHUB_TOKEN to fetch one.`);
    return 'local';
  }
  const isRepo = await fs.access(path.join(config.dataDir, '.git')).then(() => true, () => false);
  const remote = `https://github.com/${config.dataRepo}.git`;
  if (!isRepo) {
    await fs.mkdir(config.dataDir, { recursive: true });
    const entries = await fs.readdir(config.dataDir);
    if (entries.length) throw new Error(`DATA_DIR ${config.dataDir} is not empty and not a git checkout.`);
    await git(['clone', '--depth', '1', '--branch', config.dataBranch, remote, '.']);
    return 'cloned';
  }
  await git(['pull', '--ff-only', 'origin', config.dataBranch]);
  return 'pulled';
}

let timer = null;
let pushing = Promise.resolve();
const pendingMessages = new Set();

export function schedulePush(message) {
  if (!enabled()) return;
  pendingMessages.add(message);
  clearTimeout(timer);
  timer = setTimeout(() => { pushing = pushing.then(pushNow).catch((e) => console.error('[sync]', e.message, e.stderr || '')); }, limits.gitPushDebounceMs);
}

async function pushNow() {
  const messages = [...pendingMessages]; pendingMessages.clear();
  const [name, email] = config.gitAuthor.match(/^(.*) <(.*)>$/).slice(1);
  await git(['add', '-A']);
  const { stdout } = await git(['status', '--porcelain']);
  if (!stdout.trim()) return;
  await git(['-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '-m', messages.join('; ').slice(0, 200)]);
  try { await git(['push', 'origin', `HEAD:${config.dataBranch}`]); }
  catch {
    await git(['pull', '--rebase', 'origin', config.dataBranch]);
    await git(['push', 'origin', `HEAD:${config.dataBranch}`]);
  }
  console.error('[sync] pushed:', messages.join('; '));
}

export async function flush() {
  if (timer) { clearTimeout(timer); timer = null; if (pendingMessages.size) pushing = pushing.then(pushNow); }
  await pushing.catch((e) => console.error('[sync] final push failed', e.message));
}
