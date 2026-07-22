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
      try {
        setBankroll(BankrollService.getBankrollStatsDual(currentUser, currentBets));
      } catch (e) {
        console.warn('[DataContext] Bankroll recalc failed:', e);
      }
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

      // Backfill: push localStorage-only bets (not yet on server) to the API
      try {
        const localBets = UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []);
        const rawApiBets = await api.get<{ data?: Array<{ id: number | string }> }>("/bets").catch(() => ({ data: [] }));
        const rawData = (rawApiBets as any).data || rawApiBets || [];
        const serverIds = new Set(rawData.map((b: any) => String(b.id)));
        // Also dedup by fingerprint to avoid pushing already-existing bets
        const serverFingerprints = new Set(
          rawData.map((b: any) =>
            `${String(b.match || '').trim()}|${parseFloat(String(b.amount || 0)).toFixed(2)}|${parseFloat(String(b.profit || 0)).toFixed(2)}|${String(b.date || '').substring(0, 10)}`
          )
        );
        let cleaned = false;
        const cleanedBets: Bet[] = [];
        const backfillQueue: Array<() => Promise<void>> = [];
        for (const lb of localBets) {
          const betId = String(lb.id || "");
          // Only backfill local-only bets (local_xxx IDs) that aren't on the server
          if (!betId.startsWith("local_")) {
            cleanedBets.push(lb);
            continue;
          }
          if (serverIds.has(betId)) {
            // Already on server — remove from localStorage
            cleaned = true;
            continue;
          }
          const fp = `${String(lb.match || '').trim()}|${parseFloat(String(lb.amount || 0)).toFixed(2)}|${parseFloat(String(lb.profit || 0)).toFixed(2)}|${String(lb.date || '').substring(0, 10)}`;
          if (serverFingerprints.has(fp)) {
            // Already on server by fingerprint — remove from localStorage
            cleaned = true;
            continue;
          }
          // Strip internal/local-only fields before sending to API
          const { id: _id, createdAt, ...rawBet } = lb as any;
          // Normalize riskyTeams: if array of objects → array of names
          const riskyTeams = Array.isArray(rawBet.riskyTeams)
            ? rawBet.riskyTeams.map((t: any) => typeof t === "string" ? t : t?.name || "")
            : [];
          const cleanBet = { ...rawBet, riskyTeams, id: undefined };
          backfillQueue.push(() => 
            api.post("/bets", cleanBet).catch((e) => {
              console.warn("[DataContext] Backfill failed for bet:", betId, (e as Error).message);
            })
          );
          // Keep the bet in localStorage (it's unique)
          cleanedBets.push(lb);
        }
        // Execute backfill with concurrency limit (3 at a time)
        let idx = 0;
        const CONCURRENCY = 3;
        const worker = async (): Promise<void> => {
          while (idx < backfillQueue.length) {
            const i = idx++;
            await backfillQueue[i]();
          }
        };
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, backfillQueue.length) }, () => worker()));
        // Persist cleaned list (removes already-synced duplicates)
        if (cleaned) {
          UserDataService.setUserDataSync(currentUser, "mybets_data", cleanedBets);
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
    if (currentUser) {
      refresh().catch((e) => {
        console.error('[DataContext] Initial refresh failed:', e);
        // Fallback to localStorage on any error
        try {
          const localBets = UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []);
          setBets(localBets);
          recalcBankroll(localBets);
        } catch {}
        setIsLoading(false);
      });
    }
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
  if (!ctx) {
    // Return a safe no-op fallback instead of crashing — prevents
    // ErrorBoundary from catching when DataProvider is unmounting
    // during route transitions or auth changes.
    return {
      bets: [],
      bankroll: {
        uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
        usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
      },
      isLoading: true,
      refresh: async () => {},
      addBet: () => {},
      updateBetResult: () => {},
      deleteBet: () => {},
    } as DataContextType;
  }
  return ctx;
}
