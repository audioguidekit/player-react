# Implementation Plan: React Codebase Improvements

This plan outlines 5 critical improvements to enhance performance, maintainability, and stability of the React audio tour application.

## Overview

1. **Step 1**: Add React.memo to prevent unnecessary re-renders (Performance)
2. **Step 2**: Split monolithic App.tsx into smaller components/hooks (Architecture)
3. **Step 3**: Replace console statements with structured logging + Sentry (Production)
4. **Step 4**: Add testing infrastructure (Quality)
5. **Step 5**: Consolidate state management with useReducer (State)

**Total Estimated Time**: 10-15 days
**Risk Level**: Medium (careful refactoring with testing after each step)

---

## Step 1: Add React.memo to Prevent Unnecessary Re-renders ✅ COMPLETED

### Objective
Wrap frequently re-rendering components with React.memo to improve performance, especially on mobile devices.

### Status: ✅ COMPLETED
All components have been wrapped with React.memo and all callbacks in App.tsx have been memoized with useCallback. Runtime error (initialization order) was fixed.

### Files to Modify

#### 1.1 Wrap `MiniPlayer` component
**File**: `components/MiniPlayer.tsx` (line ~180)

**Current**:
```typescript
export const MiniPlayer: React.FC<MiniPlayerProps> = ({ ... }) => { ... }
```

**Change to**:
```typescript
export const MiniPlayer = React.memo<MiniPlayerProps>(({ ... }) => { ... }, (prevProps, nextProps) => {
  // Custom comparison: only re-render if relevant props change
  return (
    prevProps.currentStop?.id === nextProps.currentStop?.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.progress === nextProps.progress &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isCompleting === nextProps.isCompleting &&
    prevProps.isTransitioning === nextProps.isTransitioning &&
    prevProps.canGoNext === nextProps.canGoNext &&
    prevProps.canGoPrev === nextProps.canGoPrev &&
    prevProps.isTranscriptionExpanded === nextProps.isTranscriptionExpanded
  );
});
```

**Why**: `MiniPlayer` receives 15+ props and re-renders on every App.tsx state change. Custom comparison prevents re-renders when only irrelevant props change.

#### 1.2 Wrap `TourDetail` component
**File**: `screens/TourDetail.tsx` (line ~38)

**Current**:
```typescript
export const TourDetail: React.FC<TourDetailProps> = ({ ... }) => { ... }
```

**Change to**:
```typescript
export const TourDetail = React.memo<TourDetailProps>(({ ... }) => { ... }, (prevProps, nextProps) => {
  return (
    prevProps.tour?.id === nextProps.tour?.id &&
    prevProps.currentStopId === nextProps.currentStopId &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.tourProgress === nextProps.tourProgress &&
    prevProps.consumedMinutes === nextProps.consumedMinutes &&
    prevProps.totalMinutes === nextProps.totalMinutes &&
    prevProps.completedStopsCount === nextProps.completedStopsCount &&
    prevProps.scrollToStopId === nextProps.scrollToStopId &&
    prevProps.scrollTrigger === nextProps.scrollTrigger
  );
});
```

#### 1.3 Wrap `MainSheet` component
**File**: `components/MainSheet.tsx` (line ~45)

**Change to**:
```typescript
export const MainSheet = React.memo<MainSheetProps>(({ ... }) => { ... }, (prevProps, nextProps) => {
  return prevProps.isExpanded === nextProps.isExpanded;
});
```

#### 1.4 Wrap `StartCard` component
**File**: `components/StartCard.tsx` (line ~132)

**Change to**:
```typescript
export const StartCard = React.memo<StartCardProps>(({ ... }) => { ... }, (prevProps, nextProps) => {
  return (
    prevProps.tour?.id === nextProps.tour?.id &&
    prevProps.hasStarted === nextProps.hasStarted &&
    prevProps.isDownloading === nextProps.isDownloading &&
    prevProps.isDownloaded === nextProps.isDownloaded &&
    prevProps.downloadProgress === nextProps.downloadProgress &&
    prevProps.tourProgress === nextProps.tourProgress
  );
});
```

#### 1.5 Wrap Feed Card Components
**Files to modify**:
- `components/feed/AudioStopCardCompact.tsx` (already has `memo` import but not used - line ~1)
- `components/feed/AudioStopCard.tsx` (already uses memo - verify it's working)
- `components/feed/EmailCard.tsx`
- `components/feed/RatingCard.tsx`
- `components/feed/TextCard.tsx`
- `components/feed/ImageTextCard.tsx`
- `components/feed/HeadlineCard.tsx`
- `components/feed/QuoteCard.tsx`
- `components/feed/ThreeDObjectCard.tsx`
- `components/feed/VideoCard.tsx`

**Pattern** for each:
```typescript
export const ComponentName = React.memo<ComponentNameProps>(({ item, ... }) => { ... });
```

#### 1.6 Wrap Sheet Components
**Files**:
- `components/sheets/RatingSheet.tsx` (line ~150)
- `components/sheets/LanguageSheet.tsx` (line ~69)
- `components/sheets/TourCompleteSheet.tsx` (line ~51)

**Pattern**:
```typescript
export const SheetName = React.memo<SheetNameProps>(({ isOpen, ... }) => { ... });
```

#### 1.7 Wrap Player Sub-components
**Files**:
- `components/player/PlayPauseButton.tsx` (line ~78)
- `components/player/SkipButton.tsx`
- `components/player/ProgressRing.tsx`

#### 1.8 Add useCallback to App.tsx callbacks
**File**: `App.tsx`

Wrap all callback handlers with `useCallback` to maintain referential equality:
- Lines 687-710: `handleStartTour` → useCallback
- Lines 712-714: `handleBackToStart` → useCallback
- Lines 716-734: `handleResetTour` → useCallback
- Lines 738-758: `handleLanguageChange` → useCallback
- Lines 760-763: `handleRatingSubmit` → useCallback
- Lines 329-341: `handleAudioProgress` (already has useCallback - verify)
- Lines 343-356: `handleAudioEnded` (already has useCallback - verify)
- Lines 359-362: `handlePlayBlocked` (already has useCallback - verify)

### Testing Strategy
1. Run app in dev mode with React DevTools Profiler
2. Record a session while using the app
3. Verify re-render count decreases after wrapping components
4. Test all functionality manually:
   - Audio playback
   - Navigation between stops
   - Mini player expand/collapse
   - Sheet open/close
   - Progress tracking
5. Check for any visual bugs or broken interactions

### Rollback Plan
If issues occur, remove React.memo wrappers one by one until stable.

### Completion Summary ✅

**Completed Components** (all wrapped with React.memo):
- ✅ 1.1 MiniPlayer - wrapped with custom comparison function
- ✅ 1.2 TourDetail - wrapped with custom comparison function
- ✅ 1.3 MainSheet - wrapped with custom comparison function
- ✅ 1.4 StartCard - wrapped with custom comparison function
- ✅ 1.5 Feed Card Components - all wrapped:
  - ✅ AudioStopCardCompact (already had memo)
  - ✅ AudioStopCard (already had memo)
  - ✅ EmailCard
  - ✅ RatingCard
  - ✅ TextCard (already had memo)
  - ✅ ImageTextCard (already had memo)
  - ✅ HeadlineCard (already had memo)
  - ✅ QuoteCard (already had memo)
  - ✅ ThreeDObjectCard
  - ✅ VideoCard (already had memo)
- ✅ 1.6 Sheet Components - all wrapped:
  - ✅ RatingSheet
  - ✅ LanguageSheet
  - ✅ TourCompleteSheet
- ✅ 1.7 Player Sub-components - all wrapped:
  - ✅ PlayPauseButton
  - ✅ SkipButton
  - ✅ ProgressRing
- ✅ 1.8 App.tsx callbacks - all memoized with useCallback (20 instances):
  - ✅ handleTrackChange
  - ✅ handleStartTour
  - ✅ handleBackToStart
  - ✅ handleResetTour
  - ✅ handleLanguageChange
  - ✅ handleRatingSubmit
  - ✅ handleOpenRating
  - ✅ handleOpenLanguage
  - ✅ handleScrollComplete
  - ✅ handleMiniPlayerClick
  - ✅ handleRewind
  - ✅ handleForward
  - ✅ handleRateTour
  - ✅ handleDownloadComplete
  - ✅ handleAudioProgress (already had)
  - ✅ handleAudioEnded (already had)
  - ✅ handlePlayBlocked (already had)

**Additional Fixes**:
- ✅ Fixed initialization order error (setScrollToStopId used before declaration)
- ✅ Removed duplicate resume tracking refs declarations
- ✅ All components use proper custom comparison functions where needed

**Status**: Step 1 is complete and tested. App runs without errors. Ready to proceed to Step 2.

---

## Step 2: Split Monolithic App.tsx into Smaller Components/Hooks

### Objective
Extract logic from 973-line App.tsx into focused hooks and components to improve maintainability.

### New Files to Create

#### 2.1 Create `hooks/useMediaSession.ts`
**Extract from**: `App.tsx` lines 400-668

**Content**: All Media Session API logic:
- Media metadata updates (lines 400-461)
- Playback state sync (lines 463-468)
- Visibility change handler (lines 470-501)
- Periodic metadata refresh (lines 503-531)
- Action handlers setup (lines 533-600)
- Position state updates (lines 602-668)

**Dependencies**: Requires audioPlayer, tour, currentAudioStop, isPlaying, isTransitioning from App.tsx

**Interface**:
```typescript
export interface UseMediaSessionProps {
  audioPlayer: UseAudioPlayerReturn;
  tour: TourData | null;
  currentAudioStop: AudioStop | undefined;
  isPlaying: boolean;
  isTransitioning: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  handleNextStop: () => void;
  handlePrevStop: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useMediaSession = (props: UseMediaSessionProps) => {
  // All Media Session logic here
};
```

**Update App.tsx**: Replace lines 400-668 with:
```typescript
useMediaSession({
  audioPlayer,
  tour,
  currentAudioStop,
  isPlaying,
  isTransitioning,
  canGoNext,
  canGoPrev,
  handleNextStop,
  handlePrevStop,
  setIsPlaying,
});
```

#### 2.2 Create `hooks/useLanguageSelection.ts`
**Extract from**: `App.tsx` lines 66-104

**Content**: Language detection and selection logic

**Interface**:
```typescript
export interface UseLanguageSelectionProps {
  languages: Language[] | null;
  selectedLanguage: Language | null;
  setSelectedLanguage: (lang: Language) => void;
}

export const useLanguageSelection = (props: UseLanguageSelectionProps) => {
  // Language selection logic
  // Returns: selectedLanguage, setSelectedLanguage
};
```

#### 2.3 Create `hooks/useAssetPreloader.ts`
**Extract from**: `App.tsx` lines 180-236

**Content**: Eager asset preloading logic

**Interface**:
```typescript
export interface UseAssetPreloaderProps {
  tour: TourData | null;
}

export const useAssetPreloader = (props: UseAssetPreloaderProps) => {
  const [assetsReady, setAssetsReady] = useState(false);
  // Preloading logic
  return { assetsReady };
};
```

#### 2.4 Create `hooks/useDeepLink.ts`
**Extract from**: `App.tsx` lines 238-292

**Content**: Deep link handling logic

**Interface**:
```typescript
export interface UseDeepLinkProps {
  urlStopId: string | undefined;
  tour: TourData | null;
  currentStopId: string | null;
  setCurrentStopId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMiniPlayerExpanded: (expanded: boolean) => void;
  setAllowAutoPlay: (allow: boolean) => void;
  setScrollToStopId: (id: { id: string; timestamp: number } | null) => void;
  progressTracking: ReturnType<typeof useProgressTracking>;
  resumeStopIdRef: React.MutableRefObject<string | null>;
  resumePositionRef: React.MutableRefObject<number>;
  pendingSeekRef: React.MutableRefObject<number | null>;
}

export const useDeepLink = (props: UseDeepLinkProps) => {
  // Deep link logic
};
```

#### 2.5 Create `hooks/useAutoResume.ts`
**Extract from**: `App.tsx` lines 294-313

**Content**: Auto-resume detection logic

**Interface**:
```typescript
export interface UseAutoResumeProps {
  tour: TourData | null;
  currentStopId: string | null;
  urlStopId: string | undefined;
  progressTracking: ReturnType<typeof useProgressTracking>;
  resumeStopIdRef: React.MutableRefObject<string | null>;
  resumePositionRef: React.MutableRefObject<number>;
}

export const useAutoResume = (props: UseAutoResumeProps) => {
  // Auto-resume logic
};
```

#### 2.6 Create `components/MediaSessionProvider.tsx`
**Extract from**: `App.tsx` lines 400-668

**Alternative approach**: Wrap Media Session in a Provider component instead of hook

**Consideration**: If Media Session needs to be available to multiple components, use Provider pattern. Otherwise, hook is sufficient.

#### 2.7 Create `components/TourProgressTracker.tsx`
**Extract from**: `App.tsx` lines 773-810

**Content**: Progress calculation and tour completion check

**Interface**:
```typescript
interface TourProgressTrackerProps {
  tour: TourData | null;
  currentStopId: string | null;
  audioPlayerProgress: number;
  progressTracking: ReturnType<typeof useProgressTracking>;
  onTourComplete: () => void;
}

export const TourProgressTracker: React.FC<TourProgressTrackerProps> = ({ ... }) => {
  // Progress tracking logic
  return null; // Renders nothing, just manages side effects
};
```

### App.tsx Refactoring

**Target**: Reduce from ~973 lines to ~300-400 lines

**Structure after refactoring**:
```typescript
const App: React.FC = () => {
  // 1. Route params
  const { tourId, stopId: urlStopId } = useParams();
  const navigate = useNavigate();

  // 2. Data loading
  const { data: languages, loading: languagesLoading, error: languagesError } = useLanguages();
  const { selectedLanguage, setSelectedLanguage } = useLanguageSelection({ languages });
  const { data: tour, loading: tourLoading, error: tourError } = useTourData(selectedLanguage?.code);

  // 3. Navigation state (already extracted)
  const tourNavigation = useTourNavigation({ tour, allowAutoPlay });

  // 4. Asset preloading
  const { assetsReady } = useAssetPreloader({ tour });

  // 5. Deep link handling
  useDeepLink({ urlStopId, tour, ...tourNavigation, ... });

  // 6. Auto-resume
  useAutoResume({ tour, ...tourNavigation, ... });

  // 7. Audio player
  const audioPlayer = useAudioPlayer({ ... });

  // 8. Media Session
  useMediaSession({ audioPlayer, tour, ...tourNavigation });

  // 9. Progress tracking
  const progressTracking = useProgressTracking(tour?.id || DEFAULT_TOUR_ID);
  const tourProgress = useMemo(() => {
    // Progress calculation
  }, [...]);
  
  // 10. Tour completion check
  <TourProgressTracker tour={tour} ... onTourComplete={() => setActiveSheet('TOUR_COMPLETE')} />

  // 11. Render
  return ( ... );
};
```

### Testing Strategy
1. Create a test branch: `git checkout -b refactor/app-split`
2. Extract one hook at a time (start with smallest)
3. After each extraction:
   - Run dev server: `npm run dev`
   - Test all functionality manually
   - Check for TypeScript errors: `npm run build`
   - Verify no console errors
4. Test order:
   - useLanguageSelection (easiest, no dependencies)
   - useAssetPreloader
   - useDeepLink
   - useAutoResume
   - useMediaSession (most complex, do last)
5. Integration test:
   - Complete tour flow
   - Audio playback
   - Navigation
   - Progress tracking
   - Deep links
   - Language switching

### Rollback Plan
Each hook should be independent. If one fails, revert that specific hook extraction while keeping others.

---

## Step 3: Replace Console Statements with Structured Logging + Sentry

### Objective
Replace 132+ console.log/warn/error calls with structured logging utility and integrate Sentry for production error tracking.

### New Files to Create

#### 3.1 Create `src/utils/logger.ts`
**Purpose**: Centralized logging utility

**Content**:
```typescript
import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    // In production, send to Sentry as warning
    if (this.isProduction && Sentry.getCurrentHub().getClient()) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  error(error: Error | string, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    // Always log to console in dev
    if (this.isDev) {
      console.error(`[ERROR] ${errorMessage}`, context || '', error instanceof Error ? error : '');
    }

    // Send to Sentry in production
    if (this.isProduction && Sentry.getCurrentHub().getClient()) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: context,
        });
      } else {
        Sentry.captureMessage(errorMessage, {
          level: 'error',
          extra: context,
        });
      }
    }
  }

  // Audio-specific logging (with conditional debug flag)
  audioDebug(message: string, context?: LogContext): void {
    const debugAudio = import.meta.env.VITE_DEBUG_AUDIO === 'true' || this.isDev;
    if (debugAudio) {
      console.log(`[AUDIO] ${message}`, context || '');
    }
  }

  // Service Worker specific logging
  swDebug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[SW] ${message}`, context || '');
    }
  }
}

export const logger = new Logger();
```

#### 3.2 Create `src/utils/sentry.ts`
**Purpose**: Sentry initialization and configuration

**Content**:
```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE; // 'development' | 'production'

  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      new BrowserTracing({
        // Trace propagation for audio playback
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.example\.com/],
      }),
    ],
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        // Don't send audio autoplay errors (user interaction required)
        if (error instanceof Error && error.name === 'NotAllowedError' && error.message.includes('play')) {
          return null;
        }
      }
      return event;
    },
    ignoreErrors: [
      // Known browser extension errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
};
```

#### 3.3 Update `index.tsx`
**File**: `index.tsx`

**Add at top** (after imports, before ReactDOM.createRoot):
```typescript
import { initSentry } from './src/utils/sentry';
import { ErrorBoundary } from '@sentry/react';

// Initialize Sentry before React app
initSentry();

// ... existing code ...

// Wrap app with Sentry ErrorBoundary
root.render(
  <React.StrictMode>
    <ErrorBoundary fallback={({ error }) => <ErrorScreen error={error} />} showDialog>
      <ErrorBoundary fallback={({ error }) => <div>Something went wrong</div>}>
        {/* Existing app structure */}
      </ErrorBoundary>
    </ErrorBoundary>
  </React.StrictMode>
);
```

#### 3.4 Update `components/ErrorBoundary.tsx`
**File**: `components/ErrorBoundary.tsx` (line 28-30)

**Replace**:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  this.props.onError?.(error, errorInfo);
}
```

**With**:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  import('../src/utils/logger').then(({ logger }) => {
    logger.error(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  });
  this.props.onError?.(error, errorInfo);
}
```

### Files to Update (Replace console.* with logger.*)

#### 3.5 App.tsx
**Replace all console statements** (30 instances):
- Line 87: `console.log('[LANGUAGE] ...')` → `logger.info('...')`
- Line 188: `console.log('[EAGER] ...')` → `logger.debug('...')`
- Line 196: `console.error('[EAGER] ...')` → `logger.error(...)`
- Line 201-203: `console.log('[EAGER] ...')` → `logger.debug('...')`
- Line 206: `console.log('[EAGER] ...')` → `logger.debug('...')`
- Line 219: `console.warn('[EAGER] ...')` → `logger.warn('...')`
- Line 225-229: `console.log/error('[EAGER] ...')` → `logger.debug/error('...')`
- Line 251: `console.warn('[DEEP_LINK] ...')` → `logger.warn('...')`
- Line 257: `console.warn('[DEEP_LINK] ...')` → `logger.warn('...')`
- Line 262-276: `console.log('[DEEP_LINK] ...')` → `logger.info('...')`
- Line 285: `console.log('[DEEP_LINK] ...')` → `logger.debug('...')`
- Line 307: `console.log('[RESUME] ...')` → `logger.debug('...')`
- Line 360: `console.warn('[Audio] ...')` → `logger.warn('...')`
- Line 427: `console.log('[MediaSession] ...')` → `logger.debug('...')`
- Line 460: `console.log('[MediaSession] ...')` → `logger.debug('...')`
- Line 495: `console.log('[MediaSession] ...')` → `logger.debug('...')`
- Line 527: `console.log('[MediaSession] ...')` → `logger.debug('...')`
- Line 558: `console.log('[MediaSession] ...')` → `logger.debug('...')`
- Line 634: `console.log('[MediaSession] ...')` → `logger.debug('...')`
- Line 655: `console.warn('[MediaSession] ...')` → `logger.warn('...')`
- Line 673-676: `console.error('[GLOBAL ERROR] ...')` → `logger.error(...)`
- Line 706: `console.log('[RESUME] ...')` → `logger.debug('...')`
- Line 749: `console.log('[LANGUAGE_CHANGE] ...')` → `logger.info('...')`
- Line 761: `console.log('Rated: ...')` → `logger.info('...')`
- Line 386: `console.log('[RESUME] ...')` → `logger.debug('...')`
- Line 277: `console.error('❌ Auto-play failed: ...')` → `logger.error(...)`
- Line 283: `console.error('❌ Auto-play failed after canplay: ...')` → `logger.error(...)`
- Line 315: `console.error('❌ Play failed: ...')` → `logger.error(...)`
- Line 322: `console.error('❌ Play failed after canplay: ...')` → `logger.error(...)`

#### 3.6 hooks/useAudioPlayer.ts
**Replace all console statements** with `logger.audioDebug()`:
- Lines 8-17: Replace `debugLog` function with `logger.audioDebug()`
- Lines 174-176: `console.error('❌ Audio loading error: ...')` → `logger.error(...)`
- Line 277: `console.error('❌ Auto-play failed: ...')` → `logger.error(...)`
- Line 283: `console.error('❌ Auto-play failed after canplay: ...')` → `logger.error(...)`
- Line 314: `console.error('❌ Play failed: ...')` → `logger.error(...)`
- Line 321: `console.error('❌ Play failed after canplay: ...')` → `logger.error(...)`

#### 3.7 hooks/useAudioPreloader.ts
**Replace** (3 instances):
- Lines 10-14: Replace `debugLog` with `logger.debug()`
- Lines 16-34: Replace `checkPerformance` console statements with `logger.warn()`

#### 3.8 hooks/useDownloadManager.ts
**Replace** (12 instances):
- All `console.log/warn/error` → appropriate `logger.*` method

#### 3.9 hooks/useProgressTracking.ts
**Replace** (2 instances):
- Lines 55, 64: `console.error(...)` → `logger.error(...)`

#### 3.10 hooks/useTourNavigation.ts
**Replace** (1 instance):
- Check for any console statements and replace

#### 3.11 src/services/storageService.ts
**Replace** (3 instances):
- Lines 37, 180, 199: `console.error(...)` → `logger.error(...)`

#### 3.12 context/RatingContext.tsx
**Replace** (2 instances):
- Lines 45, 59: `console.warn/log(...)` → `logger.warn/info(...)`

#### 3.13 src/services/dataService.ts
**Check and replace** all console statements

#### 3.14 components/feed/EmailCard.tsx
**Check and replace** console statements

#### 3.15 src/sw.ts
**Replace** (21 instances):
- All `console.log` with `logger.swDebug()`
- All `console.error` with `logger.error()`

#### 3.16 src/utils/swManager.ts
**Replace** (9 instances):
- All console statements with appropriate logger methods

#### 3.17 index.html
**Update** (31 instances):
- Replace inline console statements with logger calls
- Note: These are in script tags, may need to import logger dynamically

### Package.json Updates

#### 3.18 Install Sentry packages
```bash
npm install @sentry/react @sentry/tracing
npm install --save-dev @sentry/vite-plugin
```

**Update package.json**:
```json
{
  "dependencies": {
    "@sentry/react": "^7.80.0",
    "@sentry/tracing": "^7.80.0"
  },
  "devDependencies": {
    "@sentry/vite-plugin": "^2.0.0"
  }
}
```

#### 3.19 Update vite.config.ts
**File**: `vite.config.ts`

**Add**:
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  // ... existing code ...
  
  return {
    // ... existing config ...
    plugins: [
      // ... existing plugins ...
      ...(mode === 'production' ? [
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        })
      ] : []),
    ],
  };
});
```

#### 3.20 Environment Variables
**Create `.env.example`**:
```bash
VITE_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

**Update `.gitignore`** to ensure `.env` is ignored (likely already is)

### Testing Strategy
1. Test in dev mode: Verify all logs appear in console
2. Test in production build: `npm run build && npm run preview`
3. Verify Sentry integration:
   - Set `VITE_SENTRY_DSN` in `.env`
   - Trigger test error
   - Check Sentry dashboard for error
4. Test error boundary:
   - Force an error in a component
   - Verify error is logged to Sentry
5. Verify no console errors in production build

### Rollback Plan
If Sentry causes issues:
1. Set `VITE_SENTRY_DSN` to empty string (disables Sentry)
2. Logger will still work, just won't send to Sentry
3. Can revert logger.ts to use console.* directly

---

## Step 4: Add Testing Infrastructure

### Objective
Add comprehensive testing infrastructure with Vitest and React Testing Library.

### Package.json Updates

#### 4.1 Install Testing Dependencies
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @testing-library/jest-matchers
```

**Update package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^23.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### New Files to Create

#### 4.2 Create `vitest.config.ts`
**Content**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

#### 4.3 Create `src/test/setup.ts`
**Content**:
```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLAudioElement
global.HTMLAudioElement = class HTMLAudioElement extends EventTarget {
  src = '';
  currentTime = 0;
  duration = 0;
  paused = true;
  volume = 1;
  muted = false;
  readyState = 0;
  networkState = 0;
  
  play() { return Promise.resolve(); }
  pause() { return undefined; }
  load() { return undefined; }
  
  // Event handlers
  onload = null;
  onerror = null;
  oncanplay = null;
  oncanplaythrough = null;
  ontimeupdate = null;
  onended = null;
  onplay = null;
  onpause = null;
  onstalled = null;
  onwaiting = null;
} as any;

// Mock MediaSession API
global.navigator.mediaSession = {
  metadata: null,
  playbackState: 'none',
  setActionHandler: vi.fn(),
  setPositionState: vi.fn(),
} as any;
```

#### 4.4 Create `src/test/utils.tsx`
**Content**: Test utilities and helpers

```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { TranslationProvider } from '../translations';
import { RatingProvider } from '../../context/RatingContext';
import { BrowserRouter } from 'react-router-dom';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider themeId="default">
        <TranslationProvider language="en">
          <RatingProvider>
            {children}
          </RatingProvider>
        </TranslationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Test Files to Create

#### 4.5 Create `hooks/__tests__/useAudioPlayer.test.ts`
**Priority**: High (critical functionality)

**Test cases**:
- Audio element creation and management
- Play/pause functionality
- Seek functionality
- Skip forward/backward
- Progress tracking
- Error handling
- Event listener cleanup

#### 4.6 Create `hooks/__tests__/useProgressTracking.test.ts`
**Priority**: High (data persistence)

**Test cases**:
- Progress saving to localStorage
- Progress loading from localStorage
- Mark stop as completed
- Update stop position
- Calculate overall progress
- Reset progress

#### 4.7 Create `hooks/__tests__/useTourNavigation.test.ts`
**Priority**: Medium

**Test cases**:
- Navigation between stops
- Next/previous stop handling
- Auto-play behavior
- Track transition handling
- Completion animation

#### 4.8 Create `hooks/__tests__/useDataLoader.test.ts`
**Priority**: Medium

**Test cases**:
- Tour data loading
- Language loading
- Error handling
- Loading states
- Cancellation on unmount

#### 4.9 Create `src/services/__tests__/storageService.test.ts`
**Priority**: High (localStorage/IndexedDB)

**Test cases**:
- Preferences storage
- Tour rating storage
- Progress persistence (IndexedDB)
- Downloaded tours management
- Error handling for quota exceeded

#### 4.10 Create `components/__tests__/ErrorBoundary.test.tsx`
**Priority**: Medium

**Test cases**:
- Error catching
- Fallback UI rendering
- Error callback execution
- Custom fallback prop

#### 4.11 Create `components/__tests__/MiniPlayer.test.tsx`
**Priority**: Medium

**Test cases**:
- Rendering with props
- Play/pause button interaction
- Progress display
- Expand/collapse functionality
- Transcription toggle

#### 4.12 Create `components/__tests__/StartCard.test.tsx`
**Priority**: Low (UI component)

**Test cases**:
- Rendering with tour data
- Download button interaction
- Progress reset button
- Button states (downloading, downloaded)

### Integration Tests

#### 4.13 Create `__tests__/integration/audioPlayback.test.tsx`
**Purpose**: End-to-end audio playback flow

**Test cases**:
- Load tour
- Start audio playback
- Navigate to next stop
- Progress tracking
- Completion detection

#### 4.14 Create `__tests__/integration/progressPersistence.test.tsx`
**Purpose**: Verify progress saves and loads correctly

**Test cases**:
- Play tour
- Stop mid-way
- Reload app
- Verify resume from saved position

### Testing Strategy
1. Start with unit tests for hooks (highest priority)
2. Add service layer tests (storageService)
3. Add component tests (simpler components first)
4. Add integration tests last
5. Set up CI/CD to run tests on every commit
6. Aim for 70%+ code coverage on critical paths

### Rollback Plan
Tests are additive - if they fail, they don't break the app. Can disable specific tests with `.skip` if needed.

---

## Step 5: Consolidate State Management with useReducer

### Objective
Replace 30+ useState hooks in App.tsx with consolidated useReducer for better state management.

### New Files to Create

#### 5.1 Create `hooks/useAppState.ts`
**Purpose**: Consolidated app state with useReducer

**State Structure**:
```typescript
export interface AppState {
  // Sheet management
  sheets: {
    active: SheetType;
    miniPlayerExpanded: boolean;
    transcriptionExpanded: boolean;
  };
  
  // Player state
  player: {
    isPlaying: boolean;
    currentStopId: string | null;
    allowAutoPlay: boolean;
  };
  
  // Navigation state
  navigation: {
    hasStarted: boolean;
    scrollToStopId: { id: string; timestamp: number } | null;
    hasShownCompletionSheet: boolean;
  };
  
  // Resume state
  resume: {
    stopId: string | null;
    position: number;
    pendingSeek: number | null;
  };
  
  // Asset loading
  assets: {
    ready: boolean;
  };
}

export type AppAction =
  | { type: 'SET_ACTIVE_SHEET'; payload: SheetType }
  | { type: 'SET_MINI_PLAYER_EXPANDED'; payload: boolean }
  | { type: 'SET_TRANSCRIPTION_EXPANDED'; payload: boolean }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_STOP_ID'; payload: string | null }
  | { type: 'SET_ALLOW_AUTO_PLAY'; payload: boolean }
  | { type: 'SET_HAS_STARTED'; payload: boolean }
  | { type: 'SET_SCROLL_TO_STOP_ID'; payload: { id: string; timestamp: number } | null }
  | { type: 'SET_HAS_SHOWN_COMPLETION_SHEET'; payload: boolean }
  | { type: 'SET_RESUME_STOP_ID'; payload: string | null }
  | { type: 'SET_RESUME_POSITION'; payload: number }
  | { type: 'SET_PENDING_SEEK'; payload: number | null }
  | { type: 'SET_ASSETS_READY'; payload: boolean }
  | { type: 'RESET_TOUR' }
  | { type: 'START_TOUR'; payload: { stopId: string; resumePosition?: number } };

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ACTIVE_SHEET':
      return {
        ...state,
        sheets: { ...state.sheets, active: action.payload },
      };
    
    case 'SET_MINI_PLAYER_EXPANDED':
      return {
        ...state,
        sheets: { ...state.sheets, miniPlayerExpanded: action.payload },
      };
    
    // ... handle all action types
    
    case 'START_TOUR':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          hasStarted: true,
        },
        player: {
          ...state.player,
          currentStopId: action.payload.stopId,
          isPlaying: true,
          allowAutoPlay: true,
        },
        sheets: {
          ...state.sheets,
          miniPlayerExpanded: true,
        },
        resume: action.payload.resumePosition ? {
          ...state.resume,
          stopId: action.payload.stopId,
          position: action.payload.resumePosition,
          pendingSeek: action.payload.resumePosition,
        } : state.resume,
      };
    
    case 'RESET_TOUR':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          hasShownCompletionSheet: false,
        },
        resume: {
          stopId: null,
          position: 0,
          pendingSeek: null,
        },
      };
    
    default:
      return state;
  }
};

const initialState: AppState = {
  sheets: {
    active: 'NONE',
    miniPlayerExpanded: false,
    transcriptionExpanded: false,
  },
  player: {
    isPlaying: false,
    currentStopId: null,
    allowAutoPlay: true,
  },
  navigation: {
    hasStarted: false,
    scrollToStopId: null,
    hasShownCompletionSheet: false,
  },
  resume: {
    stopId: null,
    position: 0,
    pendingSeek: null,
  },
  assets: {
    ready: false,
  },
};

export const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Action creators for convenience
  const actions = useMemo(() => ({
    setActiveSheet: (sheet: SheetType) => dispatch({ type: 'SET_ACTIVE_SHEET', payload: sheet }),
    setMiniPlayerExpanded: (expanded: boolean) => dispatch({ type: 'SET_MINI_PLAYER_EXPANDED', payload: expanded }),
    setTranscriptionExpanded: (expanded: boolean) => dispatch({ type: 'SET_TRANSCRIPTION_EXPANDED', payload: expanded }),
    setIsPlaying: (playing: boolean) => dispatch({ type: 'SET_IS_PLAYING', payload: playing }),
    setCurrentStopId: (stopId: string | null) => dispatch({ type: 'SET_CURRENT_STOP_ID', payload: stopId }),
    setAllowAutoPlay: (allow: boolean) => dispatch({ type: 'SET_ALLOW_AUTO_PLAY', payload: allow }),
    setHasStarted: (started: boolean) => dispatch({ type: 'SET_HAS_STARTED', payload: started }),
    setScrollToStopId: (id: { id: string; timestamp: number } | null) => dispatch({ type: 'SET_SCROLL_TO_STOP_ID', payload: id }),
    setHasShownCompletionSheet: (shown: boolean) => dispatch({ type: 'SET_HAS_SHOWN_COMPLETION_SHEET', payload: shown }),
    setResumeStopId: (stopId: string | null) => dispatch({ type: 'SET_RESUME_STOP_ID', payload: stopId }),
    setResumePosition: (position: number) => dispatch({ type: 'SET_RESUME_POSITION', payload: position }),
    setPendingSeek: (position: number | null) => dispatch({ type: 'SET_PENDING_SEEK', payload: position }),
    setAssetsReady: (ready: boolean) => dispatch({ type: 'SET_ASSETS_READY', payload: ready }),
    startTour: (stopId: string, resumePosition?: number) => dispatch({ type: 'START_TOUR', payload: { stopId, resumePosition } }),
    resetTour: () => dispatch({ type: 'RESET_TOUR' }),
  }), []);
  
  return { state, dispatch, actions };
};
```

### App.tsx Updates

#### 5.2 Replace useState declarations
**File**: `App.tsx`

**Remove** (lines 45-153):
- Line 45: `const [activeSheet, setActiveSheet] = useState<SheetType>('NONE');`
- Line 46: `const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);`
- Line 108: `const [collapsedY, setCollapsedY] = useState(0);`
- Line 114: `const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(false);`
- Line 115: `const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);`
- Line 144: `const [hasStarted, setHasStarted] = useState(false);`
- Line 145: `const [scrollToStopId, setScrollToStopId] = useState<{ id: string; timestamp: number } | null>(null);`
- Line 146: `const [hasShownCompletionSheet, setHasShownCompletionSheet] = useState(false);`
- Line 147: `const [assetsReady, setAssetsReady] = useState(false);`
- Line 151-153: Resume refs (keep as refs, but sync with state)

**Replace with**:
```typescript
const { state, actions } = useAppState();

// Keep selectedLanguage separate (language selection logic)
const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

// Keep collapsedY separate (animation-specific)
const [collapsedY, setCollapsedY] = useState(0);

// Sync resume refs with state (for backward compatibility during transition)
useEffect(() => {
  resumeStopIdRef.current = state.resume.stopId;
  resumePositionRef.current = state.resume.position;
  pendingSeekRef.current = state.resume.pendingSeek;
}, [state.resume]);
```

#### 5.3 Update all state setters
**Replace all**:
- `setActiveSheet(...)` → `actions.setActiveSheet(...)`
- `setIsMiniPlayerExpanded(...)` → `actions.setMiniPlayerExpanded(...)`
- `setIsTranscriptionExpanded(...)` → `actions.setTranscriptionExpanded(...)`
- `setIsPlaying(...)` → `actions.setIsPlaying(...)`
- `setCurrentStopId(...)` → `actions.setCurrentStopId(...)`
- `setAllowAutoPlay(...)` → `actions.setAllowAutoPlay(...)`
- `setHasStarted(...)` → `actions.setHasStarted(...)`
- `setScrollToStopId(...)` → `actions.setScrollToStopId(...)`
- `setHasShownCompletionSheet(...)` → `actions.setHasShownCompletionSheet(...)`
- `setAssetsReady(...)` → `actions.setAssetsReady(...)`

**Replace complex handlers**:
- `handleStartTour` (line 687) → Use `actions.startTour(...)`
- `handleResetTour` (line 716) → Use `actions.resetTour()`

#### 5.4 Update state reads
**Replace all**:
- `activeSheet` → `state.sheets.active`
- `isMiniPlayerExpanded` → `state.sheets.miniPlayerExpanded`
- `isTranscriptionExpanded` → `state.sheets.transcriptionExpanded`
- `isPlaying` → `state.player.isPlaying` (but keep from useTourNavigation for now)
- `currentStopId` → `state.player.currentStopId` (but keep from useTourNavigation for now)
- `allowAutoPlay` → `state.player.allowAutoPlay`
- `hasStarted` → `state.navigation.hasStarted`
- `scrollToStopId` → `state.navigation.scrollToStopId`
- `hasShownCompletionSheet` → `state.navigation.hasShownCompletionSheet`
- `assetsReady` → `state.assets.ready`

**Note**: Some state (isPlaying, currentStopId) comes from `useTourNavigation`. Consider:
- Option A: Keep useTourNavigation state separate (current approach)
- Option B: Move all player state into useAppState
- Recommendation: Start with Option A, migrate gradually

### Testing Strategy
1. Create test file: `hooks/__tests__/useAppState.test.ts`
2. Test all action types
3. Test state transitions
4. Test action creators
5. Integration test: Use in App.tsx and verify all functionality works
6. Manual testing:
   - Start tour
   - Navigate stops
   - Open/close sheets
   - Reset tour
   - Verify all interactions work

### Rollback Plan
State management changes are isolated to App.tsx and useAppState.ts. If issues occur:
1. Keep useAppState.ts file
2. Revert App.tsx to use useState
3. Can migrate back gradually later

---

## Implementation Order & Dependencies

### Recommended Order

1. **Step 1: Add React.memo** (1-2 days)
   - Independent, low risk
   - Quick performance win
   - Can be done first

2. **Step 3: Replace Console Statements** (1-2 days)
   - Independent
   - Needed before Step 2 (cleaner logs during refactoring)
   - Can be done in parallel with Step 1

3. **Step 2: Split App.tsx** (2-3 days)
   - Depends on Step 3 (better logging for debugging)
   - Most complex refactoring
   - Do after Step 1 & 3

4. **Step 4: Add Testing Infrastructure** (3-5 days)
   - Can start early, but best after Step 2
   - Tests will cover refactored code
   - Independent workstream

5. **Step 5: Consolidate State** (2-3 days)
   - Depends on Step 2 (cleaner App.tsx first)
   - Final optimization
   - Do last

### Parallel Workstreams

- **Steps 1 & 3** can be done in parallel (different files)
- **Step 4** can be started early (test existing code first)
- **Steps 2 & 5** must be sequential (2 before 5)

---

## Risk Mitigation

### General Safety Measures

1. **Create feature branch**: `git checkout -b refactor/improvements`
2. **Commit after each step**: Don't mix multiple refactorings
3. **Test after each step**: Manual testing + automated tests
4. **Keep rollback plan ready**: Each step has independent rollback
5. **Code review**: Get review before merging

### Testing Checklist After Each Step

- [ ] App starts without errors
- [ ] Audio playback works
- [ ] Navigation works
- [ ] Progress tracking works
- [ ] Sheets open/close correctly
- [ ] Language switching works
- [ ] Deep links work
- [ ] No console errors
- [ ] No TypeScript errors: `npm run build`
- [ ] Production build works: `npm run build && npm run preview`

### Breaking Changes to Watch For

1. **React.memo**: Component props might change, causing comparison issues
2. **App.tsx split**: Hook dependencies might break
3. **State consolidation**: State access patterns change
4. **Logger replacement**: Missing error context

---

## Success Criteria

### Step 1: React.memo
- [ ] Re-render count reduced (verify with React DevTools Profiler)
- [ ] No visual bugs
- [ ] All interactions work correctly

### Step 2: App.tsx Split
- [ ] App.tsx reduced to < 400 lines
- [ ] All hooks extracted successfully
- [ ] All functionality works identically
- [ ] Code coverage maintained or improved

### Step 3: Logging + Sentry
- [ ] All console.* replaced with logger.*
- [ ] Sentry integration working (test error captured)
- [ ] Production build has no console logs
- [ ] ErrorBoundary reports to Sentry

### Step 4: Testing
- [ ] Test suite runs successfully
- [ ] Critical hooks have > 80% coverage
- [ ] Integration tests pass
- [ ] CI/CD runs tests automatically

### Step 5: State Consolidation
- [ ] AppState reducer handles all state transitions
- [ ] useState hooks reduced by > 70%
- [ ] State management more maintainable
- [ ] No performance regression

---

## Notes

- This plan prioritizes safety and incremental changes
- Each step is designed to be independently reversible
- Testing is integrated throughout, not just at the end
- Focus on critical paths first (audio playback, progress tracking)
- Performance improvements (memo, state consolidation) come early
- Maintainability improvements (splitting App.tsx) come after logging is in place

**Estimated Total Time**: 10-15 days with careful testing
**Recommended Approach**: One step at a time, test thoroughly, then move to next
