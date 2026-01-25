# Testing Guide

This project uses [Playwright](https://playwright.dev/) for end-to-end testing. Tests run against the actual app in a real browser, simulating user interactions.

## Quick Start

```bash
# Run all tests
bun run test

# Run tests with browser visible
bun run test:headed

# Open interactive UI mode
bun run test:ui

# Debug a specific test
bun run test:debug
```

## Test Commands

| Command | Description | When to use |
|---------|-------------|-------------|
| `bun run test` | Run all tests headless (no browser window) | Default - fastest, use for CI and regular runs |
| `bun run test:headed` | Run with browser window visible | Debugging - see what's happening |
| `bun run test:ui` | Open Playwright's interactive UI | Debugging - step through tests, time-travel |
| `bun run test:debug` | Run with Playwright Inspector | Debugging - inspect selectors, pause execution |

### Running Specific Tests

```bash
# Run a single test file
bun run test tests/app.spec.ts

# Run tests matching a name pattern
bun run test -g "should load"

# Run only on specific device
bun run test --project=chromium
bun run test --project="Mobile Chrome"
bun run test --project="Mobile Safari"
```

## Test Structure

Tests are located in `/tests/` directory:

```
tests/
├── app.spec.ts          # Core app functionality
├── tour-flow.spec.ts    # Tour navigation and flow
├── audio-player.spec.ts # Audio playback features
├── language.spec.ts     # Multi-language system
└── pwa.spec.ts          # PWA and offline features
```

## Test Files Explained

### `app.spec.ts` - Core App Tests

Tests fundamental app behavior and responsiveness.

| Test | What it verifies |
|------|------------------|
| `should load the app without errors` | App loads without console errors |
| `should display tour start screen` | Initial screen renders correctly |
| `should navigate to tour detail view` | URL routing works for `/tour/:id` |
| `should handle direct URL to stop` | Deep linking to `/tour/:id/stop/:stopId` works |
| `should render correctly on mobile viewport` | 375x667 (iPhone SE) renders properly |
| `should render correctly on tablet viewport` | 768x1024 (iPad) renders properly |

### `tour-flow.spec.ts` - Tour Flow Tests

Tests the user journey through a tour.

| Test | What it verifies |
|------|------------------|
| `should display tour information` | Tour content loads and displays |
| `should have clickable elements for starting tour` | Interactive elements are present |
| `should load tour data` | Tour JSON data loads successfully |
| `should maintain state during navigation` | Back/forward navigation preserves state |
| `should display stops when tour is loaded` | Stop feed renders with content |

### `audio-player.spec.ts` - Audio Tests

Tests audio playback infrastructure.

| Test | What it verifies |
|------|------------------|
| `should have audio elements available` | `HTMLAudioElement` API is available |
| `should handle audio context initialization` | `AudioContext` API is available |
| `should not crash on initial render` | Mini player renders without errors |
| `should have Media Session API available` | Browser supports media controls |

### `language.spec.ts` - Language Tests

Tests the multi-language system.

| Test | What it verifies |
|------|------------------|
| `should load language data` | `/data/languages.json` loads (200 status) |
| `should load English tour data by default` | Default tour JSON loads |
| `should have language configuration in local storage` | localStorage is accessible |
| `should load en/cs/de tour data` | Each language's tour file is valid JSON |

### `pwa.spec.ts` - PWA Tests

Tests Progressive Web App features.

| Test | What it verifies |
|------|------------------|
| `should have a valid manifest` | `<link rel="manifest">` exists in HTML |
| `should register service worker` | `navigator.serviceWorker` API available |
| `should have IndexedDB available` | `indexedDB` API available for offline storage |
| `should cache tour data for offline use` | `caches` API available |

## Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
// Key settings
{
  testDir: './tests',           // Test file location
  fullyParallel: true,          // Run tests in parallel
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',    // Capture trace on failure
    screenshot: 'only-on-failure',
  },

  // Auto-start dev server
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

### Device Profiles

Tests run on three device configurations:

| Project | Device | Viewport |
|---------|--------|----------|
| `chromium` | Desktop Chrome | 1280x720 |
| `Mobile Chrome` | Pixel 5 | 393x851 |
| `Mobile Safari` | iPhone 12 | 390x844 |

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  // Runs before each test in this describe block
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange: Set up test conditions
    await page.goto('/tour/barcelona');

    // Act: Perform actions
    await page.click('button[data-testid="play"]');

    // Assert: Verify results
    await expect(page.locator('.player')).toBeVisible();
  });
});
```

### Common Patterns

**Wait for network to settle:**
```typescript
await page.waitForLoadState('networkidle');
```

**Wait for element to appear:**
```typescript
await expect(page.locator('.my-element')).toBeVisible();
```

**Wait for specific time (use sparingly):**
```typescript
await page.waitForTimeout(2000);
```

**Check for text content:**
```typescript
await expect(page.locator('h1')).toContainText('Welcome');
```

**Intercept network requests:**
```typescript
const responsePromise = page.waitForResponse(
  response => response.url().includes('api/data')
);
await page.click('button');
const response = await responsePromise;
expect(response.status()).toBe(200);
```

**Execute JavaScript in browser:**
```typescript
const result = await page.evaluate(() => {
  return localStorage.getItem('key');
});
```

**Take screenshot on demand:**
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Selectors

Playwright supports multiple selector strategies:

```typescript
// By role (preferred for accessibility)
page.getByRole('button', { name: 'Play' })

// By test ID (add data-testid to components)
page.locator('[data-testid="mini-player"]')

// By CSS selector
page.locator('.play-button')

// By text content
page.getByText('Start Tour')
```

### Adding Test IDs to Components

For reliable test selection, add `data-testid` attributes:

```tsx
// In your React component
<button data-testid="play-button" onClick={handlePlay}>
  Play
</button>
```

Then in tests:
```typescript
await page.click('[data-testid="play-button"]');
```

## Test Reports

After running tests, Playwright generates an HTML report:

```bash
# View the report
bunx playwright show-report
```

Reports are saved to `/playwright-report/` (gitignored).

### CI Artifacts

In CI, failed tests generate:
- Screenshots in `/test-results/`
- Trace files for debugging
- HTML report

## Debugging Tests

### Using Playwright Inspector

```bash
bun run test:debug
```

This opens the Playwright Inspector where you can:
- Step through tests line by line
- See element selectors
- View console logs
- Inspect the page

### Using UI Mode

```bash
bun run test:ui
```

UI mode provides:
- Visual test runner
- Time-travel debugging
- Watch mode for development
- DOM snapshot at each step

### Console Logs

Add console logs to see what's happening:

```typescript
test('debug example', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('/');
  console.log('Current URL:', page.url());
});
```

## Best Practices

1. **No console errors before done** - An implementation is not complete until tests pass with zero console errors. The `app.spec.ts` test verifies this.

2. **Use `networkidle` wisely** - It waits for 500ms of no network activity. For faster tests, use specific waits.

3. **Prefer role selectors** - `getByRole()` is more resilient to UI changes and tests accessibility.

4. **Avoid hard-coded waits** - Use `expect().toBeVisible()` or `waitForResponse()` instead of `waitForTimeout()`.

5. **Keep tests independent** - Each test should work in isolation. Don't rely on state from previous tests.

6. **Test user journeys** - Focus on what users actually do, not implementation details.

7. **Add test IDs for complex selectors** - When CSS selectors become fragile, use `data-testid`.

## Troubleshooting

### Tests timeout waiting for dev server

The dev server has a 120-second timeout. If it takes longer:

```typescript
// In playwright.config.ts
webServer: {
  timeout: 180 * 1000,  // Increase to 3 minutes
}
```

### Tests pass locally but fail in CI

- Check viewport sizes - CI may use different defaults
- Check for race conditions - add explicit waits
- Review screenshots/traces from CI artifacts

### Element not found

1. Check if element is in viewport (may need scroll)
2. Check if element is inside an iframe
3. Verify the selector is correct using UI mode
4. Element may be lazy-loaded - add wait

### Service worker issues

Service workers can cache old content. In tests:

```typescript
// Clear service worker before test
await page.evaluate(async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
});
```
