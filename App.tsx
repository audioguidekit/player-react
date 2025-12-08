import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { MobileFrame } from './components/shared/MobileFrame';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useDownloadManager } from './hooks/useDownloadManager';
import { useTourNavigation } from './hooks/useTourNavigation';
import { RatingProvider } from './context/RatingContext';

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
      // Auto-scroll to the new track
      setScrollToStopId(stopId);
    }
  });

  // Local state for app flow
  const [hasStarted, setHasStarted] = useState(false);
  const [scrollToStopId, setScrollToStopId] = useState<string | null>(null);
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

  // Media Session metadata
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour || !currentAudioStop) return;

    const artworkType = getArtworkType(currentAudioStop.image);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentAudioStop.title,
      artist: tour.title,
      album: 'Audio Tour',
      artwork: currentAudioStop.image
        ? [{
            src: currentAudioStop.image,
            sizes: '512x512',
            ...(artworkType ? { type: artworkType } : {})
          }]
        : [],
    });
  }, [tour, currentAudioStop]);

  // Media Session action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audioEl = audioPlayer.audioElement;
    if (!audioEl) return;

    const safePlay = () => {
      audioEl.play().catch((err) => console.error('MediaSession play failed', err));
    };
    const safePause = () => audioEl.pause();

    navigator.mediaSession.setActionHandler('play', safePlay);
    navigator.mediaSession.setActionHandler('pause', safePause);
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (canGoNext) {
        handleNextStop();
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (canGoPrev) {
        handlePrevStop();
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const seekOffset = details.seekOffset ?? 10;
      audioEl.currentTime = Math.min(audioEl.currentTime + seekOffset, audioEl.duration || audioEl.currentTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const seekOffset = details.seekOffset ?? 10;
      audioEl.currentTime = Math.max(audioEl.currentTime - seekOffset, 0);
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
    };
  }, [audioPlayer.audioElement, canGoNext, canGoPrev, handleNextStop, handlePrevStop]);

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

  // Auto-scroll
  useEffect(() => {
    if (currentStopId && hasStarted) {
      setScrollToStopId(currentStopId);
    }
  }, [currentStopId, hasStarted]);

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
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700"
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
                  scrollToStopId={scrollToStopId}
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
                    if (currentStopId) setScrollToStopId(currentStopId);
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