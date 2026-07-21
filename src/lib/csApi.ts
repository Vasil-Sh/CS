// CS2 API Service
// Fetches match data from MatchIQ backend proxy (tips.gg scraper).

import type { BaseApiMatch } from "./matchTypes";
export { ApiError } from "./matchTypes";

export type ApiMatch = BaseApiMatch;

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const MATCHES_CACHE_KEY = "cs2_matches_cache_v1";
const MATCHES_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

/** Rewrite files.tips.gg CDN URLs to our backend proxy (avoid ORB blocking).
 *  Uses relative path (/api/...) so it goes through Vite dev proxy (same-origin). */
function proxyLogoUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/static\/image\/teams\/(.+)$/i);
  if (!match) return url;
  return `/api/v1/cs2-matches/logo/${match[1]}`;
}

/** Simple string hash for stable IDs across reloads */
function stringHash(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Convert tips.gg CS2 match format (TipsGgMatch) to unified ApiMatch format.
 * Backend returns tips.gg JSON-LD fields; frontend expects BaseApiMatch shape.
 */
function tipsGgToApiMatch(m: Record<string, unknown>): ApiMatch {
  // Extract slug for live-score matching (same as cs2LiveScoresStore uses)
  const link = String(m.link || "");
  const csSlug =
    link.replace(/\/$/, "").split("/").filter(Boolean).pop() ||
    String(m.id || "");

  return {
    id: stringHash(String(m.id || m.link || "")),
    date: String(m.startDate || String(m.date) || ""),
    link,
    type: String(m.type || "BO3"),
    score1: (m.score1 as number | null) ?? null,
    score2: (m.score2 as number | null) ?? null,
    stars: (m.tipsCount as number) || 0,
    nameTeam1: String(m.nameTeam1 || ""),
    nameTeam2: String(m.nameTeam2 || ""),
    lastChangeDateTeam1: null,
    lastChangeDateTeam2: null,
    positionTeam1: null,
    positionTeam2: null,
    logoTeam1: proxyLogoUrl(m.logoTeam1 as string | null),
    logoTeam2: proxyLogoUrl(m.logoTeam2 as string | null),
    predictionPercentTeam1: (m.pred1 as number) ?? null,
    predictionPercentTeam2: (m.pred2 as number) ?? null,
    bettingCoefficientTeam1:
      (m.coeff1 as number | null) ??
      ((m.pred1 as number) > 0
        ? Math.round((100 / (m.pred1 as number)) * 100) / 100
        : null),
    bettingCoefficientTeam2:
      (m.coeff2 as number | null) ??
      ((m.pred2 as number) > 0
        ? Math.round((100 / (m.pred2 as number)) * 100) / 100
        : null),
    tournament: String(m.tournament || ""),
    stage: String(m.stage || ""),
    status: (m.status as "upcoming" | "live" | "finished") || "upcoming",
    cs2Slug: csSlug,
  };
}

/** Stale-while-revalidate: return cached data instantly, fetch fresh in background */
export async function fetchTodaysAndUpcomingMatches(
  forceRefresh = false,
  onUpdate?: (matches: ApiMatch[]) => void,
): Promise<ApiMatch[]> {
  // Serve cache instantly (stale-while-revalidate)
  if (!forceRefresh) {
    const cached = getCache();
    if (cached) {
      // Background refresh
      (async () => {
        try {
          const fresh = await fetchFreshMatches();
          if (fresh.length > 0) {
            setCache(fresh);
            onUpdate?.(fresh);
          }
        } catch {
          /* silent */
        }
      })();
      return cached;
    }
  }

  // No cache or forced refresh
  try {
    const fresh = await fetchFreshMatches();
    if (fresh.length > 0) setCache(fresh);
    return fresh;
  } catch {
    return getStaleCache();
  }
}

function getCache(): ApiMatch[] | null {
  try {
    const cached = localStorage.getItem(MATCHES_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < MATCHES_CACHE_TTL) return data as ApiMatch[];
    }
  } catch {
    /* ignore */
  }
  return null;
}

function getStaleCache(): ApiMatch[] {
  try {
    const cached = localStorage.getItem(MATCHES_CACHE_KEY);
    if (cached) return JSON.parse(cached).data as ApiMatch[];
  } catch {
    /* ignore */
  }
  return [];
}

function setCache(data: ApiMatch[]): void {
  try {
    localStorage.setItem(
      MATCHES_CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

async function fetchFreshMatches(): Promise<ApiMatch[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
  const response = await fetch(`${API_BASE}/v1/cs2-matches`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const raw: Record<string, unknown>[] = await response.json();
  if (!Array.isArray(raw)) {
    console.warn("csApi: expected array, got", typeof raw);
    return [];
  }

  // Convert backend TipsGgMatch format to unified ApiMatch format
  return raw.map(tipsGgToApiMatch);
}

/**
 * Determine match format from the API type field
 * e.g. "bo3", "bo3 (Online)", "bo3 (LAN)", "def" -> Bo3, Bo1, etc.
 */
export function parseMatchType(type: string): "Bo1" | "Bo3" | "Bo5" {
  const lower = type.toLowerCase();
  if (lower.includes("bo5")) return "Bo5";
  if (lower.includes("bo3")) return "Bo3";
  if (lower.includes("bo1")) return "Bo1";
  if (lower === "def") return "Bo1";
  return "Bo3";
}

/**
 * Extract context info (Online/LAN) from type field
 */
export function parseMatchContext(type: string, link: string): string {
  // Extract tournament name from link
  // e.g. "/matches/2391036/3dmax-vs-astralis-esl-pro-league-season-23-stage-1"
  const parts = link.split("/");
  const slug = parts[parts.length - 1] || "";

  // Find the part after team names (after second team name)
  // Format: team1-vs-team2-tournament-name
  const vsIndex = slug.indexOf("-vs-");
  let tournamentSlug = "";
  if (vsIndex !== -1) {
    const afterVs = slug.substring(vsIndex + 4);
    // Skip team2 name - find the first segment that looks like a tournament
    const segments = afterVs.split("-");
    // Skip first few segments (team2 name), find where tournament starts
    // Heuristic: tournament names usually have keywords like "esl", "blast", "iem", "cct", etc.
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
    ];
    let startIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      if (
        tournamentKeywords.some((kw) => segments[i].toLowerCase().includes(kw))
      ) {
        startIdx = i;
        break;
      }
      // If we've gone past 3 segments without finding a keyword, assume the rest is tournament
      if (i >= 2) {
        startIdx = i;
        break;
      }
    }
    tournamentSlug = segments.slice(startIdx).join(" ");
  }

  // Capitalize first letters
  const tournament = tournamentSlug
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Add Online/LAN tag
  const lower = type.toLowerCase();
  let mode = "";
  if (lower.includes("lan")) mode = "LAN";
  else if (lower.includes("online")) mode = "Online";

  if (tournament && mode) return `${tournament} — ${mode}`;
  if (tournament) return tournament;
  if (mode) return mode;
  return type;
}

/**
 * Determine tier based on team positions
 */
export function determineTier(
  pos1: number | null,
  pos2: number | null,
): "tier1" | "tier2" | "tier3" {
  const bestPos = Math.min(pos1 ?? 999, pos2 ?? 999);
  if (bestPos <= 20) return "tier1";
  if (bestPos <= 50) return "tier2";
  return "tier3";
}

/**
 * Determine which team is the favorite based on positions (lower = better)
 */
export function determineFavorite(
  team1: string,
  team2: string,
  pos1: number | null,
  pos2: number | null,
): string {
  const p1 = pos1 ?? 999;
  const p2 = pos2 ?? 999;
  return p1 <= p2 ? team1 : team2;
}

/**
 * Check if a match is live (has started but not finished)
 */
export function isMatchLive(match: ApiMatch): boolean {
  const matchDate = new Date(match.date);
  const now = new Date();
  if (matchDate > now) return false;
  const totalNeeded = getTotalMapsNeeded(match.type);
  // BO2: if both maps played (sum=2), it's done (either 2-0 win or 1-1 draw)
  // BO1/BO3/BO5: if score sum reached total maps, it's done
  return match.score1 + match.score2 < totalNeeded;
}

/**
 * Check if match is finished
 */
export function isMatchFinished(match: ApiMatch): boolean {
  const totalNeeded = getTotalMapsNeeded(match.type);
  const winsNeeded = Math.ceil(totalNeeded / 2);
  // BO2: win=2 maps, or draw=1-1 when both maps played
  if (totalNeeded === 2) {
    return (
      match.score1 >= 2 || match.score2 >= 2 || match.score1 + match.score2 >= 2
    );
  }
  return match.score1 >= winsNeeded || match.score2 >= winsNeeded;
}

function getTotalMapsNeeded(type: string): number {
  const lower = type.toLowerCase();
  if (lower.includes("bo5")) return 5;
  if (lower.includes("bo3")) return 3;
  if (lower.includes("bo2")) return 2;
  return 1;
}

/**
 * Get match status
 */
export function getMatchStatus(
  match: ApiMatch,
): "upcoming" | "live" | "finished" {
  // Prefer backend-reported status (tips.gg knows better)
  if (match.status === "live" || match.status === "finished")
    return match.status;
  if (isMatchFinished(match)) return "finished";
  const matchDate = new Date(match.date);
  const now = new Date();
  if (matchDate <= now) return "live";
  return "upcoming";
}

const HLTV_BASE_URL = "https://www.hltv.org";

/** Build a full HLTV URL from an API link (which may be relative) */
export function buildHltvUrl(link: string): string {
  if (!link) return "";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `${HLTV_BASE_URL}${link.startsWith("/") ? "" : "/"}${link}`;
}
