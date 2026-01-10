/**
 * Theme registry - all available themes for the application
 * Import and register new themes here
 */

import { ThemeConfig, ThemeId } from '../types';
import { defaultTheme } from './default';
import { modernTheme } from './modern';
import { calmTheme } from './calm';
import { terminalTheme } from './terminal';
import { minimalDarkTheme } from './minimal-dark';
import { minimalLightTheme } from './minimal-light';

/**
 * Registry of all available themes
 * Key is the theme ID, value is the theme configuration
 */
export const themes: Record<ThemeId, ThemeConfig> = {
  default: defaultTheme,
  modern: modernTheme,
  calm: calmTheme,
  terminal: terminalTheme,
  minimalDark: minimalDarkTheme,
  minimalLight: minimalLightTheme,
};

/**
 * Get a theme by its ID
 * Fallback to default theme if not found
 */
export const getTheme = (themeId: ThemeId): ThemeConfig => {
  return themes[themeId] || themes.default;
};

/**
 * Get list of all available theme IDs
 */
export const getAvailableThemeIds = (): ThemeId[] => {
  return Object.keys(themes);
};

/**
 * Get list of all available themes
 */
export const getAvailableThemes = (): ThemeConfig[] => {
  return Object.values(themes);
};
