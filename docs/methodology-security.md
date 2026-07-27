# Методологія аудиту безпеки

> Адаптовано з gstack `/cso` (Garry Tan, Y Combinator) — OWASP Top 10 + STRIDE + CI/CD security

## Філософія

**Думай як атакер, доповідай як захисник.** Головна поверхня атаки — не твій код, а залежності, CI/CD, і забуті secrets. Починай звідти.

---

## Режими аудиту

| Режим             | Коли            | Confidence gate                    |
| ----------------- | --------------- | ---------------------------------- |
| **Daily**         | Перед кожним PR | 8/10 — тільки те, у чому впевнений |
| **Comprehensive** | Раз на місяць   | 2/10 — все, що може бути проблемою |

---

## Фаза 0: Ментальна модель проєкту

Перед пошуком багів — зрозумій, що атакуєш:

```bash
# Stack detection
cat package.json | grep -E '"hono"|"drizzle"|"@hono"'
cat package.json | grep -E '"react"|"vite"'
cat backend/package.json | grep -E '"puppeteer"|"cheerio"|"ioredis"'
```

### Карта архітектури mathciq

```
Користувач → React SPA (Vercel) → Hono API (Railway) → PostgreSQL + Redis
                                        ↓
                                   Puppeteer (tips.gg)
                                   DeepSeek/Gemini (AI)
                                   Telegram Bot API
```

**Trust boundaries:**

- Фронтенд ↔ Бекенд (JWT httpOnly cookie)
- Бекенд ↔ PostgreSQL (Drizzle ORM, connection string)
- Бекенд ↔ Redis (ioredis, кеш)
- Бекенд ↔ Puppeteer (зовнішній HTML/JSON, неперевірені дані)
- Бекенд ↔ DeepSeek/Gemini (зовнішній AI-провайдер)
- Бекенд ↔ Telegram Bot API (зовнішній месенджер)

---

## Фаза 1: Attack Surface Census

### Code surface

- [ ] Скільки публічних (не-auth) ендпоінтів?
- [ ] Скільки auth-ендпоінтів?
- [ ] Скільки адмін-ендпоінтів?
- [ ] Точки прийому зовнішніх даних (webhooks, file upload, Telegram)
- [ ] WebSocket-канали

### Infrastructure surface

```bash
# CI/CD workflows
find .github/workflows -name '*.yml' -o -name '*.yaml' 2>/dev/null

# Docker
find . -maxdepth 4 -name "Dockerfile*" -o -name "docker-compose*.yml" 2>/dev/null

# Secrets
ls .env .env.* 2>/dev/null
cat .gitignore | grep -E '\.env|secret|key'
```

---

## Фаза 2: Secrets Archaeology

```bash
# Шукаємо secrets у git-історії
git log -p | grep -iE '(api_key|secret|token|password|jwt_secret)' | grep -v '\.env\.example'

# Шукаємо secrets у поточному коді
grep -r "JWT_SECRET\|API_KEY\|DATABASE_URL" --include="*.ts" --include="*.tsx" --exclude=".env*"
```

**Якщо знайдено secret у git-історії:**

1. **Revoke** — відкликати негайно
2. **Rotate** — згенерувати новий
3. **Scrub history** — `git filter-repo` або BFG
4. **Audit exposure** — коли закомічено? Коли видалено? Чи був репо публічним?

---

## Фаза 3: Dependency Supply Chain

```bash
# Перевірка залежностей на відомі CVE
pnpm audit

# Перевірка lockfile
ls pnpm-lock.yaml backend/pnpm-lock.yaml

# Сторонні скріпти
grep -r "postinstall\|preinstall" package.json backend/package.json
```

**Критичні перевірки:**

- [ ] `pnpm-lock.yaml` відстежується в git
- [ ] Немає `postinstall` скріптів у production-залежностях
- [ ] Немає невикористовуваних залежностей (`depcheck` або вручну)

---

## Фаза 4: CI/CD Pipeline Security

Для mathciq (GitHub Actions):

```bash
# Workflow-и з небезпечними тригерами
grep -r "pull_request_target" .github/workflows/

# Неприв'язані (unpinned) actions
grep -r "uses:" .github/workflows/ | grep -v "@"

# Секрети в workflow
grep -r "\$\{\{ secrets\." .github/workflows/
```

**Критичні перевірки:**

- [ ] Немає `pull_request_target` без перевірки PR-коду
- [ ] Actions прив'язані до конкретних версій (SHA або @vX.Y.Z)
- [ ] Secrets не логируются (`${{ secrets.X }}`, не `echo $X`)
- [ ] Сторонні скріпти з PR не виконуються в CI

---

## Фаза 7: LLM/AI Security (специфічно для mathciq)

mathciq використовує DeepSeek + Gemini для AI-передбачень:

- [ ] Чи є rate limiting на AI-запитах?
- [ ] Чи фільтруються вхідні дані перед відправкою в AI?
- [ ] Чи є бюджет/кап на AI-викликах?
- [ ] Чи валідується AI-відповідь перед збереженням у БД?
- [ ] Чи немає prompt injection через дані зі скрапера (tips.gg, HLTV)?

---

## Фаза 9: OWASP Top 10 (специфічно для mathciq)

### A01: Broken Access Control

- [ ] Всі API-роути перевіряють `authMiddleware`?
- [ ] Користувач бачить тільки свої ставки?
- [ ] Адмін-ендпоінти захищені role check?

### A02: Cryptographic Failures

- [ ] JWT підписується надійним алгоритмом (HS256+)?
- [ ] Паролі хешуються через bcrypt?
- [ ] Немає передачі токенів через URL?

### A03: Injection

- [ ] Drizzle використовує параметризовані запити (не сирий SQL)?
- [ ] Puppeteer `page.evaluate()` не приймає неперевірені дані?
- [ ] Немає `exec()`/`eval()` з зовнішніми даними?

### A04: Insecure Design

- [ ] Rate limiting на API?
- [ ] Circuit breaker на скрапері?
- [ ] Валідація вхідних даних через Zod?

### A05: Security Misconfiguration

- [ ] `helmet` або аналог на Hono?
- [ ] CORS налаштований (не `*`)?
- [ ] Cookie з `httpOnly`, `secure`, `sameSite`?

### A06: Vulnerable Components

- [ ] `pnpm audit` проходить без critical/high?
- [ ] Версії залежностей не заморожені на рік+

### A07: Auth Failures

- [ ] JWT має expiration?
- [ ] Refresh token реалізований?
- [ ] Сесії інвалідуються при logout?

### A08: Software & Data Integrity

- [ ] Пакети встановлюються через pnpm (не npm -g)?
- [ ] CI/CD не виконує неперевірені скріпти?

### A09: Logging & Monitoring

- [ ] Помилки логуються (не в production)?
- [ ] Чи є алерти на 500 помилки?

### A10: SSRF

- [ ] Скрапер (Puppeteer) обмежений у тому, куди може ходити?
- [ ] Fetch до зовнішніх URL валідує destination?

---

## STRIDE Threat Model (для mathciq)

| Загроза                    | Де перевірити                                 |
| -------------------------- | --------------------------------------------- |
| **Spoofing**               | JWT підробка, підробка Telegram-повідомлень   |
| **Tampering**              | Зміна чужих ставок, ін'єкція в AI-запит       |
| **Repudiation**            | Відсутність логування дій користувача         |
| **Information Disclosure** | Stack traces у відповідях API, secrets у коді |
| **Denial of Service**      | Rate limiting, circuit breaker                |
| **Elevation of Privilege** | Role escalation через JWT маніпуляцію         |

---

## Фаза 12: False Positive Filtering

### Що НЕ є вразливістю:

1. DoS / resource exhaustion (крім AI cost amplification)
2. Secrets на диску з правильними permissions
3. Race conditions без конкретного exploit path
4. Відсутність hardening — флаг тільки конкретні вразливості
5. CVE з CVSS < 4.0 без відомого exploit
6. Dockerfile.dev / Dockerfile.local (тільки production Dockerfile)
7. React XSS (React ескейпить за замовчуванням — флаг тільки `dangerouslySetInnerHTML`)
8. Клієнтський JS/TS auth — це задача сервера

### Confidence Gate

- **Daily mode:** нижче 8/10 → не показувати
- **Comprehensive mode:** нижче 2/10 → не показувати

---

## Формат фінального звіту

```
SECURITY FINDINGS
═════════════════
#   Sev    Conf   Status      Category        Finding
──  ────   ────   ──────      ────────        ───────
1   CRIT   9/10   VERIFIED    Secrets          AWS key in .env:3
2   HIGH   8/10   VERIFIED    CI/CD            Unpinned action in workflow.yml

Finding 1: [Title] — [File:Line]
  Severity: CRITICAL | HIGH | MEDIUM
  Confidence: N/10
  Category: [Secrets | Supply Chain | CI/CD | Injection | Auth | …]
  Exploit scenario: [покроковий шлях атаки]
  Impact: [що отримує атакер]
  Recommendation: [конкретний фікс]
```

---

## Важливі правила

1. **Zero noise > zero misses.** 3 реальні знахідки краще, ніж 3 + 12 теоретичних.
2. **Жодного security theater.** Не флаг теоретичні ризики без реалістичного exploit path.
3. **Confidence gate абсолютний.** Daily mode: <8/10 = не показувати.
4. **Read-only.** Ніколи не змінюй код. Тільки знахідки і рекомендації.
5. **Framework-aware.** Hono має вбудований захист від деяких атак. React ескейпить XSS. Не флаг те, що фреймворк вже захищає.

> **Disclaimer:** Це AI-асистований скан, не заміна професійному пентесту. Для продакшен-систем із платежами або PII — залучай професійну фірму.
