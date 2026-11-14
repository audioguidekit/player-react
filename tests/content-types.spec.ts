import { test, expect } from '@playwright/test';
import { startTour } from './helpers';

/**
 * Content stop-type rendering — the surface custom-app authors build on.
 *
 * The shipped sample tours are audio-only, so these run against the hidden
 * `_fixture` tour (src/data/tour/_fixture), which carries one stop of every
 * content type. `StopCardRenderer` tags each rendered card with
 * `data-stop-type="<type>"`, so we can assert each type mounts and produces its
 * hallmark element — without depending on per-card internals.
 *
 * The fixture is excluded from the picker and from production builds (see
 * tourDiscovery + vite.config), and is routable only by URL in dev/test.
 */

const FIXTURE = '_fixture';

// The feed defers off-screen cards (content-visibility), so scroll a card into
// view before asserting its inner content is actually rendered.
async function card(page: import('@playwright/test').Page, type: string) {
  const el = page.locator(`[data-stop-type="${type}"]`).first();
  await el.scrollIntoViewIfNeeded();
  return el;
}

test.use({ viewport: { width: 430, height: 1100 } });

test.describe('Content stop types', () => {
  test('every content stop type mounts without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await startTour(page, FIXTURE);

    const types = [
      'text', 'image-text', 'headline', 'quote', 'image-gallery',
      'image-comparison', 'image-hotspot', 'video', 'embed', '3d-object',
      'email', 'rating',
    ];
    for (const t of types) {
      await expect(page.locator(`[data-stop-type="${t}"]`), `missing card: ${t}`).toHaveCount(1);
    }
    expect(errors, `Uncaught errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('text/headline/quote render their copy', async ({ page }) => {
    await startTour(page, FIXTURE);

    await expect((await card(page, 'headline')).getByText('A Section Headline')).toBeVisible();
    const quote = await card(page, 'quote');
    await expect(quote.getByText(/fixture quote/i)).toBeVisible();
    await expect(quote.getByText('Test Author')).toBeVisible();
    await expect((await card(page, 'text')).getByText('SAFE-STRONG')).toBeVisible();
  });

  test('image-based cards render their media', async ({ page }) => {
    await startTour(page, FIXTURE);

    await expect((await card(page, 'image-text')).locator('img')).toHaveCount(1);
    expect(await (await card(page, 'image-gallery')).locator('img').count()).toBeGreaterThanOrEqual(1);
    // Comparison renders a before and an after image.
    expect(await (await card(page, 'image-comparison')).locator('img').count()).toBeGreaterThanOrEqual(2);
    // Hotspot overlays interactive pins (buttons) on the image.
    expect(await (await card(page, 'image-hotspot')).locator('button').count()).toBeGreaterThanOrEqual(1);
  });

  test('rich media cards render their embeds', async ({ page, browserName }) => {
    await startTour(page, FIXTURE);

    await expect((await card(page, 'video')).locator('video')).toHaveCount(1);
    await expect((await card(page, 'embed')).locator('iframe')).toHaveCount(1);
    // model-viewer is a custom element registered by @google/model-viewer. WebKit can lose its
    // WebGL context on heavy models, so ThreeDObjectCard deliberately renders a text fallback there.
    const model = await card(page, '3d-object');
    if (browserName === 'webkit') {
      await expect(model.getByText(/3D preview is not available on Safari/)).toBeVisible();
      await expect(model.locator('model-viewer')).toHaveCount(0);
    } else {
      await expect(model.locator('model-viewer')).toHaveCount(1);
    }
  });

  test('interactive cards (email, rating) render their controls', async ({ page }) => {
    await startTour(page, FIXTURE);

    const email = await card(page, 'email');
    await expect(email.locator('input')).toHaveCount(1);
    await expect(email.getByRole('button', { name: /subscribe/i })).toBeVisible();

    const rating = await card(page, 'rating');
    await expect(rating.getByText(/how was this tour/i)).toBeVisible();
    expect(await rating.locator('button').count()).toBeGreaterThanOrEqual(1);
  });
});
