import { test, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test('locate button on reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-results/reload-0-initial.png' });

  const state = await page.evaluate(() => {
    const portal = document.getElementById('map-controls-portal');
    const btn = document.querySelector('[aria-label="Show my location"]');
    const mapView = document.querySelector('.leaflet-container');
    return {
      portalExists: !!portal,
      portalChildren: portal?.children.length ?? 0,
      btnFound: !!btn,
      btnBottom: portal?.style.getPropertyValue('--btn-bottom'),
      mapMounted: !!mapView,
      viewportHeight: window.innerHeight,
      btnRect: btn ? btn.getBoundingClientRect() : null,
    };
  });
  console.log('Initial state:', JSON.stringify(state, null, 2));

  // Start tour if needed
  const startBtn = page.locator('button', { hasText: /start/i }).first();
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(1500);
    const mapTab = page.locator('[aria-label="Map view"]');
    if (await mapTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mapTab.click();
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: 'test-results/reload-1-started.png' });

  // Now reload
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'test-results/reload-2-after-reload.png' });

  const afterReload = await page.evaluate(() => {
    const portal = document.getElementById('map-controls-portal');
    const btn = document.querySelector('[aria-label="Show my location"]');
    return {
      portalChildren: portal?.children.length ?? 0,
      btnFound: !!btn,
      btnBottom: portal?.style.getPropertyValue('--btn-bottom'),
      viewportHeight: window.innerHeight,
      btnRect: btn ? btn.getBoundingClientRect() : null,
      miniPlayerVisible: !!document.querySelector('[class*="Container"]'),
    };
  });
  console.log('After reload:', JSON.stringify(afterReload, null, 2));
});
