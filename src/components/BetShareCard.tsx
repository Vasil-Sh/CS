import PosterShareArtwork from "./PosterShareArtwork";
import { getBetTypeLabel } from "@/lib/displayHelpers";
import type { Bet } from "@/types/betting";
import "./BetShareCard.css";

interface BetShareCardProps {
  bet: Bet;
  compact?: boolean;
}

export function shareMoney(value: number, currency = "UAH", signed = false) {
  const number = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${value < 0 ? "−" : signed && value > 0 ? "+" : ""}${number} ${currency === "USD" ? "$" : "₴"}`;
}

export function shareResult(bet: Bet): number | null {
  if (bet.result === "Pending") return null;
  if (bet.originalProfit != null) return bet.originalProfit;
  if (bet.profit != null) {
    if (bet.currency === "USD")
      return bet.exchangeRate && bet.exchangeRate > 0
        ? bet.profit / bet.exchangeRate
        : null;
    return bet.profit;
  }
  const amount = bet.originalAmount ?? bet.amount;
  return bet.result === "Loss" ? -amount : amount * (bet.odds - 1);
}

export function shareDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return { date: value, time: "" };
  return {
    date: date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: /[T ]\d{2}:\d{2}/.test(value)
      ? date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
      : "",
  };
}

export default function BetShareCard({ bet }: BetShareCardProps) {
  const game = bet.game?.toLowerCase() === "dota2" ? "dota2" : "cs2";
  const teams = bet.match.split(/\s+vs\.?\s+/i);
  const team1 = bet.team1 || teams[0] || "Команда 1";
  const team2 = bet.team2 || teams[1] || "Команда 2";
  const express =
    /Експрес|Express/i.test(bet.betType) || /\d+x/i.test(bet.format ?? "");
  const events = express
    ? bet.betType
        .split("|")
        .slice(1)
        .join("|")
        .split("•")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const splitAt = bet.betType.indexOf(" - ");
  const selection =
    bet.selection || (splitAt >= 0 ? bet.betType.slice(splitAt + 3) : "");
  const market = getBetTypeLabel(
    splitAt >= 0 ? bet.betType.slice(0, splitAt) : bet.betType,
    bet.format,
  )
    .replace(/MatchWinner|Match Winner/g, "Переможець матчу")
    .replace(/MapWinner|Map Winner/g, "Переможець карти");
  const tournament = (
    bet.tournament || (express ? "Експрес" : "Запис матчу")
  ).split(/\s+[—–]\s+|\s+-\s+(?=group|група)/i);
  const date = shareDate(bet.date);
  const result = shareResult(bet);
  const status =
    bet.result === "Win"
      ? "Виграш"
      : bet.result === "Loss"
        ? "Програш"
        : "Очікується";
  return (
    <article
      id="bet-share-card-inner"
      className="mi-share mi-share-poster"
      data-result={bet.result}
      aria-label="Картка запису для поширення"
    >
      <PosterShareArtwork
        team1={team1}
        team2={team2}
        tournament={tournament}
        game={game === "dota2" ? "Dota 2" : "CS2"}
        format={bet.format}
        date={date}
        market={express ? "Експрес" : market}
        selection={express ? bet.match : selection || "Не вказано"}
        odds={bet.odds}
        amount={shareMoney(bet.originalAmount ?? bet.amount, bet.currency)}
        result={result == null ? "—" : shareMoney(result, bet.currency, true)}
        status={status}
        state={bet.result}
        express={express}
        events={events}
      />
      <span className="sr-only">{status}</span>
    </article>
  );
}
