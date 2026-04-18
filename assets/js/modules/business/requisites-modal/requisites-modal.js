export function initRequisitesModal(context) {
  const TRIGGER_SELECTOR = '#section-3 .js-requisites-open';

  const REQUISITES_TEXT = `Полное юридическое наименование: Общество с ограниченной
ответственностью «САНТИНО.РУ»
Сокращенное наименование: ООО «САНТИНО.РУ»
Юридический адрес: 140155, Московская обл., г. Раменское, д. Турыгино, Строение 200, комн. 304
Фактический адрес: 140155, Московская обл., г. Раменское, д. Турыгино, Строение 200, комн. 304
Почтовый адрес: 140155, Московская обл., г. Раменское, д. Турыгино, Строение 200, комн. 304
ОГРН 5147746375805
ИНН 7730716791
КПП 504001001
ОКПО 40180354
ОКАТО 46648458181
ОКТМО 46248858002
ОКОПФ 12165
Р/с 40702810900070002707
Банк: Филиал «Центральный» Банка ВТБ (ПАО)
К/с 30101810145250000411
БИК 044525411
Генеральный директор -  Баннов Евгений Валерьевич
(действует на основании Устава)
Главный бухгалтер - Демьянова Елена Владимировна`;

  let modalEl = null;
  let lastFocus = null;
  let toastTimer = null;

  function ensureModal() {
    if (modalEl && document.body.contains(modalEl)) return modalEl;

    const wrap = document.createElement('div');
    wrap.className = 'requisites-modal';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = `
      <div class="requisites-modal__backdrop" data-close="1"></div>
      <div class="requisites-modal__dialog" role="dialog" aria-modal="true" aria-label="Реквизиты">
        <div class="requisites-modal__title">Реквизиты</div>
        <pre class="requisites-modal__content" id="requisites-content"></pre>
        <div class="requisites-modal__actions">
          <div class="requisites-modal__toast" aria-live="polite" aria-atomic="true"></div>
          <button type="button" class="btn ghost requisites-modal__btn" data-close="1">Закрыть</button>
          <button type="button" class="btn ghost requisites-modal__btn" data-copy="1">Скопировать</button>
        </div>
      </div>
    `;

    const pre = wrap.querySelector('#requisites-content');
    if (pre) pre.textContent = REQUISITES_TEXT;

    document.body.appendChild(wrap);
    modalEl = wrap;
    return wrap;
  }

  function showToast(text) {
    if (!modalEl) return;
    const toast = modalEl.querySelector('.requisites-modal__toast');
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.textContent = '';
      toastTimer = null;
    }, 1400);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'true');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function openModal() {
    const el = ensureModal();
    lastFocus = document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const focusTarget = el.querySelector('[data-copy="1"]') || el.querySelector('[data-close="1"]');
    if (focusTarget && focusTarget.focus) focusTarget.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKeyDown(e) {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  }

  function onClick(e) {
    const target = e.target;

    const trigger = target && target.closest ? target.closest(TRIGGER_SELECTOR) : null;
    if (trigger) {
      e.preventDefault();
      openModal();
      return;
    }

    if (!modalEl || !modalEl.classList.contains('is-open')) return;

    const closeBtn = target && target.closest ? target.closest('[data-close="1"]') : null;
    if (closeBtn) {
      e.preventDefault();
      closeModal();
      return;
    }

    const copyBtn = target && target.closest ? target.closest('[data-copy="1"]') : null;
    if (copyBtn) {
      e.preventDefault();
      void copyToClipboard(REQUISITES_TEXT).then((ok) => {
        if (ok) showToast('Скопировано');
      });
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);
  context.addCleanup(() => {
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeyDown);
    if (toastTimer) clearTimeout(toastTimer);
    if (modalEl && modalEl.remove) modalEl.remove();
    modalEl = null;
  });
}

