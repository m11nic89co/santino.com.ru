/**
 * MP-11: reduced motion guard.
 * Централизованно включает режим по prefers-reduced-motion.
 */
export function initReducedMotionGuard(context) {
  if (!context.env.prefersReducedMotion) return;

  document.documentElement.classList.add('reduced-motion');
  context.emit('runtime:reduced-motion', { enabled: true });

  function pauseTickerIfReady() {
    if (window.TickerModule && typeof window.TickerModule.pause === 'function') {
      window.TickerModule.pause();
      return true;
    }
    return false;
  }

  if (!pauseTickerIfReady()) {
    const t1 = setTimeout(pauseTickerIfReady, 1200);
    const t2 = setTimeout(pauseTickerIfReady, 3500);
    context.addCleanup(() => {
      clearTimeout(t1);
      clearTimeout(t2);
    });
  }
}
