# SRS — MatchIQ Admin

> Software Requirements Specification — адміністративна панель платформи MatchIQ.
> Репозиторій: https://github.com/Vasil-Sh/mathciq-admin
> Версія документа: 1.0 · Дата: 2026-09-24 · Статус: актуально

---

## 1. Вступ

### 1.1 Призначення

Документ описує функціональні та нефункціональні вимоги до адміністративної панелі MatchIQ Admin — окремого застосунку для керування користувачами та моніторингу доходів платформи MatchIQ.

### 1.2 Область дії

SPA для адміністраторів: вхід з перевіркою ролі, дашборд з KPI та аналітикою доходів, CRUD користувачів із підписками.

### 1.3 Аудиторія

Виключно користувачі з роллю `admin` платформи MatchIQ.

---

## 2. Загальний опис

### 2.1 Технологічний стек

| Шар          | Технологія                                       |
| ------------ | ------------------------------------------------ |
| Runtime      | React 19                                         |
| Мова         | TypeScript                                       |
| Білд         | Vite 5                                           |
| Стилі        | Tailwind CSS 3 + shadcn/ui                       |
| Роутинг      | react-router-dom v6                              |
| Іконки       | lucide-react                                     |
| Тости        | sonner                                           |
| Date picker  | react-day-picker v9 + date-fns                   |
| UI-примітиви | class-variance-authority + clsx + tailwind-merge |
| Порт (dev)   | 5174                                             |
| Backend      | MatchIQ Backend (http://localhost:3001/api)      |

### 2.2 Маршрути

| Маршрут      | Сторінка                | Доступ                           |
| ------------ | ----------------------- | -------------------------------- |
| `/login`     | Форма входу             | публічний (admin-only при вході) |
| `/dashboard` | Дашборд                 | захищений (admin)                |
| `/users`     | Керування користувачами | захищений (admin)                |
| `/`          | Redirect → `/dashboard` | —                                |

### 2.3 Структура (`src/`)

| Директорія/файл              | Призначення                               |
| ---------------------------- | ----------------------------------------- |
| `App.tsx`                    | Роутинг, `ProtectedRoute`, `AuthProvider` |
| `contexts/AuthContext.tsx`   | JWT-автентифікація (admin-only)           |
| `hooks/useLogin.ts`          | Логіка форми входу                        |
| `lib/apiClient.ts`           | JWT + auto-refresh                        |
| `lib/authService.ts`         | API: auth + CRUD користувачів             |
| `lib/adminStatsApi.ts`       | API: `/admin/stats` (дашборд)             |
| `lib/adminUtils.ts`          | Утиліти дат, підписок, цін                |
| `components/AdminLayout.tsx` | Сайдбар + Outlet                          |
| `components/ui/`             | shadcn/ui примітиви                       |
| `pages/LoginPage.tsx`        | Форма входу                               |
| `pages/Dashboard.tsx`        | Аналітичний дашборд                       |
| `pages/Admin.tsx`            | CRUD користувачів                         |
| `types/index.ts`             | Спільні типи                              |

---

## 3. Функціональні вимоги

### FR-1. Аутентифікація

- FR-1.1 Вхід за username/password.
- FR-1.2 Перевірка ролі `admin` при автентифікації.
- FR-1.3 Відхилення входу для не-адміністраторів з помилкою «Доступ лише для адміністраторів».
- FR-1.4 Збереження токена в `localStorage`, валідація при монтуванні.
- FR-1.5 Logout з підтвердженням (модалка).

### FR-2. Дашборд (`/dashboard`)

- FR-2.1 KPI-картки: MRR, Активні користувачі, Нові (за місяць), Адміни, Неактивні.
- FR-2.2 Revenue & Users — помісячна таблиця з %-змінами та ARPU.
- FR-2.3 Plan Distribution — розподіл тарифів з прогрес-барами.
- FR-2.4 Conversion Rate — співвідношення active/inactive/admin.
- FR-2.5 Top Revenue Users — лідерборд по доходу.
- FR-2.6 Recent Registrations — останні реєстрації.
- FR-2.7 Expiring Subscriptions — підписки, що закінчуються протягом 7 днів (з прогресами).
- FR-2.8 Фільтр по місяцях + ручне оновлення (refresh).

### FR-3. Користувачі (`/users`)

- FR-3.1 CRUD користувачів: додавання, редагування, видалення.
- FR-3.2 Модалки: Add User (з генерацією пароля), Edit User, Delete Confirm, Reset Password.
- FR-3.3 Фільтри: пошук, статус (active/inactive/admin), роль.
- FR-3.4 Date picker для start/end дат.
- FR-3.5 Сортування (за датою закінчення) + пагінація (10 на сторінку).
- FR-3.6 Відображення статусу підписки (активна / закінчується / неактивна) з бейджами.
- FR-3.7 Попередження про користувачів з підписками, що закінчуються протягом 3 днів.

---

## 4. Нефункціональні вимоги

| NFR   | Вимога                                                               |
| ----- | -------------------------------------------------------------------- |
| NFR-1 | Респонсивний дизайн (sidebar → mobile header)                        |
| NFR-2 | Дизайн-токени синхронізовані з головним застосунком (Seline palette) |
| NFR-3 | Тости (sonner) для зворотного зв'язку                                |
| NFR-4 | Локалізація українською                                              |
| NFR-5 | `robots: noindex, nofollow` (не індексується)                        |
| NFR-6 | Готовність до деплою на Vercel (SPA + `vercel.json`) / Railway       |
| NFR-7 | JWT auto-refresh у `apiClient`                                       |

---

## 5. Дизайн-система (з DESIGN.md)

### 5.1 Кольори

| Токен    | Значення  |
| -------- | --------- |
| primary  | `#3ba6f1` |
| ink      | `#0c0a09` |
| canvas   | `#f3f3f3` |
| surface  | `#FFFFFF` |
| success  | `#22c55e` |
| warning  | `#f59e0b` |
| danger   | `#ef4444` |
| hairline | `#e8e6e5` |

### 5.2 Радіуси та відступи

- Картки: `24px`
- Кнопки/інпути: `12px`
- Максимальна ширина контенту: `1200px`
- Паддінг картки: `24px`
