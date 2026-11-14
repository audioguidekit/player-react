import { test, expect, type Page } from '@playwright/test';
import { formatPlaybackSpeed, nextPlaybackSpeed, parsePlaybackSpeed, PLAYBACK_SPEEDS } from '../src/playback/playbackSpeed';
import { draftOf, openFullscreenPlayer, startDraft, waitForAudio } from './visitor-helpers';

/** Speed: the control in both players, the audio element, Media Session, persistence and the tour setting. */

test.use({ serviceWorkers: 'block', viewport: { width: 430, height: 900 } });

const KEY = 'agk-playback-speed';
const speedButton = (page: Page) => page.locator('[data-testid="mini-player"] [data-testid="playback-speed"]');
const rate = (page: Page) => page.evaluate(() => document.querySelector('audio')!.playbackRate);

test.describe('speed choices', () => {
  test('offers 0.75, 1, 1.25, 1.5 and 2, and steps through them in a loop', () => {
    expect([...PLAYBACK_SPEEDS]).toEqual([0.75, 1, 1.25, 1.5, 2]);
    expect(nextPlaybackSpeed(0.75)).toBe(1);
    expect(nextPlaybackSpeed(1.5)).toBe(2);
    expect(nextPlaybackSpeed(2)).toBe(0.75);
    expect(formatPlaybackSpeed(1.25)).toBe('1.25×');
    expect(formatPlaybackSpeed(1)).toBe('1×');
  });

  test('a stored value that is not one of the choices means normal speed', () => {
    expect(parsePlaybackSpeed('1.5')).toBe(1.5);
    for (const bad of [null, undefined, '', 'fast', '3', '0', '-1', 'NaN', '1.2']) expect(parsePlaybackSpeed(bad), String(bad)).toBe(1);
  });
});

test.describe('in the player', () => {
  test('the mini player steps through every speed and the audio element follows', async ({ page }) => {
    await startDraft(page, draftOf());
    await waitForAudio(page);
    await expect(speedButton(page)).toHaveAccessibleName('Speed: 1×');
    expect(await rate(page)).toBe(1);

    for (const speed of [1.25, 1.5, 2, 0.75, 1]) {
      await speedButton(page).click();
      await expect(speedButton(page)).toHaveAccessibleName(`Speed: ${speed}×`);
      expect(await rate(page)).toBe(speed);
    }
  });

  test('a screen reader hears the new speed through a polite status region', async ({ page }) => {
    await startDraft(page, draftOf());
    await speedButton(page).click();
    await expect(page.locator('[data-testid="mini-player"] [role="status"]')).toHaveText('Speed: 1.25×');
    await expect(page.locator('[data-testid="mini-player"] [role="status"]')).toHaveAttribute('aria-live', 'polite');
  });

  test('the speed is remembered on the device and kept for the next stop', async ({ page }) => {
    await startDraft(page, draftOf());
    await waitForAudio(page);
    await speedButton(page).click(); // 1.25
    await speedButton(page).click(); // 1.5
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe('1.5');

    // Let the first stop end: load() on the next one resets the rate unless the default rate is set too.
    const firstSrc = await page.evaluate(() => document.querySelector('audio')!.src);
    await page.evaluate(() => { const a = document.querySelector('audio')!; a.currentTime = Math.max(a.duration - 1.5, 0); });
    await expect.poll(() => page.evaluate(() => document.querySelector('audio')!.src), { timeout: 20000 }).not.toBe(firstSrc);
    expect(await rate(page)).toBe(1.5);

    await page.reload();
    await startDraft(page, draftOf());
    await expect(speedButton(page)).toHaveAccessibleName('Speed: 1.5×');
    expect(await rate(page)).toBe(1.5);
  });

  test('going back to normal speed clears the stored value', async ({ page }) => {
    await startDraft(page, draftOf());
    await speedButton(page).click();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe('1.25');
    for (let i = 0; i < 4; i++) await speedButton(page).click(); // 1.5, 2, 0.75, 1
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  });

  test('Media Session is told the speed, so the lock screen scrubber keeps pace', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: { playbackRate: number }[] = [];
      (window as unknown as { __positionStates: typeof calls }).__positionStates = calls;
      const original = navigator.mediaSession.setPositionState.bind(navigator.mediaSession);
      navigator.mediaSession.setPositionState = (state) => {
        if (state) calls.push({ playbackRate: state.playbackRate ?? 1 });
        return original(state);
      };
    });
    await startDraft(page, draftOf());
    await waitForAudio(page);
    await speedButton(page).click();
    await speedButton(page).click(); // 1.5
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __positionStates: { playbackRate: number }[] }).__positionStates.at(-1)?.playbackRate))
      .toBe(1.5);
  });

  test('the full player has the same control, in step with the mini player', async ({ page }) => {
    const draft = draftOf();
    draft.metadata.fullscreenPlayer = true;
    await startDraft(page, draft);
    await waitForAudio(page);
    await openFullscreenPlayer(page);
    const full = page.locator('[data-testid="fullscreen-player"]');

    await full.locator('[data-testid="playback-speed"]').click();
    await expect(full.locator('[data-testid="playback-speed"]')).toHaveAccessibleName('Speed: 1.25×');
    await expect(speedButton(page)).toHaveAccessibleName('Speed: 1.25×');
    expect(await rate(page)).toBe(1.25);
  });
});

test.describe('the tour setting', () => {
  test('showPlaybackSpeed: false removes the control from both players', async ({ page }) => {
    const draft = draftOf();
    draft.metadata.showPlaybackSpeed = false;
    draft.metadata.fullscreenPlayer = true;
    await startDraft(page, draft);
    await waitForAudio(page);
    await expect(page.locator('[data-testid="playback-speed"]')).toHaveCount(0);
    await openFullscreenPlayer(page);
    await expect(page.locator('[data-testid="playback-speed"]')).toHaveCount(0);
  });

  test('a speed chosen on this device is ignored while the control is hidden', async ({ page }) => {
    await page.addInitScript((k) => localStorage.setItem(k, '2'), KEY);
    const draft = draftOf();
    draft.metadata.showPlaybackSpeed = false;
    await startDraft(page, draft);
    await waitForAudio(page);
    expect(await rate(page)).toBe(1);
  });

  test('on by default', async ({ page }) => {
    await startDraft(page, draftOf());
    await expect(speedButton(page)).toBeVisible();
  });
});
