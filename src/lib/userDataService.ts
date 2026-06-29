// ═══════════════════════════════════════════
// User Data Service — localStorage + API hybrid
// Write: API first, localStorage as cache
// Read: localStorage (instant), API for refresh
// ═══════════════════════════════════════════

import { api } from './apiClient';
import type { Bet as ApiBet } from '@/types/betting';

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
        if (!key || !key.startsWith('user_')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          JSON.parse(raw);
        } catch {
          const healed = JSON.stringify(raw);
          localStorage.setItem(key, healed);
          fixed++;
          console.warn(`[UserDataService] Repaired corrupted key: ${key}`);
        }
      }
      if (fixed > 0) {
        console.warn(`[UserDataService] Repaired ${fixed} corrupted user_* keys`);
      }
    } catch (e) {
      console.error('[UserDataService] repairAllUserKeys failed:', e);
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
      console.error('Error getting user data:', error);
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

      debounceTimers.set(timerKey, setTimeout(() => {
        try {
          localStorage.setItem(userKey, JSON.stringify(value));
          debounceTimers.delete(timerKey);
        } catch (error) {
          console.error('Error setting user data:', error);
        }
      }, 100));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  }

  static setUserDataSync<T>(username: string, key: string, value: T): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.setItem(userKey, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting user data (sync):', error);
    }
  }

  static clearUserData(username: string, key: string): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  static clearAllUserData(username: string): void {
    try {
      const keys = Object.keys(localStorage);
      const userPrefix = `user_${username}_`;
      keys.forEach(key => {
        if (key.startsWith(userPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all user data:', error);
    }
  }

  static hasUserData(username: string): boolean {
    try {
      const keys = Object.keys(localStorage);
      const userPrefix = `user_${username}_`;
      return keys.some(key => key.startsWith(userPrefix));
    } catch (error) {
      console.error('Error checking user data:', error);
      return false;
    }
  }

  // ═══ Daily reset (localStorage only — API handles this server-side) ═══
  static checkAndResetDailyBets(username: string): void {
    try {
      const lastResetKey = this.getUserKey(username, 'last_mybets_reset');
      const lastReset = localStorage.getItem(lastResetKey);
      const today = new Date().toISOString().split('T')[0];

      if (lastReset !== today) {
        const currentBets = this.getUserData<Array<{ result: string }>>(username, 'mybets_data', []);
        const completedBets = currentBets.filter((bet) => bet.result !== 'Pending');
        this.setUserData(username, 'mybets_data', completedBets);
        localStorage.setItem(lastResetKey, today);
        if (import.meta.env.DEV) console.log(`Daily reset performed for ${username} on ${today}`);
      }
    } catch (error) {
      console.error('Error in daily reset:', error);
    }
  }

  static getTodayBets(username: string): Array<{ date: string; result: string }> {
    try {
      const allBets = this.getUserData<Array<{ date: string; result: string }>>(username, 'mybets_data', []);
      const today = new Date().toISOString().split('T')[0];
      return allBets.filter((bet) => {
        const betDate = bet.date.split(' ')[0];
        return betDate === today;
      });
    } catch (error) {
      console.error('Error getting today bets:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // API-backed methods (async — for migration)
  // ═══════════════════════════════════════════

  /** Fetch bets from API */
  static async fetchBets(): Promise<ApiBet[]> {
    const data = await api.get<Record<string, unknown>[]>('/bets');
    return data.map((b) => ({
      ...b,
      id: b.id,
      odds: parseFloat(b.odds),
      amount: parseFloat(b.amount),
      profit: parseFloat(b.profit || '0'),
      roi: b.roi ? parseFloat(b.roi) : undefined,
      stake: b.stake ? parseFloat(b.stake) : undefined,
      originalAmount: b.originalAmount ? parseFloat(b.originalAmount) : undefined,
      exchangeRate: b.exchangeRate ? parseFloat(b.exchangeRate) : null,
      originalProfit: b.originalProfit ? parseFloat(b.originalProfit) : undefined,
      winProbability: b.winProbability ? parseFloat(b.winProbability) : undefined,
    }));
  }

  /** Create a bet via API */
  static async createBet(bet: Omit<ApiBet, 'id'>): Promise<ApiBet> {
    return api.post<ApiBet>('/bets', bet);
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
    return api.get('/bets/stats');
  }

  /** Fetch goals from API */
  static async fetchGoals(): Promise<Record<string, unknown>[]> {
    return api.get('/goals');
  }

  /** Create a goal via API */
  static async createGoal(goal: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.post('/goals', goal);
  }

  /** Update a goal via API */
  static async updateGoal(id: string, goal: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.put(`/goals/${id}`, goal);
  }

  /** Delete a goal via API */
  static async deleteGoal(id: string): Promise<void> {
    await api.delete(`/goals/${id}`);
  }

  /** Fetch strategies from API */
  static async fetchStrategies(): Promise<Record<string, unknown>[]> {
    return api.get('/strategies');
  }

  /** Create a strategy via API */
  static async createStrategy(strategy: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.post('/strategies', strategy);
  }

  /** Update a strategy via API */
  static async updateStrategy(id: string, strategy: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.put(`/strategies/${id}`, strategy);
  }

  /** Delete a strategy via API */
  static async deleteStrategy(id: string): Promise<void> {
    await api.delete(`/strategies/${id}`);
  }
}
