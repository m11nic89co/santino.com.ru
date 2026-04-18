/**
 * Позиция .collection-cta (fixed bottom). P1.2 — ESM.
 */
export function initCollectionCtaPosition() {
  var t = document.getElementById('section-1');
  if (!t) return;
  var e,
    n = false;
  function i() {
    return window.matchMedia('(max-width:900px)').matches;
  }
  function o() {
    return t.querySelector('.collection-cta');
  }
  function r() {
    var el = o();
    if (el) {
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('left', '50%', 'important');
      el.style.setProperty('transform', 'translateX(-50%)', 'important');
      el.style.setProperty('transition', 'none', 'important');
      var bottom = i() ? 80 : 100;
      el.style.setProperty('bottom', Math.max(0, Math.round(bottom)) + 'px', 'important');
    }
  }
  function s() {
    if (!n) {
      n = true;
      requestAnimationFrame(function () {
        n = false;
        r();
      });
    }
  }
  window.addEventListener('load', s, { passive: true });
  window.addEventListener('resize', s, { passive: true });
  window.addEventListener('orientationchange', s, { passive: true });
  s();
  setTimeout(function () {
    if (typeof ResizeObserver === 'function' && o()) {
      if (e) e.disconnect();
      e = new ResizeObserver(function () {
        if (window.innerWidth <= 900 !== i()) r();
      });
      e.observe(document.documentElement);
    }
  }, 0);
}
