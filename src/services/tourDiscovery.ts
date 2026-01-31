/**
 * Tour Discovery Service
 *
 * Uses Vite's import.meta.glob to automatically discover tour JSON files at build time.
 * Tours are indexed by their internal `id` and `language` fields, not by filename.
 * This allows flexible file organization while maintaining language-based tour loading.
 *
 * Supports metadata.json files for shared properties across language versions.
 * Properties in language files override metadata properties.
 */

import { TourData, TourMetadata, Language } from '../../types';

// Import all tour JSON files at build time (language-specific files)
// Excludes metadata.json and any original/backup files
const tourModules = import.meta.glob<TourData>(
  '/public/data/tour/**/*.json',
  {
    eager: true,
    import: 'default',
  }
);

// Import metadata files separately
const metadataModules = import.meta.glob<TourMetadata>(
  '/public/data/tour/**/metadata.json',
  {
    eager: true,
    import: 'default',
  }
);

/**
 * Tour registry structure: { [tourId]: { [languageCode]: TourData } }
 */
export type TourRegistry = Record<string, Record<string, TourData>>;

/**
 * Metadata registry: { [tourId]: TourMetadata }
 */
type MetadataRegistry = Record<string, TourMetadata>;

// Hardcoded fallback if no defaultLanguage is set in metadata
const FALLBACK_DEFAULT_LANGUAGE = 'en';

/**
 * Build metadata registry from discovered metadata files
 */
function buildMetadataRegistry(): MetadataRegistry {
  const registry: MetadataRegistry = {};

  for (const [path, metadata] of Object.entries(metadataModules)) {
    if (!metadata?.id) {
      console.warn(`[TourDiscovery] Skipping metadata ${path}: missing id field`);
      continue;
    }

    registry[metadata.id] = metadata;
    console.log(`[TourDiscovery] Loaded metadata for tour: ${metadata.id}`);
  }

  return registry;
}

// Build metadata registry once at module load
const metadataRegistry = buildMetadataRegistry();

/**
 * Get the default language from tour metadata.
 * Returns the defaultLanguage from the first tour's metadata, or 'en' as ultimate fallback.
 */
export function getDefaultLanguage(): string {
  // Get the first tour's metadata that has a defaultLanguage set
  for (const metadata of Object.values(metadataRegistry)) {
    if (metadata.defaultLanguage) {
      return metadata.defaultLanguage;
    }
  }
  return FALLBACK_DEFAULT_LANGUAGE;
}

// Cache the default language at module load for consistent behavior
export const defaultLanguage = getDefaultLanguage();

/**
 * Build the tour registry from discovered modules
 * Merges metadata with language-specific files (language files override metadata)
 */
function buildTourRegistry(): TourRegistry {
  const registry: TourRegistry = {};

  for (const [path, tourData] of Object.entries(tourModules)) {
    // Skip metadata, index files and backups
    if (path.includes('metadata.json') || path.includes('index.json') || path.includes('-original')) {
      continue;
    }

    // Validate tour data has required fields
    if (!tourData?.id || !tourData?.language) {
      console.warn(`[TourDiscovery] Skipping ${path}: missing id or language field`);
      continue;
    }

    const { id, language } = tourData;

    // Initialize tour entry if needed
    if (!registry[id]) {
      registry[id] = {};
    }

    // Get metadata for this tour (if exists)
    const metadata = metadataRegistry[id];

    // Merge metadata with tour data (tour data properties override metadata)
    const mergedTourData: TourData = metadata
      ? { ...metadata, ...tourData }
      : tourData;

    // Store merged tour by language
    registry[id][language] = mergedTourData;

    console.log(`[TourDiscovery] Registered: ${id} (${language}) from ${path}${metadata ? ' (with metadata)' : ''}`);
  }

  return registry;
}

// Build registry once at module load
const tourRegistry = buildTourRegistry();

/**
 * Get all available tour IDs
 */
export function getAvailableTourIds(): string[] {
  return Object.keys(tourRegistry);
}

/**
 * Get available languages for a specific tour
 */
export function getAvailableLanguages(tourId: string): string[] {
  return Object.keys(tourRegistry[tourId] || {});
}

/**
 * Get all available languages across all tours
 */
export function getAllAvailableLanguages(): Language[] {
  const languageCodes = new Set<string>();

  for (const tourLanguages of Object.values(tourRegistry)) {
    for (const code of Object.keys(tourLanguages)) {
      languageCodes.add(code);
    }
  }

  // Language metadata including names, flags, and country codes for flag icons
  const languageMetadata: Record<string, { name: string; flag: string; countryCode: string }> = {
    en: { name: 'English', flag: '🇬🇧', countryCode: 'GB' },
    cs: { name: 'Čeština', flag: '🇨🇿', countryCode: 'CZ' },
    de: { name: 'Deutsch', flag: '🇩🇪', countryCode: 'DE' },
    fr: { name: 'Français', flag: '🇫🇷', countryCode: 'FR' },
    it: { name: 'Italiano', flag: '🇮🇹', countryCode: 'IT' },
    es: { name: 'Español', flag: '🇪🇸', countryCode: 'ES' },
  };

  return Array.from(languageCodes).map(code => {
    const metadata = languageMetadata[code] || { name: code, flag: '🏳️', countryCode: 'XX' };
    return {
      code,
      name: metadata.name,
      flag: metadata.flag,
      countryCode: metadata.countryCode,
    };
  });
}

/**
 * Get all available language codes across all tours (as string array)
 * Useful for filtering translations
 */
export function getAllAvailableLanguageCodes(): string[] {
  const languageCodes = new Set<string>();

  for (const tourLanguages of Object.values(tourRegistry)) {
    for (const code of Object.keys(tourLanguages)) {
      languageCodes.add(code);
    }
  }

  return Array.from(languageCodes);
}

/**
 * Get a tour by ID and language
 * Returns null if not found
 */
export function getTour(tourId: string, languageCode: string): TourData | null {
  return tourRegistry[tourId]?.[languageCode] || null;
}

/**
 * Get a tour with language fallback
 * Tries preferred language first, then fallback language (defaults to app's defaultLanguage)
 */
export function getTourWithFallback(
  tourId: string,
  preferredLanguage: string,
  fallbackLanguage: string = defaultLanguage
): TourData | null {
  // Try preferred language first
  const preferred = getTour(tourId, preferredLanguage);
  if (preferred) return preferred;

  // Try fallback language
  const fallback = getTour(tourId, fallbackLanguage);
  if (fallback) return fallback;

  // Return first available language for this tour
  const availableLanguages = getAvailableLanguages(tourId);
  if (availableLanguages.length > 0) {
    return getTour(tourId, availableLanguages[0]);
  }

  return null;
}

/**
 * Get any available tour in the preferred language
 * Useful when tourId is not specified
 */
export function getAnyTourByLanguage(
  preferredLanguage: string,
  fallbackLanguage: string = defaultLanguage
): TourData | null {
  const tourIds = getAvailableTourIds();
  if (tourIds.length === 0) return null;

  // Use first tour ID (could be enhanced to have a "default" tour concept)
  return getTourWithFallback(tourIds[0], preferredLanguage, fallbackLanguage);
}

/**
 * Get the full tour registry (for debugging)
 */
export function getTourRegistry(): TourRegistry {
  return tourRegistry;
}
