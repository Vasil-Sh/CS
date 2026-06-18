/**
 * Unit tests: `appStore` (zustand)
 * =================================
 * Файл, що тестується: `src/stores/appStore.ts`
 *
 * ПРИЗНАЧЕННЯ СТОРУ:
 *   Замінює крихкий патерн `window.dispatchEvent('bankrollUpdated')` /
 *   `window.addEventListener('strategy-data-changed', ...)` для
 *   крос-компонентної комунікації. Усі підписники реагують на зміну
 *   версій через `useAppStore(s => s.bankrollVersion)` тощо.
 *
 *   Стор зберігає два лічильники-версії:
 *     • bankrollVersion  — інкрементується при зміні банкролу
 *     • strategyVersion  — інкрементується при зміні стратегій/цілей
 *
 *   Споживачі:
 *     • Strategy.tsx      → реагує на strategyVersion
 *     • MyBets.tsx        → реагує на bankrollVersion
 *     • Analytics.tsx     → реагує на bankrollVersion
 *
 *   Диспатчери:
 *     • GoalsManager.tsx          → bumpStrategy()
 *     • StrategyOverview.tsx      → bumpStrategy()
 *     • MyBets.tsx (handleBankModalClose) → bumpBankroll()
 *     • Analytics.tsx (handleBankModalClose) → bumpBankroll()
 *
 * ЩО ТЕСТУЄМО:
 * ┌───┬────────────────────────────────┬────────────────────────────┐
 * │ # │ Тест                           │ Що перевіряє               │
 * ├───┼────────────────────────────────┼────────────────────────────┤
 * │ 1 │ Початковий стан = 0            │ Обидві версії стартують з 0│
 * │ 2 │ bumpBankroll() +1              │ Один виклик → bankroll = 1 │
 * │ 3 │ bumpStrategy() ×2 → 2          │ Два виклики → strategy = 2 │
 * │ 4 │ Незалежність лічильників       │ bump одного не чіпає інший │
 * └───┴────────────────────────────────┴────────────────────────────┘
 *
 * ЧОМУ ЦЕ ВАЖЛИВО:
 *   - Це єдине джерело правди для крос-компонентних оновлень.
 *   - Якщо bump зламається, сторінки не перерендеряться при зміні
 *     банкролу/стратегій — користувач бачитиме застарілі дані.
 *   - `beforeEach` скидає стан між тестами → гарантує ізоляцію.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/appStore';

describe('appStore (zustand store)', () => {
  /** Скидаємо стан перед кожним тестом для чистої ізоляції */
  beforeEach(() => {
    useAppStore.setState({ bankrollVersion: 0, strategyVersion: 0 });
  });

  it('[1] початковий стан: bankrollVersion = 0, strategyVersion = 0', () => {
    expect(useAppStore.getState().bankrollVersion).toBe(0);
    expect(useAppStore.getState().strategyVersion).toBe(0);
  });

  it('[2] bumpBankroll() інкрементує bankrollVersion на 1', () => {
    useAppStore.getState().bumpBankroll();
    expect(useAppStore.getState().bankrollVersion).toBe(1);
    // strategyVersion не повинен змінитись
    expect(useAppStore.getState().strategyVersion).toBe(0);
  });

  it('[3] bumpStrategy() інкрементує strategyVersion (2 виклики → 2)', () => {
    useAppStore.getState().bumpStrategy();
    useAppStore.getState().bumpStrategy();
    expect(useAppStore.getState().strategyVersion).toBe(2);
    // bankrollVersion не повинен змінитись
    expect(useAppStore.getState().bankrollVersion).toBe(0);
  });

  it('[4] bankrollVersion і strategyVersion незалежні', () => {
    useAppStore.getState().bumpBankroll();
    useAppStore.getState().bumpStrategy();
    expect(useAppStore.getState().bankrollVersion).toBe(1);
    expect(useAppStore.getState().strategyVersion).toBe(1);
  });
});
