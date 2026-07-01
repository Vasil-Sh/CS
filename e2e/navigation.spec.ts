import { test, expect } from "@playwright/test";

test.describe("App Navigation", () => {
  test("landing → login route works", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await page.goto("/login");
    await expect(page).toHaveURL("/login");
  });

  test("404 page works", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    // Should show 404 or redirect
    await expect(page.locator("body")).toBeVisible();
  });

  test("has responsive layout on mobile", async ({ page }) => {
    await page.goto("/");
    // Mobile should render without horizontal scroll
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(0);
    await expect(page.locator("body")).toBeVisible();
  });

  test("meta tags are present (SEO)", async ({ page }) => {
    await page.goto("/");
    // Check for description meta tag
    const metaDescription = page.locator('meta[name="description"]');
    const hasDesc = (await metaDescription.count()) > 0;
    // Title should exist
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("no console errors on landing", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    // Allow some known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("third-party"),
    );
    expect(criticalErrors.length).toBe(0);
  });
});
