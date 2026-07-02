import { test, expect } from '@playwright/test';

// Shared setup for all authenticated page tests
async function setupAuth(page: any) {
  await page.route('**/api/auth/login', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, isAdmin: true, token: 'mock-token', refreshToken: 'mock-refresh', user: { username: 'admin', role: 'admin' } }) });
  });
  await page.route('**/api/auth/me', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 1, username: 'admin', role: 'admin', telegram: '', startDate: '2026-01-01', endDate: '2027-12-31' }) });
  });
  await page.route('**/api/bets**', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } }) });
  });
  await page.route('**/api/bankroll**', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 }) });
  });
  await page.route('**/api/strategies*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/goals*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/users*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify([{ id: 1, username: 'admin', role: 'admin', telegram: '', priceMonth: '0', startDate: '2026-01-01', endDate: '2027-12-31', createdAt: '2026-01-01' }]) });
  });
  await page.route('**/api/risky-teams*', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'test');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/analytics', { timeout: 10000 });
}

test.describe('Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Analytics', () => {
    test('shows KPI cards and empty state', async ({ page }) => {
      await loginAsAdmin(page);
      await expect(page.locator('text=Аналітика')).toBeVisible();
      await expect(page.locator('text=Поточний банк')).toBeVisible();
      await expect(page.locator('text=Всього записів')).toBeVisible();
    });

    test('currency switch is visible', async ({ page }) => {
      await loginAsAdmin(page);
      await expect(page.locator('button:has-text("₴ UAH")')).toBeVisible();
    });

    test('navigates to analytics from sidebar', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/analytics"]');
      await expect(page).toHaveURL(/\/app\/analytics/);
      await expect(page.locator('text=Аналітика')).toBeVisible();
    });
  });

  test.describe('Strategy', () => {
    test('shows strategy page with tabs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/strategy"]');
      await page.waitForURL('**/app/strategy');
      await expect(page.locator('text=Стратегії та Цілі')).toBeVisible();
      await expect(page.locator('button:has-text("Стратегії")')).toBeVisible();
      await expect(page.locator('button:has-text("Цілі")')).toBeVisible();
      await expect(page.locator('button:has-text("Ризиковані команди")')).toBeVisible();
    });

    test('tab switching works', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/strategy"]');
      await page.waitForURL('**/app/strategy');
      await page.click('button:has-text("Цілі")');
      await expect(page.locator('button:has-text("Цілі")')).toHaveClass(/bg-\[#447afc\]/);
    });
  });

  test.describe('Matches', () => {
    test('shows matches page', async ({ page }) => {
      await page.route('**/api/Game/TodaysAndUpcoming', async (route: any) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await loginAsAdmin(page);
      await page.click('a[href="/app/matches"]');
      await page.waitForURL('**/app/matches');
      await expect(page.locator('text=Матчі')).toBeVisible();
    });
  });

  test.describe('MyBets', () => {
    test('shows add bet form', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/my-bets"]');
      await page.waitForURL('**/app/my-bets');
      await expect(page.locator('text=Додати запис')).toBeVisible();
    });
  });

  test.describe('Profile', () => {
    test('shows profile page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/profile"]');
      await page.waitForURL('**/app/profile');
      await expect(page.locator('text=Профіль')).toBeVisible();
    });
  });

  test.describe('Telegram', () => {
    test('shows telegram page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/telegram"]');
      await page.waitForURL('**/app/telegram');
      await expect(page.locator('text=Telegram')).toBeVisible();
    });
  });

  test.describe('Admin', () => {
    test('shows admin panel for admin user', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('a[href="/app/admin"]');
      await page.waitForURL('**/app/admin');
      await expect(page.locator('text=Адмін панель')).toBeVisible();
    });
  });
});
