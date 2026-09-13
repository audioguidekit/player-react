import { useEffect, useRef, useState, useCallback } from 'react';

// Debug flag: enable via VITE_DEBUG_AUDIO=true or automatically in dev mode
const DEBUG_AUDIO = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_AUDIO === 'true') ||
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV);

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

// audio.load() always fires a native 'pause' event as a side effect, even
// mid-playback. useAudioPlaybackSync listens on the same element and would
// otherwise mistake that for a real pause and flip isPlaying false — flagging
// the element right before every load() call lets it tell the difference.
type LoadFlaggedAudio = HTMLAudioElement & { __loadTriggeredPause?: boolean };
const loadAndFlag = (audio: HTMLAudioElement) => {
  (audio as LoadFlaggedAudio).__loadTriggeredPause = true;
  audio.load();
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
  play: () => Promise<void>;
  pause: () => void;
}

// Create a singleton audio element to persist across component re-mounts
// This is CRITICAL for iOS Safari to maintain the audio session
let globalAudioElement: HTMLAudioElement | null = null;
let audioSourceId = 0; // Unique ID for each audio source to track ended events
let listenersAttached = false; // Module-level flag to track if listeners are attached to singleton

const getOrCreateAudioElement = (): HTMLAudioElement => {
  if (!globalAudioElement) {
    debugLog('[AUDIO] Creating global audio element');
    globalAudioElement = new Audio();
    globalAudioElement.preload = 'metadata';
    globalAudioElement.volume = 1.0;
    globalAudioElement.muted = false;

    // CRITICAL FOR iOS: Append audio element to DOM
    // iOS Safari may need the audio element in the DOM for Media Session to work properly
    // NOTE: NOT using display:none - iOS may treat hidden audio elements differently for background audio
    globalAudioElement.style.position = 'absolute';
    globalAudioElement.style.width = '1px';
    globalAudioElement.style.height = '1px';
    globalAudioElement.style.overflow = 'hidden';
    globalAudioElement.style.opacity = '0.01';
    document.body.appendChild(globalAudioElement);
    debugLog('[AUDIO] Audio element appended to DOM for iOS compatibility');
  }
  return globalAudioElement;
};

/**
 * Custom hook for audio playback.
 * 
 * CRITICAL FOR iOS: This hook uses a SINGLETON HTMLAudioElement that persists
 * across component re-renders and re-mounts. Recreating audio elements causes:
 * - Safari "A problem repeatedly occurred" crashes
 * - Control Center time resetting to 0
 * - Audio session being dropped
 * 
 * The same audio element is reused by changing only its src property.
 */
export const useAudioPlayer = ({
  audioUrl,
  id,
  isPlaying,
  onEnded,
  onProgress,
  onPlayBlocked,
}: UseAudioPlayerProps): UseAudioPlayerReturn => {
  // Use singleton audio element - created synchronously, available immediately
  const audioRef = useRef<HTMLAudioElement>(getOrCreateAudioElement());
  const currentAudioUrlRef = useRef<string | null>(null);
  const currentSourceIdRef = useRef<number>(0); // Track which source ended events belong to
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const logAudioState = useCallback((label: string) => {
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
  }, []);

  // Use refs for callbacks and id to avoid effect re-runs
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const isPlayingRef = useRef(isPlaying);
  const idRef = useRef(id);
  const onPlayBlockedRef = useRef(onPlayBlocked);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onProgressRef.current = onProgress;
    isPlayingRef.current = isPlaying;
    idRef.current = id;
    onPlayBlockedRef.current = onPlayBlocked;
  }, [onEnded, onProgress, isPlaying, id, onPlayBlocked]);

  // Attach event listeners ONCE (using module-level flag for singleton)
  useEffect(() => {
    if (listenersAttached) return;
    listenersAttached = true;

    const audio = audioRef.current;
    debugLog('[AUDIO] Attaching event listeners to audio element');

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const handleTimeUpdate = () => {
      const audio = audioRef.current;
      if (!audio) return;

      const ct = audio.currentTime;
      const dur = audio.duration;

      if (!isFinite(ct)) return;

      setCurrentTime(ct);

      if (dur && isFinite(dur) && dur > 0) {
        const percentComplete = (ct / dur) * 100;
        setProgress(percentComplete);

        if (onProgressRef.current) {
          onProgressRef.current(idRef.current, ct, dur, percentComplete);
        }
      }
    };

    const handleEnded = () => {
      // Capture the source ID at the moment the event fires
      const eventSourceId = currentSourceIdRef.current;

      // Use setTimeout to let any pending URL changes process first
      setTimeout(() => {
        // Check if the source ID is still the same - if not, this is a stale event
        if (eventSourceId !== currentSourceIdRef.current) {
          debugLog('🏁 Audio ended - IGNORING (stale event from previous source)', { eventSourceId, current: currentSourceIdRef.current });
          return;
        }

        debugLog('🏁 Audio ended - firing onEnded callback', { sourceId: eventSourceId, url: currentAudioUrlRef.current });
        setProgress(0);
        setCurrentTime(0);
        onEndedRef.current?.();
      }, 0);
    };

    const handleError = (e: Event) => {
      console.error('❌ Audio loading error:', e);
      console.error('Failed to load:', audioRef.current?.src);
    };

    // Track stall recovery attempts
    let stallRecoveryAttempts = 0;
    const MAX_STALL_RECOVERY_ATTEMPTS = 2;
    let stallRecoveryTimeout: NodeJS.Timeout | null = null;

    const handlePlay = () => {
      debugLog('▶️ Audio playing');
      // Reset stall recovery attempts when audio plays successfully
      stallRecoveryAttempts = 0;
    };
    const handlePause = () => {
      debugLog('⏸️ Audio paused');
    };

    const handleStalled = () => {
      debugWarn('⚠️ Audio stalled');

      // Attempt recovery if not too many attempts
      if (stallRecoveryAttempts < MAX_STALL_RECOVERY_ATTEMPTS) {
        stallRecoveryAttempts++;
        debugLog(`🔄 Attempting stall recovery (${stallRecoveryAttempts}/${MAX_STALL_RECOVERY_ATTEMPTS})`);

        // Clear any existing recovery timeout
        if (stallRecoveryTimeout) {
          clearTimeout(stallRecoveryTimeout);
        }

        // Try to recover after a short delay
        stallRecoveryTimeout = setTimeout(() => {
          if (audioRef.current && !audioRef.current.paused) {
            debugLog('🔄 Reloading audio to recover from stall...');
            const currentTime = audioRef.current.currentTime;
            loadAndFlag(audioRef.current);
            audioRef.current.currentTime = currentTime;
            audioRef.current.play().catch((e) => {
              debugWarn('Failed to resume after stall recovery:', e);
              onPlayBlockedRef.current?.(e);
            });
          }
        }, 1000);
      } else {
        debugWarn('⛔ Max stall recovery attempts reached, giving up');
      }
    };

    const handleWaiting = () => debugWarn('⏳ Audio waiting for data');

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('waiting', handleWaiting);

    // No cleanup - we want the singleton to persist
    // Listeners are only attached once due to listenersAttachedRef
  }, []);

  // Handle URL changes - just update src, don't recreate element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioUrl) {
      if (currentAudioUrlRef.current) {
        debugLog('[AUDIO] Clearing audio source');
        audio.pause();
        audio.src = '';
        currentAudioUrlRef.current = null;
        // Increment source ID to invalidate any pending ended events
        currentSourceIdRef.current = ++audioSourceId;
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
      }
      return;
    }

    if (currentAudioUrlRef.current === audioUrl) {
      return;
    }

    // Check if audio.src was already set directly (e.g., in click handler for iOS)
    // This prevents double-loading and interrupting playback
    try {
      const normalizedNewSrc = new URL(audioUrl, window.location.href).href;
      debugLog('[AUDIO URL CHECK] audio.src:', audio.src);
      debugLog('[AUDIO URL CHECK] normalizedNewSrc:', normalizedNewSrc);
      debugLog('[AUDIO URL CHECK] match:', audio.src === normalizedNewSrc);
      if (audio.src === normalizedNewSrc) {
        debugLog('[AUDIO] Source already set directly, syncing ref only - NO LOAD()');
        currentAudioUrlRef.current = audioUrl;
        currentSourceIdRef.current = ++audioSourceId;
        return;
      }
    } catch (e) {
      debugLog('[AUDIO URL CHECK] URL parsing failed:', e);
      // URL parsing failed, continue with normal flow
    }

    debugLog('[AUDIO] Changing source to:', audioUrl, '- WILL CALL LOAD()');
    currentAudioUrlRef.current = audioUrl;
    // Increment source ID BEFORE loading - this invalidates any pending ended events from previous source
    currentSourceIdRef.current = ++audioSourceId;
    debugLog('[AUDIO] New source ID:', currentSourceIdRef.current);

    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    audio.src = audioUrl;
    debugLog('[AUDIO] Calling load() - this will fire pause event');
    loadAndFlag(audio);

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
  }, [audioUrl]);

  // Play/pause control
  useEffect(() => {
    debugLog('[useAudioPlayer] Play/pause effect - isPlaying:', isPlaying, 'audioUrl:', audioUrl?.slice(-30));
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      debugLog('[useAudioPlayer] No audio ref or URL - returning');
      return;
    }

    if (currentAudioUrlRef.current !== audioUrl) {
      debugLog('[useAudioPlayer] URL mismatch - waiting for URL sync');
      return;
    }

    if (isPlaying) {
      debugLog('[useAudioPlayer] isPlaying=true, audio.paused:', audio.paused, 'audio.ended:', audio.ended);
      if (!audio.paused && !audio.ended) {
        debugLog('[useAudioPlayer] Audio already playing - no action needed');
        return;
      }
      debugLog('[useAudioPlayer] Will attempt to play, readyState:', audio.readyState);
      if (audio.readyState >= 2) {
        audio.play().catch((error) => {
          console.error('[useAudioPlayer] Play failed:', error);
          onPlayBlocked?.(error);
        });
      } else {
        debugLog('[useAudioPlayer] readyState < 2, calling load() first');
        loadAndFlag(audio);
        const handleCanPlay = () => {
          audio.play().catch((error) => {
            console.error('[useAudioPlayer] Play failed after canplay:', error);
            onPlayBlocked?.(error);
          });
        };
        audio.addEventListener('canplay', handleCanPlay, { once: true });
      }
    } else {
      // Only pause if actually playing - avoid interfering with pendingAutoPlay flow
      debugLog('[useAudioPlayer] isPlaying=false, audio.paused:', audio.paused);
      if (!audio.paused) {
        debugLog('[useAudioPlayer] Pausing audio');
        audio.pause();
      } else {
        debugLog('[useAudioPlayer] Audio already paused - no action needed');
      }
    }
  }, [isPlaying, audioUrl, onPlayBlocked]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time) && time >= 0) {
      const dur = audioRef.current.duration;
      if (isFinite(dur)) {
        audioRef.current.currentTime = Math.min(time, dur);
      }
    }
  }, []);

  const skipForward = useCallback((seconds: number = 15) => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      const ct = audioRef.current.currentTime;
      if (isFinite(dur) && isFinite(ct)) {
        // Only apply buffer for longer tracks (> 5 seconds)
        // Short transition audio needs to reach natural end to fire ended event properly
        const maxPosition = dur > 5 ? dur - 0.5 : dur;
        audioRef.current.currentTime = Math.min(ct + seconds, maxPosition);
      }
    }
  }, []);

  const skipBackward = useCallback((seconds: number = 15) => {
    if (audioRef.current) {
      const ct = audioRef.current.currentTime;
      if (isFinite(ct)) {
        audioRef.current.currentTime = Math.max(ct - seconds, 0);
      }
    }
  }, []);

  // Direct play method that returns a promise
  // This allows setting isPlaying AFTER play succeeds (like working demo)
  const play = useCallback((): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return Promise.reject(new Error('No audio element'));

    if (audio.readyState >= 2) {
      return audio.play();
    } else {
      // Wait for canplay event
      return new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.play().then(resolve).catch(reject);
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay, { once: true });
        loadAndFlag(audio);
      });
    }
  }, []);

  // Direct pause method
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  return {
    progress,
    duration,
    currentTime,
    seek,
    skipForward,
    skipBackward,
    audioElement: audioRef.current,
    play,
    pause,
  };
};