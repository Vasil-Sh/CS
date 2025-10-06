# CS2 Betting Analytics Dashboard

CS2 betting analytics application with advanced risk management and data visualization.

## Features

- **9 Analytics Tabs**: Profit, Odds, Activity, Teams, Periods, Predictions, Recommendations, Risks, Insights
- **Risk Management**: Sharpe ratio, Kelly criterion, risk alerts
- **Data Visualization**: Interactive charts and tables
- **Responsive Design**: Modern UI with shadcn-ui components

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

All shadcn/ui components have been downloaded under `@/components/ui`.

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration
- `src/pages/Analytics.tsx` - Main analytics dashboard
- `src/components/RiskManagement.tsx` - Risk analysis component

## Commands

**Install Dependencies**

```shell
pnpm i
```

**Add Dependencies**

```shell
pnpm add some_new_dependency
```

**Start Preview**

```shell
pnpm run dev
```

**To build**

```shell
pnpm run build
```

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration
- The `@/` path alias points to the `src/` directory