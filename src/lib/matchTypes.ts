/**
 * Shared match types — used by both CS2 and Dota 2 API clients.
 * Eliminates duplication between csApi.ts and dota2Api.ts.
 */

export interface BaseApiMatch {
  id: number;
  date: string;
  link: string;
  type: string;
  score1: number | null;
  score2: number | null;
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
  /** @remarks Backend may provide these from tips.gg JSON-LD */
  tournament?: string;
  stage?: string;
  status?: "upcoming" | "live" | "finished";
  /** Raw slug for CS2 live-score matching */
  cs2Slug?: string;
  /** Whether this match was user-submitted (custom/placeholder) */
  isCustom?: boolean;
  /** Team form stability from match history (computed by backend) */
  formTeam1?: string;
  formTeam2?: string;
  /** Form stats for team 1 */
  formWins1?: number;
  formLosses1?: number;
  formStreak1?: number;
  formLast1?: string;
  /** Form stats for team 2 */
  formWins2?: number;
  formLosses2?: number;
  formStreak2?: number;
  formLast2?: string;
}

/** Typed API error with status code and optional details */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
