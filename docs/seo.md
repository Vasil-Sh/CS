# SEO — MatchIQ

Документація з пошукової оптимізації проекту MatchIQ.

> Останнє оновлення: v1.23.1 (2026-06-24)

---

## 🧩 Компоненти SEO

### `src/components/SEO.tsx`

Універсальний компонент на базі `react-helmet-async`. Використовується на кожній публічній сторінці.

```tsx
<SEO
  title="Аналітика ставок на CS2"          // appended to " | MatchIQ"
  description="..."                         // 150–160 chars recommended
  canonical="https://matchiq.pro/"          // absolute URL
  ogImage="https://matchiq.pro/assets/og-image.svg"
  ogType="website" | "article"
  ukHref="https://matchiq.pro/"             // hreflang uk
  enHref="https://matchiq.pro/"             // hreflang en
  noIndex={false}                           // noindex for admin pages
/>
```

**Покриття тегів:**
| Тег | Призначення |
|-----|------------|
| `<title>` | Заголовок сторінки |
| `<meta name="description">` | Мета-опис |
| `<link rel="canonical">` | Канонічний URL |
| `<meta name="robots">` | index/noindex |
| `og:*` | Open Graph (Facebook, Telegram, Viber) |
| `twitter:*` | Twitter Cards (summary_large_image) |
| `hreflang` | Мовні альтернативи (uk, en, x-default) |
| PWA-теги | mobile-web-app-capable, apple-mobile-web-app |

---

### `src/components/StructuredData.tsx`

JSON-LD структуровані дані для rich-результатів Google.

| Компонент | Schema.org тип | Де використовується |
|-----------|---------------|---------------------|
| `WebAppStructuredData` | `WebApplication` | Лендінг |
| `OrganizationStructuredData` | `Organization` | Лендінг |
| `FAQStructuredData` | `FAQPage` | Лендінг (FAQ секція) |
| `BreadcrumbStructuredData` | `BreadcrumbList` | Навігація (ready) |

---

## 📄 Статичні SEO-файли

### `public/sitemap.xml`

- Всі публічні URL з `changefreq` та `priority`
- hreflang-альтернативи через `xhtml:link`
- Оновлювати при додаванні нових публічних сторінок

### `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://matchiq.pro/sitemap.xml
Disallow: /app/admin
Disallow: /app/profile
Disallow: /api/
Crawl-delay: 5
```

### `public/assets/og-image.svg`

Open Graph зображення 1200×630 px. Містить назву, підзаголовок та ключові фічі проекту.

---

## 🗺️ Де застосовано SEO

| Сторінка | Файл | SEO-компонент | Structured Data |
|----------|------|--------------|----------------|
| Лендінг | `pages/Landing.tsx` | `SEO` | `WebApp` + `Organization` + `FAQ` |
| Вхід | `pages/Login.tsx` | `SEO` | — |
| Демо | `pages/LoginDigestoDemo.tsx` | `SEO` | — |

Для захищених сторінок (`/app/*`) SEO не застосовується — вони закриті в robots.txt.

---

## ✅ SEO Checklist (перед деплоєм)

- [ ] Замінити `https://matchiq.pro` на реальний домен у всіх файлах
- [ ] Додати сайт у Google Search Console
- [ ] Додати sitemap.xml у Search Console
- [ ] Перевірити OG-зображення через [opengraph.xyz](https://opengraph.xyz)
- [ ] Перевірити структуровані дані через [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Налаштувати Google Analytics 4
- [ ] Додати meta-тег верифікації Google: `<meta name="google-site-verification" content="...">`

---

## 📚 Корисні посилання

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image)
