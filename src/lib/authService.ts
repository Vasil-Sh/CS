interface AdminUser {
  telegram: string;
  username: string;
  password: string;
  priceMonth: string;
  startDate: string;
  endDate: string;
  isAdmin: string;
}

/** Simplified user info for consumers that only need public fields */
export interface SimpleUser {
  telegram: string;
  username: string;
  isAdmin: boolean;
}

interface LoginResult {
  success: boolean;
  error?: string;
  isAdmin?: boolean;
}

import { SPREADSHEET_ID_AUTH } from './sheetsConfig';

class AuthService {
  private spreadsheetId = SPREADSHEET_ID_AUTH;
  private apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';

  async fetchUsers(): Promise<AdminUser[]> {
    // Try Sheets v4 API first (requires API key)
    if (this.apiKey) {
      try {
        const range = 'Доступи!A2:G100';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}?key=${this.apiKey}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const rows = data.values || [];
          const users = rows.map((row: string[]) => ({
            telegram: row[0] || '',
            username: row[1] || '',
            password: row[2] || '',
            priceMonth: row[3] || '',
            startDate: row[4] || '',
            endDate: row[5] || '',
            isAdmin: row[6] || ''
          })).filter((user: AdminUser) => user.username && user.password);
          return this.applyLocalOverrides(users);
        }
        console.warn('Sheets v4 API failed, falling back to CSV');
      } catch (e) {
        console.warn('Sheets v4 API error, falling back to CSV:', e);
      }
    }

    // Fallback: fetch via gviz CSV export (no API key needed)
    return this.fetchUsersFromCsv();
  }

  /** Fetch users via Google Sheets CSV export (gviz) — no API key required */
  private async fetchUsersFromCsv(): Promise<AdminUser[]> {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv`;
      const response = await fetch(url);
      const text = await response.text();

      const rows = text.split('\n').slice(1).filter(r => r.trim());
      const users = rows.map(row => {
        const m = row.match(/("(?:[^"]|"")*"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!m || m.length < 7) return null;
        return {
          telegram: m[0].replace(/"/g, '').trim(),
          username: m[1].replace(/"/g, '').trim(),
          password: m[2].replace(/"/g, '').trim(),
          priceMonth: m[3].replace(/"/g, '').trim(),
          startDate: m[4].replace(/"/g, '').trim(),
          endDate: m[5].replace(/"/g, '').trim(),
          isAdmin: m[6]?.replace(/"/g, '').trim() || '',
        };
      }).filter((u): u is AdminUser => u !== null && !!u.username);

      return this.applyLocalOverrides(users);
    } catch (error) {
      console.error('Error fetching users from CSV:', error);
      return [];
    }
  }

  /** Apply adminUserEdits from localStorage on top of Google Sheets data */
  private applyLocalOverrides(users: AdminUser[]): AdminUser[] {
    try {
      const deletedList: string[] = JSON.parse(localStorage.getItem('adminDeletedUsers') || '[]');

      // 1. Apply edits to existing users
      const editsRaw = localStorage.getItem('adminUserEdits');
      const edits: Record<string, Partial<AdminUser>> = editsRaw ? JSON.parse(editsRaw) : {};

      const merged = users.map(user => {
        const edit = edits[user.username];
        if (!edit) return user;
        return { ...user, ...edit };
      });

      // 2. Add locally-created users (adminLocalUsers)
      const localRaw = localStorage.getItem('adminLocalUsers');
      if (localRaw) {
        const localUsers = JSON.parse(localRaw) as AdminUser[];
        localUsers.forEach((lu: AdminUser) => {
          if (!merged.find(u => u.username.toLowerCase() === lu.username.toLowerCase())) {
            merged.push(lu);
          }
        });
      }

      // 3. Filter out deleted users
      return merged.filter(u => !deletedList.includes(u.username));
    } catch {
      return users;
    }
  }

  /** Normalize isAdmin field — handles both Google Sheets "так"/"yes" and Admin panel boolean */
  private checkIsAdmin(user: AdminUser): boolean {
    if (typeof user.isAdmin === 'boolean') return user.isAdmin;
    const val = String(user.isAdmin || '').toLowerCase();
    return val === 'так' || val === 'yes';
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const users = await this.fetchUsers();

      // If Google Sheets returned no users (API key missing?), try local-only auth
      if (users.length === 0) {
        const localOnly = this.getLocalUsersOnly();
        if (localOnly.length > 0) {
          const localUser = localOnly.find(
            u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
          );
          if (localUser) {
            return this.completeLogin(localUser, username);
          }
        }
        return { success: false, error: "Невірний логін або пароль" };
      }
      
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password
      );

      if (!user) {
        return { 
          success: false, 
          error: "Невірний логін або пароль" 
        };
      }

      return this.completeLogin(user, username);
    } catch (error) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: "Помилка з'єднання. Спробуйте ще раз." 
      };
    }
  }

  /** Get only locally-created users (from adminLocalUsers in localStorage) */
  private getLocalUsersOnly(): AdminUser[] {
    try {
      const raw = localStorage.getItem('adminLocalUsers');
      if (!raw) return [];
      return JSON.parse(raw) as AdminUser[];
    } catch {
      return [];
    }
  }

  /** Complete the login process for a found user */
  private completeLogin(user: AdminUser, username: string): LoginResult {
    const isAdmin = this.checkIsAdmin(user);
    
    if (isAdmin) {
      localStorage.setItem("authToken", "admin-token");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("username", username);
      return { success: true, isAdmin: true };
    }

    // Check subscription for regular users
    const endDate = this.parseDate(user.endDate);
    const now = new Date();

    if (endDate && endDate > now) {
      localStorage.setItem("authToken", "user-token");
      localStorage.setItem("userRole", "user");
      localStorage.setItem("username", username);
      return { success: true, isAdmin: false };
    } else {
      return { 
        success: false, 
        error: "Ваша підписка закінчилася. Зверніться до адміністратора." 
      };
    }
  }

  async validateAdmin(username: string, password: string): Promise<boolean> {
    try {
      const users = await this.fetchUsers();
      
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password
      );
      
      return user ? this.checkIsAdmin(user) : false;
    } catch (error) {
      console.error('Error validating admin:', error);
      return false;
    }
  }

  async validateUser(username: string, password: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const users = await this.fetchUsers();
      
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password
      );

      if (!user) {
        return { 
          isValid: false, 
          message: "Невірний логін або пароль" 
        };
      }

      // Check if user is admin
      const isAdmin = this.checkIsAdmin(user);
      
      if (isAdmin) {
        return { isValid: true };
      }

      // Check subscription for regular users
      const endDate = this.parseDate(user.endDate);
      const now = new Date();

      if (endDate && endDate > now) {
        return { isValid: true };
      } else {
        return { 
          isValid: false, 
          message: "Ваша підписка закінчилася. Зверніться до адміністратора." 
        };
      }
    } catch (error) {
      console.error('Error validating user:', error);
      return { 
        isValid: false, 
        message: "Помилка з'єднання. Спробуйте ще раз." 
      };
    }
  }

  private parseDate(dateStr: string): Date | null {
    try {
      // Parse date in format DD/MM/YYYY
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }
}

export const authService = new AuthService();