/**
 * Live preview for manifest mode.
 *
 * A host page (an editor) embeds the player in an iframe and posts
 *
 *   { type: 'agk:manifest', manifest }
 *
 * whenever the content changes. The player installs it and re-renders without
 * a reload. Replies go back to the sender:
 *
 *   { type: 'agk:ready' }                       sent at startup, once listening
 *   { type: 'agk:manifest-applied' }
 *   { type: 'agk:manifest-error', message }     the manifest was refused
 *
 * Only origins listed in the `agk-preview-origins` <meta> tag of index.html (injected at
 * the edge, runtime) or, as a fallback, VITE_PREVIEW_ORIGINS (build time) are listened
 * to: comma separated exact origins, e.g. "https://app.example.com,http://localhost:5173".
 * Empty = no bridge at all, which is what a production visitor wants.
 */
import type { Manifest } from '@audioguidekit/schema';
import { parseManifest } from './parseManifest';

/**
 * Turn a comma-separated list into exact origins. Anything that is not a real
 * origin is dropped: the literal "null" (the opaque origin of sandboxed and data:
 * frames, which any page can produce), "*", and anything that does not parse.
 * `http://localhost:5173/` is normalised to `http://localhost:5173`.
 */
export function parseOrigins(raw: string | null | undefined): string[] {
  const origins: string[] = [];
  for (const entry of (raw ?? '').split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    try {
      const { origin } = new URL(trimmed);
      if (origin !== 'null' && !origins.includes(origin)) origins.push(origin);
    } catch {
      // not a URL: ignore it
    }
  }
  return origins;
}

/** True when a page that is framed could receive previews from one of `origins`. */
export function canPreviewFrom(origins: string[], framed: boolean): boolean {
  return origins.length > 0 && framed;
}

/** Name of the <meta> tag a host can inject into index.html to allow preview origins at runtime. */
export const PREVIEW_ORIGINS_META = 'agk-preview-origins';

/**
 * The origins to trust, resolved at RUNTIME so one generic build can serve both
 * customers and the editor's preview host: the `<meta name="agk-preview-origins"
 * content="https://a,https://b">` tag, which the edge Worker injects only on the
 * preview host, wins. VITE_PREVIEW_ORIGINS (build time) is the fallback for
 * self-hosters and local development. Neither = no bridge.
 */
export function resolvePreviewOrigins(metaContent: string | null | undefined, envValue: string | undefined): string[] {
  const fromMeta = parseOrigins(metaContent);
  return fromMeta.length > 0 ? fromMeta : parseOrigins(envValue);
}

export function previewOrigins(): string[] {
  const meta = typeof document === 'undefined' ? null : document.querySelector(`meta[name="${PREVIEW_ORIGINS_META}"]`);
  return resolvePreviewOrigins(meta?.getAttribute('content'), import.meta.env.VITE_PREVIEW_ORIGINS);
}

/** True when this page is framed and a host could be sending previews. */
export function canPreview(): boolean {
  return canPreviewFrom(previewOrigins(), typeof window !== 'undefined' && window.parent !== window);
}

/**
 * Start listening. `onManifest` receives each valid manifest; invalid ones are
 * reported back to the sender and otherwise ignored. Returns a stop function.
 */
export function startPreviewBridge(onManifest: (manifest: Manifest) => void): () => void {
  const origins = previewOrigins();
  if (origins.length === 0) return () => {};

  const listener = (event: MessageEvent) => {
    if (!origins.includes(event.origin)) return;
    if (event.data?.type !== 'agk:manifest') return;

    const reply = (message: Record<string, unknown>) =>
      (event.source as Window | null)?.postMessage(message, event.origin);

    try {
      onManifest(parseManifest(event.data.manifest));
      reply({ type: 'agk:manifest-applied' });
    } catch (error) {
      reply({ type: 'agk:manifest-error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  window.addEventListener('message', listener);

  // Tell the host we are listening, so it need not guess when to send.
  if (window.parent !== window) {
    for (const origin of origins) window.parent.postMessage({ type: 'agk:ready' }, origin);
  }

  return () => window.removeEventListener('message', listener);
}
