/**
 * UI Language Configuration
 *
 * Configure which UI languages to include in the build.
 * Only imported languages will be bundled - unused languages are tree-shaken.
 *
 * To add a language:
 * 1. Uncomment the import statement
 * 2. Add it to the supportedLanguages object
 */

import type { Translations, LanguageCode } from '../translations/types';

// Language imports - uncomment languages you need
import { en } from '../translations/locales/en';
import { cs } from '../translations/locales/cs';
import { de } from '../translations/locales/de';
import { fr } from '../translations/locales/fr';
import { it } from '../translations/locales/it';
import { es } from '../translations/locales/es';

/**
 * Default language for the app.
 * Used when:
 * - User's browser language is not supported
 * - A tour is not available in the requested language
 * - No language preference has been set
 *
 * Must be one of the supported languages.
 */
export const defaultLanguage: LanguageCode = 'en';

/**
 * Supported UI languages for this build.
 * Only languages listed here will be included in the bundle.
 */
export const supportedLanguages = {
  en,
  cs,
  de,
  fr,
  it,
  es,
} satisfies Partial<Record<LanguageCode, Translations>>;

/**
 * Type representing the languages available in this build.
 * Automatically derived from supportedLanguages config.
 */
export type SupportedLanguageCode = keyof typeof supportedLanguages;

/**
 * Check if a language code is supported in this build.
 */
export function isLanguageSupported(code: string): code is SupportedLanguageCode {
  return code in supportedLanguages;
}
