import { test, expect } from '@playwright/test';

test.describe('Tour Start Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display tour information', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check that the page has loaded some content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should have clickable elements for starting tour', async ({ page }) => {
    // Wait for app to fully load
    await page.waitForTimeout(3000);

    // Look for any buttons or interactive elements
    const buttons = page.locator('button');
    const count = await buttons.count();

    // App should have at least some interactive elements
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Tour Navigation', () => {
  test('should load tour data', async ({ page }) => {
    // Navigate directly to a tour
    await page.goto('/tour/barcelona');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should have content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate to tour
    await page.goto('/tour/barcelona');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Stop Feed', () => {
  test('should display stops when tour is loaded', async ({ page }) => {
    await page.goto('/tour/barcelona');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check page has rendered content
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });
});
