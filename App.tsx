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
import { useMediaSession } from './hooks/useMediaSession';
import { TourProgressTracker } from './components/TourProgressTracker';
import { ThemeColorSync } from './components/ThemeColorSync';

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

  // Local state for app flow - MUST be declared before callbacks that use them
  const [hasStarted, setHasStarted] = useState(false);
  const [scrollToStopId, setScrollToStopId] = useState<{ id: string; timestamp: number } | null>(null);
  const [hasShownCompletionSheet, setHasShownCompletionSheet] = useState(false);

  // Resume tracking refs
  const resumeStopIdRef = useRef<string | null>(null);
  const resumePositionRef = useRef<number>(0);
  const pendingSeekRef = useRef<number | null>(null);

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
    onTrackChange: handleTrackChange
  });

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

  // Eager asset preloading hook
  const { assetsReady } = useEagerAssetPreloader({ tour });

  // Deep link hook
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

  // Media Session hook
  useMediaSession({
    tour,
    currentAudioStop,
    isPlaying,
    isTransitioning,
    isSwitchingTracks,
    canGoNext,
    canGoPrev,
    handleNextStop,
    handlePrevStop,
    setIsPlaying,
    audioPlayer,
  });

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
  }, [tour, currentStopId, setCurrentStopId, setIsPlaying, setIsMiniPlayerExpanded, setHasStarted, setAllowAutoPlay]);

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
      setCurrentStopId(firstAudioStop.id);
      setIsPlaying(true);
      setHasStarted(true);
      setAllowAutoPlay(true);
    }
    setActiveSheet('NONE');
  }, [tour, progressTracking, setCurrentStopId, setIsPlaying, setHasStarted, setAllowAutoPlay, setHasShownCompletionSheet, setActiveSheet]);

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
      <ThemeColorSync />
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
        <div className="relative w-full h-full overflow-hidden flex flex-col font-sans text-base" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
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