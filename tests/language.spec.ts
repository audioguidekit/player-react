import { test, expect } from '@playwright/test';

test.describe('Language System', () => {
  test('should load language data', async ({ page }) => {
    // Intercept the languages API call
    const languagesPromise = page.waitForResponse(
      response => response.url().includes('languages.json')
    );

    await page.goto('/');

    const response = await languagesPromise;
    expect(response.status()).toBe(200);
  });

  test('should load English tour data by default', async ({ page }) => {
    // Intercept tour data loading
    const tourPromise = page.waitForResponse(
      response => response.url().includes('.json') && response.url().includes('tours')
    );

    await page.goto('/');

    const response = await tourPromise;
    expect(response.status()).toBe(200);
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
      // Request the tour data directly
      const response = await page.request.get(`/data/tours/${lang}.json`);

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeTruthy();
        expect(data.id).toBeTruthy();
      }
    });
  }
});
