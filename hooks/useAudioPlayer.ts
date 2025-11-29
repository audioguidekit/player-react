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

    // Reset progress state immediately when switching tracks
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    currentAudioUrlRef.current = audioUrl;

    // Create new audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Set audio properties
    audio.preload = 'auto';
    audio.volume = 1.0;
    audio.muted = false;
    audio.load(); // Ensure loading starts immediately

    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      console.log('⏱️ timeupdate - currentTime:', audio.currentTime.toFixed(2));
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        const percentComplete = (audio.currentTime / audio.duration) * 100;
        console.log('📊 Progress:', percentComplete.toFixed(1) + '%');
        setProgress(percentComplete);

        // Call progress callback if provided
        if (onProgressRef.current) {
          onProgressRef.current(audio.currentTime, audio.duration, percentComplete);
        }
      }
    };

    const handleEnded = () => {
      console.log('🏁 Audio ended');
      setProgress(0);
      setCurrentTime(0);
      onEndedRef.current?.();
    };

    const handleError = (e: Event) => {
      console.error('❌ Audio loading error:', e);
      console.error('Failed to load:', audioUrl);
    };

    const handlePlay = () => {
      console.log('▶️ Audio playing');
    };

    const handlePause = () => {
      console.log('⏸️ Audio paused');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // If isPlaying is true when we create a new audio element, start playing it
    // This handles the case where we auto-advance to the next track
    if (isPlaying) {
      console.log('🎵 isPlaying is true, auto-playing new audio');
      const handleCanPlay = () => {
        console.log('✅ New audio ready, auto-playing');
        audio.play().catch((error) => {
          console.error('❌ Auto-play failed:', error);
        });
      };
      audio.addEventListener('canplay', handleCanPlay, { once: true });
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, [audioUrl, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    console.log('🎮 Play/pause effect - isPlaying:', isPlaying, 'url:', audioUrl);
    if (!audioRef.current) {
      console.log('⚠️ No audio ref');
      return;
    }

    const audio = audioRef.current;

    if (isPlaying) {
      console.log('▶️ Attempting to play...');
      // Wait for audio to be ready before playing
      const attemptPlay = () => {
        if (audio.readyState >= 2) {
          console.log('✅ Audio ready, playing');
          audio.play().catch((error) => {
            console.error('❌ Play failed:', error);
          });
        } else {
          console.log('⏳ Waiting for audio to be ready...');
          // Audio not ready yet, wait for canplay event
          const handleCanPlay = () => {
            console.log('✅ Audio ready, playing');
            audio.play().catch((error) => {
              console.error('❌ Play failed:', error);
            });
            audio.removeEventListener('canplay', handleCanPlay);
          };
          audio.addEventListener('canplay', handleCanPlay, { once: true });
        }
      };

      attemptPlay();
    } else {
      console.log('⏸️ Pausing audio');
      audio.pause();
    }
  }, [isPlaying, audioUrl]);

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
