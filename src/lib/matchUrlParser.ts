/**
 * Match URL parsers — extract team names & tournament from HLTV / Dota 2 URLs.
 * Pure functions, zero component deps.
 *
 * Design notes:
 * - Slug extraction is robust: strips query/hash, prefers the segment after
 *   `/matches/{id}/`, falls back to last non-empty segment (trailing slash safe).
 * - Tournament keywords are matched as WHOLE WORDS (not substring) to avoid
 *   false splits like "imperial" matching "pro" or "recup" matching "cup".
 * - Team names go through TEAM_ALIASES for canonical casing (FaZe, NAVI…);
 *   unknown teams fall back to Title Case.
 * - Unknown tournament → "Unknown Tournament" (better than polluting team2
 *   with tournament words via fragile midpoint heuristics).
 */

import { toCanonicalTeamName } from "./teamAliases";

export interface ParsedMatchResult {
  team1: string;
  team2: string;
  tournament: string;
}

export type MatchGame = "CS2" | "Dota2";

export interface ParsedMatch extends ParsedMatchResult {
  game: MatchGame;
}

/**
 * Tournament keywords — matched against WHOLE slug words (case-insensitive).
 * Intentionally excludes substrings to avoid "pro"→"imperial" style bugs.
 */
const TOURNAMENT_KEYWORDS = new Set([
  // Organizers / circuits
  "esl",
  "blast",
  "iem",
  "pgl",
  "faceit",
  "dreamhack",
  "starladder",
  "eleague",
  "nodwin",
  "betboom",
  "cct",
  "ewc",
  "eswc",
  // Generic tournament words
  "pro",
  "league",
  "season",
  "premier",
  "major",
  "championship",
  "masters",
  "elite",
  "dacha",
  "series",
  "cup",
  "open",
  "closed",
  "qualifier",
  "qualifiers",
  "groups",
  "playoffs",
  "playoff",
  "final",
  "finals",
  "showdown",
  "invitational",
  "circuit",
  // Editions / timing
  "spring",
  "summer",
  "fall",
  "autumn",
  "winter",
  "world",
  // Cities / regions
  "katowice",
  "cologne",
  "sydney",
  "beijing",
  "antwerp",
  "stockholm",
  "london",
  "paris",
  "copenhagen",
  "budapest",
  "austin",
  "rio",
  "europe",
  "european",
  "americas",
  "asia",
  "oceania",
  "cis",
  // Dota-specific
  "dreamleague",
  "ti",
  "international",
  "riyadh",
  "eslone",
]);

const YEAR_REGEX = /^(19|20)\d{2}$/;

/**
 * Strip query string and hash from a URL, return clean path segments
 * (non-empty, no leading/trailing slashes).
 */
function cleanPathSegments(url: string): string[] {
  const noQuery = url.split(/[?#]/)[0];
  return noQuery.split("/").filter((s) => s.length > 0);
}

/**
 * Extract the match slug from an HLTV URL.
 * Prefers the segment after `/matches/{id}/`, falls back to last segment.
 * Returns null if no usable slug found.
 */
export function extractHltvSlug(url: string): string | null {
  const segments = cleanPathSegments(url);
  // Look for: ... /matches/{id}/{slug}
  for (let i = 0; i < segments.length - 2; i++) {
    if (
      segments[i].toLowerCase() === "matches" &&
      /^\d+$/.test(segments[i + 1])
    ) {
      return segments[i + 2] || null;
    }
  }
  // Fallback: last segment (e.g. user pasted just the slug)
  const last = segments[segments.length - 1];
  if (last && !/^\d+$/.test(last) && last.toLowerCase() !== "matches") {
    return last;
  }
  return null;
}

/**
 * Extract the match slug from a Dota 2 URL.
 * Matches a path segment containing "-vs-" appearing after a "dota2" segment
 * when present; otherwise last segment containing "-vs-".
 */
export function extractDota2Slug(url: string): string | null {
  const segments = cleanPathSegments(url);
  const dota2Index = segments.findIndex((s) => s.toLowerCase() === "dota2");
  const candidates =
    dota2Index >= 0 ? segments.slice(dota2Index + 1) : segments;
  const slug = candidates.find((s) => /-vs-/i.test(s));
  return slug ?? null;
}

/**
 * Split slug words after "-vs-" into team2 words and tournament words.
 * Boundary = first whole-word match of a tournament keyword or a year.
 * Returns { team2Parts, tournamentParts } or null when team2 would be empty.
 */
function splitAfterVs(afterVs: string[]): {
  team2Parts: string[];
  tournamentParts: string[];
} | null {
  let boundary = -1;
  for (let i = 0; i < afterVs.length; i++) {
    const word = afterVs[i].toLowerCase();
    if (TOURNAMENT_KEYWORDS.has(word) || YEAR_REGEX.test(word)) {
      boundary = i;
      break;
    }
  }

  if (boundary === 0) return null; // no team2 before tournament → malformed

  if (boundary > 0) {
    let team2Parts = afterVs.slice(0, boundary);
    // Heuristic: when the boundary is a bare year (no keyword before it) and
    // there are ≥3 words before the year, words beyond the first two are
    // almost certainly an unknown tournament name, not part of the team
    // (team names of 3+ slug words are rare: "tundra esports", "team spirit"…).
    if (
      team2Parts.length > 2 &&
      YEAR_REGEX.test(afterVs[boundary]) &&
      !TOURNAMENT_KEYWORDS.has(afterVs[boundary].toLowerCase())
    ) {
      team2Parts = team2Parts.slice(0, 2);
      return {
        team2Parts,
        tournamentParts: afterVs.slice(2),
      };
    }
    return {
      team2Parts,
      tournamentParts: afterVs.slice(boundary),
    };
  }

  // No keyword found: everything is team2, tournament unknown
  return { team2Parts: afterVs, tournamentParts: [] };
}

/** Title-case slug words for a readable tournament name */
function formatTournament(parts: string[]): string {
  if (parts.length === 0) return "Unknown Tournament";
  return parts
    .map((w) => {
      const lower = w.toLowerCase();
      // Keep well-known acronyms uppercase
      if (["esl", "iem", "pgl", "cct", "ewc", "ti", "blast"].includes(lower)) {
        return lower.toUpperCase();
      }
      if (YEAR_REGEX.test(lower)) return lower; // keep year digits as-is
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Split a match slug on the "-vs-" separator.
 * Returns null when "vs" is missing, first, or last.
 */
function splitOnVs(
  slug: string,
): { beforeVs: string[]; afterVs: string[] } | null {
  const parts = slug.split("-").filter((p) => p.length > 0);
  const vsIndex = parts.findIndex((p) => p.toLowerCase() === "vs");
  if (vsIndex <= 0 || vsIndex >= parts.length - 1) return null;
  return {
    beforeVs: parts.slice(0, vsIndex),
    afterVs: parts.slice(vsIndex + 1),
  };
}

/** Parse a CS2 HLTV match URL — extracts team1, team2, tournament */
export function parseCS2MatchFromUrl(url: string): ParsedMatchResult | null {
  try {
    const slug = extractHltvSlug(url);
    if (!slug) return null;

    const split = splitOnVs(slug);
    if (!split) return null;

    const team1 = toCanonicalTeamName(split.beforeVs);
    const after = splitAfterVs(split.afterVs);
    if (!after || after.team2Parts.length === 0) return null;

    const team2 = toCanonicalTeamName(after.team2Parts);
    const tournament = formatTournament(after.tournamentParts);

    return { team1, team2, tournament };
  } catch {
    return null;
  }
}

/** Parse a Dota 2 match URL — extracts team1, team2, tournament */
export function parseDota2MatchFromUrl(url: string): ParsedMatchResult | null {
  try {
    const slug = extractDota2Slug(url);
    if (!slug) return null;

    const split = splitOnVs(slug);
    if (!split) return null;

    const team1 = toCanonicalTeamName(split.beforeVs);
    const after = splitAfterVs(split.afterVs);
    if (!after || after.team2Parts.length === 0) return null;

    const team2 = toCanonicalTeamName(after.team2Parts);
    const tournament = formatTournament(after.tournamentParts);

    return { team1, team2, tournament };
  } catch {
    return null;
  }
}

/**
 * Unified dispatcher — detects game from URL and parses accordingly.
 * Returns null for unrecognized/invalid URLs.
 */
export function parseMatchUrl(url: string): ParsedMatch | null {
  if (!url || typeof url !== "string") return null;
  const lower = url.toLowerCase();

  if (lower.includes("hltv.org/matches/")) {
    const result = parseCS2MatchFromUrl(url);
    return result ? { game: "CS2", ...result } : null;
  }

  // Dota 2: explicit path segment or known Dota stat sites
  if (
    lower.includes("/dota2/") ||
    lower.includes("dotabuff.com") ||
    lower.includes("opendota.com") ||
    lower.includes("datdota.com")
  ) {
    const result = parseDota2MatchFromUrl(url);
    return result ? { game: "Dota2", ...result } : null;
  }

  return null;
}
