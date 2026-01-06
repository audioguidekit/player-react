import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { SheetType, Language, AudioStop } from './types';
import { RatingSheet } from './components/sheets/RatingSheet';
import { LanguageSheet } from './components/sheets/LanguageSheet';
import { TourCompleteSheet } from './components/sheets/TourCompleteSheet';
import { TourStart } from './screens/TourStart';
import { TourDetail } from './screens/TourDetail';
import { MainSheet } from './components/MainSheet';
import { StartCard } from './components/StartCard';
import { MiniPlayer } from './components/MiniPlayer';
import { TourHeaderAlt } from './components/TourHeaderAlt';
import { useTourData, useLanguages } from './hooks/useDataLoader';
import { DEFAULT_TOUR_ID } from './src/config/tours';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import { MobileFrame } from './components/shared/MobileFrame';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useDownloadManager } from './hooks/useDownloadManager';
import { useTourNavigation } from './hooks/useTourNavigation';
import { useAudioPreloader, eagerPreloadImage, eagerPreloadAudio } from './hooks/useAudioPreloader';
import { RatingProvider, useRating } from './context/RatingContext';
import { TranslationProvider } from './src/translations';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { GlobalStyles } from './src/theme/GlobalStyles';
import { LoadingScreen } from './src/components/screens/LoadingScreen';
import { ErrorScreen } from './src/components/screens/ErrorScreen';
import { AssetsLoadingScreen } from './src/components/screens/AssetsLoadingScreen';
import { storageService } from './src/services/storageService';

// Module-level flag to track if Media Session handlers are initialized
// Prevents re-initialization on HMR which can cause iOS issues
let mediaSessionInitialized = false;

const App: React.FC = () => {
  // Get route params
  const { tourId } = useParams<{ tourId: string }>();
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

  // Set default language when languages are loaded
  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguage) {
      let languageToUse: Language | undefined;

      // 1. Check for saved user preference (user explicitly chose a language)
      const preferences = storageService.getPreferences();
      const savedLanguageCode = preferences.selectedLanguage;

      if (savedLanguageCode) {
        languageToUse = languages.find(l => l.code === savedLanguageCode);
      }

      // 2. If no saved preference, detect browser/device language
      if (!languageToUse) {
        const browserLanguage = navigator.language || navigator.languages?.[0];
        if (browserLanguage) {
          // Extract language code (e.g., "cs-CZ" -> "cs", "en-US" -> "en")
          const browserLangCode = browserLanguage.split('-')[0].toLowerCase();
          languageToUse = languages.find(l => l.code === browserLangCode);

          if (languageToUse) {
            console.log(`[LANGUAGE] Detected browser language: ${browserLanguage}, using: ${languageToUse.code}`);
          }
        }
      }

      // 3. Fall back to English
      if (!languageToUse) {
        languageToUse = languages.find(l => l.code === 'en');
      }

      // 4. Fall back to first available language
      if (!languageToUse) {
        languageToUse = languages[0];
      }

      setSelectedLanguage(languageToUse);
    }
  }, [languages, selectedLanguage]);

  // Shared Animation State
  const sheetY = useMotionValue(0);
  const [collapsedY, setCollapsedY] = useState(0);

  // Progress Width Motion Value for Header
  const progressWidth = useMotionValue('0%');

  // Mini Player State
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(false);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);

  // Tour Navigation Hook
  const {
    currentStopId,
    isPlaying,
    isAudioCompleting,
    isTransitioning,
    isSwitchingTracks,
    setCurrentStopId,
    setIsPlaying,
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
    onTrackChange: (stopId) => {
      setScrollToStopId({ id: stopId, timestamp: Date.now() });
    }
  });

  // Local state for app flow
  const [hasStarted, setHasStarted] = useState(false);
  const [scrollToStopId, setScrollToStopId] = useState<{ id: string; timestamp: number } | null>(null);
  const [hasShownCompletionSheet, setHasShownCompletionSheet] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const hasPreloadedEagerRef = useRef(false);

  // Resume tracking refs
  const resumeStopIdRef = useRef<string | null>(null);
  const resumePositionRef = useRef<number>(0);
  const pendingSeekRef = useRef<number | null>(null);

  const getArtworkType = (src: string | undefined) => {
    if (!src) return undefined;
    const lower = src.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return undefined;
  };

  // Derived State
  const currentStop = currentStopId && tour ? tour.stops.find(s => s.id === currentStopId) : undefined;
  // Get current audio stop (type-safe)
  const currentAudioStop = currentStop?.type === 'audio' ? currentStop : undefined;
  const audioPlaylist: AudioStop[] = useMemo(
    () => tour?.stops.filter((stop): stop is AudioStop => stop.type === 'audio') || [],
    [tour]
  );

  useAudioPreloader({
    audioPlaylist,
    currentStopId,
    isPlaying,
    preloadCount: 1,
  });

  // EAGER PRELOADING: Preload assets when tour loads (before TourStart shows)
  useEffect(() => {
    if (!tour) {
      setAssetsReady(false);
      return;
    }
    if (hasPreloadedEagerRef.current) return;

    console.log('[EAGER] Starting eager preload for tour:', tour.title);

    const preloadTourAssets = async () => {
      try {
        // Get first audio stop
        const firstAudioStop = tour.stops.find(stop => stop.type === 'audio' && 'audioFile' in stop);
        if (!firstAudioStop || firstAudioStop.type !== 'audio') {
          console.error('[EAGER] No audio stops found in tour');
          setAssetsReady(true);
          return;
        }

        // PRIORITY 1: Preload first audio (wait for completion)
        console.log('[EAGER] ⏳ Loading first audio:', firstAudioStop.audioFile);
        await eagerPreloadAudio(firstAudioStop.audioFile);
        console.log('[EAGER] ✅ First audio ready');

        // PRIORITY 2: Preload ALL images in parallel (max 3 concurrent to avoid overwhelming browser)
        console.log('[EAGER] ⏳ Loading all images...');
        const imageStops = tour.stops.filter(stop =>
          (stop.type === 'audio' || stop.type === 'poi') && 'image' in stop && stop.image
        );

        // Load images in batches of 3
        const BATCH_SIZE = 3;
        for (let i = 0; i < imageStops.length; i += BATCH_SIZE) {
          const batch = imageStops.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(stop => {
              const image = 'image' in stop ? stop.image : undefined;
              return image ? eagerPreloadImage(image).catch(err => {
                console.warn(`[EAGER] Failed to load image ${image}:`, err);
              }) : Promise.resolve();
            })
          );
        }

        console.log('[EAGER] ✅ All assets ready');
        hasPreloadedEagerRef.current = true;
        setAssetsReady(true);
      } catch (error) {
        console.error('[EAGER] Error during preload:', error);
        // Still mark as ready to not block the UI forever
        setAssetsReady(true);
      }
    };

    preloadTourAssets();
  }, [tour]);

  // AUTO-RESUME: Detect first unfinished track on mount
  useEffect(() => {
    if (!tour || currentStopId !== null) return;

    const audioStops = tour.stops.filter(stop => stop.type === 'audio');
    const firstUnfinished = audioStops.find(stop =>
      !progressTracking.isStopCompleted(stop.id)
    );

    if (firstUnfinished) {
      resumeStopIdRef.current = firstUnfinished.id;
      resumePositionRef.current = progressTracking.getStopPosition(firstUnfinished.id);
      console.log(`[RESUME] Detected unfinished track: ${firstUnfinished.id} at ${resumePositionRef.current}s`);
    } else {
      // All complete or no progress - start from beginning
      resumeStopIdRef.current = null;
      resumePositionRef.current = 0;
    }
  }, [tour, currentStopId, progressTracking]);

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
    if (isTransitioning) {
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
  }, [isTransitioning, tour, handleTrackTransition, handleAdvanceToNextTrack]);

  // Memoize onPlayBlocked to prevent effect re-runs
  const handlePlayBlocked = useCallback(() => {
    console.warn('[Audio] Play was blocked by the browser. Requiring user interaction to resume.');
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

  // Media Session refs for position state management
  const lastMetadataTrackIdRef = useRef<string | null>(null);
  const lastPositionUpdateRef = useRef(0);
  const lastPositionValuesRef = useRef({ duration: 0, position: 0 });

  // EARLY Media Session metadata - set initial metadata on tour load
  // This ensures Control Center shows controls immediately, even before playback starts
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour) return;

    // Find first audio stop
    const firstAudioStop = tour.stops.find(stop => stop.type === 'audio' && 'audioFile' in stop);
    if (!firstAudioStop || firstAudioStop.type !== 'audio') return;

    // Set initial metadata with first stop
    const artworkType = getArtworkType(firstAudioStop.image);
    const artworkArray = firstAudioStop.image
      ? [{
          src: firstAudioStop.image,
          sizes: '512x512',
          type: artworkType || 'image/png'
        }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: firstAudioStop.title,
      artist: tour.title,
      album: 'Audio Tour',
      artwork: artworkArray,
    });

    console.log('[MediaSession] Initial metadata set:', firstAudioStop.title);
  }, [tour]);

  // Media Session metadata - only update when track actually changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour || !currentAudioStop) return;

    // Don't update metadata during transitions - transition audio should not show metadata
    if (isTransitioning) return;

    // Only update metadata if track changed
    if (lastMetadataTrackIdRef.current === currentAudioStop.id) return;
    lastMetadataTrackIdRef.current = currentAudioStop.id;

    const artworkType = getArtworkType(currentAudioStop.image);

    // Use single artwork entry with type always present for iOS compatibility
    const artworkArray = currentAudioStop.image
      ? [{
          src: currentAudioStop.image,
          sizes: '512x512',
          type: artworkType || 'image/png'  // Always provide type with fallback
        }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentAudioStop.title,
      artist: tour.title,
      album: 'Audio Tour',
      artwork: artworkArray,
    });

    console.log('[MediaSession] Metadata updated:', currentAudioStop.title);
  }, [tour, currentAudioStop, isTransitioning]);

  // Media Session playback state - keep in sync with isPlaying
  // IMPORTANT: Never set to 'none' as this can cause iOS to drop the session
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Visibility change handler - refresh metadata when app becomes visible
  // This ensures Control Center has fresh data when user returns to app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!('mediaSession' in navigator)) return;
        if (!tour || !currentAudioStop) return;
        if (isTransitioning) return;

        const artworkType = getArtworkType(currentAudioStop.image);
        const artworkArray = currentAudioStop.image
          ? [{
              src: currentAudioStop.image,
              sizes: '512x512',
              type: artworkType || 'image/png'
            }]
          : [];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentAudioStop.title,
          artist: tour.title,
          album: 'Audio Tour',
          artwork: artworkArray,
        });

        console.log('[MediaSession] Metadata refreshed on visibility change:', currentAudioStop.title);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tour, currentAudioStop, isTransitioning]);

  // Periodic metadata refresh - keep iOS audio session alive
  // Re-assert metadata every 30s to prevent iOS from thinking session is stale
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentAudioStop || !tour) return;
    if (isTransitioning) return;

    const refreshInterval = setInterval(() => {
      const artworkType = getArtworkType(currentAudioStop.image);
      const artworkArray = currentAudioStop.image
        ? [{
            src: currentAudioStop.image,
            sizes: '512x512',
            type: artworkType || 'image/png'
          }]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentAudioStop.title,
        artist: tour.title,
        album: 'Audio Tour',
        artwork: artworkArray,
      });

      console.log('[MediaSession] Periodic metadata refresh:', currentAudioStop.title);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [currentAudioStop, tour, isTransitioning]);

  // Refs for navigation state - used by Media Session handlers
  const canGoNextRef = useRef(canGoNext);
  const canGoPrevRef = useRef(canGoPrev);
  const handleNextStopRef = useRef(handleNextStop);
  const handlePrevStopRef = useRef(handlePrevStop);

  // Keep refs updated with latest values
  useEffect(() => {
    canGoNextRef.current = canGoNext;
    canGoPrevRef.current = canGoPrev;
    handleNextStopRef.current = handleNextStop;
    handlePrevStopRef.current = handlePrevStop;
  }, [canGoNext, canGoPrev, handleNextStop, handlePrevStop]);

  // Media Session action handlers - set once and DON'T clean up
  // Cleaning up handlers (setting to null) can cause iOS to think the session ended
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audioEl = audioPlayer.audioElement;
    if (!audioEl) return;
    
    // Only initialize once to avoid iOS quirks with handler changes
    if (mediaSessionInitialized) return;
    mediaSessionInitialized = true;

    console.log('[MediaSession] Initializing action handlers');

    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      audioEl.play().catch((err) => console.error('MediaSession play failed', err));
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      audioEl.pause();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (canGoNextRef.current) {
        handleNextStopRef.current();
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (canGoPrevRef.current) {
        handlePrevStopRef.current();
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const seekOffset = details.seekOffset ?? 10;
      const duration = audioEl.duration;
      const currentTime = audioEl.currentTime;
      if (isFinite(duration) && isFinite(currentTime)) {
        audioEl.currentTime = Math.min(currentTime + seekOffset, duration);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const seekOffset = details.seekOffset ?? 10;
      const currentTime = audioEl.currentTime;
      if (isFinite(currentTime)) {
        audioEl.currentTime = Math.max(currentTime - seekOffset, 0);
      }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && isFinite(details.seekTime)) {
        audioEl.currentTime = details.seekTime;
      }
    });

    // NO CLEANUP - keeping handlers prevents iOS from dropping the session
  }, [audioPlayer.audioElement, setIsPlaying]);

  // Media Session position state update - periodic timer reading directly from audio element
  // CRITICAL: We read from audio element directly, NOT React state, to avoid stale values
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;

    // Don't update position during transitions or track switching
    if (isTransitioning || isSwitchingTracks) return;

    const audio = audioPlayer.audioElement;
    if (!audio) return;

    // Function to update position state from audio element
    const updatePositionState = () => {
      // Read values DIRECTLY from audio element to avoid stale React state
      const duration = audio.duration;
      const currentTime = audio.currentTime;
      const now = Date.now();

      // Guard against invalid values
      if (duration < 0.5 || !isFinite(duration)) return;
      if (!isFinite(currentTime) || currentTime < 0) return;

      // Guard against track loading state
      // If currentTime is very close to 0 but last position was much higher,
      // AND duration changed significantly, we're likely loading a new track
      const likelyTrackLoading =
        currentTime < 1.0 &&
        lastPositionValuesRef.current.position > 5.0 &&
        Math.abs(duration - lastPositionValuesRef.current.duration) > 2.0;

      if (likelyTrackLoading) {
        console.log('[MediaSession] Skipping position update - track loading detected');
        return;
      }

      // Throttle updates
      const timeSinceLastUpdate = now - lastPositionUpdateRef.current;
      const durationChanged = Math.abs(duration - lastPositionValuesRef.current.duration) > 0.5;
      const positionChanged = Math.abs(currentTime - lastPositionValuesRef.current.position) > 2;

      if (lastPositionUpdateRef.current > 0 && timeSinceLastUpdate < 2000 && !durationChanged && !positionChanged) return;

      try {
        const position = Math.min(Math.max(0, currentTime), duration);
        navigator.mediaSession.setPositionState({
          duration: duration,
          position: position,
          playbackRate: 1.0,
        });
        lastPositionUpdateRef.current = now;
        lastPositionValuesRef.current = { duration, position };
      } catch (e) {
        console.warn('[MediaSession] Position state update failed:', e);
      }
    };

    // Update immediately
    updatePositionState();

    // Update periodically: 2s when playing, 10s when paused
    // This keeps iOS audio session alive even when paused
    const updateInterval = isPlaying ? 2000 : 10000;
    const interval = setInterval(updatePositionState, updateInterval);

    return () => clearInterval(interval);
  }, [audioPlayer.audioElement, isPlaying, isTransitioning, isSwitchingTracks]);

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

  // Handlers
  const handleStartTour = () => {
    if (!tour || tour.stops.length === 0) return;
    setHasStarted(true);
    setAllowAutoPlay(true); // user initiated

    // Only auto-select if no current stop
    if (!currentStopId) {
      // Use resume point if available, otherwise first audio stop
      const stopToStart = resumeStopIdRef.current ||
                         tour.stops.find(s => s.type === 'audio')?.id;

      if (stopToStart) {
        setCurrentStopId(stopToStart);
        setIsPlaying(true);
        setIsMiniPlayerExpanded(true);

        // Queue position restoration if resuming
        if (resumeStopIdRef.current && resumePositionRef.current > 0) {
          pendingSeekRef.current = resumePositionRef.current;
          console.log(`[RESUME] Queued seek to ${resumePositionRef.current}s`);
        }
      }
    }
  };

  const handleBackToStart = () => {
    setHasStarted(false);
  };

  const handleResetTour = () => {
    if (!tour) return;
    progressTracking.resetProgress();
    setHasShownCompletionSheet(false);

    // Clear resume refs
    resumeStopIdRef.current = null;
    resumePositionRef.current = 0;
    pendingSeekRef.current = null;

    const firstAudioStop = tour.stops.find(s => s.type === 'audio');
    if (firstAudioStop) {
      setCurrentStopId(firstAudioStop.id);
      setIsPlaying(true);
      setHasStarted(true);
      setAllowAutoPlay(true);
    }
    setActiveSheet('NONE');
  };

  const closeSheet = () => setActiveSheet('NONE');

  const handleLanguageChange = (language: Language) => {
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
    closeSheet();
  };

  const handleRatingSubmit = (rating: number) => {
    console.log('Rated:', rating);
    closeSheet();
  };

  // Download manager
  const downloadManager = useDownloadManager(tour, {
    onDownloadComplete: () => {
      handleStartTour();
    }
  });

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

  // Tour Completion Check
  useEffect(() => {
    if (!tour || !currentStopId) return;
    const progress = progressTracking.getRealtimeProgressPercentage(
      tour.stops,
      currentStopId,
      audioPlayer.progress
    );

    if (progress >= 100 && !hasShownCompletionSheet) {
      setActiveSheet('TOUR_COMPLETE');
      setHasShownCompletionSheet(true);
    }
  }, [tour, currentStopId, audioPlayer.progress, progressTracking, hasShownCompletionSheet]);

  // Get theme ID from tour data (fallback to 'default')
  const themeId = tour?.themeId || 'default';

  // Loading state
  if (tourLoading || languagesLoading) {
    return (
      <ThemeProvider themeId="default">
        <GlobalStyles />
        <TranslationProvider language={selectedLanguage?.code || 'en'}>
          <LoadingScreen />
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  // Error state
  if (tourError || languagesError) {
    return (
      <ThemeProvider themeId="default">
        <GlobalStyles />
        <TranslationProvider language={selectedLanguage?.code || 'en'}>
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
        <GlobalStyles />
        <TranslationProvider language={selectedLanguage?.code || 'en'}>
          <AssetsLoadingScreen />
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider themeId={themeId}>
      <GlobalStyles />
      <TranslationProvider language={selectedLanguage?.code || 'en'}>
        <MobileFrame>
        <div className="relative w-full h-full overflow-hidden flex flex-col font-sans text-base" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
          {/* Main Content Area */}
          <div className="flex-1 relative overflow-hidden">
            <TourStart
              tour={tour}
              selectedLanguage={selectedLanguage!}
              onOpenRating={() => setActiveSheet('RATING')}
              onOpenLanguage={() => setActiveSheet('LANGUAGE')}
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
                  hasStarted={!!currentStopId}
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
                  onScrollComplete={() => setScrollToStopId(null)}
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
                  onRewind={() => audioPlayer.skipBackward(15)}
                  onForward={() => audioPlayer.skipForward(15)}
                  onClick={() => {
                    if (currentStopId) {
                      setScrollToStopId({ id: currentStopId, timestamp: Date.now() });
                    }
                  }}
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
                  transcriptionAvailable={tour?.transcriptionAvailable}
                  isTranscriptionExpanded={isTranscriptionExpanded}
                  onToggleTranscription={setIsTranscriptionExpanded}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Floating Controls Removed - TourDetail handles the header */}

          {/* Sheets */}
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
            onRate={() => setActiveSheet('RATING')}
            onReplay={handleResetTour}
          />
        </div>
      </MobileFrame>
      </TranslationProvider>
    </ThemeProvider>
  );
};

export default App;