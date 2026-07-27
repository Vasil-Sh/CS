# Накопичення знань про проєкт

> Адаптовано з gstack `/learn` (Garry Tan, Y Combinator)

## Ідея

Кожна сесія з AI-асистентом має залишати після себе **корисний артефакт**: патерн, який знайшли; підводний камінь, у який наступили; архітектурне рішення, яке прийняли.

Цей файл — **живий документ**, який росте з кожною сесією. На початку нової сесії AI-асистент читає його і одразу розуміє контекст проєкту.

---

## Формат запису

Кожен learning має тип, ключ, інсайт і рівень впевненості:

```
## [YYYY-MM-DD] [type] key

**Insight:** Що саме виявили.
**Context:** В якій ситуації це сталося.
**Confidence:** N/10
**Files:** `path/to/file.ts`
```

### Типи learning-ів

| Тип             | Що означає                      | Приклад                                                  |
| --------------- | ------------------------------- | -------------------------------------------------------- |
| `pattern`       | Перевикористовуваний підхід     | «Усі API-роути використовують `validateJson` + Zod»      |
| `pitfall`       | Чого НЕ робити                  | «Не використовуй `page.evaluate()` з неперевіреним HTML» |
| `preference`    | Смак / вибір користувача        | «Використовуй українську в UI, англійську в коді»        |
| `architecture`  | Структурне рішення              | «Zustand event bus через version counters»               |
| `tool`          | Інсайт про бібліотеку/фреймворк | «Drizzle не підтримує RETURNING у SQLite»                |
| `investigation` | Результат дебагу                | «Баг був у race condition між cache write і DB read»     |

---

## Як використовувати

### На початку кожної AI-сесії:

1. Прочитай цей файл (останні 20 записів)
2. Якщо задача стосується файлів, які є в learnings — згадай релевантний патерн

### В кінці кожної AI-сесії:

1. Додай 1-2 нових learning-и, якщо були знахідки
2. НЕ логи очевидне. Тест: «чи зекономить це час у наступній сесії?»
3. Якщо файли, на які посилається learning, видалені — познач learning як `[STALE]`

### Раз на місяць:

1. Перечитай всі learning-и
2. Видали ті, що втратили актуальність
3. Знайди суперечності — два learning-и з однаковим ключем, але різними висновками

---

## Актуальні learning-и (mathciq)

### Patterns

## [2026-07-27] pattern zustand-event-bus

**Insight:** Крос-компонентна комунікація через `appStore.ts` з використанням version counters (`bankrollVersion`, `betsVersion`) замість прямого coupling між компонентами.

**Context:** Будь-яка зміна даних (нова ставка, зміна банкролу) інкрементить відповідний лічильник. Компоненти підписуються через `useAppStore(s => s.betsVersion)` і реагують на зміни.

**Confidence:** 10/10
**Files:** `src/stores/appStore.ts`

---

## [2026-07-27] pattern swr-cache

**Insight:** Stale-While-Revalidate на двох рівнях: бекенд (filesystem `.cache/` з TTL 5хв fresh / 60хв stale) + фронтенд (localStorage з фоновим re-fetch). Фронтенд повертає кешовані дані миттєво, потім оновлює.

**Context:** Використовується для live-матчів, статистики, AI-передбачень.

**Confidence:** 10/10
**Files:** `backend/src/routes/dota2Matches.ts`, `src/hooks/`

---

## [2026-07-27] pattern dual-route-mounting

**Insight:** Усі роути монтуються двічі: на `/api/v1/*` і `/api/*` для зворотної сумісності.

**Context:** `index.ts` — `app.route('/api/v1', routes)` + `app.route('/api', routes)`

**Confidence:** 10/10
**Files:** `backend/src/index.ts`

---

## [2026-07-27] pattern zod-validation

**Insight:** Усі вхідні дані на бекенді валідуються через Zod. Роути використовують `validateJson(schema)` middleware.

**Confidence:** 9/10
**Files:** `backend/src/middleware/`, `backend/src/routes/`

---

### Pitfalls

## [2026-07-27] pitfall scraper-cloudflare

**Insight:** tips.gg може повернути Cloudflare-сторінку замість HTML. Puppeteer повинен перевіряти вміст сторінки перед парсингом — не парсити сліпо.

**Context:** Скріпер tips.gg має circuit breaker (3 послідовні помилки → відкрити на 5хв). При парсингу JSON-LD потрібно перевіряти, чи це справді JSON-LD, а не Cloudflare challenge.

**Confidence:** 9/10
**Files:** `backend/src/services/tipsggScraper.ts`, `backend/src/services/circuitBreaker.ts`

---

## [2026-07-27] pitfall duplicate-parse-logic

**Insight:** У `CS2BettingForm.tsx` є дубльована логіка парсингу URL, яка також є в `matchUrlParser.ts`. Це відоме технічне відставання — не створюй третю копію парсингу.

**Context:** При додаванні нових ігрових дисциплін — використовуй `src/lib/matchUrlParser.ts`, не копіюй логіку в компоненти.

**Confidence:** 10/10
**Files:** `src/components/CS2BettingForm.tsx`, `src/lib/matchUrlParser.ts`

---

## [2026-07-27] pitfall parser-stabilization-complete

**Insight:** Стабілізація парсера завершена (v1.24.11). Не рефактори парсер без гострої потреби — він крихкий через залежність від зовнішнього HTML.

**Confidence:** 9/10
**Files:** `backend/src/services/tipsggScraper.ts`

---

### Architecture

## [2026-07-27] architecture route-service-db

**Insight:** Потік даних на бекенді: `route → validation (Zod) → auth/session guard → service → Drizzle → DTO`. Роути тонкі, бізнес-логіка в сервісах.

**Confidence:** 10/10
**Files:** `backend/src/routes/`, `backend/src/services/`, `backend/src/db/`

---

## [2026-07-27] architecture api-first

**Insight:** Усі дані йдуть через бекенд REST API. `localStorage` — тільки стартовий кеш + UI-преференції. Немає прямого доступу до БД з фронтенду.

**Confidence:** 10/10
**Files:** `backend/src/index.ts`, `src/lib/`

---

## [2026-07-27] architecture monorepo-structure

**Insight:** Монорепо з `backend/` як піддиректорією. Frontend — корінь. Окремий адмін-проєкт `mathciq-admin` у своєму репо.

**Confidence:** 10/10

---

### Tools

## [2026-07-27] tool deepseek-primary

**Insight:** Основний AI-провайдер — DeepSeek Chat. Gemini Flash — fallback. Обидва викликаються через `src/lib/aiService.ts` з retry-логікою.

**Confidence:** 8/10
**Files:** `src/lib/aiService.ts`

---

## [2026-07-27] tool cs2-clean-api

**Insight:** CS2 використовує чистий JSON API (`api.cstest.pp.ua`) — не потребує Puppeteer. Це ідеальний патерн на противагу важкому Dota 2 scraping.

**Confidence:** 10/10
**Files:** `src/lib/csApi.ts`

---

## Інструкція для AI-асистента (на початку сесії)

1. Прочитай цей файл
2. Зверни увагу на `[STALE]` позначки — ці learning-и більше не актуальні
3. Якщо поточне завдання стосується файлів у learning-ах — згадай релевантний патерн або підводний камінь
4. В кінці сесії додай нові знахідки (тільки справді корисні)

---

## [2026-07-27] tool crawlee-evaluation

**Insight:** Crawlee (apify/crawlee, 25k ⭐) оцінено для заміни поточного Puppeteer-скрапера. Вирішено НЕ мігрувати зараз — скрапер стабільний. Достатньо додати `puppeteer-extra-plugin-stealth` для анти-детекту.

**Context:** Оцінка показала, що Crawlee дає чергу URL, ротацію проксі, fingerprint randomization, retry логіку — все, що ми реалізували вручну (~600 рядків). Але скрапер стабільний після v1.24.11. Міграція виправдана при появі Cloudflare-блокувань або 3+ джерел скрапінгу.

**Confidence:** 8/10
**Files:** `backend/src/services/tipsggScraper.ts`, `backend/src/services/circuitBreaker.ts`

---

## [2026-07-27] pitfall missing-apperor

**Insight:** Відсутній кастомний `AppError` клас з полями `httpStatus`, `code`, `isOperational`. Усі помилки — голі `new Error()` або Zod-валідація.

**Context:** Рекомендація з nodebestpractices (#2.1): створити `AppError extends Error` з operational/programmer розрізненням. Це покращить обробку помилок і логування.

**Confidence:** 9/10
**Files:** `backend/src/index.ts`, `backend/src/routes/`

---

## [2026-07-27] pitfall static-openapi

**Insight:** OpenAPI схема (`openapi.json`) генерується вручну скриптом `gen-openapi.cjs`. При додаванні нових роутів треба перегенеровувати — ризик розсинхрону.

**Context:** Рекомендація з `hono-open-api-starter`: перейти на `@hono/zod-openapi` для автоматичної генерації OpenAPI з Zod-схем прямо в коді роутів.

**Confidence:** 8/10
**Files:** `backend/src/openapi.json`, `backend/scripts/gen-openapi.cjs`

---

## [2026-07-27] tool nodebestpractices-audit

**Insight:** Проведено audit за 102 правилами nodebestpractices. Виявлено прогалини: P0 — `AppError` + operational/programmer errors, P1 — JWT blocklist + transaction ID у логах, P2 — `node:` протокол для імпортів + `packages/contracts`.

**Confidence:** 10/10
**Files:** `docs/reference-nodebestpractices.md`

---

_Останнє оновлення: 2026-07-27_
