/** Smoke test: page modules load without throwing */
import { describe, it, expect } from 'vitest';

describe('Page module loading', () => {
  it('MyBets module loads', async () => {
    const mod = await import('@/pages/MyBets');
    expect(mod.default).toBeDefined();
  });

  it('Matches module loads', async () => {
    const mod = await import('@/pages/Matches');
    expect(mod.default).toBeDefined();
  });

  it('Admin module loads', async () => {
    const mod = await import('@/pages/Admin');
    expect(mod.default).toBeDefined();
  });

  it('Profile module loads', async () => {
    const mod = await import('@/pages/Profile');
    expect(mod.default).toBeDefined();
  });

  it('Strategy module loads', async () => {
    const mod = await import('@/pages/Strategy');
    expect(mod.default).toBeDefined();
  });
});
