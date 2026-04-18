/**
 * Runtime bootstrap (MP-04): lifecycle contract init(context) + optional cleanup.
 */
export function createBootstrap({ modules, context }) {
  let started = false;
  const initialized = new Set();
  const moduleCleanups = [];

  function start() {
    if (started) return;

    for (const mod of modules) {
      if (!mod || !mod.name || typeof mod.init !== 'function') continue;
      if (initialized.has(mod.name)) continue;

      const maybeCleanup = mod.init(context);
      if (typeof maybeCleanup === 'function') moduleCleanups.push(maybeCleanup);
      initialized.add(mod.name);
    }

    started = true;
  }

  function destroy() {
    while (moduleCleanups.length) {
      const fn = moduleCleanups.pop();
      try {
        fn();
      } catch {
        // no-op: best-effort cleanup
      }
    }
    context.cleanup();
    initialized.clear();
    started = false;
  }

  return {
    start,
    destroy,
    isStarted() {
      return started;
    },
    initializedModules() {
      return Array.from(initialized);
    },
  };
}
