import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';
import { limits } from './config.mjs';

const PRELUDE = `
((__host, __log) => {
const __c = (op, a) => __host(op, JSON.stringify(a === undefined ? null : a));
globalThis.refs = Object.freeze({
  search: (q) => __c('search', q),
  get: (id) => __c('get', { id }),
  image: (id, opts) => __c('image', Object.assign({ id }, opts || {})),
  moves: () => __c('moves'),
  stats: () => __c('stats'),
  tag: (id, patch) => __c('tag', Object.assign({ id }, patch || {})),
  measure: (url) => __c('measure', { url }),
  capture: (url, category, name) => __c('capture', { url, category, name }),
});
globalThis.lessons = Object.freeze({
  list: (q) => __c('lessonsList', q),
  add: (lesson) => __c('lessonsAdd', lesson),
});
globalThis.console = Object.freeze({ log: (...a) => __log(a.map((x) => typeof x === 'string' ? x : JSON.stringify(x, null, 2)).join(' ')) });
})(globalThis.__host, globalThis.__log);
delete globalThis.__host;
delete globalThis.__log;
`;

let quickjs = null;

export async function runInSandbox(code, dispatch) {
  quickjs ||= await getQuickJS();
  const runtime = quickjs.newRuntime();
  runtime.setMemoryLimit(limits.vmMemoryBytes);
  runtime.setMaxStackSize(limits.vmStackBytes);
  const deadline = Date.now() + limits.runWallMs;
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(deadline));
  const vm = runtime.newContext();
  const logs = [];
  const inflight = new Set();
  let disposed = false;

  const toVm = (value) => {
    const json = JSON.stringify(value === undefined ? null : value);
    return vm.unwrapResult(vm.evalCode(`(${json})`));
  };

  try {
    vm.newFunction('__log', (h) => {
      if (logs.length < limits.logMaxLines) logs.push(vm.getString(h).slice(0, 2000));
    }).consume((fn) => vm.setProp(vm.global, '__log', fn));

    vm.newFunction('__host', (opH, argsH) => {
      const op = vm.getString(opH);
      const args = JSON.parse(vm.getString(argsH));
      const deferred = vm.newPromise();
      const job = dispatch(op, args).then(
        (value) => { if (!disposed) { const h = toVm(value); deferred.resolve(h); h.dispose(); } },
        (err) => { if (!disposed) { const h = vm.newError(err?.publicMessage || 'Operation failed.'); deferred.reject(h); h.dispose(); } },
      ).finally(() => { inflight.delete(job); if (!disposed) runtime.executePendingJobs(); });
      inflight.add(job);
      return deferred.handle;
    }).consume((fn) => vm.setProp(vm.global, '__host', fn));

    vm.unwrapResult(vm.evalCode(PRELUDE)).dispose();

    const started = vm.evalCode(`(async () => {\n${code}\n})()`, 'user-code.js');
    if (started.error) {
      const err = vm.dump(started.error); started.error.dispose();
      return { ok: false, error: formatError(err), logs };
    }
    const settled = vm.resolvePromise(started.value);
    started.value.dispose();
    runtime.executePendingJobs();

    let timer;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve('timeout'), Math.max(0, deadline - Date.now())); });
    const outcome = await Promise.race([settled, timeout]).finally(() => clearTimeout(timer));
    if (outcome === 'timeout') return { ok: false, error: `Timed out after ${limits.runWallMs / 1000}s.`, logs };
    if (outcome.error) {
      const err = vm.dump(outcome.error); outcome.error.dispose();
      return { ok: false, error: formatError(err), logs };
    }
    const value = vm.dump(outcome.value); outcome.value.dispose();
    return { ok: true, value, logs };
  } finally {
    await Promise.allSettled([...inflight]);
    disposed = true;
    vm.dispose();
    runtime.dispose();
  }
}

function formatError(err) {
  if (err && typeof err === 'object') return `${err.name || 'Error'}: ${err.message || JSON.stringify(err)}`;
  return String(err);
}
