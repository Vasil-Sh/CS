import { Info, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Bet } from "@/types/betting";
import type { ParsedEvent } from "@/lib/parser/expressParser";
import { getBetTypeLabel } from "@/lib/displayHelpers";
import { googleSheetsRiskyTeamsService } from "@/lib/googleSheetsRiskyTeams";
import "./ExpressDetailsModal.css";

interface ExpressDetailsModalProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
  /** Opens the share flow for this express bet. */
  onShare?: () => void;
  parsedEvents: ParsedEvent[];
}

interface DisplayEvent {
  id: string;
  team1: string;
  team2: string;
  market: string;
  selection: string;
  odds: number;
  game: "CS2" | "Dota 2";
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

const numberFormat = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 2,
});

function eventCount(count: number) {
  const last = count % 10;
  const lastTwo = count % 100;

  if (lastTwo >= 11 && lastTwo <= 14) return `${count} подій`;
  if (last === 1) return `${count} подія`;
  if (last >= 2 && last <= 4) return `${count} події`;

  return `${count} подій`;
}

/** "Team1 vs Team2" → [team1, team2] */
function splitMatch(match: string): [string, string] {
  const parts = match.split(/\s+vs\.?\s+/i);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(" vs ").trim()];
  }
  return [match.trim(), ""];
}

const MARKET_TRANSLATIONS: Record<string, string> = {
  MapWinner: "Переможець карти",
  MatchWinner: "Переможець матчу",
};

function marketLabel(betType: string, format?: string): string {
  const label = getBetTypeLabel(betType, format);
  return MARKET_TRANSLATIONS[label] || label || betType;
}

export default function ExpressDetailsModal({
  bet,
  open,
  onClose,
  onShare,
  parsedEvents,
}: ExpressDetailsModalProps) {
  const betGame: "cs2" | "dota2" = bet?.game === "Dota2" ? "dota2" : "cs2";

  // Exact total odds — product of individual event odds (not the rounded
  // stored bet.odds, which can be e.g. 1.71).
  const baseEvents = useMemo<DisplayEvent[]>(
    () =>
      bet
        ? parsedEvents.map((event, index) => {
            const [team1, team2] = splitMatch(event.match);
            const logos = bet.expressLogos?.[index];
            const game: "CS2" | "Dota 2" =
              bet.game === "Dota2" ? "Dota 2" : "CS2";
            return {
              id: event.number || String(index + 1),
              team1,
              team2,
              market: marketLabel(event.betType, bet.format),
              selection: event.selection,
              odds: parseFloat(event.odds || "0"),
              game,
              logoTeam1: logos?.logoTeam1 || null,
              logoTeam2: logos?.logoTeam2 || null,
            };
          })
        : [],
    [bet, parsedEvents],
  );

  // Resolve team logos dynamically for events missing stored logos
  // (e.g. older express bets created before expressLogos existed).
  const [resolvedLogos, setResolvedLogos] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    if (!open || !bet) return;
    const altGame: "cs2" | "dota2" = betGame === "cs2" ? "dota2" : "cs2";

    // Collect unique team names missing a stored logo.
    const seen = new Set<string>();
    const toResolve: { name: string }[] = [];
    baseEvents.forEach((e) => {
      [e.team1, e.team2].forEach((name) => {
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          toResolve.push({ name });
        }
      });
    });

    if (toResolve.length === 0) return;

    const isLocal = (url: string | null) =>
      !!url &&
      (url.includes("/logo/local/") || url.includes("/logo/dota2local/"));

    let cancelled = false;
    Promise.all([
      googleSheetsRiskyTeamsService.resolveLogos(
        toResolve.map((n) => ({ name: n.name, game: betGame })),
      ),
      googleSheetsRiskyTeamsService.resolveLogos(
        toResolve.map((n) => ({ name: n.name, game: altGame })),
      ),
    ])
      .then(([betMap, altMap]) => {
        if (cancelled) return;
        const merged: Record<string, string | null> = {};
        toResolve.forEach((n) => {
          const a = betMap[n.name] ?? null;
          const b = altMap[n.name] ?? null;
          // Prefer a local (instant, reliable) logo over an external CDN one.
          const aLocal = isLocal(a);
          const bLocal = isLocal(b);
          if (aLocal && !bLocal) merged[n.name] = a;
          else if (bLocal && !aLocal) merged[n.name] = b;
          else merged[n.name] = a ?? b;
        });
        setResolvedLogos(merged);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [open, bet, betGame, baseEvents]);

  const events: DisplayEvent[] = useMemo(() => {
    if (!bet) return [];
    const placeholder =
      bet.game === "Dota2"
        ? "/assets/team-placeholder-dota.svg"
        : "/assets/team-placeholder-cs2.svg";
    return baseEvents.map((e) => ({
      ...e,
      logoTeam1: e.logoTeam1 || resolvedLogos[e.team1] || placeholder,
      logoTeam2: e.logoTeam2 || resolvedLogos[e.team2] || placeholder,
    }));
  }, [baseEvents, resolvedLogos, bet]);

  if (!bet) return null;

  const symbol = bet.currency === "USD" ? "$" : "₴";
  const amount = bet.originalAmount || bet.amount;
  const money = (value: number) => `${numberFormat.format(value)} ${symbol}`;

  const totalOdds = parsedEvents.reduce(
    (acc, event) => acc * parseFloat(event.odds || "1"),
    1,
  );
  const potentialPayout = amount * totalOdds;
  const potentialProfit = potentialPayout - amount;

  const games = [...new Set(events.map((event) => event.game))];
  const countLabel = eventCount(events.length);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="express-details">
        <header className="express-details__header">
          <DialogTitle className="express-details__title">
            Деталі експресу
          </DialogTitle>

          <DialogDescription className="express-details__subtitle">
            {countLabel}
            {games.length > 0 && ` · ${games.join(" / ")}`}
          </DialogDescription>
        </header>

        <div className="express-details__scroll">
          <section
            className="express-details__summary"
            aria-label="Підсумок експресу"
          >
            <dl className="express-details__metrics">
              <div>
                <dt>Сума запису</dt>
                <dd>{money(amount)}</dd>
              </div>

              <div>
                <dt>Загальний коеф.</dt>
                <dd>{totalOdds.toFixed(2)}</dd>
              </div>

              <div>
                <dt>Виплата у разі виграшу</dt>
                <dd className="express-details__positive">
                  {money(potentialPayout)}
                </dd>
              </div>
            </dl>

            <p className="express-details__profit">
              Чистий прибуток у разі виграшу:{" "}
              <strong>
                {potentialProfit > 0 ? "+" : ""}
                {money(potentialProfit)}
              </strong>
            </p>
          </section>

          <section aria-labelledby="express-events-title">
            <div className="express-details__section-heading">
              <h3 id="express-events-title">Події експресу</h3>
              <span>{countLabel}</span>
            </div>

            {events.length > 0 ? (
              <ol className="express-details__events">
                {events.map((event, index) => (
                  <li key={event.id} className="express-details__event">
                    <span
                      className="express-details__number"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="express-details__event-content">
                      <div className="express-details__teams">
                        <img
                          className="express-details__team-logo"
                          src={event.logoTeam1 || undefined}
                          alt={event.team1}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <h4>
                          {event.team1}
                          {event.team2 ? ` — ${event.team2}` : ""}
                        </h4>
                        {event.team2 && (
                          <img
                            className="express-details__team-logo"
                            src={event.logoTeam2 || undefined}
                            alt={event.team2}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                      </div>

                      {(event.market || event.selection) && (
                        <p>
                          {event.market && <span>{event.market}</span>}
                          {event.market && event.selection && (
                            <span
                              className="express-details__dot"
                              aria-hidden="true"
                            >
                              ·
                            </span>
                          )}
                          {event.selection && (
                            <span>
                              Вибір: <strong>{event.selection}</strong>
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="express-details__odds">
                      <span>Коеф.</span>
                      <strong>{event.odds.toFixed(2)}</strong>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="express-details__empty">
                Деталі подій цього експресу недоступні.
              </p>
            )}
          </section>

          <div className="express-details__notice">
            <Info size={22} aria-hidden="true" />
            <p>
              Для виграшу експресу мають виграти всі його події. Повернення
              враховуються за правилами розрахунку.
            </p>
          </div>
        </div>

        <footer className="express-details__footer">
          <button
            type="button"
            className="express-details__button"
            onClick={onClose}
          >
            Закрити
          </button>

          <button
            type="button"
            className="
              express-details__button
              express-details__button--primary
            "
            onClick={onShare}
          >
            <Share2 size={20} aria-hidden="true" />
            Поділитися
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
