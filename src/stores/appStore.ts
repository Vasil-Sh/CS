import { create } from 'zustand';

/**
 * Lightweight app-wide event bus using zustand.
 * Replaces fragile window.dispatchEvent / window.addEventListener patterns
 * for cross-component communication.
 */
interface AppStore {
  /** Incremented when bankroll changes (deposit, bet placed, result updated) */
  bankrollVersion: number;
  /** Incremented when strategies are modified */
  strategyVersion: number;

  bumpBankroll: () => void;
  bumpStrategy: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  bankrollVersion: 0,
  strategyVersion: 0,

  bumpBankroll: () => set((s) => ({ bankrollVersion: s.bankrollVersion + 1 })),
  bumpStrategy: () => set((s) => ({ strategyVersion: s.strategyVersion + 1 })),
}));
