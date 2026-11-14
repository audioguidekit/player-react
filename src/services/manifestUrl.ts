/**
 * Pure helpers shared by the page (manifestLoader) and the service worker (sw.ts).
 * No `import.meta.env` in here, so they run in a plain unit test too.
 */
import { SCHEMA_VERSION } from '@audioguidekit/schema';

/** The configured manifest URL as an absolute URL (it may be relative, or another origin). */
export function resolveManifestUrl(configured: string, base: string): URL {
  return new URL(configured, base);
}

/**
 * Does this request fetch the manifest? Compared by origin and path (a cache-busting
 * query must not defeat the offline copy), so it follows VITE_MANIFEST_URL wherever it points.
 */
export function isManifestRequest(url: URL, configured: string, base: string): boolean {
  const manifest = resolveManifestUrl(configured, base);
  return url.origin === manifest.origin && url.pathname === manifest.pathname;
}

/**
 * Is this parsed JSON a manifest this build can run? The only thing allowed to replace
 * the last good copy in the offline cache: a captive portal's HTML, a broken publish or
 * another schemaVersion must not.
 */
export function isUsableManifestJson(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const data = value as { schemaVersion?: unknown; tours?: unknown };
  return data.schemaVersion === SCHEMA_VERSION && Array.isArray(data.tours);
}
