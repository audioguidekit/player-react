# Testing

End-to-end tests use [Playwright](https://playwright.dev/) against the live dev server.

## Commands

| Command | Description |
|---------|-------------|
| `bun run test` | Run all tests headless |
| `bun run test:headed` | Run with browser visible |
| `bun run test:ui` | Interactive UI mode (time-travel debugging) |
| `bun run test:debug` | Playwright Inspector |

```bash
# Run a single file
bun run test tests/app.spec.ts

# Filter by name
bun run test -g "should load"

# Single device
bun run test --project=chromium
bun run test --project="Mobile Chrome"
bun run test --project="Mobile Safari"
```

## Test files

```
tests/
├── helpers.ts                    # getTourId, discoverTourLanguages, waitForAppLoad
├── app.spec.ts                   # Core app load, routing, responsive viewports
├── tour-flow.spec.ts             # Tour navigation and stop feed
├── audio-player.spec.ts          # Audio/Media API availability
├── language.spec.ts              # Multi-language system
├── pwa.spec.ts                   # PWA manifest, service worker, IndexedDB
├── stop-card-display.spec.ts     # All 8 showStopImage/Duration/Number combinations
├── button-origin.spec.ts         # Button transform-origin consistency
├── lightbox-backdrop-blur.spec.ts # Image lightbox backdrop blur
└── lightbox-zoom.spec.ts         # Image lightbox double-tap zoom
```

> Tests are generic — they use `helpers.ts` to discover tour IDs and languages at runtime rather than hardcoding values.

## Configuration

Key settings in `playwright.config.ts`:

```typescript
{
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

Device profiles: **Chromium** (1280×720), **Mobile Chrome** (Pixel 5, 393×851), **Mobile Safari** (iPhone 12, 390×844).

## Writing tests

```typescript
import { test, expect } from '@playwright/test';
import { getTourId } from './helpers';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page, request }) => {
    const tourId = await getTourId(request);
    await page.goto(`/tour/${tourId}`);
    await page.click('button[data-testid="play"]');
    await expect(page.locator('.player')).toBeVisible();
  });
});
```

### Helpers

```typescript
import { getTourId, discoverTourLanguages, waitForAppLoad } from './helpers';

const tourId = await getTourId(request);
const languages = await discoverTourLanguages(request);
await waitForAppLoad(page);
```

### Preferred selector strategies

```typescript
page.getByRole('button', { name: 'Play' })      // Role (preferred)
page.locator('[data-testid="mini-player"]')       // Test ID
page.getByText('Start Tour')                      // Text
```

Add `data-testid` to components when CSS selectors become fragile.

## Best practices

- An implementation is not complete until `bun run test` passes with zero console errors
- Use `expect().toBeVisible()` instead of `waitForTimeout()`
- Keep tests independent — no state shared between tests
- Test user journeys, not implementation details

## Reports

```bash
bunx playwright show-report
```

Reports save to `/playwright-report/` (gitignored). CI artifacts include screenshots, traces, and the HTML report in `/test-results/`.
