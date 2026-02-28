import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { SheetType, Language, AudioStop } from './types';

// Lazy load sheet components for better initial bundle size
const RatingSheet = lazy(() => import('./components/sheets/RatingSheet').then(m => ({ default: m.RatingSheet })));
const LanguageSheet = lazy(() => import('./components/sheets/LanguageSheet').then(m => ({ default: m.LanguageSheet })));
const TourCompleteSheet = lazy(() => import('./components/sheets/TourCompleteSheet').then(m => ({ default: m.TourCompleteSheet })));
import { TourStart } from './screens/TourStart';
import { TourDetail } from './screens/TourDetail';
import { MainSheet } from './components/MainSheet';
import { StartCard } from './components/StartCard';
import { MiniPlayer } from './components/MiniPlayer';
import { TourHeader } from './components/TourHeader';
import { useTourData, useLanguages } from './hooks/useDataLoader';
import { DEFAULT_TOUR_ID } from './src/config/tours';
import { defaultLanguage } from './src/config/languages';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import { MobileFrame } from './components/shared/MobileFrame';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useDownloadManager } from './hooks/useDownloadManager';
import { useTourNavigation } from './hooks/useTourNavigation';
import { useAudioPreloader } from './hooks/useAudioPreloader';
import { RatingProvider, useRating } from './context/RatingContext';
import { TranslationProvider } from './src/translations';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { GlobalStyles } from './src/theme/GlobalStyles';
import { LoadingScreen } from './src/components/screens/LoadingScreen';
import { ErrorScreen } from './src/components/screens/ErrorScreen';
import { AssetsLoadingScreen } from './src/components/screens/AssetsLoadingScreen';
import { storageService } from './src/services/storageService';
import { useLanguageSelection } from './hooks/useLanguageSelection';
import { useEagerAssetPreloader } from './hooks/useEagerAssetPreloader';
import { useDeepLink } from './hooks/useDeepLink';
import { useAutoResume } from './hooks/useAutoResume';
import { TourProgressTracker } from './components/TourProgressTracker';
import { ThemeColorSync } from './components/ThemeColorSync';
import { StatusBarController } from './components/StatusBarController';
import { useMediaSession, useMediaMeta } from 'use-media-session';

// Helper to get artwork MIME type
const getArtworkType = (url: string | undefined): string | null => {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

const App: React.FC = () => {
  // Get route params
  const { tourId, stopId: urlStopId } = useParams<{ tourId: string; stopId?: string }>();
  const navigate = useNavigate();

  // Load languages first
  const { data: languages, loading: languagesLoading, error: languagesError } = useLanguages();

  // Navigation & State
  const [activeSheet, setActiveSheet] = useState<SheetType>('NONE');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  // Load tour data based on selected language
  const { data: tour, loading: tourLoading, error: tourError } = useTourData(selectedLanguage?.code);

  // Progress tracking (using tour ID from loaded tour data)
  const progressTracking = useProgressTracking(tour?.id || tourId || DEFAULT_TOUR_ID);
  const [allowAutoPlay, setAllowAutoPlay] = useState(true);

  // Rating Context
  const { setTourId } = useRating();

  // Set tourId in rating context when tour loads
  useEffect(() => {
    if (tour?.id) {
      setTourId(tour.id);
    }
  }, [tour?.id, setTourId]);


  // Language selection hook
  useLanguageSelection({ languages, selectedLanguage, setSelectedLanguage });

  // Shared Animation State
  const sheetY = useMotionValue(0);
  const [collapsedY, setCollapsedY] = useState(0);

  // Progress Width Motion Value for Header
  const progressWidth = useMotionValue('0%');

  // Mini Player State
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(false);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);

  // Fullscreen Player State
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);

  // Local state for app flow - MUST be declared before callbacks that use them
  const [hasStarted, setHasStarted] = useState(false);
  const [scrollToStopId, setScrollToStopId] = useState<{ id: string; timestamp: number } | null>(null);
  const [hasShownCompletionSheet, setHasShownCompletionSheet] = useState(false);

  // Resume tracking refs
  const resumeStopIdRef = useRef<string | null>(null);
  const resumePositionRef = useRef<number>(0);
  const pendingSeekRef = useRef<number | null>(null);

  // Ref to track isTransitioning for stable callback references (avoids stale closure)
  const isTransitioningRef = useRef(false);

  // Callback for track change - memoized for referential stability
  // Must be declared after scrollToStopId state
  const handleTrackChange = useCallback((stopId: string) => {
    setScrollToStopId({ id: stopId, timestamp: Date.now() });
  }, []);

  // Tour Navigation Hook
  const {
    currentStopId,
    isPlaying,
    isAudioCompleting,
    isTransitioning,
    isSwitchingTracks,
    setCurrentStopId,
    setIsPlaying: rawSetIsPlaying,
    handlePlayPause,
    handleStopClick,
    handleStopPlayPause,
    handleNextStop,
    handlePrevStop,
    handleTrackTransition,
    handleAdvanceToNextTrack,
    startCompletionAnimation,
    endCompletionAnimation
  } = useTourNavigation({
    tour,
    allowAutoPlay,
    onTrackChange: handleTrackChange,
    isStopCompleted: progressTracking.isStopCompleted
  });

  // DEBUG: Wrap setIsPlaying to log all calls with stack trace
  const setIsPlaying = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const stack = new Error().stack?.split('\n').slice(1, 4).join('\n');
    if (typeof value === 'function') {
      console.log('[DEBUG setIsPlaying] Called with function updater\n', stack);
    } else {
      console.log(`[DEBUG setIsPlaying] Setting to ${value}\n`, stack);
    }
    rawSetIsPlaying(value);
  }, [rawSetIsPlaying]);

  // Keep ref in sync with state (avoids stale closure in handleAudioEnded)
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Derived State
  const currentStop = currentStopId && tour ? tour.stops.find(s => s.id === currentStopId) : undefined;
  // Get current audio stop (type-safe)
  const currentAudioStop = currentStop?.type === 'audio' ? currentStop : undefined;
  const audioPlaylist: AudioStop[] = useMemo(
    () => tour?.stops.filter((stop): stop is AudioStop => stop.type === 'audio') || [],
    [tour]
  );

  /* 
  // Disable preloading to prevent iOS Media Session interference
  useAudioPreloader({
    audioPlaylist,
    currentStopId,
    isPlaying,
    preloadCount: 1,
  });
  */

  // Eager asset preloading hook
  const { assetsReady } = useEagerAssetPreloader({ tour });

  // Deep link hook - handles initial deep link on page load only
  useDeepLink({
    urlStopId,
    tour,
    currentStopId,
    setCurrentStopId,
    setIsPlaying,
    setIsMiniPlayerExpanded,
    setAllowAutoPlay,
    setHasStarted,
    setScrollToStopId,
    progressTracking,
    resumeStopIdRef,
    resumePositionRef,
    pendingSeekRef,
  });

  // Auto-resume hook
  useAutoResume({
    tour,
    currentStopId,
    urlStopId,
    progressTracking,
    resumeStopIdRef,
    resumePositionRef,
  });

  // Sync URL with current stop - update URL when playing stop changes
  useEffect(() => {
    if (!tour) return;

    const effectiveTourId = tourId || tour.id;

    // When we have a current stop and it differs from URL, update URL
    if (currentStopId && currentStopId !== urlStopId) {
      navigate(`/tour/${effectiveTourId}/${currentStopId}`, { replace: true });
    }
    // When we don't have a current stop but URL has one, update URL (going back to tour view)
    else if (!currentStopId && urlStopId && !hasStarted) {
      navigate(`/tour/${effectiveTourId}`, { replace: true });
    }
  }, [currentStopId, urlStopId, tourId, tour, hasStarted, navigate]);

  // Show mini player only in tour detail (not on start screen)
  const shouldShowMiniPlayer = !!currentAudioStop && hasStarted;

  // Memoize navigation state
  const currentAudioIndex = useMemo(
    () => (currentAudioStop ? audioPlaylist.findIndex((stop) => stop.id === currentAudioStop.id) : -1),
    [audioPlaylist, currentAudioStop]
  );

  const canGoNext = useMemo(() => currentAudioIndex >= 0 && currentAudioIndex < audioPlaylist.length - 1, [audioPlaylist.length, currentAudioIndex]);

  const canGoPrev = useMemo(() => currentAudioIndex > 0, [currentAudioIndex]);

  // Handle audio progress
  const handleAudioProgress = useCallback((id: string | undefined, currentTime: number, duration: number, percentComplete: number) => {
    if (isTransitioning) return;
    if (id && id !== currentStopId) return;
    if (!currentStopId) return;

    if (percentComplete >= 100 && !progressTracking.isStopCompleted(currentStopId)) {
      progressTracking.markStopCompleted(currentStopId);
      startCompletionAnimation();
    }

    progressTracking.updateStopPosition(currentStopId, currentTime);
    progressTracking.updateStopMaxProgress(currentStopId, percentComplete);
  }, [currentStopId, progressTracking, isTransitioning, startCompletionAnimation]);

  const handleAudioEnded = useCallback(async () => {
    // Use ref to get current isTransitioning value (avoids stale closure)
    if (isTransitioningRef.current) {
      // Transition audio just ended, play the next real track
      handleAdvanceToNextTrack();
    } else {
      // A normal track ended - start transition if available, otherwise advance directly
      if (tour?.transitionAudio) {
        handleTrackTransition();
      } else {
        // No transition audio configured, advance directly to next track
        handleAdvanceToNextTrack();
      }
    }
  }, [tour, handleTrackTransition, handleAdvanceToNextTrack]);

  // Memoize onPlayBlocked to prevent effect re-runs
  const handlePlayBlocked = useCallback((error: unknown) => {
    console.warn('[handlePlayBlocked] Play was blocked by the browser:', error);
    console.warn('[handlePlayBlocked] Setting isPlaying to FALSE');
    setIsPlaying(false);
  }, [setIsPlaying]);

  // Audio Player
  const audioPlayer = useAudioPlayer({
    audioUrl: isTransitioning && tour?.transitionAudio
      ? tour.transitionAudio
      : (currentAudioStop?.audioFile || null),
    id: currentStopId || undefined,
    isPlaying,
    onEnded: handleAudioEnded,
    onProgress: handleAudioProgress,
    onPlayBlocked: handlePlayBlocked,
  });

  // CRITICAL: Sync native audio events to React state
  // This matches the working demo's JSX: <audio onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
  // Track if audio was playing before pause to distinguish real pauses from load() pauses
  const wasPlayingBeforePauseRef = useRef(false);

  useEffect(() => {
    const audio = audioPlayer.audioElement;
    if (!audio) return;

    const handleNativePlay = () => {
      wasPlayingBeforePauseRef.current = true;
      setIsPlaying(true);
    };

    const handleNativePause = () => {
      const audio = audioPlayer.audioElement;
      // Only sync pause if audio was actually playing before
      // Don't set isPlaying(false) if audio ended - let the ended handler manage the transition
      if (wasPlayingBeforePauseRef.current && !audio?.ended) {
        setIsPlaying(false);
      }
      wasPlayingBeforePauseRef.current = false;
    };

    audio.addEventListener('play', handleNativePlay);
    audio.addEventListener('pause', handleNativePause);

    return () => {
      audio.removeEventListener('play', handleNativePlay);
      audio.removeEventListener('pause', handleNativePause);
    };
  }, [audioPlayer.audioElement, setIsPlaying]);

  // ============================================================================

  // Watchdog Removed as requested
  // ============================================================================

  // MEDIASESSION API - Critical for iOS Control Center integration
  // ============================================================================

  // Build artwork array for MediaSession metadata
  const artworkType = getArtworkType(currentAudioStop?.image);
  const mediaSessionArtwork = currentAudioStop?.image
    ? [{ src: currentAudioStop.image, sizes: '512x512', type: artworkType || 'image/jpeg' }]
    : [];

  // MediaSession metadata - matching working demo EXACTLY
  useMediaMeta({
    title: currentAudioStop?.title || '',
    artist: tour?.title || '',
    album: 'AudioGuideKit',
    artwork: mediaSessionArtwork,
  });

  // Play callback for MediaSession - MUST set state AFTER play succeeds
  const mediaSessionPlayTrack = useCallback(() => {
    console.log('[mediaSessionPlayTrack] Called - will call play()');
    audioPlayer.play()
      .then(() => {
        console.log('[mediaSessionPlayTrack] play() succeeded - setting isPlaying=true');
        setIsPlaying(true);
        setIsPlaying(true);
      })
      .catch((e) => {
        console.error('[mediaSessionPlayTrack] play() failed:', e);
      });
  }, [audioPlayer, setIsPlaying]);

  // Pause callback for MediaSession
  const mediaSessionPauseTrack = useCallback(() => {
    const audio = audioPlayer.audioElement;
    console.log('[mediaSessionPauseTrack] Called - audio.paused:', audio?.paused);
    if (audio && !audio.paused) {
      console.log('[mediaSessionPauseTrack] Pausing and setting isPlaying=false');
      audioPlayer.pause();
      setIsPlaying(false);
      setIsPlaying(false);
    }
  }, [audioPlayer, setIsPlaying]);

  // Seek callbacks for MediaSession
  const mediaSessionSeekBackward = useCallback(() => {
    audioPlayer.skipBackward(10);
  }, [audioPlayer]);

  const mediaSessionSeekForward = useCallback(() => {
    audioPlayer.skipForward(10);
  }, [audioPlayer]);

  // MediaSession hook - provides Control Center integration
  useMediaSession({
    playbackState: isPlaying ? 'playing' : 'paused',
    onPlay: mediaSessionPlayTrack,
    onPause: mediaSessionPauseTrack,
    onSeekBackward: mediaSessionSeekBackward,
    onSeekForward: mediaSessionSeekForward,
    onPreviousTrack: handlePrevStop,
    onNextTrack: handleNextStop,
  });

  // Log state changes for debugging
  useEffect(() => {
    console.log('[STATE CHANGE] isPlaying changed to:', isPlaying);
    console.log('[MEDIASESSION] playbackState will be:', isPlaying ? 'playing' : 'paused');
  }, [isPlaying]);

  // Update MediaSession position state (throttled to once per second)
  const lastPositionUpdateRef = useRef(0);
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      const duration = audioPlayer.duration;
      const currentTime = audioPlayer.currentTime;
      const now = Date.now();

      // Throttle to once per second
      if (now - lastPositionUpdateRef.current < 1000) return;

      if (duration > 0 && isFinite(duration) && isFinite(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: currentTime,
          });
          lastPositionUpdateRef.current = now;
        } catch {
          // Ignore errors
        }
      }
    }
  }, [audioPlayer.currentTime, audioPlayer.duration]);

  // ============================================================================

  // CRITICAL FOR iOS: Pre-load first audio into the singleton element
  // This ensures audio is ALREADY LOADED when user clicks "Start tour"
  // iOS requires actual audio playback (not just buffering) for Media Session to activate
  const hasPreloadedSingletonRef = useRef(false);
  useEffect(() => {
    if (!tour || !assetsReady || hasPreloadedSingletonRef.current) return;
    if (!audioPlayer.audioElement) return;

    const firstAudioStop = tour.stops.find(s => s.type === 'audio');
    if (!firstAudioStop || firstAudioStop.type !== 'audio') return;

    const audioUrl = firstAudioStop.audioFile;
    const audio = audioPlayer.audioElement;

    // Only preload if not already playing something
    if (audio.src && !audio.paused) return;

    console.log('[iOS PRELOAD] Pre-loading first audio into singleton:', audioUrl);
    audio.src = audioUrl;
    audio.load();

    const handleCanPlay = () => {
      console.log('[iOS PRELOAD] ✅ First audio ready in singleton (canplay)');
      hasPreloadedSingletonRef.current = true;
      audio.removeEventListener('canplay', handleCanPlay);
    };

    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [tour, assetsReady, audioPlayer.audioElement]);

  // AUTO-RESUME: Restore playback position when resuming
  useEffect(() => {
    if (!audioPlayer?.audioElement || !currentStopId) return;
    if (pendingSeekRef.current === null) return;

    const audio = audioPlayer.audioElement;

    // Wait for audio metadata to load before seeking
    if (audio.readyState >= 1 && audio.duration > 0) {
      const seekPosition = pendingSeekRef.current;
      console.log(`[RESUME] Seeking to ${seekPosition}s`);
      audioPlayer.seek(seekPosition);
      pendingSeekRef.current = null;
    }
  }, [audioPlayer, currentStopId, audioPlayer?.audioElement?.readyState, audioPlayer?.duration]);

  // Background audio keep-alive for iOS
  useBackgroundAudio({ enabled: isPlaying });

  // Global error logging to surface crashes
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error('[GLOBAL ERROR]', event.message, event.error);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error('[GLOBAL UNHANDLED REJECTION]', event.reason);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Flag to indicate we want to start playing when audio is ready
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);

  // Effect to handle autoplay when audio becomes available
  // MATCHING WORKING DEMO: Set isPlaying(true) SYNCHRONOUSLY when calling play()
  useEffect(() => {
    if (!pendingAutoPlay || !audioPlayer.audioElement) return;

    const audio = audioPlayer.audioElement;
    console.log('[AUTOPLAY] pendingAutoPlay effect triggered, readyState:', audio.readyState);

    // Wait for audio to be ready
    const attemptPlay = () => {
      console.log('[AUTOPLAY] Attempting play() - will set isPlaying=true AFTER promise resolves');
      // CRITICAL FIX: Do NOT set state before play()!
      // iOS sees playbackState='playing' but audio.paused=true → shows play button
      // Must wait for play() to succeed, THEN set state (like working demo autoplay pattern)
      setPendingAutoPlay(false);

      audio.play()
        .then(() => {
          console.log('[AUTOPLAY] play() succeeded - NOW setting isPlaying=true');
          // CRITICAL: Set state AFTER play succeeds (matching working demo pattern)
          setIsPlaying(true);
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('[AUTOPLAY] play() promise rejected:', error);
          // No need to revert - we never set isPlaying=true
        });
    };

    if (audio.readyState >= 2) {
      attemptPlay();
    } else {
      console.log('[AUTOPLAY] Waiting for canplay event...');
      const handleCanPlay = () => {
        console.log('[AUTOPLAY] canplay event fired');
        attemptPlay();
        audio.removeEventListener('canplay', handleCanPlay);
      };
      audio.addEventListener('canplay', handleCanPlay, { once: true });
    }
  }, [pendingAutoPlay, audioPlayer.audioElement, setIsPlaying]);

  // Handlers - wrapped with useCallback for referential stability
  const handleStartTour = useCallback(() => {
    if (!tour || tour.stops.length === 0) return;
    setHasStarted(true);
    setAllowAutoPlay(true); // user initiated

    // Only auto-select if no current stop
    if (!currentStopId) {
      // Use resume point if available, otherwise first audio stop
      const stopToStart = resumeStopIdRef.current ||
        tour.stops.find(s => s.type === 'audio')?.id;

      if (stopToStart) {
        // Set stop ID and expand mini player
        setCurrentStopId(stopToStart);
        setIsMiniPlayerExpanded(true);

        // CRITICAL FOR iOS: Don't set isPlaying(true) here!
        // Instead, set flag to trigger autoplay effect when audio is ready
        // The effect will call play() and set isPlaying AFTER play succeeds
        setPendingAutoPlay(true);

        // Queue position restoration if resuming
        if (resumeStopIdRef.current && resumePositionRef.current > 0) {
          pendingSeekRef.current = resumePositionRef.current;
          console.log(`[RESUME] Queued seek to ${resumePositionRef.current}s`);
        }
      }
    }
  }, [tour, currentStopId, setCurrentStopId, setIsMiniPlayerExpanded, setHasStarted, setAllowAutoPlay]);

  const handleBackToStart = useCallback(() => {
    setHasStarted(false);
  }, [setHasStarted]);

  const closeSheet = useCallback(() => {
    setActiveSheet('NONE');
  }, [setActiveSheet]);

  const handleResetTour = useCallback(() => {
    if (!tour) return;
    progressTracking.resetProgress();
    setHasShownCompletionSheet(false);

    // Clear resume refs
    resumeStopIdRef.current = null;
    resumePositionRef.current = 0;
    pendingSeekRef.current = null;

    const firstAudioStop = tour.stops.find(s => s.type === 'audio');
    if (firstAudioStop) {
      // Set stop ID and state
      setCurrentStopId(firstAudioStop.id);
      setHasStarted(true);
      setAllowAutoPlay(true);
      // Use pendingAutoPlay to start playing after audio is ready
      setPendingAutoPlay(true);
    }
    setActiveSheet('NONE');
  }, [tour, progressTracking, setCurrentStopId, setHasStarted, setAllowAutoPlay, setHasShownCompletionSheet, setActiveSheet]);

  const handleLanguageChange = useCallback((language: Language) => {
    // Stop playback if audio is currently playing
    if (isPlaying) {
      setIsPlaying(false);
    }

    // Preserve current stop and position for resume after language change
    if (currentStopId && audioPlayer.audioElement) {
      resumeStopIdRef.current = currentStopId;
      resumePositionRef.current = audioPlayer.audioElement.currentTime;
      pendingSeekRef.current = audioPlayer.audioElement.currentTime;
      console.log(`[LANGUAGE_CHANGE] Saved position: ${currentStopId} at ${resumePositionRef.current}s`);
    }

    // Save language preference
    storageService.setPreferences({ selectedLanguage: language.code });

    // Change language (this will trigger tour reload via useTourData dependency)
    setSelectedLanguage(language);
    setActiveSheet('NONE');
  }, [isPlaying, setIsPlaying, currentStopId, audioPlayer.audioElement, setSelectedLanguage, setActiveSheet]);

  const handleRatingSubmit = useCallback((rating: number) => {
    console.log('Rated:', rating);
    setActiveSheet('NONE');
  }, [setActiveSheet]);

  // Callbacks for inline handlers - memoized
  const handleOpenRating = useCallback(() => {
    setActiveSheet('RATING');
  }, [setActiveSheet]);

  const handleOpenLanguage = useCallback(() => {
    setActiveSheet('LANGUAGE');
  }, [setActiveSheet]);

  const handleScrollComplete = useCallback(() => {
    setScrollToStopId(null);
  }, [setScrollToStopId]);

  const handleMiniPlayerClick = useCallback(() => {
    if (currentStopId) {
      setScrollToStopId({ id: currentStopId, timestamp: Date.now() });
    }
  }, [currentStopId, setScrollToStopId]);

  const handleSeek = useCallback((time: number) => {
    audioPlayer.seek(time);
  }, [audioPlayer]);

  const handleRewind = useCallback(() => {
    audioPlayer.skipBackward(15);
  }, [audioPlayer]);

  const handleForward = useCallback(() => {
    audioPlayer.skipForward(15);
  }, [audioPlayer]);

  const handleRateTour = useCallback(() => {
    setActiveSheet('RATING');
  }, [setActiveSheet]);

  // Download manager - no auto-start on completion, let user decide when to start
  const downloadManager = useDownloadManager(tour);

  // Memoize progress
  const tourProgress = useMemo(() => {
    if (!tour) return 0;
    return progressTracking.getRealtimeProgressPercentage(
      tour.stops,
      currentStopId,
      audioPlayer.progress
    );
  }, [tour, currentStopId, audioPlayer.progress, progressTracking]);

  // Update progress width motion value
  useEffect(() => {
    progressWidth.set(`${tourProgress}%`);
  }, [tourProgress, progressWidth]);

  // Memoize minutes
  const { consumed: consumedMinutes, total: totalMinutes } = useMemo(() => {
    if (!tour) return { consumed: 0, total: 0 };
    return progressTracking.getConsumedMinutes(
      tour.stops,
      currentStopId,
      audioPlayer.progress
    );
  }, [tour, currentStopId, audioPlayer.progress, progressTracking]);

  // Tour completion callback
  const handleTourComplete = useCallback(() => {
    setActiveSheet('TOUR_COMPLETE');
    setHasShownCompletionSheet(true);
  }, [setActiveSheet, setHasShownCompletionSheet]);

  // Get theme ID from tour data (fallback to 'default')
  const themeId = tour?.themeId || 'default';

  // UI language: use the tour's language field to ensure UI matches content
  // Falls back to selectedLanguage code (which is the user's preference)
  const uiLanguage = tour?.language || selectedLanguage?.code || defaultLanguage;

  // Loading state
  if (tourLoading || languagesLoading) {
    return (
      <ThemeProvider themeId="default">
        <ThemeColorSync />
        <GlobalStyles />
        <TranslationProvider language={selectedLanguage?.code || defaultLanguage}>
          <LoadingScreen />
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  // Error state
  if (tourError || languagesError) {
    return (
      <ThemeProvider themeId="default">
        <ThemeColorSync />
        <GlobalStyles />
        <TranslationProvider language={selectedLanguage?.code || defaultLanguage}>
          <ErrorScreen error={tourError || languagesError} />
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  if (!tour || !languages || !selectedLanguage) return null;

  // Show loading screen while assets are being preloaded
  if (!assetsReady) {
    return (
      <ThemeProvider themeId={themeId}>
        <ThemeColorSync />
        <GlobalStyles />
        <TranslationProvider language={uiLanguage}>
          <AssetsLoadingScreen />
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider themeId={themeId}>
      <StatusBarController backgroundColor={tour?.backgroundColor} hasStarted={hasStarted} />
      <GlobalStyles />
      <TranslationProvider language={uiLanguage}>
        <MobileFrame>
          {/* Tour Progress Tracker - monitors completion */}
          <TourProgressTracker
            tour={tour}
            currentStopId={currentStopId}
            audioPlayerProgress={audioPlayer.progress}
            progressTracking={progressTracking}
            hasShownCompletionSheet={hasShownCompletionSheet}
            onTourComplete={handleTourComplete}
          />
          <div className="relative w-full h-full overflow-hidden flex flex-col font-sans text-base">
            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
              <TourStart
                tour={tour}
                selectedLanguage={selectedLanguage!}
                languages={languages}
                onOpenRating={handleOpenRating}
                onOpenLanguage={handleOpenLanguage}
                sheetY={sheetY}
                collapsedY={collapsedY}
                isVisible={true}
              />

              <MainSheet
                isExpanded={hasStarted}
                onExpand={handleStartTour}
                onCollapse={handleBackToStart}
                sheetY={sheetY}
                onLayoutChange={setCollapsedY}
                startContent={
                  <StartCard
                    tour={tour}
                    hasStarted={!!currentStopId || progressTracking.hasAnyProgress()}
                    onAction={handleStartTour}
                    isDownloading={downloadManager.isDownloading}
                    isDownloaded={downloadManager.isDownloaded}
                    downloadProgress={downloadManager.downloadProgress.percentage}
                    onDownload={downloadManager.startDownload}
                    downloadError={downloadManager.error}
                    tourProgress={tourProgress}
                    onResetProgress={handleResetTour}
                  />
                }
                detailContent={
                  <TourDetail
                    tour={tour}
                    currentStopId={currentStopId}
                    isPlaying={isPlaying}
                    onStopClick={handleStopClick}
                    onTogglePlay={handlePlayPause}
                    onStopPlayPause={handleStopPlayPause}
                    onBack={handleBackToStart}
                    tourProgress={tourProgress}
                    consumedMinutes={consumedMinutes}
                    totalMinutes={totalMinutes}
                    completedStopsCount={progressTracking.getCompletedStopsCount()}
                    isStopCompleted={progressTracking.isStopCompleted}
                    scrollToStopId={scrollToStopId?.id ?? null}
                    scrollTrigger={scrollToStopId?.timestamp ?? null}
                    onScrollComplete={handleScrollComplete}
                    onOpenRatingSheet={() => setActiveSheet('RATING')}
                  />
                }
              />

              {/* Mini Player */}
              <AnimatePresence>
                {shouldShowMiniPlayer && currentAudioStop && (
                  <MiniPlayer
                    currentStop={currentAudioStop}
                    isPlaying={isPlaying}
                    onTogglePlay={handlePlayPause}
                    onRewind={handleRewind}
                    onForward={handleForward}
                    onClick={handleMiniPlayerClick}
                    progress={audioPlayer.progress}
                    isExpanded={isMiniPlayerExpanded}
                    onToggleExpanded={setIsMiniPlayerExpanded}
                    isCompleting={isAudioCompleting}
                    isTransitioning={isTransitioning || isSwitchingTracks}
                    onNextTrack={handleNextStop}
                    onPrevTrack={handlePrevStop}
                    canGoNext={canGoNext}
                    canGoPrev={canGoPrev}
                    transcription={currentAudioStop.transcription}
                    transcriptAvailable={tour?.transcriptAvailable}
                    isTranscriptionExpanded={isTranscriptionExpanded}
                    onToggleTranscription={setIsTranscriptionExpanded}
                    isFullscreenOpen={tour?.fullscreenPlayer ? isFullscreenPlayerOpen : undefined}
                    onFullscreenChange={tour?.fullscreenPlayer ? setIsFullscreenPlayerOpen : undefined}
                    tourTitle={tour?.title}
                    stopNumber={tour?.showStopNumber !== false && currentAudioStop ? audioPlaylist.findIndex(s => s.id === currentAudioStop.id) + 1 : undefined}
                    nextStopImage={canGoNext ? audioPlaylist[currentAudioIndex + 1]?.image : undefined}
                    prevStopImage={canGoPrev ? audioPlaylist[currentAudioIndex - 1]?.image : undefined}
                    currentTime={audioPlayer.currentTime}
                    duration={audioPlayer.duration}
                    onSeek={handleSeek}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Floating Controls Removed - TourDetail handles the header */}

            {/* Sheets - Lazy loaded for better initial bundle size */}
            <Suspense fallback={null}>
              <RatingSheet
                isOpen={activeSheet === 'RATING'}
                onClose={closeSheet}
                onSubmit={handleRatingSubmit}
              />

              <LanguageSheet
                isOpen={activeSheet === 'LANGUAGE'}
                onClose={closeSheet}
                selectedLanguage={selectedLanguage}
                languages={languages}
                onSelect={handleLanguageChange}
              />

              <TourCompleteSheet
                isOpen={activeSheet === 'TOUR_COMPLETE'}
                onClose={closeSheet}
                onRateTour={handleRateTour}
              />
            </Suspense>
          </div>
        </MobileFrame>
      </TranslationProvider>
    </ThemeProvider>
  );
};

export default App;