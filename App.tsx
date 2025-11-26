import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, useMotionValue } from 'framer-motion';
import { SheetType, Language } from './types';
import { RatingSheet } from './components/sheets/RatingSheet';
import { LanguageSheet } from './components/sheets/LanguageSheet';
import { TourStart } from './screens/TourStart';
import { TourDetail } from './screens/TourDetail';
import { StopDetail } from './screens/StopDetail';
import { MainSheet } from './components/MainSheet';
import { StartCard } from './components/StartCard';
import { MiniPlayer } from './components/MiniPlayer';
import { useTourData, useLanguages } from './hooks/useDataLoader';
import { DEFAULT_TOUR_ID } from './src/config/tours';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useProgressTracking } from './hooks/useProgressTracking';

const App: React.FC = () => {
  // Get route params
  const { tourId, stopId } = useParams<{ tourId: string; stopId?: string }>();
  const navigate = useNavigate();

  // Load data dynamically
  const { data: tour, loading: tourLoading, error: tourError } = useTourData(tourId || DEFAULT_TOUR_ID);
  const { data: languages, loading: languagesLoading, error: languagesError } = useLanguages();

  // Progress tracking
  const progressTracking = useProgressTracking(tourId || DEFAULT_TOUR_ID);

  // Navigation & State
  const [showStopDetail, setShowStopDetail] = useState(false);
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

  // Sync URL params with state
  useEffect(() => {
    if (stopId) {
      // URL has a stopId - show stop detail (but don't change audio)
      setShowStopDetail(true);
      setHasStarted(true);
      setIsSheetExpanded(true);
    } else if (stopId === undefined && showStopDetail) {
      // URL changed to remove stopId - close stop detail
      setShowStopDetail(false);
    }
  }, [stopId, showStopDetail]);

  // Main Sheet State (Collapsed vs Expanded)
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  
  // Shared Animation State
  const sheetY = useMotionValue(0);
  const [collapsedY, setCollapsedY] = useState(0);
  
  // Tour State
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);
  
  // Tour Progress (Percentage) - Animated in TourDetail
  const [tourProgress, setTourProgress] = useState(0);

  // Derived State
  const currentStop = currentStopId && tour ? tour.stops.find(s => s.id === currentStopId) : undefined;

  // Get current audio stop (type-safe)
  const currentAudioStop = currentStop?.type === 'audio' ? currentStop : undefined;

  // Logic to hide mini player on tour start (collapsed sheet) to avoid redundancy with "Resume Tour" button
  // Show only when sheet is expanded (Tour Detail) or when Stop Detail is open.
  const shouldShowMiniPlayer = !!currentAudioStop && (isSheetExpanded || showStopDetail);

  // --- Handlers ---

  const handleStartTour = () => {
    if (!tour || tour.stops.length === 0) return;

    setHasStarted(true);
    // Start first audio stop automatically
    const firstAudioStop = tour.stops.find(s => s.type === 'audio');
    if (firstAudioStop) {
      setCurrentStopId(firstAudioStop.id);
      setIsPlaying(true);
    }

    // Expand the sheet to show details
    setIsSheetExpanded(true);
  };

  const handleViewDetails = () => {
    setIsSheetExpanded(true);
  };

  const handleStopClick = (clickedStopId: string) => {
    // Only navigate - don't change audio
    navigate(`/tour/${tourId}/stop/${clickedStopId}`);
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

  // Auto-advance to next track when audio ends (without navigation)
  const handleAudioEnded = useCallback(() => {
    if (!currentStopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex !== -1) {
      // Find next audio stop
      const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');
      if (nextAudioStop) {
        setCurrentStopId(nextAudioStop.id);
        setIsPlaying(true); // Auto-play next track
        // Don't navigate - keep user where they are
      }
    }
  }, [currentStopId, tour]);

  // Navigate to next/prev stop detail (for chevron buttons - no audio change)
  const handleNextStopDetail = useCallback(() => {
    if (!stopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === stopId);
    if (currentIndex !== -1 && currentIndex < tour.stops.length - 1) {
      const nextStopId = tour.stops[currentIndex + 1].id;
      navigate(`/tour/${tourId}/stop/${nextStopId}`);
    }
  }, [stopId, tour, tourId, navigate]);

  const handlePrevStopDetail = useCallback(() => {
    if (!stopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === stopId);
    if (currentIndex > 0) {
      const prevStopId = tour.stops[currentIndex - 1].id;
      navigate(`/tour/${tourId}/stop/${prevStopId}`);
    }
  }, [stopId, tour, tourId, navigate]);

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
        navigate(`/tour/${tourId}/stop/${nextAudioStop.id}`);
      }
    }
  }, [currentStopId, tour, tourId, navigate]);

  const handlePrevStop = () => {
    if (!currentStopId || !tour) return;
    const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
    if (currentIndex > 0) {
      // Find previous audio stop
      const prevAudioStop = tour.stops.slice(0, currentIndex).reverse().find(s => s.type === 'audio');
      if (prevAudioStop) {
        setCurrentStopId(prevAudioStop.id);
        setIsPlaying(true);
        navigate(`/tour/${tourId}/stop/${prevAudioStop.id}`);
      }
    }
  };

  const handleMiniPlayerExpand = () => {
    if (currentStopId) {
      navigate(`/tour/${tourId}/stop/${currentStopId}`);
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
    if (percentComplete >= 85 && !progressTracking.isStopCompleted(currentStopId)) {
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
    <div className="min-h-screen bg-zinc-800 flex items-center justify-center p-0 md:p-8 font-sans">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[400px] h-[100dvh] md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
           {/* Background Layer (Tour Start Image) */}
           <TourStart
             tour={tour}
             onOpenRating={() => setActiveSheet('RATING')}
             onOpenLanguage={() => setActiveSheet('LANGUAGE')}
             sheetY={sheetY}
             collapsedY={collapsedY}
           />

          {/* Main Interactive Sheet */}
          <MainSheet
            isExpanded={isSheetExpanded}
            onExpand={() => setIsSheetExpanded(true)}
            onCollapse={() => setIsSheetExpanded(false)}
            sheetY={sheetY}
            onLayoutChange={setCollapsedY}
            startContent={
              <StartCard
                tour={tour}
                hasStarted={hasStarted}
                onAction={hasStarted ? handleViewDetails : handleStartTour}
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
              />
            }
          />

          {/* Stop Detail - Full Screen Overlay */}
          <AnimatePresence>
            {showStopDetail && stopId && (
              <StopDetail
                tour={tour}
                currentStopId={stopId}
                isPlaying={isPlaying && currentStopId === stopId}
                isStopCompleted={progressTracking.isStopCompleted(stopId)}
                onPlayPause={() => handleStopPlayPause(stopId)}
                onMinimize={() => navigate(`/tour/${tourId}`)}
                onNext={handleNextStopDetail}
                onPrev={handlePrevStopDetail}
              />
            )}
          </AnimatePresence>

          {/* Global Floating Mini Player */}
          <AnimatePresence>
            {shouldShowMiniPlayer && currentAudioStop && (
              <MiniPlayer
                currentStop={currentAudioStop}
                isPlaying={isPlaying}
                onTogglePlay={handlePlayPause}
                onRewind={() => audioPlayer.skipBackward(15)}
                onForward={() => audioPlayer.skipForward(15)}
                onClick={handleMiniPlayerExpand}
                onEnd={handleAudioComplete}
                progress={audioPlayer.progress}
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