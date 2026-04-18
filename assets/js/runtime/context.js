/**
 * Runtime context (MP-04): единый контракт окружения для init(context).
 */
export function createRuntimeContext() {
  const cleanups = [];
  const state = new Map();

  function addCleanup(fn) {
    if (typeof fn === 'function') cleanups.push(fn);
  }

  function on(eventName, handler, options = {}) {
    const target = options.target || document;
    const listenerOptions = options.listenerOptions || false;
    target.addEventListener(eventName, handler, listenerOptions);
    addCleanup(() => target.removeEventListener(eventName, handler, listenerOptions));
  }

  function emit(eventName, detail = null, options = {}) {
    const target = options.target || document;
    target.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  function setState(key, value) {
    state.set(key, value);
  }

  function getState(key) {
    return state.get(key);
  }
  function cleanup() {
    while (cleanups.length) {
      const fn = cleanups.pop();
      try {
        fn();
      } catch {
        // no-op: cleanup must never break runtime shutdown
      }
    }
  }

  return {
    window,
    document,
    addCleanup,
    on,
    emit,
    cleanup,
    setState,
    getState,
    env: {
      prefersReducedMotion:
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isMobile: window.matchMedia && window.matchMedia('(max-width: 900px)').matches,
    },
  };
}
