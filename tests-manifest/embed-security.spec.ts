import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { validateManifest } from '@audioguidekit/schema';
import { isEmbedHostAllowed, resolveEmbed, resolveEmbedFrame } from '../components/feed/embedSecurity';
import { dismissSplashIfPresent, startButton } from '../tests/helpers';
import { audioStop, draftOf, startDraft } from './visitor-helpers';

/** Embed stops: what may be framed, and how it is sandboxed. */

const ORIGIN = 'https://player.example.com';
const manifest = JSON.parse(readFileSync('dist-manifest/data/manifest.json', 'utf8'));

test.describe('resolveEmbedFrame', () => {
  test('refuses anything that is not https, or runs as the player', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'blob:https://player.example.com/abc',
      'http://example.com/x',
      '/media/org/upload.html', // relative = the player's origin
      '',
      'not a url',
      `${ORIGIN}/media/org/upload.svg`, // an uploaded file on the player's own origin
    ]) {
      expect(resolveEmbedFrame(url, 'generic', ORIGIN), url).toBeNull();
    }
  });

  test('a generic embed gets scripts only, never allow-same-origin', () => {
    const frame = resolveEmbedFrame('https://maps.example.org/embed?id=1', 'generic', ORIGIN)!;
    expect(frame.sandbox).toBe('allow-scripts');
    expect(resolveEmbedFrame('https://maps.example.org/embed', undefined, ORIGIN)!.sandbox).toBe('allow-scripts');
  });

  test('youtube and spotify keep what their players need, and youtube goes through nocookie', () => {
    const yt = resolveEmbedFrame('https://www.youtube.com/embed/abc', 'youtube', ORIGIN)!;
    expect(yt.src).toBe('https://www.youtube-nocookie.com/embed/abc');
    expect(yt.sandbox).toContain('allow-same-origin');
    expect(resolveEmbedFrame('https://open.spotify.com/embed/track/1', 'spotify', ORIGIN)!.sandbox).toContain('allow-same-origin');
  });
});

test.describe('typed embed host rules', () => {
  test('youtube hosts are framed from www.youtube-nocookie.com', () => {
    for (const host of ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'WWW.YouTube.com']) {
      const frame = resolveEmbedFrame(`https://${host}/embed/abc?start=3`, 'youtube', ORIGIN)!;
      expect(frame.src, host).toBe('https://www.youtube-nocookie.com/embed/abc?start=3');
      expect(frame.type).toBe('youtube');
      expect(frame.sandbox).toContain('allow-same-origin');
    }
  });

  test('a youtube embed on another host, or over http, is downgraded or refused', () => {
    for (const url of [
      'https://evil.example/embed/abc',
      'https://youtube.com.evil.example/embed/abc',
      'https://m.youtube.com/embed/abc',
      'https://youtu.be/abc',
      'https://user@evil.example/',
    ]) {
      const frame = resolveEmbedFrame(url, 'youtube', ORIGIN)!;
      expect(frame.type, url).toBe('generic');
      expect(frame.sandbox, url).toBe('allow-scripts');
      expect(frame.src, url).not.toContain('nocookie');
    }
    expect(resolveEmbed('http://www.youtube.com/embed/abc', 'youtube', ORIGIN)).toEqual({ kind: 'invalid' });
  });

  test('spotify is open.spotify.com only; other hosts are downgraded', () => {
    const ok = resolveEmbedFrame('https://open.spotify.com/embed/track/1', 'spotify', ORIGIN)!;
    expect(ok.type).toBe('spotify');
    expect(ok.sandbox).toContain('allow-same-origin');
    for (const url of ['https://spotify.com/embed/x', 'https://open.spotify.com.evil.example/x', 'https://evil.example/x']) {
      const frame = resolveEmbedFrame(url, 'spotify', ORIGIN)!;
      expect(frame.type, url).toBe('generic');
      expect(frame.sandbox, url).toBe('allow-scripts');
    }
  });

  test('a downgraded embed is then subject to the allowlist', () => {
    expect(resolveEmbed('https://evil.example/x', 'youtube', ORIGIN, ['www.youtube.com'])).toEqual({ kind: 'blocked' });
    expect(resolveEmbed('https://evil.example/x', 'youtube', ORIGIN, ['evil.example']).kind).toBe('frame');
  });
});

test.describe('the schema', () => {
  const withEmbed = (embedUrl: string) => {
    const m = structuredClone(manifest);
    m.tours[0].languages.en.stops.push({ id: 'e1', type: 'embed', embedUrl });
    return validateManifest(m);
  };

  test('accepts an https embed (and the empty placeholder), rejects other schemes', () => {
    expect(withEmbed('https://example.com/embed').valid).toBe(true);
    expect(withEmbed('').valid).toBe(true);
    for (const bad of ['javascript:alert(1)', 'http://example.com', 'data:text/html,x', '/media/x.html']) {
      const result = withEmbed(bad);
      expect(result.valid, bad).toBe(false);
      expect(result.errors.join('\n')).toContain('embedUrl');
    }
  });
});

test.describe('the player', () => {
  test('frames only safe embeds, and sandboxes a generic one without allow-same-origin', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
    await dismissSplashIfPresent(page);

    const draft = structuredClone(manifest);
    draft.tours[0].languages.en.stops = [
      { id: 'a1', type: 'audio', title: 'Only audio stop', duration: '0:10', image: '', audioFile: '' },
      { id: 'e-generic', type: 'embed', embedType: 'generic', embedUrl: 'https://example.com/widget' },
      { id: 'e-js', type: 'embed', embedType: 'generic', embedUrl: 'javascript:alert(1)' },
      { id: 'e-own', type: 'embed', embedType: 'generic', embedUrl: `${new URL(page.url()).origin}/media/org/upload.html` },
      { id: 'e-yt', type: 'embed', embedType: 'youtube', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ];
    draft.tours[0].languages.en.totalStops = 1;
    // The player allows its own origin to send previews (playwright.manifest.config.ts).
    await page.evaluate((m) => window.postMessage({ type: 'agk:manifest', manifest: m }, location.origin), draft);

    await page.locator('button:has(h2)').first().click();
    await startButton(page).click();
    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) await listToggle.click();
    await expect(page.locator('#stop-e-generic')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('#stop-e-generic iframe')).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(page.locator('#stop-e-yt iframe')).toHaveAttribute('sandbox', /allow-same-origin/);
    await expect(page.locator('#stop-e-js iframe')).toHaveCount(0);
    await expect(page.locator('#stop-e-own iframe')).toHaveCount(0);
  });

  test('a "youtube" or "spotify" embed pointing at another host gets the strict sandbox', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('boot-loading')).toHaveCount(0, { timeout: 15000 });
    await dismissSplashIfPresent(page);

    const draft = structuredClone(manifest);
    draft.tours[0].languages.en.stops = [
      { id: 'a1', type: 'audio', title: 'Only audio stop', duration: '0:10', image: '', audioFile: '' },
      { id: 'e-fake-yt', type: 'embed', embedType: 'youtube', embedUrl: 'https://youtube.com.evil.example/embed/x' },
      { id: 'e-fake-sp', type: 'embed', embedType: 'spotify', embedUrl: 'https://evil.example/embed/x' },
      { id: 'e-yt', type: 'embed', embedType: 'youtube', embedUrl: 'https://youtube.com/embed/dQw4w9WgXcQ' },
    ];
    draft.tours[0].languages.en.totalStops = 1;
    await page.evaluate((m) => window.postMessage({ type: 'agk:manifest', manifest: m }, location.origin), draft);

    await page.locator('button:has(h2)').first().click();
    await startButton(page).click();
    const listToggle = page.getByRole('button', { name: 'List view' });
    if (await listToggle.isVisible().catch(() => false)) await listToggle.click();
    await expect(page.locator('#stop-e-fake-yt')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('#stop-e-fake-yt iframe')).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(page.locator('#stop-e-fake-sp iframe')).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(page.locator('#stop-e-fake-yt iframe')).not.toHaveAttribute('allow', /encrypted-media/);
    await expect(page.locator('#stop-e-yt iframe')).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\//);
    await expect(page.locator('#stop-e-yt iframe')).toHaveAttribute('sandbox', /allow-same-origin/);
  });
});

test.describe('the embed allowlist: matching', () => {
  test('no list, or an empty one, means no limit', () => {
    expect(isEmbedHostAllowed('anything.example', undefined)).toBe(true);
    expect(isEmbedHostAllowed('anything.example', [])).toBe(true);
    expect(isEmbedHostAllowed('anything.example', ['', '  '])).toBe(true);
  });

  test('a hostname matches itself only, whatever its case', () => {
    const list = ['maps.example.org', 'Widgets.Example.NET'];
    expect(isEmbedHostAllowed('maps.example.org', list)).toBe(true);
    expect(isEmbedHostAllowed('MAPS.example.org', list)).toBe(true);
    expect(isEmbedHostAllowed('widgets.example.net.', list)).toBe(true); // a trailing dot is the same host
    expect(isEmbedHostAllowed('example.org', list)).toBe(false);
    expect(isEmbedHostAllowed('evil.maps.example.org', list)).toBe(false);
    expect(isEmbedHostAllowed('maps.example.org.evil.com', list)).toBe(false);
    expect(isEmbedHostAllowed('notmaps.example.org', list)).toBe(false);
  });

  test('*.example.org matches the subdomains, at any depth, but not example.org itself', () => {
    const list = ['*.example.org'];
    expect(isEmbedHostAllowed('maps.example.org', list)).toBe(true);
    expect(isEmbedHostAllowed('a.b.example.org', list)).toBe(true);
    expect(isEmbedHostAllowed('example.org', list)).toBe(false);
    expect(isEmbedHostAllowed('badexample.org', list)).toBe(false);
    expect(isEmbedHostAllowed('example.org.evil.com', list)).toBe(false);
  });
});

test.describe('the embed allowlist: the rules', () => {
  const list = ['maps.example.org'];

  test('a generic embed from a host that is not listed is blocked, one that is listed is framed', () => {
    expect(resolveEmbed('https://other.example.net/w', 'generic', ORIGIN, list)).toEqual({ kind: 'blocked' });
    expect(resolveEmbed('https://other.example.net/w', undefined, ORIGIN, list)).toEqual({ kind: 'blocked' });
    expect(resolveEmbed('https://maps.example.org/w', 'generic', ORIGIN, list).kind).toBe('frame');
    expect(resolveEmbedFrame('https://other.example.net/w', 'generic', ORIGIN, list)).toBeNull();
  });

  test('without a list nothing changes', () => {
    expect(resolveEmbed('https://other.example.net/w', 'generic', ORIGIN).kind).toBe('frame');
    expect(resolveEmbed('https://other.example.net/w', 'generic', ORIGIN, []).kind).toBe('frame');
  });

  test('the existing rules still come first: a listed host is not framed over http, on the player\'s origin or as a script URL', () => {
    const own = ['player.example.com', 'maps.example.org'];
    expect(resolveEmbed('http://maps.example.org/w', 'generic', ORIGIN, own)).toEqual({ kind: 'invalid' });
    expect(resolveEmbed(`${ORIGIN}/media/org/upload.html`, 'generic', ORIGIN, own)).toEqual({ kind: 'invalid' });
    expect(resolveEmbed('javascript:alert(1)', 'generic', ORIGIN, own)).toEqual({ kind: 'invalid' });
    expect(resolveEmbed('', 'generic', ORIGIN, own)).toEqual({ kind: 'invalid' }); // the empty placeholder shows nothing, not a notice
  });

  test('a generic embed still gets scripts only, never allow-same-origin', () => {
    const result = resolveEmbed('https://maps.example.org/w', 'generic', ORIGIN, list);
    expect(result.kind === 'frame' && result.frame.sandbox).toBe('allow-scripts');
  });

  test('YouTube, Spotify and video embeds are limited by the list too, unless it is empty', () => {
    expect(resolveEmbed('https://www.youtube.com/embed/abc', 'youtube', ORIGIN, list)).toEqual({ kind: 'blocked' });
    expect(resolveEmbed('https://open.spotify.com/embed/track/1', 'spotify', ORIGIN, list)).toEqual({ kind: 'blocked' });
    expect(resolveEmbed('https://media.example.net/clip.mp4', 'video', ORIGIN, list)).toEqual({ kind: 'blocked' });
    const withYt = ['www.youtube.com', 'open.spotify.com', 'media.example.net'];
    expect(resolveEmbed('https://www.youtube.com/embed/abc', 'youtube', ORIGIN, withYt).kind).toBe('frame');
    expect(resolveEmbed('https://open.spotify.com/embed/track/1', 'spotify', ORIGIN, withYt).kind).toBe('frame');
    expect(resolveEmbed('https://media.example.net/clip.mp4', 'video', ORIGIN, withYt).kind).toBe('frame');
    expect(resolveEmbed('https://www.youtube.com/embed/abc', 'youtube', ORIGIN, []).kind).toBe('frame');
  });

  test('an unknown embedType is treated as generic', () => {
    expect(resolveEmbed('https://other.example.net/w', 'toString', ORIGIN, list)).toEqual({ kind: 'blocked' });
    expect(resolveEmbed('https://other.example.net/w', 'vimeo', ORIGIN, list)).toEqual({ kind: 'blocked' });
  });
});

test.describe('the embed allowlist: the schema', () => {
  const withList = (embedAllowlist: unknown) => {
    const m = structuredClone(manifest);
    m.app.embedAllowlist = embedAllowlist;
    return validateManifest(m);
  };

  test('accepts hostnames and *. wildcards', () => {
    expect(withList(['maps.example.org', '*.example.net', 'localhost', 'xn--bcher-kva.example']).valid).toBe(true);
    expect(withList([]).valid).toBe(true);
  });

  test('refuses what is not a bare hostname', () => {
    for (const bad of ['https://maps.example.org', 'maps.example.org/path', 'maps.example.org:8080', '*', '*example.org', 'a b.example', '', '.example.org', 'example..org', '*.']) {
      const result = withList([bad]);
      expect(result.valid, bad).toBe(false);
      expect(result.errors.join('\n')).toContain('embedAllowlist');
    }
    expect(withList('maps.example.org').valid).toBe(false); // a list, not a string
  });
});

test.describe('the embed allowlist: the player', () => {
  test.use({ serviceWorkers: 'block', viewport: { width: 430, height: 900 } });

  test('an embed from an unlisted host, of any type, becomes a neutral notice', async ({ page }) => {
    const draft = draftOf();
    draft.manifest.app = { ...draft.manifest.app, embedAllowlist: ['*.allowed.example'] };
    draft.tour.stops = [
      audioStop('a1', 'Only audio stop'),
      { id: 'e-ok', type: 'embed', embedType: 'generic', embedUrl: 'https://widgets.allowed.example/map' },
      { id: 'e-no', type: 'embed', embedType: 'generic', embedUrl: 'https://tracker.elsewhere.example/ad', caption: 'Hidden caption' },
      { id: 'e-none', type: 'embed', embedUrl: 'https://other.elsewhere.example/x' },
      { id: 'e-yt', type: 'embed', embedType: 'youtube', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'e-js', type: 'embed', embedType: 'generic', embedUrl: 'javascript:alert(1)' },
    ] as never;
    draft.tour.totalStops = 1;
    await startDraft(page, draft);
    await expect(page.locator('#stop-e-ok iframe')).toHaveAttribute('src', 'https://widgets.allowed.example/map');

    for (const id of ['e-no', 'e-none']) {
      await expect(page.locator(`#stop-${id} iframe`), id).toHaveCount(0);
      const notice = page.locator(`#stop-${id}`).getByTestId('embed-blocked');
      await expect(notice).toBeVisible();
      await expect(notice).toHaveText('This content is not available here.');
      await expect(notice).not.toContainText('elsewhere'); // neutral: no address
    }
    await expect(page.locator('#stop-e-yt iframe')).toHaveCount(0); // YouTube is not on the list either
    await expect(page.locator('#stop-e-yt').getByTestId('embed-blocked')).toBeVisible();
    await expect(page.locator('#stop-e-js iframe')).toHaveCount(0);
    await expect(page.locator('#stop-e-js').getByTestId('embed-blocked')).toHaveCount(0); // invalid: nothing, as before
    expect(await page.locator('[src*="elsewhere"]').count()).toBe(0); // no request is made for it either
  });

  test('without an allowlist every generic https embed is framed, as before', async ({ page }) => {
    const draft = draftOf();
    draft.tour.stops = [
      audioStop('a1', 'Only audio stop'),
      { id: 'e-any', type: 'embed', embedType: 'generic', embedUrl: 'https://tracker.elsewhere.example/ad' },
    ] as never;
    draft.tour.totalStops = 1;
    await startDraft(page, draft);
    await expect(page.locator('#stop-e-any iframe')).toHaveCount(1);
    await expect(page.getByTestId('embed-blocked')).toHaveCount(0);
  });
});
