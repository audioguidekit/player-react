import type { AppConfigFile } from '@audioguidekit/schema';

const setMeta = (selector: string, attribute: string, value?: string) => {
  if (!value) return;
  document.querySelector(selector)?.setAttribute(attribute, value);
};

/**
 * Apply the installed-app identity at runtime: what a compiled build bakes into
 * index.html. The web app manifest and icons are NOT handled here — the browser
 * reads those from the host (`/manifest.webmanifest`, `/icons/*`), which
 * generates them from `manifest.app` (see docs/manifest-mode.md).
 */
export function applyAppIdentity(app: AppConfigFile | undefined): void {
  if (typeof document === 'undefined' || !app) return;
  if (app.name) document.title = app.name;
  setMeta('meta[name="apple-mobile-web-app-title"]', 'content', app.shortName ?? app.name);
  setMeta('meta[name="description"]', 'content', app.description);
  // The first colour; the screens take over once they mount (StatusBarController).
  setMeta('meta[name="theme-color"]', 'content', app.themeColor);
}
