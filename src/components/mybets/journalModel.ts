import type { Bet } from "@/types/betting";
import { getBetTypeLabel } from "@/lib/displayHelpers";

export const journalKey = (bet: Bet) =>
  bet.id ||
  [bet.date, bet.match, bet.amount, bet.odds, bet.createdAt].join("|");
export const journalExpress = (bet: Bet) =>
  /Експрес/i.test(bet.betType) || /\dx/i.test(bet.format || "");
export const journalSelection = (bet: Bet) =>
  bet.selection || bet.betType.split(" - ").slice(1).join(" - ") || "—";
export const journalMarket = (bet: Bet) =>
  getBetTypeLabel(bet.betType.split(" - ")[0], bet.format);
export const journalStatus = (bet: Bet) =>
  ({ Win: "Виграш", Loss: "Програш", Pending: "Очікує" })[bet.result] ||
  bet.result;
export function journalAmount(bet: Bet): number | null {
  if (bet.originalAmount != null) return Number(bet.originalAmount);
  if (bet.currency !== "USD") return Number(bet.amount);
  return Number(bet.exchangeRate) > 0
    ? Number(bet.amount) / Number(bet.exchangeRate)
    : null;
}
export function journalProfit(bet: Bet): number | null {
  if (bet.result === "Pending") return null;
  if (bet.currency === "USD") {
    if (bet.profit != null && Number(bet.exchangeRate) > 0)
      return Number(bet.profit) / Number(bet.exchangeRate);
    return bet.originalProfit != null ? Number(bet.originalProfit) : null;
  }
  return bet.profit != null
    ? Number(bet.profit)
    : bet.originalProfit != null
      ? Number(bet.originalProfit)
      : null;
}
export const journalMoney = (
  value: number | null,
  currency?: string,
  signed = false,
) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : (signed && value > 0 ? "+" : "") +
      new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(
        value,
      ) +
      (currency === "USD" ? " $" : " ₴");
export function journalDate(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { day: raw, time: "" };
  return {
    day: date.toLocaleDateString("uk-UA"),
    time: /T\d{2}:\d{2}/.test(raw)
      ? date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
      : "",
  };
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+@\-\t\r]/.test(text) ? "'" : "") +
    text.replace(/"/g, '""') +
    '"'
  );
}
