/**
 * Viewport utils (P0.4 — вынесено из core/app.js)
 * ESM (P1.2): экспорт init для бандла через Vite.
 * Обновление --vh и отступов для мобильных (safe-area, тикер).
 */
export function initViewport() {
  function setVh() {
    var vp = window.visualViewport;
    var h = vp && vp.height ? vp.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', h * 0.01 + 'px');
  }

  function setMobilePadding() {
    if (!document.body || !document.body.classList.contains('mobile-mode')) return;
    var safeBottom = 0;
    try {
      var val = getComputedStyle(document.documentElement).getPropertyValue(
        'env(safe-area-inset-bottom)'
      );
      safeBottom = parseFloat(val) || 0;
    } catch {}
    var padding = 36 + safeBottom + 6;
    document.body.style.paddingBottom = padding + 'px';
    var tickerWrap = document.querySelector('.ticker-wrap');
    if (tickerWrap) tickerWrap.style.bottom = safeBottom + 'px';
  }

  setVh();
  setMobilePadding();
  window.addEventListener('resize', setVh, { passive: true });
  window.addEventListener('orientationchange', setVh, { passive: true });
  window.addEventListener(
    'focus',
    function () {
      setTimeout(setVh, 150);
    },
    { passive: true }
  );
  window.addEventListener('resize', setMobilePadding, { passive: true });
  window.addEventListener('orientationchange', setMobilePadding, { passive: true });
  window.addEventListener(
    'focus',
    function () {
      setTimeout(setMobilePadding, 150);
    },
    { passive: true }
  );
}
