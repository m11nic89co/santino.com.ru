/**
 * Blueprints background — "sinking blueprints" (Hero #section-0 + Contract #section-2).
 * Matryoshka: outerWrapper = parallax (x,y only); innerWrapper = timeline (scale, opacity, filter).
 * Fetches SVG, removes <rect class="bg">, caches; spawn → hold → sink.
 * Section 2 uses the same hero-* assets; pool pauses when the slide is not active.
 */
const gsap = typeof window !== 'undefined' ? window.gsap : null;

const BLUEPRINT_COUNT = 20;
const MIN_ON_SCREEN = 8;
const MAX_ON_SCREEN = 10;
const SINK_EASE = 'power2.in';
const SCALE_SINK = 0.25;
const OPACITY_MIN = 0.15;
const OPACITY_MAX = 0.3;
const PARALLAX_MAX_OFFSET = 25;
const PARALLAX_DURATION = 0.5;
const PARALLAX_EASE = 'power2.out';
const DRAW_SVG_DURATION = 1.2;
const DRAW_SVG_EASE = 'power2.inOut';

/** Cache: index -> cleaned SVG string (shared across sections) */
const svgCache = new Map();

function getBlueprintBasePath() {
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/[^/]*\.[^/]*$/, '/').replace(/\/?$/, '/');
    return origin + pathname + 'assets/img/blueprints/hero-';
  } catch {
    return 'assets/img/blueprints/hero-';
  }
}

function getBlueprintPaths() {
  const base = getBlueprintBasePath();
  return Array.from({ length: BLUEPRINT_COUNT }, (_, i) =>
    `${base}${String(i + 1).padStart(2, '0')}.svg`
  );
}

function sanitizeSvgText(rawText) {
  return rawText
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip illegal XML control chars (SVG text from network)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function cleanSvgString(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;
  const bg = svg.querySelector('rect.bg');
  if (bg) bg.remove();
  return new XMLSerializer().serializeToString(svg);
}

function getCleanedSvg(index, paths) {
  const cached = svgCache.get(index);
  if (cached) return Promise.resolve(cached);
  const url = paths[index - 1];
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
      return r.text();
    })
    .then((rawText) => {
      const sanitized = sanitizeSvgText(rawText);
      const cleaned = cleanSvgString(sanitized);
      svgCache.set(index, cleaned);
      return cleaned;
    });
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(random(min, max + 0.999));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function refillBlueprintBag(bag) {
  bag.length = 0;
  for (let i = 1; i <= BLUEPRINT_COUNT; i++) bag.push(i);
  shuffleArray(bag);
}

function getNextFromBag(ctx) {
  if (ctx.blueprintBag.length === 0) refillBlueprintBag(ctx.blueprintBag);
  return ctx.blueprintBag.pop();
}

function ensureContainer(section, containerId) {
  let container = document.getElementById(containerId);
  if (container && container.parentNode === section) return container;
  if (container && container.parentNode) {
    try {
      container.parentNode.removeChild(container);
    } catch {
      /* ignore */
    }
  }
  container = document.createElement('div');
  container.id = containerId;
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText =
    'position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;';
  const style = section.style;
  if (!style.position || style.position === 'static') section.style.position = 'relative';
  section.insertBefore(container, section.firstChild);
  return container;
}

/**
 * Parallax: mousemove on section, normalized -1..1, raf loop updates all wrappers via gsap.to(x, y).
 */
function setupParallax(section, ctx) {
  let mouseX = 0;
  let mouseY = 0;
  let rect = { left: 0, top: 0, width: 1, height: 1 };
  let rafId = null;

  function updateRect() {
    rect = section.getBoundingClientRect();
  }

  function tick() {
    rafId = null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const normX = rect.width > 0 ? (mouseX - cx) / (rect.width / 2) : 0;
    const normY = rect.height > 0 ? (mouseY - cy) / (rect.height / 2) : 0;

    ctx.parallaxWrappers.forEach((entry) => {
      if (!entry.wrapper.isConnected) return;
      const depth = entry.depthFactor;
      const targetX = normX * PARALLAX_MAX_OFFSET * depth;
      const targetY = normY * PARALLAX_MAX_OFFSET * depth;
      entry.xTo(targetX);
      entry.yTo(targetY);
    });
  }

  function onMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  function onLeave() {
    ctx.parallaxWrappers.forEach((entry) => {
      if (entry.wrapper.isConnected && entry.xTo && entry.yTo) {
        entry.xTo(0);
        entry.yTo(0);
      }
    });
  }

  section.addEventListener('mousemove', onMove, { passive: true });
  section.addEventListener('mouseleave', onLeave, { passive: true });
  window.addEventListener('resize', updateRect, { passive: true });
  updateRect();

  return function removeParallax() {
    section.removeEventListener('mousemove', onMove);
    section.removeEventListener('mouseleave', onLeave);
    window.removeEventListener('resize', updateRect);
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}

function runBlueprint(container, paths, activeSet, ctx) {
  const index = getNextFromBag(ctx);
  activeSet.add(index);

  getCleanedSvg(index, paths)
    .then((cleaned) => {
      if (!ctx.running || !container.parentNode) return;

      const isMobile = window.innerWidth <= 768;
      const depthFactor =
        gsap && gsap.utils && typeof gsap.utils.random === 'function'
          ? gsap.utils.random(0.2, 1)
          : random(0.2, 1);

      const outerWrapper = document.createElement('div');
      outerWrapper.dataset.blueprintIndex = String(index);
      outerWrapper.dataset.depth = String(depthFactor);
      outerWrapper.setAttribute('aria-hidden', 'true');
      outerWrapper.style.cssText = [
        'position:absolute;',
        'left:0;top:0;',
        'width:100%;height:100%;',
        'pointer-events:none;',
        'transform:translate(-50%,-50%);',
        'will-change:transform,opacity;',
      ].join('');

      const sizeVmin = isMobile
        ? gsap && gsap.utils && typeof gsap.utils.random === 'function'
          ? gsap.utils.random(47, 98)
          : random(47, 98)
        : gsap && gsap.utils && typeof gsap.utils.random === 'function'
          ? gsap.utils.random(29, 61)
          : random(29, 61);
      const leftPct = isMobile ? random(0, 85) : random(20, 80);
      const topPct = random(5, 95);
      outerWrapper.style.width = 'min(' + sizeVmin + 'vw,' + sizeVmin * 10 + 'px)';
      outerWrapper.style.height = 'min(' + sizeVmin + 'vh,' + sizeVmin * 10 + 'px)';
      outerWrapper.style.left = leftPct + '%';
      outerWrapper.style.top = topPct + '%';

      const innerWrapper = document.createElement('div');
      innerWrapper.style.cssText = [
        'position:absolute;',
        'inset:0;',
        'width:100%;height:100%;',
        'pointer-events:none;',
        'will-change:transform,opacity;',
      ].join('');

      innerWrapper.innerHTML = cleaned;
      const svgEl = innerWrapper.querySelector('svg');
      if (svgEl) {
        svgEl.setAttribute('width', '100%');
        svgEl.setAttribute('height', '100%');
        svgEl.style.display = 'block';
      }

      outerWrapper.appendChild(innerWrapper);
      container.appendChild(outerWrapper);
      const xTo = gsap.quickTo(outerWrapper, 'x', { duration: PARALLAX_DURATION, ease: PARALLAX_EASE });
      const yTo = gsap.quickTo(outerWrapper, 'y', { duration: PARALLAX_DURATION, ease: PARALLAX_EASE });
      ctx.parallaxWrappers.push({ wrapper: outerWrapper, depthFactor, xTo, yTo });

      const baseOpacity = random(OPACITY_MIN, OPACITY_MAX);
      const appearScaleFrom = random(0.5, 0.88);
      const holdDuration = random(3, 7);
      const sinkDelay = random(0.1, 0.5);
      const sinkDuration = random(1.5, 3);

      const strokeEls = innerWrapper.querySelectorAll('path, line, ellipse, rect, circle, polyline, polygon');
      const drawTargets = [];
      strokeEls.forEach((el) => {
        const length = el.getTotalLength ? el.getTotalLength() : 0;
        if (length > 0) {
          el.setAttribute('vector-effect', 'non-scaling-stroke');
          el.style.strokeWidth = '0.5';
          el.style.strokeDasharray = String(length);
          el.style.strokeDashoffset = String(length);
          drawTargets.push(el);
        }
      });

      gsap.set(innerWrapper, { opacity: 0, scale: appearScaleFrom });

      const appearTimeline = gsap.timeline();
      if (drawTargets.length > 0) {
        appearTimeline.to(
          drawTargets,
          {
            strokeDashoffset: 0,
            duration: DRAW_SVG_DURATION,
            ease: DRAW_SVG_EASE,
          },
          0
        );
      }
      appearTimeline.to(
        innerWrapper,
        {
          opacity: baseOpacity,
          scale: 1,
          duration: DRAW_SVG_DURATION,
          ease: 'power2.out',
          overwrite: true,
        },
        0
      );

      const sinkTimeline = gsap.delayedCall(holdDuration + sinkDelay, () => {
        if (!ctx.running) return;
        gsap.to(innerWrapper, {
          scale: SCALE_SINK,
          opacity: 0,
          duration: sinkDuration,
          ease: SINK_EASE,
          overwrite: true,
          onComplete: () => {
            const idx = ctx.parallaxWrappers.findIndex((e) => e.wrapper === outerWrapper);
            if (idx !== -1) ctx.parallaxWrappers.splice(idx, 1);
            if (outerWrapper.parentNode) outerWrapper.parentNode.removeChild(outerWrapper);
            activeSet.delete(index);
            ctx.activeCount = (ctx.activeCount || 0) - 1;
            scheduleNext(ctx);
          },
        });
      });

      ctx.cleanups.push(() => {
        sinkTimeline.kill();
        appearTimeline.kill();
        gsap.killTweensOf(innerWrapper);
        if (drawTargets.length > 0) gsap.killTweensOf(drawTargets);
        const idx = ctx.parallaxWrappers.findIndex((e) => e.wrapper === outerWrapper);
        if (idx !== -1) ctx.parallaxWrappers.splice(idx, 1);
        if (outerWrapper.parentNode) outerWrapper.parentNode.removeChild(outerWrapper);
        activeSet.delete(index);
      });
      ctx.activeCount = (ctx.activeCount || 0) + 1;
    })
    .catch((err) => {
      activeSet.delete(index);
      if (typeof console !== 'undefined') console.warn('[blueprints-bg] load failed:', err);
      scheduleNext(ctx);
    });
}

function scheduleNext(ctx) {
  if (!ctx.running || !ctx.container || !ctx.paths) return;
  if ((ctx.activeCount || 0) >= MAX_ON_SCREEN) return;
  const delay = random(0.15, 0.6);
  ctx.nextTween = gsap.delayedCall(delay, () => {
    ctx.nextTween = null;
    runBlueprint(ctx.container, ctx.paths, ctx.activeSet, ctx);
  });
}

function startPool(ctx) {
  const n = randomInt(MIN_ON_SCREEN, Math.min(MAX_ON_SCREEN, MIN_ON_SCREEN + 2));
  for (let i = 0; i < n; i++) {
    gsap.delayedCall(i * 0.2, () => {
      if (!ctx.running) return;
      runBlueprint(ctx.container, ctx.paths, ctx.activeSet, ctx);
    });
  }
  gsap.delayedCall(n * 0.2 + 0.5, () => scheduleNext(ctx));
}

function deactivateBlueprintCtx(ctx) {
  if (!ctx || !ctx.running) return;
  ctx.running = false;
  if (ctx.nextTween) {
    ctx.nextTween.kill();
    ctx.nextTween = null;
  }
  ctx.cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
  ctx.cleanups.length = 0;
  ctx.parallaxWrappers.length = 0;
  ctx.activeSet.clear();
  ctx.activeCount = 0;
  if (ctx.container) ctx.container.replaceChildren();
}

function activateBlueprintCtx(ctx) {
  if (!ctx || ctx.running) return;
  ctx.running = true;
  refillBlueprintBag(ctx.blueprintBag);
  startPool(ctx);
}

function section2SlideIndex() {
  const el = document.getElementById('section-2');
  if (!el || !el.parentElement) return 2;
  return [...el.parentElement.children].indexOf(el);
}

function bindSection2SwiperVisibility(ctx) {
  let swiperBound = false;

  function sync() {
    const sw = window.swiper;
    if (!sw || !ctx.container || !ctx.container.isConnected) return;
    const on = sw.activeIndex === section2SlideIndex();
    if (on) activateBlueprintCtx(ctx);
    else deactivateBlueprintCtx(ctx);
  }

  function tryBind() {
    if (swiperBound) return;
    if (!window.swiper || typeof window.swiper.on !== 'function') {
      requestAnimationFrame(tryBind);
      return;
    }
    swiperBound = true;
    window.swiper.on('slideChange', sync);
    sync();
  }

  document.addEventListener('legacyChainReady', tryBind, { once: true });
  tryBind();
}

/**
 * @param {unknown} context
 * @param {HTMLElement} section
 * @param {string} containerId
 * @param {{ pauseWhenSlideInactive?: boolean }} [opts]
 */
function mountBlueprintLayer(context, section, containerId, opts) {
  const paths = getBlueprintPaths();
  const container = ensureContainer(section, containerId);
  const activeSet = new Set();
  const ctx = {
    container,
    paths,
    activeSet,
    blueprintBag: [],
    running: true,
    activeCount: 0,
    nextTween: null,
    parallaxWrappers: [],
    cleanups: [],
  };

  const removeParallax = setupParallax(section, ctx);

  function cleanup() {
    ctx.running = false;
    removeParallax();
    if (ctx.nextTween) {
      ctx.nextTween.kill();
      ctx.nextTween = null;
    }
    ctx.cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
    ctx.cleanups.length = 0;
    ctx.parallaxWrappers.length = 0;
    const c = document.getElementById(containerId);
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  if (context && typeof context.addCleanup === 'function') {
    context.addCleanup(cleanup);
  }

  const start = () => {
    if (opts && opts.pauseWhenSlideInactive) {
      ctx.running = false;
      bindSection2SwiperVisibility(ctx);
    } else {
      startPool(ctx);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  return cleanup;
}

export function initBlueprintsBg(context) {
  if (!gsap) {
    if (typeof console !== 'undefined') console.warn('[blueprints-bg] GSAP not found.');
    return;
  }

  const reducedMotion =
    (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    (typeof document !== 'undefined' &&
      document.documentElement &&
      document.documentElement.classList.contains('reduced-motion'));

  if (reducedMotion) return;

  const section0 = document.getElementById('section-0');
  if (section0) {
    mountBlueprintLayer(context, section0, 'blueprints-bg-container', { pauseWhenSlideInactive: false });
  }

  const section2 = document.getElementById('section-2');
  if (section2) {
    mountBlueprintLayer(context, section2, 'blueprints-bg-section-2', { pauseWhenSlideInactive: true });
  }
}
