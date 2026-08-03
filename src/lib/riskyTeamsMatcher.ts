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
      const rtGameNorm = rt.game.toLowerCase();
      const filterNorm = gameFilter.toLowerCase();
      // Handle "Дота" vs "Dota" vs "dota2"
      const rtIsDota = rtGameNorm === "дота" || rtGameNorm === "dota" || rtGameNorm === "dota2";
      const filterIsDota = filterNorm === "дота" || filterNorm === "dota" || filterNorm === "dota2";
      const rtIsCs = rtGameNorm === "cs" || rtGameNorm === "cs2" || rtGameNorm === "csgo";
      const filterIsCs = filterNorm === "cs" || filterNorm === "cs2" || filterNorm === "csgo";
      if (rtIsDota && filterIsDota) { /* match */ }
      else if (rtIsCs && filterIsCs) { /* match */ }
      else continue;
    }
    if (addedNames.has(rt.name)) continue;

    const normalizedRT = normalizeTeamName(rt.name);
    const matchesT1 =
      normalizedTeam1 === normalizedRT ||
      normalizedTeam1.includes(normalizedRT);
    const matchesT2 =
      normalizedTeam2 === normalizedRT ||
      normalizedTeam2.includes(normalizedRT);

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
