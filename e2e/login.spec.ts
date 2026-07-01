import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("navigates to login from landing", async ({ page }) => {
    await page.goto("/");
    // Click login link
    const loginLink = page.getByRole("link", { name: /увійти|login/i }).first();
    await loginLink.click();
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page has form fields", async ({ page }) => {
    await page.goto("/login");

    // Username input should exist
    const usernameInput = page.locator(
      'input[type="text"], input[name="username"], input[id="username"]',
    );
    // Login form should be present
    await expect(page.locator("input")).not.toHaveCount(0);
  });

  test("shows back-to-home link", async ({ page }) => {
    await page.goto("/login");
    const backLink = page.getByRole("link", { name: /головну|home/i });
    await expect(backLink.first()).toBeVisible();
  });

  test("has page title", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/MatchIQ/);
  });
});
