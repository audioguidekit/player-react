import { useCallback, useEffect, useMemo, useRef } from 'react';
import { track } from './index';

interface Input {
  tourId: string | undefined;
  language: string | undefined;
  currentStopId: string | null;
  isPlaying: boolean;
  /** True while the short audio between two stops plays; that is not listening to a stop. */
  isTransitioning: boolean;
}

interface Listening {
  stopId: string | null;
  ms: number;
  /** performance.now() when the current stretch of playing began, null while paused. */
  since: number | null;
}

/**
 * Turns what the tour screen already knows into analytics events:
 * tour_open, stop_view, tour_start, audio_play, audio_complete (with seconds
 * listened), tour_complete and language_change. Each fires once per tour/stop
 * per visit, so a pause, a seek or a language reload never counts twice.
 * The call sites in App.tsx are `audioEnded`, `tourCompleted` and `languageChanged`.
 */
export function useTourAnalytics({ tourId, language, currentStopId, isPlaying, isTransitioning }: Input) {
  const seen = useRef(new Set<string>());
  const listening = useRef<Listening>({ stopId: null, ms: 0, since: null });
  const languageRef = useRef(language);
  languageRef.current = language;

  const once = useCallback((key: string) => {
    if (seen.current.has(key)) return false;
    seen.current.add(key);
    return true;
  }, []);

  useEffect(() => {
    if (tourId && once(`open:${tourId}`)) track('tour_open', { tourId, language: languageRef.current });
  }, [tourId, once]);

  useEffect(() => {
    if (tourId && currentStopId && once(`view:${tourId}:${currentStopId}`)) {
      track('stop_view', { tourId, stopId: currentStopId, language: languageRef.current });
    }
  }, [tourId, currentStopId, once]);

  const active = isPlaying && !isTransitioning && !!currentStopId;

  useEffect(() => {
    if (active && tourId && currentStopId) {
      if (once(`start:${tourId}`)) track('tour_start', { tourId, language: languageRef.current });
      if (once(`play:${tourId}:${currentStopId}`)) {
        track('audio_play', { tourId, stopId: currentStopId, language: languageRef.current });
      }
    }
  }, [active, tourId, currentStopId, once]);

  // Seconds listened: add up the stretches in which a stop was really playing.
  useEffect(() => {
    const state = listening.current;
    const now = performance.now();
    if (state.stopId !== currentStopId) Object.assign(state, { stopId: currentStopId, ms: 0, since: null });
    if (active && state.since === null) state.since = now;
    if (!active && state.since !== null) {
      state.ms += now - state.since;
      state.since = null;
    }
  }, [active, currentStopId]);

  /** A stop's own audio reached its end (not the transition audio). */
  const audioEnded = useCallback(() => {
    const state = listening.current;
    if (!tourId || !state.stopId) return;
    const now = performance.now();
    if (state.since !== null) {
      state.ms += now - state.since;
      state.since = now;
    }
    if (once(`done:${tourId}:${state.stopId}`)) {
      track('audio_complete', { tourId, stopId: state.stopId, language: languageRef.current, value: state.ms / 1000 });
    }
    state.ms = 0;
  }, [tourId, once]);

  /** The player's own completion rule (100% of the audio time) was reached. */
  const tourCompleted = useCallback(() => {
    if (tourId && once(`complete:${tourId}`)) track('tour_complete', { tourId, language: languageRef.current });
  }, [tourId, once]);

  const languageChanged = useCallback(
    (code: string) => {
      track('language_change', { tourId, language: code });
    },
    [tourId],
  );

  return useMemo(() => ({ audioEnded, tourCompleted, languageChanged }), [audioEnded, tourCompleted, languageChanged]);
}
