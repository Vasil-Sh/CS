/**
 * Team name aliases — map URL slug forms to canonical display names.
 * Used by matchUrlParser to produce consistent, human-readable team names.
 *
 * Keys are normalized (lowercase, non-alphanumeric stripped).
 * Extend this map as needed — unknown teams fall back to Title Case.
 */

/** Canonical names keyed by normalized slug (lowercase, alphanum only) */
export const TEAM_ALIASES: Record<string, string> = {
  // CS2 top teams
  navi: "NAVI",
  natusvincere: "Natus Vincere",
  faze: "FaZe",
  fazeclan: "FaZe",
  mouz: "MOUZ",
  g2: "G2",
  g2esports: "G2",
  spirit: "Team Spirit",
  teamspirit: "Team Spirit",
  vitality: "Vitality",
  teamvitality: "Vitality",
  astralis: "Astralis",
  heroic: "HEROIC",
  liquid: "Team Liquid",
  teamliquid: "Team Liquid",
  furia: "FURIA",
  pain: "paiN",
  paingaming: "paiN",
  mongolz: "The MongolZ",
  themongolz: "The MongolZ",
  vp: "Virtus.pro",
  virtuspro: "Virtus.pro",
  nip: "NIP",
  ninjasinpyjamas: "NIP",
  falcons: "Falcons",
  teamfalcons: "Falcons",
  eternal: "Eternal Fire",
  eternalfire: "Eternal Fire",
  ef: "Eternal Fire",
  big: "BIG",
  bigclan: "BIG",
  ence: "ENCE",
  complexity: "Complexity",
  col: "Complexity",
  imperial: "Imperial",
  imperialesports: "Imperial",
  mibr: "MIBR",
  aurora: "Aurora",
  auroragaming: "Aurora",
  "3dmax": "3DMAX",
  saw: "SAW",
  gamerlegion: "GamerLegion",
  gl: "GamerLegion",
  betboom: "BetBoom Team",
  betboomteam: "BetBoom Team",
  bb: "BetBoom Team",
  cloud9: "Cloud9",
  c9: "Cloud9",
  fnatic: "fnatic",
  og: "OG",
  heroicgg: "HEROIC",
  apeks: "Apeks",
  monte: "Monte",
  sinners: "SINNERS",
  passion: "Passion UA",
  passionua: "Passion UA",
  b8: "B8",
  nemiga: "Nemiga",
  nemigagg: "Nemiga",
  wildcard: "Wildcard",
  // Dota 2 common teams
  tundra: "Tundra Esports",
  tundraesports: "Tundra Esports",
  parivision: "PARIVISION",
  teamfalconsdota: "Team Falcons",
  gaimin: "Gaimin Gladiators",
  ggaimingladiators: "Gaimin Gladiators",
  gladiators: "Gaimin Gladiators",
  xtreme: "Xtreme Gaming",
  xtremegaming: "Xtreme Gaming",
  xg: "Xtreme Gaming",
  lgd: "LGD Gaming",
  lgdgaming: "LGD Gaming",
  secret: "Team Secret",
  teamsecret: "Team Secret",
  entity: "Entity",
  entitygaming: "Entity",
  nigma: "Nigma Galaxy",
  nigmagalaxy: "Nigma Galaxy",
  talon: "Talon Esports",
  talonesports: "Talon Esports",
  avulus: "AVULUS",
  yandex: "Team Yandex",
  teamyandex: "Team Yandex",
};

/**
 * Normalize a slug-derived team string for alias lookup.
 * "natus-vincere" → "natusvincere", "FaZe Clan" → "fazeclan"
 */
function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Convert a single slug word to Title Case, preserving digits */
function titleWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Convert slug parts (e.g. ["natus", "vincere"]) to a canonical team name.
 * 1. Try full-join alias lookup ("natusvincere" → "Natus Vincere")
 * 2. Fallback: Title Case each word ("Natus Vincere")
 */
export function toCanonicalTeamName(slugParts: string[]): string {
  const joined = slugParts.join("-");
  const key = normalizeKey(joined);
  const alias = TEAM_ALIASES[key];
  if (alias) return alias;
  return slugParts.map(titleWord).join(" ").trim();
}
