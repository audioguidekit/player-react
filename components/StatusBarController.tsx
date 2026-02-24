import React, { useEffect } from 'react';
import { useTheme } from '../src/theme/ThemeProvider';

interface StatusBarControllerProps {
  backgroundColor?: string;
  hasStarted: boolean;
}

/**
 * Sets the theme-color meta tag based on the current screen:
 * - TourStart (!hasStarted): uses backgroundColor from metadata (to tint the iOS browser chrome)
 * - TourDetail (hasStarted): uses theme header.backgroundColor so the header blends with the status bar
 */
export const StatusBarController: React.FC<StatusBarControllerProps> = ({
  backgroundColor,
  hasStarted,
}) => {
  const { currentTheme } = useTheme();

  const targetColor =
    !hasStarted && backgroundColor
      ? backgroundColor
      : currentTheme.header.backgroundColor;

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    metaThemeColor?.setAttribute('content', targetColor);
  }, [targetColor]);

  return null;
};
