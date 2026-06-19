import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Landing Page', () => {
  test('should render landing page with title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have login link', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Login Page', () => {
  test('should render login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="text"]').fill('wrong_user');
    await page.locator('input[type="password"]').fill('wrong_pass');
    await page.locator('button[type="submit"]').click();
    // Should show some error message
    await expect(page.locator('text=Невірний').or(page.locator('text=Помилка'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('404 Not Found', () => {
  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    // 404 page should render with a heading
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5000 });
  });
});
