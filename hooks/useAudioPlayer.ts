import { useEffect, useRef, useState } from 'react';

// Debug flag: enable via VITE_DEBUG_AUDIO=true or automatically in dev mode
// @ts-expect-error - Vite env types are injected at build time
const DEBUG_AUDIO = import.meta.env.VITE_DEBUG_AUDIO === 'true' || import.meta.env.DEV;

const debugLog = (...args: unknown[]) => {
  if (DEBUG_AUDIO) {
    console.log(...args);
  }
};

const debugWarn = (...args: unknown[]) => {
  if (DEBUG_AUDIO) {
    console.warn(...args);
  }
};

export interface UseAudioPlayerProps {
  audioUrl: string | null;
  id?: string;
  isPlaying: boolean;
  onEnded?: () => void;
  onProgress?: (id: string | undefined, currentTime: number, duration: number, percentComplete: number) => void;
  onPlayBlocked?: (error: unknown) => void;
}

export interface UseAudioPlayerReturn {
  progress: number;
  duration: number;
  currentTime: number;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  audioElement: HTMLAudioElement | null;
}

/**
 * Custom hook for audio playback.
 * 
 * ⚠️ IMPORTANT: This hook creates a single HTMLAudioElement instance.
 * Use this hook ONCE at the app/player level, NOT per track/item in a list.
 * 
 * ❌ WRONG - Don't do this:
 *   {tracks.map(track => {
 *     const player = useAudioPlayer({ audioUrl: track.url, ... });
 *     // This creates multiple Audio elements!
 *   })}
 * 
 * ✅ CORRECT - Do this:
 *   // In App.tsx or a global player component
 *   const audioPlayer = useAudioPlayer({
 *     audioUrl: currentTrack?.url,
 *     isPlaying: isPlaying,
 *     ...
 *   });
 * 
 * The hook manages a single audio element and switches URLs as needed.
 * For sequential playback (like audio tours), use one instance and update audioUrl.
 */
export const useAudioPlayer = ({
  audioUrl,
  id,
  isPlaying,
  onEnded,
  onProgress,
  onPlayBlocked,
}: UseAudioPlayerProps): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const logAudioState = (label: string) => {
    if (!DEBUG_AUDIO) return;
    const audio = audioRef.current;
    if (!audio) {
      debugLog(`[AUDIO] ${label} - no audio ref`);
      return;
    }
    debugLog(
      `[AUDIO] ${label}`,
      {
        readyState: audio.readyState,
        networkState: audio.networkState,
        paused: audio.paused,
        ended: audio.ended,
        currentTime: audio.currentTime.toFixed(2),
        duration: audio.duration || 0,
        src: audio.src,
        visibility: document.visibilityState,
      }
    );
  };

  // Use refs for callbacks and id to avoid effect re-runs and ensure current values
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const isPlayingRef = useRef(isPlaying);
  const idRef = useRef(id);
  const onPlayBlockedRef = useRef(onPlayBlocked);

  // Update refs when values change
  useEffect(() => {
    onEndedRef.current = onEnded;
    onProgressRef.current = onProgress;
    isPlayingRef.current = isPlaying;
    idRef.current = id;
    onPlayBlockedRef.current = onPlayBlocked;
  }, [onEnded, onProgress, isPlaying, id, onPlayBlocked]);

  // 1) Audio element lifecycle & listeners – depends only on audioUrl
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        currentAudioUrlRef.current = null;
      }
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    // Don't recreate audio if URL hasn't changed
    // BUT: We still need to ensure listeners are attached (they might have been removed by cleanup)
    if (currentAudioUrlRef.current === audioUrl && audioRef.current) {
      debugLog('Audio URL unchanged, keeping existing audio element');
      const audio = audioRef.current;
      
      // Ensure duration is set if metadata has loaded
      if (audio.duration && isFinite(audio.duration) && duration === 0) {
        setDuration(audio.duration);
      }
      
      // Listeners should already be attached, but if effect re-ran due to other deps,
      // cleanup may have removed them. Since we're reusing the element, listeners should persist.
      // No need to re-attach - they're already there from the initial setup.
    }

    debugLog('Loading audio:', audioUrl);

    // Clean up old audio if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    // Reset progress state immediately when switching tracks
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    currentAudioUrlRef.current = audioUrl;

    // Create new audio element
    const audio = new Audio();
    audioRef.current = audio;

    // Set audio properties
    audio.src = audioUrl;
    audio.preload = 'metadata'; // Load metadata only - less aggressive on mobile
    audio.volume = 1.0;
    audio.muted = false;
    // Note: Setting src already triggers loading. Explicit load() not needed.

    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const duration = audio.duration;
      
      setCurrentTime(currentTime);
      
      if (duration && isFinite(duration)) {
        const percentComplete = (currentTime / duration) * 100;
        setProgress(percentComplete);

        // Call progress callback if provided
        if (onProgressRef.current) {
          onProgressRef.current(idRef.current, currentTime, duration, percentComplete);
        }
      }
    };

    const handleEnded = () => {
      debugLog('🏁 Audio ended');
      setProgress(0);
      setCurrentTime(0);
      onEndedRef.current?.();
    };

    const handleError = (e: Event) => {
      console.error('❌ Audio loading error:', e);
      console.error('Failed to load:', audioUrl);
      logAudioState('error');
    };

    const handlePlay = () => {
      debugLog('▶️ Audio playing');
    };

    const handlePause = () => {
      debugLog('⏸️ Audio paused');
      logAudioState('paused');
    };

    const handleStalled = () => {
      debugWarn('⚠️ Audio stalled - readyState:', audio.readyState, 'networkState:', audio.networkState);
    };

    const handleWaiting = () => {
      debugWarn('⏳ Audio waiting for data - readyState:', audio.readyState, 'networkState:', audio.networkState);
    };

    const handleSuspend = () => {
      debugWarn('⚠️ Audio loading suspended - readyState:', audio.readyState, 'networkState:', audio.networkState);
    };

    const handleAbort = () => {
      debugWarn('⚠️ Audio load aborted - readyState:', audio.readyState, 'networkState:', audio.networkState);
    };

    const handleEmptied = () => {
      debugWarn('⚠️ Audio emptied - readyState:', audio.readyState, 'networkState:', audio.networkState);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('abort', handleAbort);
    audio.addEventListener('emptied', handleEmptied);

    // Auto-play after track change if isPlaying is true
    if (isPlayingRef.current) {
      const attemptPlay = () => {
        if (audio.readyState >= 2) {
          audio.play().catch((error) => {
            console.error('❌ Auto-play failed:', error);
            onPlayBlockedRef.current?.(error);
          });
        } else {
          const handleCanPlay = () => {
            audio.play().catch((error) => {
              console.error('❌ Auto-play failed after canplay:', error);
              onPlayBlockedRef.current?.(error);
            });
            audio.removeEventListener('canplay', handleCanPlay);
          };
          audio.addEventListener('canplay', handleCanPlay, { once: true });
        }
      };
      attemptPlay();
    }

    return () => {
      console.log('[AUDIO DEBUG] ⚠️ CLEANUP: Removing event listeners');
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('abort', handleAbort);
      audio.removeEventListener('emptied', handleEmptied);
      audio.pause();
      // Note: We don't null audioRef here because that only happens when audioUrl changes
    };
  }, [audioUrl]); // Only depend on audioUrl - callbacks and id are handled via refs

  // 2) Play/pause control – depends on isPlaying and audioUrl
  useEffect(() => {
    debugLog('🎮 Play/pause effect - isPlaying:', isPlaying, 'url:', audioUrl);
    if (!audioRef.current) {
      debugLog('⚠️ No audio ref');
      return;
    }

    const audio = audioRef.current;

    // Only control playback if this is the current audio URL
    if (currentAudioUrlRef.current !== audioUrl) {
      return;
    }

    if (isPlaying) {
      debugLog('▶️ Attempting to play...');
      logAudioState('before play');
      // Wait for audio to be ready before playing
      const attemptPlay = () => {
        // If already playing, no-op
        if (!audio.paused && !audio.ended) {
          return;
        }
        if (audio.readyState >= 2) {
          debugLog('✅ Audio ready, playing');
          audio.play().catch((error) => {
            console.error('❌ Play failed:', error);
            logAudioState('play failed');
            onPlayBlocked?.(error);
          });
        } else {
          debugLog('⏳ Waiting for audio to be ready...');
          audio.load(); // Explicitly trigger load
          // Audio not ready yet, wait for canplay event
          const handleCanPlay = () => {
            debugLog('✅ Audio ready, playing after canplay');
            audio.play().catch((error) => {
              console.error('❌ Play failed after canplay:', error);
              logAudioState('play failed after canplay');
              onPlayBlocked?.(error);
            });
          };
          audio.addEventListener('canplay', handleCanPlay, { once: true });
        }
      };

      attemptPlay();
    } else {
      debugLog('⏸️ Pausing audio');
      audio.pause();
    }
  }, [isPlaying, audioUrl, onPlayBlocked]);

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipForward = (seconds: number = 15) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + seconds,
        audioRef.current.duration
      );
    }
  };

  const skipBackward = (seconds: number = 15) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - seconds, 0);
    }
  };


  return {
    progress,
    duration,
    currentTime,
    seek,
    skipForward,
    skipBackward,
    audioElement: audioRef.current,
  };
};
