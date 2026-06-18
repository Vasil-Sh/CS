# 🧪 MatchIQ — Unit-тести

```
src/test/
├── setup.ts              # Глобальний setup (jest-dom матчери)
├── appStore.test.ts      # Тести zustand стору (4 тести)
└── utils.test.ts         # Тести утиліт: дати + AI сервіси (11 тестів)
```

## ⚡ Швидкий старт

```bash
pnpm test          # одноразовий прогін
pnpm test:watch    # вотч-режим
```

## 📋 Покриття

| # | Файл | Що тестується | Тестів |
|---|------|--------------|--------|
| 1 | `appStore.test.ts` | `src/stores/appStore.ts` — банкрол/стратегія лічильники | 4 |
| 2 | `utils.test.ts` | `normalizeDateStr()` (з BetTable) — парсинг дат | 5 |
| 3 | `utils.test.ts` | `buildPrompt()` (з ai/shared) — генерація AI-промпту | 2 |
| 4 | `utils.test.ts` | `parseAIResponse()` (з ai/shared) — парсинг AI-відповіді | 3 |
| 5 | `utils.test.ts` | `getMockRecommendation()` (з ai/shared) — fallback-заглушка | 1 |

**Всього: 15 тестів**

## 🔧 Як додати нові тести

1. Створити файл `src/test/імʼя.test.ts`
2. Імпортувати `describe`, `it`, `expect` з `vitest`
3. `pnpm test:watch` — автоматичний перезапуск при змінах
