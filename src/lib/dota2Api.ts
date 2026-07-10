/**
 * Dota 2 API Service
 * Fetches match data from tips.gg via MatchIQ backend proxy.
 * Mirrors the csApi.ts interface for seamless integration.
 */

import { api } from "./apiClient";

// Shape matches csApi.ts ApiMatch for compatibility
export interface Dota2ApiMatch {
  id: number;
  date: string;
  link: string;
  type: string;
  score1: number;
  score2: number;
  stars: number;
  nameTeam1: string;
  nameTeam2: string;
  lastChangeDateTeam1: string | null;
  lastChangeDateTeam2: string | null;
  positionTeam1: number | null;
  positionTeam2: number | null;
  logoTeam1: string | null;
  logoTeam2: string | null;
  predictionPercentTeam1: number | null;
  predictionPercentTeam2: number | null;
  bettingCoefficientTeam1: number | null;
  bettingCoefficientTeam2: number | null;
  tournament: string;
  stage: string;
}

interface TipsGgApiMatch {
  id: string;
  date: string;
  link: string;
  type: string;
  score1: number | null;
  score2: number | null;
  nameTeam1: string;
  nameTeam2: string;
  logoTeam1: string | null;
  logoTeam2: string | null;
  tournament: string;
  stage: string;
  status: "upcoming" | "live" | "finished";
  tipsCount: number;
  performer: string | null;
  startDate: string;
}

const MATCHES_CACHE_KEY = "dota2_matches_cache_v2";
const MATCHES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Convert tips.gg match to unified ApiMatch format.
 */
function tipsGgToApiMatch(m: TipsGgApiMatch, index: number): Dota2ApiMatch {
  return {
    id: index + 10000, // offset to avoid collision with CS IDs
    date: m.startDate || `${m.date}T00:00:00`,
    link: m.link,
    type: m.type,
    score1: m.score1 ?? 0,
    score2: m.score2 ?? 0,
    stars: m.tipsCount || 0,
    nameTeam1: m.nameTeam1,
    nameTeam2: m.nameTeam2,
    lastChangeDateTeam1: null,
    lastChangeDateTeam2: null,
    positionTeam1: null,
    positionTeam2: null,
    logoTeam1: m.logoTeam1,
    logoTeam2: m.logoTeam2,
    predictionPercentTeam1: m.performer === m.nameTeam1 ? 55 : 45,
    predictionPercentTeam2: m.performer === m.nameTeam2 ? 55 : 45,
    bettingCoefficientTeam1: null,
    bettingCoefficientTeam2: null,
    tournament: m.tournament || "",
    stage: m.stage || "",
  };
}

function getCache(): Dota2ApiMatch[] | null {
  try {
    const cached = localStorage.getItem(MATCHES_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < MATCHES_CACHE_TTL) return data as Dota2ApiMatch[];
    }
  } catch {
    /* ignore */
  }
  return null;
}

function setCache(data: Dota2ApiMatch[]): void {
  try {
    localStorage.setItem(
      MATCHES_CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Fetch today's and upcoming Dota 2 matches from tips.gg via backend proxy.
 */
export async function fetchDota2Matches(): Promise<Dota2ApiMatch[]> {
  const cached = getCache();
  if (cached) return cached;

  try {
    const data = await api.get<TipsGgApiMatch[]>("/v1/dota2-matches");
    const matches = (Array.isArray(data) ? data : []).map(tipsGgToApiMatch);
    if (matches.length > 0) {
      setCache(matches);
    }
    return matches;
  } catch (e) {
    if (import.meta.env.DEV)
      console.error("dota2Api: fetchDota2Matches failed", e);
    return [];
  }
}

/**
 * Determine match format from the type field.
 */
export function parseDota2MatchType(
  type: string,
): "Bo1" | "Bo2" | "Bo3" | "Bo5" {
  const lower = type.toLowerCase();
  if (lower.includes("bo5")) return "Bo5";
  if (lower.includes("bo3")) return "Bo3";
  if (lower.includes("bo2")) return "Bo2";
  if (lower.includes("bo1")) return "Bo1";
  return "Bo3";
}

/**
 * Extract tournament context from the match data.
 */
export function parseDota2MatchContext(match: Dota2ApiMatch): string {
  // Try to parse tournament from the link
  // e.g., "/matches/dota2/10-07-2026/rune-eaters-vs-gamerlegion/10-00/"
  const parts = match.link.split("/").filter(Boolean);
  const slug = parts[parts.length - 2] || parts[parts.length - 1] || "";

  const vsIndex = slug.indexOf("-vs-");
  if (vsIndex === -1) return match.type;

  const afterVs = slug.substring(vsIndex + 4);
  const segments = afterVs.split("-");

  const tournamentKeywords = [
    "esl",
    "blast",
    "iem",
    "cct",
    "betboom",
    "nodwin",
    "izi",
    "stake",
    "exort",
    "european",
    "ewc",
    "esports",
    "world",
    "cup",
    "pro",
    "league",
    "season",
    "major",
    "championship",
    "pgl",
    "faceit",
    "dreamhack",
    "masters",
    "elite",
    "premier",
    "divine",
    "ancient",
    "immortal",
  ];

  let startIdx = 0;
  for (let i = 0; i < segments.length; i++) {
    if (
      tournamentKeywords.some((kw) => segments[i].toLowerCase().includes(kw))
    ) {
      startIdx = i;
      break;
    }
    if (i >= 2) {
      startIdx = i;
      break;
    }
  }

  const tournamentSlug = segments.slice(startIdx).join(" ");
  const tournament = tournamentSlug
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return tournament || match.type;
}

/**
 * Build a full tips.gg URL from a relative link.
 */
export function buildTipsGgUrl(link: string): string {
  if (!link) return "";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://tips.gg${link.startsWith("/") ? "" : "/"}${link}`;
}

/**
 * Determine match status.
 */
export function getDota2MatchStatus(
  match: Dota2ApiMatch,
): "upcoming" | "live" | "finished" {
  if (match.score1 === 0 && match.score2 === 0) {
    const matchDate = new Date(match.date);
    return matchDate <= new Date() ? "live" : "upcoming";
  }
  // For BO2, a draw is possible (1-1). For BO3, first to 2 wins.
  const totalMaps =
    parseDota2MatchType(match.type) === "Bo5"
      ? 5
      : parseDota2MatchType(match.type) === "Bo3"
        ? 3
        : 2;
  const winsNeeded = Math.ceil(totalMaps / 2);
  if (match.score1 >= winsNeeded || match.score2 >= winsNeeded)
    return "finished";
  return "live";
}
