import { useEffect, useRef } from 'react';
import { TourData, AudioStop } from '../types';

// REMOVED module-level flag (mediaSessionInitialized).
// It causes bugs on component remount/navigation.

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

const getArtworkType = (src: string | undefined): string | undefined => {
  if (!src) return undefined;
  const lower = src.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return undefined;
};

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
  // --- STATE REFS ---
  // We use refs to hold the LATEST values. This allows the Action Handlers
  // to be defined ONCE (on mount) but always access current data/functions.

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const setIsPlayingRef = useRef(setIsPlaying);
  const canGoNextRef = useRef(canGoNext);
  const canGoPrevRef = useRef(canGoPrev);
  const handleNextStopRef = useRef(handleNextStop);
  const handlePrevStopRef = useRef(handlePrevStop);

  // Sync Refs with props/state
  useEffect(() => {
    audioElRef.current = audioPlayer.audioElement;
    setIsPlayingRef.current = setIsPlaying;
    canGoNextRef.current = canGoNext;
    canGoPrevRef.current = canGoPrev;
    handleNextStopRef.current = handleNextStop;
    handlePrevStopRef.current = handlePrevStop;
  }, [audioPlayer.audioElement, setIsPlaying, canGoNext, canGoPrev, handleNextStop, handlePrevStop]);

  // --- 1. METADATA UPDATES ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!tour || !currentAudioStop) return;
    if (isTransitioning) return;

    const artworkType = getArtworkType(currentAudioStop.image);
    const artworkArray = currentAudioStop.image
      ? [{ src: currentAudioStop.image, sizes: '512x512', type: artworkType || 'image/png' }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentAudioStop.title,
      artist: tour.title,
      album: 'AudioGuideKit',
      artwork: artworkArray,
    });
  }, [tour, currentAudioStop, isTransitioning]);

  // --- 2. PLAYBACK STATE SYNC ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audio = audioPlayer.audioElement;
    if (!audio) return;

    const setPlaying = () => {
      navigator.mediaSession.playbackState = 'playing';
    };

    const setPaused = () => {
      navigator.mediaSession.playbackState = 'paused';
    };

    // Listen to 'playing' (happens when media is actually running)
    // AND 'play' (happens when request is made) for robustness.
    audio.addEventListener('play', setPlaying);
    audio.addEventListener('playing', setPlaying);
    audio.addEventListener('pause', setPaused);
    audio.addEventListener('ended', setPaused);
    audio.addEventListener('waiting', setPaused); // Optional: show pause/loading spinner while buffering

    // Immediate check on mount/update
    if (!audio.paused) {
      navigator.mediaSession.playbackState = 'playing';
    } else {
      navigator.mediaSession.playbackState = 'paused';
    }

    return () => {
      audio.removeEventListener('play', setPlaying);
      audio.removeEventListener('playing', setPlaying);
      audio.removeEventListener('pause', setPaused);
      audio.removeEventListener('ended', setPaused);
      audio.removeEventListener('waiting', setPaused);
    };
  }, [audioPlayer.audioElement]); // Re-bind only if the actual DOM node changes

  // --- 3. ACTION HANDLERS ---
  // We initialize this ONCE on mount. Because we use Refs inside,
  // we never need to remove/re-add listeners, which keeps iOS happy.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => {
        setIsPlayingRef.current(true);
        audioElRef.current?.play().catch(console.error);
      }],
      ['pause', () => {
        setIsPlayingRef.current(false);
        audioElRef.current?.pause();
      }],
      ['nexttrack', () => {
        if (canGoNextRef.current) handleNextStopRef.current();
      }],
      ['previoustrack', () => {
        if (canGoPrevRef.current) handlePrevStopRef.current();
      }],
      ['seekforward', (details) => {
        const audio = audioElRef.current;
        if (!audio) return;
        const seekOffset = details?.seekOffset ?? 10;
        audio.currentTime = Math.min(audio.currentTime + seekOffset, audio.duration);
      }],
      ['seekbackward', (details) => {
        const audio = audioElRef.current;
        if (!audio) return;
        const seekOffset = details?.seekOffset ?? 10;
        audio.currentTime = Math.max(audio.currentTime - seekOffset, 0);
      }],
      ['seekto', (details) => {
        const audio = audioElRef.current;
        if (!audio || details?.seekTime === undefined) return;
        audio.currentTime = details.seekTime;
      }]
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        console.warn(`MediaSession action ${action} not supported`);
      }
    });

    // We do NOT clean up action handlers (return logic).
    // Clearing them on unmount can confuse the browser if the user navigates quickly.
    // Since we use refs, leaving them active is safe.
  }, []); // Empty dependency array = Runs once on mount

  // --- 4. POSITION STATE ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const updatePosition = () => {
      const audio = audioPlayer.audioElement;
      if (!audio) return;

      const duration = audio.duration;
      const currentTime = audio.currentTime;

      if (isFinite(duration) && duration > 0 && isFinite(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: audio.playbackRate,
            position: currentTime,
          });

          // SELF-HEALING: If audio is playing but MediaSession says "paused", force it to "playing"
          // This fixes the issue where the button gets stuck as "Play" while audio is heard.
          if (!audio.paused && navigator.mediaSession.playbackState !== 'playing') {
             console.log('[MediaSession] Healing playbackState mismatch');
             navigator.mediaSession.playbackState = 'playing';
          }

        } catch (e) {
          // Ignore errors (often happens if duration is not yet available)
        }
      }
    };

    // Update more frequently when playing for smoother UI sync
    const intervalId = setInterval(updatePosition, 1000);

    return () => clearInterval(intervalId);
  }, [audioPlayer.audioElement]); // Re-create interval if audio element changes
};
