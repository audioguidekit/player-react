/**
 * Theme registry - all available themes for the application
 * Import and register new themes here
 */

import { ThemeConfig, ThemeId } from '../types';
import { defaultLightTheme } from './default-light';
import { defaultDarkTheme } from './default-dark';

/**
 * Registry of all available themes
 * Key is the theme ID, value is the theme configuration
 */
export const themes: Record<ThemeId, ThemeConfig> = {
  'default-light': defaultLightTheme,
  'default-dark': defaultDarkTheme,
};

/**
 * Get a theme by its ID
 * Fallback to default-light theme if not found
 */
export const getTheme = (themeId: ThemeId): ThemeConfig => {
  return themes[themeId] || themes['default-light'];
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
