import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * app.json `tourCard` display toggles for the selection screen.
 *
 * `showImage` / `showDescription` / `showMeta` control what every tour card
 * renders (applies to ALL cards — no per-tour override). The title is always
 * shown. Mutates src/data/tour/app.json and reloads (Vite re-bundles the eager
 * import), then asserts the DOM — mirroring stop-card-display.spec.ts.
 *
 * See docs/multi-tour.md.
 */

const TOUR_DIR = path.join(process.cwd(), 'src/data/tour');
const APP_JSON_PATH = path.join(TOUR_DIR, 'app.json');

// Each tour card is a <button> containing the title as an <h2>.
const TOUR_CARD = 'button:has(h2)';

const discoveredTourCount = fs
  .readdirSync(TOUR_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_')).length;

const combinations = [
  { showImage: true,  showDescription: true,  showMeta: true,  name: '1-full' },
  { showImage: false, showDescription: true,  showMeta: true,  name: '2-no-image' },
  { showImage: true,  showDescription: false, showMeta: true,  name: '3-no-description' },
  { showImage: true,  showDescription: true,  showMeta: false, name: '4-no-meta' },
  { showImage: false, showDescription: false, showMeta: false, name: '5-title-only' },
];

let originalAppJson: string | undefined;

// Serial: every test mutates the same file.
test.describe.configure({ mode: 'serial' });

test.describe('Tour card display options', () => {
  test.beforeAll(() => {
    // tourCard config only affects the multi-tour picker screen, and the repo's
    // own default (single-tour) content doesn't ship an app.json at all.
    test.skip(!fs.existsSync(APP_JSON_PATH) || discoveredTourCount < 2, 'not a multi-tour deployment with app.json');
    originalAppJson = fs.readFileSync(APP_JSON_PATH, 'utf-8');
  });

  test.afterAll(() => {
    if (originalAppJson !== undefined) fs.writeFileSync(APP_JSON_PATH, originalAppJson);
  });

  for (const combo of combinations) {
    test(`${combo.name}: image=${combo.showImage}, description=${combo.showDescription}, meta=${combo.showMeta}`, async ({ page }) => {
      const config = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf-8'));
      config.tourCard = {
        showImage: combo.showImage,
        showDescription: combo.showDescription,
        showMeta: combo.showMeta,
      };
      fs.writeFileSync(APP_JSON_PATH, JSON.stringify(config, null, 2) + '\n');

      // Let Vite re-bundle the eager app.json import, then load a fresh page.
      await page.waitForTimeout(2500);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.locator(TOUR_CARD).first().waitFor({ timeout: 15000 });

      await page.screenshot({ path: `test-results/tour-card-${combo.name}.png`, fullPage: false });

      // Title is ALWAYS shown.
      const cardCount = await page.locator(TOUR_CARD).count();
      expect(cardCount).toBeGreaterThan(0);
      expect(await page.locator(`${TOUR_CARD} h2`).count()).toBe(cardCount);

      // Image: at least one card has an <img> when enabled; none when disabled.
      const cardImages = await page.locator(`${TOUR_CARD} img`).count();
      if (combo.showImage) {
        expect(cardImages).toBeGreaterThan(0);
      } else {
        expect(cardImages).toBe(0);
      }

      // Description: a <p> inside each card when enabled; none when disabled.
      const descriptions = await page.locator(`${TOUR_CARD} p`).count();
      expect(descriptions).toBe(combo.showDescription ? cardCount : 0);

      // Meta row: duration/stops <span>s present only when enabled.
      const metaSpans = await page.locator(`${TOUR_CARD} span`).count();
      if (combo.showMeta) {
        expect(metaSpans).toBeGreaterThan(0);
      } else {
        expect(metaSpans).toBe(0);
      }
    });
  }
});
