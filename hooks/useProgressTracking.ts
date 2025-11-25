import { useState, useEffect, useCallback } from 'react';

interface StopProgress {
  isCompleted: boolean;
  lastPosition: number;
}

interface TourProgress {
  stops: Record<string, StopProgress>;
}

const STORAGE_KEY_PREFIX = 'tour_progress_';

/**
 * Hook to manage tour progress tracking
 * Tracks completion state and playback position per stop
 */
export const useProgressTracking = (tourId: string) => {
  const [progress, setProgress] = useState<TourProgress>({ stops: {} });

  const storageKey = `${STORAGE_KEY_PREFIX}${tourId}`;

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, [storageKey]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [progress, storageKey]);

  // Mark a stop as completed
  const markStopCompleted = useCallback((stopId: string) => {
    setProgress(prev => ({
      ...prev,
      stops: {
        ...prev.stops,
        [stopId]: {
          ...prev.stops[stopId],
          isCompleted: true,
          lastPosition: 0
        }
      }
    }));
  }, []);

  // Update last playback position for a stop
  const updateStopPosition = useCallback((stopId: string, position: number) => {
    setProgress(prev => ({
      ...prev,
      stops: {
        ...prev.stops,
        [stopId]: {
          isCompleted: prev.stops[stopId]?.isCompleted || false,
          lastPosition: position
        }
      }
    }));
  }, []);

  // Check if a stop is completed
  const isStopCompleted = useCallback((stopId: string): boolean => {
    return progress.stops[stopId]?.isCompleted || false;
  }, [progress]);

  // Get last position for a stop
  const getStopPosition = useCallback((stopId: string): number => {
    return progress.stops[stopId]?.lastPosition || 0;
  }, [progress]);

  // Calculate tour completion percentage
  const getTourCompletionPercentage = useCallback((totalStops: number): number => {
    const completedCount = Object.values(progress.stops).filter(s => s.isCompleted).length;
    return totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;
  }, [progress]);

  // Get count of completed stops
  const getCompletedStopsCount = useCallback((): number => {
    return Object.values(progress.stops).filter(s => s.isCompleted).length;
  }, [progress]);

  return {
    markStopCompleted,
    updateStopPosition,
    isStopCompleted,
    getStopPosition,
    getTourCompletionPercentage,
    getCompletedStopsCount
  };
};
