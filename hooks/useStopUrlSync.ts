import { useEffect } from 'react';
import { TourData } from '../types';

export interface UseStopUrlSyncProps {
  tour: TourData | null;
  tourId: string | undefined;
  currentStopId: string | null;
  urlStopId: string | undefined;
  hasStarted: boolean;
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

/**
 * Keeps the URL in sync with the currently playing stop. Extracted from App.tsx.
 * - When a stop is playing and differs from the URL, push it into the URL.
 * - When no stop is active but the URL still points at one (and the tour view is
 *   closed), drop back to the bare tour URL.
 * All updates use `replace` so stop changes don't pollute history.
 */
export const useStopUrlSync = ({
  tour,
  tourId,
  currentStopId,
  urlStopId,
  hasStarted,
  navigate,
}: UseStopUrlSyncProps): void => {
  useEffect(() => {
    if (!tour) return;

    const effectiveTourId = tourId || tour.id;
    // Carried over, not dropped: `?theme=` and `?lang=` are set once when the
    // player is opened, so rewriting the path without them silently reverts
    // the tour to its own theme the moment a stop starts playing.
    const search = typeof window === 'undefined' ? '' : window.location.search;

    if (currentStopId && currentStopId !== urlStopId) {
      navigate(`/tour/${effectiveTourId}/${currentStopId}${search}`, { replace: true });
    } else if (!currentStopId && urlStopId && !hasStarted) {
      navigate(`/tour/${effectiveTourId}${search}`, { replace: true });
    }
  }, [currentStopId, urlStopId, tourId, tour, hasStarted, navigate]);
};
