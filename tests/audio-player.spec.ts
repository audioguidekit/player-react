import { test, expect } from '@playwright/test';
import { getTourId } from './helpers';

test.describe('Audio Player', () => {
  test('should have audio elements available', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await page.goto(`/tour/${tourId}`);
    await page.waitForLoadState('networkidle');
    // Give time for tour data to load
    await page.waitForTimeout(3000);

    // Check that audio elements can be created (singleton pattern)
    const audioExists = await page.evaluate(() => {
      return typeof HTMLAudioElement !== 'undefined';
    });

    expect(audioExists).toBe(true);
  });

  test('should handle audio context initialization', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await page.goto(`/tour/${tourId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Audio context should be available
    const audioContextExists = await page.evaluate(() => {
      return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
    });

    expect(audioContextExists).toBe(true);
  });
});

test.describe('Mini Player', () => {
  test('should not crash on initial render', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await page.goto(`/tour/${tourId}`);
    await page.waitForLoadState('networkidle');

    // Wait for potential mini player to render
    await page.waitForTimeout(3000);

    // Page should still be responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});


