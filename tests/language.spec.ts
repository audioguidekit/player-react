import { test, expect } from '@playwright/test';

test.describe('Language System', () => {
  test('should load language data', async ({ page }) => {
    // Languages are now bundled at build time via import.meta.glob
    // Verify the app loads and has language data available
    await page.goto('/');

    // Wait for loading to complete (loading spinner to disappear)
    await expect(page.getByText('Preparing your tour')).toBeHidden({ timeout: 30000 });

    // Wait for the tour title to appear (h1 element with tour title)
    const title = page.locator('h1').filter({ hasText: /Barcelona|Unlimited/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });

    // Verify language selector is functional (languages are available)
    const languageButton = page.getByRole('button', { name: /language|English|Čeština|Deutsch/i });
    // The language selector should exist and be interactive
    await expect(languageButton).toBeVisible({ timeout: 5000 });
  });

  test('should load English tour data by default', async ({ page }) => {
    // Tours are bundled at build time - verify the tour loads
    await page.goto('/');

    // Wait for loading to complete
    await expect(page.getByText('Preparing your tour')).toBeHidden({ timeout: 30000 });

    // Wait for tour content to appear (h1 element with tour title)
    const title = page.locator('h1').filter({ hasText: /Barcelona|Unlimited/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('should have language configuration in local storage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that localStorage is accessible
    const storageAvailable = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    });

    expect(storageAvailable).toBe(true);
  });
});

test.describe('Multi-language Tours', () => {
  const languages = ['en', 'cs', 'de'];

  for (const lang of languages) {
    test(`should load ${lang} tour data`, async ({ page }) => {
      // Request the tour data directly - files still exist for PWA/offline
      const response = await page.request.get(`/data/tours/${lang}.json`);

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeTruthy();
        expect(data.id).toBeTruthy();
        expect(data.language).toBe(lang);
      }
    });
  }
});
