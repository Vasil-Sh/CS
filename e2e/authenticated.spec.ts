import { test, expect } from '@playwright/test';

test.describe('Authenticated User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login API to succeed
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isAdmin: false,
          token: 'mock-token',
          refreshToken: 'mock-refresh',
          user: { username: 'testuser', role: 'user' },
        }),
      });
    });

    // Mock /api/auth/me to return user profile
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1, username: 'testuser', role: 'user',
          telegram: '', startDate: '2026-01-01', endDate: '2027-12-31',
        }),
      });
    });

    // Mock /api/bets to return empty
    await page.route('**/api/bets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
      });
    });

    // Mock /api/bankroll to return empty
    await page.route('**/api/bankroll**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 }),
      });
    });

    // Mock /api/strategies to return empty
    await page.route('**/api/strategies*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock /api/goals to return empty
    await page.route('**/api/goals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('login → navigates to analytics', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#username')).toBeVisible();

    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    await page.click('button[type="submit"]');

    // Should navigate to /app/analytics after login
    await page.waitForURL('**/app/analytics', { timeout: 10000 });
    await expect(page).toHaveURL(/\/app\/analytics/);
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Go to protected page without auth
    await page.goto('/app/my-bets');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('body')).toBeVisible();
  });

  test('analytics page loads after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/analytics', { timeout: 10000 });

    // Check that analytics page content is visible
    await expect(page.locator('body')).toBeVisible();
    // Title should contain MatchIQ
    await expect(page).toHaveTitle(/MatchIQ/);
  });
});
