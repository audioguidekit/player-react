# Development Log

## 2026-01-25: Language Button Position Fix

### What was done
- Fixed language button position in `TourStart.tsx` when rating button is hidden
- Added `margin-left: auto` to `LanguageButton` styled component
- The language button now stays on the right side regardless of `ratingAvailable` setting

### Why this matters
- When `ratingAvailable: false`, the rating button is not rendered
- Without the fix, `justify-between` caused the language button to move left
- Now the layout is consistent with or without the rating button

---

## 2026-01-25: Documentation Update for Language System

### What was done
- Updated `docs/LANGUAGES.md` to match current implementation:
  - Changed `languageNames` to `languageMetadata` (includes `name`, `flag`, `countryCode`)
  - Updated "Adding a New Language" section to reference `tourDiscovery.ts` instead of `languages.json`
  - Added `countryCode` to the `Language` interface documentation
  - Updated Quick Checklist and Example sections
- Updated `README.md` Language interface to include `countryCode`

### Why this matters
- The `country-flag-icons` package requires `countryCode` for SVG flag rendering
- The `languages.json` file is now legacy - languages are auto-discovered from tour files
- Documentation was outdated after tour discovery system was implemented

### Lessons Learned
- When changing core data structures, update documentation in all places (types.ts, docs/, README.md)
- Keep legacy files (like `languages.json`) but document that they're unused

---

## 2026-01-25: Migrate from Lucide to Phosphor Icons

### What was done
- Replaced all Lucide React icons with @phosphor-icons/react package
- Added country-flag-icons package for SVG-based language flags
- Fixed `getAllAvailableLanguages()` in `tourDiscovery.ts` to include `countryCode` property
- Updated all icon imports across components:
  - TourStart.tsx: ChatCircleDotsIcon, CaretDownIcon
  - MiniPlayer.tsx: SkipBackIcon, SkipForwardIcon, XIcon, ClosedCaptioningIcon
  - BottomSheet.tsx: XIcon
  - StartCard.tsx: ArrowLineUpIcon, ClockIcon, HeadphonesIcon, SparkleIcon, ArrowClockwiseIcon
  - TourHeaderAlt.tsx: HouseIcon
  - PlayPauseButton.tsx: PlayIcon, PauseIcon, CheckIcon
  - RatingCard.tsx: StarIcon, CheckCircleIcon
  - EmailCard.tsx: EnvelopeSimpleIcon
  - Sheet components: CheckIcon, StarIcon, CheckCircleIcon, AtIcon

### Why Phosphor icons
- Better icon quality and consistency
- More flexible weight options (thin, light, regular, bold, fill, duotone)
- Larger icon library with better semantic naming
- Works well with styled-components

### Bug Fixed: countryCode missing from Language type
- `getAllAvailableLanguages()` was returning only `code` and `name`
- The `Language` type requires `countryCode` for flag icon lookup
- Added `languageMetadata` object with name, flag emoji, and countryCode
- This fixed the "Element type is invalid" error in TourStart

### Lessons Learned
- When dynamically building Language objects, must include all required fields
- The `styled()` wrapper works directly with Phosphor icons
- Phosphor icons use the "Icon" suffix (e.g., `PlayIcon` not `Play`)

---

## 2025-01-25: Tour Discovery System & Configurable Default Language

### What was done
- Created `src/services/tourDiscovery.ts` - automatic tour discovery using Vite's `import.meta.glob`
- Tours are now indexed by their internal `language` field, not by filename
- Added `defaultLanguage` config in `src/config/languages.ts` for fallback behavior
- Updated `dataService.ts` to use the discovery system
- Updated `App.tsx` to use `tour?.language` for UI translations (ensures UI matches content)
- Fixed `de.json` which had incorrect `"language": "en"` → `"language": "de"`
- Updated tests in `language.spec.ts` to work with bundled approach
- Updated documentation in `CLAUDE.md` and `docs/LANGUAGES.md`

### How it works
1. At build time, `import.meta.glob` discovers all JSON files in `/public/data/tours/`
2. Each tour is indexed by `{tourId}:{languageCode}` from the JSON's `id` and `language` fields
3. `getTourWithFallback()` tries preferred language, then `defaultLanguage`, then first available
4. Developers configure `defaultLanguage` in `src/config/languages.ts`

### Benefits
- Filename no longer matters - language is determined by JSON content
- Supports future folder-based organization (`/tours/barcelona/en.json`)
- Single config point for fallback behavior
- No runtime fetch for `languages.json` - languages discovered from tour files

### Lessons Learned
- `import.meta.glob` with `eager: true` bundles files at build time (no runtime fetch)
- Keep fallback language configurable, not hardcoded
- UI language should follow tour's `language` field for consistency

---

## 2026-01-25: Configurable UI Languages for Bundle Size Optimization

### What was done
- Created `src/config/languages.ts` - central config file for selecting which UI languages to bundle
- Refactored `src/translations/index.tsx` to use the config instead of importing all languages directly
- Added `SupportedLanguageCode` type that's automatically derived from the config
- Added `isLanguageSupported()` helper function for runtime language validation
- Implemented graceful fallback: if tour language doesn't have UI translation, falls back to English silently
- Updated `docs/LANGUAGES.md` with new "Configuring UI Languages" section
- Updated `CLAUDE.md` to reference the new config file

### How it works
1. Developer edits `src/config/languages.ts` - comments/uncomments imports and object entries
2. Vite's tree-shaking removes unused language files from the bundle
3. At runtime, `isLanguageSupported()` checks if a language is available
4. If tour is in unsupported UI language, the provider falls back to English automatically

### Bundle size impact
- All 6 languages: ~1,734 KB
- English only: ~1,726 KB (~8 KB savings)
- Savings grow as translation files expand with more strings

### Lessons Learned
- Use TypeScript's `satisfies` keyword to maintain type safety while allowing partial records
- Graceful fallback at the provider level ensures no errors shown to users
- Keep tour content languages (JSON files) separate from UI languages (TypeScript)

---

## 2026-01-25: Optional Rating Feature

### What was done
- Added `ratingAvailable` property to `TourData` interface in `types.ts`
- Modified `TourStart.tsx` to conditionally show the rating button based on `tour.ratingAvailable !== false`
- Updated `TourCompleteSheet.tsx` to:
  - Accept `ratingAvailable` prop
  - Hide "Rate this tour" / "Skip rating" buttons when rating is disabled
  - Show a simple "Done" button instead
  - Fixed prop name mismatch (`onRateTour` → `onRate`) to match App.tsx usage
- Added `done` translation to all 6 locale files (en, cs, de, fr, it, es)
- Added `ratingAvailable: true` to tour JSON files (en, cs, de)

### How it works
- `ratingAvailable: true` (default): Rating button visible on main screen, rate option in tour complete sheet
- `ratingAvailable: false`: Rating button hidden, tour complete shows only "Done" button
- Important: The `type: "rating"` stop in the stops array works independently - it's part of tour content

### Lessons Learned
- Default to `!== false` pattern for optional boolean props to maintain backward compatibility
- When adding translations, must update both the types file and all locale files

---

## 2026-01-25: Playwright Testing Setup

### What was done
- Installed Playwright testing framework (`@playwright/test`)
- Installed Chromium browser for testing
- Created `playwright.config.ts` with:
  - Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12) configurations
  - Auto-start dev server during tests
  - Screenshot on failure, trace on retry
- Created test files in `/tests/`:
  - `app.spec.ts` - Basic app loading and responsive design tests
  - `tour-flow.spec.ts` - Tour start and navigation tests
  - `audio-player.spec.ts` - Audio player and mini player tests
  - `language.spec.ts` - Multi-language system tests
  - `pwa.spec.ts` - PWA and offline capability tests
- Added npm scripts:
  - `bun test` - Run all tests
  - `bun test:ui` - Open Playwright UI
  - `bun test:headed` - Run tests with browser visible
  - `bun test:debug` - Debug mode

### Lessons Learned
- Playwright auto-manages dev server via `webServer` config
- Mobile testing requires specific device profiles from Playwright
- Service worker tests need careful handling due to caching

### Test Results
- **25 tests passed** across 5 test files
- Test run time: ~1.3 minutes (includes dev server startup)

### Documentation
- Created `/docs/TESTING.md` with full guide on running, writing, and debugging tests

### What Could Be Improved
- Add more specific UI interaction tests once app flow is established
- Add visual regression tests with `toHaveScreenshot()`
- Add performance tests for audio loading
- Consider adding accessibility tests
