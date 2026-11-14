import { test, expect } from '@playwright/test';
import { getTourId, startTour } from './helpers';

/**
 * Compile-time mode (tour data bundled in) with no VITE_ANALYTICS_ENDPOINT:
 * analytics is off, so self-hosters who changed nothing send nothing at all.
 * The on-by-default behaviour of manifest mode is tested in tests-manifest/analytics.spec.ts.
 */
test.use({ serviceWorkers: 'block' });

test('a compiled build without VITE_ANALYTICS_ENDPOINT sends no analytics and stores nothing', async ({ page, request }) => {
  test.skip(!!process.env.VITE_ANALYTICS_ENDPOINT, 'this test is for builds without an endpoint');
  const posts: string[] = [];
  await page.route(
    (url) => url.pathname === '/e',
    async (route) => {
      posts.push(route.request().method());
      await route.fulfill({ status: 204 });
    },
  );
  await page.addInitScript(() => {
    (window as unknown as { __beacons: number }).__beacons = 0;
    const original = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      (window as unknown as { __beacons: number }).__beacons++;
      return original(url, data);
    };
  });

  await startTour(page, await getTourId(request));
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(1500);

  expect(posts).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { __beacons: number }).__beacons)).toBe(0);
  expect(await page.evaluate(() => sessionStorage.getItem('agk_sid'))).toBeNull();
  expect(await page.evaluate(async () => (await indexedDB.databases()).some((d) => d.name === 'agk-analytics'))).toBe(false);
});
