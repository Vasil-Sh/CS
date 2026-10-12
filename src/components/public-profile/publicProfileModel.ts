export type GameFilter = "all" | "cs2" | "dota2";
export type PeriodFilter = "all" | "30d" | "90d" | "365d";
export type DisplayCurrency = "UAH" | "USD";
export interface PublicBet {
  match: string;
  team1?: string;
  team2?: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  betType?: string;
  result: string;
  profit: number | null;
  currency: string;
  odds: number;
  date: string;
  game: string;
}
export interface PublicProfileData {
  schemaVersion: 2;
  username: string;
  telegram?: string;
  filters: { game: GameFilter; period: PeriodFilter };
  exchangeRate: number | null;
  exchangeRateSource: "profile" | "last-bet" | null;
  stats: {
    totalBets: number;
    completedBets: number;
    pendingBets: number;
    wins: number;
    losses: number;
    refunds: number;
    winRate: number | null;
    roi: number | null;
    avgOdds: number | null;
    displayProfit: number | null;
    profitUAH: number;
    profitUSD: number;
    conversionComplete: boolean;
  };
  recentBets: PublicBet[];
  monthlyProfit: { month: string; profit: number | null; count: number }[];
}
export const gameOptions = [
  { value: "all", label: "Усі", cardLabel: "Усі ігри" },
  { value: "cs2", label: "CS2", cardLabel: "CS2" },
  { value: "dota2", label: "Dota 2", cardLabel: "Dota 2" },
] as const;
export const periodOptions = [
  { value: "all", label: "За весь час" },
  { value: "30d", label: "Останні 30 днів" },
  { value: "90d", label: "Останні 90 днів" },
  { value: "365d", label: "Останні 365 днів" },
] as const;
export function readProfileFilters(params: URLSearchParams) {
  const game = params.get("game");
  const period = params.get("period");
  return {
    game: (gameOptions.some((o) => o.value === game)
      ? game
      : "all") as GameFilter,
    period: (periodOptions.some((o) => o.value === period)
      ? period
      : "all") as PeriodFilter,
    currency: (params.get("currency") === "USD"
      ? "USD"
      : "UAH") as DisplayCurrency,
  };
}
export const formatNumber = (value: number | null, decimals = 0) =>
  value === null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("uk-UA", { maximumFractionDigits: decimals });
export const signedNumber = (value: number | null) =>
  value === null
    ? "—"
    : `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value), 2)}`;
export const displayValue = (
  value: number | null,
  currency: DisplayCurrency,
  rate: number | null,
) =>
  value === null
    ? null
    : currency === "UAH"
      ? value
      : rate && rate > 0
        ? value / rate
        : null;
export const resultLabel = (result: string) =>
  ({
    Win: "Виграш",
    Loss: "Програш",
    Pending: "Очікується",
    Refund: "Повернення",
    Void: "Скасовано",
    Push: "Повернення",
  })[result] || "Очікується";
export function monthLabel(value: string) {
  const date = new Date(`${value}-01T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("uk-UA", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      })
    : value;
}
export function betDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
}
