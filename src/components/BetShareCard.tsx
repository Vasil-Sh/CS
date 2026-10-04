import { useEffect, useRef, useState } from "react";
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

function TeamLogo({
  src,
  name,
  game,
}: {
  src?: string | null;
  name: string;
  game: string;
}) {
  const fallback = `/assets/team-placeholder-${game === "dota2" ? "dota" : "cs2"}.svg`;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <img
      src={!failed && src ? src : fallback}
      alt={name}
      crossOrigin={src?.startsWith("http") ? "anonymous" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

export default function BetShareCard({ bet }: BetShareCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [unit, setUnit] = useState(16);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setUnit(Math.min(node.clientWidth / 35, 14));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
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
      ref={ref}
      id="bet-share-card-inner"
      className="mi-share"
      data-result={bet.result}
      style={{ fontSize: unit }}
      aria-label="Картка запису для поширення"
    >
      <header className="mi-share-header">
        <div className="mi-share-brand">
          Match<span>IQ</span>
        </div>
        <div className="mi-share-tournament">
          <strong>{tournament[0]}</strong>
          {tournament.length > 1 && (
            <span>{tournament.slice(1).join(" — ")}</span>
          )}
        </div>
      </header>
      <div className="mi-share-meta">
        <div>
          <img src={`/assets/game-${game}.svg`} alt="" />
          <strong>{game === "dota2" ? "Dota 2" : "CS2"}</strong>
          {bet.format && <span>{bet.format}</span>}
        </div>
        <div>
          <time>{date.date}</time>
          {date.time && <span>{date.time}</span>}
        </div>
      </div>
      {express ? (
        <div className="mi-share-events">
          <h3>Експрес · {events.length || bet.format}</h3>
          {events.length ? (
            events.map((event, i) => (
              <div className="mi-share-event" key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{event.replace(/^\d+\.\s*/, "").replace(/\|/g, " · ")}</p>
              </div>
            ))
          ) : (
            <p>{bet.match}</p>
          )}
        </div>
      ) : (
        <div className="mi-share-teams">
          <div className="mi-share-team">
            <TeamLogo src={bet.logoTeam1} name={team1} game={game} />
            <strong>{team1}</strong>
          </div>
          <div className="mi-share-vs">
            <span />
            VS
            <span />
          </div>
          <div className="mi-share-team">
            <TeamLogo src={bet.logoTeam2} name={team2} game={game} />
            <strong>{team2}</strong>
          </div>
        </div>
      )}
      <div className="mi-share-prediction">
        <div className="mi-share-pick">
          <span>{express ? "Тип запису" : market}</span>
          <strong>{express ? "Експрес" : selection || "Не вказано"}</strong>
        </div>
        <div className="mi-share-odds">
          <span>{express ? "Загальний коеф." : "Коефіцієнт"}</span>
          <strong>{Number(bet.odds).toFixed(2)}</strong>
        </div>
      </div>
      <footer className="mi-share-footer">
        <div>
          <span>Сума</span>
          <strong>
            {shareMoney(bet.originalAmount ?? bet.amount, bet.currency)}
          </strong>
        </div>
        <div>
          <span>Чистий результат</span>
          <strong className="mi-share-result">
            {result == null ? "—" : shareMoney(result, bet.currency, true)}
          </strong>
        </div>
        <div>
          <span>Статус</span>
          <strong className="mi-share-status">{status}</strong>
        </div>
      </footer>
    </article>
  );
}
