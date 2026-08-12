// ═══════════════════════════════════════════
// Shared risky-team matching utility
// Eliminates 4× duplicated logic from:
//   CS2BettingForm.tsx, RiskManagement.tsx, ExpressEventBuilder
// ═══════════════════════════════════════════

export interface RiskyTeamMatch {
  name: string;
  game: string;
  status: string;
  notes: string;
  logo?: string | null;
}

export interface RiskyTeamRecord {
  name: string;
  game: string;
  status: string;
  notes: string;
  logo?: string | null;
}

/** Normalize team name for fuzzy matching: lowercase, strip whitespace & non-alnum */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Check if two normalized names match: exact, substring, or prefix (with length guard) */
function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // Substring match — guard against false positives like "Eternal Fire" ⊂ "ex-Eternal Fire Academy".
  // Require ≥70% length ratio so parent/academy pairs don't match.
  if (a.includes(b) || b.includes(a)) {
    const shorter = a.length < b.length ? a : b;
    const longer = a.length < b.length ? b : a;
    const ratio = shorter.length / longer.length;
    // Short prefix names (≤5 chars, e.g. "FUT" → "FUT Esports", "VP" → "Virtus.pro")
    // are almost certainly the same team when they appear at the start of the longer name.
    if (shorter.length <= 5 && longer.indexOf(shorter) === 0) {
      if (ratio >= 0.25) return true;
    }
    if (ratio >= 0.7) return true;
  }
  // Prefix match — catches "Nuclear TigRES" vs "Nuclear Tigers" (typo in suffix).
  // Requires identical first 8 chars AND ≥70% length ratio so parent/academy pairs
  // (Natus Vincere vs Natus Vincere Junior, Team Spirit vs Team Spirit Academy,
  //  Astralis vs Astralis Talent, ENCE vs ENCE Prospects, MOUZ vs MOUZ NXT,
  //  FaZe vs FaZe Up Next, B8 vs B8 Academy, Spirit vs Spirit Academy, etc.) don't match.
  if (a.length >= 8 && b.length >= 8 && a.slice(0, 8) === b.slice(0, 8)) {
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    if (ratio >= 0.7) return true;
  }
  return false;
}

/** Map form-level game filter to storage-level game key */
export function getGameFilterValue(formGame: "CS2" | "Dota2"): string {
  return formGame === "CS2" ? "CS" : "Дота";
}

/**
 * Match teams against a risky-team list. Returns matched records.
 * Deduplicates by name — each risky team appears at most once.
 */
export function findRiskyTeams(
  team1: string,
  team2: string,
  gameFilter: string,
  riskyTeams: RiskyTeamRecord[],
  logos?: { logoTeam1?: string | null; logoTeam2?: string | null },
): RiskyTeamMatch[] {
  if (!team1 && !team2) return [];

  const normalizedTeam1 = normalizeTeamName(team1);
  const normalizedTeam2 = normalizeTeamName(team2);
  const found: RiskyTeamMatch[] = [];
  const addedNames = new Set<string>();

  for (const rt of riskyTeams) {
    if (gameFilter) {
      const rtGameNorm = (rt.game || "").toLowerCase().trim();
      // Empty game = wildcard (match any game)
      if (!rtGameNorm) {
        /* match all */
      } else {
        const filterNorm = gameFilter.toLowerCase();
        // Use includes to handle variants like "dota 2", "dota2", "дота 2", "cs 2", etc.
        const rtIsDota =
          rtGameNorm.includes("дота") || rtGameNorm.includes("dota");
        const filterIsDota =
          filterNorm.includes("дота") || filterNorm.includes("dota");
        const rtIsCs = rtGameNorm.includes("cs") || rtGameNorm.includes("кс");
        const filterIsCs =
          filterNorm.includes("cs") || filterNorm.includes("кс");
        if (rtIsDota && filterIsDota) {
          /* match */
        } else if (rtIsCs && filterIsCs) {
          /* match */
        } else continue;
      }
    }
    if (addedNames.has(rt.name)) continue;

    const normalizedRT = normalizeTeamName(rt.name);
    const matchesT1 = namesMatch(normalizedTeam1, normalizedRT);
    const matchesT2 = namesMatch(normalizedTeam2, normalizedRT);

    if (matchesT1 || matchesT2) {
      // Attach the logo of the matched team (from prefill)
      const logo = matchesT1 ? logos?.logoTeam1 : logos?.logoTeam2;
      found.push({
        name: rt.name,
        game: rt.game,
        status: rt.status,
        notes: rt.notes,
        logo: logo || rt.logo || null,
      });
      addedNames.add(rt.name);
    }
  }

  return found;
}
