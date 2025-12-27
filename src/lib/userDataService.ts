// User-specific data isolation service
export class UserDataService {
  private static getUserKey(username: string, key: string): string {
    return `user_${username}_${key}`;
  }

  // Get user-specific data
  static getUserData<T>(username: string, key: string, defaultValue: T): T {
    try {
      const userKey = this.getUserKey(username, key);
      const data = localStorage.getItem(userKey);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Error getting user data:', error);
      return defaultValue;
    }
  }

  // Set user-specific data
  static setUserData<T>(username: string, key: string, value: T): void {
    try {
      const userKey = this.getUserKey(username, key);
      localStorage.setItem(userKey, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting user data:', error);
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