import { defineConfig, devices } from '@playwright/test';

// Never 3000: other projects' dev servers live there. Override with PLAYWRIGHT_PORT when 3217 is taken.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3217);
const ORIGIN = `http://localhost:${PORT}`;

/**
 * These specs rewrite the hidden `_fixture` tour (or app.json) on disk and wait for Vite to
 * re-bundle it, so they need the dev server. A rewrite makes Vite reload EVERY open page, so
 * they must never run beside other tests nor beside each other (two of them edit the same
 * file): they get their own projects, chained with `dependencies`, which run one after another
 * once all the read-only projects are done.
 */
const MUTATING = ['config-flags.spec.ts', 'stop-card-display.spec.ts', 'tour-card-display.spec.ts'];

const readOnly = MUTATING.map((file) => `**/${file}`);
const desktop = devices['Desktop Chrome'];

export default defineConfig({
  testDir: '../tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Bounded: three browser projects on one dev server starve each other when every core runs a worker.
  workers: process.env.CI ? 1 : 4,
  globalSetup: './playwright.global-setup.ts',
  reporter: 'html',
  use: {
    baseURL: ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...desktop }, testIgnore: readOnly },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] }, testIgnore: readOnly },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] }, testIgnore: readOnly },
    ...MUTATING.map((file, i) => ({
      name: `mutating: ${file.replace('.spec.ts', '')}`,
      use: { ...desktop },
      testMatch: `**/${file}`,
      fullyParallel: false,
      dependencies: i === 0 ? ['chromium', 'Mobile Chrome', 'Mobile Safari'] : [`mutating: ${MUTATING[i - 1].replace('.spec.ts', '')}`],
    })),
  ],
  webServer: {
    // --strictPort: fail instead of silently moving to another port, so the suite can only ever
    // test its own server. HTTP=1: the dev server is HTTPS (self-signed) by default.
    command: `HTTP=1 bunx vite --port ${PORT} --strictPort`,
    url: ORIGIN,
    cwd: '..',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
