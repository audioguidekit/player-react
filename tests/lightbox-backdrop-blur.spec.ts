import { test, expect } from '@playwright/test';
import { getTourId } from './helpers';

test.describe('Image lightbox backdrop blur', () => {
  test('backdropFilter blur is applied to lightbox backdrop', async ({ page, request }) => {
    const tourId = await getTourId(request);

    // Navigate to a real tour and enter it
    await page.goto(`/tour/${tourId}`, { waitUntil: 'networkidle' });

    const startButton = page.locator('button:has-text("Start tour")');
    await startButton.waitFor({ timeout: 10000 });
    await startButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Scroll to bring image stops into view
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(500);

    // Open first image stop → should trigger ImageLightbox
    const feedImage = page.locator('main img').first();
    await feedImage.waitFor({ timeout: 10000 });
    await feedImage.click();

    // Wait for lightbox to open (close button visible)
    const closeButton = page.getByLabel('Close');
    await closeButton.waitFor({ timeout: 10000 });

    // In the portal, find the backdrop div that has a non-none backdropFilter
    const blurInfo = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const matches: { idx: number; backdropFilter: string }[] = [];
      allDivs.forEach((el, idx) => {
        const style = window.getComputedStyle(el);
        const bf = (style as any).backdropFilter as string;
        if (bf && bf !== 'none') {
          matches.push({ idx, backdropFilter: bf });
        }
      });
      return matches;
    });

    // Expect at least one element to have a blur() backdropFilter applied
    expect(Array.isArray(blurInfo)).toBe(true);
    expect(blurInfo.length).toBeGreaterThan(0);

    // Optionally, assert it contains blur with a radius (browser may normalize the value)
    const hasBlur = blurInfo.some((m: any) =>
      typeof m.backdropFilter === 'string' && m.backdropFilter.includes('blur')
    );
    expect(hasBlur).toBe(true);
  });
});

