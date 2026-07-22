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
}

export interface RiskyTeamRecord {
  name: string;
  game: string;
  status: string;
  notes: string;
}

/** Normalize team name for fuzzy matching: lowercase, strip whitespace & non-alnum */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Map form-level game filter to storage-level game key */
export function getGameFilterValue(formGame: "CS2" | "Dota2"): string {
  return formGame === "CS2" ? "CS" : "Dota";
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
): RiskyTeamMatch[] {
  if (!team1 && !team2) return [];

  const normalizedTeam1 = normalizeTeamName(team1);
  const normalizedTeam2 = normalizeTeamName(team2);
  const found: RiskyTeamMatch[] = [];
  const addedNames = new Set<string>();

  for (const rt of riskyTeams) {
    if (rt.game !== gameFilter) continue;
    if (addedNames.has(rt.name)) continue;

    const normalizedRT = normalizeTeamName(rt.name);
    if (
      normalizedTeam1 === normalizedRT ||
      normalizedTeam2 === normalizedRT ||
      normalizedTeam1.includes(normalizedRT) ||
      normalizedTeam2.includes(normalizedRT)
    ) {
      found.push({ name: rt.name, game: rt.game, status: rt.status, notes: rt.notes });
      addedNames.add(rt.name);
    }
  }

  return found;
}
