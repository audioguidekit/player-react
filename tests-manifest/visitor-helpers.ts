import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Manifest, TourData, TourMetadataFile } from '@audioguidekit/schema';
import { dismissSplashIfPresent, startButton } from '../tests/helpers';

/**
 * Shared by the visitor-feature specs: open the manifest-mode player with a manifest the test
 * edits first. The player accepts a manifest from its own origin through the preview bridge
 * (playwright.manifest.config.ts allows it), so each test gets its own content and settings
 * without a rebuild.
 */

/** The manifest the suite was built with: barcelona plus barcelona-evening (20 s same-origin audio per stop). */
export const baseManifest = (): Manifest => JSON.parse(readFileSync('dist-manifest/data/manifest.json', 'utf8'));

export const EVENING = 'barcelona-evening';

/** The English file and the settings of a tour, for the test to change. */
export interface Draft {
  manifest: Manifest;
  tour: TourData;
  metadata: TourMetadataFile;
}

export function draftOf(tourId = EVENING): Draft {
  const manifest = baseManifest();
  const entry = manifest.tours.find((t) => t.id === tourId)!;
  return { manifest, tour: entry.languages.en, metadata: entry.metadata };
}

/** Another audio stop shaped like the evening tour's own, with the title and body the test needs. */
export const audioStop = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'audio' as const,
  title,
  duration: '0:20',
  isCompleted: false,
  image: '',
  audioFile: '',
  ...extra,
});

/** Settle on the loaded player, replace its content with `draft.manifest` and go to the tour. */
export async function openDraft(page: Page, draft: Draft, tourId = EVENING): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
  await dismissSplashIfPresent(page);
  await page.evaluate(
    (manifest) =>
      new Promise<void>((resolve, reject) => {
        const onMessage = (event: MessageEvent) => {
          if (event.data?.type === 'agk:manifest-applied') resolve();
          if (event.data?.type === 'agk:manifest-error') reject(new Error(event.data.message));
        };
        window.addEventListener('message', onMessage);
        window.postMessage({ type: 'agk:manifest', manifest }, location.origin);
      }),
    draft.manifest,
  );
  await page.evaluate((id) => {
    history.pushState({}, '', `/tour/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, tourId);
  await startButton(page).waitFor({ timeout: 15000 });
}

/** Open the tour and press Start, which opens the stop list and the player. */
export async function startDraft(page: Page, draft: Draft, tourId = EVENING): Promise<void> {
  await openDraft(page, draft, tourId);
  await startButton(page).click();
  await page.locator('[data-testid="mini-player"]').waitFor({ state: 'attached', timeout: 15000 });
}

/** Wait until the shared audio element is really playing. */
export const waitForAudio = (page: Page) =>
  expect
    .poll(() => page.evaluate(() => { const a = document.querySelector('audio'); return !!a && !a.paused && a.currentTime > 0; }), { timeout: 15000 })
    .toBe(true);

/**
 * Open the full player the way a visitor does: drag the expanded player up from its handle. Needs a
 * phone-height viewport (`test.use({ viewport: { width: 430, height: 900 } })`) and a tour with
 * `fullscreenPlayer: true`.
 */
export async function openFullscreenPlayer(page: Page): Promise<void> {
  const mini = page.getByTestId('mini-player');
  await expect(mini).toBeVisible();
  let previous = -1;
  await expect
    .poll(async () => {
      const box = (await mini.boundingBox())!;
      const key = box.y * 10000 + box.height;
      const settled = key === previous;
      previous = key;
      return settled;
    }, { intervals: [200], timeout: 10000 })
    .toBe(true);
  const box = (await mini.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + 14;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(x, y - i * 18, { steps: 2 });
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await expect(page.getByTestId('fullscreen-player')).toBeVisible();
}
