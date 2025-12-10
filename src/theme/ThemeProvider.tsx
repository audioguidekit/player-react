import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import * as tokens from './tokens';

export const theme = {
  colors: tokens.colors,
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  shadows: tokens.shadows,
  typography: tokens.typography,
  animations: tokens.animations,
  platform: tokens.platform,
};

export type Theme = typeof theme;

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      {children}
    </StyledThemeProvider>
  );
};
