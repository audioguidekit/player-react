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
import { useAudioPreloader } from './hooks/useAudioPreloader';
import { RatingProvider } from './context/RatingContext';

// Module-level flag to track if Media Session handlers are initialized
// Prevents re-initialization on HMR which can cause iOS issues
let mediaSessionInitialized = false;

const App: React.FC = () => {
  // Get route params
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();

  // Load data dynamically
  const { data: tour, loading: tourLoading, error: tourError } = useTourData(tourId || DEFAULT_TOUR_ID);
  const { data: languages, loading: languagesLoading, error: languagesError } = useLanguages();

  // Progress tracking
  const progressTracking = useProgressTracking(tourId || DEFAULT_TOUR_ID);

  // Navigation & State
  const [activeSheet, setActiveSheet] = useState<SheetType>('NONE');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [allowAutoPlay, setAllowAutoPlay] = useState(true);

  // Set default language when languages are loaded
  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguage) {
      // Default to English (index 1) or first language
      const defaultLang = languages.find(l => l.code === 'en') || languages[0];
      setSelectedLanguage(defaultLang);
    }
  }, [languages, selectedLanguage]);

  // Shared Animation State
  const sheetY = useMotionValue(0);
  const [collapsedY, setCollapsedY] = useState(0);

  // Progress Width Motion Value for Header
  const progressWidth = useMotionValue('0%');

  // Mini Player State
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(false);

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
    preloadCount: 1,
  });

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
      // A normal track ended, start the transition
      handleTrackTransition();
    }
  }, [isTransitioning, handleTrackTransition, handleAdvanceToNextTrack]);

  // Audio Player
  const audioPlayer = useAudioPlayer({
    audioUrl: isTransitioning && tour?.transitionAudio
      ? tour.transitionAudio
      : (currentAudioStop?.audioFile || null),
    id: currentStopId || undefined,
    isPlaying,
    onEnded: handleAudioEnded,
    onProgress: handleAudioProgress,
    onPlayBlocked: () => {
      console.warn('[Audio] Play was blocked by the browser. Requiring user interaction to resume.');
      setIsPlaying(false);
    },
  });

  // Background audio keep-alive for iOS
  useBackgroundAudio({ enabled: isPlaying });

  // Media Session metadata - only update when track actually changes
  const lastMetadataTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour || !currentAudioStop) return;
    
    // Only update metadata if track changed
    if (lastMetadataTrackIdRef.current === currentAudioStop.id) return;
    lastMetadataTrackIdRef.current = currentAudioStop.id;

    const artworkType = getArtworkType(currentAudioStop.image);
    
    // Provide multiple artwork sizes for iOS compatibility
    // iOS may use different sizes for different UI contexts (compact player vs full screen)
    const artworkArray = currentAudioStop.image
      ? [
          // Small size for compact player
          {
            src: currentAudioStop.image,
            sizes: '96x96',
            ...(artworkType ? { type: artworkType } : {})
          },
          // Medium size
          {
            src: currentAudioStop.image,
            sizes: '256x256',
            ...(artworkType ? { type: artworkType } : {})
          },
          // Large size for full screen
          {
            src: currentAudioStop.image,
            sizes: '512x512',
            ...(artworkType ? { type: artworkType } : {})
          }
        ]
      : [];
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentAudioStop.title,
      artist: tour.title,
      album: 'Audio Tour',
      artwork: artworkArray,
    });
    
    console.log('[MediaSession] Metadata updated:', currentAudioStop.title);
  }, [tour, currentAudioStop]);

  // Media Session playback state - keep in sync with isPlaying
  // IMPORTANT: Never set to 'none' as this can cause iOS to drop the session
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

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
      // Handler uses current state via refs/closure
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      // Handler uses current state via refs/closure
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

  // Separate effect to update next/prev handlers when navigation state changes
  // We need refs to track current navigation state for the handlers
  const canGoNextRef = useRef(canGoNext);
  const canGoPrevRef = useRef(canGoPrev);
  const handleNextStopRef = useRef(handleNextStop);
  const handlePrevStopRef = useRef(handlePrevStop);
  
  useEffect(() => {
    canGoNextRef.current = canGoNext;
    canGoPrevRef.current = canGoPrev;
    handleNextStopRef.current = handleNextStop;
    handlePrevStopRef.current = handlePrevStop;
  }, [canGoNext, canGoPrev, handleNextStop, handlePrevStop]);

  // Update the nexttrack/previoustrack handlers to use the refs
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!mediaSessionInitialized) return;
    
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
  }, [canGoNext, canGoPrev]);

  // Media Session position state update - throttled to prevent time reset issues
  const lastPositionUpdateRef = useRef(0);
  const lastPositionValuesRef = useRef({ duration: 0, position: 0 });
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;
    if (!isPlaying) return; // Only update position when playing
    
    const duration = audioPlayer.duration;
    const currentTime = audioPlayer.currentTime;
    const now = Date.now();
    
    // Only update if more than 2 seconds have passed AND values have changed significantly
    const timeSinceLastUpdate = now - lastPositionUpdateRef.current;
    const durationChanged = Math.abs(duration - lastPositionValuesRef.current.duration) > 0.5;
    const positionChanged = Math.abs(currentTime - lastPositionValuesRef.current.position) > 2;
    
    if (timeSinceLastUpdate < 2000 && !durationChanged) return;
    
    if (duration > 0 && isFinite(duration) && isFinite(currentTime) && currentTime >= 0) {
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
        // Ignore position state errors
      }
    }
  }, [audioPlayer.duration, audioPlayer.currentTime, isPlaying]);

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
    // Only auto-play if this is the first time starting (no current stop set)
    if (!currentStopId) {
      const firstAudioStop = tour.stops.find(s => s.type === 'audio');
      if (firstAudioStop) {
        setCurrentStopId(firstAudioStop.id);
        setIsPlaying(true);
        setIsMiniPlayerExpanded(true); // Always expand player on fresh start
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

  // Loading state
  if (tourLoading || languagesLoading) {
    return (
      <MobileFrame>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
            <p className="text-zinc-600">Loading tour data...</p>
          </div>
        </div>
      </MobileFrame>
    );
  }

  // Error state
  if (tourError || languagesError) {
    return (
      <MobileFrame>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Data</h2>
            <p className="text-zinc-600 mb-4">
              {tourError?.message || languagesError?.message || 'Failed to load tour data'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </MobileFrame>
    );
  }

  if (!tour || !languages || !selectedLanguage) return null;

  return (
    <MobileFrame>
      <RatingProvider>
        <div className="relative w-full h-full bg-white overflow-hidden flex flex-col font-sans text-base" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
          {/* Main Content Area */}
          <div className={`flex-1 relative overflow-hidden ${hasStarted ? 'bg-white' : 'bg-black'}`}>
            <TourStart
              tour={tour}
              onOpenRating={() => setActiveSheet('RATING')}
              onOpenLanguage={() => setActiveSheet('LANGUAGE')}
              sheetY={sheetY}
              collapsedY={collapsedY}
              isVisible={true}
              selectedLanguage={selectedLanguage}
              onStart={handleStartTour}
              availableLanguages={languages}
              onLanguageChange={handleLanguageChange}
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
      </RatingProvider>
    </MobileFrame>
  );
};

export default App;