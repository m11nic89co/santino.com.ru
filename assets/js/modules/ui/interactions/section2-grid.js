/**
 * Сетка оверлея секции 2, видимость по swiper-slide-active. P1.2 — ESM. Устанавливает window.__section2Grid.
 */
export function initSection2Grid() {
  function show(el) {
    el.style.opacity = '0.18';
  }
  function hide(el) {
    el.style.opacity = '0';
  }
  function run() {
    var section = document.getElementById('section-2');
    if (!section) return;
    if (window.getComputedStyle(section).position === 'static') section.style.position = 'relative';
    var overlay = section.querySelector('.section2-grid-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'section2-grid-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText =
        'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:80;opacity:0;transition:opacity 360ms cubic-bezier(.22,.9,.24,1)';
      overlay.style.backgroundImage = [
        'repeating-linear-gradient(0deg, rgba(0,173,181,0.12) 0 1px, transparent 1px 12px)',
        'repeating-linear-gradient(90deg, rgba(0,173,181,0.11) 0 1px, transparent 1px 12px)',
        'repeating-linear-gradient(0deg, rgba(0,173,181,0.22) 0 2px, transparent 2px 60px)',
        'repeating-linear-gradient(90deg, rgba(0,173,181,0.18) 0 2px, transparent 2px 60px)',
      ].join(', ');
      overlay.style.mixBlendMode = 'screen';
      overlay.style.filter = 'contrast(115%) saturate(110%)';
      section.appendChild(overlay);
    }
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'class')
          section.classList.contains('swiper-slide-active') ? show(overlay) : hide(overlay);
      });
    }).observe(section, { attributes: true });
    if (section.classList.contains('swiper-slide-active')) show(overlay);
    window.__section2Grid = {
      grid: overlay,
      show: function () {
        show(overlay);
      },
      hide: function () {
        hide(overlay);
      },
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
