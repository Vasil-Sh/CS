# Node.js Best Practices — адаптовано для MatchIQ

> Джерело: [`goldbergyoni/nodebestpractices`](https://github.com/goldbergyoni/nodebestpractices) (105k ⭐, 102 правила)
> Відібрано те, що релевантно для нашого стеку: Hono + Drizzle + React + Puppeteer

---

## 1. Архітектура проєкту

### 1.1 Структуруй за бізнес-компонентами ✅ У нас вже є

У нас монорепо з `backend/src/routes/` + `backend/src/services/` + `backend/src/db/`. Це близько до «3-tier»: entry-point (routes) → domain (services) → data-access (Drizzle).

**Що можна покращити:** виділити `packages/contracts` (як у vibe/gstack) зі спільними Zod-схемами між бекендом і фронтендом. Зараз типи дублюються вручну.

### 1.2 Використовуй environment-aware конфіг з валідацією ✅ У нас є

`backend/src/utils/env.ts` робить fail-fast валідацію. Добре.

### 1.3 TypeScript — розумно, не фанатично ⚠️ Частково

Правило: використовуй прості типи. Не зловживай advanced-фічами (conditional types, template literal types). У нас є трохи over-engineered generic-ів у betting-формі. **Правило: якщо тип займає більше 3 рядків — спрости.**

---

## 2. Обробка помилок

### 2.1 Створи кастомний AppError, що extends Error ⚠️ Відсутнє

У нас помилки — або Zod-валідація (400), або голі `new Error()`. Потрібен `AppError` з полями `code`, `httpStatus`, `isOperational`:

```ts
// backend/src/utils/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
  }
}
```

### 2.2 Розрізняй operational vs programmer errors ⚠️ Відсутнє

- **Operational** (очікувані): невалідний JWT, 404, rate limit → логуй як warn, не краш
- **Programmer** (неочікувані): баг у коді → логуй як error, опціонально restart

### 2.3 Обробляй помилки централізовано ✅ У нас є

Hono `onError` middleware в `index.ts`. Добре.

### 2.4 Завжди `return await` для промісів ⚠️ Перевірити

Якщо функція повертає проміс — вона має бути `async` і робити `await` перед `return`. Інакше stack trace втрачає кадри.

### 2.5 Fail fast — валідуй аргументи ✅ У нас є

Zod валідація на всіх роутах. Добре.

---

## 3. Безпека (найважливіше)

### 3.1 Використовуй `node:` протокол для імпортів ⚠️ Частково

```ts
// ❌ import { join } from 'path';
// ✅ import { join } from 'node:path';
```

У нас в `index.ts` є `import { join } from 'node:path'` — добре. Але не скрізь.

### 3.2 Не зберігай secrets у коді ✅ У нас є

`.env` + Railway змінні. Добре.

### 3.3 Rate limiting ✅ У нас є

`rateLimiterMiddleware.ts`. Добре.

### 3.4 Лімітуй розмір payload ⚠️ Частково

`bodyLimit.ts` є, але треба перевірити чи налаштований ліміт (наприклад, 1MB для JSON).

### 3.5 Security headers через helmet ⚠️ Перевірити

`securityHeaders.ts` — OK, але чи є всі стандартні заголовки (CSP, X-Frame-Options, X-Content-Type-Options)?

### 3.6 JWT blocklist ⚠️ Відсутнє

Немає механізму відкликання JWT. Якщо токен скомпрометовано — він житиме до expiration. Потрібен Redis-based blocklist.

### 3.7 Run Node.js as non-root у Docker ✅

`docker-compose.yml` використовує `postgres:16-alpine`. Для Railway це не актуально.

---

## 4. Тестування

### 4.1 Тестуй 5 можливих outcomes (не тільки happy path) ⚠️ Частково

Для кожного тесту перевіряй:

- Response (статус, тіло)
- State change (що змінилось у БД?)
- Outgoing API call (чи викликався AI/Telegram?)
- Message in queue (якщо є)
- Observability (лог, метрика)

### 4.2 Уникай глобальних фікстур — кожен тест додає свої дані ⚠️ Перевірити

Чи є в нас тести, що залежать від попереднього стану БД?

### 4.3 Використовуй AAA-патерн (Arrange, Act, Assert) ✅

### 4.4 Рандомізуй порт у тестах ⚠️ Відсутнє

Якщо кілька тестів запускають сервер — потрібен динамічний порт (port 0).

---

## 5. Продакшен

### 5.1 Логуй у stdout, не у файл ✅

### 5.2 Не тримай стан у процесі ✅

У нас стан у PostgreSQL + Redis. Добре.

### 5.3 Використовуй LTS Node.js ⚠️ Перевірити

### 5.4 `pnpm ci` для production-білдів (аналог `npm ci`)

### 5.5 Transaction ID у кожному лозі ⚠️ Відсутнє

Потрібен `AsyncLocalStorage` для tracing. Корисно для дебагу продакшен-помилок.

---

## 6. Docker (актуально для локальної розробки)

### 6.1 Multi-stage builds

### 6.2 `.dockerignore` для secrets

### 6.3 Використовуй конкретні теги образів, не `latest`

---

## Резюме: що робити в першу чергу

| Пріоритет | Що зробити                                                   |
| --------- | ------------------------------------------------------------ |
| **P0**    | Додати `AppError` клас з operational/programmer розрізненням |
| **P0**    | Додати `node:` протокол для всіх built-in імпортів           |
| **P1**    | JWT blocklist через Redis                                    |
| **P1**    | `AsyncLocalStorage` + transaction ID у логи                  |
| **P2**    | `packages/contracts` зі спільними Zod-схемами                |
| **P2**    | Перевірити `bodyLimit` і security headers                    |
