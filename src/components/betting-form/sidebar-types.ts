// Shared types for sidebar sub-components

export interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

export interface EVVerdict {
  icon: string;
  text: string;
  color: string;
  description: string;
}

export interface ValueBetAnalysis {
  bookmakerProb: string;
  userProb: string;
  diff: string;
  isValueBet: boolean;
  message: string;
}

export interface KellyData {
  fullKelly: string;
  halfKelly: string;
  fullKellyAmount: number;
  halfKellyAmount: number;
  uncappedHalfKellyAmount: number;
  currentBankroll: number;
  maxAllowedAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  recommendedAmount: number;
  isNegative: boolean;
  isCapped: boolean;
  recommendedBankrollPercent: string;
}
