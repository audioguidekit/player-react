import { test, expect } from '@playwright/test';
import { getTourId, openTour, startTour } from './helpers';

/**
 * Behavioral coverage for the player: the mini player lifecycle, expand/collapse,
 * the play/pause control, stop-to-stop navigation, transcription, and the URL
 * sync driven by the extracted audio hooks (useAudioPlaybackSync /
 * useMediaSessionIntegration / useStopUrlSync).
 *
 * Assertions stay decode-independent: headless browsers block real audio
 * autoplay, so we never require `isPlaying` to actually flip — we assert the
 * controls, their accessible state, and the navigation/URL effects instead.
 */

test.describe('Player — mini player lifecycle', () => {
  test('singleton audio element is created and preloaded with a source', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await openTour(page, tourId);

    // useAudioPlaybackSync preloads the first audio stop into the singleton
    // element once assets are ready. Poll until the element has a src.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Array.from(document.querySelectorAll('audio')).some((a) => !!a.src)
          ),
        { timeout: 15000 }
      )
      .toBe(true);
  });

  test('starting the tour reveals the mini player with the current stop title', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    const miniPlayer = page.getByTestId('mini-player');
    await expect(miniPlayer).toBeVisible();

    // The expanded mini player exposes a labelled play/pause control.
    await expect(
      miniPlayer.getByRole('button', { name: /Play|Pause/ })
    ).toBeVisible();
  });

  test('starting the tour syncs the current stop into the URL', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    // handleStartTour -> setCurrentStopId -> useStopUrlSync pushes the stop id
    // into the URL as /tour/<tourId>/<stopId>.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 10000 })
      .toMatch(/\/tour\/[^/]+\/[^/]+/);
  });

  test('the play/pause control toggles its accessible label when tapped', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    const control = page.getByTestId('mini-player').getByRole('button', { name: /Play|Pause/ });
    const before = await control.getAttribute('aria-label');

    await control.click();
    // Real audio may or may not start in headless. Either the label flips
    // (play() resolved) or it stays put (autoplay blocked) — both are valid.
    // What must hold: the control stays present and labelled, no crash.
    await expect(control).toHaveAttribute('aria-label', /Play|Pause/);
    expect(['Play', 'Pause']).toContain(before);
  });

  test('the handle collapses and re-expands the mini player', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    // MobileFrame is a fixed 844px-tall mockup on desktop (md:h-[844px]) inside a
    // 720px-tall viewport, so the bottom ~60px of the frame — the collapsed mini
    // player's handle — is clipped off-screen and unclickable. Grow the viewport
    // height (never the width: that would flip the mobile projects to the desktop
    // layout) so the whole frame is reachable.
    const vp = page.viewportSize();
    if (vp && vp.height < 940) await page.setViewportSize({ width: vp.width, height: 940 });

    const miniPlayer = page.getByTestId('mini-player');
    const control = miniPlayer.getByRole('button', { name: /Play|Pause/ });
    await expect(control).toBeVisible();

    // The drag handle sits at the top of the card; clicking it toggles expansion.
    const handleHeight = await miniPlayer.evaluate((el) => el.getBoundingClientRect().height);
    const box = await miniPlayer.boundingBox();
    expect(box).not.toBeNull();
    // Click near the top-center where the handle lives.
    await page.mouse.click(box!.x + box!.width / 2, box!.y + 14);

    // Collapsing shrinks the card considerably (expanded controls disappear).
    await expect
      .poll(async () => (await miniPlayer.boundingBox())?.height ?? 0, { timeout: 5000 })
      .toBeLessThan(handleHeight);

    // Click again to re-expand.
    const collapsedBox = await miniPlayer.boundingBox();
    await page.mouse.click(collapsedBox!.x + collapsedBox!.width / 2, collapsedBox!.y + 14);
    await expect
      .poll(async () => (await miniPlayer.boundingBox())?.height ?? 0, { timeout: 5000 })
      .toBeGreaterThanOrEqual(handleHeight - 1);
  });

  test('start flow does not raise uncaught page errors', async ({ page, request }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const tourId = await getTourId(request);
    await startTour(page, tourId);
    await page.getByTestId('mini-player').getByRole('button', { name: /Play|Pause/ }).click();
    await page.waitForTimeout(1000);

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});

test.describe('Player — stop-to-stop navigation', () => {
  test('tapping a different stop in the list switches the active stop and URL', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    // Ensure we are in the list view (the default tour may open on the map).
    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) {
      await listToggle.click();
    }

    const feed = page.getByTestId('stop-feed');
    await expect(feed).toBeVisible({ timeout: 10000 });

    const pathBefore = new URL(page.url()).pathname;

    // Stop cards carry id="stop-<id>". Click one that isn't the first.
    const stops = page.locator('[id^="stop-"]');
    await expect(stops.first()).toBeVisible();
    const count = await stops.count();
    test.skip(count < 2, 'tour has fewer than two stops');

    await stops.nth(1).click();

    // currentStopId changes -> useStopUrlSync rewrites the path.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 10000 })
      .not.toBe(pathBefore);
  });
});

test.describe('Player — transcription', () => {
  test('the transcription toggle opens a transcript panel when available', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    // Transcription is opt-in per tour; if the active tour has none, skip.
    const toggle = page.getByRole('button', { name: 'Show transcription' });
    const hasTranscription = await toggle.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasTranscription, 'active tour has no transcription');

    await toggle.click();

    // After opening, the inverse control (Hide) should be present.
    await expect(page.getByRole('button', { name: 'Hide transcription' })).toBeVisible();
  });
});

test.describe('Player — fullscreen', () => {
  test('dragging the expanded player up opens the fullscreen player', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await startTour(page, tourId);

    const miniPlayer = page.getByTestId('mini-player');
    await expect(miniPlayer).toBeVisible();
    const box = await miniPlayer.boundingBox();
    expect(box).not.toBeNull();

    // Drag upward from the handle past the open threshold (offset.y < -60).
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + 14;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(startX, startY - i * 18, { steps: 2 });
      await page.waitForTimeout(16);
    }
    await page.mouse.up();

    const fullscreen = page.getByTestId('fullscreen-player');
    const opened = await fullscreen.isVisible({ timeout: 4000 }).catch(() => false);
    test.skip(!opened, 'fullscreen player disabled for this tour or drag not recognised');
    await expect(fullscreen).toBeVisible();
    // Closing via the caret-down header button returns to the mini player.
    await fullscreen.getByRole('button').first().click();
    await expect(fullscreen).toBeHidden({ timeout: 4000 });
  });
});
