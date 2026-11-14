import { test, expect } from '@playwright/test';
import type { Stop } from '@audioguidekit/schema';
import { directionsLinks, isUsableLocation } from '../src/directions/links';
import { audioStop, draftOf, startDraft, type Draft } from './visitor-helpers';

/** Open in maps: the deep links, who gets the button, the setting, and the keyboard. */

test.use({ serviceWorkers: 'block', viewport: { width: 430, height: 900 } });

const PARK = { lat: 41.4145, lng: 2.1527 };

function tourWithPlaces(): Draft {
  const draft = draftOf();
  draft.tour.stops = [
    audioStop('a1', 'Park Güell', { location: PARK }),
    audioStop('a2', 'Nowhere in particular'),
    { id: 't1', type: 'text', title: 'A viewpoint', content: 'Look east.', location: { lat: 41.4, lng: 2.17 } },
    audioStop('a3', 'Broken coordinates', { location: { lat: 999, lng: 2 } }),
  ] as Stop[];
  draft.tour.totalStops = 3;
  return draft;
}

test.describe('the links', () => {
  test('Google Maps, Apple Maps and Waze, each with the stop as the destination', () => {
    const links = Object.fromEntries(directionsLinks(PARK).map((l) => [l.app, l.url]));
    expect(Object.keys(links)).toEqual(['google', 'apple', 'waze']);
    expect(links.google).toBe('https://www.google.com/maps/dir/?api=1&destination=41.4145,2.1527');
    expect(links.apple).toBe('https://maps.apple.com/?daddr=41.4145,2.1527');
    expect(links.waze).toBe('https://waze.com/ul?ll=41.4145,2.1527&navigate=yes');
    for (const url of Object.values(links)) expect(new URL(url).protocol).toBe('https:');
  });

  test('negative and tiny coordinates stay plain decimals, and long ones are cut to 6 places', () => {
    const [google] = directionsLinks({ lat: -33.8568, lng: 151.2153001234 });
    expect(google.url).toContain('destination=-33.8568,151.2153');
    const [tiny] = directionsLinks({ lat: 0.0000001, lng: -0.0000001 });
    expect(tiny.url).toContain('destination=0,0');
    expect(tiny.url).not.toContain('e-');
  });

  test('only coordinates inside the valid range count as a location', () => {
    expect(isUsableLocation(PARK)).toBe(true);
    expect(isUsableLocation({ lat: -90, lng: 180 })).toBe(true);
    for (const bad of [undefined, null, {}, { lat: 91, lng: 0 }, { lat: 0, lng: -181 }, { lat: '41', lng: 2 }, { lat: NaN, lng: 0 }, { lat: Infinity, lng: 0 }]) {
      expect(isUsableLocation(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});

test.describe('in the player', () => {
  test('a stop with a location gets a Directions button, other stops do not', async ({ page }) => {
    await startDraft(page, tourWithPlaces());
    await expect(page.locator('#stop-a1')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Directions to Park Güell' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Directions to A viewpoint' })).toBeVisible(); // not only audio stops
    await expect(page.getByTestId('directions')).toHaveCount(2); // not the stop without a location, nor the one with broken coordinates
  });

  test('it works without the map view', async ({ page }) => {
    const draft = tourWithPlaces();
    expect(draft.metadata.mapView).toBeFalsy();
    await startDraft(page, draft);
    await expect(page.getByTestId('directions').first()).toBeVisible();
  });

  test('the button opens one link per maps app, with the right destination', async ({ page }) => {
    await startDraft(page, tourWithPlaces());
    const button = page.getByRole('button', { name: 'Directions to Park Güell' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    const list = page.getByRole('list', { name: 'Open directions in' });
    const links = list.getByRole('link');
    await expect(links).toHaveText(['Google Maps', 'Apple Maps', 'Waze']);
    await expect(links.nth(0)).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=41.4145,2.1527');
    await expect(links.nth(1)).toHaveAttribute('href', 'https://maps.apple.com/?daddr=41.4145,2.1527');
    await expect(links.nth(2)).toHaveAttribute('href', 'https://waze.com/ul?ll=41.4145,2.1527&navigate=yes');
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('choosing an app opens it in a new tab and closes the list', async ({ page, context }) => {
    await context.route(/^https:\/\/(www\.google\.com|maps\.apple\.com|waze\.com)\//, (route) => route.fulfill({ contentType: 'text/html', body: 'ok' }));
    await startDraft(page, tourWithPlaces());
    await page.getByRole('button', { name: 'Directions to Park Güell' }).click();
    const popup = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Waze' }).click();
    expect((await popup).url()).toBe('https://waze.com/ul?ll=41.4145,2.1527&navigate=yes');
    await expect(page.getByRole('list', { name: 'Open directions in' })).toHaveCount(0);
  });

  test('keyboard: Enter opens the list, Escape closes it and gives focus back to the button', async ({ page }) => {
    await startDraft(page, tourWithPlaces());
    const button = page.getByRole('button', { name: 'Directions to Park Güell' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: 'Google Maps' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Google Maps' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Google Maps' })).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test.describe('the tour setting', () => {
  test('showDirections: false removes every Directions button', async ({ page }) => {
    const draft = tourWithPlaces();
    draft.metadata.showDirections = false;
    await startDraft(page, draft);
    await expect(page.locator('#stop-a1')).toBeVisible();
    await expect(page.getByTestId('directions')).toHaveCount(0);
  });
});
