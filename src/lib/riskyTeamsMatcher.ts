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
    const startsAt = longer.indexOf(shorter);
    // "Team X" vs "X" — e.g. "Team Liquid" ↔ "Liquid", "Team Spirit" ↔ "Spirit".
    // The "team" prefix is purely organizational and always means the same squad.
    if (longer.startsWith("team" + shorter)) return true;
    // Position-0 prefix: the shorter name appears at the start of the longer.
    // This catches "Falcons" → "Falcons Esports" (7/15 ≈ 47%), "FUT" → "FUT Esports" (3/11 ≈ 27%).
    // Require ≥35% length ratio AND ≥3 chars to avoid false positives like "CS" → "CSe-teams".
    if (startsAt === 0 && ratio >= 0.35 && shorter.length >= 3) return true;
    // Short prefix names (≤5 chars, e.g. "FUT" → "FUT Esports", "VP" → "Virtus.pro")
    // are almost certainly the same team when they appear at the start of the longer name.
    if (shorter.length <= 5 && startsAt === 0 && ratio >= 0.25) return true;
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
 * Deduplicates by normalized name — each team appears at most once.
 * When duplicates exist, keeps the entry with the most specific (longest) name,
 * then falls back to later array position (most recently updated).
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
  // Use a Map keyed by normalized name to handle duplicates — keep the best match
  const foundMap = new Map<string, { record: RiskyTeamRecord; index: number; matchT1: boolean }>();

  for (let i = 0; i < riskyTeams.length; i++) {
    const rt = riskyTeams[i];
    const normalizedRT = normalizeTeamName(rt.name);
    if (gameFilter) {
      const rtGameNorm = (rt.game || "").toLowerCase().trim();
      if (!rtGameNorm) { /* match all */ }
      else {
        const filterNorm = gameFilter.toLowerCase();
        const rtIsDota = rtGameNorm.includes("дота") || rtGameNorm.includes("dota");
        const filterIsDota = filterNorm.includes("дота") || filterNorm.includes("dota");
        const rtIsCs = rtGameNorm.includes("cs") || rtGameNorm.includes("кс");
        const filterIsCs = filterNorm.includes("cs") || filterNorm.includes("кс");
        if (!((rtIsDota && filterIsDota) || (rtIsCs && filterIsCs))) continue;
      }
    }

    const matchesT1 = namesMatch(normalizedTeam1, normalizedRT);
    const matchesT2 = namesMatch(normalizedTeam2, normalizedRT);

    if (matchesT1 || matchesT2) {
      const existing = foundMap.get(normalizedRT);
      // Keep the most specific match: prefer longer name, then later in array (most recent)
      if (!existing || (rt.name?.length ?? 0) > (existing.record.name?.length ?? 0) || i > existing.index) {
        foundMap.set(normalizedRT, { record: rt, index: i, matchT1: matchesT1 });
      }
    }
  }

  return [...foundMap.values()].map(({ record: rt, matchT1 }) => ({
    name: rt.name,
    game: rt.game,
    status: rt.status,
    notes: rt.notes,
    logo: (matchT1 ? logos?.logoTeam1 : logos?.logoTeam2) || rt.logo || null,
  }));
}
