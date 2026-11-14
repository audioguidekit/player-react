import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import * as tokens from './tokens';
import { ThemeConfig, ThemeId } from './types';
import { getTheme, themes } from './themes';

// Extend the theme to include platform tokens for backward compatibility
export interface ExtendedTheme extends ThemeConfig {
  animations: typeof tokens.animations;
  platform: typeof tokens.platform;
}

// Context for theme management
interface ThemeContextValue {
  currentTheme: ThemeConfig;
  themeId: ThemeId;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  themeId?: ThemeId;
  theme?: ThemeConfig;
}

/**
 * ThemeProvider component
 * Provides theme configuration throughout the application
 *
 * @param themeId - ID of the theme to use (e.g., 'default', 'modern')
 * @param theme - Custom theme object (overrides themeId if provided)
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  themeId = 'default-light',
  theme: customTheme
}) => {
  // A `?theme=` query parameter overrides the tour's theme. This exists so the
  // editor can preview a theme live, including one no tour uses yet — without
  // it, previewing a theme would show whatever theme the tour happens to have.
  // An unknown id is ignored rather than falling back, so a typo doesn't
  // silently show the default and look like the theme is broken.
  const override = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('theme')
    : null;
  const effectiveThemeId = override && themes[override] ? override : themeId;

  // Use custom theme if provided, otherwise get theme by ID
  const selectedTheme = customTheme || getTheme(effectiveThemeId);

  // Memoize extended theme to prevent unnecessary re-renders of styled-components
  const extendedTheme = useMemo<ExtendedTheme>(() => ({
    ...selectedTheme,
    animations: tokens.animations,
    platform: tokens.platform,
  }), [selectedTheme]);

  // Memoize context value to prevent unnecessary consumer re-renders
  const contextValue = useMemo<ThemeContextValue>(() => ({
    currentTheme: selectedTheme,
    themeId: customTheme?.id || effectiveThemeId,
  }), [selectedTheme, customTheme?.id, effectiveThemeId]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={extendedTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * useTheme hook
 * Returns the current theme configuration and theme ID
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Re-export theme type for backward compatibility
export type Theme = ExtendedTheme;
