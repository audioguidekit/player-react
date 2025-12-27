import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import * as tokens from './tokens';
import { ThemeConfig, ThemeId } from './types';
import { getTheme } from './themes';

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
  themeId = 'default',
  theme: customTheme
}) => {
  // Use custom theme if provided, otherwise get theme by ID
  const selectedTheme = customTheme || getTheme(themeId);

  // Extend theme with platform tokens for backward compatibility
  const extendedTheme: ExtendedTheme = {
    ...selectedTheme,
    animations: tokens.animations,
    platform: tokens.platform,
  };

  const contextValue: ThemeContextValue = {
    currentTheme: selectedTheme,
    themeId: customTheme?.id || themeId,
  };

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
