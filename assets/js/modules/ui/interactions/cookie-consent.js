const STORAGE_KEY = 'santino_cookie_consent_v1';

export function initCookieConsent(context) {
  const { env } = context || {};
  const prefersReducedMotion = Boolean(env && env.prefersReducedMotion);

  try {
    if (window.localStorage && window.localStorage.getItem(STORAGE_KEY) === 'accepted') {
      return;
    }
  } catch {
    // localStorage может быть недоступен — в этом случае просто показываем баннер без запоминания.
  }

  let bannerEl = null;

  function createBanner() {
    if (bannerEl && document.body.contains(bannerEl)) return bannerEl;

    const el = document.createElement('section');
    el.className = 'cookie-consent-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('aria-label', 'Сообщение об использовании файлов cookie');

    el.innerHTML = `
      <div class="cookie-consent-banner__inner">
        <p class="cookie-consent-banner__text">
          Наш сайт использует файлы cookie, чтобы улучшить работу сайта, повысить его эффективность и удобство.
          Продолжая использовать сайт, вы соглашаетесь на использование файлов cookie.
        </p>
        <button type="button" class="btn ghost cookie-consent-banner__btn" data-cookie-accept>
          Понятно
        </button>
      </div>
    `;

    if (prefersReducedMotion) {
      el.classList.add('cookie-consent-banner--no-motion');
    }

    document.body.appendChild(el);
    bannerEl = el;
    return el;
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.add('cookie-consent-banner--hidden');
    const timeout = prefersReducedMotion ? 0 : 220;
    window.setTimeout(() => {
      if (bannerEl && bannerEl.parentElement) {
        bannerEl.parentElement.removeChild(bannerEl);
      }
      bannerEl = null;
    }, timeout);
  }

  function accept() {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, 'accepted');
      }
    } catch {
      // молча игнорируем — баннер просто появится снова при следующем визите.
    }
    hideBanner();
  }

  function wireEvents(el) {
    if (!el) return;
    const btn = el.querySelector('[data-cookie-accept]');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      accept();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        const el = createBanner();
        wireEvents(el);
      },
      { once: true },
    );
  } else {
    const el = createBanner();
    wireEvents(el);
  }
}

