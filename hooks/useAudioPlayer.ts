import { useEffect, useRef, useState } from 'react';

export interface UseAudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onEnded?: () => void;
  onProgress?: (currentTime: number, duration: number, percentComplete: number) => void;
}

export interface UseAudioPlayerReturn {
  progress: number;
  duration: number;
  currentTime: number;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

/**
 * Custom hook for audio playback
 */
export const useAudioPlayer = ({
  audioUrl,
  isPlaying,
  onEnded,
  onProgress,
}: UseAudioPlayerProps): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Use refs for callbacks to avoid effect re-runs
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);

  // Update refs when callbacks change
  useEffect(() => {
    onEndedRef.current = onEnded;
    onProgressRef.current = onProgress;
  }, [onEnded, onProgress]);

  // Create audio element when URL changes
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

    // Don't recreate audio if URL hasn't changed - return before cleanup runs
    if (currentAudioUrlRef.current === audioUrl && audioRef.current) {
      console.log('Audio URL unchanged, keeping existing audio element');
      return;
    }

    console.log('Loading audio:', audioUrl);

    // Clean up old audio if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    currentAudioUrlRef.current = audioUrl;

    // Create new audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Set audio properties
    audio.preload = 'auto';
    audio.volume = 1.0;
    audio.muted = false;

    // Set up event listeners
    const handleLoadedMetadata = () => {
      console.log('✅ [EVENT] loadedmetadata - duration:', audio.duration);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      console.log('✅ [EVENT] timeupdate fired - currentTime:', audio.currentTime.toFixed(2));
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        const percentComplete = (audio.currentTime / audio.duration) * 100;
        console.log('📊 Setting progress to:', percentComplete.toFixed(1) + '%', 'currentTime:', audio.currentTime.toFixed(1), 'duration:', audio.duration.toFixed(1));
        setProgress(percentComplete);

        // Call progress callback if provided
        if (onProgressRef.current) {
          onProgressRef.current(audio.currentTime, audio.duration, percentComplete);
        }
      } else {
        console.warn('⚠️ Audio duration not available yet');
      }
    };

    const handleEnded = () => {
      console.log('Audio ended');
      setProgress(0);
      setCurrentTime(0);
      onEndedRef.current?.();
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      console.error('Failed to load audio from:', audioUrl);
    };

    const handlePlay = () => {
      console.log('✅ [EVENT] play - Audio is now playing');
      console.log('Audio state:', {
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
        currentTime: audio.currentTime,
        duration: audio.duration
      });
    };

    const handlePause = () => {
      console.log('⏸️ [EVENT] pause - Audio is now paused');
    };

    console.log('🔧 Adding event listeners to audio element');
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    console.log('✅ All event listeners added successfully');

    // If isPlaying is true when we create a new audio element, start playing it
    if (isPlaying) {
      console.log('▶️ New audio loaded while playing - starting playback');
      console.log('Audio readyState:', audio.readyState);

      // Wait for audio to be ready before auto-playing
      if (audio.readyState >= 2) {
        console.log('🎵 Audio ready, calling play() immediately');
        audio.play()
          .then(() => console.log('✅ play() succeeded'))
          .catch((error) => {
            console.error('❌ Error auto-playing new audio:', error);
          });
      } else {
        console.log('⏳ Audio not ready, waiting for canplay event');
        const handleCanPlayAutoStart = () => {
          console.log('🎵 canplay event fired, calling play()');
          audio.play()
            .then(() => console.log('✅ play() succeeded after canplay'))
            .catch((error) => {
              console.error('❌ Error auto-playing new audio after canplay:', error);
            });
        };
        audio.addEventListener('canplay', handleCanPlayAutoStart, { once: true });
      }
    }

    return () => {
      console.log('🧹 Cleaning up audio element and removing listeners');
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, [audioUrl]);

  // Handle play/pause
  useEffect(() => {
    console.log('🎮 Play/pause effect running - isPlaying:', isPlaying);
    if (!audioRef.current) {
      console.log('⚠️ No audio ref available');
      return;
    }

    const audio = audioRef.current;

    if (isPlaying) {
      console.log('▶️ [EFFECT] Attempting to play audio...');
      console.log('Audio state:', { paused: audio.paused, readyState: audio.readyState });

      // Wait for audio to be ready before playing
      const attemptPlay = () => {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          console.log('🎵 [EFFECT] Audio ready, calling play()');
          audio.play()
            .then(() => console.log('✅ [EFFECT] play() succeeded'))
            .catch((error) => {
              console.error('❌ [EFFECT] Error playing audio:', error);
              console.error('Audio URL:', audio.src);
            });
        } else {
          // Audio not ready yet, wait for canplay event
          console.log('⏳ [EFFECT] Audio not ready, waiting for canplay');
          const handleCanPlay = () => {
            console.log('🎵 [EFFECT] canplay fired, calling play()');
            audio.play()
              .then(() => console.log('✅ [EFFECT] play() succeeded after canplay'))
              .catch((error) => {
                console.error('❌ [EFFECT] Error playing audio after canplay:', error);
              });
            audio.removeEventListener('canplay', handleCanPlay);
          };
          audio.addEventListener('canplay', handleCanPlay, { once: true });
        }
      };

      attemptPlay();
    } else {
      console.log('⏸️ [EFFECT] Pausing audio');
      audio.pause();
    }
  }, [isPlaying]);

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
  };
};
