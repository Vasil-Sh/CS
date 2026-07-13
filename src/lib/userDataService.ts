// ═══════════════════════════════════════════
// User Data Service — API-first data store
// All reads/writes go through backend API.
// localStorage kept only as instant startup cache.
// ═══════════════════════════════════════════

import { api } from "./apiClient";
import type { Bet as ApiBet } from "@/types/betting";

/** Simple debounce: coalesce rapid writes for the same key within 100ms */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export class UserDataService {
  private static getUserKey(username: string, key: string): string {
    return `user_${username}_${key}`;
  }

  // ═══ Startup migration (localStorage only) ═══
  static repairAllUserKeys(): void {
    try {
      let fixed = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("user_")) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          JSON.parse(raw);
        } catch {
          // Skip date-like strings (YYYY-MM-DD) — they're valid but not JSON
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;
          const healed = JSON.stringify(raw);
          localStorage.setItem(key, healed);
          fixed++;
          console.warn(`[UserDataService] Repaired corrupted key: ${key}`);
        }
      }
      if (fixed > 0) {
        console.warn(
          `[UserDataService] Repaired ${fixed} corrupted user_* keys`,
        );
      }
    } catch (e) {
      if (import.meta.env.DEV)
        console.error("[UserDataService] repairAllUserKeys failed:", e);
    }
  }

  // ═══ LocalStorage read (instant, sync) ═══
  static getUserData<T>(username: string, key: string, defaultValue: T): T {
    try {
      const userKey = this.getUserKey(username, key);
      const data = localStorage.getItem(userKey);
      if (!data) return defaultValue;
      try {
        return JSON.parse(data);
      } catch {
        const healed = JSON.stringify(data);
        localStorage.setItem(userKey, healed);
        return data as unknown as T;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error getting user data:", error);
      return defaultValue;
    }
  }

  // ═══ LocalStorage write (debounced) ═══
  static setUserData<T>(username: string, key: string, value: T): void {
    try {
      const userKey = this.getUserKey(username, key);
      const timerKey = userKey;

      if (debounceTimers.has(timerKey)) {
        clearTimeout(debounceTimers.get(timerKey));
      }

      debounceTimers.set(
        timerKey,
        setTimeout(() => {
          try {
            localStorage.setItem(userKey, JSON.stringify(value));
            debounceTimers.delete(timerKey);
          } catch (error) {
            if (import.meta.env.DEV)
              console.error("Error setting user data:", error);
          }
        }, 100),
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error setting user data:", error);
    }
  }

  static setUserDataSync<T>(username: string, key: string, value: T): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.setItem(userKey, JSON.stringify(value));
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error setting user data (sync):", error);
    }
  }

  static clearUserData(username: string, key: string): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.removeItem(userKey);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error clearing user data:", error);
    }
  }

  static clearAllUserData(username: string): void {
    try {
      const keys = Object.keys(localStorage);
      const userPrefix = `user_${username}_`;
      keys.forEach((key) => {
        if (key.startsWith(userPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error clearing all user data:", error);
    }
  }

  static hasUserData(username: string): boolean {
    try {
      const keys = Object.keys(localStorage);
      const userPrefix = `user_${username}_`;
      return keys.some((key) => key.startsWith(userPrefix));
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error checking user data:", error);
      return false;
    }
  }

  // ═══ Daily reset (localStorage only — API handles this server-side) ═══
  static checkAndResetDailyBets(username: string): void {
    try {
      const lastResetKey = this.getUserKey(username, "last_mybets_reset");
      const lastResetRaw = localStorage.getItem(lastResetKey);
      let lastReset: string | null = null;
      try { lastReset = lastResetRaw ? JSON.parse(lastResetRaw) : null; } catch { lastReset = lastResetRaw; }
      const today = new Date().toISOString().split("T")[0];

      if (lastReset !== today) {
        // Mark reset timestamp without deleting any bets
        // (pending bets must persist across days; completed bets stay for history)
        localStorage.setItem(lastResetKey, JSON.stringify(today));
        if (import.meta.env.DEV)
          console.log(`Daily reset performed for ${username} on ${today}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error in daily reset:", error);
    }
  }

  static getTodayBets(
    username: string,
  ): Array<{ date: string; result: string }> {
    try {
      const allBets = this.getUserData<Array<{ date: string; result: string }>>(
        username,
        "mybets_data",
        [],
      );
      const today = new Date().toISOString().split("T")[0];
      return allBets.filter((bet) => {
        const betDate = bet.date.split(" ")[0];
        return betDate === today;
      });
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error getting today bets:", error);
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // API-backed methods (async — for migration)
  // ═══════════════════════════════════════════

  /** Fetch bets from API */
  static async fetchBets(): Promise<ApiBet[]> {
    const data = await api.get<
      | Record<string, unknown>[]
      | { data?: Record<string, unknown>[]; bets?: Record<string, unknown>[] }
    >("/bets");
    const rawBets = Array.isArray(data)
      ? data
      : (
          data as {
            data?: Record<string, unknown>[];
            bets?: Record<string, unknown>[];
          }
        ).data ||
        (data as { bets?: Record<string, unknown>[] }).bets ||
        [];
    const mapped = rawBets.map((b: Record<string, unknown>) => {
      const rawCurrency = String(b.currency || "").toUpperCase();
      const currency =
        rawCurrency === "USD" || rawCurrency === "UAH" ? rawCurrency : "UAH";
      return {
        ...b,
        id: b.id,
        currency,
        odds: parseFloat(String(b.odds ?? 1)),
        amount: parseFloat(String(b.amount ?? 0)),
        profit: parseFloat(String(b.profit || "0")),
        roi: b.roi ? parseFloat(String(b.roi)) : undefined,
        stake: b.stake ? parseFloat(String(b.stake)) : undefined,
        originalAmount: b.originalAmount
          ? parseFloat(String(b.originalAmount))
          : undefined,
        exchangeRate: b.exchangeRate
          ? parseFloat(String(b.exchangeRate))
          : null,
        originalProfit: b.originalProfit
          ? parseFloat(String(b.originalProfit))
          : undefined,
        winProbability: b.winProbability
          ? parseFloat(String(b.winProbability))
          : undefined,
      };
    });
    // Merge API data with localStorage — never downgrade local "Win"/"Loss" to "Pending"
    // NEVER overwrite localStorage with empty API response
    try {
      const username = localStorage.getItem("username") || "default";
      const storageKey = `user_${username}_mybets_data`;
      const localRaw = localStorage.getItem(storageKey);
      let localBets: ApiBet[] = [];
      if (localRaw) localBets = JSON.parse(localRaw) as ApiBet[];

      if (localBets.length > 0) {
        const localMap = new Map(localBets.map((b: ApiBet) => [b.id, b]));
        // Merge API results into local: add new bets, update existing with fresh API data
        const mergedIds = new Set<number | string>();
        for (const apiBet of mapped) {
          const local = localMap.get(apiBet.id as string | number);
          if (local) {
            // Keep local non-Pending result if newer; otherwise use API data
            if (local.result && local.result !== 'Pending') {
              apiBet.result = local.result;
              apiBet.profit = local.profit;
              apiBet.roi = local.roi;
              apiBet.notes = local.notes;
            }
          } else {
            // New bet from API — add to local
            localBets.push(apiBet);
          }
          mergedIds.add(apiBet.id as string | number);
        }
        // Sort by date descending (newest first)
        localBets.sort((a, b) => {
          const da = a.date ? new Date(String(a.date)).getTime() : 0;
          const db = b.date ? new Date(String(b.date)).getTime() : 0;
          return db - da;
        });
        localStorage.setItem(storageKey, JSON.stringify(localBets));
        return localBets as ApiBet[];
      }

      // No local data — safe to use API data as-is
      if (mapped.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(mapped));
      }
    } catch {
      /* storage full — ignore */
    }
    return mapped as ApiBet[];
  }

  /** Create a bet via API */
  static async createBet(bet: Omit<ApiBet, "id">): Promise<ApiBet> {
    return api.post<ApiBet>("/bets", bet);
  }

  /** Update a bet via API */
  static async updateBet(id: string, bet: Partial<ApiBet>): Promise<ApiBet> {
    return api.put<ApiBet>(`/bets/${id}`, bet);
  }

  /** Delete a bet via API */
  static async deleteBet(id: string): Promise<void> {
    await api.delete(`/bets/${id}`);
  }

  /** Fetch bet stats from API */
  static async fetchBetStats(): Promise<{
    totalBets: number;
    winRate: number;
    totalProfit: number;
    averageROI: number;
    profitByMonth: { month: string; profit: number }[];
    profitByStrategy: { strategy: string; profit: number }[];
  }> {
    return api.get("/bets/stats");
  }

  /** Fetch goals from API */
  static async fetchGoals(): Promise<Record<string, unknown>[]> {
    return api.get("/goals");
  }

  /** Create a goal via API */
  static async createGoal(
    goal: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return api.post("/goals", goal);
  }

  /** Update a goal via API */
  static async updateGoal(
    id: string,
    goal: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return api.put(`/goals/${id}`, goal);
  }

  /** Delete a goal via API */
  static async deleteGoal(id: string): Promise<void> {
    await api.delete(`/goals/${id}`);
  }

  /** Fetch strategies from API */
  static async fetchStrategies(): Promise<Record<string, unknown>[]> {
    return api.get("/strategies");
  }

  /** Create a strategy via API */
  static async createStrategy(
    strategy: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return api.post("/strategies", strategy);
  }

  /** Update a strategy via API */
  static async updateStrategy(
    id: string,
    strategy: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return api.put(`/strategies/${id}`, strategy);
  }

  /** Delete a strategy via API */
  static async deleteStrategy(id: string, name?: string): Promise<void> {
    const query = name ? `?name=${encodeURIComponent(name)}` : "";
    await api.delete(`/strategies/${id}${query}`);
  }

  /** Set a strategy as primary (unsets all others) */
  static async setPrimaryStrategy(id: string): Promise<void> {
    await api.put(`/strategies/${id}/primary`);
  }

  // ═══ New API-backed methods (migrated from localStorage-only) ═══

  /** Fetch match ratings from API */
  static async fetchMatchRatings(): Promise<
    Array<{ id: string; matchId: string; rating: string }>
  > {
    return api.get("/match-ratings");
  }

  /** Upsert a match rating (like/dislike) */
  static async upsertMatchRating(
    matchId: string,
    rating: string,
  ): Promise<{ id: string; matchId: string; rating: string }> {
    return api.post("/match-ratings", { matchId, rating });
  }

  /** Delete a match rating */
  static async deleteMatchRating(matchId: string): Promise<void> {
    await api.delete(`/match-ratings/${encodeURIComponent(matchId)}`);
  }

  /** Fetch telegram bets from API */
  static async fetchTelegramBets(): Promise<
    Array<{ id: string; betData: Record<string, unknown> }>
  > {
    return api.get("/telegram-bets");
  }

  /** Save a telegram bet to API */
  static async saveTelegramBet(
    betData: Record<string, unknown>,
  ): Promise<{ id: string }> {
    return api.post("/telegram-bets", { betData });
  }

  /** Delete a telegram bet */
  static async deleteTelegramBet(id: string): Promise<void> {
    await api.delete(`/telegram-bets/${id}`);
  }

  /** Fetch user preferences (theme, lang, max_stake_percent) */
  static async fetchUserPrefs(): Promise<{
    maxStakePercent: number;
    preferences: { theme?: string; lang?: string };
  }> {
    return api.get("/user");
  }

  /** Save user preferences */
  static async saveUserPrefs(data: {
    maxStakePercent?: number;
    preferences?: Record<string, unknown>;
  }): Promise<{
    maxStakePercent: number;
    preferences: Record<string, unknown>;
  }> {
    return api.put("/user", data);
  }

  /** Fetch active tilt blocks for current user */
  static async fetchTiltBlocks(): Promise<
    Array<{ id: string; until: string; reason: string; strategyName: string }>
  > {
    return api.get("/tilt-blocks");
  }

  /** Create a tilt block */
  static async createTiltBlock(data: {
    until: string;
    reason?: string;
    strategyName?: string;
  }): Promise<{ id: string }> {
    return api.post("/tilt-blocks", data);
  }

  /** Delete a tilt block */
  static async deleteTiltBlock(id: string): Promise<void> {
    await api.delete(`/tilt-blocks/${id}`);
  }
}
