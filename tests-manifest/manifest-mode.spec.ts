import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dismissSplashIfPresent, startButton } from '../tests/helpers';

/**
 * The player in manifest mode: no tour data compiled in, everything read from
 * /data/manifest.json at startup. The manifest is built from the barcelona
 * fixture plus a second tour (tests-manifest/augment-manifest.ts).
 *
 * See docs/manifest-mode.md.
 */

const manifest = JSON.parse(readFileSync('dist-manifest/data/manifest.json', 'utf8'));
const barcelona = manifest.tours[0];
const titleEn: string = barcelona.languages.en.title;
const titleDe: string = barcelona.languages.de.title;

// Each tour card is a <button> containing the tour title as an <h2>.
const TOUR_CARD = 'button:has(h2)';

/** A 1x1 transparent PNG, for stubbing images that live on external hosts. */
const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** Loads the page and waits past the boot screen and the branding splash. */
async function open(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
  await dismissSplashIfPresent(page);
}

test.describe('Manifest mode: content', () => {
  test('the picker lists the manifest tours under the app title', async ({ page }) => {
    await open(page);

    await expect(page.getByRole('heading', { level: 1, name: manifest.app.title.en })).toBeVisible();
    await expect(page.locator(TOUR_CARD)).toHaveCount(manifest.tours.length);
    await expect(page.locator(TOUR_CARD).filter({ hasText: titleEn })).toHaveCount(2); // original + "(evening)"
  });

  test('opening a tour shows its start screen, and starting it lists every stop', async ({ page }) => {
    await open(page);
    await page.locator(TOUR_CARD).filter({ hasText: `${titleEn} (evening)` }).click();
    await expect(page).toHaveURL(/\/tour\/barcelona-evening/);
    await expect(page.getByRole('heading', { level: 1, name: `${titleEn} (evening)` })).toBeVisible();

    await startButton(page).click();
    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) await listToggle.click();

    await expect(page.getByTestId('stop-feed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[id^="stop-"]')).toHaveCount(barcelona.languages.en.stops.length);
  });

  test('a stop renders with its title from the manifest', async ({ page }) => {
    const stop = barcelona.languages.en.stops.find((s: { type: string }) => s.type === 'audio');
    await open(page, `/tour/barcelona`);
    await startButton(page).click();

    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) await listToggle.click();

    await expect(page.locator(`#stop-${stop.id}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`#stop-${stop.id}`)).toContainText(stop.title);
  });

  test('switching language swaps the tour content and the interface text', async ({ page }) => {
    await open(page, '/tour/barcelona');
    await expect(page.getByRole('heading', { level: 1, name: titleEn })).toBeVisible();

    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('dialog').getByText('Deutsch').click();

    await expect(page.getByRole('heading', { level: 1, name: titleDe })).toBeVisible();
  });

  test('UI text overrides from the manifest reach the interface', async ({ page }) => {
    // The picker falls back to t.tourSelection.title where app.title has no entry
    // for the language: Czech has none, but the manifest overrides the UI text.
    await page.addInitScript(() => localStorage.setItem('app-preferences', JSON.stringify({ selectedLanguage: 'cs' })));
    await open(page);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText('Vyberte si průvodce')).toBeVisible();
  });

  test('the app identity is applied at runtime', async ({ page }) => {
    await open(page);
    await expect(page).toHaveTitle('Test museum');
  });
});

test.describe('Manifest mode: the build', () => {
  test('bundles no tour data and never requests tour files', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(new URL(request.url()).pathname));

    const response = page.waitForResponse((r) => new URL(r.url()).pathname === '/data/manifest.json');
    await open(page);
    expect((await response).status()).toBe(200);

    expect(requested.filter((p) => p.startsWith('/data/tour'))).toEqual([]);

    // Every script of the build: none may contain the tour's text.
    const scripts = [...new Set(requested.filter((p) => p.endsWith('.js')))];
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      const body = await (await page.request.get(script)).text();
      expect(body, script).not.toContain(titleEn);
    }
  });

  test('the player itself calls no third-party host (only hosts its own content names)', async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', (request) => {
      const { protocol, host } = new URL(request.url());
      if (protocol.startsWith('http')) hosts.add(host);
    });
    await open(page);
    await page.locator(TOUR_CARD).first().click();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Media in the tour content (cover images, audio) legitimately lives elsewhere; the
    // app itself (fonts, scripts, styles) must not.
    const contentHosts = new Set([...JSON.stringify(manifest).matchAll(/https?:\/\/([^/"\\]+)/g)].map((m) => m[1]));
    const own = new URL(page.url()).host;
    const strangers = [...hosts].filter((h) => h !== own && !contentHosts.has(h));
    expect(strangers).toEqual([]);
  });

  test('links the web app manifest and icons at host-served paths', async ({ page }) => {
    await open(page);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  });
});

test.describe('Manifest mode: startup failures', () => {
  test('shows an error screen when the manifest cannot be fetched, and recovers on retry', async ({ page }) => {
    await page.route('**/data/manifest.json', (route) => route.fulfill({ status: 500, body: 'nope' }));
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('boot-error')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /can't be opened/ })).toBeVisible();

    await page.unroute('**/data/manifest.json');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByTestId('boot-error')).toHaveCount(0);
    await dismissSplashIfPresent(page);
    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });
  });

  test('refuses a manifest from another schema version', async ({ page }) => {
    await page.route('**/data/manifest.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...manifest, schemaVersion: 999 }) }),
    );
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /needs a newer version/ })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('boot-error')).toContainText('999');
  });
});

test.describe('Manifest mode: offline', () => {
  test('opens again with no network after one visit', async ({ page, context }) => {
    await open(page);
    // The worker must be controlling the page for the second visit to be served by it.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissSplashIfPresent(page);

    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });
    await context.setOffline(false);
  });
});

test.describe('Manifest mode: a bad answer never replaces the last good manifest', () => {
  async function visitTwiceWithTheWorker(page: Page) {
    await open(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await dismissSplashIfPresent(page);
    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });
  }
  const cachedSchemaVersion = (page: Page) =>
    page.evaluate(async () => {
      const hit = await (await caches.open('agk-manifest')).match('/data/manifest.json');
      return hit ? (await hit.json().catch(() => null))?.schemaVersion ?? null : undefined;
    });

  test('a captive portal page answering 200 keeps the app opening from the saved copy', async ({ page, context }) => {
    await visitTwiceWithTheWorker(page);

    // context.route, not page.route: the worker's own fetch is what has to see the portal.
    await context.route('**/data/manifest.json', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Sign in to the Wi-Fi</html>' }),
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissSplashIfPresent(page);

    await expect(page.getByTestId('boot-error')).toHaveCount(0);
    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });
    expect(await cachedSchemaVersion(page)).toBe(manifest.schemaVersion);
  });

  test('a manifest of another schemaVersion is refused and does not overwrite the saved copy', async ({ page, context }) => {
    await visitTwiceWithTheWorker(page);

    await context.route('**/data/manifest.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...manifest, schemaVersion: 999 }) }),
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /needs a newer version/ })).toBeVisible({ timeout: 15000 });
    expect(await cachedSchemaVersion(page)).toBe(manifest.schemaVersion);
  });
});

test.describe('Manifest mode: host-served identity files are not pinned', () => {
  test('a changed icon shows on the next request instead of after 30 days', async ({ page, context }) => {
    await open(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    const read = (path: string) => page.evaluate(async (p) => (await (await fetch(p)).text()).slice(0, 40), path);
    // First request: the neutral default from the build, now seen by the worker.
    expect(await read('/favicon.svg')).toContain('<svg');
    expect(await read('/icons/icon-192x192.png').catch(() => '')).not.toBe('tenant icon v2');

    // The tenant changes its logo: the host now answers with something else.
    await context.route(/\/(favicon\.svg|icons\/icon-192x192\.png)$/, (route) =>
      route.fulfill({ contentType: 'text/plain', body: 'tenant icon v2' }),
    );
    expect(await read('/favicon.svg')).toBe('tenant icon v2');
    expect(await read('/icons/icon-192x192.png')).toBe('tenant icon v2');
  });
});

test.describe('Manifest mode: downloaded tours offline (same-origin media)', () => {
  // barcelona-evening serves its audio at /media/test-org/{sha256}.wav on the player's own
  // origin (tests-manifest/augment-manifest.ts), like the production Worker does.
  const evening = manifest.tours.find((t: { id: string }) => t.id === 'barcelona-evening');
  const mediaPath: string = evening.languages.en.stops.find((s: { type: string }) => s.type === 'audio').audioFile;

  test('a downloaded tour plays its audio with no network, including range requests', async ({ page, context }) => {
    // The cover image and end audio are external hosts: stub them so the download needs no internet.
    await page.route(/^https:\/\/(?!127\.0\.0\.1)/, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(PIXEL, 'base64') }),
    );
    await open(page, '/tour/barcelona-evening');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await dismissSplashIfPresent(page);

    await page.getByRole('button', { name: /download/i }).first().click();
    // The download manager stores each asset in the "tour-assets" cache.
    await expect
      .poll(() => page.evaluate(async (path) => !!(await (await caches.open('tour-assets')).match(path)), mediaPath), {
        timeout: 20000,
      })
      .toBe(true);
    // Nothing has played yet: only the download manager has put this file anywhere.

    await context.setOffline(true);
    const result = await page.evaluate(async (path) => {
      const full = await fetch(path);
      const range = await fetch(path, { headers: { Range: 'bytes=0-99' } });
      const audio = new Audio(path);
      const played = await new Promise<boolean>((resolve) => {
        audio.addEventListener('canplay', () => resolve(true), { once: true });
        audio.addEventListener('error', () => resolve(false), { once: true });
        audio.load();
      });
      return {
        fullStatus: full.status,
        fullBytes: (await full.arrayBuffer()).byteLength,
        rangeStatus: range.status,
        rangeBytes: (await range.arrayBuffer()).byteLength,
        played,
      };
    }, mediaPath);
    await context.setOffline(false);

    expect(result.fullStatus).toBe(200);
    expect(result.fullBytes).toBeGreaterThan(1000);
    expect(result.rangeStatus).toBe(206);
    expect(result.rangeBytes).toBe(100);
    expect(result.played).toBe(true);
  });

  test('same-origin media is not served by the app-shell cache', async ({ page }) => {
    await open(page, '/tour/barcelona-evening');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await page.evaluate((path) => fetch(path).then((r) => r.arrayBuffer()), mediaPath);
    const inShell = await page.evaluate(async (path) => !!(await (await caches.open('app-shell')).match(path)), mediaPath);
    expect(inShell).toBe(false);
  });
});

test.describe('Manifest mode: live preview', () => {
  // The player is built with VITE_PREVIEW_ORIGINS=<its own origin>, so a host
  // page served from that origin may send it manifests.
  const HOST = `<!doctype html><iframe id="player" src="/" style="width:420px;height:800px"></iframe>`;

  test('a manifest posted by an allowed parent re-renders without a reload', async ({ page }) => {
    await page.route('**/__host', (route) => route.fulfill({ contentType: 'text/html', body: HOST }));
    await page.goto('/__host');
    const frame = page.frameLocator('#player');
    await expect(frame.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });

    // A marker that a reload would wipe.
    const player = page.frames().find((f) => f.url() === `${new URL(page.url()).origin}/`)!;
    await player.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));

    const changed = structuredClone(manifest);
    changed.app.title.en = 'Changed by the host';
    changed.tours[1].languages.en.title = 'Renamed by the host';

    const reply = page.evaluate(
      (m) =>
        new Promise<{ type: string }>((resolve) => {
          window.addEventListener('message', (e) => e.data?.type?.startsWith('agk:manifest') && resolve(e.data));
          (document.getElementById('player') as HTMLIFrameElement).contentWindow!.postMessage(
            { type: 'agk:manifest', manifest: m },
            location.origin,
          );
        }),
      changed,
    );
    expect((await reply).type).toBe('agk:manifest-applied');

    await expect(frame.getByRole('heading', { level: 1, name: 'Changed by the host' })).toBeVisible();
    await expect(frame.locator(TOUR_CARD).filter({ hasText: 'Renamed by the host' })).toHaveCount(1);
    expect(await player.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
  });

  // The host answers agk:ready with a draft, while /data/manifest.json is still in flight.
  // `settle` decides how the initial fetch ends once the draft is on screen.
  async function previewBeforeInitialFetch(page: Page, settle: 'success' | 'failure') {
    const draft = structuredClone(manifest);
    draft.tours[0].languages.en.title = 'Draft tour';
    const host = `<!doctype html><iframe id="player" src="/" style="width:420px;height:800px"></iframe>
      <script>
        const draft = ${JSON.stringify(draft)};
        addEventListener('message', (e) => {
          if (e.data && e.data.type === 'agk:ready')
            document.getElementById('player').contentWindow.postMessage({ type: 'agk:manifest', manifest: draft }, location.origin);
        });
      </script>`;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/__host', (route) => route.fulfill({ contentType: 'text/html', body: host }));
    // Opening a tour waits for its cover image: answer the external image hosts at once, so the
    // test depends on no internet (and on none being slow).
    await page.route(/^https:\/\//, (route) =>
      route.fulfill({ contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(PIXEL, 'base64') }),
    );
    await page.route('**/data/manifest.json', async (route) => {
      await gate;
      if (settle === 'failure') await route.fulfill({ status: 500, body: 'nope' });
      else await route.fulfill({ contentType: 'application/json', body: JSON.stringify(manifest) });
    });
    await page.goto('/__host');
    const frame = page.frameLocator('#player');
    await expect(frame.locator(TOUR_CARD).filter({ hasText: 'Draft tour' })).toBeVisible({ timeout: 15000 });

    release(); // the initial fetch settles now, after the draft
    await page.waitForTimeout(1500);

    await expect(frame.getByTestId('boot-error')).toHaveCount(0);
    await expect(frame.getByText('Waiting for preview')).toHaveCount(0);
    // Open the tour: it reads the installed data, which must still be the draft.
    await frame.locator(TOUR_CARD).filter({ hasText: 'Draft tour' }).click();
    await expect(frame.getByRole('heading', { level: 1, name: 'Draft tour' })).toBeVisible();
  }

  test('a draft sent before a slow initial fetch is not overwritten when the fetch succeeds', async ({ page }) => {
    await previewBeforeInitialFetch(page, 'success');
  });

  test('a draft sent before the initial fetch fails stays on screen', async ({ page }) => {
    await previewBeforeInitialFetch(page, 'failure');
  });

  test('rejects a manifest of the wrong schema version and keeps what it had', async ({ page }) => {
    await page.route('**/__host', (route) => route.fulfill({ contentType: 'text/html', body: HOST }));
    await page.goto('/__host');
    const frame = page.frameLocator('#player');
    await expect(frame.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });

    const reply = await page.evaluate(
      () =>
        new Promise<{ type: string; message: string }>((resolve) => {
          window.addEventListener('message', (e) => e.data?.type?.startsWith('agk:manifest') && resolve(e.data));
          (document.getElementById('player') as HTMLIFrameElement).contentWindow!.postMessage(
            { type: 'agk:manifest', manifest: { schemaVersion: 999, tours: [] } },
            location.origin,
          );
        }),
    );
    expect(reply.type).toBe('agk:manifest-error');
    expect(reply.message).toContain('999');
    await expect(frame.locator(TOUR_CARD).first()).toBeVisible();
  });

  /** Serve index.html with the tag the edge Worker injects on the preview host. */
  async function withPreviewOriginsMeta(page: Page, content: string) {
    await page.route(/\/$/, async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace('<head>', `<head><meta name="agk-preview-origins" content="${content}">`);
      await route.fulfill({ response, body: html });
    });
  }

  test('the runtime meta tag replaces the build-time origins: the env origin is no longer trusted', async ({ page }) => {
    // The build trusts its own origin through VITE_PREVIEW_ORIGINS. The tag names another one.
    await withPreviewOriginsMeta(page, 'https://editor.example.com');
    await open(page);
    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });

    const changed = structuredClone(manifest);
    changed.app.title.en = 'Changed by the old origin';
    await page.evaluate((m) => window.postMessage({ type: 'agk:manifest', manifest: m }, location.origin), changed);
    await page.waitForTimeout(1000);
    await expect(page.getByText('Changed by the old origin')).toHaveCount(0);
  });

  test('a page carrying the runtime meta tag accepts its origin and registers no service worker', async ({ page }) => {
    await withPreviewOriginsMeta(page, `http://127.0.0.1:${process.env.MANIFEST_TEST_PORT ?? 4173}`);
    await open(page);
    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });

    const changed = structuredClone(manifest);
    changed.app.title.en = 'Changed via the tag';
    await page.evaluate((m) => window.postMessage({ type: 'agk:manifest', manifest: m }, location.origin), changed);
    await expect(page.getByRole('heading', { level: 1, name: 'Changed via the tag' })).toBeVisible();

    // A preview host is a frame for an editor, not an installable app.
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  });

  test('ignores a manifest from an origin that is not allowed', async ({ page }) => {
    // A data: URL frame has the opaque origin "null", which is not on the list.
    // (A second real origin cannot frame the player here: Chrome blocks
    // localhost -> 127.0.0.1 subframes as a local-network access.)
    await open(page);
    await expect(page.locator(TOUR_CARD).first()).toBeVisible({ timeout: 15000 });

    const changed = structuredClone(manifest);
    changed.app.title.en = 'Changed by a stranger';
    const sender = `<script>parent.postMessage(${JSON.stringify({ type: 'agk:manifest', manifest: changed })}, '*')</script>`;
    await page.evaluate((html) => {
      const frame = document.createElement('iframe');
      frame.src = `data:text/html,${encodeURIComponent(html)}`;
      document.body.appendChild(frame);
    }, sender);
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { level: 1, name: manifest.app.title.en })).toBeVisible();
    await expect(page.getByText('Changed by a stranger')).toHaveCount(0);

    // The same message from an allowed origin (this page's own) is accepted.
    await page.evaluate((m) => window.postMessage({ type: 'agk:manifest', manifest: m }, location.origin), changed);
    await expect(page.getByRole('heading', { level: 1, name: 'Changed by a stranger' })).toBeVisible();
  });
});

// The manifest checks (validateManifest on a broken manifest) are plain unit
// tests with no browser: see schema-validation.spec.ts.
