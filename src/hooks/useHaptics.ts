import { useCallback } from 'react';
import { useWebHaptics } from 'web-haptics/react';
import { hapticsEnabled } from '../config/haptics';

const PATTERN = [{ duration: 15 }] as const;
const OPTIONS = { intensity: 0.4 } as const;

/**
 * Returns a stable `triggerHaptic()` function that fires a short haptic tap
 * on supported devices (Android via Vibration API, iOS via the hidden-checkbox trick).
 *
 * Respects the tour-level `hapticsEnabled` flag — call sites need no guard.
 *
 * @example
 * const triggerHaptic = useHaptics();
 * <button onClick={triggerHaptic}>Tap</button>
 */
export function useHaptics() {
  const { trigger } = useWebHaptics();
  return useCallback(() => {
    if (hapticsEnabled) trigger(PATTERN, OPTIONS);
  }, [trigger]);
}
