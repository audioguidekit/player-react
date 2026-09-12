import { test, expect, type Page } from '@playwright/test';
import { startTour } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Per-tour config flags — the "off" cases a customizer relies on.
 *
 * Most coverage asserts a flag being *present* changes the UI; the inverse
 * (flag off → element absent) is just as important and was previously untested.
 * These mutate the hidden `_fixture` tour's data, reload (Vite re-bundles the
 * eager import), and assert the DOM — same pattern as stop-card-display.spec.
 */

test.use({ viewport: { width: 430, height: 1100 } });

// ── No mutation needed: _fixture has no mapView field, so it's list-only ────
test.describe('View toggle gating', () => {
  test('a list-only tour (mapView off) shows no map/list toggle', async ({ page }) => {
    await startTour(page, '_fixture');
    await expect(page.getByTestId('stop-feed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Map view' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'List view' })).toHaveCount(0);
  });
});

// ── Fixture mutation: toggle one flag at a time from a pristine baseline ─────
test.describe('Fixture flag toggles', () => {
  test.describe.configure({ mode: 'serial' });

  const FIXTURE_EN = path.join(process.cwd(), 'src/data/tour/_fixture/en.json');
  let original: string;

  test.beforeAll(() => {
    original = fs.readFileSync(FIXTURE_EN, 'utf-8');
  });
  test.afterAll(() => {
    fs.writeFileSync(FIXTURE_EN, original);
  });

  // Apply a patch on top of the pristine baseline (non-cumulative), then let
  // Vite pick up the change before the next navigation.
  async function setFlags(page: Page, patch: Record<string, unknown>): Promise<void> {
    const data = { ...JSON.parse(original), ...patch };
    fs.writeFileSync(FIXTURE_EN, JSON.stringify(data, null, 2) + '\n');
    await page.waitForTimeout(2500);
  }

  test('baseline: transcription control, rating stop, and progress bar all present', async ({ page }) => {
    await setFlags(page, {}); // pristine
    await startTour(page, '_fixture');

    await expect(page.getByRole('button', { name: 'Show transcription' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-stop-type="rating"]')).toHaveCount(1);
    await expect(page.getByTestId('tour-progress')).toHaveCount(1);
  });

  test('transcriptAvailable:false hides the transcription control', async ({ page }) => {
    await setFlags(page, { transcriptAvailable: false });
    await startTour(page, '_fixture');

    await expect(page.getByTestId('mini-player')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show transcription' })).toHaveCount(0);
  });

  test('collectFeedback:false removes the rating stop from the feed', async ({ page }) => {
    await setFlags(page, { collectFeedback: false });
    await startTour(page, '_fixture');

    await expect(page.getByTestId('stop-feed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-stop-type="rating"]')).toHaveCount(0);
  });

  test('showProgressBar:false hides the header progress bar', async ({ page }) => {
    await setFlags(page, { showProgressBar: false });
    await startTour(page, '_fixture');

    await expect(page.getByTestId('stop-feed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('tour-progress')).toHaveCount(0);
  });
});
