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
