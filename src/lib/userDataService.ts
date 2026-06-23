// User-specific data isolation service with debounced writes

/** Simple debounce: coalesce rapid writes for the same key within 100ms */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export class UserDataService {
  private static getUserKey(username: string, key: string): string {
    return `user_${username}_${key}`;
  }

  /**
   * Startup migration: scan ALL user_* keys and re-encode any that are not valid JSON.
   * Fixes data corrupted by old backup import (pre-v1.14.7) where user-scoped keys
   * were stored as raw strings instead of JSON.
   * Call once in main.tsx before app renders.
   */
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
          // Not valid JSON — re-encode
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

  // Get user-specific data
  static getUserData<T>(username: string, key: string, defaultValue: T): T {
    try {
      const userKey = this.getUserKey(username, key);
      const data = localStorage.getItem(userKey);
      if (!data) return defaultValue;
      try {
        return JSON.parse(data);
      } catch {
        // Data is not JSON — may be a raw string (e.g. from old backup import).
        // Return as-is if it looks like a string; self-heal by re-encoding.
        const healed = JSON.stringify(data);
        localStorage.setItem(userKey, healed);
        return data as unknown as T;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return defaultValue;
    }
  }

  // Set user-specific data (debounced: coalesces rapid writes per key)
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

  /** Synchronous write — no debounce. Use for data that must be immediately readable. */
  static setUserDataSync<T>(username: string, key: string, value: T): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.setItem(userKey, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting user data (sync):', error);
    }
  }

  // Clear user-specific data
  static clearUserData(username: string, key: string): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Clear all user data
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

  // Check if user has any data
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

  // NEW: Daily reset functionality for "My Bets" section
  static checkAndResetDailyBets(username: string): void {
    try {
      const lastResetKey = this.getUserKey(username, 'last_mybets_reset');
      const lastReset = localStorage.getItem(lastResetKey);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      if (lastReset !== today) {
        // Reset the "My Bets" recent bets display (not the full history)
        const currentBets = this.getUserData<Array<{ result: string }>>(username, 'mybets_data', []);
        
        // Keep only completed bets (Win/Loss) in history, clear Pending bets
        const completedBets = currentBets.filter((bet: { result: string }) => bet.result !== 'Pending');
        this.setUserData(username, 'mybets_data', completedBets);
        
        // Update last reset date
        localStorage.setItem(lastResetKey, today);
        
        console.log(`Daily reset performed for ${username} on ${today}`);
      }
    } catch (error) {
      console.error('Error in daily reset:', error);
    }
  }

  // Get today's bets only (for display in My Bets section)
  static getTodayBets(username: string): Array<{ date: string; result: string }> {
    try {
      const allBets = this.getUserData<Array<{ date: string; result: string }>>(username, 'mybets_data', []);
      const today = new Date().toISOString().split('T')[0];
      
      return allBets.filter((bet: { date: string }) => {
        const betDate = bet.date.split(' ')[0]; // Extract date part
        return betDate === today;
      });
    } catch (error) {
      console.error('Error getting today bets:', error);
      return [];
    }
  }
}