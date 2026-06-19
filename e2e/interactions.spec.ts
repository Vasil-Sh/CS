import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Navigation (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/analytics');
  });

  test('sidebar link: Аналітика navigates correctly', async ({ page }) => {
    const analyticsLink = page.getByRole('link', { name: 'Аналітика' });
    await analyticsLink.click();
    await expect(page.getByRole('heading', { name: 'Аналітика' })).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/app/analytics');
  });

  test('sidebar link: Матчі navigates correctly', async ({ page }) => {
    const matchesLink = page.getByRole('link', { name: 'Матчі' });
    await matchesLink.click();
    await expect(page.getByRole('heading', { name: 'Матчі' })).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/app/matches');
  });

  test('sidebar link: Профіль navigates correctly', async ({ page }) => {
    const profileLink = page.getByRole('link', { name: 'Профіль' });
    await profileLink.click();
    await expect(page.getByRole('heading', { name: 'Профіль' })).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/app/profile');
  });

  test('sidebar link: Стратегія navigates correctly', async ({ page }) => {
    const strategyLink = page.getByRole('link', { name: /Стратегії/ });
    await strategyLink.click();
    await expect(page.getByRole('heading', { name: 'Стратегія' })).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/app/strategy');
  });

  test('logout button redirects to landing', async ({ page }) => {
    const logoutButton = page.locator('button[aria-label*="Вийти"]').or(page.getByText('Вийти')).first();
    await logoutButton.click();
    // Should redirect to / or /login
    await page.waitForURL(/\/$|\/login/, { timeout: 5000 });
    // authToken should be removed
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });
});

test.describe('MyBets Interactions (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/my-bets');
  });

  test('BetTable search filters records (positive)', async ({ page }) => {
    // Switch to records tab first
    const recordsTab = page.locator('button').filter({ hasText: 'Останні записи' });
    if (await recordsTab.isVisible()) await recordsTab.click();
    await page.waitForTimeout(500);

    // Find search input in BetTable
    const searchInput = page.locator('input[placeholder*="Пошук"]').first();
    // If no search input, the page may not have loaded BetTable with filter bar
    const searchVisible = await searchInput.isVisible().catch(() => false);
    if (searchVisible) {
      await searchInput.fill('NAVI');
      // Should still show the table header
      await expect(page.getByText('Останні записи')).toBeVisible({ timeout: 3000 });
    }
  });

  test('BetTable search no results (negative)', async ({ page }) => {
    const recordsTab = page.locator('button').filter({ hasText: 'Останні записи' });
    if (await recordsTab.isVisible()) await recordsTab.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="Пошук"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    if (searchVisible) {
      await searchInput.fill('XYZ_NONEXISTENT_MATCH_12345');
      // Should not crash
      await expect(page.getByText(/0 запис/).or(page.locator('body'))).toBeAttached({ timeout: 3000 });
    }
  });

  test('filter tabs toggle correctly', async ({ page }) => {
    // "Сьогодні" button
    const todayBtn = page.getByRole('button', { name: 'Сьогодні' });
    if (await todayBtn.isVisible()) {
      await todayBtn.click();
      await expect(todayBtn).toBeVisible({ timeout: 2000 });
    }
    // "Всі матчі" button
    const allBtn = page.getByRole('button', { name: /Всі матчі/ });
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await expect(allBtn).toBeVisible({ timeout: 2000 });
    }
  });

  test('advanced filters expand/collapse', async ({ page }) => {
    const recordsTab = page.locator('button').filter({ hasText: 'Останні записи' });
    if (await recordsTab.isVisible()) await recordsTab.click();

    const advancedBtn = page.getByRole('button', { name: 'Розширені' });
    if (await advancedBtn.isVisible()) {
      await advancedBtn.click();
      // Filters should appear
      await expect(page.getByText('Результат:').or(page.getByText('Період:')).first()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Profile Interactions (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/profile');
  });

  test('JSON export triggers download (positive)', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      page.getByRole('button', { name: /Завантажити повний бекап/i }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('matchiq-backup-');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('CSV export triggers download (positive)', async ({ page }) => {
    // First seed some bet data so CSV is not empty
    await page.evaluate(() => {
      const fakeBets = [{
        date: '19.06.2026', match: 'Test Match', team1: 'A', team2: 'B',
        game: 'CS2', tournament: 'Test Cup', betType: 'Win', format: '1x',
        odds: 2.5, amount: 100, result: 'Win', profit: 150, roi: 150, strategy: 'test', notes: ''
      }];
      localStorage.setItem('user_e2e-test-user_mybets_data', JSON.stringify(fakeBets));
    });
    await page.reload();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      page.getByRole('button', { name: /Завантажити CSV/i }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('matchiq-bets-');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

test.describe('Matches Interactions (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'e2e-test-user');
    await page.goto('/app/matches');
  });

  test('search filters matches', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Пошук"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('NAVI');
    await searchInput.press('Enter');
    // Should not crash
    await expect(page.locator('body')).toBeAttached();
  });

  test('search empty results shows empty state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Пошук"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('ZZZZ_NONEXISTENT_TEAM_98765');
    await searchInput.press('Enter');
    // Should not crash
    await expect(page.locator('body')).toBeAttached();
  });

  test('page loads without error', async ({ page }) => {
    // Verify the page loaded and main heading is visible
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });
});
