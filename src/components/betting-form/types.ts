// Shared types for betting-form sub-components

export interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

export interface StrategyViolation {
  type: 'odds' | 'format' | 'betType';
  message: string;
  severity: 'acceptable' | 'serious';
  explanation: string;
}

export interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
  currentStep?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  steps?: { step: number; startAmount: number; status: string }[];
}
