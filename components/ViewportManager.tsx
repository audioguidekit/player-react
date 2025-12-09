import { useEffect } from 'react';

/**
 * ViewportManager component
 *
 * Manages viewport height CSS variable (--vh) for iOS Safari compatibility.
 * iOS Safari's dynamic UI causes 100vh to behave incorrectly, so we use a CSS variable instead.
 *
 * This component ensures proper cleanup of global event listeners to prevent memory leaks.
 */
export const ViewportManager: React.FC = () => {
  useEffect(() => {
    const setViewportHeight = () => {
      const height = window.innerHeight ||
                     window.visualViewport?.height ||
                     document.documentElement.clientHeight ||
                     window.screen.height;

      if (height > 0) {
        const vh = height * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    // Set immediately on mount
    setViewportHeight();

    // Orientation change timeout ref for cleanup
    let orientationTimeoutId: NodeJS.Timeout | null = null;

    const handleOrientationChange = () => {
      if (orientationTimeoutId) {
        clearTimeout(orientationTimeoutId);
      }
      orientationTimeoutId = setTimeout(setViewportHeight, 100);
    };

    // Add event listeners
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Visual viewport listener (iOS Safari)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
      }

      if (orientationTimeoutId) {
        clearTimeout(orientationTimeoutId);
      }
    };
  }, []); // Empty deps - only run once on mount

  return null; // This component renders nothing
};
