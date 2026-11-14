/**
 * Theme registry - all available themes for the application
 * Import and register new themes here
 *
 * Themes can also be supplied as JSON — src/data/themes/*.json (which is how
 * the editor writes a custom theme) or the runtime manifest's `themes`. Those
 * are deep-merged over default-light (or the theme named by `extends`), so a
 * theme file only carries what it actually overrides rather than all ~180
 * properties of ThemeConfig. Built-in TypeScript themes take precedence.
 */

import { ThemeConfig, ThemeId } from '../types';
import type { CustomTheme } from '@audioguidekit/schema';
import { resolveCustomThemes } from './resolveCustomThemes';
import { getCustomThemes, onDataInstalled } from '../../services/tourDiscovery';
import { defaultLightTheme } from './default-light';
import { defaultDarkTheme } from './default-dark';

/** The themes a custom theme may build on. */
const baseThemes: Record<ThemeId, ThemeConfig> = {
  'default-light': defaultLightTheme,
  'default-dark': defaultDarkTheme,
};

/**
 * Registry of all available themes
 * Key is the theme ID, value is the theme configuration
 *
 * One object, refilled in place by `registerCustomThemes()` whenever data is
 * (re)installed, so a reference taken at import time stays current.
 */
export const themes: Record<ThemeId, ThemeConfig> = { ...baseThemes };

function registerCustomThemes(): void {
  const customThemes = resolveCustomThemes(getCustomThemes() as CustomTheme[], baseThemes, defaultLightTheme);

  // Custom themes first, built-ins last: a built-in id always wins, as it did
  // when this was a one-off spread at import time.
  for (const id of Object.keys(themes)) delete themes[id];
  Object.assign(themes, customThemes, baseThemes);
}

registerCustomThemes();
onDataInstalled(registerCustomThemes);

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
