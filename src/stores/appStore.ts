import { create } from 'zustand';

/**
 * App-wide event bus using zustand.
 * Components subscribe to version counters and bump them to trigger
 * cross-component refreshes without direct coupling.
 */
interface AppStore {
  /** Incremented when bankroll changes (deposit, bet placed, result updated) */
  bankrollVersion: number;
  /** Incremented when strategies are modified */
  strategyVersion: number;
  /** Incremented when betting records are added/updated/deleted */
  betsVersion: number;
  /** Current primary strategy ID (UUID or name). Shared source of truth between StrategyOverview & StrategyOverviewHeader */
  primaryStrategyId: string;

  bumpBankroll: () => void;
  bumpStrategy: () => void;
  bumpBets: () => void;
  setPrimaryStrategyId: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  bankrollVersion: 0,
  strategyVersion: 0,
  betsVersion: 0,
  primaryStrategyId: '',

  bumpBankroll: () => set((s) => ({ bankrollVersion: s.bankrollVersion + 1 })),
  bumpStrategy: () => set((s) => ({ strategyVersion: s.strategyVersion + 1 })),
  bumpBets: () => set((s) => ({ betsVersion: s.betsVersion + 1 })),
  setPrimaryStrategyId: (id) => set({ primaryStrategyId: id }),
}));
