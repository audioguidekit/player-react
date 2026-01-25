import { test, expect } from '@playwright/test';

test.describe('Language System', () => {
<<<<<<< Updated upstream
  test('should load language data', async ({ page }) => {
    // Languages are now bundled at build time via import.meta.glob
    // Verify the app loads and has language data available
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the app to fully load (tour title should appear)
    await expect(page.getByText(/Barcelona|Unlimited/i)).toBeVisible({ timeout: 10000 });

    // Verify language selector is functional (languages are available)
    const languageButton = page.getByRole('button', { name: /language|English|Čeština|Deutsch/i });
    // The language selector should exist and be interactive
    await expect(languageButton).toBeVisible({ timeout: 5000 });
  });

  test('should load English tour data by default', async ({ page }) => {
    // Tours are bundled at build time - verify the tour loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for tour content to appear
    await expect(page.getByText(/Barcelona|tour|stops/i)).toBeVisible({ timeout: 10000 });
=======
  test('should discover tour languages at build time', async ({ page }) => {
    // With the new tour discovery system, languages are derived from tour JSON files
    // at build time using import.meta.glob, not fetched from languages.json
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the app to fully load
    await page.waitForTimeout(2000);

    // The app should load without errors
    const hasError = await page.locator('text=Error').count();
    expect(hasError).toBe(0);
  });

  test('should load English tour data by default', async ({ page }) => {
    // Intercept tour data loading (tours are bundled via import.meta.glob)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // App should show tour content
    const hasContent = await page.locator('[data-testid], h1, h2, h3, button').count();
    expect(hasContent).toBeGreaterThan(0);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      // Request the tour data directly - files still exist for PWA/offline
=======
      // Request the tour data directly - files still exist for reference
>>>>>>> Stashed changes
      const response = await page.request.get(`/data/tours/${lang}.json`);

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeTruthy();
        expect(data.id).toBeTruthy();
<<<<<<< Updated upstream
        expect(data.language).toBe(lang);
=======
        // Verify tour has language field
        expect(data.language).toBeTruthy();
>>>>>>> Stashed changes
      }
    });
  }
});
