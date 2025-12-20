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
}