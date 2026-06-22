/**
 * Unit tests: AuthContext
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/authService';
import { type ReactNode } from 'react';

vi.mock('@/lib/authService', () => ({ authService: { login: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) { return AuthProvider({ children }); }

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
  afterEach(() => localStorage.clear());

  describe('initial state', () => {
    it('no localStorage → user = null', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('localStorage restores user', () => {
      localStorage.setItem('username','cached');
      localStorage.setItem('userRole','admin');
      localStorage.setItem('authToken','token');
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.user).toEqual({ username:'cached', role:'admin' });
      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe('login', () => {
    it('success sets user', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({ success:true, isAdmin:false });
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => { await result.current.login('u','p'); });
      expect(result.current.user).toEqual({ username:'u', role:'user' });
    });

    it('failure keeps null', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({ success:false, error:'err' });
      const { result } = renderHook(() => useAuth(), { wrapper });
      const r = await act(async () => result.current.login('bad','wrong'));
      expect(r.success).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears user and localStorage', () => {
      localStorage.setItem('username','u');
      localStorage.setItem('userRole','user');
      localStorage.setItem('authToken','token');
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => result.current.logout());
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('storage events', () => {
    it('authToken removed in other tab → user = null', () => {
      localStorage.setItem('username','mt');
      localStorage.setItem('userRole','user');
      localStorage.setItem('authToken','token');
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new StorageEvent('storage',{ key:'authToken', oldValue:'token', newValue:null }));
      });
      expect(result.current.user).toBeNull();
    });
  });

  describe('useAuth outside provider', () => {
    it('throws', () => {
      expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});
