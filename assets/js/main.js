/**
 * SANTINO — ESM-точка входа (P1.2, без eval).
 * MP-04: запуск через единый bootstrap lifecycle-контракт init(context).
 * Карусель и счётчики секции 1 остаются в классических defer-скриптах.
 */
import { createRuntimeContext } from './runtime/context.js';
import { createBootstrap } from './runtime/bootstrap.js';
import { initLegacyHealthChecks } from './runtime/legacy-health-check.js';
import { initSwiperBridge } from './runtime/swiper-bridge.js';
import { initReducedMotionGuard } from './runtime/reduced-motion-guard.js';
import { initLegacyChainLoader } from './runtime/legacy-chain-loader.js';

import { initViewport } from './modules/core/viewport-utils.js';
import { initPerformance } from './modules/core/utils/performance.js';
import { initUiiCarousel } from './modules/ui/carousel/uii-carousel.js';
import { initPointerCrosshair } from './modules/ui/animations/pointer-crosshair.js';
import { initInteractiveGlow } from './modules/ui/animations/interactive-glow.js';
import { initTiltHover } from './modules/ui/animations/tilt-hover.js';
import { initBlueprintsBg } from './modules/ui/animations/blueprints-bg.js';
import { initSection2Grid } from './modules/ui/interactions/section2-grid.js';
import { initCookieConsent } from './modules/ui/interactions/cookie-consent.js';
import { initCollectionCtaPosition } from './modules/business/contracts/collection-cta-position.js';
import { initAboutStory } from './modules/business/about-story/about-story-module.js';
import { initMobileMenuContacts } from './modules/business/mobile-menu-contacts/mobile-menu-contacts.js';
import { initHeroCtaLinks } from './modules/business/hero-cta-links/hero-cta-links.js';
import { initRequisitesModal } from './modules/business/requisites-modal/requisites-modal.js';
import { initLegalModal } from './modules/business/legal-modal/legal-modal.js';

const context = createRuntimeContext();

window.TickerModule = window.TickerModule || { status: 'visual_placeholder_active' };

const modules = [
  { name: 'viewport', init: initViewport },
  { name: 'reduced-motion-guard', init: initReducedMotionGuard },
  { name: 'swiper-bridge', init: initSwiperBridge },
  { name: 'legacy-chain-loader', init: initLegacyChainLoader },
  { name: 'performance', init: initPerformance },
  { name: 'uii-carousel', init: initUiiCarousel },
  { name: 'pointer-crosshair', init: initPointerCrosshair },
  { name: 'interactive-glow', init: initInteractiveGlow },
  { name: 'tilt-hover', init: initTiltHover },
  { name: 'blueprints-bg', init: initBlueprintsBg },
  { name: 'section2-grid', init: initSection2Grid },
  { name: 'cookie-consent', init: initCookieConsent },
  { name: 'collection-cta-position', init: initCollectionCtaPosition },
  { name: 'about-story', init: initAboutStory },
  { name: 'mobile-menu-contacts', init: initMobileMenuContacts },
  { name: 'hero-cta-links', init: initHeroCtaLinks },
  { name: 'requisites-modal', init: initRequisitesModal },
  { name: 'legal-modal', init: initLegalModal },
  { name: 'legacy-health-check', init: initLegacyHealthChecks },
];

const runtime = createBootstrap({ modules, context });
runtime.start();

document.addEventListener('legacyChainReady', () => {
  const ST = window.ScrollTrigger;
  if (!ST || !window.swiper || typeof window.swiper.on !== 'function') return;
  window.swiper.on('slideChangeTransitionEnd', () => {
    ST.refresh();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Bootstrapper] DOM loaded, scanning for modules...');
  const moldRevealNode = document.querySelector('[data-module="mold-reveal"]');

  if (moldRevealNode) {
    console.log('[Bootstrapper] Found mold-reveal anchor. Attempting import...');
    import('./components/mold-reveal/MoldReveal.js')
      .then((module) => {
        console.log('[Bootstrapper] Module imported successfully. Mounting...');
        const moldModule = module.default(moldRevealNode);
        console.log('[Bootstrapper] Mount complete.');

        function section2SlideIndex() {
          const el = document.getElementById('section-2');
          if (!el || !el.parentElement) return 2;
          return [...el.parentElement.children].indexOf(el);
        }

        let moldSwiperAttached = false;
        function attachMoldSwiperControl() {
          if (moldSwiperAttached) return;
          if (!window.swiper || typeof window.swiper.on !== 'function') {
            setTimeout(attachMoldSwiperControl, 50);
            return;
          }
          moldSwiperAttached = true;
          const idx = section2SlideIndex();
          window.swiper.on('slideChange', () => {
            const isSection2 = window.swiper.activeIndex === idx;
            if (isSection2) moldModule.play();
            else moldModule.pause();
          });
          if (window.swiper.activeIndex === idx) moldModule.play();
        }
        attachMoldSwiperControl();
      })
      .catch((err) => console.error('[Bootstrapper] Failed to load MoldReveal module:', err));
  } else {
    console.log('[Bootstrapper] mold-reveal anchor NOT FOUND in DOM.');
  }
});
