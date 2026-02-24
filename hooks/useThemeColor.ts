import { useEffect } from 'react';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Hook to dynamically update the browser theme-color meta tag
 * This ensures the header color extends into the iOS notch area
 */
export const useThemeColor = () => {
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Get or create the theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    // Update the theme color to match the header background
    // (may be overridden by tour backgroundColor set in App.tsx)
    metaThemeColor.setAttribute('content', currentTheme.header.backgroundColor);

    // Cleanup function to reset to default if needed
    return () => {
      // Optional: Reset to a default color on unmount
      // For this use case, we'll keep the last set color
    };
  }, [currentTheme.header.backgroundColor]);
};
