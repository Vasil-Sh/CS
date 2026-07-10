# MatchIQ — CS2 & Dota 2 Betting Tracker

Платформа для ведення статистики ставок, аналітики, управління банкролом та AI-рекомендацій для CS2 і Dota 2.

**Стек**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand

---

## 🚀 Можливості

### 📊 Мої ставки (`/app/my-bets`)

- **Ординарні та експрес-ставки** — з авто-розрахунком загального коефіцієнта
- **Автозаповнення з URL** — парсинг HLTV / Dota 2 посилань для команд і турніру
- **Мультивалютність** — UAH та USD з конвертацією
- **Результати з нотатками** — Win/Loss + обов'язковий коментар для програшів
- **Прив'язка до цілей** — кожна ставка може бути прив'язана до активної цілі
- **Таблиця записів** — пошук, фільтри (today/all, результат, період), сортування, пагінація
- **Шеринг ставок** — картка для соцмереж

### 💰 Банкрол

- Початковий банк → поточний банк у реальному часі
- Валідація ставок при перевищенні банку
- Експорт даних: JSON-бекап (повний) + CSV (ставки)

### 📈 Аналітика (`/app/analytics`)

- **KPI-картки**: банк, профіт, всього ставок, вінрейт, активні, виграші, програші, ROI
- **Трекер балансу** — статус банку, прогрес-бар до максимуму, поради, статистика по CS2/Dota 2
- **Графіки**: баланс у часі, місячний профіт (бари), scatter (odds vs profit), odds win rate, bet type donut
- **Фільтр по грі** (CS2/Dota2/all) — впливає на всю сторінку
- **Календарна теплокарта** — активність за 12 тижнів
- **Періоди** — порівняння тижнів/місяців
- **Предиктивна аналітика** — прогнозування трендів

### 🧮 Розумні розрахунки (сайдбар форми)

- **Value Bet** — порівняння впевненості з implied probability букмекера
- **EV (Expected Value)** — математична оцінка вигідності
- **Критерій Келлі** — оптимальна сума з кнопкою «Застосувати»
- **Ризик експресу** — помірний / підвищений / високий

### 🎯 Цілі (Goals)

- Типи: Amount, Ladder, ROI, Win Rate
- Прогрес-бари, статуси (активна / завершена / провалена)
- Автоматичне підтягування суми з останньої ставки

### 🛡️ Стратегії (Strategy)

- CRUD стратегій з 5 групами правил (OddsControl, BetTypeRules, MatchFormatRules, ActivityLimits, PsychologicalTriggers)
- Основна стратегія — автоматична перевірка при створенні ставки
- Діалог підтвердження при порушенні

### 🏆 Матчі (`/app/matches`)

- **CS2 + Dota 2** — live-дані з `api.cstest.pp.ua` + `tips.gg` (JSON-LD парсинг)
- **Перемикач гри** — CS2 / Dota 2 / Всі з кольоровими лічильниками
- **19+ матчів на день** — 14 сьогодні + 5 завтра (Dota 2), 8 CS2
- **Коефіцієнти** — реальні букмекерські з predictions-сторінок
- Картки матчів з логотипами, формами команд, tier-рейтингами, prediction bars
- Пошук, фільтри (статус, tier, формат, турнір, рівень впевненості)
- Multi-select → експрес-ставка
- AI-рекомендації на кожен матч
- **Live auto-refresh** — точкове оновлення рахунків/статусів (без повного перезавантаження)

### 🤖 AI (DeepSeek + Gemini)

- **DeepSeek Chat** / **Gemini Flash** — безкоштовний AI для прогнозів на матчі
- AIRecommendationModal з prediction, confidence, reasoning, risk level

### 🛡️ Ризиковані команди

- БАН / Нестабільні / Обережно / Рідко / Надійна
- Google Sheets імпорт (`googleSheetsRiskyTeams.ts`)
- Попередження при виборі risky team у формі

### 🔐 Auth & Admin

- Логін через JWT (backend API) — bcrypt + httpOnly cookie
- Мультикористувацькість — ізольовані дані через PostgreSQL + `UserDataService`
- Адмін-панель: управління користувачами, підписки

---

## 🛠️ Технології

| Категорія | Технологія                                                |
| --------- | --------------------------------------------------------- |
| Фреймворк | React 19 + TypeScript 5                                   |
| UI        | shadcn/ui + Tailwind CSS 3                                |
| Графіки   | Recharts 2                                                |
| Роутинг   | React Router 6                                            |
| Стан      | Zustand 4 + React Hooks                                   |
| Дані      | PostgreSQL 16 (Drizzle ORM) + API (Hono)                  |
| AI        | DeepSeek Chat API                                         |
| Збірка    | Vite 5                                                    |
| Тести     | Vitest 135 (backend) + 188 (frontend) + Playwright (E2E) |
| Шрифт     | Inter (Google Fonts), system-ui fallback |
| SEO       | react-helmet-async + JSON-LD + Sitemap + OG/Twitter Cards |

---

## 🔍 SEO

Повна SEO-оптимізація для пошукових систем та соцмереж:

- **Динамічні мета-теги** — `title`, `description`, `canonical`, `robots` через `react-helmet-async`
- **Open Graph** + **Twitter Cards** — `summary_large_image` для гарних прев'ю
- **hreflang** — мовні альтернативи `uk` / `en` / `x-default`
- **JSON-LD структуровані дані** — `WebApplication`, `Organization`, `FAQPage`, `BreadcrumbList`
- **Sitemap.xml** — з пріоритетами та hreflang
- **Семантичний HTML** — `<main>`, `<section aria-label>`, `<header>`, `<footer>`

Деталі: [`docs/seo.md`](docs/seo.md)

---

## 📦 Запуск

```bash
git clone https://github.com/Vasil-Sh/CS.git
cd mathciq
pnpm install
pnpm run dev
```

```bash
pnpm run build     # продакшен
pnpm run lint      # ESLint
pnpm run test      # unit-тести
```

---

## 📁 Структура

```
src/
├── components/
│   ├── analytics/             # BalanceTracker, графіки
│   ├── ui/                    # ~40 shadcn/ui компонентів
│   ├── CS2BettingForm.tsx     # Основна форма ставки
│   ├── BetTable.tsx           # Таблиця записів (пошук, фільтри, пагінація)
│   ├── GoalsManager.tsx       # CRUD цілей
│   ├── StrategyOverview.tsx   # CRUD стратегій
│   ├── RiskManagement.tsx     # Ризиковані команди + метрики
│   ├── MatchCard.tsx          # Картка матчу
│   ├── InitialBankModal.tsx   # Початковий банк
│   ├── SEO.tsx                # Мета-теги, OG, hreflang
│   ├── StructuredData.tsx     # JSON-LD (WebApp, FAQ, Organization)
│   └── ...
├── pages/
│   ├── Analytics.tsx          # Дашборд
│   ├── MyBets.tsx             # Ставки (форма + історія)
│   ├── Matches.tsx            # Матчі
│   ├── Strategy.tsx           # Стратегії / Цілі / Ризики
│   ├── Profile.tsx            # Профіль (експорт/імпорт)
│   ├── Admin.tsx              # Адмін-панель
│   ├── Landing.tsx            # Лендінг
│   └── Login.tsx              # Вхід
├── lib/
│   ├── api/index.ts           # apiClient, auth, CS2 API, risky teams
│   ├── services/index.ts      # BankrollService, UserDataService
│   ├── ai/index.ts            # DeepSeek AI
│   ├── analytics/index.ts     # EV, Kelly, bet math
│   ├── parsing/index.ts       # URL/express parsers
│   ├── utils/index.ts         # cn(), i18n, cardStyles, chartColors
│   ├── monitoring/index.ts    # devLogger, errorMonitor, envValidation
│   └── STRUCTURE.md           # Документація архітектури lib/
├── stores/appStore.ts         # Zustand event bus
├── hooks/
│   ├── useTheme.ts            # Темна/світла тема
│   └── ...
└── types/betting.ts           # Bet, BettingStats, команди, графіки
```

---

## � Дані (API-first)

Усі дані зберігаються через backend API (PostgreSQL). `localStorage` використовується тільки як стартовий кеш для швидкого завантаження та для UI-налаштувань (тема, мова).

| Джерело | Тип даних |
|---------|------------|
| `POST/GET /api/bets` | Ставки |
| `POST/GET /api/goals` | Цілі |
| `POST/GET /api/strategies` | Стратегії |
| `POST/GET /api/bankroll` | Банкрол |
| `POST/GET /api/risky-teams` | Ризиковані команди |
| `POST/GET /api/telegram-groups` | Telegram групи |
| `POST /api/admin/reset` | Очищення всіх даних |
| `localStorage` (auth) | `authToken`, `refreshToken`, `username`, `userRole` |
| `localStorage` (UI) | `matchiq_theme`, `matchiq_lang`, `onboarding_done` |

---

## 🌐 Маршрути

| Шлях                  | Сторінка         | Доступ     |
| --------------------- | ---------------- | ---------- |
| `/`                   | Landing          | Публічний  |
| `/login`              | Login            | Публічний  |
| `/login-digesto-demo` | LoginDigestoDemo | Публічний  |
| `/app/analytics`      | Analytics        | Захищений  |
| `/app/my-bets`        | MyBets           | Захищений  |
| `/app/strategy`       | Strategy         | Захищений  |
| `/app/matches`        | Matches          | Захищений  |
| `/app/profile`        | Profile          | Захищений  |
| `/app/admin`          | Admin            | Admin only |
| `*`                   | 404 Not Found    | Публічний  |

---

## 📝 Changelog

### v1.24 — Липень 2026

- **Dota 2 парсер**: 19 матчів/день з tips.gg (JSON-LD + curl), реальні коефіцієнти
- **Game toggle**: перемикач CS2/Dota 2/All на сторінці матчів
- **Live auto-refresh**: точкове оновлення рахунків (30s), без повного перезавантаження
- **Tournament filter + sort by odds**: фільтр по турніру, сортування за коефіцієнтами
- **Unified match types**: `matchTypes.ts` — `BaseApiMatch`, `ApiError`, `FetchResult`
- **Gemini Flash**: безкоштовний AI fallback при відсутності DeepSeek ключа
- **Backend**: circuit breaker + SWR + graceful degradation + file cache + rate limiting
- **CI/CD**: GitHub Actions щоденний тест скрейпера
- **Бета-фікси**: MapWinner → Переможець карти, ставки не губляться при перезавантаженні

### v1.23 — Липень 2026

- **Дані API-first**: усі секції (ставки, цілі, стратегії, банкрол) пишуть/читають через backend API
- **Backend**: 135 unit + інтеграційних тестів (17 файлів)
- **Route refactoring**: 5 routes → services (auth, goals, strategies, bankroll, telegramGroups)
- **API /v1**: усі routes доступні за `/api/v1/*` (backward compat з `/api/*`)
- **CI/CD**: GitHub Actions з PostgreSQL service + E2E (Playwright)
- **Dead code**: видалено `realGoogleSheets.ts` (577 рядків), `sheetsConfig.ts`, `apps-script/telegram-bot.gs`
- **lib/ restructuring**: 7 піддиректорій (api, services, ai, analytics, parsing, utils, monitoring)
- **Raw fetch → apiClient**: 4 raw fetch замінено на типізований `api` клієнт
- **Шрифт**: Inter (Google Fonts) замість system sans-serif
- **Motion tokens**: fade-in, slide-up, scale-in, card-hover анімації
- **Chart colors**: токенізована палітра для Recharts (`chartColors.ts`)
- **`vitest.config.ts`**: виключено `e2e/` та `backend/` з unit-тестів

### v1.11 — Червень 2026

- ✅ Трекер балансу: секції з сірим фоном, прогрес-бар, CS2/Dota2 картки
- ✅ Пошук у таблиці записів (по матчу, команді, грі, турніру)
- ✅ CSV-експорт ставок (Профіль)
- ✅ useTheme хук (темна/світла тема через localStorage + dark клас)
- ✅ Видалено мертвий код: BettingForm, BettingHistory, googleSheets, geminiService, openRouterService
- ✅ 404 сторінка в роутері
- ✅ Нотатки для програшів («Чому такий результат?»)
- ✅ Гра: фільтр CS2/Dota2/all в аналітиці
- ✅ Покращено Monthly Profit сортування

### v1.10 — Травень 2026

- ✅ Експорт CSV та JSON-бекап
- ✅ Нотатки після результату
- ✅ Лічильник активних ставок
- ✅ Блокування БАН-команд (попередження у формі)
- ✅ Повідомлення про результат ставки

### v1.9 — Квітень 2026

- ✅ Value Bet + Критерій Келлі
- ✅ Перероблено стратегії: групи правил, діалог порушення
- ✅ Предиктивна аналітика
- ✅ CalendarHeatmap
- ✅ Обмеження впевненості до 95% з попередженням при >90%
- ✅ Зелена палітра графіків на сторінках Analytics та PeriodComparison
- ✅ Круглі чекмарки у дропдаунах та кнопках вибору
- ✅ Повідомлення про успішне створення запису
- ✅ Покращений UI форми ставок з секціями та іконками
- ✅ Експрес з матчів — вибір кількох матчів для автоматичного створення експресу

### v2.0 — Грудень 2024

- Рефакторинг MyBets з оптимізацією продуктивності (useCallback, useMemo)
- TypeScript типізація — видалення всіх `any` типів
- Timestamp-based сортування ставок
- Виправлення деталей експрес-ставок

---

## 🤝 Контрибуція

Приватний проєкт. З питань та пропозицій звертайтесь до команди розробки.

## 📄 Ліцензія1 лип

Private — Всі права захищені.

---

**Останнє оновлення**: 10 липня 2026  
**Версія**: 1.24 (основний репозиторій) + [CS-backend](https://github.com/Vasil-Sh/CS-backend) v1.24  
**Репозиторій**: [https://github.com/Vasil-Sh/CS.git](https://github.com/Vasil-Sh/CS.git)
