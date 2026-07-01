/** Chart color tokens — use with Recharts */
export const chartColors = {
  primary: 'hsl(224, 92%, 63%)',    // #447afc
  success: 'hsl(142, 71%, 45%)',    // green
  warning: 'hsl(38, 92%, 50%)',     // amber
  purple: 'hsl(262, 83%, 58%)',
  danger: 'hsl(0, 72%, 51%)',       // red
  cyan: 'hsl(199, 89%, 48%)',
  violet: 'hsl(271, 91%, 65%)',
} as const;

/** Default palette for multi-series charts */
export const chartPalette = [
  chartColors.primary,
  chartColors.cyan,
  chartColors.purple,
  chartColors.warning,
  chartColors.success,
  chartColors.danger,
] as const;

/** Profit/loss colors */
export const profitColor = chartColors.success;
export const lossColor = chartColors.danger;
