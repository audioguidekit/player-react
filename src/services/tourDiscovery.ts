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

import { TourData, TourMetadata, AppConfig, Language, RouteGeoJSON, MapRouteConfig } from '../../types';

// Import all tour JSON files at build time (language-specific files)
// Uses /src/data/tour/ path - files must be in src directory for Vite to import them
// Excludes metadata.json and any original/backup files
const tourModules = import.meta.glob<TourData>(
  '/src/data/tour/**/*.json',
  {
    eager: true,
    import: 'default',
  }
);

// Import metadata files separately
const metadataModules = import.meta.glob<TourMetadata>(
  '/src/data/tour/**/metadata.json',
  {
    eager: true,
    import: 'default',
  }
);

// App-level config for the tour-selection landing screen (optional, single file)
const appConfigModules = import.meta.glob<AppConfig>(
  '/src/data/tour/app.json',
  {
    eager: true,
    import: 'default',
  }
);

// Import GeoJSON route files (resolved at build time, so no runtime fetch needed)
const geojsonModules = import.meta.glob<RouteGeoJSON>(
  '/src/data/tour/**/*.geojson',
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

// Map API keys from environment variables — env takes priority over metadata.json
const MAP_ENV_KEYS: Partial<Record<string, string>> = {
  mapbox:    import.meta.env.VITE_MAPBOX_API_KEY,
  jawg:      import.meta.env.VITE_JAWG_API_KEY,
  maptiler:  import.meta.env.VITE_MAPTILER_API_KEY,
  carto:     import.meta.env.VITE_CARTO_API_KEY,
};

/**
 * Resolve a mapRoute.geoJSON relative path string to the parsed GeoJSON object.
 * Called during metadata registry build so the resolved object flows into TourData at runtime.
 */
function resolveMapRouteGeoJSON(metadata: TourMetadata, metadataPath: string): TourMetadata {
  if (!metadata.mapRoute || typeof metadata.mapRoute === 'boolean') return metadata;
  const config = metadata.mapRoute as MapRouteConfig;
  if (typeof config.geoJSON !== 'string') return metadata; // already resolved or absent

  // Resolve the relative path against the metadata file's directory
  const dir = metadataPath.substring(0, metadataPath.lastIndexOf('/'));
  const relativePath = config.geoJSON.replace(/^\.\//, '');
  const resolvedPath = `${dir}/${relativePath}`;

  const parsed = geojsonModules[resolvedPath];
  if (!parsed) {
    console.warn(`[TourDiscovery] mapRoute.geoJSON not found: ${resolvedPath} — falling back to straight lines`);
    const { geoJSON: _, ...rest } = config;
    return { ...metadata, mapRoute: rest };
  }

  return { ...metadata, mapRoute: { ...config, geoJSON: parsed } };
}

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

    registry[metadata.id] = resolveMapRouteGeoJSON(metadata, path);
    console.log(`[TourDiscovery] Loaded metadata for tour: ${metadata.id}`);
  }

  return registry;
}

// Build metadata registry once at module load
const metadataRegistry = buildMetadataRegistry();

// The optional app.json (first match wins; there should only ever be one).
const appConfig: AppConfig = Object.values(appConfigModules)[0] ?? {};

/**
 * Get the app-level config for the tour-selection landing screen.
 * Returns an empty object when no src/data/tour/app.json is present, so callers
 * can read fields with optional chaining and fall back to their own defaults.
 */
export function getAppConfig(): AppConfig {
  return appConfig;
}

/**
 * Get the default language from tour metadata.
 * Returns the defaultLanguage from the first tour's metadata, or 'en' as ultimate fallback.
 */
export function getDefaultLanguage(): string {
  // App-level config wins when it sets a default language for the picker
  if (appConfig.defaultLanguage) {
    return appConfig.defaultLanguage;
  }
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
    // Skip metadata, app config, index files and backups
    if (
      path.includes('metadata.json') ||
      path.includes('app.json') ||
      path.includes('index.json') ||
      path.includes('-original')
    ) {
      continue;
    }

    // Validate tour data has required fields
    if (!tourData?.id || !tourData?.language) {
      console.warn(`[TourDiscovery] Skipping ${path}: missing id or language field`);
      continue;
    }

    const { id, language } = tourData;

    // Hidden fixture/test tours (id prefixed with "_") are kept in dev and test
    // builds — routable by URL via getTour() — but excluded from production so
    // they never ship in a customer app.
    if (import.meta.env.PROD && id.startsWith('_')) {
      continue;
    }

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

    // A style.json URL from the env overrides the basemap for every tour — the way
    // to bring your own map without committing its API key to metadata.json.
    if (import.meta.env.VITE_MAP_STYLE) {
      mergedTourData.mapStyle = import.meta.env.VITE_MAP_STYLE;
    }

    // Inject map API key from env var if available (env takes priority over metadata.json)
    if (mergedTourData.mapProvider) {
      const envKey = MAP_ENV_KEYS[mergedTourData.mapProvider];
      if (envKey) mergedTourData.mapApiKey = envKey;
    }

    // Store merged tour by language
    registry[id][language] = mergedTourData;

    console.log(`[TourDiscovery] Registered: ${id} (${language}) from ${path}${metadata ? ' (with metadata)' : ''}`);
  }

  return registry;
}

// Build registry once at module load
const tourRegistry = buildTourRegistry();

/**
 * Get all available tour IDs.
 *
 * Honors the optional app.json `tourOrder`: listed ids come first in the given
 * order, then any remaining discovered tours in their natural order. Ids in
 * `tourOrder` that don't match a discovered tour are ignored.
 */
export function getAvailableTourIds(): string[] {
  // Hidden tours (id prefixed with "_") are routable by URL but never listed in
  // the picker, default-tour selection, or language aggregation.
  const discovered = Object.keys(tourRegistry).filter(id => !id.startsWith('_'));
  const order = appConfig.tourOrder;
  if (!order?.length) return discovered;

  const known = new Set(discovered);
  const ordered = order.filter(id => known.has(id));
  const rest = discovered.filter(id => !ordered.includes(id));
  return [...ordered, ...rest];
}

// Hardcoded fallback if no tours are discovered (app is non-functional anyway)
const FALLBACK_DEFAULT_TOUR_ID = 'tour';

/**
 * Get the default tour ID for the app.
 *
 * The app is a single-tour deployment, so this returns the first tour
 * discovered in src/data/tour/ at build time. Used for the root redirect and
 * progress-tracking key, so the URL slug always matches the bundled tour's
 * actual `id` and can never drift from the data.
 */
export function getDefaultTourId(): string {
  return getAvailableTourIds()[0] ?? FALLBACK_DEFAULT_TOUR_ID;
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
 * Get one TourData per available tour, resolved in the preferred language
 * (with the standard language fallback). Used to render the tour selection
 * screen — each entry carries the localized title/description/image/meta.
 * Tours with no resolvable language are skipped.
 */
export function getAllTours(
  preferredLanguage: string,
  fallbackLanguage: string = defaultLanguage
): TourData[] {
  return getAvailableTourIds()
    .map(id => getTourWithFallback(id, preferredLanguage, fallbackLanguage))
    .filter((tour): tour is TourData => tour !== null);
}

/**
 * Get the full tour registry (for debugging)
 */
export function getTourRegistry(): TourRegistry {
  return tourRegistry;
}
