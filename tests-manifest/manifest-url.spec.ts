import { test, expect } from '@playwright/test';
import { isManifestRequest, isUsableManifestJson, resolveManifestUrl } from '../src/services/manifestUrl';
import { SCHEMA_VERSION } from '@audioguidekit/schema';

/** The pure helpers behind the manifest's offline caching (page and service worker). */

const BASE = 'https://player.example.com/';

test.describe('manifest URL matching (VITE_MANIFEST_URL)', () => {
  test('the default same-origin path matches, ignoring a cache-busting query', () => {
    expect(isManifestRequest(new URL('https://player.example.com/data/manifest.json'), '/data/manifest.json', BASE)).toBe(true);
    expect(isManifestRequest(new URL('https://player.example.com/data/manifest.json?v=2'), '/data/manifest.json', BASE)).toBe(true);
    expect(isManifestRequest(new URL('https://player.example.com/data/other.json'), '/data/manifest.json', BASE)).toBe(false);
  });

  test('a configured other-origin URL matches, and the default path no longer does', () => {
    const configured = 'https://cdn.example.org/orgs/42/manifest.json';
    expect(isManifestRequest(new URL(configured), configured, BASE)).toBe(true);
    expect(isManifestRequest(new URL('https://player.example.com/data/manifest.json'), configured, BASE)).toBe(false);
    // Same path on a different origin is a different resource.
    expect(isManifestRequest(new URL('https://evil.example.net/orgs/42/manifest.json'), configured, BASE)).toBe(false);
  });

  test('a configured relative URL resolves against the player origin', () => {
    expect(resolveManifestUrl('/tenant/manifest.json', BASE).href).toBe('https://player.example.com/tenant/manifest.json');
    expect(isManifestRequest(new URL('https://player.example.com/tenant/manifest.json'), '/tenant/manifest.json', BASE)).toBe(true);
  });
});

test.describe('isUsableManifestJson (what may replace the cached copy)', () => {
  test('accepts a manifest of this build\'s schemaVersion', () => {
    expect(isUsableManifestJson({ schemaVersion: SCHEMA_VERSION, tours: [] })).toBe(true);
  });

  test('refuses HTML, other versions, and things that are not manifests', () => {
    expect(isUsableManifestJson({ schemaVersion: SCHEMA_VERSION + 1, tours: [] })).toBe(false);
    expect(isUsableManifestJson({ schemaVersion: SCHEMA_VERSION })).toBe(false);
    expect(isUsableManifestJson(null)).toBe(false);
    expect(isUsableManifestJson([])).toBe(false);
    expect(isUsableManifestJson('<html></html>')).toBe(false);
  });
});
