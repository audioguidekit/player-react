import { chromium, type FullConfig } from '@playwright/test';

/**
 * Warm the Vite dev server before any test runs. On a cold start Vite optimises
 * dependencies on the first page load and reloads the page when it finds more of
 * them, so the first tests raced that and timed out under load. One real page load
 * per route type up front makes every test start from a warm server.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const path of ['/', '/tour/barcelona', '/tour/barcelona/1', '/tour/_fixture']) {
    await page.goto(baseURL + path, { waitUntil: 'networkidle', timeout: 90_000 });
  }
  await browser.close();
}
