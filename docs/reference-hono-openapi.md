# Hono OpenAPI Starter — що можна запозичити

> Джерело: [`w3cj/hono-open-api-starter`](https://github.com/w3cj/hono-open-api-starter) (1k ⭐)
> Стек: Hono + Drizzle + Zod + OpenAPI + Scalar + Vitest — майже 1-в-1 наш

---

## Структура роутів: порівняння

### Як у starter-і

```
src/
├── app.ts              # Hono app + OpenAPI конфіг
├── index.ts            # Точка входу (@hono/node-server)
├── env.ts              # Zod-валідація .env
├── db/
│   ├── index.ts        # Drizzle client
│   └── schema.ts       # Всі таблиці в одному файлі
├── routes/
│   └── tasks/
│       ├── tasks.index.ts    # Router + OpenAPI реєстрація
│       ├── tasks.routes.ts   # OpenAPI route definitions (Zod)
│       ├── tasks.handlers.ts # Hono request handlers
│       └── tasks.test.ts     # Тести цього роуту
└── lib/
    ├── configure-open-api.ts
    └── create-app.ts
```

### Як у нас

```
backend/src/
├── index.ts            # Hono app + всі middleware + всі роути (~200 рядків)
├── openapi.json        # Статичний OpenAPI (автогенерація)
├── openapiEmbedded.ts   # Вбудований OpenAPI для Swagger UI
├── routes/
│   ├── bets.ts         # Роути + хендлери + валідація — все в одному файлі
│   ├── auth.ts
│   └── ... (17 файлів)
├── services/           # Бізнес-логіка окремо ✅
└── middleware/          # Middleware окремо ✅
```

---

## Що варто запозичити

### 1. OpenAPI з Zod (не статичний JSON) 🔴 Корисно

**Зараз:** `openapi.json` генерується скриптом (`gen-openapi.cjs`) вручну. При додаванні нових роутів треба перегенеровувати.

**У starter-і:** OpenAPI генерується **автоматично** з Zod-схем через `@hono/zod-openapi`. Кожен роут сам описує свої параметри, тіло, відповіді.

```ts
// Приклад з starter-а:
import { createRoute, z } from "@hono/zod-openapi";

const listTasksRoute = createRoute({
  method: "get",
  path: "/tasks",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(taskSchema) } },
      description: "List all tasks",
    },
  },
});
```

**Вигода для нас:**

- OpenAPI **завжди** синхронізований з кодом
- Менше ручної роботи при додаванні роутів
- Scalar UI (красивіший за Swagger) замість нашого `swagger.html`

### 2. Scalar замість Swagger UI 🟡 Опціонально

Scalar — сучасніша альтернатива Swagger UI. Красивіший дизайн, темна тема, інтерактивні приклади. Інтегрується через `@scalar/hono-api-reference`.

### 3. Розділення routes / handlers 🟢 Вже частково є

У нас бізнес-логіка вже винесена в `services/`. Це добре. Але в starter-і є чітке розділення:

- `tasks.routes.ts` — тільки OpenAPI-схеми
- `tasks.handlers.ts` — тільки request/response логіка

У нас все в одному файлі (`bets.ts` = роути + валідація + виклик сервісу).

### 4. `configure-open-api.ts` / `create-app.ts` 🟡 Опціонально

У starter-і є хелпери для конфігурації OpenAPI. У нас це в `index.ts` — працює, але `index.ts` роздутий.

### 5. Тести поруч з роутами 🟢 У нас є

У starter-і тести лежать поруч з роутами (`tasks.test.ts`). У нас — `routes/*.test.ts` і `routes/*.integration.test.ts`. Теж добре.

---

## Що НЕ варто запозичувати

### 1. SQLite замість PostgreSQL

Starter використовує SQLite через `better-sqlite3`, ми — PostgreSQL 16 через Drizzle. Це не проблема — Drizzle підтримує обидва.

### 2. `@antfu/eslint-config`

У нас ESLint 9 + Prettier. Працює. Не треба міняти.

### 3. Структура з `lib/configure-open-api.ts`

У нас `index.ts` вже містить всю конфігурацію. Розносити на 3 файли без потреби — over-engineering.

---

## Рекомендація

### 🔴 P1 — Мігрувати на `@hono/zod-openapi`

**Що дасть:**

- OpenAPI генерується автоматично з кодом
- Немає потреби в `gen-openapi.cjs`
- Документація завжди актуальна

**Що зміниться:**

- Кожен роут отримає `createRoute()` з Zod-схемами
- `openapi.json` більше не потрібен (або генерується на льоту)
- Scalar UI замість Swagger UI (опціонально)

**Оцінка роботи:** ~2-3 години на міграцію 17 роутів.

### 🟡 P2 — Scalar замість Swagger UI

Візуальне покращення. Не блокує нічого.

### 🟢 P3 — Розділити routes / handlers

Вже частково є через `services/`. Не горить.

---

## Швидка перевірка: чи все в нас добре з OpenAPI зараз?

```bash
cd backend && node scripts/check-cs2-jsonld.cjs 2>/dev/null || echo 'скрипт тільки для CS2'
# Або просто:
cd backend && npx tsx src/index.ts &
sleep 2 && curl -s http://localhost:3001/api/openapi.json | head -20
```

Поточна схема (`openapi.json`) покриває 17 роутів, 60+ ендпоінтів. Працює. Але ручне оновлення — pain point.
