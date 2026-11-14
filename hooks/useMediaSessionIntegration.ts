import { useCallback, useEffect, useRef } from 'react';
import { useMediaSession, useMediaMeta } from 'use-media-session';
import { AudioStop } from '../types';
import { UseAudioPlayerReturn } from './useAudioPlayer';

/**
 * Maps an artwork URL's file extension to a MIME type for MediaSession metadata.
 * Exported for unit testing.
 */
export const getArtworkType = (url: string | undefined): string | null => {
  if (!url) return null;
  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

export interface UseMediaSessionIntegrationProps {
  audioPlayer: UseAudioPlayerReturn;
  currentAudioStop: AudioStop | undefined;
  tourTitle: string | undefined;
  isPlaying: boolean;
  setIsPlaying: (value: boolean | ((prev: boolean) => boolean)) => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  /** Speed the audio plays at; the OS scrubber needs it to advance at the right pace. */
  playbackRate?: number;
}

/**
 * Wires the browser MediaSession API (iOS Control Center / lock-screen controls)
 * to the audio player and tour navigation. Extracted from App.tsx.
 *
 * Responsibilities:
 * - Publishes track metadata + artwork to the OS.
 * - Routes OS transport controls (play/pause/seek/prev/next) to the player.
 * - Keeps the OS position scrubber in sync (throttled to once per second).
 *
 * CRITICAL FOR iOS: play/pause callbacks set React state only AFTER the native
 * play()/pause() resolves, otherwise iOS sees a state/element mismatch and shows
 * the wrong transport button.
 */
export const useMediaSessionIntegration = ({
  audioPlayer,
  currentAudioStop,
  tourTitle,
  isPlaying,
  setIsPlaying,
  onPreviousTrack,
  onNextTrack,
  playbackRate = 1,
}: UseMediaSessionIntegrationProps): void => {
  // Build artwork array for MediaSession metadata
  const artworkType = getArtworkType(currentAudioStop?.image);
  const mediaSessionArtwork = currentAudioStop?.image
    ? [{ src: currentAudioStop.image, sizes: '512x512', type: artworkType || 'image/jpeg' }]
    : [];

  useMediaMeta({
    title: currentAudioStop?.title || '',
    artist: tourTitle || '',
    album: 'AudioGuideKit',
    artwork: mediaSessionArtwork,
  });

  // Play callback - MUST set state AFTER play succeeds (iOS requirement)
  const playTrack = useCallback(() => {
    audioPlayer.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((e) => {
        console.error('[MediaSession] play() failed:', e);
      });
  }, [audioPlayer, setIsPlaying]);

  const pauseTrack = useCallback(() => {
    const audio = audioPlayer.audioElement;
    if (audio && !audio.paused) {
      audioPlayer.pause();
      setIsPlaying(false);
    }
  }, [audioPlayer, setIsPlaying]);

  const seekBackward = useCallback(() => {
    audioPlayer.skipBackward(10);
  }, [audioPlayer]);

  const seekForward = useCallback(() => {
    audioPlayer.skipForward(10);
  }, [audioPlayer]);

  useMediaSession({
    playbackState: isPlaying ? 'playing' : 'paused',
    onPlay: playTrack,
    onPause: pauseTrack,
    onSeekBackward: seekBackward,
    onSeekForward: seekForward,
    onPreviousTrack: onPreviousTrack,
    onNextTrack: onNextTrack,
  });

  // Update MediaSession position state (throttled to once per second)
  const lastPositionUpdateRef = useRef(0);
  const lastRateRef = useRef(playbackRate);
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      const duration = audioPlayer.duration;
      const currentTime = audioPlayer.currentTime;
      const now = Date.now();

      // Throttle to once per second, but a new speed is reported at once
      const rateChanged = lastRateRef.current !== playbackRate;
      if (!rateChanged && now - lastPositionUpdateRef.current < 1000) return;

      if (duration > 0 && isFinite(duration) && isFinite(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate,
            position: currentTime,
          });
          lastPositionUpdateRef.current = now;
          lastRateRef.current = playbackRate;
        } catch {
          // Ignore errors
        }
      }
    }
  }, [audioPlayer.currentTime, audioPlayer.duration, playbackRate]);
};
