// ═══════════════════════════════════════════
// Auth Service — JWT-based via backend API
// Replaces the old Google Sheets auth flow.
// ═══════════════════════════════════════════

import { api, setTokens } from './apiClient';

export interface LoginResult {
  success: boolean;
  error?: string;
  isAdmin?: boolean;
}

export interface SimpleUser {
  telegram: string;
  username: string;
  isAdmin: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  telegram: string;
  priceMonth: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const data = await api.post<{
        success: boolean;
        isAdmin?: boolean;
        token?: string;
        refreshToken?: string;
        error?: string;
        user?: { username: string; role: string };
      }>('/auth/login', { username, password });

      if (!data.success) {
        return { success: false, error: data.error || 'Невірний логін або пароль' };
      }

      if (data.token) {
        setTokens(data.token, data.refreshToken || '');
        localStorage.setItem('userRole', data.isAdmin ? 'admin' : 'user');
        localStorage.setItem('username', username);
      }

      return { success: true, isAdmin: data.isAdmin ?? false };
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.status === 403) {
        return { success: false, error: 'Ваша підписка закінчилася. Зверніться до адміністратора.' };
      }
      return { success: false, error: err.message || "Помилка з'єднання. Спробуйте ще раз." };
    }
  }

  async fetchUsers(): Promise<AdminUser[]> {
    try {
      return await api.get<AdminUser[]>('/auth/users');
    } catch (err: any) {
      console.error('fetchUsers error:', err);
      if (err.status === 401 || err.status === 403) {
        return [];
      }
      throw err;
    }
  }

  async validateAdmin(username: string, password: string): Promise<boolean> {
    try {
      const result = await this.login(username, password);
      return result.success && !!result.isAdmin;
    } catch {
      return false;
    }
  }

  async validateUser(username: string, password: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const result = await this.login(username, password);
      return { isValid: result.success, message: result.error };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { isValid: false, message: e.message || "Помилка з'єднання" };
    }
  }

  /** Create user (admin only) */
  async createUser(data: { username: string; password: string; telegram?: string; role?: string; priceMonth?: string; endDate?: string }): Promise<void> {
    await api.post('/auth/register', data);
  }

  /** Update user (admin only) */
  async updateUser(id: number, data: Record<string, unknown>): Promise<void> {
    await api.put(`/auth/users/${id}`, data);
  }

  /** Delete user (admin only) */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/auth/users/${id}`);
  }
}

export const authService = new AuthService();
