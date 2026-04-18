/**
 * About "stories" mode for section-4.
 * One <p> = one frame, autoplay loop. Restart on each entry into the slide.
 */
export function initAboutStory(context) {
  const section = document.getElementById('section-4');
  if (!section) return;

  const viewport = section.querySelector('.about-credits-viewport');
  const track = viewport ? viewport.querySelector('.about-credits-track') : null;
  if (!viewport || !track) return;

  const blocks = Array.from(track.querySelectorAll('.about-credits-block'));
  const firstBlock = blocks[0];
  const dupBlock = blocks[1];
  if (!firstBlock) return;

  const frames = Array.from(firstBlock.querySelectorAll('p'));
  if (!frames.length) return;

  // Mark the duplicate block so CSS can hide it in stories mode.
  if (dupBlock) dupBlock.classList.add('about-story-duplicate');

  // Ensure CSS hooks exist.
  firstBlock.classList.add('story-block');
  frames.forEach((p) => p.classList.add('about-story-frame'));

  let currentIndex = 0;
  let timerId = null;
  let lastActiveIndex = null;
  let isRunning = false;
  let awaitingClick = false;

  const prefersReducedMotion = Boolean(context.env && context.env.prefersReducedMotion);

  // Create CTA container once (always visible during stories mode).
  const ctasEl = document.createElement('div');
  ctasEl.className = 'about-story-ctas';
  ctasEl.setAttribute('aria-hidden', 'true');

  const ctaPrice = document.createElement('a');
  ctaPrice.href = 'https://santino.market/#section5e17a03b7a5c0';
  ctaPrice.target = '_blank';
  ctaPrice.rel = 'noopener noreferrer';
  ctaPrice.className = 'btn ghost';
  ctaPrice.textContent = 'Запросить прайс-лист';

  const ctaCalc = document.createElement('a');
  ctaCalc.href = 'https://santino.market/#section5e17a03b7a5c0-8';
  ctaCalc.target = '_blank';
  ctaCalc.rel = 'noopener noreferrer';
  ctaCalc.className = 'btn ghost';
  ctaCalc.textContent = 'Рассчитать выпуск собственного изделия';

  ctasEl.appendChild(ctaPrice);
  ctasEl.appendChild(ctaCalc);
  viewport.appendChild(ctasEl);

  function setCtasVisible(visible) {
    ctasEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function clearTimer() {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function setFrame(index) {
    const clamped = Math.max(0, Math.min(frames.length - 1, index));
    currentIndex = clamped;

    frames.forEach((p, i) => {
      const isActive = i === clamped;
      p.classList.toggle('is-active', isActive);
      if (isActive) p.removeAttribute('aria-hidden');
      else p.setAttribute('aria-hidden', 'true');
    });

    // CTA is visible for all frames while stories mode is active.
  }

  function getFrameDurationMs(frame) {
    const raw = frame && typeof frame.textContent === 'string' ? frame.textContent : '';
    const normalized = raw.replace(/\s+/g, ' ').trim();
    const len = normalized.length;

    // Simple duration heuristic: longer paragraph => longer display.
    // Values tuned for "one paragraph per screen".
    const ms = 2400 + len * 18;
    return Math.max(2600, Math.min(7600, Math.round(ms)));
  }

  function finishStory() {
    clearTimer();
    isRunning = false;
    awaitingClick = true;
  }

  function scheduleNext() {
    clearTimer();
    const frame = frames[currentIndex];
    const delay = getFrameDurationMs(frame);

    timerId = setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= frames.length) {
        finishStory();
        return;
      }

      setFrame(nextIndex);
      if (nextIndex === frames.length - 1) finishStory();
      else scheduleNext();
    }, delay);
  }

  function startOrRestart() {
    clearTimer();
    isRunning = true;
    awaitingClick = false;

    // Enable CSS story mode for positioning + marquee disabling.
    section.classList.add('about-story-active');
    setCtasVisible(true);

    // Reset to the first paragraph on each entry.
    setFrame(0);

    if (prefersReducedMotion) return;

    scheduleNext();
  }

  function stop() {
    clearTimer();
    isRunning = false;
    awaitingClick = false;
    section.classList.remove('about-story-active');
    setCtasVisible(false);

    // Make all frames available for reading when story is not active.
    frames.forEach((p) => {
      p.classList.remove('is-active');
      p.removeAttribute('aria-hidden');
    });
  }

  function onSectionChange(e) {
    const activeIndex = e && e.detail ? e.detail.activeIndex : null;
    const isAbout = activeIndex === 4;

    // Restart only when switching into section-4.
    if (isAbout && lastActiveIndex !== 4) {
      startOrRestart();
    } else if (!isAbout) {
      if (isRunning) stop();
    }

    lastActiveIndex = activeIndex;
  }

  context.on('runtime:section-change', onSectionChange);

  function onViewportClick(e) {
    if (!awaitingClick) return;
    if (e && e.target && e.target.closest && e.target.closest('a')) return;
    startOrRestart();
  }

  viewport.addEventListener('click', onViewportClick, { passive: true });
  context.addCleanup(() => viewport.removeEventListener('click', onViewportClick));

  // Handle the initial state (in case the page loads on section-4).
  const initialActiveIndex = context.getState && context.getState('activeSection');
  if (initialActiveIndex === 4) startOrRestart();
}

