import type { Bet } from "@/types/betting";
import {
  journalExpress,
  journalSelection,
} from "@/components/mybets/journalModel";
import { parseExpressEvents } from "@/lib/parser/expressParser";

export const profileDate = (date: Date) =>
  Number.isFinite(date.getTime())
    ? date.toLocaleString("uk-UA", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Дата не вказана";

export function recordDate(bet: Bet) {
  return [bet.createdAt, bet.date].find(
    (value) => value && Number.isFinite(Date.parse(value)),
  );
}

export function recentRecords(bets: Bet[]) {
  return [...bets]
    .sort(
      (a, b) =>
        (Date.parse(recordDate(b) || "") || 0) -
        (Date.parse(recordDate(a) || "") || 0),
    )
    .slice(0, 3);
}

export function recordSummary(bet: Bet) {
  const express = journalExpress(bet);
  const teams = express ? [] : bet.match.split(/\s+(?:vs\.?|v\.?|проти)\s+/i);
  const team1 = bet.team1 || teams[0] || "";
  const team2 = bet.team2 || teams[1] || "";
  const eventCount = express ? parseExpressEvents(bet.betType).length : 0;
  const selection = journalSelection(bet);
  return {
    express,
    team1,
    team2,
    title: express ? bet.match.split("|")[0].trim() || "Експрес" : bet.match,
    description: express
      ? `${eventCount ? `${eventCount} подій · ` : ""}Коефіцієнт ${bet.odds.toLocaleString("uk-UA")}`
      : `Одинар · ${selection !== "—" ? selection : bet.betType || "Запис журналу"}`,
    game: /dota|дота/i.test(bet.game || "")
      ? "Dota 2"
      : /cs/i.test(bet.game || "")
        ? "CS2"
        : "—",
  };
}
