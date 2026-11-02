/** Strategy types — shared between frontend and backend config blob */

export type ActionMode = "warning" | "block";

export interface OddsControl {
  enabled: boolean;
  minOdds?: number;
  maxOdds?: number;
  separateForExpress?: boolean;
  expressMinOdds?: number;
  expressMaxOdds?: number;
  actionMode: ActionMode;
}

export interface BetTypeRules {
  enabled: boolean;
  allowedTypes: string[];
  maxEventsInExpress?: number;
  minTotalExpressOdds?: number;
  actionMode: ActionMode;
}

export interface MatchFormatRules {
  enabled: boolean;
  allowedFormats: string[];
  actionMode: ActionMode;
}

export interface ActivityLimits {
  enabled: boolean;
  maxBetsPerDay?: number;
  maxBetsPerMatch?: number;
  minPauseBetweenBets?: number;
  blockAfterLosses?: number;
  blockDurationMinutes?: number;
  actionMode: ActionMode;
}

/** Daily cap on records made with the strategy (rules v2). */
export interface DailyLimitRule {
  enabled: boolean;
  maxBetsPerDay?: number;
  actionMode: ActionMode;
}

export interface PsychologicalTriggers {
  enabled: boolean;
  warnOnLossStreak?: number;
  warnOnHighOdds?: number;
  warnOnRepeatTeam?: boolean;
  actionMode: ActionMode;
}

export interface CS2Strategy {
  id?: string;
  name: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High";
  expectedROI: number;
  oddsControl?: OddsControl;
  betTypeRules?: BetTypeRules;
  matchFormatRules?: MatchFormatRules;
  activityLimits?: ActivityLimits;
  dailyLimit?: DailyLimitRule;
  psychologicalTriggers?: PsychologicalTriggers;
  customRules?: string[];
  criteria?: string[];
  maxOdds?: number;
  /** Flat runtime props parsed from criteria via parseCriteriaForValidation */
  minOdds?: number;
  allowedFormats?: string[];
  allowedBetTypes?: string[];
  /**
   * 2 = rules saved by the new strategy form: each rule's actionMode is honoured
   * ("block" stops the record). Older strategies only ever warn.
   */
  rulesVersion?: number;
  /** Backend DB id (populated after create/sync) */
  _backendId?: string;
}
