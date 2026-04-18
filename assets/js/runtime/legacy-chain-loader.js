/**
 * MP-12: Single app entry legacy loader.
 * Загружает критичный legacy-контур в фиксированном порядке из main.js.
 */
// Resolve base path from the page URL so paths work on any hosting prefix
// (e.g. "/" locally, "/santino-frontend/" on GitHub Pages).
const _base = (() => {
  try {
    const p = window.location.pathname;
    // Strip everything after the last "/index.html" or trailing slash
    return p.replace(/\/index\.html$/, '/').replace(/([^/])$/, '$1/');
  } catch {
    return '/';
  }
})();

const LEGACY_CHAIN = [
  'assets/js/modules/core/app.js',
  'assets/js/modules/utils/ticker/ticker-unified-module.js',
  'assets/js/modules/ui/carousel/swiper-init.js',
  'assets/js/modules/ui/carousel/section1-carousel.js',
  'assets/js/modules/business/stats/section1-stats.js',
  'assets/js/modules/business/stats/section1-stats-size.js',
].map((p) => _base + p);

let started = false;

function invokeListener(target, type, listener) {
  const event = new Event(type);
  if (typeof listener === 'function') {
    listener.call(target, event);
    return;
  }
  if (listener && typeof listener.handleEvent === 'function') {
    listener.handleEvent(event);
  }
}

function createLateEventCompatLayer() {
  const originalDocumentAddEventListener = document.addEventListener.bind(document);
  const originalWindowAddEventListener = window.addEventListener.bind(window);

  function shouldInvokeImmediately(type) {
    if (type === 'DOMContentLoaded') return document.readyState !== 'loading';
    if (type === 'load') return document.readyState === 'complete';
    return false;
  }

  document.addEventListener = function patchedDocumentAddEventListener(type, listener, options) {
    if (shouldInvokeImmediately(type)) {
      queueMicrotask(() => {
        try {
          invokeListener(document, type, listener);
        } catch (error) {
          console.error('[legacy-chain-loader] listener invocation failed:', error);
        }
      });
      return;
    }

    return originalDocumentAddEventListener(type, listener, options);
  };

  window.addEventListener = function patchedWindowAddEventListener(type, listener, options) {
    if (shouldInvokeImmediately(type)) {
      queueMicrotask(() => {
        try {
          invokeListener(window, type, listener);
        } catch (error) {
          console.error('[legacy-chain-loader] listener invocation failed:', error);
        }
      });
      return;
    }

    return originalWindowAddEventListener(type, listener, options);
  };

  return function restoreLateEventCompatLayer() {
    document.addEventListener = originalDocumentAddEventListener;
    window.addEventListener = originalWindowAddEventListener;
  };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.defer = false;

    script.addEventListener(
      'load',
      () => {
        resolve();
      },
      { once: true }
    );

    script.addEventListener(
      'error',
      () => {
        reject(new Error(`Failed to load legacy script: ${src}`));
      },
      { once: true }
    );

    document.head.appendChild(script);
  });
}

export function initLegacyChainLoader() {
  if (started) return;
  started = true;

  const restoreLateEventCompatLayer = createLateEventCompatLayer();

  (async () => {
    try {
      for (const src of LEGACY_CHAIN) {
        await loadScript(src);
      }

      document.dispatchEvent(new CustomEvent('legacyChainReady'));
    } finally {
      restoreLateEventCompatLayer();
    }
  })().catch((error) => {
    console.error('[legacy-chain-loader] bootstrap failed:', error);
  });
}
