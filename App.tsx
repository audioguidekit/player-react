import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { SheetType, Language } from './types';
import { RatingSheet } from './components/sheets/RatingSheet';
import { LanguageSheet } from './components/sheets/LanguageSheet';
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
    if (tour.offlineAvailable && !downloadManager.isDownloaded) {
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

  const handleStopClick = (clickedStopId: string) => {
    // Start playing the clicked stop
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

  // Auto-advance to next track when audio ends (without navigation)
  const handleAudioEnded = useCallback(async () => {
    if (!currentStopId || !tour) return;

    // Show completion animation
    setIsAudioCompleting(true);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsAudioCompleting(false);

    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex !== -1) {
      // Find next audio stop
      const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');
      if (nextAudioStop) {
        setCurrentStopId(nextAudioStop.id);
        setIsPlaying(true); // Auto-play next track
        // Don't navigate - keep user where they are
      } else {
        // No next track - stop playing
        setIsPlaying(false);
      }
    }
  }, [currentStopId, tour]);

  // Control audio playback (for audio player controls)
  const handleNextStop = useCallback(() => {
    if (!currentStopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex !== -1) {
      // Find next audio stop
      const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');
      if (nextAudioStop) {
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

  // Handle audio progress - mark stop as completed at 85%
  const handleAudioProgress = useCallback((currentTime: number, duration: number, percentComplete: number) => {
    if (!currentStopId) return;

    // Mark as completed when reaching 85%
    if (percentComplete >= 100 && !progressTracking.isStopCompleted(currentStopId)) {
      console.log(`Stop ${currentStopId} completed at ${percentComplete}%`);
      progressTracking.markStopCompleted(currentStopId);
    }

    // Update position for resume
    progressTracking.updateStopPosition(currentStopId, currentTime);

    // Track maximum progress reached (prevents progress bar from decreasing on rewind)
    progressTracking.updateStopMaxProgress(currentStopId, percentComplete);
  }, [currentStopId, progressTracking]);

  // Audio Player
  const audioPlayer = useAudioPlayer({
    audioUrl: currentAudioStop?.audioFile || null,
    isPlaying,
    onEnded: handleAudioEnded,
    onProgress: handleAudioProgress,
  });

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
      </div>
    </div>
  );
};

export default App;