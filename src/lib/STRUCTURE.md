# lib/ Structure

## Current Organization (flat, with barrel export)

```
lib/
├── index.ts              ← Barrel export (optional, not yet adopted in imports)
│
├── api/                  ← API clients
│   ├── apiClient.ts      JWT-aware fetch wrapper (foundation for all API calls)
│   ├── csApi.ts          External CS match API (api.cstest.pp.ua)
│   └── googleSheetsRiskyTeams.ts  Risky teams API client
│
├── services/             ← Business logic
│   ├── authService.ts    JWT auth (login, register, user CRUD)
│   ├── bankrollService.ts  Bankroll management (API-first since v1.23)
│   └── userDataService.ts   User data CRUD (API-first, localStorage cache)
│
├── ai/                   ← AI / ML
│   ├── shared.ts         Shared types + prompt builder
│   └── deepSeekService.ts  DeepSeek recommendations with local cache
│
├── parsing/              ← Text/URL parsing
│   ├── matchUrlParser.ts   HLTV/Dota2 URL parser
│   └── expressParser.ts    Express bet string parser
│
├── utils/                ← Utilities
│   ├── utils.ts            cn(), date normalization
│   ├── displayHelpers.ts   UI badges, emojis
│   ├── cardStyles.ts       CSS-in-JS card style constants
│   ├── chartColors.ts      Chart palette tokens for Recharts
│   ├── i18n.ts             UK/EN translations
│   ├── devLogger.ts        Dev-time perf monitoring
│   ├── errorMonitor.ts     Production error reporting
│   └── envValidation.ts    Zod env var validation
│
└── analytics/            ← Math & calculations
    ├── analytics.ts        Match probability algorithm
    └── betCalculations.ts  EV, Kelly criterion, value bets
```

## Migration Plan (when ready)

To physically restructure into subdirectories:
1. Move files into `api/`, `services/`, `ai/`, `utils/`, `analytics/`, `parsing/`
2. Update `index.ts` barrel exports to point to new paths
3. Update 50+ component imports from `@/lib/X` to `@/lib/api/X` etc.
4. Or: keep flat imports via re-exports in sub-barrels

**Risk**: 50+ component files import from `@/lib/*` directly.
**Current approach**: Barrel export (`index.ts`) provides clean API;
components can gradually migrate to it.
