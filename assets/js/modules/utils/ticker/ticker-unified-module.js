class TickerModule {
  constructor() {
    this.isInitialized = false;
    this.observers = new Map();
    this.pixelsPerSecond = 30;
    this.isLowPower = this.detectLowPower();
    this.resizeRaf = 0;
    this.refreshRaf = 0;
    this.handleResize = this.handleResize.bind(this);
    this.scheduleRefresh = this.scheduleRefresh.bind(this);
  }

  detectLowPower() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowNetwork = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g');
    const weakCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return slowNetwork || weakCpu || reducedMotion;
  }

  initLazy() {
    if (this.isInitialized) return;
    const track = document.getElementById('ticker-track');
    if (!track) return;
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    const track = document.getElementById('ticker-track');
    const segment = document.getElementById('ticker-segment');
    if (!track || !segment) {
      console.warn('TickerModule: элементы основного тикера не найдены');
      return;
    }

    this.disableOtherTickerScripts();
    this.setupInfiniteLoop(track, segment);
    this.setupMainTickerAnimation(track);
    this.setupFeaturesTickersAnimation();
    this.setupPerformanceOptimizations(track);
    window.addEventListener('resize', this.handleResize, { passive: true });

    this.isInitialized = true;
  }

  // Post-consolidation defensive cleanup: historical references (P0 debt #043 cleanup)
  // These scripts should never load post-migration but defensive removal kept for safety
  disableOtherTickerScripts() {
    // Historical ticker modules (no longer exist post-consolidation):
    // - unified-ticker.js (never existed, defensive reference only)
    // - ticker-speed.js (merged into this module)
    // - ticker-normalize-heights.js (merged into this module)
    ['unified-ticker.js', 'ticker-speed.js', 'ticker-normalize-heights.js'].forEach((name) => {
      document.querySelectorAll(`script[src*="${name}"]`).forEach((el) => el.remove());
    });
  }

  setupInfiniteLoop(track, segment) {
    const original = Array.from(segment.children).map((el) => el.cloneNode(true));

    segment.innerHTML = '';
    original.forEach((el) => segment.appendChild(el.cloneNode(true)));

    const parent = track.parentElement;
    if (parent) {
      const style = getComputedStyle(segment);
      const gap = parseFloat(style.gap || style.columnGap || '0') || 0;
      let guard = 0;
      while (segment.getBoundingClientRect().width < parent.getBoundingClientRect().width + gap + 1 && guard < 30) {
        original.forEach((el) => segment.appendChild(el.cloneNode(true)));
        guard += 1;
      }
    }

    Array.from(track.querySelectorAll('.ticker-segment')).forEach((el, idx) => {
      if (idx > 0) el.remove();
    });

    track.appendChild(segment.cloneNode(true));
  }

  getPixelsPerSecond() {
    const rootValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--ticker-px-per-second')
      .trim();
    const parsedValue = Number.parseFloat(rootValue);
    return parsedValue > 0 ? parsedValue : this.pixelsPerSecond;
  }

  calculateDuration(distance) {
    const pixelsPerSecond = this.getPixelsPerSecond();
    const safeDistance = Math.max(distance, pixelsPerSecond);
    const baseDuration = safeDistance / pixelsPerSecond;
    return this.isLowPower ? baseDuration * 1.5 : baseDuration;
  }

  setupMainTickerAnimation(track) {
    const segment = track.querySelector('.ticker-segment');
    if (!segment) return;

    const effectiveDuration = this.calculateDuration(segment.getBoundingClientRect().width);
    document.documentElement.style.setProperty('--ticker-duration', `${effectiveDuration}s`);
    track.style.setProperty('--ticker-duration', `${effectiveDuration}s`);
    track.style.animation = `tickerScroll ${effectiveDuration}s linear infinite`;
    track.style.animationPlayState = 'running';
  }

  setupFeaturesTickersAnimation() {
    document.querySelectorAll('.features-ticker-track').forEach((track) => {
      const segment = track.querySelector('.features-ticker-segment');
      if (!segment) return;

      // Build a seamless loop:
      // 1) Expand the first segment so it is at least as wide as the viewport.
      // 2) Keep exactly two identical segments in the track.
      if (!track.dataset.tickerCloned) {
        const parent = track.parentElement || track.closest('.features-ticker') || track;
        const parentWidth = parent ? parent.getBoundingClientRect().width : 0;

        const originalItems = Array.from(segment.children).map((el) => el.cloneNode(true));
        if (!originalItems.length) return;

        // Reset to original items (in case markup was partially duplicated by other scripts).
        segment.innerHTML = '';
        originalItems.forEach((el) => segment.appendChild(el.cloneNode(true)));

        // Expand until the segment fully covers its viewport (avoid gaps on small item counts).
        let guard = 0;
        while (parentWidth && segment.getBoundingClientRect().width < parentWidth + 1 && guard < 40) {
          originalItems.forEach((el) => segment.appendChild(el.cloneNode(true)));
          guard += 1;
        }

        // Ensure only one segment exists before cloning it.
        Array.from(track.querySelectorAll('.features-ticker-segment')).forEach((el, idx) => {
          if (idx > 0) el.remove();
        });

        track.appendChild(segment.cloneNode(true));
        track.dataset.tickerCloned = '1';
      }

      const reverse = track.closest('.features-ticker-mobile-second');
      const animationName = reverse ? 'featuresTickerScrollReverse' : 'featuresTickerScroll';
      const duration = this.calculateDuration(segment.getBoundingClientRect().width);
      track.style.setProperty('--ticker-duration', `${duration}s`);
      track.style.animation = `${animationName} ${duration}s linear infinite`;
      track.style.animationPlayState = 'running';

      // Performance/stability hints (mobile Safari can flicker without these).
      track.style.transform = 'translateZ(0)';
      track.style.backfaceVisibility = 'hidden';
      track.style.perspective = '1000px';
      track.style.willChange = 'transform';
    });
  }

  setupPerformanceOptimizations(track) {
    track.style.transform = 'translateZ(0)';
    track.style.backfaceVisibility = 'hidden';
    track.style.perspective = '1000px';
    track.style.willChange = 'transform';
    this.setupImageOptimizations(track);
  }

  setupImageOptimizations(track) {
    track.querySelectorAll('img').forEach((img) => {
      if ('loading' in img) img.loading = 'lazy';
      if (!img.complete) {
        img.addEventListener('load', this.scheduleRefresh, { once: true });
      }
      img.addEventListener(
        'error',
        () => {
          const badge = img.closest('.logo-badge');
          if (badge) badge.classList.add('logo-missing');
          this.scheduleRefresh();
        },
        { once: true }
      );
    });
  }

  pause() {
    const mainTrack = document.getElementById('ticker-track');
    if (mainTrack) mainTrack.style.animationPlayState = 'paused';
    document.querySelectorAll('.features-ticker-track').forEach((track) => {
      track.style.animationPlayState = 'paused';
    });
  }

  resume() {
    const mainTrack = document.getElementById('ticker-track');
    if (mainTrack) mainTrack.style.animationPlayState = 'running';
    document.querySelectorAll('.features-ticker-track').forEach((track) => {
      track.style.animationPlayState = 'running';
    });
  }

  setSpeed(duration) {
    const parsedDuration = Number(duration);
    if (parsedDuration > 0) {
      this.pixelsPerSecond = parsedDuration;
    }

    const mainTrack = document.getElementById('ticker-track');
    if (mainTrack) this.setupMainTickerAnimation(mainTrack);
    this.setupFeaturesTickersAnimation();
  }

  handleResize() {
    if (!this.isInitialized) return;
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = window.requestAnimationFrame(() => {
      this.resizeRaf = 0;
      this.scheduleRefresh();
    });
  }

  scheduleRefresh() {
    if (!this.isInitialized) return;

    if (this.refreshRaf) cancelAnimationFrame(this.refreshRaf);
    this.refreshRaf = window.requestAnimationFrame(() => {
      this.refreshRaf = 0;

      const mainTrack = document.getElementById('ticker-track');
      if (mainTrack) this.setupMainTickerAnimation(mainTrack);
      this.setupFeaturesTickersAnimation();
    });
  }

  destroy() {
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    if (this.refreshRaf) cancelAnimationFrame(this.refreshRaf);
    window.removeEventListener('resize', this.handleResize);
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.isInitialized = false;
  }
}

window.TickerModule = new TickerModule();

document.addEventListener('DOMContentLoaded', () => {
  window.TickerModule.initLazy();
});

if (document.readyState !== 'loading') {
  window.TickerModule.initLazy();
}
