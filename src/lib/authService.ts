interface AdminUser {
  telegram: string;
  username: string;
  password: string;
  priceMonth: string;
  startDate: string;
  endDate: string;
  isAdmin: string;
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
    try {
      const range = 'Доступи!A2:G100';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      
      console.log('Fetching users from Google Sheets...');
      console.log('API Key exists:', !!this.apiKey);
      console.log('Spreadsheet ID:', this.spreadsheetId);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch users from Google Sheets:', errorData);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];
      
      console.log('Successfully fetched users:', rows.length);
      console.log('Raw data:', rows);

      return rows.map((row: string[]) => ({
        telegram: row[0] || '',
        username: row[1] || '',
        password: row[2] || '',
        priceMonth: row[3] || '',
        startDate: row[4] || '',
        endDate: row[5] || '',
        isAdmin: row[6] || ''
      })).filter((user: AdminUser) => user.username && user.password);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      console.log('=== Starting login ===');
      console.log('Username:', username);
      
      const users = await this.fetchUsers();
      console.log('Total users fetched:', users.length);
      
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password
      );

      if (!user) {
        console.log('User not found or password mismatch');
        return { 
          success: false, 
          error: "Невірний логін або пароль" 
        };
      }

      console.log('User found:', user);

      // Check if user is admin
      const isAdmin = user.isAdmin.toLowerCase() === 'так' || user.isAdmin.toLowerCase() === 'yes';
      console.log('Is admin:', isAdmin);
      
      if (isAdmin) {
        console.log('Admin user logged in successfully');
        localStorage.setItem("authToken", "admin-token");
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("username", username);
        return { success: true, isAdmin: true };
      }

      // Check subscription for regular users
      const endDate = this.parseDate(user.endDate);
      const now = new Date();

      console.log('End date:', endDate);
      console.log('Current date:', now);

      if (endDate && endDate > now) {
        console.log('Subscription is valid');
        localStorage.setItem("authToken", "user-token");
        localStorage.setItem("userRole", "user");
        localStorage.setItem("username", username);
        return { success: true, isAdmin: false };
      } else {
        console.log('Subscription expired');
        return { 
          success: false, 
          error: "Ваша підписка закінчилася. Зверніться до адміністратора." 
        };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: "Помилка з'єднання. Спробуйте ще раз." 
      };
    }
  }

  async validateAdmin(username: string, password: string): Promise<boolean> {
    try {
      const users = await this.fetchUsers();
      console.log('Validating admin for username:', username);
      
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password
      );
      
      console.log('User found:', !!user);
      console.log('Is admin:', user ? user.isAdmin : 'N/A');
      
      return user ? (user.isAdmin.toLowerCase() === 'так' || user.isAdmin.toLowerCase() === 'yes') : false;
    } catch (error) {
      console.error('Error validating admin:', error);
      return false;
    }
  }

  async validateUser(username: string, password: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      console.log('=== Starting user validation ===');
      console.log('Username:', username);
      
      const users = await this.fetchUsers();
      console.log('Total users fetched:', users.length);
      
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.password === password
      );

      if (!user) {
        console.log('User not found or password mismatch');
        return { 
          isValid: false, 
          message: "Невірний логін або пароль" 
        };
      }

      console.log('User found:', user);

      // Check if user is admin
      const isAdmin = user.isAdmin.toLowerCase() === 'так' || user.isAdmin.toLowerCase() === 'yes';
      console.log('Is admin:', isAdmin);
      
      if (isAdmin) {
        console.log('Admin user validated successfully');
        return { isValid: true };
      }

      // Check subscription for regular users
      const endDate = this.parseDate(user.endDate);
      const now = new Date();

      console.log('End date:', endDate);
      console.log('Current date:', now);

      if (endDate && endDate > now) {
        console.log('Subscription is valid');
        return { isValid: true };
      } else {
        console.log('Subscription expired');
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