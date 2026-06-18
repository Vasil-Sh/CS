# 🧪 MatchIQ — Unit-тести

```
src/test/
├── setup.ts              # Глобальний setup (jest-dom матчери)
├── appStore.test.ts      # Тести zustand стору                        (4 тести)
├── utils.test.ts         # normalizeDateStr + AI shared               (11 тестів)
├── csApi.test.ts         # CS API утиліти                             (33 тести)
├── bankrollService.test.ts # Банкрол-розрахунки                      (8 тестів)
├── aiShared.test.ts      # parseAIResponse edge cases                 (9 тестів)
├── expressParser.test.ts # Парсинг експрес-ставок                     (7 тестів)
└── README.md             # Цей файл
```

## ⚡ Швидкий старт

```bash
pnpm test          # одноразовий прогін
pnpm test:watch    # вотч-режим (автоперезапуск при змінах)
```

## 📋 Повне покриття (72 тести)

| # | Файл | Що тестується | Тестів |
|---|------|--------------|--------|
| 1 | `appStore.test.ts` | `src/stores/appStore.ts` — банкрол/стратегія лічильники | 4 |
| 2 | `utils.test.ts` | `normalizeDateStr()` — парсинг дат | 5 |
| 3 | `utils.test.ts` | `buildPrompt()` — генерація AI-промпту | 2 |
| 4 | `utils.test.ts` | `parseAIResponse()` — парсинг AI-відповіді | 3 |
| 5 | `utils.test.ts` | `getMockRecommendation()` — fallback | 1 |
| 6 | `csApi.test.ts` | `parseMatchType()` — Bo1/Bo3/Bo5 з API | 7 |
| 7 | `csApi.test.ts` | `determineTier()` — tier1/2/3 за позиціями | 6 |
| 8 | `csApi.test.ts` | `determineFavorite()` — фаворит | 5 |
| 9 | `csApi.test.ts` | `isMatchFinished()` — статус завершення | 8 |
| 10 | `csApi.test.ts` | `getMatchStatus()` — upcoming/live/finished | 2 |
| 11 | `csApi.test.ts` | `buildHltvUrl()` — URL construction | 5 |
| 12 | `bankrollService.test.ts` | `calculateTotalProfit()` — профіт | 8 |
| 13 | `aiShared.test.ts` | `parseAIResponse()` — edge cases | 9 |
| 14 | `expressParser.test.ts` | `parseExpressEvents()` — експреси | 7 |
| **Всього** | | | **72** |

## 🔧 Як додати нові тести

1. Створити файл `src/test/імʼя.test.ts`
2. Імпортувати `describe`, `it`, `expect` з `vitest`
3. `pnpm test:watch` — автоматичний перезапуск при змінах

## 🧪 Конвенції

- Кожен `describe` має JSDoc-шапку з таблицею тестів
- Назви тестів — українською з префіксом `[N]`
- Pure functions тестуються ізольовано (без jsdom)
- `beforeEach` використовується для скидання стану
