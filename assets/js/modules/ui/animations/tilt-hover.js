/**
 * 3D tilt при наведении на .tilt. P1.2 — ESM. Без глобалов.
 */
export function initTiltHover() {
  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduced-motion');
  if (reducedMotion) return;

  if (!window.matchMedia('(pointer: fine)').matches) return;
  function setup(el) {
    var rect;
    function updateRect() {
      rect = el.getBoundingClientRect();
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    el.addEventListener('mousemove', function (ev) {
      var x = ev.clientX - rect.left,
        y = ev.clientY - rect.top;
      var w2 = rect.width / 2,
        h2 = rect.height / 2;
      var rx = (((y - h2) / h2) * 8).toFixed(2);
      var ry = ((8 * -(x - w2)) / w2).toFixed(2);
      el.style.transform =
        'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(0)';
    });
    el.addEventListener('mouseenter', updateRect);
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
    });
  }
  function run() {
    document.querySelectorAll('.tilt').forEach(setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
