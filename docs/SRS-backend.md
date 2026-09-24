# SRS — MatchIQ Backend

> Software Requirements Specification — серверна частина платформи MatchIQ.
> Версія документа: 1.0 · Дата: 2026-09-24 · Статус: актуально

---

## 1. Вступ

### 1.1 Призначення

Документ описує функціональні та нефункціональні вимоги до backend API-сервера MatchIQ — платформи аналітики беттінгу на CS2 і Dota 2.

### 1.2 Область дії

REST API-сервер, що забезпечує аутентифікацію, зберігання ставок/цілей/стратегій/банкролу, парсинг матчів з зовнішніх джерел, AI-рекомендації та Telegram-інтеграцію.

### 1.3 Аудиторія

- Фронтенд-застосунок MatchIQ (основний клієнт)
- Адмін-панель MatchIQ Admin
- Telegram Bot

---

## 2. Загальний опис

### 2.1 Технологічний стек

| Шар             | Технологія                                       |
| --------------- | ------------------------------------------------ |
| Runtime         | Node.js 22 + TypeScript                          |
| Framework       | Hono 4                                           |
| БД              | PostgreSQL 16                                    |
| ORM             | Drizzle ORM                                      |
| Auth            | bcrypt + JWT (access + refresh)                  |
| Валідація       | Zod                                              |
| Кешування       | In-memory + File cache (SWR)                     |
| Rate limiting   | 100 req/min per IP + 5 req/30s для парсера       |
| Circuit breaker | 3 failures → 5 хв блокування                     |
| AI              | DeepSeek Chat + Google Gemini Flash (fallback)   |
| Парсинг         | tips.gg (Puppeteer + HTTP), cstest API           |
| Документація    | OpenAPI 3.0 + Swagger UI                         |
| Тести           | Vitest (unit + інтеграційні) + k6 (навантаження) |
| Порт            | 3001                                             |

### 2.2 Архітектура (шари)

```
src/
├── index.ts          # Точка входу, middleware, роути, warmup, graceful shutdown
├── db/               # Drizzle client + schema + seed + міграції
├── middleware/       # auth, validation, logger, rateLimiter, securityHeaders, bodyLimit
├── routes/           # REST-ендпоінти (по одному файлу на домен)
├── services/         # Бізнес-логіка та парсери
└── utils/            # Спільні утиліти (env, AppError, requestContext)
```

---

## 3. Функціональні вимоги

### FR-1. Аутентифікація та авторизація

- FR-1.1 Реєстрація та логін (bcrypt + JWT).
- FR-1.2 Access token (7d) + Refresh token (30d).
- FR-1.3 Ролі: `admin` / звичайний користувач.
- FR-1.4 Admin-only ендпоінти (керування користувачами, reset даних).

### FR-2. Ставки (`/bets`)

- FR-2.1 CRUD ставок (GET/POST/PUT/PATCH/DELETE).
- FR-2.2 Пагінація (`?page=1&limit=50`).
- FR-2.3 SQL-агрегована статистика `/bets/stats` (ROI, по місяцях, по стратегіях).
- FR-2.4 Мультивалютність (UAH/USD) з курсом конвертації.

### FR-3. Цілі (`/goals`)

- FR-3.1 CRUD цілей (Amount, Ladder, ROI, Win Rate).
- FR-3.2 Зберігання прогресу (`current`) та статусу (`isCompleted`).
- FR-3.3 `isPrimary` — виділення основної цілі.

### FR-4. Банкрол (`/bankroll`)

- FR-4.1 Отримання/створення банкролу.
- FR-4.2 Корекція банкролу (`/bankroll/adjust`, ±).

### FR-5. Стратегії (`/strategies`)

- FR-5.1 CRUD стратегій.
- FR-5.2 `setPrimary` — встановлення основної стратегії (скидає інші).
- FR-5.3 Зберігання конфігурації у `config` (JSON-blob).

### FR-6. AI (`/ai`)

- FR-6.1 `/ai/recommend` — рекомендація по матчу (DeepSeek / Gemini fallback).
- FR-6.2 `/ai/advice` — порада по стану банкролу.

### FR-7. Матчі (парсинг)

- FR-7.1 CS2: cstest API + tips.gg скрапер → merge з fuzzy dedup.
- FR-7.2 Dota2: tips.gg скрапер (Puppeteer, 8-денний вікно).
- FR-7.3 Інкрементальний рефреш (120s active, idle-режим).
- FR-7.4 Full refresh кожні 4 години.
- FR-7.5 Визначення статусу матчу (upcoming/live/finished) за рахунком та часом.
- FR-7.6 Проксі логотипів (`/logo/external/*`, `/logo/local/*`).
- FR-7.7 Локальний архів логотипів (2250+ команд).

### FR-8. Telegram

- FR-8.1 Вебхук для Telegram Bot.
- FR-8.2 CRUD Telegram-груп (`/telegram-groups`).
- FR-8.3 Telegram-ставки (`/telegram-bets`).

### FR-9. Ризиковані команди (`/risky-teams`)

- FR-9.1 CRUD ризикованих команд.
- FR-9.2 Admin-only видалення.

### FR-10. Admin

- FR-10.1 `/admin/stats` — агрегована статистика для дашборду.
- FR-10.2 `/admin/reset` — видалення всіх даних користувача.

### FR-11. Публічний профіль та історія

- FR-11.1 `/public-profile` — шаринг статистики.
- FR-11.2 `/matches-history` — збереження завершених матчів.

---

## 4. API-ендпоінти

### 4.1 Публічні (без авторизації)

| Метод | Шлях                    | Опис                           |
| ----- | ----------------------- | ------------------------------ |
| GET   | `/api/health`           | Health check + статус БД       |
| GET   | `/api/docs.json`        | OpenAPI 3.0 JSON               |
| GET   | `/api/docs?key=...`     | Swagger UI (prod — за паролем) |
| POST  | `/api/auth/login`       | Логін → JWT                    |
| POST  | `/api/telegram/webhook` | Telegram вебхук                |

### 4.2 Захищені (JWT)

Всі доменні ендпоінти (`/bets`, `/goals`, `/bankroll`, `/strategies`, `/ai`, `/telegram-*`, `/match-ratings`, `/tilt-blocks`, `/user`, `/risky-teams`, `/dota2-matches`, `/cs2-matches`, `/matches-history`, `/admin*`, `/public-profile`).

> Ендпоінти доступні з префіксом `/api/v1/*` та `/api/*` (backward compat).

---

## 5. Нефункціональні вимоги

| NFR    | Вимога                                                      |
| ------ | ----------------------------------------------------------- |
| NFR-1  | Rate limiting: 100 req/min per IP                           |
| NFR-2  | Circuit breaker: 3 failures → 5 хв блокування               |
| NFR-3  | SWR-кешування матчів (file cache + in-memory)               |
| NFR-4  | Graceful shutdown (закриття пулу БД та Puppeteer)           |
| NFR-5  | Валідація вхідних даних через Zod                           |
| NFR-6  | Безпека: security headers, CSRF, CORS, body limit (1MB)     |
| NFR-7  | OpenAPI 3.0 документація                                    |
| NFR-8  | Тести: unit + інтеграційні (Vitest) + навантаження (k6)     |
| NFR-9  | Парсинг з Cloudflare-bypass (browserless/Puppeteer stealth) |
| NFR-10 | Fail-fast валідація env-змінних                             |
