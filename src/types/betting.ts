export interface Bet {
  id?: string;
  match: string;
  team1?: string;
  team2?: string;
  betType: string;
  odds: number;
  amount: number;
  date: string;
  result: 'Win' | 'Loss' | 'Pending';
  profit?: number;
  strategy?: string;
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
}

export interface ScatterData {
  odds: number;
  profit: number;
  result: string;
}