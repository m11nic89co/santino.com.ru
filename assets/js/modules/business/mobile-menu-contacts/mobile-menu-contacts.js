export function initMobileMenuContacts(context) {
  const PHONE = '+79685452136';
  const WA_PHONE = '+79533314229';
  const EMAIL = 'office@santino.com.ru';
  const SUBJECT = 'Сообщение с сайта santino.com.ru';

  let observer = null;
  let tapBound = false;

  function applyLinks() {
    const root = document.querySelector('.mobile-nav');
    if (!root) return false;

    let phoneLink = root.querySelector('.mobile-social .social-phone');
    let emailLink = root.querySelector('.mobile-social .social-email');
    let waLink = root.querySelector('.mobile-social .social-wa');

    // Fallback: legacy menu can rebuild markup without our classes.
    if (!phoneLink || !emailLink || !waLink) {
      const candidates = Array.from(root.querySelectorAll('.mobile-social a, .mobile-social .social-link')).filter(
        (el) => el && el.tagName
      );

      // Try to resolve by href first.
      for (const el of candidates) {
        const href = (el.getAttribute('href') || '').toLowerCase();
        if (!phoneLink && href.startsWith('tel:')) phoneLink = el;
        if (!emailLink && href.startsWith('mailto:')) emailLink = el;
        if (!waLink && (href.includes('wa.me') || href.includes('whatsapp'))) waLink = el;
      }

      // If still missing, assume conventional order: phone, email, whatsapp.
      if ((!phoneLink || !emailLink || !waLink) && candidates.length >= 3) {
        phoneLink = phoneLink || candidates[0];
        emailLink = emailLink || candidates[1];
        waLink = waLink || candidates[2];
      }
    }

    if (!phoneLink || !emailLink || !waLink) return false;

    // Normalize classes so the click handler can recognize targets reliably.
    try {
      phoneLink.classList && phoneLink.classList.add('social-link', 'social-phone');
      emailLink.classList && emailLink.classList.add('social-link', 'social-email');
      waLink.classList && waLink.classList.add('social-link', 'social-wa');
    } catch {}

    phoneLink.setAttribute('href', `tel:${PHONE}`);

    const subject = encodeURIComponent(SUBJECT);
    emailLink.setAttribute('href', `mailto:${EMAIL}?subject=${subject}`);

    const waDigits = WA_PHONE.replace(/[^0-9]/g, '');
    waLink.setAttribute('href', `https://wa.me/${waDigits}`);
    waLink.setAttribute('target', '_blank');
    waLink.setAttribute('rel', 'noopener');

    return true;
  }

  function bindTapToNavigate() {
    if (tapBound) return;
    tapBound = true;

    function closeMenuIfOpen() {
      const nav = document.querySelector('.mobile-nav');
      if (!nav || !nav.classList.contains('is-open')) return;
      const burger = document.getElementById('hamburger-menu');
      if (burger && typeof burger.click === 'function') burger.click();
    }

    function tapFx(link) {
      try {
        link.classList.add('is-tapped');
        setTimeout(() => link.classList.remove('is-tapped'), 220);
      } catch {}
    }

    document.addEventListener(
      'click',
      (e) => {
        const a = e.target && e.target.closest ? e.target.closest('.mobile-social .social-link') : null;
        if (!a) return;

        // Provide quick visual feedback and close menu first.
        tapFx(a);

        const isEmail = a.classList && a.classList.contains('social-email');
        const isPhone = a.classList && a.classList.contains('social-phone');
        const isWa = a.classList && a.classList.contains('social-wa');

        // Build targets from source-of-truth constants (do NOT trust DOM; it can be re-rendered).
        const subject = encodeURIComponent(SUBJECT);
        const waDigits = WA_PHONE.replace(/[^0-9]/g, '');
        const mailtoHref = `mailto:${EMAIL}?subject=${subject}`;
        const telHref = `tel:${PHONE}`;
        const waHref = `https://wa.me/${waDigits}`;

        if (isWa) {
          e.preventDefault();
          closeMenuIfOpen();
          a.setAttribute('href', waHref);
          window.open(waHref, '_blank', 'noopener');
          return;
        }

        if (isEmail) {
          // запуск mailto строго синхронно под пользовательский жест
          e.preventDefault();
          a.setAttribute('href', mailtoHref);
          window.location.href = mailtoHref;
          setTimeout(closeMenuIfOpen, 150);
          return;
        }

        if (isPhone) {
          e.preventDefault();
          a.setAttribute('href', telHref);
          window.location.href = telHref;
          setTimeout(closeMenuIfOpen, 150);
        }
      },
      { capture: true }
    );
  }

  function ensureObserver() {
    if (observer) return;

    observer = new MutationObserver(() => {
      // Re-apply whenever menu DOM changes (it is rebuilt by legacy script on resize too).
      applyLinks();
    });

    const target = document.body || document.documentElement;
    if (target) observer.observe(target, { childList: true, subtree: true });

    context.addCleanup(() => {
      if (observer) observer.disconnect();
      observer = null;
    });
  }

  function schedule() {
    // Try immediately; if menu isn't ready yet, observer will catch it later.
    applyLinks();
    ensureObserver();
    bindTapToNavigate();

    // Also re-apply on viewport changes (legacy rebuilds menu on resize/orientationchange).
    const onResize = () => applyLinks();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    context.addCleanup(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    });
  }

  // Legacy chain creates the mobile menu DOM. We patch after it loads.
  context.on('legacyChainReady', schedule, { target: document });

  // Also try early (in case of cached/instant legacy load).
  schedule();
}

