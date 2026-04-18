/**
 * Оверлей перекрестия курсора (desktop). P1.2 — ESM. Без глобалов.
 */
export function initPointerCrosshair() {
  var reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduced-motion');
  if (reducedMotion) return;

  var mq = window.matchMedia('(pointer: fine) and (min-width: 901px)');
  if (!mq.matches) return;
  var overlay = document.createElement('div');
  overlay.className = 'section-pointer-overlay global-pointer-overlay';
  overlay.style.cssText =
    'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:95;display:none';
  var lineH = document.createElement('div');
  lineH.className = 'section-pointer-line horz';
  var lineV = document.createElement('div');
  lineV.className = 'section-pointer-line vert';
  overlay.appendChild(lineH);
  overlay.appendChild(lineV);
  document.body.appendChild(overlay);

  function onMove(ev) {
    var x = ev.clientX,
      y = ev.clientY;
    var el = document.elementFromPoint(x, y);
    var show =
      el &&
      (el.closest('.main-swiper .swiper-slide') ||
        el.closest('.main-nav a') ||
        el.closest('.mobile-nav a') ||
        el.closest('.logo-link') ||
        el.closest('.btn') ||
        el.closest('.hamburger-menu') ||
        el.closest('.swiper-pagination') ||
        el.closest('header'));
    if (show) {
      overlay.style.display = 'block';
      lineH.style.transform = 'translateY(' + y + 'px)';
      lineV.style.transform = 'translateX(' + x + 'px)';
      overlay.classList.add('visible');
    } else {
      overlay.classList.remove('visible');
      overlay.style.display = 'none';
    }
  }
  function hide() {
    overlay.classList.remove('visible');
    overlay.style.display = 'none';
  }
  document.addEventListener('mousemove', onMove);
  window.addEventListener('blur', hide);
  window.addEventListener('mouseout', function (ev) {
    if (!ev.relatedTarget) hide();
  });
  mq.addListener(function (ev) {
    if (!ev.matches) {
      overlay.remove();
      document.removeEventListener('mousemove', onMove);
    }
  });
}
