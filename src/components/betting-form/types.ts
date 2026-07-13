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
  // Shared optional fields
  isPrimary?: boolean;
  createdAt?: string;
  completedAt?: string;
  betsPerDay?: number;
  // Amount goal
  currentAmount?: number;
  targetAmount?: number;
  // Ladder goal
  currentStep?: number;
  totalSteps?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  minOdds?: number;
  maxOdds?: number;
  avgOdds?: number;
  currentBank?: number;
  ladderMode?: 'soft' | 'strict';
  steps?: {
    step: number;
    startAmount: number;
    status: string;
    plannedAmount?: number;
    actualAmount?: number;
    actualOdds?: number;
    deviation?: number;
    minPlannedAmount?: number;
    maxPlannedAmount?: number;
    completedAt?: string;
  }[];
  // ROI goal
  targetROI?: number;
  currentROI?: number;
  // Win Rate goal
  targetWinRate?: number;
  currentWinRate?: number;
}
