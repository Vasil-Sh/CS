import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Analytics Page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/analytics');
  });

  test('should render analytics page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Аналітика' })).toBeVisible({ timeout: 10000 });
  });

  test('should show stat cards', async ({ page }) => {
    // There should be stat cards with labels
    await expect(page.getByText('Всього записів').or(page.getByText('Поточний банк')).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show BalanceTracker', async ({ page }) => {
    await expect(page.getByText('Трекер балансу')).toBeVisible({ timeout: 5000 });
  });

  test('should have game filter', async ({ page }) => {
    // Check if CS2/Dota2 filter buttons exist
    const filterSection = page.locator('button').filter({ hasText: /CS2|Dota2/i }).first();
    await expect(filterSection).toBeVisible({ timeout: 5000 });
  });
});

test.describe('MyBets Page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/my-bets');
  });

  test('should render MyBets page', async ({ page }) => {
    // Page heading may show 'Додати запис' or have stat cards
    await expect(page.getByText('Поточний банк').or(page.getByText('Додати запис')).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show stat cards with key metrics', async ({ page }) => {
    await expect(page.getByText('Всього записів').or(page.getByText('Поточний банк')).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Вінрейт')).toBeVisible({ timeout: 5000 });
  });

  test('should have tabs for adding and viewing records', async ({ page }) => {
    // There should be at least 2 tabs
    const tabs = page.locator('button').filter({ hasText: /Додати запис|Останні записи/i });
    await expect(tabs.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show BetTable with records', async ({ page }) => {
    // Switch to records tab
    const recordsTab = page.locator('button').filter({ hasText: 'Останні записи' });
    if (await recordsTab.isVisible()) {
      await recordsTab.click();
    }
    await expect(page.getByText('Останні записи')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile Page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/profile');
  });

  test('should render profile page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Профіль' })).toBeVisible({ timeout: 10000 });
  });

  test('should show user data stats', async ({ page }) => {
    // Stats cards show labels like 'Ваші ставки', 'Стратегії', 'Ризикові команди'
    // Even with no data, the cards should render with '0'
    await expect(page.getByText('Ваші ставки').or(page.getByText('Ризикові команди')).first()).toBeVisible({ timeout: 5000 });
  });

  test('should have backup section with export buttons', async ({ page }) => {
    await expect(page.getByText('Бекап даних')).toBeVisible({ timeout: 5000 });
    // Check for JSON export button
    await expect(page.getByText('Завантажити повний бекап')).toBeVisible({ timeout: 5000 });
    // Check for CSV export
    await expect(page.getByText('Експорт ставок у CSV')).toBeVisible({ timeout: 5000 });
  });

  test('should have import section', async ({ page }) => {
    await expect(page.getByText('Відновити з бекапу')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Strategy Page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/strategy');
  });

  test('should render strategy page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Стратегія' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Matches Page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/matches');
  });

  test('should render matches page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Матчі' })).toBeVisible({ timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Пошук"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });
});
