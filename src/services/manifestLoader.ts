/**
 * The manifest data source: fetches /data/manifest.json at startup.
 *
 * Offline: the service worker serves the manifest network-first with a cache
 * fallback (src/sw.ts). That only helps once the worker controls the page, so
 * the very first visit also stores the response itself, and a failed fetch
 * falls back to that cache here as well — a visitor who opened the app once
 * can open it again with no signal.
 */
import type { Manifest } from '@audioguidekit/schema';
import { ManifestError, parseManifest } from './parseManifest';

export { ManifestError, parseManifest };
export type { ManifestErrorKind } from './parseManifest';

/** Cache shared with the service worker's NetworkFirst route for the manifest. */
export const MANIFEST_CACHE = 'agk-manifest';

/**
 * Override with VITE_MANIFEST_URL to serve the manifest from elsewhere (e.g. another
 * origin; it then needs CORS). The service worker's offline route follows this URL.
 */
export const MANIFEST_URL: string = import.meta.env.VITE_MANIFEST_URL || '/data/manifest.json';

async function readCache(): Promise<Response | undefined> {
  try {
    return await caches.match(MANIFEST_URL, { cacheName: MANIFEST_CACHE });
  } catch {
    return undefined;
  }
}

async function writeCache(response: Response): Promise<void> {
  try {
    // With a controlling worker its NetworkFirst route already does this.
    if (navigator.serviceWorker?.controller) return;
    const cache = await caches.open(MANIFEST_CACHE);
    await cache.put(MANIFEST_URL, response);
  } catch {
    // Offline support is best effort; never fail the load over it.
  }
}

async function parseResponse(response: Response): Promise<Manifest> {
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ManifestError('invalid', 'The manifest is not valid JSON.');
  }
  return parseManifest(json);
}

/**
 * Fetch, validate and return the manifest. Rejects with a {@link ManifestError}.
 *
 * Only a manifest that parses is stored for offline use, and one that does not (a
 * captive portal's HTML, a broken publish) falls back to the last good stored copy.
 * A manifest of another schemaVersion is not papered over with the old copy: the
 * visitor needs a newer player, and says so.
 */
export async function loadManifest(): Promise<Manifest> {
  let failure: ManifestError | undefined;
  try {
    const fresh = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (fresh.ok) {
      const copy = fresh.clone();
      try {
        const manifest = await parseResponse(fresh);
        void writeCache(copy);
        return manifest;
      } catch (error) {
        if (error instanceof ManifestError && error.kind === 'unsupported-version') throw error;
        failure = error as ManifestError;
      }
    }
  } catch (error) {
    if (error instanceof ManifestError && error.kind === 'unsupported-version') throw error;
    // Offline or unreachable: fall through to the cache.
  }

  const cached = await readCache();
  if (cached) {
    try {
      return await parseResponse(cached);
    } catch {
      // A damaged stored copy is no better than none.
    }
  }
  throw failure ?? new ManifestError('network', 'The tour data could not be loaded and is not saved on this device.');
}
