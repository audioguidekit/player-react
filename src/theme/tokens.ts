/**
 * Platform and animation tokens
 * These are kept separate from theme configs as they are platform-specific
 * and not part of the theming system.
 */

export const animations = {
  // Durations
  duration: {
    fast: '150ms',
    base: '200ms',
    medium: '300ms',
    slow: '500ms',
  },

  // Easing functions
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// iOS-specific tokens
export const platform = {
  safeArea: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  },
  viewport: {
    height: 'calc(var(--vh, 1vh) * 100)',
  },
};
