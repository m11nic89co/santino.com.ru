export function initHeroCtaLinks(context) {
  const CATALOG_URL = 'https://santino.market';
  const FORM_URL = 'https://santino.market/#section5e17a03b7a5c0';

  function resolveHref(text) {
    const t = (text || '').trim();
    if (t === 'Посмотреть Коллекцию 2026') return CATALOG_URL;
    return FORM_URL;
  }

  function getHeroBtn() {
    return (
      document.querySelector('#section-0 .hero-btn-container a.btn') ||
      document.querySelector('#section-0 a.btn') ||
      document.querySelector('.hero-section .hero-btn-container a.btn') ||
      null
    );
  }

  function apply() {
    const btn = getHeroBtn();
    if (!btn) return false;

    const nextHref = resolveHref(btn.textContent);
    if (btn.getAttribute('href') !== nextHref) btn.setAttribute('href', nextHref);
    return true;
  }

  function initObserver() {
    const btn = getHeroBtn();
    if (!btn) return false;

    // Initial apply
    apply();

    // Watch for text changes (legacy cycle updates textContent).
    const obs = new MutationObserver(() => apply());
    obs.observe(btn, { characterData: true, childList: true, subtree: true });
    context.addCleanup(() => obs.disconnect());
    return true;
  }

  // Legacy chain bootstraps hero effects; attach after it loads.
  context.on('legacyChainReady', () => {
    if (initObserver()) return;
    const t1 = setTimeout(initObserver, 150);
    const t2 = setTimeout(initObserver, 600);
    const t3 = setTimeout(initObserver, 1500);
    context.addCleanup(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    });
  });
}

