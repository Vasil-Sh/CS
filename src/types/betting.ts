export interface Bet {
  id?: string;
  match: string;
  team1?: string;
  team2?: string;
  betType: string;
  odds: number;
  amount: number;
  stake?: number;
  date: string;
  result: 'Win' | 'Loss' | 'Pending';
  profit?: number;
  strategy?: string;
  format?: string;
  game?: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number | null;
  originalProfit?: number;
  roi?: number;
  goalId?: string;
  selection?: string;
  matchUrl?: string;
  winProbability?: number;
  createdAt?: number;
  /** Risk assessment label */
  risk?: string;
  /** Additional notes / reasoning */
  notes?: string;
  /** Teams flagged as risky */
  riskyTeams?: string[];
  /** Tournament name */
  tournament?: string;
}

export interface BettingStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  averageROI: number;
  profitByMonth: { month: string; profit: number }[];
  profitByStrategy: { strategy: string; profit: number }[];
}

export interface TeamStats {
  team: string;
  bets: number;
  winRate: string;
  profit: number;
}

export interface OddsRange {
  range: string;
  count: number;
  winRate: string;
  profit: number;
}

export interface CalendarData {
  date: string;
  count: number;
  profit: number;
}

export interface BalanceData {
  date: string;
  balance: number;
  profit: number;
  betName?: string;
  odds?: number;
}

export interface ScatterData {
  odds: number;
  profit: number;
  result: string;
  betType?: string;
  match?: string;
  fill?: string;
}