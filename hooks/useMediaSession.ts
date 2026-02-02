import { useEffect, useCallback } from 'react';
import { useMediaSession as useMediaSessionLib, useMediaMeta } from 'use-media-session';
import { TourData, AudioStop } from '../types';

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
  canGoNext,
  canGoPrev,
  handleNextStop,
  handlePrevStop,
  setIsPlaying,
  audioPlayer,
}: UseMediaSessionProps) => {
  // --- 1. MEDIA METADATA (using library hook) ---
  // Build metadata object - only set real values when we have a valid audio stop
  const artworkType = getArtworkType(currentAudioStop?.image);
  const artwork = currentAudioStop?.image
    ? [{ src: currentAudioStop.image, sizes: '512x512', type: artworkType || 'image/jpeg' }]
    : [];

  // Always pass an object to useMediaMeta (library doesn't handle undefined)
  // Use empty strings when no audio stop is available
  const metadata = {
    title: (!isTransitioning && currentAudioStop) ? currentAudioStop.title : '',
    artist: (!isTransitioning && currentAudioStop) ? (tour?.title || '') : '',
    album: 'AudioGuideKit',
    artwork: (!isTransitioning && currentAudioStop) ? artwork : [],
  };

  useMediaMeta(metadata);

  // --- 2. ACTION CALLBACKS (memoized) ---
  const onPlay = useCallback(() => {
    if (audioPlayer.audioElement) {
      audioPlayer.audioElement.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [audioPlayer.audioElement, setIsPlaying]);

  const onPause = useCallback(() => {
    if (audioPlayer.audioElement) {
      audioPlayer.audioElement.pause();
      setIsPlaying(false);
    }
  }, [audioPlayer.audioElement, setIsPlaying]);

  const onPreviousTrack = useCallback(() => {
    if (canGoPrev) handlePrevStop();
  }, [canGoPrev, handlePrevStop]);

  const onNextTrack = useCallback(() => {
    if (canGoNext) handleNextStop();
  }, [canGoNext, handleNextStop]);

  const onSeekBackward = useCallback(() => {
    if (audioPlayer.audioElement) {
      audioPlayer.audioElement.currentTime = Math.max(0, audioPlayer.audioElement.currentTime - 10);
    }
  }, [audioPlayer.audioElement]);

  const onSeekForward = useCallback(() => {
    if (audioPlayer.audioElement) {
      const duration = audioPlayer.audioElement.duration || 0;
      audioPlayer.audioElement.currentTime = Math.min(duration, audioPlayer.audioElement.currentTime + 10);
    }
  }, [audioPlayer.audioElement]);

  // --- 3. MEDIA SESSION ACTIONS (using library hook) ---
  useMediaSessionLib({
    playbackState: isPlaying ? 'playing' : 'paused',
    onPlay,
    onPause,
    onPreviousTrack: canGoPrev ? onPreviousTrack : undefined,
    onNextTrack: canGoNext ? onNextTrack : undefined,
    onSeekBackward,
    onSeekForward,
  });

  // --- 4. POSITION STATE (manual - library doesn't handle this) ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!('setPositionState' in navigator.mediaSession)) return;

    const audio = audioPlayer.audioElement;
    if (!audio) return;

    const updatePosition = () => {
      const duration = audio.duration;
      const currentTime = audio.currentTime;

      if (isFinite(duration) && duration > 0 && isFinite(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: audio.playbackRate,
            position: currentTime,
          });
        } catch (e) {
          // Ignore errors (often happens if duration is not yet available)
        }
      }
    };

    // Update position state every second
    const intervalId = setInterval(updatePosition, 1000);

    // Also update on time update events
    audio.addEventListener('timeupdate', updatePosition);

    return () => {
      clearInterval(intervalId);
      audio.removeEventListener('timeupdate', updatePosition);
    };
  }, [audioPlayer.audioElement]);
};
