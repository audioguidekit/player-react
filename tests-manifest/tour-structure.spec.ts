import { test, expect, type Page } from '@playwright/test';
import { isFreeExploration, structureDisplay } from '../src/utils/tourStructure';
import { draftOf, startDraft, waitForAudio, type Draft } from './visitor-helpers';

/** Tour structure: a guided route plays the next stop on its own; free exploration stops after each one. */

test.use({ serviceWorkers: 'block', viewport: { width: 430, height: 900 } });

test.describe('what each structure shows', () => {
  test('guided (and an absent setting) keeps the author\'s numbers, route line and markers', () => {
    const tour = { showStopNumber: true, mapRoute: true, mapMarker: 'number' as const };
    expect(structureDisplay(tour)).toEqual(tour);
    expect(structureDisplay({ ...tour, tourStructure: 'guided' })).toEqual(tour);
    expect(isFreeExploration({})).toBe(false);
  });

  test('free exploration drops the numbers, the route line and numbered markers, but keeps photo markers', () => {
    expect(structureDisplay({ tourStructure: 'free', showStopNumber: true, mapRoute: true, mapMarker: 'number' }))
      .toEqual({ showStopNumber: false, mapRoute: undefined, mapMarker: 'empty' });
    expect(structureDisplay({ tourStructure: 'free' }).mapMarker).toBe('empty');
    expect(structureDisplay({ tourStructure: 'free', mapMarker: 'image' }).mapMarker).toBe('image');
  });
});

// Every stop of the test tour shares one audio file, so the stop on air is read from the mini player's title.
const miniPlayer = (page: Page) => page.locator('[data-testid="mini-player"]');
const FIRST = 'Welcome and Instructions';
const SECOND = 'The Urquinaona Tower';
const paused = (page: Page) => page.evaluate(() => document.querySelector('audio')!.paused);
/** Jump to just before the end of the playing stop. */
const finishStop = (page: Page) => page.evaluate(() => { const a = document.querySelector('audio')!; a.currentTime = Math.max(a.duration - 1, 0); });

const withStructure = (structure: 'guided' | 'free' | undefined, keepTransition = false): Draft => {
  const draft = draftOf();
  if (structure) draft.metadata.tourStructure = structure;
  else delete draft.metadata.tourStructure;
  if (!keepTransition) delete draft.metadata.transitionAudio;
  return draft;
};

test.describe('when a stop ends', () => {
  test('a guided route (the default) plays the next stop', async ({ page }) => {
    await startDraft(page, withStructure(undefined));
    await waitForAudio(page);
    await expect(miniPlayer(page)).toContainText(FIRST);
    await finishStop(page);
    // The next stop is on air (it does not start sounding here only because it shares the first stop's file).
    await expect(miniPlayer(page)).toContainText(SECOND, { timeout: 20000 });
  });

  test('free exploration stays on the stop and stops playing; the visitor picks the next one', async ({ page }) => {
    await startDraft(page, withStructure('free'));
    await waitForAudio(page);
    await expect(miniPlayer(page)).toContainText(FIRST);
    await finishStop(page);
    await expect.poll(() => paused(page), { timeout: 20000 }).toBe(true);
    // Longer than the 1.5 s completion animation after which a guided route moves on.
    await page.waitForTimeout(3000);
    await expect(miniPlayer(page)).toContainText(FIRST);
    await expect(miniPlayer(page)).not.toContainText(SECOND);
    expect(await paused(page)).toBe(true);
  });

  test('free exploration still plays the transition sound as a "finished" signal, then stops', async ({ page }) => {
    const draft = withStructure('free', true);
    const transition = draft.metadata.transitionAudio!;
    expect(transition).toBeTruthy();
    await startDraft(page, draft);
    await waitForAudio(page);
    await finishStop(page);
    await expect.poll(() => page.evaluate(() => document.querySelector('audio')!.src), { timeout: 20000 }).toContain(transition.split('/').pop()!);
    await expect.poll(() => paused(page), { timeout: 20000 }).toBe(true);
    await expect(miniPlayer(page)).toContainText(FIRST);
    await expect(miniPlayer(page)).not.toContainText(SECOND);
  });
});
