/**
 * Unit tests: authService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.stubEnv('VITE_GOOGLE_SHEETS_API_KEY', '');

import { authService } from '@/lib/authService';

function csv(...rows: string[][]) {
  return ['telegram,username,password,price,start,end,isAdmin',
    ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

function mockFetch(csvText: string) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    text: () => Promise.resolve(csvText),
    json: () => Promise.reject(new Error('no')),
  } as Response);
}

function mockFetchFail() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
}

describe('authService', () => {
  beforeEach(() => localStorage.clear());

  describe('login', () => {
    it('success', async () => {
      mockFetch(csv(['@u','u1','p1','10','01/01/2025','31/12/2026','no']));
      const r = await authService.login('u1','p1');
      expect(r.success).toBe(true);
    });

    it('admin yes', async () => {
      mockFetch(csv(['@a','adm','ap','0','01/01/2025','31/12/2030','yes']));
      expect((await authService.login('adm','ap')).isAdmin).toBe(true);
    });

    it('admin так', async () => {
      mockFetch(csv(['@a','u','p','0','01/01/2025','31/12/2030','так']));
      expect((await authService.login('u','p')).isAdmin).toBe(true);
    });

    it('wrong password', async () => {
      mockFetch(csv(['@u','u','pass','10','01/01/2025','31/12/2026','no']));
      const r = await authService.login('u','wrong');
      expect(r.success).toBe(false);
    });

    it('expired', async () => {
      mockFetch(csv(['@u','old','p','10','01/01/2024','31/12/2024','no']));
      const r = await authService.login('old','p');
      expect(r.success).toBe(false);
      expect(r.error).toContain('підписка');
    });

    it('network error', async () => {
      mockFetchFail();
      const r = await authService.login('u','p');
      expect(r.success).toBe(false);
    });
  });

  describe('validateAdmin', () => {
    it('true for admin', async () => {
      mockFetch(csv(['@a','sa','p','0','01/01/2025','31/12/2030','yes']));
      expect(await authService.validateAdmin('sa','p')).toBe(true);
    });

    it('false for user', async () => {
      mockFetch(csv(['@u','reg','p','10','01/01/2025','31/12/2026','no']));
      expect(await authService.validateAdmin('reg','p')).toBe(false);
    });
  });

  describe('validateUser', () => {
    it('active user', async () => {
      mockFetch(csv(['@u','au','p','10','01/01/2025','31/12/2027','no']));
      expect(await authService.validateUser('au','p')).toEqual({ isValid: true });
    });

    it('wrong password', async () => {
      mockFetch(csv(['@u','u','pass','10','01/01/2025','31/12/2027','no']));
      const r = await authService.validateUser('u','wrong');
      expect(r.isValid).toBe(false);
    });
  });
});
