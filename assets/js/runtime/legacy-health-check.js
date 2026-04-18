/**
 * MP-05: health-check для хрупкого legacy-контура (core/swiper/section1/ticker).
 * Только предупреждения в консоль, без сайд-эффектов и падений.
 */
export function initLegacyHealthChecks(context) {
  function runChecks() {
    const checks = [
      {
        ok: () => Number.isFinite(context.getState('activeSection')),
        code: 'E_ACTIVE_SECTION_STATE_MISSING',
        message: 'runtime activeSection state не синхронизирован',
      },
      {
        ok: () => Boolean(window.startBtnCycle) && Boolean(window.stopBtnCycle),
        code: 'E_BTN_CYCLE_API_MISSING',
        message: 'API цикла кнопки hero отсутствует',
      },
      {
        ok: () =>
          Boolean(
            document.querySelector(
              '#section-1 #section1-carousel-root .mySwiper[data-initialized="true"]',
            )
          ),
        code: 'E_SECTION1_ROOT_MISSING',
        message: 'контейнер section-1 isolated swiper не найден',
      },
      {
        ok: () => Boolean(document.querySelector('.main-swiper .swiper-pagination')),
        code: 'E_MAIN_SWIPER_PAGINATION_MISSING',
        message: 'пагинация main-swiper не найдена',
      },
      {
        ok: () => Boolean(window.TickerModule),
        code: 'E_TICKER_ENGINE_MISSING',
        message: 'ticker owner (window.TickerModule) не инициализирован',
      },
    ];

    checks.forEach((check) => {
      if (!check.ok()) {
        console.warn(`[LEGACY_CONTRACT][${check.code}] ${check.message}`);
      }
    });
  }

  // Ждем инициализации defer-legacy скриптов и их внутренних таймеров.
  setTimeout(runChecks, 2500);
}
