import { useEffect, useRef, useCallback } from 'react';
import { AudioStop } from '../types';

const DEBUG_PRELOAD = import.meta.env.VITE_DEBUG_AUDIO === 'true' || import.meta.env.DEV;

const debugLog = (...args: unknown[]) => {
  if (DEBUG_PRELOAD) {
    console.log('[PRELOAD]', ...args);
  }
};

interface UseAudioPreloaderOptions {
  audioPlaylist: AudioStop[];
  currentStopId: string | null;
  isPlaying?: boolean;
  preloadCount?: number;
}

interface PreloadedAudio {
  url: string;
  audio: HTMLAudioElement;
  loaded: boolean;
}

export const useAudioPreloader = ({
  audioPlaylist,
  currentStopId,
  isPlaying = false,
  preloadCount = 1,
}: UseAudioPreloaderOptions) => {
  const preloadedRef = useRef<Map<string, PreloadedAudio>>(new Map());
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImagesRef.current.has(url)) {
        debugLog('✅ Image already preloaded:', url);
        resolve();
        return;
      }

      debugLog('⏳ Preloading image:', url);
      const img = new Image();
      img.onload = () => {
        preloadedImagesRef.current.add(url);
        debugLog('✅ Image preloaded:', url);
        resolve();
      };
      img.onerror = (e) => {
        debugLog('❌ Image preload failed:', url, e);
        reject(e);
      };
      img.src = url;
    });
  }, []);

  const preloadAudio = useCallback((url: string): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
      const existing = preloadedRef.current.get(url);
      if (existing?.loaded) {
        debugLog('✅ Already preloaded:', url);
        resolve(existing.audio);
        return;
      }

      debugLog('⏳ Preloading:', url);
      const audio = new Audio();
      audio.preload = 'auto';
      
      const entry: PreloadedAudio = { url, audio, loaded: false };
      preloadedRef.current.set(url, entry);

      const handleCanPlayThrough = () => {
        entry.loaded = true;
        debugLog('✅ Preloaded:', url);
        cleanup();
        resolve(audio);
      };

      const handleError = (e: Event) => {
        debugLog('❌ Preload failed:', url, e);
        preloadedRef.current.delete(url);
        cleanup();
        reject(e);
      };

      const cleanup = () => {
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        audio.removeEventListener('error', handleError);
      };

      audio.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
      audio.addEventListener('error', handleError, { once: true });
      
      audio.src = url;
      audio.load();
    });
  }, []);

  const getPreloadedAudio = useCallback((url: string): HTMLAudioElement | null => {
    const entry = preloadedRef.current.get(url);
    return entry?.loaded ? entry.audio : null;
  }, []);

  const cleanupOldPreloads = useCallback((keepUrls: Set<string>) => {
    for (const [url, entry] of preloadedRef.current.entries()) {
      if (!keepUrls.has(url)) {
        debugLog('🗑️ Cleaning up old preload:', url);
        entry.audio.src = '';
        preloadedRef.current.delete(url);
      }
    }
  }, []);

  // Preload first image + audio, then remaining images sequentially (before user starts tour)
  useEffect(() => {
    if (audioPlaylist.length === 0) return;
    if (currentStopId !== null) return; // Only run when no track is active yet

    debugLog('🚀 Initial preload - first image + audio with priority, then rest');

    const firstStop = audioPlaylist[0];
    if (!firstStop) return;

    // PRIORITY 1: Preload first image and wait for completion
    const preloadFirstAssets = async () => {
      if (firstStop.image) {
        debugLog('🎯 HIGH PRIORITY: Preloading first image');
        try {
          await preloadImage(firstStop.image);
          debugLog('✅ First image ready');
        } catch (e) {
          debugLog('❌ First image failed, continuing anyway');
        }
      }

      // PRIORITY 2: Preload first audio
      if (firstStop.audioFile) {
        debugLog('🎵 Preloading first audio');
        preloadAudio(firstStop.audioFile).catch(() => {});
      }

      // PRIORITY 3: Preload remaining images sequentially (with delay to avoid overwhelming Safari)
      debugLog('📸 Starting background preload of remaining images');
      for (let i = 1; i < audioPlaylist.length; i++) {
        const stop = audioPlaylist[i];
        if (stop.image) {
          // Small delay between each image to prevent memory pressure
          await new Promise(resolve => setTimeout(resolve, 300));
          debugLog(`📸 Background preloading image ${i + 1}/${audioPlaylist.length}`);
          preloadImage(stop.image).catch(() => {});
        }
      }
    };

    preloadFirstAssets();
  }, [audioPlaylist, currentStopId, preloadAudio, preloadImage]);

  // Preload next tracks when playing - with delay to ensure current audio is stable
  useEffect(() => {
    // Only preload next tracks when audio is actually playing
    if (!isPlaying || !currentStopId || audioPlaylist.length === 0) return;

    const currentIndex = audioPlaylist.findIndex(s => s.id === currentStopId);
    if (currentIndex === -1) return;

    // Delay preload by 3 seconds to ensure current audio is playing smoothly
    // This prevents premature preloading that can cause stalling
    const preloadDelay = setTimeout(() => {
      debugLog('⏰ Starting delayed preload of next track');

      const urlsToKeep = new Set<string>();
      const preloadPromises: Promise<unknown>[] = [];

      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < audioPlaylist.length) {
          const nextStop = audioPlaylist[nextIndex];
          if (nextStop.audioFile) {
            urlsToKeep.add(nextStop.audioFile);
            preloadPromises.push(
              preloadAudio(nextStop.audioFile).catch(() => null)
            );
          }
          // Images are already preloaded in initial effect
        }
      }

      const currentStop = audioPlaylist[currentIndex];
      if (currentStop?.audioFile) {
        urlsToKeep.add(currentStop.audioFile);
      }

      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanupOldPreloads(urlsToKeep);
      }, 5000);
    }, 3000); // 3 second delay

    return () => {
      clearTimeout(preloadDelay);
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [audioPlaylist, currentStopId, isPlaying, preloadCount, preloadAudio, preloadImage, cleanupOldPreloads]);

  useEffect(() => {
    return () => {
      for (const entry of preloadedRef.current.values()) {
        entry.audio.src = '';
      }
      preloadedRef.current.clear();
    };
  }, []);

  return {
    getPreloadedAudio,
    preloadAudio,
    preloadImage,
  };
};