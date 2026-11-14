/**
 * UI Language Configuration
 *
 * Languages are automatically derived from the tours in the src/data/tour/ folder.
 * Only UI translations for languages that exist in tours will be exposed.
 *
 * To configure:
 * 1. Set `defaultLanguage` in your tour's metadata.json
 * 2. Add tour files with the desired `language` field
 *
 * All UI translations are imported but only those matching tour languages are exposed.
 * This ensures the app only shows languages that have corresponding tour content.
 */

import type { Translations, LanguageCode } from '../translations/types';
import { deepMerge } from '../utils/deepMerge';
import {
  defaultLanguage as tourDefaultLanguage,
  getAllAvailableLanguageCodes,
  getUiOverrides,
  onDataInstalled,
} from '../services/tourDiscovery';

// Import all available UI translations
// These are small files (~1-2KB each) so tree-shaking savings are minimal
import { en } from '../translations/locales/en';
import { cs } from '../translations/locales/cs';
import { de } from '../translations/locales/de';
import { fr } from '../translations/locales/fr';
import { it } from '../translations/locales/it';
import { es } from '../translations/locales/es';

// All available translations
const allTranslations: Record<string, Translations> = {
  en,
  cs,
  de,
  fr,
  it,
  es,
};

// Valid language codes (for validation)
const validLanguageCodes = Object.keys(allTranslations);

// Hardcoded fallback if validation fails
const FALLBACK_LANGUAGE: LanguageCode = 'en';

/**
 * Validate and resolve the default language.
 * Ensures the configured defaultLanguage is valid and has UI translations.
 */
function resolveDefaultLanguage(): LanguageCode {
  const configured = tourDefaultLanguage;
  const tourLanguages = getAllAvailableLanguageCodes();

  // Check if configured language has UI translations
  if (!(configured in allTranslations)) {
    console.warn(
      `[Languages] Invalid defaultLanguage "${configured}" in metadata.json. ` +
      `No UI translation exists. Valid options: ${validLanguageCodes.join(', ')}. ` +
      `Falling back to "${FALLBACK_LANGUAGE}".`
    );
    return FALLBACK_LANGUAGE;
  }

  // Check if configured language exists in tours
  if (!tourLanguages.includes(configured)) {
    console.warn(
      `[Languages] defaultLanguage "${configured}" has no tour content. ` +
      `Available tour languages: ${tourLanguages.join(', ')}. ` +
      `The app will still work but users won't see content in the default language.`
    );
  }

  return configured as LanguageCode;
}

/**
 * Default language for the app.
 * Configured via `defaultLanguage` field in tour metadata.json.
 *
 * Used when:
 * - User's browser language is not supported
 * - A tour is not available in the requested language
 * - No language preference has been set
 *
 * A live binding: recomputed whenever data is (re)installed.
 */
export let defaultLanguage: LanguageCode = FALLBACK_LANGUAGE;

/**
 * Supported UI languages for this build, derived from the installed tour data:
 * only languages that have corresponding tour content are included, with UI
 * text overrides (src/data/ui/<code>.json, or the manifest's `ui`) merged over
 * the built-in locale.
 *
 * One object, refilled in place by `rebuildLanguages()`, so references taken
 * at import time (the translation provider holds one) stay current.
 */
export const supportedLanguages: Partial<Record<LanguageCode, Translations>> = {};

function rebuildLanguages(): void {
  defaultLanguage = resolveDefaultLanguage();

  const uiOverrides = getUiOverrides();
  const tourLanguages = getAllAvailableLanguageCodes();
  const supported: Partial<Record<LanguageCode, Translations>> = {};

  for (const code of tourLanguages) {
    const builtIn = allTranslations[code];
    const override = uiOverrides[code];

    if (builtIn || override) {
      // A language with no built-in locale still gets a usable interface:
      // English text, which the override then replaces string by string. That
      // beats the old behaviour of dropping the language from the switcher,
      // and gives whoever is translating a sensible starting point rather than
      // a blank screen.
      const base = builtIn ?? allTranslations[defaultLanguage];
      supported[code as LanguageCode] = override ? deepMerge(base, override) : base;
    } else {
      console.warn(
        `[Languages] Tour uses language "${code}" but no UI translation exists. ` +
        `UI will fall back to "${defaultLanguage}". Add src/data/ui/${code}.json ` +
        `(or use the editor) to translate the interface.`
      );
    }
  }

  // Ensure default language is always included
  if (!(defaultLanguage in supported) && defaultLanguage in allTranslations) {
    supported[defaultLanguage] = allTranslations[defaultLanguage];
  }

  for (const key of Object.keys(supportedLanguages)) delete supportedLanguages[key as LanguageCode];
  Object.assign(supportedLanguages, supported);
}

rebuildLanguages();
onDataInstalled(rebuildLanguages);

/**
 * Type representing the languages available in this build.
 * Automatically derived from tour languages.
 */
export type SupportedLanguageCode = keyof typeof supportedLanguages;

/**
 * Check if a language code is supported in this build.
 */
export function isLanguageSupported(code: string): code is SupportedLanguageCode {
  return code in supportedLanguages;
}
