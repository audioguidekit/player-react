import { test, expect } from '@playwright/test';
import { getTourId } from './helpers';

test.describe('Image lightbox zoom', () => {
  test('double-tap (double-click) zooms image in lightbox', async ({ page, request }) => {
    const tourId = await getTourId(request);

    // Go directly to tour detail and enter the tour
    await page.goto(`/tour/${tourId}`, { waitUntil: 'networkidle' });

    const startButton = page.locator('button:has-text("Start tour")');
    await startButton.waitFor({ timeout: 10000 });
    await startButton.click();

    // Give the feed time to render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Scroll a bit to ensure image cards are in view
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(500);

    // Click the first image that should open a lightbox.
    // We rely on the tour having at least one image stop (audio with image or image-text).
    const feedImage = page.locator('main img').first();
    await feedImage.waitFor({ timeout: 10000 });
    await feedImage.click();

    // Wait for lightbox to open (close button appears)
    const closeButton = page.getByLabel('Close');
    await closeButton.waitFor({ timeout: 10000 });

    // The lightbox image is rendered in the portal; last img on the page is a good approximation.
    const lightboxImage = page.locator('img').last();
    await lightboxImage.waitFor({ timeout: 10000 });

    const beforeBox = await lightboxImage.boundingBox();
    expect(beforeBox).not.toBeNull();

    // Simulate a quick double-tap via double-click
    await lightboxImage.dblclick();
    await page.waitForTimeout(400);

    const afterBox = await lightboxImage.boundingBox();
    expect(afterBox).not.toBeNull();

    // After zoom, the rendered width should be noticeably larger
    if (beforeBox && afterBox) {
      expect(afterBox.width).toBeGreaterThan(beforeBox.width * 1.15);
      expect(afterBox.height).toBeGreaterThan(beforeBox.height * 1.15);
    }
  });
});

