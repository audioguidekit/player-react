# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General
- maintain `docs/DEVLOG.md` - after each successful large implementation, note what's been done, lessons learned, and what could be improved
- before starting work, always check `docs/DEVLOG.md` for additional context
- start dev server in the background and keep it running
- always test the new feature before you say it is done (`docs/TESTING.md`)

## Project Overview

Audio Tour Player is a mobile-first Progressive Web App for guided audio tours. Built with React 19, TypeScript, and Framer Motion. Features offline support via Service Worker, gesture-based navigation, and multi-language tours.

## Commands

```bash
bun run dev      # Start dev server (port 3000)
bun run build    # Production build
bun run preview  # Preview production build
bun run test     # Run Playwright tests (headless, fastest)
bun run test:headed  # Run tests with browser visible (for debugging)
```

Uses Bun as package manager (`bun.lock`).

## Testing

Run `bun run test` after each feature implementation. **An implementation is not complete until tests pass with zero console errors.**

See [docs/TESTING.md](docs/TESTING.md) for full guide on writing and debugging tests.

## Architecture

### State Management
- No external state library - uses React hooks strategically
- `App.tsx` is the central state hub (manages navigation, playback, sheet state)
- Context providers: RatingContext, ThemeProvider, TranslationProvider
- Ref-based state in audio player for performance

### Key Patterns

**Singleton Audio Element (Critical for iOS):**
The `useAudioPlayer` hook uses a singleton `HTMLAudioElement` that persists across re-renders. Recreating audio elements causes Safari crashes ("A problem repeatedly occurred"). Only change the `src` property, never recreate the element. See `hooks/useAudioPlayer.ts:38-65`.

**Data Loading:**
- `DataService` class with in-memory Map-based caching
- `useDataLoader` hooks provide reactive loading states
- Tour data in `/public/data/tours/*.json`, languages in `/public/data/languages.json`
- Changes to JSON files load on refresh without restart

**Stop Types (9 total):** audio, text, image-text, video, 3d-object, headline, quote, rating, email. Rendered by `components/feed/FeedItemRenderer.tsx`.

**Theming:**
- styled-components + twin.macro (bridges Tailwind with CSS-in-JS)
- Three built-in themes: default, modern, calm
- Theme configs in `src/theme/themes/`

**PWA/Offline:**
- Service Worker via Workbox (vite-plugin-pwa, injectManifest strategy)
- IndexedDB for progress persistence (`src/services/db.ts`)
- Cache strategies: CacheFirst for app shell, NetworkFirst for tour data

### Component Structure
```
App.tsx (global state)
├── screens/TourStart.tsx (landing)
├── screens/TourDetail.tsx (stop feed)
├── components/MainSheet.tsx (draggable bottom sheet, spring physics)
├── components/MiniPlayer.tsx (floating player with drag gestures)
├── components/feed/ (card components per stop type)
└── components/sheets/ (modals: Rating, Language, TourComplete)
```

### Routing
React Router v6 with URL structure:
- `/tour/:tourId` - Tour detail view
- `/tour/:tourId/stop/:stopId` - Stop detail view

## Key Files

- `App.tsx` - Master component, all navigation/playback state
- `hooks/useAudioPlayer.ts` - Audio playback (iOS-critical singleton pattern)
- `components/MiniPlayer.tsx` - Complex UI with gesture handling
- `components/MainSheet.tsx` - Core drag interaction handler
- `src/services/dataService.ts` - Data loading and caching
- `src/sw.ts` - Service Worker configuration

## Environment Variables

```
VITE_CLOUD_BASE_URL=https://your-supabase-url/storage/v1/object/public/
VITE_DEBUG_AUDIO=true  # Enable audio debug logs
```

## Multi-Language System

- 6 languages: en, cs, de, fr, it, es
- Per-language tour files: `/public/data/tours/{lang}.json`
- Auto-detects device language, remembers preference in localStorage
- Language files are TypeScript objects in `src/translations/locales/`

## Documentation

- `docs/DEVLOG.md` - Development log (check before starting work)
- `docs/TESTING.md` - Playwright testing guide
- `docs/PWA_ARCHITECTURE.md` - Complete PWA implementation guide
- `docs/ADDING_TOURS.md` - Guide for adding new tours
- `docs/THEMES.md` - Theming system documentation
- `docs/LANGUAGES.md` - Multi-language system
