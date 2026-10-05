import type { Match, MatchRating } from "@/hooks/useMatches";

const ZONE = "Europe/Kyiv";
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("uk-UA", {
  timeZone: ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Zoned timestamps use Kyiv; legacy timestamps without an offset are already wall-clock dates. */
export function scheduleDate(value: string | Date): string {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value) &&
    !/(Z|[+-]\d{2}:?\d{2})$/i.test(value)
  )
    return value.slice(0, 10);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = dateFormat.formatToParts(date);
  return ["year", "month", "day"]
    .map((part) => parts.find((p) => p.type === part)?.value)
    .join("-");
}

export function scheduleTime(value: string): string {
  if (!value.includes("T")) return "—";
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(value))
    return value.match(/T(\d{2}:\d{2})/)?.[1] ?? "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? timeFormat.format(date) : "—";
}

export function nextScheduleDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function dateLabel(value: string): string {
  if (!value) return "Дата не вказана";
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONE,
  });
}

export function matchCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  return `${count} ${lastTwo >= 11 && lastTwo <= 14 ? "матчів" : last === 1 ? "матч" : last >= 2 && last <= 4 ? "матчі" : "матчів"}`;
}

export function coefficient(value?: number | null): string {
  return value != null && Number.isFinite(value) && value > 1
    ? value.toFixed(2)
    : "—";
}

/** Only use the source's complete percentage pair, never odds or AI fallbacks. */
export function sourceForecast(match: Match) {
  const first = match.predictionPercentTeam1;
  const second = match.predictionPercentTeam2;
  const valid = (value: unknown): value is number =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100;
  if (!valid(first) || !valid(second) || Math.abs(first + second - 100) > 1) {
    return null;
  }
  return { first, second, firstWidth: (100 * first) / (first + second) };
}

export function riskTone(status: string): string {
  switch (status.toLocaleLowerCase("uk-UA")) {
    case "бан":
      return "ban";
    case "ризиковані":
    case "нестабільні":
      return "risk";
    case "обережно":
    case "під питанням":
      return "caution";
    case "стабільні":
      return "stable";
    case "надійна":
      return "reliable";
    default:
      return "neutral";
  }
}

export function formLabel(value: string): string {
  return (
    (
      {
        hot_streak: "Серія перемог",
        stable: "Стабільна",
        momentum: "На підйомі",
        falling: "Спад",
        slump: "Криза",
        inconsistent: "Нестабільна",
      } as Record<string, string>
    )[value] || "Немає даних"
  );
}

export function matchSource(match: Match): string {
  try {
    const url = new URL(match.url || "");
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* Use the game's schedule if the match has no valid external URL. */
  }
  return match.game === "Dota2"
    ? "https://tips.gg/dota2/matches/"
    : "https://tips.gg/csgo/matches/";
}

export function matchState(
  match: Match,
  today: string,
): { text: string; tone: string } {
  if (match.matchStatus === "finished") {
    const score =
      match.score1 != null && match.score2 != null
        ? ` · ${match.score1}:${match.score2}`
        : "";
    return { text: `Завершено${score}`, tone: "finished" };
  }
  if (match.matchStatus === "cancelled")
    return { text: "Скасовано", tone: "cancelled" };
  if (match.matchStatus === "postponed")
    return { text: "Перенесено", tone: "postponed" };
  if (scheduleDate(match.date) && scheduleDate(match.date) < today)
    return { text: "Статус потребує оновлення", tone: "stale" };
  if (match.matchStatus === "live") {
    const score =
      match.score1 != null && match.score2 != null
        ? ` · ${match.score1}:${match.score2}`
        : "";
    return { text: `Зараз грають${score}`, tone: "live" };
  }
  return {
    text: match.matchStatus === "upcoming" ? "Очікується" : "Статус не вказано",
    tone: "upcoming",
  };
}

/** Compact score label for the schedule row's score column. */
export function matchScore(match: Match): { text: string; tone: string } {
  if (match.matchStatus === "live") return { text: "Лайв", tone: "live" };
  if (match.matchStatus === "finished") {
    const score =
      match.score1 != null && match.score2 != null
        ? `${match.score1}:${match.score2}`
        : "";
    return { text: score || "Завершено", tone: "finished" };
  }
  if (match.matchStatus === "cancelled")
    return { text: "Скасовано", tone: "cancelled" };
  if (match.matchStatus === "postponed")
    return { text: "Перенесено", tone: "postponed" };
  return { text: "Очікує", tone: "upcoming" };
}

export type PersonalFilter = "all" | "liked" | "notes" | "skipped";
export type ScheduleSort = "time" | "time-desc" | "odds" | "odds-desc";
export interface ScheduleFilters {
  date: string;
  game: "all" | Match["game"];
  query: string;
  status: string;
  format: string;
  tournament: string;
  personal: PersonalFilter;
  sort: ScheduleSort;
}

export function filterSchedule(
  matches: Match[],
  filters: ScheduleFilters,
  ratings: Record<string, MatchRating>,
  hasNotes: (match: Match) => boolean,
): Match[] {
  const query = filters.query.trim().toLocaleLowerCase("uk-UA");
  const filtered = matches.filter(
    (match) =>
      scheduleDate(match.date) === filters.date &&
      (filters.game === "all" || match.game === filters.game) &&
      (!query ||
        [match.team1, match.team2, match.context].some((text) =>
          text.toLocaleLowerCase("uk-UA").includes(query),
        )) &&
      (filters.status === "all" || match.matchStatus === filters.status) &&
      (filters.format === "all" || match.matchType === filters.format) &&
      (filters.tournament === "all" || match.context === filters.tournament) &&
      (filters.personal === "all" ||
        (filters.personal === "liked" && ratings[match.id] === "like") ||
        (filters.personal === "skipped" && ratings[match.id] === "dislike") ||
        (filters.personal === "notes" && hasNotes(match))),
  );
  return filtered.sort((a, b) => {
    const time = scheduleTime(a.date).localeCompare(scheduleTime(b.date));
    if (filters.sort.startsWith("odds")) {
      const values = (match: Match) =>
        [match.bettingCoefficientTeam1, match.bettingCoefficientTeam2].filter(
          (v): v is number =>
            typeof v === "number" && Number.isFinite(v) && v > 1,
        );
      const av = values(a),
        bv = values(b);
      // Unavailable odds stay last, in either direction.
      if (!av.length || !bv.length)
        return av.length ? -1 : bv.length ? 1 : time;
      const diff = Math.max(...av) - Math.max(...bv);
      if (diff) return filters.sort === "odds-desc" ? -diff : diff;
    }
    return (
      (filters.sort === "time-desc" ? -time : time) || a.id.localeCompare(b.id)
    );
  });
}

export function groupSchedule(matches: Match[], mode: "time" | "tournament") {
  if (mode === "time")
    return matches.length
      ? [{ key: "time", title: "Усі матчі", game: "", matches }]
      : [];
  const groups = new Map<
    string,
    { key: string; title: string; game: string; matches: Match[] }
  >();
  for (const match of matches) {
    const title = match.context || "Турнір не вказаний";
    const key = JSON.stringify([match.game, title]);
    const group = groups.get(key) || {
      key,
      title,
      game: match.game === "Dota2" ? "Dota 2" : "CS2",
      matches: [],
    };
    group.matches.push(match);
    groups.set(key, group);
  }
  return [...groups.values()];
}
