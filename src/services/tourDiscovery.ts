/**
 * Tour Discovery Service
 *
<<<<<<< Updated upstream
 * Uses Vite's import.meta.glob to automatically discover tour JSON files at build time.
 * Tours are indexed by their internal `id` and `language` fields, not by filename.
 * This allows flexible file organization while maintaining language-based tour loading.
 */

import { TourData, Language } from '../../types';
import { defaultLanguage } from '../config/languages';

// Import all tour JSON files at build time
// Excludes index.json and any original/backup files
const tourModules = import.meta.glob<TourData>(
  '/public/data/tours/**/*.json',
  {
    eager: true,
    import: 'default',
  }
);
=======
 * Uses Vite's import.meta.glob to automatically discover all tour JSON files.
 * Language is determined by the "language" field inside each JSON, not the filename.
 *
 * Supports future structure:
 * /public/data/tours/
 *   ├── barcelona/
 *   │   ├── en.json  ← "language": "en", "id": "barcelona"
 *   │   └── cs.json  ← "language": "cs", "id": "barcelona"
 *   └── london/
 *       └── en.json  ← "language": "en", "id": "london"
 */

import { TourData, Language } from '../../types';
>>>>>>> Stashed changes

/**
 * Tour registry structure: { [tourId]: { [languageCode]: TourData } }
 */
export type TourRegistry = Record<string, Record<string, TourData>>;

/**
<<<<<<< Updated upstream
=======
 * Discovered tour entry with metadata
 */
export interface DiscoveredTour {
  tour: TourData;
  path: string;
}

// Use import.meta.glob to discover all tour JSON files at build time
// This automatically finds all .json files in the tours directory and subdirectories
const tourModules = import.meta.glob<TourData>('/public/data/tours/**/*.json', {
  eager: true,
  import: 'default',
});

/**
 * Files to exclude from tour discovery (not actual tours)
 */
const EXCLUDED_FILES = ['index.json', 'languages.json'];

/**
 * Check if a file should be excluded from tour discovery
 */
function shouldExcludeFile(path: string): boolean {
  const filename = path.split('/').pop() || '';
  return EXCLUDED_FILES.includes(filename) || filename.startsWith('tour-');
}

/**
 * Validates that a tour has required fields
 */
function isValidTour(data: unknown): data is TourData {
  if (!data || typeof data !== 'object') return false;
  const tour = data as Record<string, unknown>;
  return (
    typeof tour.id === 'string' &&
    typeof tour.language === 'string' &&
    typeof tour.title === 'string' &&
    Array.isArray(tour.stops)
  );
}

/**
>>>>>>> Stashed changes
 * Build the tour registry from discovered modules
 */
function buildTourRegistry(): TourRegistry {
  const registry: TourRegistry = {};

<<<<<<< Updated upstream
  for (const [path, tourData] of Object.entries(tourModules)) {
    // Skip index files and backups
    if (path.includes('index.json') || path.includes('-original')) {
      continue;
    }

    // Validate tour data has required fields
    if (!tourData?.id || !tourData?.language) {
      console.warn(`[TourDiscovery] Skipping ${path}: missing id or language field`);
      continue;
    }

    const { id, language } = tourData;
=======
  for (const [path, data] of Object.entries(tourModules)) {
    // Skip excluded files
    if (shouldExcludeFile(path)) {
      continue;
    }

    // Validate tour data
    if (!isValidTour(data)) {
      console.warn(`[TourDiscovery] Invalid tour data in ${path}, skipping`);
      continue;
    }

    const { id, language } = data;
>>>>>>> Stashed changes

    // Initialize tour entry if needed
    if (!registry[id]) {
      registry[id] = {};
    }

<<<<<<< Updated upstream
    // Store tour by language
    registry[id][language] = tourData;

    console.log(`[TourDiscovery] Registered: ${id} (${language}) from ${path}`);
=======
    // Check for duplicate language entries
    if (registry[id][language]) {
      console.warn(
        `[TourDiscovery] Duplicate tour found: ${id}/${language}. ` +
        `Using ${path}, overwriting previous entry.`
      );
    }

    registry[id][language] = data;
    console.log(`[TourDiscovery] Registered: ${id}/${language} from ${path}`);
>>>>>>> Stashed changes
  }

  return registry;
}

<<<<<<< Updated upstream
// Build registry once at module load
const tourRegistry = buildTourRegistry();

/**
 * Get all available tour IDs
 */
export function getAvailableTourIds(): string[] {
=======
// Build registry once at module load time
const tourRegistry = buildTourRegistry();

/**
 * Get all discovered tours
 */
export function getTourRegistry(): TourRegistry {
  return tourRegistry;
}

/**
 * Get all tour IDs
 */
export function getTourIds(): string[] {
>>>>>>> Stashed changes
  return Object.keys(tourRegistry);
}

/**
<<<<<<< Updated upstream
 * Get available languages for a specific tour
 */
export function getAvailableLanguages(tourId: string): string[] {
  return Object.keys(tourRegistry[tourId] || {});
}

/**
 * Get all available languages across all tours
 */
export function getAllAvailableLanguages(): Language[] {
=======
 * Get a specific tour by ID and language
 */
export function getTour(tourId: string, languageCode: string): TourData | null {
  return tourRegistry[tourId]?.[languageCode] || null;
}

/**
 * Get all available languages for a specific tour
 */
export function getTourLanguages(tourId: string): string[] {
  const tourLanguages = tourRegistry[tourId];
  return tourLanguages ? Object.keys(tourLanguages) : [];
}

/**
 * Get all language versions of a tour
 */
export function getTourAllLanguages(tourId: string): Record<string, TourData> {
  return tourRegistry[tourId] || {};
}

/**
 * Get available languages across all tours (union of all tour languages)
 * Returns Language objects with metadata
 */
export function getAvailableLanguages(): Language[] {
  // Collect unique language codes from all tours
>>>>>>> Stashed changes
  const languageCodes = new Set<string>();

  for (const tourLanguages of Object.values(tourRegistry)) {
    for (const code of Object.keys(tourLanguages)) {
      languageCodes.add(code);
    }
  }

<<<<<<< Updated upstream
  // Convert to Language objects with proper names
  const languageNames: Record<string, string> = {
    en: 'English',
    cs: 'Čeština',
    de: 'Deutsch',
    fr: 'Français',
    it: 'Italiano',
    es: 'Español',
  };

  return Array.from(languageCodes).map(code => ({
    code,
    name: languageNames[code] || code,
  }));
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
=======
  // Map to Language objects with display info
  const languageMetadata: Record<string, Omit<Language, 'code'>> = {
    en: { name: 'English', flag: '🇬🇧', countryCode: 'GB' },
    cs: { name: 'Česky', flag: '🇨🇿', countryCode: 'CZ' },
    de: { name: 'Deutsch', flag: '🇩🇪', countryCode: 'DE' },
    fr: { name: 'Français', flag: '🇫🇷', countryCode: 'FR' },
    it: { name: 'Italiano', flag: '🇮🇹', countryCode: 'IT' },
    es: { name: 'Español', flag: '🇪🇸', countryCode: 'ES' },
  };

  return Array.from(languageCodes)
    .map(code => ({
      code,
      ...languageMetadata[code] || {
        name: code.toUpperCase(),
        flag: '🏳️',
        countryCode: code.toUpperCase()
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get the first available tour (useful for single-tour apps)
 */
export function getDefaultTourId(): string | null {
  const ids = getTourIds();
  return ids.length > 0 ? ids[0] : null;
}

/**
 * Get a tour in the user's preferred language, with fallback
 * @param tourId - Tour ID
 * @param preferredLanguage - Preferred language code
 * @param fallbackLanguage - Fallback language (default: 'en')
>>>>>>> Stashed changes
 */
export function getTourWithFallback(
  tourId: string,
  preferredLanguage: string,
<<<<<<< Updated upstream
  fallbackLanguage: string = defaultLanguage
): TourData | null {
  // Try preferred language first
=======
  fallbackLanguage: string = 'en'
): TourData | null {
  // Try preferred language
>>>>>>> Stashed changes
  const preferred = getTour(tourId, preferredLanguage);
  if (preferred) return preferred;

  // Try fallback language
  const fallback = getTour(tourId, fallbackLanguage);
  if (fallback) return fallback;

<<<<<<< Updated upstream
  // Return first available language for this tour
  const availableLanguages = getAvailableLanguages(tourId);
  if (availableLanguages.length > 0) {
    return getTour(tourId, availableLanguages[0]);
=======
  // Return first available language
  const languages = getTourLanguages(tourId);
  if (languages.length > 0) {
    return getTour(tourId, languages[0]);
>>>>>>> Stashed changes
  }

  return null;
}

/**
<<<<<<< Updated upstream
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
=======
 * Debug: Log all discovered tours
 */
export function logDiscoveredTours(): void {
  console.log('[TourDiscovery] Discovered tours:');
  for (const [tourId, languages] of Object.entries(tourRegistry)) {
    console.log(`  ${tourId}: [${Object.keys(languages).join(', ')}]`);
  }
}

// Log discovered tours in development
if (import.meta.env.DEV) {
  logDiscoveredTours();
>>>>>>> Stashed changes
}
