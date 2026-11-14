import { test, expect, type Page } from '@playwright/test';
import type { Stop } from '@audioguidekit/schema';
import {
  DEFAULT_STOP_SEARCH_THRESHOLD,
  fillText,
  normalizeForSearch,
  showsStopSearch,
  stopMatches,
  stopSearchThreshold,
} from '../src/stopSearch/searchStops';
import { audioStop, draftOf, startDraft, type Draft } from './visitor-helpers';

/** Stop search: the pure matching rules, when the field shows, and how it behaves for a keyboard and a screen reader. */

test.use({ serviceWorkers: 'block', viewport: { width: 430, height: 900 } });

const TITLES = ['Alpha gate', 'Beta bridge', 'Gamma garden', 'Delta tower', 'Epsilon cellar', 'Zeta market', 'Eta chapel', 'Theta harbour', 'Iota square'];

/** A tour with `count` audio stops (numbered 1..count); the third has a body text and the fourth a transcript. */
function tourOf(count: number): Draft {
  const draft = draftOf();
  draft.tour.stops = TITLES.slice(0, count).map((title, i) =>
    audioStop(`s${i + 1}`, title, {
      content: i === 2 ? '<p>Designed by the <strong>Güell</strong> family</p>' : undefined,
      transcription: i === 3 ? 'The tower bell rings at noon.' : undefined,
    }),
  ) as Stop[];
  draft.tour.totalStops = count;
  return draft;
}

const field = (page: Page) => page.getByRole('searchbox', { name: 'Search stops' });
const stopIds = (page: Page) =>
  page.locator('[data-testid="stop-feed"] [id^="stop-"]').evaluateAll((els) => els.map((el) => el.id.replace('stop-', '')));

test.describe('matching', () => {
  const stop = (extra: Record<string, unknown>) => ({ id: 'x', type: 'text', ...extra }) as Stop;

  test('ignores case, accents and markup', () => {
    expect(normalizeForSearch('  Café <b>Güell</b>  ')).toBe('cafe guell');
    expect(stopMatches(stop({ title: 'Park Güell' }), 'GUELL')).toBe(true);
    expect(stopMatches(stop({ content: '<p>Built by <em>Gaudí</em></p>' }), 'gaudi')).toBe(true);
    expect(stopMatches(stop({ content: '<a href="https://example.com/secret">link</a>' }), 'secret')).toBe(false); // attributes are not text
  });

  test('every word of the query has to be found, in any order', () => {
    const s = stop({ title: 'Park Güell', content: 'Terrace with a mosaic bench' });
    expect(stopMatches(s, 'mosaic park')).toBe(true);
    expect(stopMatches(s, 'mosaic cathedral')).toBe(false);
  });

  test('an empty or blank query keeps everything', () => {
    expect(stopMatches(stop({ title: 'Anything' }), '')).toBe(true);
    expect(stopMatches(stop({ title: 'Anything' }), '   ')).toBe(true);
  });

  test('looks at titles, texts, transcripts, headlines, quotes and captions, not at URLs', () => {
    expect(stopMatches({ id: 'a', type: 'audio', title: 'T', duration: '', isCompleted: false, image: 'https://img.example/zebra.jpg', transcription: 'echoes' }, 'echoes')).toBe(true);
    expect(stopMatches({ id: 'a', type: 'audio', title: 'T', duration: '', isCompleted: false, image: 'https://img.example/zebra.jpg' }, 'zebra')).toBe(false);
    expect(stopMatches({ id: 'h', type: 'headline', text: 'Old town' }, 'old')).toBe(true);
    expect(stopMatches({ id: 'q', type: 'quote', quote: 'Be brave', author: 'Gaudí' }, 'gaudi')).toBe(true);
    expect(stopMatches({ id: 'v', type: 'video', videoUrl: 'https://v.example/a.mp4', caption: 'Roof walk' }, 'roof')).toBe(true);
    expect(stopMatches({ id: 'g', type: 'image-gallery', images: [{ url: 'u', alt: 'Salt cellar' }] }, 'cellar')).toBe(true);
  });
});

test.describe('when the field shows', () => {
  test('more than the threshold: 8 by default, so 9 stops yes and 8 no', () => {
    expect(DEFAULT_STOP_SEARCH_THRESHOLD).toBe(8);
    expect(showsStopSearch(8, undefined)).toBe(false);
    expect(showsStopSearch(9, undefined)).toBe(true);
    expect(showsStopSearch(3, 2)).toBe(true);
    expect(showsStopSearch(3, 3)).toBe(false);
    expect(showsStopSearch(1, 0)).toBe(true);
  });

  test('a missing or unusable setting means the default', () => {
    for (const bad of [undefined, null, 'ten', NaN, -1, Infinity]) expect(stopSearchThreshold(bad), String(bad)).toBe(8);
    expect(stopSearchThreshold(2.9)).toBe(2);
  });

  test('9 stops show it, 8 do not', async ({ page }) => {
    await startDraft(page, tourOf(9));
    await expect(field(page)).toBeVisible();
  });

  test('8 stops do not', async ({ page }) => {
    await startDraft(page, tourOf(8));
    await expect(page.locator('[id="stop-s8"]')).toBeVisible();
    await expect(field(page)).toHaveCount(0);
  });

  test('the tour setting moves the threshold, and a large one turns it off', async ({ page }) => {
    const small = tourOf(4);
    small.metadata.stopSearchThreshold = 3;
    await startDraft(page, small);
    await expect(field(page)).toBeVisible();

    const off = tourOf(9);
    off.metadata.stopSearchThreshold = 1000;
    await startDraft(page, off);
    await expect(page.locator('[id="stop-s9"]')).toBeVisible();
    await expect(field(page)).toHaveCount(0);
  });
});

test.describe('using it', () => {
  test('filters by title and by text, and the numbers on the cards stay where they were', async ({ page }) => {
    await startDraft(page, tourOf(9));
    expect(await stopIds(page)).toHaveLength(9);

    await field(page).fill('bridge');
    expect(await stopIds(page)).toEqual(['s2']);
    await expect(page.locator('#stop-s2')).toContainText('2'); // still stop 2

    await field(page).fill('guell'); // only in s3's body text, with an accent and markup
    expect(await stopIds(page)).toEqual(['s3']);
    await expect(page.locator('#stop-s3')).toContainText('3');

    await field(page).fill('bell noon'); // only in s4's transcript
    expect(await stopIds(page)).toEqual(['s4']);

    await field(page).fill('ta'); // Beta, Delta, Zeta, Eta, Theta and Iota: a part of a word is enough
    expect(await stopIds(page)).toEqual(['s2', 's4', 's6', 's7', 's8', 's9']);
  });

  test('says so when nothing matches, and the clear button brings everything back and keeps focus', async ({ page }) => {
    await startDraft(page, tourOf(9));
    await field(page).fill('zzz');
    await expect(page.getByTestId('stop-search-empty')).toHaveText('No stops match your search.');
    expect(await stopIds(page)).toEqual([]);

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(field(page)).toHaveValue('');
    await expect(field(page)).toBeFocused();
    expect(await stopIds(page)).toHaveLength(9);
    await expect(page.getByRole('button', { name: 'Clear search' })).toHaveCount(0);
  });

  test('works from the keyboard: type, Escape clears and the field keeps focus', async ({ page }) => {
    await startDraft(page, tourOf(9));
    await field(page).focus();
    await page.keyboard.type('garden');
    expect(await stopIds(page)).toEqual(['s3']);
    await page.keyboard.press('Escape');
    await expect(field(page)).toHaveValue('');
    await expect(field(page)).toBeFocused();
    expect(await stopIds(page)).toHaveLength(9);
  });

  test('a screen reader finds a search landmark, a named field and hears the result count', async ({ page }) => {
    await startDraft(page, tourOf(9));
    await expect(page.getByRole('search')).toBeVisible();
    await expect(field(page)).toHaveAttribute('type', 'search');
    const status = page.getByRole('search').getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveText('');

    await field(page).fill('gate');
    await expect(status).toHaveText('1 stop found');
    await field(page).fill('e');
    await expect(status).toHaveText(/^\d+ stops found$/);
    await field(page).fill('zzz');
    await expect(status).toHaveText('No stops match your search.');
  });

  test('the result count text takes its number from the language file', () => {
    expect(fillText('{count} stops found', { count: 12 })).toBe('12 stops found');
    expect(fillText('Nalezeno zastávek: {count}', { count: 3 })).toBe('Nalezeno zastávek: 3');
    expect(fillText('no placeholder', { count: 1 })).toBe('no placeholder');
  });
});
