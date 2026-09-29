import type { Bet } from "@/types/betting";
export type DateRange = { start: string; end: string };
const DAY = 86400000;
export const dayNumber = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`) / DAY;
export const rangeDays = (range: DateRange) => dayNumber(range.end) - dayNumber(range.start) + 1;
export const isValidRange = (range: DateRange) => Number.isFinite(rangeDays(range)) && rangeDays(range) >= 1 && rangeDays(range) <= 366;
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function initialPeriods(today = new Date()): [DateRange, DateRange] {
  const year = today.getFullYear(), month = today.getMonth(), day = today.getDate();
  return [{ start: dateKey(new Date(year, month, 1)), end: dateKey(today) },
    { start: dateKey(new Date(year, month - 1, 1)), end: dateKey(new Date(year, month - 1, Math.min(day, new Date(year, month, 0).getDate()))) }];
}
export function periodRecords(bets: Bet[], range: DateRange) {
  return bets.filter(b => (b.result === "Win" || b.result === "Loss") && dayNumber(b.date) >= dayNumber(range.start) && dayNumber(b.date) <= dayNumber(range.end));
}
export function periodStats(bets: Bet[]) {
  const count = bets.length, wins = bets.filter(b => b.result === "Win").length;
  const profit = bets.reduce((sum, b) => sum + (Number.isFinite(b.profit) ? b.profit! : 0), 0);
  const stake = bets.reduce((sum, b) => sum + (Number.isFinite(b.amount) ? b.amount : 0), 0);
  const odds = bets.filter(b => Number.isFinite(b.odds) && b.odds >= 1);
  return { count, wins, losses: count - wins, profit, roi: stake > 0 ? profit / stake * 100 : null, winRate: count ? wins / count * 100 : null, avgOdds: odds.length ? odds.reduce((sum, b) => sum + b.odds, 0) / odds.length : null };
}
export function periodTrend(bets: Bet[], ranges: [DateRange, DateRange]) {
  const series = ranges.map(range => {
    const daily = new Map<number, number>();
    periodRecords(bets, range).forEach(b => { const index = dayNumber(b.date) - dayNumber(range.start); daily.set(index, (daily.get(index) ?? 0) + (Number.isFinite(b.profit) ? b.profit! : 0)); });
    let sum = 0;
    return Array.from({ length: rangeDays(range) }, (_, index) => { sum += daily.get(index) ?? 0; return Math.round(sum * 100) / 100; });
  });
  return Array.from({ length: Math.max(...ranges.map(rangeDays)) }, (_, index) => ({ day: index + 1, first: series[0][index] ?? null, second: series[1][index] ?? null }));
}
export const gameName = (game?: string) => game === "CS" || game === "CS2" ? "CS2" : game === "Dota" || game === "Dota2" || game === "Dota 2" ? "Dota 2" : game || "Без гри";
