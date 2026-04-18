/**
 * Кольцевая карусель UII (3D rotate). P1.2 — ESM. Без глобалов.
 */
export function initUiiCarousel() {
  const el = document.getElementById('uii-carousel-ring');
  if (!el) return;
  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduced-motion');

  const items = Array.from(el.querySelectorAll('.uii-item'));
  const angleStep = 360 / (items.length || 1);
  let currentAngle = 0;
  let autoRotate = !reducedMotion;
  let lastTime = performance.now();
  let dragging = false;
  let dragStartX = 0;
  let dragStartAngle = 0;

  function startDrag(clientX) {
    dragging = true;
    dragStartX = clientX;
    dragStartAngle = currentAngle;
    autoRotate = false;
  }
  function onMove(clientX) {
    if (!dragging) return;
    currentAngle = (dragStartAngle + 0.25 * (clientX - dragStartX)) % 360;
    el.style.transform = `translateZ(-140px) rotateY(${currentAngle}deg)`;
  }
  function endDrag() {
    dragging = false;
    autoRotate = !reducedMotion;
  }
  function layout() {
    const radius = (function () {
      const w = el.clientWidth || window.innerWidth;
      return Math.max(180, Math.min(520, Math.floor(0.42 * w)));
    })();
    items.forEach((item, idx) => {
      const deg = idx * angleStep;
      item.style.transform = `rotateY(${deg}deg) translateZ(${radius}px)`;
    });
  }

  el.addEventListener(
    'mouseenter',
    () => {
      autoRotate = !reducedMotion;
    },
    { passive: true }
  );
  el.addEventListener(
    'mouseleave',
    () => {
      autoRotate = !reducedMotion;
    },
    { passive: true }
  );
  el.addEventListener('mousedown', (e) => startDrag(e.clientX));
  window.addEventListener('mousemove', (e) => onMove(e.clientX));
  window.addEventListener('mouseup', endDrag);
  el.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (t) startDrag(t.clientX);
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX);
    },
    { passive: true }
  );
  window.addEventListener('touchend', endDrag, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) autoRotate = !reducedMotion;
  });
  layout();
  window.addEventListener('resize', layout, { passive: true });
  el.style.transform = `translateZ(-140px) rotateY(${currentAngle}deg)`;

  function tick(now) {
    const dt = Math.min(32, now - lastTime);
    lastTime = now;
    if (autoRotate) currentAngle = (currentAngle + 0.02 * dt) % 360;
    el.style.transform = `translateZ(-140px) rotateY(${currentAngle}deg)`;
    if (!reducedMotion) requestAnimationFrame(tick);
  }
  if (!reducedMotion) requestAnimationFrame(tick);
}
