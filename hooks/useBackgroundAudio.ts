import { useEffect, useRef } from 'react';

export interface UseBackgroundAudioOptions {
  enabled: boolean;
}

/**
 * Background audio support hook.
 * 
 * This hook is now a no-op. Background audio on iOS Safari/PWA works natively when:
 * 1. Media Session API is properly configured (metadata, action handlers)
 * 2. Audio element is a singleton (not recreated on track changes)
 * 3. User has interacted with the page before playing
 * 
 * The playbackState is now managed directly in App.tsx to avoid duplicate updates
 * which can cause Control Center flickering on iOS.
 */
export const useBackgroundAudio = ({ enabled: _enabled }: UseBackgroundAudioOptions) => {
  // Keep hooks to maintain consistent hook count for HMR
  const _ref = useRef(false);
  useEffect(() => {
    // No-op - playback state is managed in App.tsx
  }, [_enabled]);

  return null;
};