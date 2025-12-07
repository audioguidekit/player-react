import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { SheetType, Language } from './types';
import { RatingSheet } from './components/sheets/RatingSheet';
import { LanguageSheet } from './components/sheets/LanguageSheet';
import { TourCompleteSheet } from './components/sheets/TourCompleteSheet';
import { TourStart } from './screens/TourStart';
import { TourDetail } from './screens/TourDetail';
import { MainSheet } from './components/MainSheet';
import { StartCard } from './components/StartCard';
import { MiniPlayer } from './components/MiniPlayer';
import { useTourData, useLanguages } from './hooks/useDataLoader';
import { DEFAULT_TOUR_ID } from './src/config/tours';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useDownloadManager } from './hooks/useDownloadManager';

const App: React.FC = () => {
  // Get route params
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();

  // Load data dynamically
  const { data: tour, loading: tourLoading, error: tourError } = useTourData(tourId || DEFAULT_TOUR_ID);
  const { data: languages, loading: languagesLoading, error: languagesError } = useLanguages();

  // Progress tracking
  const progressTracking = useProgressTracking(tourId || DEFAULT_TOUR_ID);

  // Download manager for offline support
  const downloadManager = useDownloadManager(tour, {
    onDownloadComplete: () => {
      // Automatically start the tour when download completes
      handleStartTour();
    }
  });

  // Navigation & State
  const [activeSheet, setActiveSheet] = useState<SheetType>('NONE');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  // Offline Ready Indicator Logic
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if already controlled
      if (navigator.serviceWorker.controller) {
        setShowOfflineReady(true);
        const timer = setTimeout(() => setShowOfflineReady(false), 3000);
        return () => clearTimeout(timer);
      }

      // Wait for ready
      navigator.serviceWorker.ready.then(() => {
        setShowOfflineReady(true);
        const timer = setTimeout(() => setShowOfflineReady(false), 3000);
        return () => clearTimeout(timer);
      });
    }
  }, []);

  // Set default language when languages are loaded
  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguage) {
      // Default to English (index 1) or first language
      const defaultLang = languages.find(l => l.code === 'en') || languages[0];
      setSelectedLanguage(defaultLang);
    }
  }, [languages, selectedLanguage]);

  // Main Sheet State (Collapsed vs Expanded)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Shared Animation State
  const sheetY = useMotionValue(0);
  const [collapsedY, setCollapsedY] = useState(0);

  // Tour State
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);
  const [scrollToStopId, setScrollToStopId] = useState<string | null>(null);
  const [hasShownCompletionSheet, setHasShownCompletionSheet] = useState(false);

  // Tour Progress (Percentage) - Animated in TourDetail
  const [tourProgress, setTourProgress] = useState(0);

  // Mini Player State - persists across navigation
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(true);

  // Derived State
  const currentStop = currentStopId && tour ? tour.stops.find(s => s.id === currentStopId) : undefined;

  // Get current audio stop (type-safe)
  const currentAudioStop = currentStop?.type === 'audio' ? currentStop : undefined;

  // Show mini player only in tour detail (not on start screen)
  const shouldShowMiniPlayer = !!currentAudioStop && hasStarted;

  // --- Handlers ---

  const handleStartTour = () => {
    if (!tour || tour.stops.length === 0) return;

    // If tour requires offline download, check if it's downloaded
    // Only enforce download if offlineAvailable is explicitly true
    if (tour.offlineAvailable === true && !downloadManager.isDownloaded) {
      console.log('Tour requires offline download. Please download first.');
      return;
    }

    setHasStarted(true);

    // Only auto-play if this is the first time starting (no current stop set)
    // If returning from start screen, preserve the play/pause state
    if (!currentStopId) {
      // First time starting - set first audio stop and auto-play
      const firstAudioStop = tour.stops.find(s => s.type === 'audio');
      if (firstAudioStop) {
        setCurrentStopId(firstAudioStop.id);
        setIsPlaying(true);
      }
    }
    // If currentStopId already exists, we're returning - don't change isPlaying state
  };

  const handleBackToStart = () => {
    // Go back to start screen (audio continues playing if it was playing)
    setHasStarted(false);
  };

  const handleResetTour = () => {
    if (!tour || tour.stops.length === 0) return;

    // Reset all progress
    progressTracking.resetProgress();
    setIsTransitioning(false);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    // Reset completion sheet flag
    setHasShownCompletionSheet(false);

    // Start the tour from the beginning
    const firstAudioStop = tour.stops.find(s => s.type === 'audio');
    if (firstAudioStop) {
      setCurrentStopId(firstAudioStop.id);
      setIsPlaying(true);
      setHasStarted(true);
    }
  };

  const handleStopClick = (clickedStopId: string) => {
    // Start playing the clicked stop
    setIsTransitioning(false);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    setCurrentStopId(clickedStopId);
    setIsPlaying(true);
  };

  const handleStopPlayPause = (stopId: string) => {
    if (currentStopId === stopId) {
      // Same stop - toggle play/pause
      setIsPlaying(!isPlaying);
    } else {
      // Different stop - switch to it and start playing
      setCurrentStopId(stopId);
      setIsPlaying(true);
    }
  };

  const [isAudioCompleting, setIsAudioCompleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSwitchingTracks, setIsSwitchingTracks] = useState(false);
  const transitionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-advance to next track when audio ends (without navigation)
  const handleAudioEnded = useCallback(async () => {
    if (!currentStopId || !tour) return;

    // IMPORTANT: If we are already in transition mode and audio ended, 
    // it likely means the transition audio finished BEFORE the timeout.
    // In this case, we just assume the timeout will pick it up or we let silence play until timeout.
    // For simplicity, we just do nothing here and let the timeout handle the actual switch.
    if (isTransitioning) {
      console.log('Transition audio finished early. Waiting for visual transition timeout.');
      return;
    }

    // Phase 1: Track just finished
    // Show completion animation
    setIsAudioCompleting(true);

    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex !== -1) {
      // Find next audio stop
      const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');

      if (nextAudioStop) {
        // If there is a transition audio, start playing it IMMEDIATELY
        if (tour.transitionAudio) {
          console.log('Starting transition audio concurrently with checkmark...');
          setIsTransitioning(true);
          // This will trigger the audio player to switch source and play
        }

        // Start a 1.5s timeout to handle the actual track switch
        // This coordinates the checkmark animation AND the transition audio limit
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

        transitionTimeoutRef.current = setTimeout(() => {
          console.log('Transition/Animation timeout finished. Moving to next track.');
          setIsAudioCompleting(false);

          setCurrentStopId(nextAudioStop.id);
          setIsPlaying(true); // Auto-play next track

          // Switch track state management
          setIsSwitchingTracks(true);
          setIsTransitioning(false);

          // Allow time for new track to load and progress to reset to 0
          setTimeout(() => {
            setIsSwitchingTracks(false);
          }, 150);
        }, 1500);

      } else {
        // No next track - just show animation then stop
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsAudioCompleting(false);
        setIsPlaying(false);
      }
    }
  }, [currentStopId, tour, isTransitioning]);

  // Control audio playback (for audio player controls)
  const handleNextStop = useCallback(() => {
    if (!currentStopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex !== -1) {
      // Find next audio stop
      const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');
      if (nextAudioStop) {
        setIsTransitioning(false);
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        setCurrentStopId(nextAudioStop.id);
        setIsPlaying(true); // Auto-play next track
      }
    }
  }, [currentStopId, tour]);

  const handlePrevStop = () => {
    if (!currentStopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex > 0) {
      // Find previous audio stop
      const prevAudioStop = tour.stops.slice(0, currentIndex).reverse().find(s => s.type === 'audio');
      if (prevAudioStop) {
        setIsTransitioning(false);
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        setCurrentStopId(prevAudioStop.id);
        setIsPlaying(true);
      }
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAudioComplete = () => {
    // When audio completes for the first time, animate the progress bar
    if (tourProgress === 0) {
      setTourProgress(55); // Update to mock 55%
    }
  };

  const closeSheet = () => setActiveSheet('NONE');

  // Handle audio progress - mark stop as completed at 100%
  const handleAudioProgress = useCallback((id: string | undefined, currentTime: number, duration: number, percentComplete: number) => {
    // Ignore progress during transition
    if (isTransitioning) return;

    // Race condition protection: ensure we're processing the current stop
    if (id && id !== currentStopId) {
      console.log(`Ignoring progress for ${id} while current is ${currentStopId}`);
      return;
    }

    if (!currentStopId) return;

    // Mark as completed when reaching 100%
    if (percentComplete >= 100 && !progressTracking.isStopCompleted(currentStopId)) {
      console.log(`Stop ${currentStopId} completed at ${percentComplete}%`);
      progressTracking.markStopCompleted(currentStopId);
    }

    // Update position for resume
    progressTracking.updateStopPosition(currentStopId, currentTime);

    // Track maximum progress reached (prevents progress bar from decreasing on rewind)
    progressTracking.updateStopMaxProgress(currentStopId, percentComplete);
  }, [currentStopId, progressTracking, isTransitioning]);

  // Audio Player
  const audioPlayer = useAudioPlayer({
    audioUrl: isTransitioning && tour?.transitionAudio
      ? tour.transitionAudio
      : (currentAudioStop?.audioFile || null),
    id: currentStopId || undefined,
    isPlaying,
    onEnded: handleAudioEnded,
    onProgress: handleAudioProgress,
  });

  // Auto-scroll to current stop when it changes
  useEffect(() => {
    if (currentStopId && hasStarted) {
      setScrollToStopId(currentStopId);
    }
  }, [currentStopId, hasStarted]);

  // Check for tour completion
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
      <div className="min-h-screen bg-zinc-800 flex items-center justify-center p-0 md:p-8 font-sans">
        <div className="w-full max-w-[400px] h-[100dvh] md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
            <p className="text-zinc-600">Loading tour data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (tourError || languagesError) {
    return (
      <div className="min-h-screen bg-zinc-800 flex items-center justify-center p-0 md:p-8 font-sans">
        <div className="w-full max-w-[400px] h-[100dvh] md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl flex items-center justify-center">
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
      </div>
    );
  }

  // Data not available
  if (!tour || !languages || !selectedLanguage) {
    return null;
  }

  return (
    <div className="md:min-h-screen bg-white md:bg-zinc-800 flex md:items-center md:justify-center p-0 md:p-8 font-sans" style={{ height: '100dvh' }}>
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[400px] md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col" style={{ height: '100%' }}>

        {/* Main Content Area */}
        <div className={`flex-1 relative overflow-hidden ${hasStarted ? 'bg-white' : 'bg-black'}`}>
          {/* Background Image - Always Visible */}
          <TourStart
            tour={tour}
            onOpenRating={() => setActiveSheet('RATING')}
            onOpenLanguage={() => setActiveSheet('LANGUAGE')}
            sheetY={sheetY}
            collapsedY={collapsedY}
            isVisible={true}
          />

          {/* Main Sheet - Draggable bottom sheet that expands to fullscreen */}
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
                tourProgress={progressTracking.getRealtimeProgressPercentage(
                  tour.stops,
                  currentStopId,
                  audioPlayer.progress
                )}
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
                tourProgress={progressTracking.getRealtimeProgressPercentage(
                  tour.stops,
                  currentStopId,
                  audioPlayer.progress
                )}
                consumedMinutes={progressTracking.getConsumedMinutes(
                  tour.stops,
                  currentStopId,
                  audioPlayer.progress
                ).consumed}
                totalMinutes={progressTracking.getConsumedMinutes(
                  tour.stops,
                  currentStopId,
                  audioPlayer.progress
                ).total}
                completedStopsCount={progressTracking.getCompletedStopsCount()}
                isStopCompleted={progressTracking.isStopCompleted}
                scrollToStopId={scrollToStopId}
                onScrollComplete={() => setScrollToStopId(null)}
              />
            }
          />

          {/* Global Floating Mini Player */}
          <AnimatePresence>
            {shouldShowMiniPlayer && currentAudioStop && (
              <MiniPlayer
                currentStop={currentAudioStop}
                isPlaying={isPlaying}
                onTogglePlay={handlePlayPause}
                onRewind={() => audioPlayer.skipBackward(15)}
                onForward={() => audioPlayer.skipForward(15)}
                onClick={() => {
                  if (currentAudioStop) {
                    setScrollToStopId(currentAudioStop.id);
                    // If sheet is collapsed, expand it to show the list
                    if (!hasStarted) {
                      handleStartTour();
                    }
                  }
                }}
                onEnd={handleAudioComplete}
                progress={audioPlayer.progress}
                isExpanded={isMiniPlayerExpanded}
                onToggleExpanded={setIsMiniPlayerExpanded}
                isCompleting={isAudioCompleting}
                isTransitioning={isTransitioning || isSwitchingTracks}
                onNextTrack={handleNextStop}
                onPrevTrack={handlePrevStop}
                canGoNext={(() => {
                  if (!currentStopId || !tour) return false;
                  const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
                  const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');
                  return !!nextAudioStop;
                })()}
                canGoPrev={(() => {
                  if (!currentStopId || !tour) return false;
                  const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
                  const prevAudioStop = tour.stops.slice(0, currentIndex).reverse().find(s => s.type === 'audio');
                  return !!prevAudioStop;
                })()}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Global Sheets */}
        <RatingSheet
          isOpen={activeSheet === 'RATING'}
          onClose={closeSheet}
        />

        <LanguageSheet
          isOpen={activeSheet === 'LANGUAGE'}
          onClose={closeSheet}
          selectedLanguage={selectedLanguage}
          languages={languages}
          onSelect={setSelectedLanguage}
        />

        <TourCompleteSheet
          isOpen={activeSheet === 'TOUR_COMPLETE'}
          onClose={closeSheet}
          onRateTour={() => setActiveSheet('RATING')}
        />

        {/* Debug: Offline Ready Indicator */}
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-[100] transition-opacity duration-300 pointer-events-none ${showOfflineReady ? 'opacity-100' : 'opacity-0'}`}
        >
          Ready for Offline ✈️
        </div>
      </div>
    </div>
  );
};

export default App;