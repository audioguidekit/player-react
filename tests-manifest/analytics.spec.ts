import { test, expect, type Page, type Route } from '@playwright/test';
import { dismissSplashIfPresent, startButton } from '../tests/helpers';

/**
 * Analytics in manifest mode: on by default, events go to POST /e on the
 * player's own origin. /e is intercepted here, so nothing needs a Worker.
 *
 * The service worker is blocked so page.route sees every request.
 * See docs/analytics.md.
 */
test.use({ serviceWorkers: 'block' });

interface Sent {
  type: string;
  sid: string;
  tourId?: string;
  stopId?: string;
  lang?: string;
  value?: number;
  [key: string]: unknown;
}

const isEvents = (url: URL) => url.pathname === '/e';

/** Records every event POSTed to /e, in order, and answers 204 like the Worker. */
async function captureEvents(page: Page, respond: (route: Route) => Promise<void> = (r) => r.fulfill({ status: 204 })) {
  const bodies: string[] = [];
  const events: Sent[] = [];
  const requests: { contentType: string | undefined; bytes: number; count: number; origin: string; types: string[] }[] = [];
  await page.route(isEvents, async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = request.postData() ?? '';
      // A beacon sent while the page unloads can reach the route with an unreadable body: just answer it.
      const batch: Sent[] = body ? JSON.parse(body).events : [];
      if (body) bodies.push(body);
      events.push(...batch);
      requests.push({
        contentType: request.headers()['content-type'],
        bytes: Buffer.byteLength(body),
        count: batch.length,
        origin: new URL(request.url()).origin,
        types: batch.map((e) => e.type),
      });
    }
    await respond(route);
  });
  return { bodies, events, requests, types: () => events.map((e) => e.type) };
}

/** What a closing tab does: the emitter hands its queue to sendBeacon on pagehide. */
const hidePage = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
  await dismissSplashIfPresent(page);
  await startButton(page).waitFor({ timeout: 15000 });
}

const EVENING = '/tour/barcelona-evening'; // same-origin 20 s silent audio on every stop

test.describe('Analytics events', () => {
  test('opening a tour, playing a stop, finishing its audio and switching language send the right events in order', async ({ page }) => {
    const sent = await captureEvents(page);
    await open(page, EVENING);
    await startButton(page).click();

    // Playing: wait until the audio really runs, then jump to its last second.
    await expect
      .poll(() => page.evaluate(() => { const a = document.querySelector('audio'); return !!a && !a.paused && a.currentTime > 0; }), { timeout: 15000 })
      .toBe(true);
    await page.evaluate(() => { const a = document.querySelector('audio')!; a.currentTime = Math.max(a.duration - 1.5, 0); });
    await expect.poll(() => { void hidePage(page); return sent.types().includes('audio_complete'); }, { timeout: 15000 }).toBe(true);

    // Switching language happens on the start screen: go back to it first.
    await page.getByRole('button', { name: 'Home' }).dispatchEvent('click'); // the sheet covers the header
    await page.getByRole('button', { name: 'Change language' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /deutsch|german/i }).first().click();
    await expect.poll(() => { void hidePage(page); return sent.types().includes('language_change'); }, { timeout: 15000 }).toBe(true);

    const types = sent.types();
    expect(types.slice(0, 5)).toEqual(['app_open', 'tour_open', 'stop_view', 'tour_start', 'audio_play']);
    expect(types.indexOf('audio_complete')).toBeGreaterThan(types.indexOf('audio_play'));
    expect(types.indexOf('language_change')).toBeGreaterThan(types.indexOf('audio_complete'));

    const complete = sent.events.find((e) => e.type === 'audio_complete')!;
    expect(complete.tourId).toBe('barcelona-evening');
    expect(complete.value).toBeGreaterThan(0); // seconds listened
    expect(complete.value).toBeLessThan(20); // we skipped most of the file
    expect(sent.events.find((e) => e.type === 'language_change')).toMatchObject({ lang: 'de', tourId: 'barcelona-evening' });

    // One random session id for the whole visit, and nothing else identifying.
    expect(new Set(sent.events.map((e) => e.sid)).size).toBe(1);
    expect(sent.events[0].sid).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    for (const event of sent.events) {
      expect(Object.keys(event).every((k) => ['type', 'sid', 'tourId', 'stopId', 'lang', 'value'].includes(k))).toBe(true);
    }
    // Same origin, as plain text (what sendBeacon sends), within the Worker's limits.
    for (const request of sent.requests) {
      expect(request.origin).toBe(new URL(page.url()).origin);
      expect(request.bytes).toBeLessThanOrEqual(4096);
      expect(request.count).toBeLessThanOrEqual(50);
    }
  });

  test('a repeated tour_open, stop_view or audio_play is not sent for the same tour and stop', async ({ page }) => {
    const sent = await captureEvents(page);
    await open(page, EVENING);
    await startButton(page).click();
    await expect.poll(() => page.evaluate(() => !!document.querySelector('audio') && !document.querySelector('audio')!.paused), { timeout: 15000 }).toBe(true);
    // Pause and resume through the player: a second play of the same stop.
    await page.locator('[data-testid="mini-player"]').getByRole('button', { name: /pause/i }).first().click();
    await page.locator('[data-testid="mini-player"]').getByRole('button', { name: /play/i }).first().click();
    await hidePage(page);
    await expect.poll(() => sent.types().includes('audio_play')).toBe(true);
    for (const type of ['tour_open', 'tour_start', 'audio_play']) {
      expect(sent.types().filter((t) => t === type), type).toHaveLength(1);
    }
  });

  test('the queue is flushed on pagehide, through sendBeacon', async ({ page }) => {
    const sent = await captureEvents(page);
    await page.addInitScript(() => {
      const original = navigator.sendBeacon.bind(navigator);
      (window as unknown as { __beacons: number }).__beacons = 0;
      navigator.sendBeacon = (url, data) => {
        (window as unknown as { __beacons: number }).__beacons++;
        return original(url, data);
      };
    });
    await open(page, EVENING);
    expect(sent.types()).toEqual([]); // batched, not sent one by one

    await hidePage(page);
    await expect.poll(() => sent.types()).toEqual(['app_open', 'tour_open']);
    expect(await page.evaluate(() => (window as unknown as { __beacons: number }).__beacons)).toBe(1);
  });

  test('the queue is flushed when the page is really closed or navigated away', async ({ page }) => {
    const sent = await captureEvents(page);
    // Playwright cannot always read a beacon's Blob body once its page is gone (the body then
    // comes back empty), so this test asserts the request is issued; the contents of the flushed
    // batch are asserted in the pagehide test above, where the page stays alive.
    const issued: { contentType: string | undefined }[] = [];
    page.on('request', (r) => {
      if (isEvents(new URL(r.url())) && r.method() === 'POST') issued.push({ contentType: r.headers()['content-type'] });
    });
    await open(page, EVENING);
    await page.goto('about:blank');
    await expect.poll(() => issued.length, { timeout: 5000 }).toBe(1);
    expect(issued[0].contentType).toMatch(/^text\/plain/);
  });

  test('the queue is flushed on a timer without any page event', async ({ page }) => {
    const sent = await captureEvents(page);
    await page.clock.install();
    await open(page, EVENING);
    expect(sent.types()).toEqual([]);
    await page.clock.fastForward(30_000); // half a minute: still waiting (it used to be sent after 10 s)
    await page.waitForTimeout(300);
    expect(sent.types()).toEqual([]);
    await page.clock.fastForward(31_000);
    await expect.poll(() => sent.types(), { timeout: 15000 }).toEqual(['app_open', 'tour_open']);
  });
});

test.describe('Analytics offline queue', () => {
  test('events made while offline are delivered once the browser is back online', async ({ page, context }) => {
    const sent = await captureEvents(page);
    await open(page, EVENING);

    await context.setOffline(true);
    await page.getByRole('button', { name: 'Change language' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /deutsch|german/i }).first().click();
    await hidePage(page); // would normally be a beacon; offline it goes to IndexedDB instead
    await page.waitForTimeout(500);
    expect(sent.types()).toEqual([]);
    const stored = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const open = indexedDB.open('agk-analytics');
          open.onsuccess = () => {
            const count = open.result.transaction('events').objectStore('events').count();
            count.onsuccess = () => resolve(count.result);
          };
          open.onerror = () => resolve(-1);
        }),
    );
    expect(stored).toBeGreaterThan(0);

    await context.setOffline(false);
    await expect.poll(() => sent.types(), { timeout: 10000 }).toEqual(expect.arrayContaining(['app_open', 'tour_open', 'language_change']));
    // Delivered once, and the queue is emptied.
    expect(sent.types().filter((t) => t === 'language_change')).toHaveLength(1);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise<number>((resolve) => {
              const open = indexedDB.open('agk-analytics');
              open.onsuccess = () => {
                const count = open.result.transaction('events').objectStore('events').count();
                count.onsuccess = () => resolve(count.result);
              };
            }),
        ),
      )
      .toBe(0);
  });

  test('events the server could not take (5xx) are kept and delivered when it recovers', async ({ page }) => {
    let failing = true;
    const sent = await captureEvents(page, (route) => route.fulfill({ status: failing ? 503 : 204 }));
    await page.clock.install();
    await open(page, EVENING);

    await page.clock.fastForward(61_000); // the 60 s flush timer fires: the server answers 503
    await expect.poll(() => sent.bodies.length).toBe(1);
    expect(sent.types()).toEqual(['app_open', 'tour_open']);

    failing = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online'))); // the stored events are drained
    await expect.poll(() => sent.bodies.length).toBe(2);
    expect(JSON.parse(sent.bodies[1]).events.map((e: Sent) => e.type)).toEqual(['app_open', 'tour_open']);
  });

  test('a 4xx (the server will never accept it) is not retried', async ({ page }) => {
    const sent = await captureEvents(page, (route) => route.fulfill({ status: 400 }));
    await page.clock.install();
    await open(page, EVENING);
    await page.clock.fastForward(61_000);
    await expect.poll(() => sent.bodies.length).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(1000);
    expect(sent.bodies).toHaveLength(1);
  });
});

test.describe('Analytics off switches', () => {
  /** Opens the tour, plays and leaves: everything that would normally send. */
  async function useThePlayer(page: Page) {
    await open(page, EVENING);
    await startButton(page).click();
    await expect.poll(() => page.evaluate(() => !!document.querySelector('audio') && !document.querySelector('audio')!.paused), { timeout: 15000 }).toBe(true);
    await hidePage(page);
    await page.waitForTimeout(1500);
  }

  test('Global Privacy Control sends nothing', async ({ page }) => {
    const sent = await captureEvents(page);
    await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
    await useThePlayer(page);
    expect(sent.bodies).toEqual([]);
    expect(await page.evaluate(async () => (await indexedDB.databases()).some((d) => d.name === 'agk-analytics'))).toBe(false);
    expect(await page.evaluate(() => sessionStorage.getItem('agk_sid'))).toBeNull(); // not even a session id
  });

  test('Do Not Track sends nothing', async ({ page }) => {
    const sent = await captureEvents(page);
    await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { value: '1' }));
    await useThePlayer(page);
    expect(sent.bodies).toEqual([]);
  });

  test('app.analytics false in the manifest sends nothing', async ({ page }) => {
    const sent = await captureEvents(page);
    await page.route('**/data/manifest.json', async (route) => {
      const manifest = await (await route.fetch()).json();
      manifest.app = { ...manifest.app, analytics: false };
      await route.fulfill({ json: manifest });
    });
    await useThePlayer(page);
    expect(sent.bodies).toEqual([]);
  });

  test('with analytics on, the same visit does send (control for the three tests above)', async ({ page }) => {
    const sent = await captureEvents(page);
    await useThePlayer(page);
    expect(sent.types()).toContain('audio_play');
  });
});

test.describe('Analytics: email capture', () => {
  /** The evening tour with a consent line on its email stop. */
  async function openEmailStop(page: Page, consentText?: string) {
    await page.route('**/data/manifest.json', async (route) => {
      const manifest = await (await route.fetch()).json();
      if (consentText) {
        const tour = manifest.tours.find((t: { id: string }) => t.id === 'barcelona-evening');
        for (const language of Object.values<{ stops: { type: string; consentText?: string }[] }>(tour.languages)) {
          for (const stop of language.stops) if (stop.type === 'email') stop.consentText = consentText;
        }
      }
      await route.fulfill({ json: manifest });
    });
  }

  async function reachEmail(page: Page) {
    await open(page, EVENING);
    await startButton(page).click();
    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) await listToggle.click();
    const input = page.locator('#stop-14 input[type="email"]');
    await input.scrollIntoViewIfNeeded();
    return input;
  }

  test('submits the address to /e and shows the thank-you card', async ({ page }) => {
    const sent = await captureEvents(page);
    await openEmailStop(page);
    const input = await reachEmail(page);
    await input.fill('visitor@example.org');
    await page.locator('#stop-14').getByRole('button', { name: /subscribe/i }).click();
    await expect(page.getByText("You're subscribed!")).toBeVisible();
    const email = sent.events.find((e) => e.type === 'email_submit');
    expect(email).toMatchObject({ email: 'visitor@example.org', consent: true, tourId: 'barcelona-evening', stopId: '14' });
    // Contract: a lead is the only event of its request, never batched with the passive events.
    const request = sent.requests.find((r) => r.types.includes('email_submit'))!;
    expect(request.types).toEqual(['email_submit']);
  });

  test('a failed submit shows an error and lets the visitor try again', async ({ page }) => {
    let status = 500;
    await captureEvents(page, (route) => route.fulfill({ status }));
    await openEmailStop(page);
    const input = await reachEmail(page);
    await input.fill('visitor@example.org');
    const button = page.locator('#stop-14').getByRole('button', { name: /subscribe/i });
    await button.click();
    await expect(page.locator('#stop-14').getByRole('alert')).toContainText(/couldn't send/i);
    await expect(page.getByText("You're subscribed!")).toHaveCount(0);

    status = 204;
    await button.click();
    await expect(page.getByText("You're subscribed!")).toBeVisible();
  });

  test('a consent line adds a checkbox that must be ticked before submitting', async ({ page }) => {
    const sent = await captureEvents(page);
    await openEmailStop(page, 'Send me news about new guides');
    const input = await reachEmail(page);
    await input.fill('visitor@example.org');
    const button = page.locator('#stop-14').getByRole('button', { name: /subscribe/i });
    await expect(button).toBeDisabled();
    await page.locator('#stop-14').getByLabel('Send me news about new guides').check();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByText("You're subscribed!")).toBeVisible();
    expect(sent.events.find((e) => e.type === 'email_submit')).toMatchObject({ consent: true });
  });
});

test.describe('Analytics: rating sheet', () => {
  /** Rates the tour from the rating stop and walks to the email step. */
  async function reachSheetEmailStep(page: Page, rating: number, comment: string) {
    await open(page, EVENING);
    await startButton(page).click();
    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) await listToggle.click();
    const card = page.locator('[data-stop-type="rating"]');
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button').nth(rating - 1).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByRole('textbox').fill(comment);
    await sheet.getByRole('button', { name: /next/i }).click();
    const input = sheet.locator('input[type="email"]');
    await input.fill('visitor@example.org');
    return sheet;
  }

  test('subscribing needs an explicit, unticked consent; the lead goes out alone with the trimmed comment event separate', async ({ page }) => {
    const sent = await captureEvents(page);
    const sheet = await reachSheetEmailStep(page, 4, `  ${'great '.repeat(500)}  `);
    const subscribe = sheet.getByRole('button', { name: /subscribe/i });
    const consent = sheet.getByRole('checkbox');
    await expect(consent).not.toBeChecked();
    await expect(subscribe).toBeDisabled();
    await consent.check();
    await expect(subscribe).toBeEnabled();
    await subscribe.click();
    await expect(sheet.getByText(/thank you/i)).toBeVisible();

    await hidePage(page);
    await expect.poll(() => sent.types()).toContain('feedback_submit');
    const lead = sent.requests.find((r) => r.types.includes('email_submit'))!;
    expect(lead.types).toEqual(['email_submit']);
    expect(sent.events.find((e) => e.type === 'email_submit')).toMatchObject({ email: 'visitor@example.org', consent: true });
    const feedback = sent.events.find((e) => e.type === 'feedback_submit')!;
    expect(feedback).toMatchObject({ value: 4 });
    expect((feedback.comment as string).length).toBeLessThanOrEqual(2000);
  });

  test('skipping discards the typed address: no email_submit, nothing stored', async ({ page }) => {
    const sent = await captureEvents(page);
    const sheet = await reachSheetEmailStep(page, 5, 'lovely');
    await sheet.getByRole('button', { name: /skip/i }).click();
    await expect(sheet.getByText(/thank you/i)).toBeVisible();
    await hidePage(page);
    await expect.poll(() => sent.types()).toContain('feedback_submit');
    expect(sent.types()).not.toContain('email_submit');
    const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
    expect(stored).not.toContain('visitor@example.org');
  });
});
