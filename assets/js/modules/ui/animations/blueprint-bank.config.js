/**
 * Банк доступных SVG‑чертежей.
 * Пока файлы могут отсутствовать физически — это контракт по именованию.
 * Фактическое подключение в runtime будет делаться точечно после утверждения.
 */

export const HERO_BLUEPRINTS = [
  'assets/img/blueprints/hero-01.svg',
  'assets/img/blueprints/hero-02.svg',
  'assets/img/blueprints/hero-03.svg',
  'assets/img/blueprints/hero-04.svg',
  'assets/img/blueprints/hero-05.svg',
  'assets/img/blueprints/hero-06.svg',
  'assets/img/blueprints/hero-07.svg',
  'assets/img/blueprints/hero-08.svg',
  'assets/img/blueprints/hero-09.svg',
  'assets/img/blueprints/hero-10.svg',
  'assets/img/blueprints/hero-11.svg',
  'assets/img/blueprints/hero-12.svg',
  'assets/img/blueprints/hero-13.svg',
  'assets/img/blueprints/hero-14.svg',
  'assets/img/blueprints/hero-15.svg',
  'assets/img/blueprints/hero-16.svg',
  'assets/img/blueprints/hero-17.svg',
  'assets/img/blueprints/hero-18.svg',
  'assets/img/blueprints/hero-19.svg',
  'assets/img/blueprints/hero-20.svg',
];

export const CONTRACT_BLUEPRINTS = [
  'assets/img/blueprints/contract-01.svg',
  'assets/img/blueprints/contract-02.svg',
  'assets/img/blueprints/contract-03.svg',
  'assets/img/blueprints/contract-04.svg',
  'assets/img/blueprints/contract-05.svg',
  'assets/img/blueprints/contract-06.svg',
];

export const GENERIC_BLUEPRINTS = [
  'assets/img/blueprints/generic-01.svg',
  'assets/img/blueprints/generic-02.svg',
  'assets/img/blueprints/generic-03.svg',
  'assets/img/blueprints/generic-04.svg',
  'assets/img/blueprints/generic-05.svg',
  'assets/img/blueprints/generic-06.svg',
];

/**
 * Утилита для выборки чертежа.
 * Сейчас не используется в runtime — будет задействована после того,
 * как SVG‑банк будет отрисован и утверждён.
 */
export function pickBlueprint(list, index = 0) {
  if (!Array.isArray(list) || !list.length) return null;
  const safeIndex = ((index % list.length) + list.length) % list.length;
  return list[safeIndex];
}

