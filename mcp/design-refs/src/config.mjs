import path from 'node:path';
import { z } from 'zod';

const Env = z.object({
  DATA_DIR: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional(),
  MCP_TOKEN: z.string().min(24).optional(),
  ALLOW_NO_AUTH: z.enum(['0', '1']).default('0'),
  DATA_REPO: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  DATA_BRANCH: z.string().default('main'),
  GITHUB_TOKEN: z.string().min(20).optional(),
  GIT_AUTHOR: z.string().default('design-refs-bot <design-refs-bot@users.noreply.github.com>'),
  RUN_WALL_MS: z.coerce.number().int().min(1000).max(300_000).default(150_000),
});

const parsed = Env.safeParse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '')));
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  process.exit(1);
}
const env = parsed.data;

export const config = {
  dataDir: path.resolve(env.DATA_DIR),
  refsDir: path.resolve(env.DATA_DIR, 'refs'),
  lessonsFile: path.resolve(env.DATA_DIR, 'lessons.json'),
  port: env.PORT,
  token: env.MCP_TOKEN,
  allowNoAuth: env.ALLOW_NO_AUTH === '1',
  dataRepo: env.DATA_REPO,
  dataBranch: env.DATA_BRANCH,
  githubToken: env.GITHUB_TOKEN,
  gitAuthor: env.GIT_AUTHOR,
};

export const limits = {
  codeMaxChars: 20_000,
  runWallMs: env.RUN_WALL_MS,
  vmMemoryBytes: 64 * 1024 * 1024,
  vmStackBytes: 1024 * 1024,
  resultMaxChars: 24_000,
  logMaxLines: 200,
  imagesPerRun: 6,
  imageMaxSliceHeight: 6000,
  imageMaxWidth: 1600,
  imageDefaultWidth: 1000,
  fullPageDefaultSliceHeight: 2400,
  searchMaxResults: 40,
  bodyMaxBytes: 256 * 1024,
  runsPerMinute: 60,
  capturesPerHour: 30,
  measuresPerHour: 120,
  navTimeoutMs: 45_000,
  settleMs: 3_500,
  captureMaxHeight: 12_000,
  gitPushDebounceMs: 5_000,
};
