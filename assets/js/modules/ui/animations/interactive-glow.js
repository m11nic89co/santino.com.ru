/**
 * Interactive glow — enabled for each main slide.
 * Adds a lightweight overlay layer and updates its CSS variables based on pointer position.
 */
export function initInteractiveGlow(context) {
  const prefersReducedMotion = Boolean(context.env && context.env.prefersReducedMotion);
  if (prefersReducedMotion) return;

  const wrapper = document.querySelector('.main-swiper > .swiper-wrapper');
  if (!wrapper) return;

  const slides = Array.from(wrapper.children).filter((el) => el && el.classList && el.classList.contains('swiper-slide'));
  if (!slides.length) return;

  const layers = new Map();

  function ensureLayer(slide) {
    if (layers.has(slide)) return layers.get(slide);
    const layer = document.createElement('div');
    layer.className = 'interactive-glow-layer';
    slide.appendChild(layer);
    layers.set(slide, layer);
    return layer;
  }

  slides.forEach((s) => ensureLayer(s));

  let activeSlide = slides.find((s) => s.classList.contains('swiper-slide-active')) || slides[0];
  let rafId = null;
  let idleTimer = null;
  let lastPoint = { x: 0, y: 0 };

  function setIdle(idle) {
    if (activeSlide) activeSlide.classList.toggle('interactive-glow-idle', idle);
  }

  function setAlpha(alpha) {
    if (!activeSlide) return;
    activeSlide.style.setProperty('--glow-alpha', String(alpha));
  }

  function setXY(clientX, clientY) {
    if (!activeSlide) return;
    const rect = activeSlide.getBoundingClientRect();
    const x = rect.width ? (clientX - rect.left) / rect.width : 0.5;
    const y = rect.height ? (clientY - rect.top) / rect.height : 0.45;
    const xp = Math.max(0, Math.min(1, x));
    const yp = Math.max(0, Math.min(1, y));
    activeSlide.style.setProperty('--glow-x', `${(xp * 100).toFixed(2)}%`);
    activeSlide.style.setProperty('--glow-y', `${(yp * 100).toFixed(2)}%`);
  }

  function schedule(point) {
    lastPoint = point;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      setXY(lastPoint.x, lastPoint.y);
    });
  }

  function bumpIdle() {
    setIdle(false);
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => setIdle(true), 1200);
  }

  function onPointerMove(e) {
    if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
    bumpIdle();
    schedule({ x: e.clientX, y: e.clientY });
    setAlpha(1);
  }

  function onPointerLeave() {
    setAlpha(0.25);
    setIdle(true);
  }

  function onTouchMove(e) {
    const t = e && e.touches && e.touches[0];
    if (!t) return;
    bumpIdle();
    schedule({ x: t.clientX, y: t.clientY });
    setAlpha(1);
  }

  function activate(slide) {
    if (activeSlide === slide) return;
    if (activeSlide) {
      activeSlide.classList.remove('interactive-glow-active', 'interactive-glow-idle');
      activeSlide.style.removeProperty('--glow-alpha');
    }
    activeSlide = slide;
    if (activeSlide) {
      activeSlide.classList.add('interactive-glow-active');
      setAlpha(0.35);
      setIdle(true);
    }
  }

  // Initial state
  slides.forEach((s) => s.classList.add('interactive-glow'));
  activeSlide.classList.add('interactive-glow-active', 'interactive-glow-idle');
  setAlpha(0.35);

  // Global listeners; we only update the currently active slide variables.
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true });

  context.on('runtime:section-change', (e) => {
    const idx = e && e.detail ? e.detail.activeIndex : null;
    if (typeof idx !== 'number') return;
    const next = slides[idx];
    if (!next) return;
    activate(next);
  });

  context.addCleanup(() => {
    if (rafId) cancelAnimationFrame(rafId);
    if (idleTimer) clearTimeout(idleTimer);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('touchmove', onTouchMove);
    layers.forEach((layer, slide) => {
      try {
        slide.classList.remove('interactive-glow', 'interactive-glow-active', 'interactive-glow-idle');
        layer.remove();
      } catch {}
    });
    layers.clear();
  });
}

