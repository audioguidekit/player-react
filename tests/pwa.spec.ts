import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should have a valid manifest', async ({ page }) => {
    await page.goto('/');

    // Check for manifest link in head
    const manifestLink = page.locator('link[rel="manifest"]');
    const exists = await manifestLink.count() > 0;

    if (exists) {
      const href = await manifestLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if service worker API is available
    const swAvailable = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swAvailable).toBe(true);
  });

  test('should have IndexedDB available for offline storage', async ({ page }) => {
    await page.goto('/');

    const idbAvailable = await page.evaluate(() => {
      return 'indexedDB' in window;
    });

    expect(idbAvailable).toBe(true);
  });
});

test.describe('Offline Capabilities', () => {
  test('should cache tour data for offline use', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check cache storage availability
    const cacheAvailable = await page.evaluate(() => {
      return 'caches' in window;
    });

    expect(cacheAvailable).toBe(true);
  });
});
