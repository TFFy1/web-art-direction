import { ZodError } from 'zod';
import * as lib from './library.mjs';
import * as web from './browser.mjs';
import { schedulePush } from './sync.mjs';
import { limits } from './config.mjs';

const OPS = {
  search: { schema: lib.schemas.search, fn: lib.search },
  get: { schema: lib.schemas.get, fn: lib.get },
  moves: { fn: lib.moves },
  stats: { fn: lib.stats },
  tag: { schema: lib.schemas.tag, fn: lib.tag, push: (a) => `tag ${a.id}` },
  lessonsList: { schema: lib.schemas.lessonsList, fn: lib.lessonsList },
  lessonsAdd: { schema: lib.schemas.lessonsAdd, fn: lib.lessonsAdd, push: () => 'lesson' },
  measure: { schema: web.schemas.measure, fn: web.measure, quota: 'measure' },
  capture: { schema: web.schemas.capture, fn: web.capture, quota: 'capture', push: (a) => `capture ${a.url}` },
};

export function createDispatcher({ images, quota }) {
  return async function dispatch(op, rawArgs) {
    const entry = OPS[op] || (op === 'image' ? { schema: lib.schemas.image } : null);
    if (!entry) throw publicError(`Unknown operation "${op}".`);
    let args;
    try { args = entry.schema ? entry.schema.parse(rawArgs ?? undefined) : undefined; }
    catch (e) {
      if (e instanceof ZodError) throw publicError(`Invalid arguments for ${op}: ${e.issues.map((i) => `${i.path.join('.') || 'value'} ${i.message}`).join('; ')}`);
      throw e;
    }
    try {
      if (op === 'image') {
        if (images.length >= limits.imagesPerRun) throw publicError(`At most ${limits.imagesPerRun} images per run.`);
        const img = await lib.image(args);
        images.push({ type: 'image', data: img.data, mimeType: img.mimeType });
        return img.info;
      }
      if (entry.quota) quota(entry.quota);
      const result = await entry.fn(args);
      if (entry.push) schedulePush(entry.push(args));
      return result;
    } catch (e) {
      if (e.publicMessage) throw e;
      if (e instanceof lib.UserError) throw publicError(e.message);
      console.error(`[op:${op}]`, e);
      throw publicError(`${op} failed.`);
    }
  };
}

export function publicError(message) {
  const e = new Error(message);
  e.publicMessage = message;
  return e;
}
