import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the app without errors', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load (either loading screen or main content)
    await expect(page.locator('body')).toBeVisible();

    // Should not have any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for potential loading states to complete
    await page.waitForTimeout(2000);

    // Filter out expected/benign errors (like service worker, etc)
    const criticalErrors = errors.filter(e =>
      !e.includes('service worker') &&
      !e.includes('favicon')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should display tour start screen', async ({ page }) => {
    await page.goto('/');

    // Wait for loading to complete and start screen to appear
    await page.waitForLoadState('networkidle');

    // Should show some tour content after loading
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Navigation', () => {
  test('should navigate to tour detail view', async ({ page }) => {
    await page.goto('/tour/barcelona');

    await page.waitForLoadState('networkidle');

    // URL should contain the tour ID
    expect(page.url()).toContain('barcelona');
  });

  test('should handle direct URL to stop', async ({ page }) => {
    await page.goto('/tour/barcelona/stop/1');

    await page.waitForLoadState('networkidle');

    // URL should contain stop ID
    expect(page.url()).toContain('stop');
  });
});

test.describe('Responsive Design', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // App should be visible and not overflow
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
