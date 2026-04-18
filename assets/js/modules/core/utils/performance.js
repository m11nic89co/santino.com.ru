/**
 * Определение слабых устройств (P1.2 — ESM).
 * Добавляет класс is-low-power на body при <=4 ядрах или низком deviceMemory.
 */
export function initPerformance() {
  const cores = navigator.hardwareConcurrency;
  const memory = navigator.deviceMemory;
  const isLowPower = (cores && cores <= 4) || (memory && memory <= 4);
  if (isLowPower && document.body) {
    document.body.classList.add('is-low-power');
  }
}
