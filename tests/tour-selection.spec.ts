import { test, expect } from '@playwright/test';
import { dismissSplashIfPresent } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Multi-tour selection screen + app-level config (src/data/tour/app.json).
 *
 * With more than one tour discovered the app opens on the selection screen.
 * These tests assert the app.json fields drive the landing surface: localized
 * title/subtitle, logo, hero backdrop, tour ordering, and the card layout.
 * Expected values are read from disk so the tests track the real data.
 *
 * See docs/multi-tour.md.
 */

const TOUR_DIR = path.join(process.cwd(), 'src/data/tour');
const APP_JSON_PATH = path.join(TOUR_DIR, 'app.json');

interface AppConfig {
  title?: Record<string, string>;
  subtitle?: Record<string, string>;
  logo?: string;
  hero?: string;
  tourOrder?: string[];
}

// app.json is optional — the repo's own default (single-tour) content doesn't
// ship one. This whole suite is gated on being a multi-tour deployment below.
const appConfig: AppConfig = fs.existsSync(APP_JSON_PATH)
  ? JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf-8'))
  : {};

const discoveredTourCount = fs
  .readdirSync(TOUR_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_')).length;

/** Top-level title of a tour, in the given language. */
function tourTitle(tourId: string, lang = 'en'): string {
  const file = path.join(TOUR_DIR, tourId, `${lang}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8')).title;
}

// Each tour card is a <button> containing the tour title as an <h2>
// (the header title is an <h1>, so this only matches cards).
const TOUR_CARD = 'button:has(h2)';

test.describe('Tour selection screen', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(discoveredTourCount < 2, 'not a multi-tour deployment');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissSplashIfPresent(page);
    await page.locator(TOUR_CARD).first().waitFor({ timeout: 15000 });
  });

  test('lists every discovered tour as a card', async ({ page }) => {
    const discovered = fs
      .readdirSync(TOUR_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_')) // hidden fixture tours aren't listed
      .map(d => d.name);

    await expect(page.locator(TOUR_CARD)).toHaveCount(discovered.length);

    // Every tour's title is on screen.
    for (const id of discovered) {
      await expect(page.getByRole('heading', { level: 2, name: tourTitle(id) })).toBeVisible();
    }
  });

  test('shows the app.json title and subtitle', async ({ page }) => {
    test.skip(!appConfig.title?.en, 'app.json has no title');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(appConfig.title!.en);
    if (appConfig.subtitle?.en) {
      await expect(page.getByText(appConfig.subtitle.en)).toBeVisible();
    }
  });

  test('renders the logo and hero from app.json', async ({ page }) => {
    if (appConfig.logo) {
      await expect(page.locator(`img[src="${appConfig.logo}"]`)).toBeVisible();
    }
    if (appConfig.hero) {
      // Hero is a full-screen backdrop (pointer-events:none, lowest layer).
      await expect(page.locator(`img[src="${appConfig.hero}"]`)).toBeAttached();
    }
  });

  test('orders cards according to tourOrder', async ({ page }) => {
    test.skip(!appConfig.tourOrder || appConfig.tourOrder.length < 2, 'no tourOrder to assert');

    const renderedTitles = await page.locator(`${TOUR_CARD} h2`).allTextContents();
    const expectedTitles = appConfig.tourOrder!.map(id => tourTitle(id));

    // The ordered tours appear first, in the configured order.
    expect(renderedTitles.slice(0, expectedTitles.length)).toEqual(expectedTitles);
  });

  test('opens a tour when its card is tapped', async ({ page }) => {
    const firstId = appConfig.tourOrder?.[0];
    await page.locator(TOUR_CARD).first().click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/tour/');
    if (firstId) expect(page.url()).toContain(firstId);
  });
});
