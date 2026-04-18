/**
 * MP-06: Swiper bridge.
 * Декуплинг от прямого доступа к swiper instance: runtime events/state.
 */
export function initSwiperBridge(context) {
  function publishActiveSection(activeIndex) {
    if (!Number.isFinite(activeIndex)) return;
    const prev = context.getState('activeSection');
    if (prev === activeIndex) return;
    context.setState('activeSection', activeIndex);
    context.emit('runtime:section-change', { activeIndex });
  }

  function readFromBodyDataset() {
    const raw = document.body && document.body.dataset ? document.body.dataset.activeSection : null;
    const idx = Number.parseInt(raw || '', 10);
    if (Number.isFinite(idx)) publishActiveSection(idx);
  }

  context.on(
    'swiperSlideChange',
    (event) => {
      const idx = Number.parseInt(
        String(event && event.detail ? event.detail.activeIndex : ''),
        10
      );
      if (Number.isFinite(idx)) publishActiveSection(idx);
    },
    { target: document }
  );

  if (document.body) {
    const observer = new MutationObserver(readFromBodyDataset);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-active-section'] });
    context.addCleanup(() => observer.disconnect());
  }

  readFromBodyDataset();
}
