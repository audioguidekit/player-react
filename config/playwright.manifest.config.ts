import { defineConfig, devices } from '@playwright/test';

/**
 * Manifest-mode suite: builds the player with VITE_DATA_SOURCE=manifest (no tour
 * data compiled in), serves it with a manifest generated from the barcelona
 * fixture, and tests the runtime path. Separate from the main config, whose dev
 * server compiles the data in.
 *
 *   bun run test:manifest
 *
 * 127.0.0.1, not localhost: index.html does not register the service worker on
 * localhost, and the offline test needs it.
 */
// Override with MANIFEST_TEST_PORT when another worktree's run holds 4173.
const PORT = Number(process.env.MANIFEST_TEST_PORT ?? 4173);
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: '../tests-manifest',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: [
      `VITE_DATA_SOURCE=manifest VITE_PREVIEW_ORIGINS=${ORIGIN} bunx vite build --outDir dist-manifest`,
      'bun scripts/build-manifest.ts --out dist-manifest/data/manifest.json',
      'bun tests-manifest/augment-manifest.ts dist-manifest/data/manifest.json',
      `HTTP=1 bunx vite preview --outDir dist-manifest --host 127.0.0.1 --port ${PORT} --strictPort`,
    ].join(' && '),
    url: `${ORIGIN}/data/manifest.json`,
    cwd: '..',
    reuseExistingServer: false, // always the fresh build
    timeout: 180 * 1000,
  },
});
