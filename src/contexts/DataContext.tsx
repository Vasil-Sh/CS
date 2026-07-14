// ═══════════════════════════════════════════
// DataProvider — single source of truth
// Replaces ad-hoc localStorage reads across components.
// ═══════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { BankrollService, type DualBankrollStats } from "@/lib/bankrollService";
import { api } from "@/lib/apiClient";
import type { Bet } from "@/types/betting";

interface DataContextType {
  /** All bets (from API → localStorage cache) */
  bets: Bet[];
  /** Dual-currency bankroll stats */
  bankroll: DualBankrollStats;
  /** Whether initial data fetch is in progress */
  isLoading: boolean;
  /** Force refresh from API */
  refresh: () => Promise<void>;
  /** Update bets optimistically (then sync to API in background) */
  addBet: (bet: Bet) => void;
  updateBetResult: (betId: string, result: "Win" | "Loss", profit: number, roi: number, notes?: string) => void;
  deleteBet: (betId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentUser = user?.username || "";

  const [bets, setBets] = useState<Bet[]>([]);
  const [bankroll, setBankroll] = useState<DualBankrollStats>({
    uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
    usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  /** Recompute bankroll from current bets */
  const recalcBankroll = useCallback(
    (currentBets: Bet[]) => {
      setBankroll(BankrollService.getBankrollStatsDual(currentUser, currentBets));
    },
    [currentUser],
  );

  /** Full refresh from API → localStorage */
  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const apiBets = await UserDataService.fetchBets();
      setBets(apiBets as Bet[]);
      recalcBankroll(apiBets as Bet[]);

      // Backfill: push localStorage-only bets to the server
      try {
        const localBets = UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []);
        // fetchBets already merges local → API. Compare raw API to find truly missing bets.
        const rawApiBets = await api.get<{ data?: Array<{ id: number | string }> }>("/bets").catch(() => ({ data: [] }));
        const rawData = (rawApiBets as any).data || rawApiBets || [];
        const serverIds = new Set(rawData.map((b: any) => String(b.id)));
        for (const lb of localBets) {
          if (!serverIds.has(String(lb.id))) {
            api.post("/bets", lb).catch(() => {});
          }
        }
      } catch { /* backfill is best-effort */ }
    } catch {
      // Fallback to localStorage
      const localBets = UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []);
      setBets(localBets);
      recalcBankroll(localBets);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, recalcBankroll]);

  /** Initial load */
  useEffect(() => {
    if (currentUser) refresh();
  }, [currentUser, refresh]);

  /** Add bet optimistically + sync to backend */
  const addBet = useCallback(
    (bet: Bet) => {
      setBets((prev) => [bet, ...prev]);
      const allBets = [bet, ...bets];
      recalcBankroll(allBets);
      UserDataService.setUserDataSync(currentUser, "mybets_data", allBets);
      // Sync to backend (fire-and-forget)
      api.post("/bets", bet).catch((e) => console.warn("[DataContext] Failed to sync bet to server:", e));
    },
    [bets, currentUser, recalcBankroll],
  );

  /** Update bet result + sync to backend */
  const updateBetResult = useCallback(
    (betId: string, result: "Win" | "Loss", profit: number, roi: number, notes?: string) => {
      setBets((prev) => {
        const updated = prev.map((b) =>
          String(b.id) === betId ? { ...b, result, profit, roi, notes: notes || b.notes } : b,
        );
        recalcBankroll(updated);
        UserDataService.setUserDataSync(currentUser, "mybets_data", updated);
        return updated;
      });
      // Sync to backend (fire-and-forget)
      api.put(`/bets/${betId}`, { result, profit, roi, notes }).catch((e) => console.warn("[DataContext] Failed to sync bet result to server:", e));
    },
    [currentUser, recalcBankroll],
  );

  /** Delete bet + sync to backend */
  const deleteBet = useCallback(
    (betId: string) => {
      setBets((prev) => {
        const updated = prev.filter((b) => String(b.id) !== betId);
        recalcBankroll(updated);
        UserDataService.setUserDataSync(currentUser, "mybets_data", updated);
        return updated;
      });
      // Sync to backend (fire-and-forget)
      api.delete(`/bets/${betId}`).catch((e) => console.warn("[DataContext] Failed to sync bet deletion to server:", e));
    },
    [currentUser, recalcBankroll],
  );

  return (
    <DataContext.Provider
      value={{ bets, bankroll, isLoading, refresh, addBet, updateBetResult, deleteBet }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
