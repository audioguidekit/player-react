import { useEffect, useRef } from 'react';
import { TourData, AudioStop } from '../types';

// Module-level flag to track if Media Session handlers are initialized
// Prevents re-initialization on HMR which can cause iOS issues
let mediaSessionInitialized = false;

type AudioPlayer = {
  audioElement: HTMLAudioElement | null;
  progress: number;
  duration: number;
  seek: (position: number) => void;
};

export interface UseMediaSessionProps {
  tour: TourData | null;
  currentAudioStop: AudioStop | undefined;
  isPlaying: boolean;
  isTransitioning: boolean;
  isSwitchingTracks: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  handleNextStop: () => void;
  handlePrevStop: () => void;
  setIsPlaying: (playing: boolean) => void;
  audioPlayer: AudioPlayer;
}

/**
 * Helper to determine artwork MIME type from file extension
 */
const getArtworkType = (src: string | undefined): string | undefined => {
  if (!src) return undefined;
  const lower = src.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return undefined;
};

/**
 * Hook to manage Media Session API for iOS lock screen controls.
 * Handles metadata, playback state, action handlers, and position state.
 */
export const useMediaSession = ({
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
}: UseMediaSessionProps) => {
  // Media Session refs for position state management
  const lastMetadataTrackIdRef = useRef<string | null>(null);
  const lastPositionUpdateRef = useRef(0);
  const lastPositionValuesRef = useRef({ duration: 0, position: 0 });

  // Refs for navigation state - used by Media Session handlers
  const canGoNextRef = useRef(canGoNext);
  const canGoPrevRef = useRef(canGoPrev);
  const handleNextStopRef = useRef(handleNextStop);
  const handlePrevStopRef = useRef(handlePrevStop);

  // Keep refs updated with latest values
  useEffect(() => {
    canGoNextRef.current = canGoNext;
    canGoPrevRef.current = canGoPrev;
    handleNextStopRef.current = handleNextStop;
    handlePrevStopRef.current = handlePrevStop;
  }, [canGoNext, canGoPrev, handleNextStop, handlePrevStop]);

  // EARLY Media Session metadata - set initial metadata on tour load
  // This ensures Control Center shows controls immediately, even before playback starts
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour) return;

    // Find first audio stop
    const firstAudioStop = tour.stops.find(stop => stop.type === 'audio' && 'audioFile' in stop);
    if (!firstAudioStop || firstAudioStop.type !== 'audio') return;

    // Set initial metadata with first stop
    const artworkType = getArtworkType(firstAudioStop.image);
    const artworkArray = firstAudioStop.image
      ? [{
          src: firstAudioStop.image,
          sizes: '512x512',
          type: artworkType || 'image/png'
        }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: firstAudioStop.title,
      artist: tour.title,
      album: 'AudioGuideKit',
      artwork: artworkArray,
    });

    console.log('[MediaSession] Initial metadata set:', firstAudioStop.title);
  }, [tour]);

  // Media Session metadata - only update when track actually changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour || !currentAudioStop) return;

    // Don't update metadata during transitions - transition audio should not show metadata
    if (isTransitioning) return;

    // Only update metadata if track changed
    if (lastMetadataTrackIdRef.current === currentAudioStop.id) return;
    lastMetadataTrackIdRef.current = currentAudioStop.id;

    const artworkType = getArtworkType(currentAudioStop.image);

    // Use single artwork entry with type always present for iOS compatibility
    const artworkArray = currentAudioStop.image
      ? [{
          src: currentAudioStop.image,
          sizes: '512x512',
          type: artworkType || 'image/png'  // Always provide type with fallback
        }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentAudioStop.title,
      artist: tour.title,
      album: 'AudioGuideKit',
      artwork: artworkArray,
    });

    console.log('[MediaSession] Metadata updated:', currentAudioStop.title);
  }, [tour, currentAudioStop, isTransitioning]);

  // Media Session playback state - keep in sync with isPlaying
  // IMPORTANT: Never set to 'none' as this can cause iOS to drop the session
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Visibility change handler - refresh metadata when app becomes visible
  // This ensures Control Center has fresh data when user returns to app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!('mediaSession' in navigator)) return;
        if (!tour || !currentAudioStop) return;
        if (isTransitioning) return;

        const artworkType = getArtworkType(currentAudioStop.image);
        const artworkArray = currentAudioStop.image
          ? [{
              src: currentAudioStop.image,
              sizes: '512x512',
              type: artworkType || 'image/png'
            }]
          : [];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentAudioStop.title,
          artist: tour.title,
          album: 'AudioGuideKit',
          artwork: artworkArray,
        });

        console.log('[MediaSession] Metadata refreshed on visibility change:', currentAudioStop.title);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tour, currentAudioStop, isTransitioning]);

  // Periodic metadata refresh - keep iOS audio session alive
  // Re-assert metadata every 30s to prevent iOS from thinking session is stale
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentAudioStop || !tour) return;
    if (isTransitioning) return;

    const refreshInterval = setInterval(() => {
      const artworkType = getArtworkType(currentAudioStop.image);
      const artworkArray = currentAudioStop.image
        ? [{
            src: currentAudioStop.image,
            sizes: '512x512',
            type: artworkType || 'image/png'
          }]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentAudioStop.title,
        artist: tour.title,
        album: 'AudioGuideKit',
        artwork: artworkArray,
      });

      console.log('[MediaSession] Periodic metadata refresh:', currentAudioStop.title);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [currentAudioStop, tour, isTransitioning]);

  // Media Session action handlers - set once and DON'T clean up
  // Cleaning up handlers (setting to null) can cause iOS to think the session ended
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audioEl = audioPlayer.audioElement;
    if (!audioEl) return;

    // Only initialize once to avoid iOS quirks with handler changes
    if (mediaSessionInitialized) return;
    mediaSessionInitialized = true;

    console.log('[MediaSession] Initializing action handlers');

    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      audioEl.play().catch((err) => console.error('MediaSession play failed', err));
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      audioEl.pause();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (canGoNextRef.current) {
        handleNextStopRef.current();
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (canGoPrevRef.current) {
        handlePrevStopRef.current();
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const seekOffset = details.seekOffset ?? 10;
      const duration = audioEl.duration;
      const currentTime = audioEl.currentTime;
      if (isFinite(duration) && isFinite(currentTime)) {
        audioEl.currentTime = Math.min(currentTime + seekOffset, duration);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const seekOffset = details.seekOffset ?? 10;
      const currentTime = audioEl.currentTime;
      if (isFinite(currentTime)) {
        audioEl.currentTime = Math.max(currentTime - seekOffset, 0);
      }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && isFinite(details.seekTime)) {
        audioEl.currentTime = details.seekTime;
      }
    });

    // NO CLEANUP - keeping handlers prevents iOS from dropping the session
  }, [audioPlayer.audioElement, setIsPlaying]);

  // Media Session position state update - periodic timer reading directly from audio element
  // CRITICAL: We read from audio element directly, NOT React state, to avoid stale values
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;

    // Don't update position during transitions or track switching
    if (isTransitioning || isSwitchingTracks) return;

    const audio = audioPlayer.audioElement;
    if (!audio) return;

    // Function to update position state from audio element
    const updatePositionState = () => {
      // Read values DIRECTLY from audio element to avoid stale React state
      const duration = audio.duration;
      const currentTime = audio.currentTime;
      const now = Date.now();

      // Guard against invalid values
      if (duration < 0.5 || !isFinite(duration)) return;
      if (!isFinite(currentTime) || currentTime < 0) return;

      // Guard against track loading state
      // If currentTime is very close to 0 but last position was much higher,
      // AND duration changed significantly, we're likely loading a new track
      const likelyTrackLoading =
        currentTime < 1.0 &&
        lastPositionValuesRef.current.position > 5.0 &&
        Math.abs(duration - lastPositionValuesRef.current.duration) > 2.0;

      if (likelyTrackLoading) {
        console.log('[MediaSession] Skipping position update - track loading detected');
        return;
      }

      // Throttle updates
      const timeSinceLastUpdate = now - lastPositionUpdateRef.current;
      const durationChanged = Math.abs(duration - lastPositionValuesRef.current.duration) > 0.5;
      const positionChanged = Math.abs(currentTime - lastPositionValuesRef.current.position) > 2;

      if (lastPositionUpdateRef.current > 0 && timeSinceLastUpdate < 2000 && !durationChanged && !positionChanged) return;

      try {
        const position = Math.min(Math.max(0, currentTime), duration);
        navigator.mediaSession.setPositionState({
          duration: duration,
          position: position,
          playbackRate: 1.0,
        });
        lastPositionUpdateRef.current = now;
        lastPositionValuesRef.current = { duration, position };
      } catch (e) {
        console.warn('[MediaSession] Position state update failed:', e);
      }
    };

    // Update immediately
    updatePositionState();

    // Update periodically: 2s when playing, 10s when paused
    // This keeps iOS audio session alive even when paused
    const updateInterval = isPlaying ? 2000 : 10000;
    const interval = setInterval(updatePositionState, updateInterval);

    return () => clearInterval(interval);
  }, [audioPlayer.audioElement, isPlaying, isTransitioning, isSwitchingTracks]);
};
