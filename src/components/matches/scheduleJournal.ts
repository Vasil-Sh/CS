import type { Match } from "@/hooks/useMatches";
import type { Bet } from "@/types/betting";
import { scheduleDate } from "./matchScheduleModel";
import { parseExpressEvents } from "@/lib/parser/expressParser";

const normalize = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
function matchUrl(value?: string) {
  try {
    const url = new URL(value || "");
    if (!/^https?:$/.test(url.protocol)) return "";
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

/** Prefer the source URL; legacy records require game, date and both teams. */
export function hasJournalRecord(match: Match, bets: Bet[]): boolean {
  const source = matchUrl(match.url);
  const pair = [normalize(match.team1), normalize(match.team2)];
  if (pair.some((name) => !name)) return false;
  const samePair = (first: string, second: string) =>
    (normalize(first) === pair[0] && normalize(second) === pair[1]) ||
    (normalize(first) === pair[1] && normalize(second) === pair[0]);
  const sameTitle = (title: string) => {
    const teams = title.split(/\s+(?:vs\.?|—|–)\s+/i);
    return teams.length === 2 && samePair(teams[0], teams[1]);
  };
  return bets.some((bet) => {
    const url = matchUrl(bet.matchUrl);
    if (source && url) return source === url;
    if (
      scheduleDate(bet.date) !== scheduleDate(match.date) ||
      normalize(bet.game || "").replace(/\s/g, "") !==
        normalize(match.game).replace(/\s/g, "")
    )
      return false;
    if (bet.team1 && bet.team2 && samePair(bet.team1, bet.team2)) return true;
    return (
      sameTitle(bet.match) ||
      parseExpressEvents(bet.betType).some((event) => sameTitle(event.match))
    );
  });
}
