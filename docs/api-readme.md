# SC.Api — CS2 Betting API Documentation

> **Swagger UI**: [https://api.cstest.pp.ua/swagger/index.html](https://api.cstest.pp.ua/swagger/index.html)  
> **swagger.json**: [https://api.cstest.pp.ua/swagger/v1/swagger.json](https://api.cstest.pp.ua/swagger/v1/swagger.json)  
> **Base URL**: `https://api.cstest.pp.ua`  
> **Version**: 1.0 (OAS 3.0)

---

## 📋 Зміст

- [Ендпоінти](#ендпоінти)
  - [Game](#game)
  - [Team](#team)
  - [User](#user)
- [Схеми (DTO)](#схеми-dto)
- [Приклади використання](#приклади-використання)

---

## Ендпоінти

### Game

#### `GET /api/Game/TodaysAndUpcoming`

Повертає список сьогоднішніх та майбутніх матчів.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| — | — | — | Без параметрів |

**Response** `200 OK`: `TeamDto[]`

```json
[
  {
    "id": 1,
    "position": 5,
    "name": "NAVI",
    "points": 1250,
    "hltvId": 4608,
    "comment": null
  }
]
```

> **Примітка**: Хоча ендпоінт називається `TodaysAndUpcoming`, у swagger.json схема відповіді вказана як `TeamDto[]`. Це може бути пов'язано з тим, що матчі представлені через команди. Рекомендується перевірити актуальну відповідь через Swagger UI.

---

### Team

#### `GET /api/Team/top/{numberOfTeams}`

Повертає топ N команд, відсортованих за позицією. За замовчуванням — 10.

| Параметр | Тип | Обов'язковий | За замовчуванням | Опис |
|----------|-----|-------------|-----------------|------|
| `numberOfTeams` | `int32` (path) | ✅ | `10` | Кількість команд |

**Response** `200 OK`: `TeamDto[]`

```json
[
  {
    "id": 1,
    "position": 1,
    "name": "Team Spirit",
    "points": 2000,
    "hltvId": 7020,
    "comment": null
  },
  {
    "id": 2,
    "position": 2,
    "name": "NAVI",
    "points": 1850,
    "hltvId": 4608,
    "comment": null
  }
]
```

---

### User

#### `GET /api/User`

Повертає всіх користувачів з їхніми активними підписками.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| — | — | — | Без параметрів |

**Response** `200 OK`: `UserWithSubscriptionDto[]`

```json
[
  {
    "id": 1,
    "telegram": "@username",
    "userName": "user1",
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00",
    "activeSubscription": {
      "id": 10,
      "userId": 1,
      "priceMonth": 9.99,
      "startDate": "2024-06-01",
      "endDate": "2024-07-01",
      "isActive": true,
      "createdAt": "2024-06-01T00:00:00"
    }
  }
]
```

---

#### `POST /api/User`

Створює нового користувача.

**Request Body** (`application/json`): [`CreateUserRequest`](#createuserrequest)

```json
{
  "telegram": "@username",
  "userName": "user1",
  "password": "secret123",
  "isAdmin": false
}
```

**Response** `200 OK`: [`UserDto`](#userdto)

```json
{
  "id": 5,
  "telegram": "@username",
  "userName": "user1",
  "isAdmin": false,
  "createdAt": "2024-06-18T12:00:00"
}
```

---

#### `GET /api/User/{id}`

Повертає одного користувача з його активною підпискою.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| `id` | `int32` (path) | ✅ | ID користувача |

**Response** `200 OK`: [`UserWithSubscriptionDto`](#userwithsubscriptiondto)

```json
{
  "id": 1,
  "telegram": "@username",
  "userName": "user1",
  "isAdmin": false,
  "createdAt": "2024-01-01T00:00:00",
  "activeSubscription": {
    "id": 10,
    "userId": 1,
    "priceMonth": 9.99,
    "startDate": "2024-06-01",
    "endDate": "2024-07-01",
    "isActive": true,
    "createdAt": "2024-06-01T00:00:00"
  }
}
```

---

#### `PUT /api/User/{id}`

Оновлює ім'я користувача, пароль та прапор адміністратора.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| `id` | `int32` (path) | ✅ | ID користувача |

**Request Body** (`application/json`): [`UpdateUserRequest`](#updateuserrequest)

```json
{
  "userName": "newUsername",
  "password": "newSecret123",
  "isAdmin": true
}
```

**Response** `200 OK` — без тіла відповіді.

---

#### `GET /api/User/{id}/subscription`

Повертає повну історію підписок користувача.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| `id` | `int32` (path) | ✅ | ID користувача |

**Response** `200 OK`: [`SubscriptionDto[]`](#subscriptiondto)

```json
[
  {
    "id": 8,
    "userId": 1,
    "priceMonth": 7.99,
    "startDate": "2024-01-01",
    "endDate": "2024-02-01",
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00"
  },
  {
    "id": 10,
    "userId": 1,
    "priceMonth": 9.99,
    "startDate": "2024-06-01",
    "endDate": "2024-07-01",
    "isActive": true,
    "createdAt": "2024-06-01T00:00:00"
  }
]
```

---

#### `POST /api/User/{id}/subscription`

Додає нову підписку для користувача. **Деактивує будь-яку існуючу активну підписку** перед додаванням нової.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| `id` | `int32` (path) | ✅ | ID користувача |

**Request Body** (`application/json`): [`AddSubscriptionRequest`](#addsubscriptionrequest)

```json
{
  "priceMonth": 9.99,
  "startDate": "2024-07-01",
  "endDate": "2024-08-01"
}
```

**Response** `200 OK`: [`SubscriptionDto`](#subscriptiondto)

```json
{
  "id": 11,
  "userId": 1,
  "priceMonth": 9.99,
  "startDate": "2024-07-01",
  "endDate": "2024-08-01",
  "isActive": true,
  "createdAt": "2024-06-18T15:30:00"
}
```

---

#### `POST /api/User/login`

Перевіряє облікові дані. Повертає користувача з активною підпискою при успіху, **401** — якщо не знайдено або неправильний пароль.

| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|-------------|------|
| — | — | — | Усі параметри в тілі запиту |

**Request Body** (`application/json`): [`LoginRequest`](#loginrequest)

```json
{
  "telegram": "@username",
  "password": "secret123"
}
```

**Response** `200 OK`: [`UserWithSubscriptionDto`](#userwithsubscriptiondto)

```json
{
  "id": 1,
  "telegram": "@username",
  "userName": "user1",
  "isAdmin": false,
  "createdAt": "2024-01-01T00:00:00",
  "activeSubscription": {
    "id": 10,
    "userId": 1,
    "priceMonth": 9.99,
    "startDate": "2024-06-01",
    "endDate": "2024-07-01",
    "isActive": true,
    "createdAt": "2024-06-01T00:00:00"
  }
}
```

**Response** `401 Unauthorized` — невірний логін або пароль.

---

## Схеми (DTO)

### TeamDto

Модель команди.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `id` | `int32` | ❌ | Унікальний ідентифікатор |
| `position` | `int32` | ❌ | Позиція в рейтингу |
| `name` | `string` | ✅ | Назва команди |
| `points` | `int32` | ❌ | Кількість очок |
| `hltvId` | `int32` | ❌ | HLTV ID команди |
| `comment` | `string` | ✅ | Коментар |

---

### UserDto

Базова модель користувача.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `id` | `int32` | ❌ | Унікальний ідентифікатор |
| `telegram` | `string` | ✅ | Telegram-юзернейм |
| `userName` | `string` | ✅ | Ім'я користувача |
| `isAdmin` | `boolean` | ❌ | Чи є адміністратором |
| `createdAt` | `string` | ✅ | Дата створення (ISO 8601) |

---

### UserWithSubscriptionDto

Розширена модель користувача з активною підпискою.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `id` | `int32` | ❌ | Унікальний ідентифікатор |
| `telegram` | `string` | ✅ | Telegram-юзернейм |
| `userName` | `string` | ✅ | Ім'я користувача |
| `isAdmin` | `boolean` | ❌ | Чи є адміністратором |
| `createdAt` | `string` | ✅ | Дата створення |
| `activeSubscription` | [`SubscriptionDto`](#subscriptiondto) | — | Активна підписка |

---

### SubscriptionDto

Модель підписки.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `id` | `int32` | ❌ | Унікальний ідентифікатор |
| `userId` | `int32` | ❌ | ID користувача |
| `priceMonth` | `double` | ❌ | Ціна за місяць |
| `startDate` | `string` | ✅ | Дата початку |
| `endDate` | `string` | ✅ | Дата завершення |
| `isActive` | `boolean` | ❌ | Чи активна |
| `createdAt` | `string` | ✅ | Дата створення |

---

### CreateUserRequest

Тіло запиту для створення користувача.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `telegram` | `string` | ✅ | Telegram-юзернейм |
| `userName` | `string` | ✅ | Ім'я користувача |
| `password` | `string` | ✅ | Пароль |
| `isAdmin` | `boolean` | ❌ | Чи є адміністратором |

---

### UpdateUserRequest

Тіло запиту для оновлення користувача.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `userName` | `string` | ✅ | Нове ім'я користувача |
| `password` | `string` | ✅ | Новий пароль |
| `isAdmin` | `boolean` | ❌ | Прапор адміністратора |

---

### LoginRequest

Тіло запиту для входу.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `telegram` | `string` | ✅ | Telegram-юзернейм |
| `password` | `string` | ✅ | Пароль |

---

### AddSubscriptionRequest

Тіло запиту для додавання підписки.

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `priceMonth` | `double` | ❌ | Ціна за місяць |
| `startDate` | `string` | ✅ | Дата початку |
| `endDate` | `string` | ✅ | Дата завершення |

---

## Приклади використання

### Отримати топ-10 команд

```bash
curl -X GET "https://api.cstest.pp.ua/api/Team/top/10" \
  -H "Accept: application/json"
```

### Увійти в систему

```bash
curl -X POST "https://api.cstest.pp.ua/api/User/login" \
  -H "Content-Type: application/json" \
  -d '{"telegram": "@user", "password": "pass123"}'
```

### Створити нового користувача

```bash
curl -X POST "https://api.cstest.pp.ua/api/User" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram": "@newuser",
    "userName": "newuser",
    "password": "secret456",
    "isAdmin": false
  }'
```

### Додати підписку користувачу

```bash
curl -X POST "https://api.cstest.pp.ua/api/User/1/subscription" \
  -H "Content-Type: application/json" \
  -d '{
    "priceMonth": 9.99,
    "startDate": "2024-07-01",
    "endDate": "2024-08-01"
  }'
```

### Отримати всіх користувачів з підписками

```bash
curl -X GET "https://api.cstest.pp.ua/api/User" \
  -H "Accept: application/json"
```

---

## 🗂️ Зведена таблиця ендпоінтів

| Метод | Шлях | Опис |
|-------|------|------|
| `GET` | `/api/Game/TodaysAndUpcoming` | Сьогоднішні та майбутні матчі |
| `GET` | `/api/Team/top/{numberOfTeams}` | Топ N команд за позицією |
| `GET` | `/api/User` | Усі користувачі з активними підписками |
| `POST` | `/api/User` | Створити користувача |
| `GET` | `/api/User/{id}` | Отримати користувача за ID |
| `PUT` | `/api/User/{id}` | Оновити користувача |
| `GET` | `/api/User/{id}/subscription` | Історія підписок користувача |
| `POST` | `/api/User/{id}/subscription` | Додати підписку |
| `POST` | `/api/User/login` | Увійти (перевірка облікових даних) |

---

## 📝 Примітки

1. **Аутентифікація**: API наразі не вимагає JWT токенів чи API ключів. Логін відбувається через `POST /api/User/login` і повертає дані користувача.
2. **Дата/час**: Усі поля дат повертаються у форматі ISO 8601 рядків (nullable).
3. **HEAD-запити**: Для деяких GET-ендпоінтів доступні HEAD-версії (повертають лише заголовки).
4. **Content-Type**: API підтримує `application/json`, `text/json` та `text/plain`.
5. **Game Endpoint**: Ендпоінт `TodaysAndUpcoming` у swagger.json повертає `TeamDto[]`, але може повертати матчі. Рекомендується перевірити через Swagger UI або зробити тестовий запит.
