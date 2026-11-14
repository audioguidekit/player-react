import { test, expect, type Page, type Route } from '@playwright/test';
import { validateManifest, type Stop, type TourData } from '@audioguidekit/schema';
import { extractTourAssetUrls } from '../src/services/tourAssets';
import { subtitlesNeedCors, usableSubtitles } from '../src/video/subtitles';
import { baseManifest, draftOf, startDraft, type Draft } from './visitor-helpers';
import { dismissSplashIfPresent } from '../tests/helpers';

/** Video subtitles: the schema, the <track> elements, loading a file, and what an offline download takes. */

test.use({ viewport: { width: 430, height: 900 } });

const VTT = 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello from the subtitles\n';
const en = { src: '/subs/en.vtt', srclang: 'en', label: 'English' };
const de = { src: '/subs/de.vtt', srclang: 'de', label: 'Deutsch' };

const videoStop = (extra: Record<string, unknown> = {}) =>
  ({ id: 'v1', type: 'video', videoUrl: '/media/test-org/clip.webm', ...extra }) as Stop;

function tourWithVideo(subtitles?: unknown): Draft {
  const draft = draftOf();
  draft.tour.stops = [...draft.tour.stops.filter((s) => s.type === 'audio').slice(0, 1), videoStop(subtitles ? { subtitles } : {})] as Stop[];
  draft.tour.totalStops = 1;
  return draft;
}

const validate = (subtitles: unknown) => {
  const manifest = baseManifest();
  manifest.tours[1].languages.en.stops.push(videoStop({ subtitles }));
  manifest.tours[1].languages.en.totalStops = manifest.tours[1].languages.en.stops.filter((s) => s.type === 'audio').length;
  return validateManifest(manifest);
};

test.describe('the schema', () => {
  test('accepts a list of WebVTT files with a language and a name', () => {
    expect(validate([en, de]).valid).toBe(true);
    expect(validate([{ src: 'https://cdn.example.org/a.vtt', srclang: 'pt-BR', label: 'Português' }]).valid).toBe(true);
    expect(validate([]).valid).toBe(true);
  });

  test('refuses an entry without a file, a language code or a name, and unknown properties', () => {
    for (const bad of [
      [{ srclang: 'en', label: 'English' }],
      [{ src: '', srclang: 'en', label: 'English' }],
      [{ src: 'has space.vtt', srclang: 'en', label: 'English' }],
      [{ src: '/a.vtt', label: 'English' }],
      [{ src: '/a.vtt', srclang: 'english', label: 'English' }],
      [{ src: '/a.vtt', srclang: 'e', label: 'English' }],
      [{ src: '/a.vtt', srclang: 'en' }],
      [{ ...en, kind: 'captions' }],
      'en.vtt',
    ]) {
      const result = validate(bad);
      expect(result.valid, JSON.stringify(bad)).toBe(false);
      expect(result.errors.join('\n')).toContain('subtitles');
    }
  });
});

test.describe('the rules', () => {
  test('the player only uses entries it can use', () => {
    expect(usableSubtitles([en, { ...de, src: '  ' }, { ...de, srclang: 'deutsch' }, { ...de, label: '' }])).toEqual([en]);
    expect(usableSubtitles(undefined)).toEqual([]);
    expect(usableSubtitles('nope' as never)).toEqual([]);
  });

  test('a subtitle file on another origin asks the video for CORS; one on the same origin does not', () => {
    const page = 'https://player.example.com/tour/x';
    expect(subtitlesNeedCors([en], page)).toBe(false);
    expect(subtitlesNeedCors([{ ...en, src: 'https://player.example.com/media/a.vtt' }], page)).toBe(false);
    expect(subtitlesNeedCors([en, { ...de, src: 'https://cdn.example.org/de.vtt' }], page)).toBe(true);
  });

  test('an offline download takes the subtitle files with the video', () => {
    const tour = {
      id: 't', language: 'en', title: '', description: '', totalDuration: '', totalStops: 0,
      stops: [
        videoStop({ subtitles: [en, de, { ...en }, { src: 'x.vtt', srclang: 'bad lang', label: 'Skipped' }] }),
        { id: 'v2', type: 'video', videoUrl: 'https://cdn.example.org/b.mp4', subtitles: [{ src: 'https://cdn.example.org/b.vtt', srclang: 'fr', label: 'Français' }] },
        { id: 'v3', type: 'video', videoUrl: 'https://cdn.example.org/c.mp4' },
      ],
    } as TourData;
    expect(extractTourAssetUrls(tour)).toEqual([
      '/media/test-org/clip.webm', '/subs/en.vtt', '/subs/de.vtt',
      'https://cdn.example.org/b.mp4', 'https://cdn.example.org/b.vtt',
      'https://cdn.example.org/c.mp4',
    ]);
  });
});

async function stubFiles(page: Page) {
  await page.route('**/subs/*.vtt', (route) => route.fulfill({ contentType: 'text/vtt', body: VTT }));
  await page.route('**/media/test-org/clip.webm', (route) => route.fulfill({ contentType: 'video/webm', body: Buffer.alloc(64) }));
}

test.describe('in the player', () => {
  test.use({ serviceWorkers: 'block' });

  test('renders one <track> per subtitle, with its language and name, not switched on by default', async ({ page }) => {
    await stubFiles(page);
    await startDraft(page, tourWithVideo([en, de]));
    const video = page.locator('#stop-v1 video');
    await video.scrollIntoViewIfNeeded();
    await expect(video.locator('track')).toHaveCount(2);
    await expect(video.locator('track').nth(0)).toHaveAttribute('kind', 'subtitles');
    await expect(video.locator('track').nth(0)).toHaveAttribute('srclang', 'en');
    await expect(video.locator('track').nth(0)).toHaveAttribute('label', 'English');
    await expect(video.locator('track').nth(1)).toHaveAttribute('srclang', 'de');
    await expect(video.locator('track').nth(1)).toHaveAttribute('label', 'Deutsch');
    await expect(video.locator('track[default]')).toHaveCount(0);
    await expect(video).not.toHaveAttribute('crossorigin', /.*/); // same-origin files need none
  });

  test('a subtitle file really loads as cues', async ({ page }) => {
    await stubFiles(page);
    await startDraft(page, tourWithVideo([en]));
    const video = page.locator('#stop-v1 video');
    await video.scrollIntoViewIfNeeded();
    await video.evaluate((el: HTMLVideoElement) => { el.textTracks[0].mode = 'hidden'; });
    await expect
      .poll(() => video.evaluate((el: HTMLVideoElement) => el.textTracks[0].cues?.length ?? 0), { timeout: 10000 })
      .toBe(1);
    expect(await video.evaluate((el: HTMLVideoElement) => (el.textTracks[0].cues![0] as VTTCue).text)).toBe('Hello from the subtitles');
  });

  test('a file on another origin switches the video to crossorigin so the browser fetches it', async ({ page }) => {
    await page.route('https://subs.example.test/**', (route) =>
      route.fulfill({ contentType: 'text/vtt', headers: { 'access-control-allow-origin': '*' }, body: VTT }),
    );
    await stubFiles(page);
    await startDraft(page, tourWithVideo([{ src: 'https://subs.example.test/fr.vtt', srclang: 'fr', label: 'Français' }]));
    const video = page.locator('#stop-v1 video');
    await video.scrollIntoViewIfNeeded();
    await expect(video).toHaveAttribute('crossorigin', 'anonymous');
    await video.evaluate((el: HTMLVideoElement) => { el.textTracks[0].mode = 'hidden'; });
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.textTracks[0].cues?.length ?? 0), { timeout: 10000 }).toBe(1);
  });

  test('a video without subtitles has no tracks and no crossorigin', async ({ page }) => {
    await stubFiles(page);
    await startDraft(page, tourWithVideo());
    const video = page.locator('#stop-v1 video');
    await video.scrollIntoViewIfNeeded();
    await expect(video.locator('track')).toHaveCount(0);
    await expect(video).not.toHaveAttribute('crossorigin', /.*/);
  });
});

test.describe('offline', () => {
  test('the download manager caches the subtitle files and they are served with no network', async ({ page, context }) => {
    const draft = tourWithVideo([en, { src: 'https://subs.example.test/fr.vtt', srclang: 'fr', label: 'Français' }]);
    const body = JSON.stringify(draft.manifest);
    await context.route('**/data/manifest.json', (route) => route.fulfill({ contentType: 'application/json', body }));
    const serveSubtitles = async (route: Route) => {
      const cors = new URL(route.request().url()).origin === 'https://subs.example.test' ? { 'access-control-allow-origin': '*' } : undefined;
      await route.fulfill({ contentType: 'text/vtt', headers: cors, body: VTT });
    };
    await context.route('**/subs/en.vtt', serveSubtitles);
    await context.route('https://subs.example.test/**', serveSubtitles);
    await context.route('**/media/test-org/clip.webm', (route) => route.fulfill({ contentType: 'video/webm', body: Buffer.alloc(64) }));
    await page.route(/^https:\/\/(?!subs\.example\.test)/, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: Buffer.alloc(8) }),
    );

    await page.goto('/tour/barcelona-evening', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await dismissSplashIfPresent(page);

    await page.getByRole('button', { name: /download/i }).first().click();
    const cached = (url: string) => page.evaluate(async (u) => !!(await (await caches.open('tour-assets')).match(u)), url);
    await expect.poll(() => cached('/subs/en.vtt'), { timeout: 20000 }).toBe(true);
    expect(await cached('https://subs.example.test/fr.vtt')).toBe(true);

    // From here on only the downloaded copy can answer: the stubs go, and so does the app shell's
    // opportunistic copy of the same-origin file, which would otherwise hide a missing download.
    await context.unroute('**/subs/en.vtt', serveSubtitles);
    await context.unroute('https://subs.example.test/**', serveSubtitles);
    await page.evaluate(async () => (await caches.open('app-shell')).delete('/subs/en.vtt'));
    await context.setOffline(true);
    const result = await page.evaluate(async () => {
      const sameOrigin = await fetch('/subs/en.vtt');
      // What a <track> does: a CORS-mode request for a file on another origin.
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      for (const [src, lang] of [['/subs/en.vtt', 'en'], ['https://subs.example.test/fr.vtt', 'fr']]) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.src = src;
        track.srclang = lang;
        video.appendChild(track);
      }
      document.body.appendChild(video);
      for (const t of Array.from(video.textTracks)) t.mode = 'hidden';
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        status: sameOrigin.status,
        text: await sameOrigin.text(),
        cues: Array.from(video.textTracks).map((t) => t.cues?.length ?? 0),
      };
    });
    await context.setOffline(false);
    expect(result.status).toBe(200);
    expect(result.text).toBe(VTT);
    expect(result.cues).toEqual([1, 1]);
  });
});
