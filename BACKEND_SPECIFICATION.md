# 📋 Специфікація бекенду — CS2 Betting Tracker

## 🎯 Мета документу

Цей документ описує всі дані та функціональність, які зараз зберігаються в `localStorage` браузера і потребують міграції на повноцінний бекенд (сервер + база даних). Документ слугує технічним завданням для бекенд-розробника.

---

## 📊 Загальний огляд LocalStorage ключів

| # | Ключ localStorage | Опис | Пріоритет | Тип даних |
|---|-------------------|------|-----------|-----------|
| 1 | `authToken` | Токен авторизації | 🔴 Критичний | `string` |
| 2 | `userRole` | Роль користувача (admin/user) | 🔴 Критичний | `string` |
| 3 | `username` | Ім'я поточного користувача | 🔴 Критичний | `string` |
| 4 | `bettingRecords` | Записи ставок (Google Sheets mock) | 🔴 Критичний | `JSON array` |
| 5 | `cs2_betting_records` | Записи ставок CS2 (Real Google Sheets) | 🔴 Критичний | `JSON array` |
| 6 | `user_{username}_mybets_data` | Ставки конкретного користувача | 🔴 Критичний | `JSON array` |
| 7 | `user_{username}_bankroll_data` | Дані банкролу користувача | 🔴 Критичний | `JSON object` |
| 8 | `admin_risky_teams` | Список ризикових команд | 🟡 Високий | `JSON array` |
| 9 | `customStrategies` | Кастомні стратегії | 🟡 Високий | `JSON array` |
| 10 | `primaryStrategy` | ID основної стратегії | 🟡 Високий | `string` |
| 11 | `match_ratings` | Рейтинги матчів | 🟢 Середній | `JSON object` |
| 12 | `adminLocalUsers` | Локальні користувачі (адмін) | 🟡 Високий | `JSON array` |
| 13 | `adminUserEdits` | Редагування користувачів (адмін) | 🟡 Високий | `JSON object` |
| 14 | `adminDeletedUsers` | Видалені користувачі (адмін) | 🟡 Високий | `JSON array` |
| 15 | `google_sheets_api_key` | API ключ Google Sheets | 🟢 Середній | `string` |
| 16 | `ui-settings` | Налаштування інтерфейсу | 🔵 Низький | `JSON object` |
| 17 | `user_{username}_last_mybets_reset` | Дата останнього щоденного скидання | 🟢 Середній | `string` |
| 18 | `user_{username}_goals` | Цілі користувача | 🟡 Високий | `JSON array` |

---

## 🏗️ Модулі бекенду

---

### 1. 🔐 Модуль авторизації (Auth Module)

**Поточний стан:** Авторизація відбувається через Google Sheets API (таблиця "Доступи"). Токени та ролі зберігаються в localStorage.

**Що потрібно реалізувати:**

#### 1.1 Таблиця `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram VARCHAR(100),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt хеш
  role ENUM('admin', 'user') DEFAULT 'user',
  price_month DECIMAL(10,2),
  subscription_start DATE,
  subscription_end DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `POST` | `/api/auth/login` | Логін (повертає JWT токен) |
| `POST` | `/api/auth/logout` | Вихід (інвалідація токена) |
| `GET` | `/api/auth/me` | Отримати поточного користувача |
| `POST` | `/api/auth/validate` | Валідація токена + перевірка підписки |

#### 1.3 Бізнес-логіка

- **JWT токени** замість простих строк `"admin-token"` / `"user-token"`
- **Перевірка підписки** при кожному запиті (middleware)
- **Хешування паролів** (bcrypt)
- **Автоматичне блокування** при закінченні підписки
- **Refresh token** механізм для продовження сесії

#### 1.4 Міграція з Google Sheets

Зараз користувачі зберігаються в Google Sheets таблиці `1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo` (лист "Доступи"). Потрібно:
1. Імпортувати всіх існуючих користувачів у БД
2. Захешувати паролі
3. Зберегти дати підписки

---

### 2. 📈 Модуль ставок (Bets Module)

**Поточний стан:** Ставки зберігаються в localStorage під ключами `bettingRecords`, `cs2_betting_records`, та `user_{username}_mybets_data`. Дані ізольовані по користувачах через `UserDataService`.

#### 2.1 Таблиця `bets`

```sql
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Основні дані матчу
  match_name VARCHAR(255) NOT NULL,       -- "NAVI vs G2"
  team1 VARCHAR(100),
  team2 VARCHAR(100),
  match_url VARCHAR(500),                 -- Посилання на матч (HLTV тощо)
  
  -- Дані ставки
  bet_type VARCHAR(100) NOT NULL,         -- "Переможець матчу", "Тотал карт", тощо
  selection VARCHAR(255),                 -- Що саме обрано
  odds DECIMAL(6,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,          -- Сума ставки
  currency VARCHAR(10) DEFAULT 'UAH',
  original_amount DECIMAL(10,2),          -- Оригінальна сума (якщо інша валюта)
  exchange_rate DECIMAL(10,4),            -- Курс обміну
  
  -- Аналіз
  win_probability DECIMAL(5,2),           -- Моя ймовірність (0-100)
  risk_level VARCHAR(50),                 -- "Низький", "Середній", "Високий"
  strategy_compliance BOOLEAN,
  reason TEXT,                            -- Причина ставки
  
  -- Результат
  result ENUM('Pending', 'Win', 'Loss') DEFAULT 'Pending',
  profit DECIMAL(10,2) DEFAULT 0,
  original_profit DECIMAL(10,2),
  roi DECIMAL(8,2) DEFAULT 0,
  
  -- Мета
  strategy_id UUID REFERENCES strategies(id),
  goal_id UUID REFERENCES goals(id),
  format VARCHAR(50),                     -- "BO1", "BO3", "BO5"
  risky_team VARCHAR(100),
  
  -- Часові мітки
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Індекси для оптимізації
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_date ON bets(date DESC);
CREATE INDEX idx_bets_result ON bets(result);
CREATE INDEX idx_bets_strategy ON bets(strategy_id);
CREATE INDEX idx_bets_goal ON bets(goal_id);
```

#### 2.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/bets` | Отримати всі ставки користувача (з пагінацією, фільтрами) |
| `GET` | `/api/bets/:id` | Отримати деталі ставки |
| `POST` | `/api/bets` | Створити нову ставку |
| `PUT` | `/api/bets/:id` | Оновити ставку (результат, коментар) |
| `DELETE` | `/api/bets/:id` | Видалити ставку |
| `GET` | `/api/bets/today` | Отримати ставки за сьогодні |
| `GET` | `/api/bets/stats` | Отримати статистику ставок |
| `POST` | `/api/bets/bulk-update` | Масове оновлення результатів |

#### 2.3 Фільтри та пагінація

```
GET /api/bets?page=1&limit=20&result=Win&strategy=conservative&dateFrom=2024-01-01&dateTo=2024-12-31&sortBy=date&order=desc
```

#### 2.4 Відповідність типів (Frontend → Backend)

```typescript
// Frontend тип Bet → Backend таблиця bets
interface Bet {
  id?: string;              // → bets.id
  match: string;            // → bets.match_name
  team1?: string;           // → bets.team1
  team2?: string;           // → bets.team2
  betType: string;          // → bets.bet_type
  odds: number;             // → bets.odds
  amount: number;           // → bets.amount
  stake?: number;           // → розрахункове поле
  date: string;             // → bets.date
  result: 'Win'|'Loss'|'Pending'; // → bets.result
  profit?: number;          // → bets.profit
  strategy?: string;        // → bets.strategy_id (зв'язок)
  format?: string;          // → bets.format
  currency?: string;        // → bets.currency
  originalAmount?: number;  // → bets.original_amount
  exchangeRate?: number;    // → bets.exchange_rate
  originalProfit?: number;  // → bets.original_profit
  roi?: number;             // → bets.roi
  goalId?: string;          // → bets.goal_id (зв'язок)
  selection?: string;       // → bets.selection
  matchUrl?: string;        // → bets.match_url
  winProbability?: number;  // → bets.win_probability
}
```

---

### 3. 💰 Модуль банкролу (Bankroll Module)

**Поточний стан:** Дані банкролу зберігаються в `user_{username}_bankroll_data` через `UserDataService` → `localStorage`.

#### 3.1 Таблиця `bankroll`

```sql
CREATE TABLE bankroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  initial_bank DECIMAL(12,2) NOT NULL,
  manual_adjustments DECIMAL(12,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Таблиця для історії транзакцій банкролу
CREATE TABLE bankroll_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('deposit', 'withdrawal', 'adjustment') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/bankroll` | Отримати дані банкролу |
| `POST` | `/api/bankroll/init` | Встановити початковий банк |
| `PUT` | `/api/bankroll/update` | Оновити початковий банк |
| `POST` | `/api/bankroll/adjust` | Додати ручну корекцію (депозит/вивід) |
| `GET` | `/api/bankroll/stats` | Отримати повну статистику банку |
| `GET` | `/api/bankroll/history` | Історія транзакцій |

#### 3.3 Бізнес-логіка (з `bankrollService.ts`)

```
currentBank = initialBank + totalProfit(closedBets) + manualAdjustments
ROI = (totalProfit / initialBank) * 100
```

- **Автоматичний розрахунок** `currentBank` на основі закритих ставок
- **Валідація** суми ставки відносно поточного банку
- **Попередження** при від'ємному банку або перевищенні банку

---

### 4. 🎯 Модуль стратегій (Strategies Module)

**Поточний стан:** Стратегії зберігаються в `customStrategies` та `primaryStrategy` в localStorage. Є вбудовані шаблони стратегій.

#### 4.1 Таблиця `strategies`

```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
  expected_roi DECIMAL(6,2),
  criteria JSONB,                    -- Масив критеріїв стратегії
  is_primary BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false, -- Чи це вбудований шаблон
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);
```

#### 4.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/strategies` | Отримати всі стратегії користувача |
| `POST` | `/api/strategies` | Створити нову стратегію |
| `PUT` | `/api/strategies/:id` | Оновити стратегію |
| `DELETE` | `/api/strategies/:id` | Видалити стратегію |
| `PUT` | `/api/strategies/:id/primary` | Встановити як основну |
| `GET` | `/api/strategies/templates` | Отримати шаблони стратегій |
| `GET` | `/api/strategies/:id/stats` | Статистика по стратегії |

#### 4.3 Вбудовані шаблони (seed data)

При реєстрації користувача автоматично створюються шаблони:
- **Консервативна стратегія** (Low risk, ROI ~15%)
- **Збалансована стратегія** (Medium risk, ROI ~25%)
- **Агресивна стратегія** (High risk, ROI ~40%)

---

### 5. 🏆 Модуль цілей (Goals Module)

**Поточний стан:** Цілі зберігаються через `UserDataService` в localStorage.

#### 5.1 Таблиця `goals`

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type ENUM('amount', 'ladder', 'roi', 'winrate') NOT NULL,
  status ENUM('active', 'completed', 'failed') DEFAULT 'active',
  is_primary BOOLEAN DEFAULT false,
  
  -- Для типу "amount"
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  start_amount DECIMAL(12,2),
  
  -- Для типу "ladder"
  target_ladder_amount DECIMAL(12,2),
  min_odds DECIMAL(6,2),
  max_odds DECIMAL(6,2),
  current_step INT DEFAULT 0,
  total_steps INT,
  ladder_mode ENUM('strict', 'soft') DEFAULT 'strict',
  steps JSONB,                       -- Масив кроків драбинки
  avg_odds DECIMAL(6,2),
  current_bank DECIMAL(12,2),
  
  -- Для типу "roi"
  target_roi DECIMAL(8,2),
  current_roi DECIMAL(8,2) DEFAULT 0,
  
  -- Для типу "winrate"
  target_winrate DECIMAL(5,2),
  current_winrate DECIMAL(5,2) DEFAULT 0,
  bets_per_day INT,
  
  -- Часові мітки
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/goals` | Отримати всі цілі користувача |
| `POST` | `/api/goals` | Створити нову ціль |
| `PUT` | `/api/goals/:id` | Оновити ціль |
| `DELETE` | `/api/goals/:id` | Видалити ціль |
| `PUT` | `/api/goals/:id/primary` | Встановити як основну |
| `PUT` | `/api/goals/:id/complete` | Позначити як виконану |
| `PUT` | `/api/goals/:id/fail` | Позначити як провалену |
| `GET` | `/api/goals/:id/progress` | Отримати прогрес цілі |

---

### 6. ⚠️ Модуль ризикових команд (Risky Teams Module)

**Поточний стан:** Список ризикових команд зберігається в `admin_risky_teams` в localStorage. Є початковий хардкодований список з ~70 команд.

#### 6.1 Таблиця `risky_teams`

```sql
CREATE TABLE risky_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  game VARCHAR(50) NOT NULL,           -- "CS", "Дота"
  status VARCHAR(50) NOT NULL,         -- "БАН", "Обережно", "Нестабільні", "Рідко"
  notes TEXT,
  added_by UUID REFERENCES users(id),  -- Хто додав (адмін)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name, game)
);
```

#### 6.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/risky-teams` | Отримати всі ризикові команди |
| `POST` | `/api/risky-teams` | Додати команду (тільки адмін) |
| `PUT` | `/api/risky-teams/:id` | Оновити команду (тільки адмін) |
| `DELETE` | `/api/risky-teams/:id` | Видалити команду (тільки адмін) |
| `GET` | `/api/risky-teams/check?team1=X&team2=Y` | Перевірити ризик для матчу |
| `GET` | `/api/risky-teams/search?q=name` | Пошук команди |

#### 6.3 Seed Data

При ініціалізації бази потрібно заповнити таблицю початковими даними з масиву `INITIAL_RISKY_TEAMS` (файл `riskyTeamsService.ts`). Містить ~70 записів команд CS та Dota.

---

### 7. ⭐ Модуль рейтингів матчів (Match Ratings Module)

**Поточний стан:** Рейтинги зберігаються в `match_ratings` в localStorage.

#### 7.1 Таблиця `match_ratings`

```sql
CREATE TABLE match_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id VARCHAR(255) NOT NULL,      -- Ідентифікатор матчу
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, match_id)
);
```

#### 7.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/match-ratings` | Отримати всі рейтинги користувача |
| `POST` | `/api/match-ratings` | Додати/оновити рейтинг |
| `DELETE` | `/api/match-ratings/:matchId` | Видалити рейтинг |

---

### 8. 👥 Модуль адміністрування (Admin Module)

**Поточний стан:** Адмін-функції використовують `adminLocalUsers`, `adminUserEdits`, `adminDeletedUsers` в localStorage. Основні дані користувачів читаються з Google Sheets.

#### 8.1 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/admin/users` | Отримати всіх користувачів |
| `POST` | `/api/admin/users` | Створити нового користувача |
| `PUT` | `/api/admin/users/:id` | Редагувати користувача |
| `DELETE` | `/api/admin/users/:id` | Видалити/деактивувати користувача |
| `PUT` | `/api/admin/users/:id/subscription` | Оновити підписку |
| `GET` | `/api/admin/stats` | Загальна статистика платформи |
| `GET` | `/api/admin/users/:id/bets` | Переглянути ставки конкретного користувача |

#### 8.2 Бізнес-логіка

- Тільки користувачі з роллю `admin` мають доступ
- Middleware перевірка ролі на кожному ендпоінті
- Логування дій адміна (audit log)
- Можливість продовжити/скасувати підписку

---

### 9. 🔧 Модуль налаштувань (Settings Module)

**Поточний стан:** UI налаштування зберігаються в `ui-settings` в localStorage.

#### 9.1 Таблиця `user_settings`

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',         -- Всі UI налаштування як JSON
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 9.2 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/settings` | Отримати налаштування |
| `PUT` | `/api/settings` | Оновити налаштування |

> **Примітка:** UI налаштування можуть залишитись в localStorage як кеш для швидкого завантаження, з синхронізацією на бекенд.

---

### 10. 📊 Модуль аналітики (Analytics Module)

**Поточний стан:** Аналітика розраховується на фронтенді на основі даних ставок з localStorage.

#### 10.1 API ендпоінти

| Метод | Endpoint | Опис |
|-------|----------|------|
| `GET` | `/api/analytics/overview` | Загальна статистика (winrate, ROI, profit) |
| `GET` | `/api/analytics/profit-by-month` | Профіт по місяцях |
| `GET` | `/api/analytics/profit-by-strategy` | Профіт по стратегіях |
| `GET` | `/api/analytics/team-stats` | Статистика по командах |
| `GET` | `/api/analytics/odds-analysis` | Аналіз по коефіцієнтах |
| `GET` | `/api/analytics/calendar` | Дані для календаря (heatmap) |
| `GET` | `/api/analytics/balance-history` | Історія балансу |
| `GET` | `/api/analytics/period-comparison` | Порівняння періодів |

#### 10.2 Бізнес-логіка

Аналітика може розраховуватись:
- **На бекенді** (рекомендовано для великих обсягів даних) — SQL агрегації
- **На фронтенді** (для інтерактивності) — з кешуванням результатів

Рекомендований підхід: бекенд повертає агреговані дані, фронтенд відповідає за візуалізацію.

---

## 🔄 План міграції

### Фаза 1: Критичні модулі (Тиждень 1-2)

1. **Auth Module** — JWT авторизація, міграція з Google Sheets
2. **Bets Module** — CRUD ставок, міграція існуючих даних
3. **Bankroll Module** — Управління банкролом

### Фаза 2: Основні модулі (Тиждень 3-4)

4. **Strategies Module** — Стратегії з шаблонами
5. **Goals Module** — Цілі та прогрес
6. **Risky Teams Module** — Ризикові команди (спільні для всіх)

### Фаза 3: Додаткові модулі (Тиждень 5)

7. **Admin Module** — Повне адміністрування
8. **Match Ratings Module** — Рейтинги матчів
9. **Settings Module** — Синхронізація налаштувань
10. **Analytics Module** — Серверна аналітика

---

## 🛡️ Безпека

### Обов'язкові вимоги

1. **JWT токени** з коротким терміном дії (15 хв access + 7 днів refresh)
2. **HTTPS** для всіх запитів
3. **Rate limiting** — обмеження кількості запитів
4. **Input validation** — валідація всіх вхідних даних
5. **SQL injection protection** — параметризовані запити
6. **CORS** — налаштування дозволених доменів
7. **Хешування паролів** — bcrypt з salt rounds ≥ 12
8. **Row Level Security** — користувач бачить тільки свої дані

### Ролі та дозволи

| Ресурс | User | Admin |
|--------|------|-------|
| Свої ставки | CRUD | CRUD + перегляд чужих |
| Свій банкрол | CRUD | CRUD |
| Стратегії | CRUD (свої) | CRUD (всі) |
| Цілі | CRUD (свої) | CRUD |
| Ризикові команди | Читання | CRUD |
| Користувачі | Тільки свій профіль | CRUD |
| Аналітика | Своя | Загальна + по користувачах |

---

## 🔗 Інтеграції

### Google Sheets (поточна)

- **Spreadsheet ID:** `1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo`
- **Листи:** "Доступи" (користувачі), "Стратегії" (стратегії CS2)
- **Статус:** Потрібно мігрувати дані в БД, потім відключити

### Зовнішні API (майбутні)

- **HLTV API** — дані про матчі CS2
- **PandaScore / Liquipedia** — статистика команд
- **Курси валют** — для конвертації UAH/USD

---

## 📁 Структура файлів фронтенду, які потребують змін

| Файл | Що змінити |
|------|-----------|
| `src/lib/authService.ts` | Замінити Google Sheets на API виклики |
| `src/lib/googleSheets.ts` | Замінити localStorage на API виклики |
| `src/lib/realGoogleSheets.ts` | Замінити localStorage на API виклики |
| `src/lib/userDataService.ts` | Замінити localStorage на API виклики |
| `src/lib/bankrollService.ts` | Замінити UserDataService на API виклики |
| `src/lib/riskyTeamsService.ts` | Замінити localStorage на API виклики |
| `src/hooks/useUISettings.ts` | Додати синхронізацію з бекендом |
| `src/components/ProtectedRoute.tsx` | Валідація токена через API |
| `src/components/Layout.tsx` | Отримання ролі/username з JWT |
| `src/components/CS2BettingForm.tsx` | API для створення ставок |
| `src/components/StrategyOverview.tsx` | API для стратегій |
| `src/components/GoalsManager.tsx` | API для цілей |
| `src/components/RiskManagement.tsx` | API для ризикових команд |
| `src/components/GoogleSheetsConfig.tsx` | Видалити або замінити на налаштування бекенду |
| `src/pages/Admin.tsx` | API для управління користувачами |
| `src/pages/Analytics.tsx` | API для аналітики |
| `src/pages/Matches.tsx` | API для рейтингів матчів |
| `src/pages/MyBets.tsx` | API для ставок користувача |

---

## 🗄️ Рекомендований технологічний стек

| Компонент | Рекомендація | Альтернатива |
|-----------|-------------|-------------|
| **Сервер** | Node.js + Express / Fastify | Python + FastAPI |
| **База даних** | PostgreSQL | MySQL |
| **ORM** | Prisma / Drizzle | TypeORM / Sequelize |
| **Авторизація** | JWT (jsonwebtoken) | Passport.js |
| **Валідація** | Zod / Joi | class-validator |
| **Кешування** | Redis | In-memory cache |
| **Хостинг** | Supabase / Railway / Vercel | AWS / DigitalOcean |
| **CI/CD** | GitHub Actions | GitLab CI |

---

## 📝 Додаткові нотатки

1. **Щоденне скидання:** Зараз є механізм `checkAndResetDailyBets` — на бекенді це можна реалізувати через CRON job або при першому запиті дня.

2. **Експрес-ставки:** Фронтенд підтримує експрес-ставки (парлеї) — бекенд повинен зберігати зв'язки між ставками в експресі.

3. **Value Bet аналіз:** Розрахунок Value Bet та Kelly Criterion відбувається на фронтенді — це може залишитись на фронтенді, але результати аналізу варто зберігати разом зі ставкою.

4. **Офлайн режим:** Рекомендується зберегти localStorage як кеш для офлайн-доступу з синхронізацією при відновленні з'єднання.

5. **Міграція даних:** Потрібно створити скрипт міграції, який:
   - Читає дані з Google Sheets
   - Парсить localStorage дані (якщо є доступ)
   - Імпортує все в нову БД
   - Верифікує цілісність даних

---

*Документ створено: 04.04.2026*
*Версія: 1.0*
*Автор: Alex (Engineer, Atoms Team)*