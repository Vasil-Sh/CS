# MatchIQ — Design Specification for Figma

> A complete design documentation of the **MatchIQ** CS2 betting analytics platform.
> Use this as a reference to recreate the design system in Figma.

---

## 📐 1. Brand & Identity

- **Product name:** MatchIQ
- **Tagline:** CS2 Match Analytics and Betting Intelligence Platform
- **Design language:** Modern SaaS dashboard, dark-first, data-dense, gaming-inspired
- **Tone:** Professional, analytical, premium

---

## 🎨 2. Color System

### 2.1 Core Palette (shadcn/ui HSL tokens)

| Token | Light HSL | Light HEX | Dark HSL | Dark HEX |
|---|---|---|---|---|
| `--background` | `0 0% 100%` | `#FFFFFF` | `222.2 84% 4.9%` | `#020817` |
| `--foreground` | `222.2 84% 4.9%` | `#020817` | `210 40% 98%` | `#F8FAFC` |
| `--card` | `0 0% 100%` | `#FFFFFF` | `222.2 84% 4.9%` | `#020817` |
| `--card-foreground` | — | `#020817` | — | `#F8FAFC` |
| `--popover` | — | `#FFFFFF` | — | `#020817` |
| `--primary` | `222.2 47.4% 11.2%` | `#0F172A` | `210 40% 98%` | `#F8FAFC` |
| `--primary-foreground` | — | `#F8FAFC` | — | `#0F172A` |
| `--secondary` | `210 40% 96.1%` | `#F1F5F9` | `217.2 32.6% 17.5%` | `#1E293B` |
| `--muted` | `210 40% 96.1%` | `#F1F5F9` | `217.2 32.6% 17.5%` | `#1E293B` |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `#64748B` | `215 20.2% 65.1%` | `#94A3B8` |
| `--accent` | `210 40% 96.1%` | `#F1F5F9` | `217.2 32.6% 17.5%` | `#1E293B` |
| `--destructive` | `0 84.2% 60.2%` | `#EF4444` | `0 62.8% 30.6%` | `#7F1D1D` |
| `--border` | `214.3 31.8% 91.4%` | `#E2E8F0` | `217.2 32.6% 17.5%` | `#1E293B` |
| `--input` | — | `#E2E8F0` | — | `#1E293B` |
| `--ring` | `222.2 84% 4.9%` | `#020817` | `212.7 26.8% 83.9%` | `#CBD5E1` |

### 2.2 Semantic / Status Colors

| Purpose | HEX | Usage |
|---|---|---|
| Success / Profit | `#10B981` (green-500) | Winning bets, positive ROI, up-trends |
| Success dim | `#059669` | Hover on success |
| Danger / Loss | `#F87171` / `#EF4444` | Losing bets, negative ROI, alerts |
| Warning | `#F59E0B` (amber-500) | Pending, at-risk |
| Info / Accent brand | `#D4B896` (warm gold) | Chart gradient, premium accents |
| Neutral info | `#3B82F6` (blue-500) | Links, info chips |

### 2.3 Chart Palette

| Role | HEX |
|---|---|
| Primary area fill gradient start | `#D4B896` @ 0.8 opacity |
| Primary area fill gradient end | `#D4B896` @ 0.1 opacity |
| Primary stroke | `#D4B896` |
| Positive bar | `#10B981` |
| Negative bar | `#F87171` |
| Grid line | `#1E293B` (dark) / `#E2E8F0` (light) |

### 2.4 Sidebar (Dark nav rail)

| Token | HEX |
|---|---|
| `--sidebar-background` | `#0F0F12` |
| `--sidebar-foreground` | `#F1F1F1` |
| `--sidebar-primary` | `#1E40AF` |
| `--sidebar-accent` | `#27272A` |
| `--sidebar-border` | `#27272A` |

---

## 🔤 3. Typography

- **Font family:** `Inter`, `system-ui`, `-apple-system`, sans-serif (shadcn/ui default)
- **Numeric / data:** `Inter` with `font-variant-numeric: tabular-nums` in tables and KPI cards

| Style | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| Display / Hero | 48 / 60 px (3rem–3.75rem) | 800 | 1.1 | Landing hero |
| H1 | 32 px (2rem) | 700 | 1.2 | Page titles |
| H2 | 24 px (1.5rem) | 700 | 1.25 | Section headers |
| H3 | 20 px (1.25rem) | 600 | 1.3 | Card titles |
| Body-lg | 16 px (1rem) | 400 | 1.5 | Primary body copy |
| Body | 14 px (0.875rem) | 400 | 1.5 | Default UI text, tables |
| Small | 12 px (0.75rem) | 500 | 1.4 | Captions, labels, chips |
| KPI value | 28–36 px | 700 | 1.1 | Dashboard metric numbers |

---

## 📏 4. Spacing & Layout

### 4.1 Spacing scale (Tailwind base 4px)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80` px

### 4.2 Radii

| Token | px |
|---|---|
| `--radius` (default) | 8 (`0.5rem`) |
| Small (chips, badges) | 4–6 |
| Medium (buttons, inputs) | 8 |
| Large (cards) | 12 |
| XLarge (modals) | 16 |
| Full (avatars, pills) | 9999 |

### 4.3 Grid & Container

- **Max container width:** 1280 px (`max-w-screen-xl`)
- **Page gutter:** 24 px desktop / 16 px mobile
- **Dashboard grid:** 12-column, 24 px gap
- **Breakpoints:** `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`

### 4.4 Elevation / Shadows

| Level | CSS |
|---|---|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `md` | `0 4px 6px -1px rgba(0,0,0,0.1)` |
| `lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| Card (dark) | `0 1px 3px rgba(0,0,0,0.4)` + inner 1px border `#1E293B` |

---

## 🧩 5. Components

All components follow **shadcn/ui** defaults (radix-ui + Tailwind). Below are the project-specific variants.

### 5.1 Button

| Variant | BG | Text | Border | Use |
|---|---|---|---|---|
| `default` | `#0F172A` | `#F8FAFC` | — | Primary CTA |
| `secondary` | `#1E293B` | `#F8FAFC` | — | Secondary |
| `destructive` | `#EF4444` | `#FFFFFF` | — | Delete/cancel |
| `outline` | transparent | foreground | `1px` border | Tertiary |
| `ghost` | transparent | foreground | — | Toolbars |
| `link` | transparent | `#3B82F6` | — | Inline |

- Height: `36 px` (default), `32 px` (sm), `44 px` (lg)
- Padding: `px-4 py-2` default
- Radius: `8 px`
- Icon + text gap: 8 px
- ⚠ Button text color must never match its background.

### 5.2 Card

```
┌─────────────────────────────┐
│  Card Title (H3, 20/600)     │
│  Optional subtitle (12/500)  │
│                              │
│  Content                     │
│                              │
└─────────────────────────────┘
```

- Background: `card` token
- Border: `1px solid border` token
- Radius: `12 px`
- Padding: `24 px` (header 24 / content 24 / footer 24)
- Header/Content/Footer separated by `16 px` gap

### 5.3 KPI Card (Dashboard)

```
┌──────────────────────────────┐
│ ICON   Label (12/500/muted)  │
│                              │
│   $12,480                    │  ← 32/700
│   ▲ +8.4% vs last week       │  ← 12/500 success
└──────────────────────────────┘
```

- Min-width: 240 px
- Padding: 20 px
- Icon: 20×20, muted-foreground
- Delta positive: `#10B981`; negative: `#F87171`

### 5.4 Input / Select / Textarea

- Height: 40 px
- Padding: 8 × 12 px
- Border: 1px `input` token
- Focus ring: 2 px `ring` token, offset 2 px
- Placeholder: `muted-foreground`

### 5.5 Table

- Header row: 40 px, `muted` background, 12/600 uppercase tracking-wide
- Row height: 48 px
- Row border-bottom: 1 px `border`
- Zebra stripes: optional, `muted/50`
- Numeric cells: right-aligned, tabular-nums
- Action column: icon buttons with text labels on hover

### 5.6 Badge / Chip

| State | BG | Text |
|---|---|---|
| Win | `#10B981/15` | `#10B981` |
| Loss | `#F87171/15` | `#F87171` |
| Pending | `#F59E0B/15` | `#F59E0B` |
| Neutral | `muted` | `muted-foreground` |

- Height: 22 px, radius 6 px, padding 2 × 8 px, 12/600

### 5.7 Modal / Dialog

- Overlay: `rgba(0,0,0,0.6)` + `backdrop-blur-sm`
- Container: max-width 520 px (default) / 720 px (form) / 960 px (content)
- Radius: 16 px
- Padding: 24 px
- Close (X) 20 × 20 top-right

### 5.8 Tooltip

- BG: `#0F172A`, text: `#F8FAFC`
- 12/500, padding 6 × 10 px, radius 6 px
- Arrow 6 px

### 5.9 Tabs

- Tab row height: 40 px
- Active tab: underline 2 px `primary` + foreground text
- Inactive: muted-foreground
- Gap between tabs: 16 px

### 5.10 Sidebar Navigation

- Width: 240 px (expanded) / 64 px (collapsed)
- Item height: 40 px, radius 8 px
- Active: `sidebar-accent` bg + `sidebar-primary-foreground` text + 2 px left accent bar `#3B82F6`
- Icon size: 18 px

**Nav items (Ukrainian labels):**
1. 📊 Аналітика
2. ➕ Додати запис
3. 🎯 Стратегія
4. 🎮 Матчі
5. 🛡️ Адмін панель (admin only)

---

## 🗺️ 6. Page Layouts

### 6.1 Landing Page

```
┌──────────────────────────────────────────────┐
│  Nav: Logo  ...  [Увійти] [Почати]            │
├──────────────────────────────────────────────┤
│                                              │
│        HERO: MatchIQ                         │
│        CS2 Analytics & Betting Intelligence  │
│        [Почати безкоштовно]  [Демо]          │
│                                              │
│        <Hero image / dashboard mockup>       │
│                                              │
├──────────────────────────────────────────────┤
│  Features Grid (3 × N)                       │
│  • Live Analytics  • AI Predictions  • ROI   │
├──────────────────────────────────────────────┤
│  Pricing (3 tiers: Free / Pro / Team)        │
├──────────────────────────────────────────────┤
│  FAQ Accordion                               │
├──────────────────────────────────────────────┤
│  Footer (logo, links, social, copyright)     │
└──────────────────────────────────────────────┘
```

### 6.2 Dashboard (Analytics)

```
┌─────┬────────────────────────────────────────┐
│     │  Top bar: Period filter  User menu     │
│ NAV ├────────────────────────────────────────┤
│     │  KPI row (4 cards):                     │
│     │  [ROI] [Profit] [Win rate] [Bets]       │
│     │                                         │
│     │  Main area (2 cols):                    │
│     │  ┌──── Profit chart ────┐  ┌── Risk ──┐│
│     │  │  Area chart gold     │  │ Heatmap  ││
│     │  └──────────────────────┘  └──────────┘│
│     │                                         │
│     │  Period comparison (bar)                │
│     │  Recent bets table                      │
└─────┴────────────────────────────────────────┘
```

### 6.3 Add Entry (CS2 Betting Form)

- Single-column form, max-width 720 px, centered
- Grouped fields:
  1. **Match info:** Team A, Team B, Tournament, Date
  2. **Bet details:** Market, Odds, Stake, Currency (USD/UAH)
  3. **Format & Goal** (merged) → type-ahead
  4. **Notes** (textarea, 4 rows)
- Primary button: "Зберегти запис" full-width on mobile
- Secondary: "Скасувати" ghost

### 6.4 Strategy

- Header KPI block (StrategyOverviewHeader)
- Strategy cards grid (2 × N), each card:
  - Strategy name, emoji icon
  - Win rate %, ROI %, bets count
  - "Відкрити" secondary button

### 6.5 Matches

- Filter bar: Tournament, Date, Team search
- Matches list: card per match (Team A vs Team B, date, odds snapshot, "Додати прогноз" CTA)
- Toggle: "Приховати завершені матчі"

### 6.6 Admin Panel

```
┌──────────────────────────────────────────────┐
│  KPIs: [MRR] [LTV] [Churn Rate] [Active]     │
├──────────────────────────────────────────────┤
│  Search: [ 🔍_______ ] Filter ▾ Sort ▾        │
├──────────────────────────────────────────────┤
│  Users table:                                 │
│  Email | Plan | Start | End | Status | Actions│
│  ...                                          │
│                                               │
│  Actions: [Продовжити] [Редагувати] [Видалити]│
└──────────────────────────────────────────────┘
```

### 6.7 Bet Share Card (Modal)

- Aspect ratio: 4:5 (shareable)
- Top: user avatar + handle
- Middle: Team A vs Team B, market, odds, stake, profit (big)
- Bottom: MatchIQ logo watermark
- Background: dark gradient `#0F172A → #1E293B`
- Profit color: success or danger based on outcome

---

## 🎭 7. Iconography

- **Library:** [Lucide React](https://lucide.dev) (shadcn/ui default)
- **Size:** 16 / 18 / 20 / 24 px
- **Stroke:** 2 px
- **Color:** inherit from text (`currentColor`)
- Common icons used:
  `LayoutDashboard, PlusCircle, Target, Gamepad2, Shield, TrendingUp, TrendingDown, Search, Filter, ArrowUpDown, Calendar, DollarSign, Percent, Edit, Trash2, Share2, X`

---

## 🖱️ 8. Interaction & Motion

| Element | Animation | Duration |
|---|---|---|
| Button hover | bg / text color shift | 150 ms ease-out |
| Card hover | translateY(-2px) + shadow-md | 200 ms ease-out |
| Modal enter | scale 0.96 → 1 + fade | 200 ms ease-out |
| Tab switch | underline slide | 200 ms ease-in-out |
| Toast | slide-in-right + fade | 250 ms |
| Chart load | path draw | 600 ms ease-out |

- **Focus outline:** 2 px `ring` token, offset 2 px, always visible on keyboard focus.

---

## ✅ 9. Accessibility

- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text
- Interactive targets ≥ 40 × 40 px
- All form fields have labels (visible or `aria-label`)
- Status conveyed by icon + text + color (never color alone)

---

## 📦 10. Figma Setup Checklist

When porting to Figma, create:

1. **Color styles** — one for each token above (Light + Dark variants)
2. **Text styles** — Display, H1, H2, H3, Body-lg, Body, Small, KPI
3. **Effect styles** — shadow-sm/md/lg, focus-ring
4. **Grid styles** — 12-col 1280 px, 24 gutter
5. **Components** (with variants):
   - Button (6 variants × 3 sizes × default/hover/disabled)
   - Card (default / hover / with header / with footer)
   - KPI Card (positive / negative / neutral)
   - Input / Select / Textarea (default / focus / error / disabled)
   - Badge (win / loss / pending / neutral)
   - Table row (default / hover / selected)
   - Nav item (default / active / collapsed)
   - Modal
   - Tabs
6. **Pages:**
   - 00 · Cover
   - 01 · Foundations (color + type)
   - 02 · Components
   - 03 · Landing
   - 04 · Dashboard
   - 05 · Add Entry
   - 06 · Strategy
   - 07 · Matches
   - 08 · Admin
   - 09 · Share card
   - 10 · Mobile (responsive)

---

## 🔗 11. Reference Libraries

- **Component base:** shadcn/ui → https://ui.shadcn.com
- **Icons:** Lucide → https://lucide.dev
- **Tailwind:** https://tailwindcss.com
- **Radix primitives:** https://radix-ui.com

> 💡 **Tip for Figma:** install the free **"shadcn/ui Design System"** community file from Figma Community as a starter — most tokens above match 1:1.

---

_Generated for the MatchIQ project. Keep this file in sync with `src/index.css` and `tailwind.config.ts`._