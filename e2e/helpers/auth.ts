import { test as base, type Page } from '@playwright/test';

/**
 * Simulate login by populating localStorage with auth credentials.
 * MatchIQ uses localStorage keys: username, userRole, authToken.
 */
export async function loginAs(page: Page, username: string, role: 'admin' | 'user' = 'user') {
  await page.goto('/');
  await page.evaluate(
    ({ username, role }) => {
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', role);
      localStorage.setItem('authToken', `mock-token-${username}-${Date.now()}`);
    },
    { username, role }
  );
}

/**
 * Test fixture with auto-login.
 * Usage:
 *   test('my test', async ({ authedPage }) => { ... })
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginAs(page, 'test-user', 'user');
    await use(page);
  },
});

export { expect } from '@playwright/test';
