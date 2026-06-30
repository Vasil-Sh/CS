// ═══════════════════════════════════════════
// Auth Service — JWT-based via backend API
// Replaces the old Google Sheets auth flow.
// ═══════════════════════════════════════════

import { api, setTokens } from "./apiClient";

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
      }>("/auth/login", { username, password });

      if (!data.success) {
        return {
          success: false,
          error: data.error || "Невірний логін або пароль",
        };
      }

      if (data.token) {
        setTokens(data.token, data.refreshToken || "");
        localStorage.setItem("userRole", data.isAdmin ? "admin" : "user");
        localStorage.setItem("username", username);
      }

      return { success: true, isAdmin: data.isAdmin ?? false };
    } catch (err: unknown) {
      console.error("Login error:", err);
      const status = (err as { status?: number }).status;
      if (status === 403) {
        return {
          success: false,
          error: "Ваша підписка закінчилася. Зверніться до адміністратора.",
        };
      }
      return {
        success: false,
        error: (err as Error).message || "Помилка з'єднання. Спробуйте ще раз.",
      };
    }
  }

  async fetchUsers(): Promise<AdminUser[]> {
    try {
      return await api.get<AdminUser[]>("/auth/users");
    } catch (err: unknown) {
      // 401/403 = not admin → silently return empty (don't bother user)
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) {
        return [];
      }
      if (import.meta.env.DEV)
        console.error("fetchUsers error:", (err as Error).message);
      return []; // network/CORS errors also silent
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

  async validateUser(
    username: string,
    password: string,
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      const result = await this.login(username, password);
      return { isValid: result.success, message: result.error };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { isValid: false, message: e.message || "Помилка з'єднання" };
    }
  }

  /** Create user (admin only) — returns generated credentials */
  async createUser(data: {
    username: string;
    password?: string;
    telegram?: string;
    role?: string;
    priceMonth?: string;
    endDate?: string;
  }): Promise<{ username: string; password: string }> {
    const result = await api.post<{
      success: boolean;
      userId: number;
      username: string;
      password: string;
    }>("/auth/register", data);
    return { username: result.username, password: result.password };
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
