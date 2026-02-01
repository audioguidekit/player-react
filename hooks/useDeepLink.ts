import { useEffect, useRef } from 'react';
import { TourData } from '../types';

type ProgressTracking = ReturnType<typeof import('./useProgressTracking').useProgressTracking>;

export interface UseDeepLinkProps {
  urlStopId: string | undefined;
  tour: TourData | null;
  currentStopId: string | null;
  setCurrentStopId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMiniPlayerExpanded: (expanded: boolean) => void;
  setAllowAutoPlay: (allow: boolean) => void;
  setHasStarted: (started: boolean) => void;
  setScrollToStopId: (id: { id: string; timestamp: number } | null) => void;
  progressTracking: ProgressTracking;
  resumeStopIdRef: React.MutableRefObject<string | null>;
  resumePositionRef: React.MutableRefObject<number>;
  pendingSeekRef: React.MutableRefObject<number | null>;
}

/**
 * Hook to handle deep links to specific stops from URL.
 * Only processes the INITIAL deep link on page load - ignores subsequent URL changes
 * (which are triggered by internal navigation as stops progress).
 * Validates the stop exists and is an audio stop, then navigates to it.
 * Also restores saved playback position if available.
 */
export const useDeepLink = ({
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
}: UseDeepLinkProps) => {
  // Track if we've already processed the initial deep link
  // Once processed (or if there was no deep link), we ignore all URL changes
  const hasProcessedInitialLinkRef = useRef(false);

  useEffect(() => {
    // Only process deep link ONCE on initial load
    if (hasProcessedInitialLinkRef.current) return;

    // Wait for tour to load before making any decisions
    if (!tour) return;

    // If no stopId in URL, mark as processed and exit (no deep link to handle)
    if (!urlStopId) {
      hasProcessedInitialLinkRef.current = true;
      return;
    }

    // Skip if we're already on this stop
    if (currentStopId === urlStopId) {
      hasProcessedInitialLinkRef.current = true;
      return;
    }

    // Find the stop in the tour
    const targetStop = tour.stops.find(s => s.id === urlStopId);

    // Validate stop exists
    if (!targetStop) {
      console.warn(`[DEEP_LINK] Stop ${urlStopId} not found in tour ${tour.id}, falling back to normal behavior`);
      hasProcessedInitialLinkRef.current = true;
      return;
    }

    // Validate stop is an audio stop (only audio stops can be deep linked)
    if (targetStop.type !== 'audio') {
      console.warn(`[DEEP_LINK] Stop ${urlStopId} is not an audio stop (type: ${targetStop.type}), falling back to normal behavior`);
      hasProcessedInitialLinkRef.current = true;
      return;
    }

    // Deep link is valid - navigate to the stop
    console.log(`[DEEP_LINK] Navigating to stop ${urlStopId}: ${targetStop.title}`);

    // Mark as processed so we don't react to future URL changes
    hasProcessedInitialLinkRef.current = true;

    // Set up the stop
    setCurrentStopId(urlStopId);
    setHasStarted(true);
    setIsPlaying(true);
    setIsMiniPlayerExpanded(true);
    setAllowAutoPlay(true);

    // Trigger scroll to the stop after sheet expands
    // Use a delay to ensure the MainSheet animation completes and DOM is ready
    // Spring animation with stiffness 280 typically completes in ~400-600ms
    setTimeout(() => {
      setScrollToStopId({ id: urlStopId, timestamp: Date.now() });
      console.log(`[DEEP_LINK] Scrolling to stop ${urlStopId}`);
    }, 600); // Delay to allow sheet expansion animation to complete

    // Check if there's a saved position for this stop and queue resume
    const savedPosition = progressTracking.getStopPosition(urlStopId);
    if (savedPosition > 0) {
      resumeStopIdRef.current = urlStopId;
      resumePositionRef.current = savedPosition;
      pendingSeekRef.current = savedPosition;
      console.log(`[DEEP_LINK] Resuming from saved position: ${savedPosition}s`);
    } else {
      // No saved position, start from beginning
      resumeStopIdRef.current = null;
      resumePositionRef.current = 0;
      pendingSeekRef.current = null;
    }
  }, [
    urlStopId,
    tour,
    currentStopId,
    progressTracking,
    setCurrentStopId,
    setIsPlaying,
    setIsMiniPlayerExpanded,
    setAllowAutoPlay,
    setHasStarted,
    setScrollToStopId,
    resumeStopIdRef,
    resumePositionRef,
    pendingSeekRef,
  ]);
};
