/**
 * Dota 2 API Service
 * Fetches match data from tips.gg via MatchIQ backend proxy.
 * Mirrors the csApi.ts interface for seamless integration.
 */

import { api } from "./apiClient";
import type { BaseApiMatch } from "./matchTypes";

// Extends unified match type with Dota-specific fields
export type Dota2ApiMatch = BaseApiMatch & {
  tournament: string;
  stage: string;
  status: "upcoming" | "live" | "finished";
};

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
  pred1: number;
  pred2: number;
  coeff1: number | null;
  coeff2: number | null;
}

const MATCHES_CACHE_KEY = "dota2_matches_cache_v9";
const MATCHES_CACHE_TTL = 5 * 60 * 1000; // 5 min — matches backend CACHE_TTL_FRESH

/** Rewrite files.tips.gg CDN URLs to our backend proxy (avoid ORB blocking).
 *  Uses relative path (/api/...) so it goes through Vite dev proxy (same-origin).
 *  Cross-origin URLs with X-Content-Type-Options: nosniff trigger Chrome ORB. */
function proxyLogoUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/static\/image\/teams\/(.+)$/i);
  if (!match) return url; // not a tips.gg CDN URL, return as-is
  return `/api/v1/dota2-matches/logo/${match[1]}`;
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
 * Convert tips.gg match to unified ApiMatch format.
 */
function tipsGgToApiMatch(m: TipsGgApiMatch): Dota2ApiMatch {
  return {
    id: stringHash(m.id || m.link),
    date: m.startDate || `${m.date}T00:00:00`,
    link: m.link,
    type: m.type,
    score1: m.score1 ?? null,
    score2: m.score2 ?? null,
    stars: m.tipsCount || 0,
    nameTeam1: m.nameTeam1,
    nameTeam2: m.nameTeam2,
    lastChangeDateTeam1: null,
    lastChangeDateTeam2: null,
    positionTeam1: null,
    positionTeam2: null,
    logoTeam1: proxyLogoUrl(m.logoTeam1),
    logoTeam2: proxyLogoUrl(m.logoTeam2),
    predictionPercentTeam1: m.pred1,
    predictionPercentTeam2: m.pred2,
    bettingCoefficientTeam1: m.coeff1 ?? null,
    bettingCoefficientTeam2: m.coeff2 ?? null,
    tournament: m.tournament || "",
    stage: m.stage || "",
    status: m.status,
  };
}

/** Cache entry stores the day it was fetched — auto-invalidates on date change */
interface CacheEntry {
  data: Dota2ApiMatch[];
  ts: number;
  day: string; // YYYY-MM-DD
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getCache(): Dota2ApiMatch[] | null {
  try {
    const cached = localStorage.getItem(MATCHES_CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      const age = Date.now() - entry.ts;
      // Serve cache only if: not expired AND from today
      if (age < MATCHES_CACHE_TTL && entry.day === getTodayStr()) {
        return entry.data as Dota2ApiMatch[];
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Return cached data even if stale (for initial fast paint + background refresh) */
function getStaleCache(): Dota2ApiMatch[] | null {
  try {
    const cached = localStorage.getItem(MATCHES_CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      return entry.data as Dota2ApiMatch[];
    }
  } catch {
    /* ignore */
  }
  return null;
}

function setCache(data: Dota2ApiMatch[]): void {
  try {
    const entry: CacheEntry = { data, ts: Date.now(), day: getTodayStr() };
    localStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

/**
 * Fetch today's and upcoming Dota 2 matches from tips.gg via backend proxy.
 * Uses stale-while-revalidate: shows cached data instantly, refreshes from backend.
 * Auto-invalidates when date changes (cache includes the day key).
 *
 * @param forceRefresh — skip localStorage cache and force a fresh API call (used by refresh button)
 * @param onUpdate — called when fresh data arrives (for SWR re-render in Matches page)
 */
export async function fetchDota2Matches(
  forceRefresh = false,
  onUpdate?: (matches: Dota2ApiMatch[]) => void,
): Promise<Dota2ApiMatch[]> {
  // Stale-while-revalidate: if NOT forced refresh, return cache immediately
  // but still fetch from backend in the background.
  if (!forceRefresh) {
    const cached = getCache();
    if (cached) {
      // Background refresh — don't await, fire-and-update
      (async () => {
        try {
          const path = "/v1/dota2-matches";
          const data = await api.get<TipsGgApiMatch[]>(path, 120000);
          const matches = (Array.isArray(data) ? data : []).map(
            tipsGgToApiMatch,
          );
          if (matches.length > 0) {
            setCache(matches);
            onUpdate?.(matches);
          }
        } catch {
          /* silent — cached data is good enough for now */
        }
      })();
      return cached;
    }
  }

  try {
    const path = forceRefresh
      ? "/v1/dota2-matches?refresh=true"
      : "/v1/dota2-matches";
    // Use 120s timeout — first Puppeteer scrape can take ~60s
    const data = await api.get<TipsGgApiMatch[]>(path, 120000);
    const matches = (Array.isArray(data) ? data : []).map(tipsGgToApiMatch);
    if (matches.length > 0) {
      setCache(matches);
    } else {
      // Don't cache empty responses — keep any previous cached data alive
      if (forceRefresh) {
        const stale = getStaleCache();
        if (stale) return stale;
      }
    }
    return matches;
  } catch (e) {
    if (import.meta.env.DEV)
      console.error("dota2Api: fetchDota2Matches failed", e);
    // On error, serve stale cache as fallback
    const stale = getStaleCache();
    if (stale) return stale;
    return [];
  }
}

function clearCache(): void {
  try {
    localStorage.removeItem(MATCHES_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export { clearCache as clearDota2Cache };

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
  // If match already has a tournament, use it
  if (match.tournament) return match.tournament;

  // Try to parse tournament from the link
  if (!match.link) return match.type || "Dota 2";

  const parts = match.link.split("/").filter(Boolean);
  const slug = parts[parts.length - 2] || parts[parts.length - 1] || "";
  if (!slug) return match.type || "Dota 2";

  const vsIndex = slug.indexOf("-vs-");
  if (vsIndex === -1) return match.type || "Dota 2";

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
 *
 * Backend already sends a `status` field ("upcoming" | "live" | "finished")
 * derived from tips.gg HTML. We trust it as the source of truth and only
 * refine it using scores when the match is already in progress.
 *
 * Previously this function ignored backend status and inferred "live" from
 * zero scores — which caused past "upcoming" matches (postponed / stale
 * tips.gg entries) to appear as LIVE forever.
 */
export function getDota2MatchStatus(
  match: Dota2ApiMatch,
): "upcoming" | "live" | "finished" {
  const backendStatus = match.status;

  // Trust backend "finished" — tips.gg HTML confirmed the match ended.
  if (backendStatus === "finished") return "finished";

  const s1 = match.score1 ?? null;
  const s2 = match.score2 ?? null;

  // Backend says upcoming — only flip to "live" if scores are actually present
  // (non-null AND non-zero, since tips.gg sends 0:0 for not-started matches).
  if (backendStatus === "upcoming") {
    if (s1 !== null && s2 !== null && (s1 > 0 || s2 > 0)) return "live";
    return "upcoming";
  }

  // Backend says "live" (or didn't say anything) — verify with scores.
  if (s1 === null || s2 === null) {
    // No scores yet — keep backend status, or fall back to date heuristic.
    if (backendStatus === "live") return "live";
    const matchDate = new Date(match.date);
    if (matchDate <= new Date()) {
      const ageMs = Date.now() - matchDate.getTime();
      return ageMs > 2 * 60 * 60 * 1000 ? "finished" : "live";
    }
    return "upcoming";
  }

  const matchType = parseDota2MatchType(match.type);
  const totalMaps = matchType === "Bo5" ? 5 : matchType === "Bo3" ? 3 : 2;
  const winsNeeded = Math.ceil(totalMaps / 2);

  // BO2 special case: finished when 2 maps played (2-0, 0-2, or 1-1 draw)
  if (matchType === "Bo2") {
    if (s1 + s2 >= 2) return "finished";
    return "live";
  }
  // BO1/BO3/BO5: finished when any team reaches wins needed
  if (s1 >= winsNeeded || s2 >= winsNeeded) return "finished";
  return "live";
}
