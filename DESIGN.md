---
version: alpha
name: MatchIQ
description: >
  A data-dense CS2/Dota2 betting analytics dashboard with a clean, professional
  blue accent (#447afc) on a white or dark-navy canvas. Cards float on hairline
  borders with a subtle lift on hover. Typography is system sans-serif, tight,
  and hierarchical — large bold values, medium labels, small muted captions.
  The dashboard speaks Ukrainian and feels like a precision instrument:
  analytical, focused, calm.

colors:
  primary: "#447afc"
  primary-hover: "#5b8ffd"
  primary-foreground: "#FFFFFF"

  ink: "#111827"
  body: "#374151"
  muted: "#6B7280"
  subtle: "#9CA3AF"

  canvas: "#FFFFFF"
  canvas-dark: "#0F172A"

  surface-card: "#FFFFFF"
  surface-card-dark: "#1E293B"
  surface-subtle: "#F9FAFB"
  surface-subtle-dark: "#1A2235"
  surface-hover: "#EFF6FF"

  hairline: "#F3F4F6"
  hairline-dark: "#334155"
  hairline-hover: "#D1D5DB"
  hairline-hover-dark: "#475569"

  success-bg: "#F0FDF4"
  success-text: "#16A34A"
  warning-bg: "#FEF3C7"
  warning-text: "#D97706"
  danger-bg: "#FEE2E2"
  danger-text: "#DC2626"
  info-bg: "#DBEAFE"
  info-text: "#2563EB"
  neutral-bg: "#F3F4F6"
  neutral-text: "#6B7280"

  primary-glow: "rgba(68,122,252,0.3)"

typography:
  hero-display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.04em

  display-lg:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.03em

  heading-lg:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em

  heading-md:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em

  body-lg:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0

  body-md:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

  caption:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

  value-lg:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em

  value-md:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em

  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0

  label-xs:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.05em

  button:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0

  button-sm:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  "2xl": 20px
  "3xl": 24px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 20px
  xl: 24px
  "2xl": 32px
  section: 64px
  card-px: 24px
  card-py: 20px
  page-padding: 32px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    hoverBackgroundColor: "{colors.primary-hover}"

  button-primary-disabled:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.muted}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px

  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    hoverBackgroundColor: "{colors.surface-subtle}"
    hoverTextColor: "{colors.ink}"

  button-nav:
    backgroundColor: "transparent"
    textColor: "#8B8B9A"
    typography: "{typography.button}"
    rounded: "{rounded.3xl}"
    padding: 16px 20px
    hoverBackgroundColor: "{colors.primary-hover}"
    hoverTextColor: "#FFFFFF"

  button-nav-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.3xl}"
    padding: 16px 20px
    boxShadow: "0 4px 16px {colors.primary-glow}"

  card-stat:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.3xl}"
    padding: 20px 24px
    border: "1px solid {colors.hairline}"
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    hoverBorder: "{colors.hairline-hover}"
    hoverBoxShadow: "0 8px 24px rgba(0,0,0,0.08)"
    hoverTranslateY: -3px

  card-chart:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.3xl}"
    padding: 24px
    border: "1px solid {colors.hairline}"
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)"

  badge-status:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    rounded: "{rounded.full}"
    padding: 4px 12px
    border: none

  badge-success:
    extends: badge-status
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-text}"

  badge-warning:
    extends: badge-status
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-text}"

  badge-danger:
    extends: badge-status
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger-text}"

  badge-info:
    extends: badge-status
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info-text}"

  badge-neutral:
    extends: badge-status
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text}"

  modal:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.2xl}"
    border: "1px solid #E5E7EB"
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
    padding: 0

  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.hairline}"
    padding: 8px 12px
    typography: "{typography.body-md}"
    focusBorder: "{colors.primary}"

  progress-bar:
    backgroundColor: "{colors.surface-subtle}"
    fillColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: 8px
---

## Overview

MatchIQ is a CS2 and Dota2 match analytics and betting intelligence dashboard.
It reads like a precision instrument: analytical, focused, and calm.

The base canvas is pure white `{colors.canvas}` (#FFFFFF) in light mode and deep
navy `{colors.canvas-dark}` (#0F172A) in dark mode. The single brand color is a
clean cobalt blue `{colors.primary}` (#447afc) that carries navigation, CTAs,
progress bars, and the brand wordmark. There is no secondary brand color — the
blue does all the brand work.

Depth comes from borders, not shadows. Cards sit on the canvas with a 1px
`{colors.hairline}` (#F3F4F6) border and a barely-there shadow. On hover, the
border deepens to `{colors.hairline-hover}` (#D1D5DB) and the card lifts 3px
with a gentle shadow — subtle, not dramatic.

Status badges use a semantic color system with full-rounded pills: green for
success/win, red for danger/loss, yellow for warning, blue for info, gray for
neutral. Every status color has a dedicated background/text pair.

The dashboard is data-dense. Large bold values (`{typography.value-lg}` at 40px)
anchor stat cards. Labels sit at 14px medium weight. Secondary text and captions
use muted grays (`{colors.muted}` #6B7280 and `{colors.subtle}` #9CA3AF).

**Key Characteristics:**
- Single accent color: `{colors.primary}` (#447afc) carries navigation, CTAs,
  progress, and the brand wordmark. Used scarcely so it stays meaningful.
- Hairline depth: Cards separate from canvas via 1px borders, not drop shadows.
  Shadow is reserved for hover and modals.
- Border-radius jumps from 8px (buttons, inputs) to 24px (cards, nav items).
  This contrast between small and large radii creates visual rhythm.
- Typography is system sans-serif — fast to load, sharp on all OSes.
- Data-first layout: stat cards in grids, charts in dedicated cards, tables for
  detailed records. Every pixel serves the data.
- Ukrainian primary language with i18n support.
- Dark and light theme via CSS custom properties and Tailwind `dark:` variants.

## Colors

### Brand & Accent
- **Cobalt Blue** (`{colors.primary}` — #447afc): The single brand color. Used
  on active navigation items, primary buttons, progress bars, and the brand
  wordmark. Hover state: `{colors.primary-hover}` (#5b8ffd).
- **Primary Glow** (`{colors.primary-glow}` — rgba(68,122,252,0.3)): Shadow
  color for active nav items, giving them a soft blue halo.

### Surface
- **Canvas** (`{colors.canvas}` — #FFFFFF): The default page floor in light
  mode. Pure white, clean, maximally neutral.
- **Canvas Dark** (`{colors.canvas-dark}` — #0F172A): Deep navy page floor in
  dark mode. Dark enough to reduce glare, blue enough to feel intentional.
- **Surface Card** (`{colors.surface-card}` — #FFFFFF): White card plates in
  light mode. Same as canvas, but separated by hairline borders.
- **Surface Card Dark** (`{colors.surface-card-dark}` — #1E293B): Dark card
  plates. Slightly lighter than canvas-dark for layering.
- **Surface Subtle** (`{colors.surface-subtle}` — #F9FAFB): Near-white
  background for hover states, selected rows, and secondary surfaces.
- **Surface Hover** (`{colors.surface-hover}` — #EFF6FF): Very light blue
  background for icon containers and hover highlights.

### Hairlines
- **Hairline** (`{colors.hairline}` — #F3F4F6): Default 1px card and input
  borders in light mode. Almost invisible — just enough to define edges.
- **Hairline Dark** (`{colors.hairline-dark}` — #334155): Default borders in
  dark mode.
- **Hairline Hover** (`{colors.hairline-hover}` — #D1D5DB): Border color on
  card hover. Subtle darkening signals interactivity.

### Text
- **Ink** (`{colors.ink}` — #111827): Primary text — headings, card titles,
  large values. Near-black for maximum contrast.
- **Body** (`{colors.body}` — #374151): Secondary body text. Darker than muted
  but not as commanding as ink.
- **Muted** (`{colors.muted}` — #6B7280): Tertiary text — descriptions,
  secondary labels, placeholder content.
- **Subtle** (`{colors.subtle}` — #9CA3AF): Quietest text — captions,
  timestamps, "no data" states. Used sparingly.

### Semantic
- **Success** — bg `{colors.success-bg}` (#F0FDF4), text `{colors.success-text}`
  (#16A34A). For wins, completed goals, positive trends.
- **Warning** — bg `{colors.warning-bg}` (#FEF3C7), text `{colors.warning-text}`
  (#D97706). For risky teams, pending states, caution.
- **Danger** — bg `{colors.danger-bg}` (#FEE2E2), text `{colors.danger-text}`
  (#DC2626). For losses, failed goals, banned teams.
- **Info** — bg `{colors.info-bg}` (#DBEAFE), text `{colors.info-text}`
  (#2563EB). For informational badges, tips, hints.
- **Neutral** — bg `{colors.neutral-bg}` (#F3F4F6), text `{colors.neutral-text}`
  (#6B7280). For "no status", inactive, empty states.

## Typography

MatchIQ uses the system font stack: `system-ui, -apple-system, sans-serif`.
No custom web fonts are loaded — the dashboard prioritizes instant rendering
and native OS sharpness over brand-unique typography.

The scale is built for a data dashboard, not a marketing site. Two hierarchies
coexist:

### Data Hierarchy (stat cards, KPIs)
- `{typography.value-lg}` (40px / 700) — Hero KPI values in stat cards.
- `{typography.value-md}` (28px / 700) — Secondary values, smaller KPIs.
- `{typography.label}` (14px / 500) — Stat card labels, section headers.
- `{typography.caption}` (12px / 400) — Subtext, timestamps, metadata.

### Content Hierarchy (pages, prose)
- `{typography.hero-display}` (48px / 700 / -0.04em) — Landing page hero only.
- `{typography.display-lg}` (36px / 700 / -0.03em) — Page titles.
- `{typography.heading-lg}` (24px / 600 / -0.02em) — Section headers in pages.
- `{typography.heading-md}` (18px / 600 / -0.01em) — Card titles.
- `{typography.body-lg}` (16px / 400) — Main body, form labels, table cells.
- `{typography.body-md}` (14px / 400) — Secondary body, descriptions.
- `{typography.button}` (14px / 500) — Buttons and interactive text.
- `{typography.button-sm}` (12px / 500) — Small buttons, chip labels.

### Principles
- Values are always bold. Labels are medium. Descriptions are regular.
- Tracking goes negative on large values (tightens them) and slightly positive
  on uppercase labels (spreads them for legibility).
- No italic in the UI. Italic is reserved for quotes and empty-state messages.
- The scale uses even numbers (12→14→16→18→24→36→40→48) for clean Tailwind
  mapping.

## Layout

### Grid & Container
- Page content max-width: 1400px, centered with 32px padding.
- Dashboard uses CSS Grid with `repeat(auto-fill, minmax(...))` for responsive
  stat card layouts.
- Sidebar navigation is 240px wide, fixed on desktop, off-canvas sheet on mobile.

### Spacing System
All spacing follows an 4px base unit:
- `{spacing.xs}` 4px — icon-to-text gaps, tight inline spacing
- `{spacing.sm}` 8px — element gaps within a group
- `{spacing.md}` 12px — inter-element spacing in forms
- `{spacing.base}` 16px — standard gap between components
- `{spacing.lg}` 20px — card padding vertical
- `{spacing.xl}` 24px — card padding horizontal, section gaps
- `{spacing.2xl}` 32px — page padding, large section breaks
- `{spacing.section}` 64px — major page section separation

### Whitespace Philosophy
The dashboard is dense but never cramped. Cards are separated by 16-24px gaps.
Sections get 32px breathing room. The landing page uses more generous spacing
with 64px section gaps. No content touches the viewport edge — minimum 16px
padding on mobile, 32px on desktop.

## Elevation

MatchIQ uses a minimal elevation system. The guiding principle: borders for
separation, shadows for interaction.

| Tier | Description | Usage |
|------|-------------|-------|
| 0 (flat) | No shadow, no border, or hairline border only | Canvas, card rest state |
| 1 (hairline lift) | 1px `{colors.hairline}` border + `0 1px 2px rgba(0,0,0,0.04)` | Stat cards at rest |
| 2 (hover lift) | `{colors.hairline-hover}` border + `0 8px 24px rgba(0,0,0,0.08)` + translateY(-3px) | Card hover state |
| 3 (chart) | `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)` | Chart cards (always elevated) |
| 4 (modal) | `0 25px 50px -12px rgba(0,0,0,0.25)` | Modals and dialogs |

Dark mode uses darker borders and slightly more transparent shadows, but the
same tier system.

## Components

**`button-primary`** — The signature blue CTA. Background `{colors.primary}`,
text `{colors.primary-foreground}`, type `{typography.button}`, rounded
`{rounded.md}` (8px), padding 10px × 20px. Hover: `{colors.primary-hover}`.
Disabled: `{colors.neutral-bg}` with `{colors.muted}` text.

**`button-ghost`** — Transparent secondary button. Text `{colors.muted}`,
hover bg `{colors.surface-subtle}` with `{colors.ink}` text. Used for
filter toggles, secondary actions, icon buttons.

**`button-nav`** — Sidebar navigation item. Rounded `{rounded.3xl}` (24px),
padding 16px × 20px. Text color #8B8B9A (custom gray). Hover: bg
`{colors.primary-hover}` with white text. Active: bg `{colors.primary}`
with white text and `{colors.primary-glow}` shadow.

**`card-stat`** — The primary data card. White background, `{rounded.3xl}`
(24px) corners, 1px `{colors.hairline}` border, subtle shadow. On hover:
border shifts to `{colors.hairline-hover}`, shadow deepens, card lifts 3px.
Contains: icon + label row, large value, optional subtext. Max 3 cards per
row on desktop, 1 on mobile.

**`card-chart`** — Chart container card. Same as stat card but with a
slightly deeper shadow and no hover lift (charts are static). Full-width
by default, pairs side-by-side on large screens.

**`badge-status`** — Full-rounded pill badge. 14px medium type, 4px × 12px
padding, `{rounded.full}`. Five semantic variants: success (green),
warning (yellow), danger (red), info (blue), neutral (gray). Used for
team risk status, bet results, goal states.

**`modal`** — Dialog overlay. White background, `{rounded.2xl}` (20px),
1px #E5E7EB border, deep shadow. Zero internal padding — content sections
handle their own spacing. Header: icon + title + description. Body: form
or content. Max height 85vh with overflow scroll.

**`input`** — Text input field. White background, `{rounded.md}` (8px),
1px `{colors.hairline}` border, 8px × 12px padding, `{typography.body-md}`.
Focus: border `{colors.primary}` with ring.

**`progress-bar`** — Horizontal progress indicator. Background
`{colors.surface-subtle}`, fill `{colors.primary}`, `{rounded.full}`,
8px height. Used for goal progress and completion tracking.

## Responsive Behavior

- **Desktop (≥1024px)**: Full sidebar navigation, multi-column stat grids,
  side-by-side charts, full data tables.
- **Tablet (768-1023px)**: Collapsed sidebar (icons only or hamburger),
  2-column stat grids, stacked charts.
- **Mobile (<768px)**: Off-canvas sheet navigation (hamburger trigger),
  single-column stats, 100% width charts, simplified tables with horizontal
  scroll.

Breakpoints follow Tailwind defaults: `sm: 640px`, `md: 768px`, `lg: 1024px`,
`xl: 1280px`, `2xl: 1536px`.

Navigation collapses from full sidebar (desktop) → hamburger sheet (mobile).
Cards stack from 3-column → 2-column → 1-column. Tables add horizontal scroll
on mobile.

## Known Gaps

- No custom font loaded — relies on system sans-serif. Acceptable for a
  data dashboard but limits brand distinctiveness in marketing contexts.
- Dark mode coverage is partial — not all components have been tested in
  dark mode. The token system supports it, but implementation is ongoing.
- No motion/animation design tokens defined. Current animations use Tailwind
  utilities (`transition-all duration-300`) ad-hoc.
- No print stylesheet or export-optimized layout.
- Chart colors (Recharts) are not tokenized — they use Recharts defaults
  or inline values.
- The primary blue (#447afc) contrast against white background passes WCAG
  AA but not AAA for small text.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS 4 + `tailwindcss-animate` + `@tailwindcss/aspect-ratio`
- **UI Primitives**: shadcn/ui (Radix-based) — 50 components
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v6 with lazy-loaded routes
- **State**: Zustand (app-level) + localStorage (user data)
- **Toasts**: Sonner
- **Forms**: react-hook-form + zod (via shadcn/ui form)
- **Package Manager**: pnpm
- **Linting**: ESLint 9 + TypeScript
- **Testing**: Vitest (unit) + Playwright (e2e)
