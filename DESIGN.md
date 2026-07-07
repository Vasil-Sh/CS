---

version: "1.0"
name: MatchIQ
designSystem: "Seline Analytics — Quiet analyst's desk on warm paper"
description: >
A sports betting analytics dashboard with a calm, editorial SaaS aesthetic
inspired by Seline Analytics. A warm-stone canvas (#fafaf9) with a single
vivid cyan accent (#3ba6f1) as the only chromatic voice. Flat white cards
float on 1px stone hairlines instead of heavy shadows. Headings use
Inter Tight at weight 400 with tight negative tracking — whispered
authority rather than SaaS shout. Body is 14px Inter with generous
1.64 line-height. Pill-shaped cyan CTAs are the loudest element by
deliberate restraint of everything else. No gradients, no heavy shadows
(one 16px-blur reserved for hero preview).

colors:

# ═══ Brand — the ONLY chromatic voice ═══

primary: "#3ba6f1" # Cyan Signal — primary CTA fill, active links, brand icon strokes
primary-edge: "#3398e1" # Cyan Edge — outlined action borders, linked labels, lightweight emphasis
primary-wash: "#c1e1f7" # Sky Wash — soft highlight behind text spans, decorative blue tint
primary-foreground: "#FFFFFF"

# ═══ Neutrals — Stone scale ═══

ink: "#0c0a09" # Ink Black — primary headings, emphasized body, warm near-black
soot: "#1c1917" # Soot — dark surface backgrounds, inverted sections
body: "#78716c" # Warm Gray — body text, nav links, secondary copy
muted: "#a8a29e" # Ash Gray — helper text, icon strokes, disabled states
stone-muted: "#d6d3d1" # Stone Muted — secondary borders, subtle tints
stone-border: "#e8e6e5" # Stone Border — hairline borders on cards, nav, inputs (THE structural device)
canvas: "#fafaf9" # Stone Canvas — page background, warm off-white, paper-like
card: "#ffffff" # Pure White — card surfaces, elevated panels, input fills

# ═══ Semantic ═══

success-bg: "#f0fdf7"
success-text: "#22c55e"
warning-bg: "#fffbf5"
warning-text: "#f59e0b"
danger-bg: "#fef2f2"
danger-text: "#ef4444"
info-bg: "#eff8ff"
info-text: "#3ba6f1"

typography:

# ═══ Display — Inter Tight (Roobert fallback) ═══

display:
fontFamily: '"Inter Tight", Satoshi, Inter, system-ui, sans-serif'
fontSize: 52px
fontWeight: 400
lineHeight: 1.12
letterSpacing: -0.021em

heading-sm:
fontFamily: '"Inter Tight", Satoshi, Inter, system-ui, sans-serif'
fontSize: 32px
fontWeight: 400
lineHeight: 1.25
letterSpacing: -0.025em

subheading:
fontFamily: '"Inter Tight", Satoshi, Inter, system-ui, sans-serif'
fontSize: 20px
fontWeight: 400
lineHeight: 1.2
letterSpacing: 0

# ═══ Body — Inter ═══

body-lg:
fontFamily: "Inter, system-ui, -apple-system, sans-serif"
fontSize: 16px
fontWeight: 400
lineHeight: 1.69
letterSpacing: 0

body:
fontFamily: "Inter, system-ui, -apple-system, sans-serif"
fontSize: 14px
fontWeight: 400
lineHeight: 1.64
letterSpacing: 0.004em

body-sm:
fontFamily: "Inter, system-ui, -apple-system, sans-serif"
fontSize: 13px
fontWeight: 400
lineHeight: 1.54
letterSpacing: 0

caption:
fontFamily: "Inter, system-ui, -apple-system, sans-serif"
fontSize: 12px
fontWeight: 400
lineHeight: 1.4
letterSpacing: 0

label:
fontFamily: "Inter, system-ui, -apple-system, sans-serif"
fontSize: 14px
fontWeight: 500
lineHeight: 1.3
letterSpacing: 0

button:
fontFamily: "Inter, system-ui, -apple-system, sans-serif"
fontSize: 14px
fontWeight: 400
lineHeight: 1
letterSpacing: 0

spacing:
base-unit: 4px
xs: 4px
sm: 8px
md: 12px
base: 16px
lg: 20px
xl: 24px
"2xl": 32px
section-gap: 96px
card-padding: 24px
element-gap: 8px
max-width: 1200px
page-padding: 24px

rounded:
icons: 4px
inputs: 6px
cards: 10px
feature-cards: 16px
buttons: 9999px
modal: 20px

elevation:
content-card: "none — flat, 1px border only"
floating-preview: "0 8px 48px rgba(0,0,0,0.06) — ONE per page max"
nav: "0 1px 0 #e8e6e5 — hairline bottom border"
icon-chip: "none — flat"

components:
button-primary:
backgroundColor: "{colors.primary}"
textColor: "{colors.primary-foreground}"
typography: "{typography.button}"
rounded: "{rounded.buttons}"
padding: "8px 16px"
boxShadow: "none"
hoverBackgroundColor: "{colors.primary-edge}"

button-outline:
backgroundColor: "transparent"
textColor: "{colors.body}"
typography: "{typography.button}"
rounded: "{rounded.buttons}"
padding: "8px 16px"
border: "1px solid {colors.stone-border}"
hoverBorder: "{colors.stone-muted}"
hoverTextColor: "{colors.ink}"

card-content:
backgroundColor: "{colors.card}"
border: "1px solid {colors.stone-border}"
rounded: "{rounded.cards}"
padding: "{spacing.card-padding}"
boxShadow: "none"

card-feature:
extends: card-content
rounded: "{rounded.feature-cards}"
hoverBorder: "{colors.primary}/30"
hoverTranslateY: -2px

input:
backgroundColor: "{colors.card}"
border: "1px solid {colors.stone-border}"
rounded: "{rounded.inputs}"
padding: "8px 12px"
typography: "{typography.body}"

nav-link:
typography: "{typography.body}"
textColor: "{colors.body}"
hoverTextColor: "{colors.ink}"

divider:
backgroundColor: "{colors.stone-border}"
height: 1px

highlight-span:
textColor: "{colors.primary-edge}"
pillBackground: "{colors.primary-wash}"
maxPerHeadline: 1

guidelines:
do: - "Use Inter Tight at weight 400 for all display/heading sizes — never bump to 600/700" - "Use #fafaf9 as page background and #ffffff only for card surfaces" - "Apply exactly one cyan highlight per headline (#3398e1 text + #c1e1f7 pill)" - "Use 1px #e8e6e5 borders as THE structural separator inside cards" - "Keep buttons pill-shaped (rounded-full) with 8px 16px padding" - "Set body copy at 14px Inter weight 400 with 1.64 line-height" - "The cyan filled CTA must be the only chromatic filled element on screen" - "Section gap is 96px (py-24), max-width is 1200px"

dont: - "Do NOT introduce new accent colors — palette is stone neutrals + one cyan" - "Do NOT use heavy drop shadows on content cards (one floating shadow max)" - "Do NOT set headlines in Inter — Inter Tight at display sizes is the brand voice" - "Do NOT use #ffffff as page background — always #fafaf9" - "Do NOT fill buttons with dark/neutral colors for primary actions — cyan only" - "Do NOT add gradients, glassmorphism, or decorative color washes" - "Do NOT stack multiple cyan highlight spans in one headline" - "Do NOT use bold (weight 600/700) for headings — weight 400 is the signature"
