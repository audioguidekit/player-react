import type { Manifest } from '@audioguidekit/schema';
import { DATA_SOURCE } from './dataSource';
import { installManifest } from './tourDiscovery';
import { applyAppIdentity } from './appIdentity';

/**
 * Get the data from the build's data source and install it. Runs once at
 * startup, before any module that derives state from the data is loaded.
 *
 * Rejects with a `ManifestError` (manifest mode) when there is no usable data.
 *
 * `isSuperseded` is asked once the data has arrived: when it says yes, something
 * newer (a live-preview manifest) is already installed, so the result is dropped
 * and `false` is returned. Without it a slow fetch would overwrite the draft.
 */
export async function loadInitialData(isSuperseded: () => boolean = () => false): Promise<boolean> {
  let manifest: Manifest;
  if (DATA_SOURCE === 'manifest') {
    const { loadManifest } = await import('./manifestLoader');
    manifest = await loadManifest();
  } else {
    const { buildCompiledManifest } = await import('./compiledData');
    manifest = buildCompiledManifest();
  }
  if (isSuperseded()) return false;
  applyManifest(manifest);
  return true;
}

/** Install a manifest (initial load or live preview) and apply the app identity. */
export function applyManifest(manifest: Manifest): void {
  installManifest(manifest);
  // Manifest mode has no build-time identity (see vite.config.ts), so the tab
  // title, theme colour and iOS home-screen name come from the data. The
  // compiled build already baked these in, and re-applying them is harmless.
  if (DATA_SOURCE === 'manifest') applyAppIdentity(manifest.app);
}
