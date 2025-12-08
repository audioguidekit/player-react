import { useState, useEffect, useCallback } from 'react';
import { Stop, AudioStop } from '../types';

interface StopProgress {
  isCompleted: boolean;
  lastPosition: number;
  maxPercentageReached?: number; // Track maximum progress to prevent decreasing
}

interface TourProgress {
  stops: Record<string, StopProgress>;
}

const STORAGE_KEY_PREFIX = 'tour_progress_';

/**
 * Parse duration string from tour data.
 * Handles new format "M:SS" (e.g., "1:30 mins" -> 1.5) and old format "M mins" (e.g., "2 mins" -> 2).
 */
const parseDurationMinutes = (durationString: string): number => {
  // New format: "1:30 mins"
  const newFormatMatch = durationString.match(/(\d+):(\d+)/);
  if (newFormatMatch) {
    const minutes = parseInt(newFormatMatch[1], 10);
    const seconds = parseInt(newFormatMatch[2], 10);
    return minutes + seconds / 60;
  }

  // Fallback for old format: "5 min"
  const oldFormatMatch = durationString.match(/(\d+)\s*min/i);
  if (oldFormatMatch) {
    return parseInt(oldFormatMatch[1], 10);
  }

  return 0;
};

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
          lastPosition: position,
          maxPercentageReached: prev.stops[stopId]?.maxPercentageReached
        }
      }
    }));
  }, []);

  // Update maximum percentage reached for a stop (to prevent progress decrease)
  const updateStopMaxProgress = useCallback((stopId: string, percentComplete: number) => {
    setProgress(prev => {
      const currentMax = prev.stops[stopId]?.maxPercentageReached || 0;
      // Only update if new percentage is higher
      if (percentComplete > currentMax) {
        return {
          ...prev,
          stops: {
            ...prev.stops,
            [stopId]: {
              ...prev.stops[stopId],
              isCompleted: prev.stops[stopId]?.isCompleted || false,
              lastPosition: prev.stops[stopId]?.lastPosition || 0,
              maxPercentageReached: percentComplete
            }
          }
        };
      }
      return prev;
    });
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

  // Calculate realtime progress with duration-weighting
  const getRealtimeProgressPercentage = useCallback((
    tourStops: Stop[],
    currentStopId: string | null,
    currentStopProgress: number
  ): number => {
    // Filter only audio stops (stops with duration)
    const audioStops = tourStops.filter((stop): stop is AudioStop => stop.type === 'audio');

    // Calculate total duration of all audio stops
    const totalDurationMinutes = audioStops.reduce((sum, stop) => {
      return sum + parseDurationMinutes(stop.duration);
    }, 0);

    if (totalDurationMinutes === 0) {
      return 0; // Safety check
    }

    // Calculate consumed duration including all audio stops
    let consumedDurationMinutes = 0;

    audioStops.forEach(stop => {
      const stopDuration = parseDurationMinutes(stop.duration);

      if (progress.stops[stop.id]?.isCompleted) {
        // Completed stops count fully
        consumedDurationMinutes += stopDuration;
      } else {
        // Non-completed stops: use their maximum progress reached
        const maxReached = progress.stops[stop.id]?.maxPercentageReached || 0;

        // If this is the current stop, use max of current progress or saved max
        const effectiveProgress = stop.id === currentStopId
          ? Math.max(currentStopProgress, maxReached)
          : maxReached;

        if (effectiveProgress > 0) {
          consumedDurationMinutes += stopDuration * (effectiveProgress / 100);
        }
      }
    });

    // Calculate weighted percentage
    const percentage = (consumedDurationMinutes / totalDurationMinutes) * 100;

    return Math.round(percentage);
  }, [progress]);

  // Get consumed time in minutes for display
  const getConsumedMinutes = useCallback((
    tourStops: Stop[],
    currentStopId: string | null,
    currentStopProgress: number
  ): { consumed: number; total: number } => {
    // Filter only audio stops (stops with duration)
    const audioStops = tourStops.filter((stop): stop is AudioStop => stop.type === 'audio');

    // Calculate total duration of all audio stops
    const totalMinutes = audioStops.reduce((sum, stop) => {
      return sum + parseDurationMinutes(stop.duration);
    }, 0);

    // Calculate consumed duration including all audio stops
    let consumedMinutes = 0;

    audioStops.forEach(stop => {
      const stopDuration = parseDurationMinutes(stop.duration);

      if (progress.stops[stop.id]?.isCompleted) {
        // Completed stops count fully
        consumedMinutes += stopDuration;
      } else {
        // Non-completed stops: use their maximum progress reached
        const maxReached = progress.stops[stop.id]?.maxPercentageReached || 0;

        // If this is the current stop, use max of current progress or saved max
        const effectiveProgress = stop.id === currentStopId
          ? Math.max(currentStopProgress, maxReached)
          : maxReached;

        if (effectiveProgress > 0) {
          consumedMinutes += stopDuration * (effectiveProgress / 100);
        }
      }
    });

    return {
      consumed: Math.round(consumedMinutes),
      total: totalMinutes
    };
  }, [progress]);

  // Reset all progress (for replay functionality)
  const resetProgress = useCallback(() => {
    setProgress({ stops: {} });
  }, []);

  return {
    markStopCompleted,
    updateStopPosition,
    updateStopMaxProgress,
    isStopCompleted,
    getStopPosition,
    getTourCompletionPercentage,
    getCompletedStopsCount,
    getRealtimeProgressPercentage,
    getConsumedMinutes,
    resetProgress
  };
};
