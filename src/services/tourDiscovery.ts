/**
 * Tour Discovery Service
 *
 * Holds the in-memory registries every screen reads: tours by id and language,
 * the app config, custom themes and UI text overrides.
 *
 * The registries are filled by ONE function, `installManifest()`, from a
 * `Manifest` (see @audioguidekit/schema). Where the manifest comes from is the
 * data source's business, chosen at build time (VITE_DATA_SOURCE):
 *
 *   compiled (default)  src/data/** is read with import.meta.glob and assembled
 *                       into a manifest by ./compiledData
 *   manifest            /data/manifest.json is fetched at startup by
 *                       ./manifestLoader (see docs/manifest-mode.md)
 *
 * Tours are indexed by their internal `id` and `language` fields, not by
 * filename. Properties in a language file override the tour's metadata.
 */

import type { TourData, TourMetadata, AppConfig, Language, MapRouteConfig } from '../../types';
import type { Manifest, CustomTheme, UiText } from '@audioguidekit/schema';
import { DATA_SOURCE } from './dataSource';

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

let metadataRegistry: MetadataRegistry = {};
let tourRegistry: TourRegistry = {};
let appConfig: AppConfig = {};
let customThemes: CustomTheme[] = [];
let uiOverrides: Record<string, UiText> = {};

/**
 * The default language of the installed data. A live binding: it changes when
 * a new manifest is installed (live preview), and is read at call time.
 */
export let defaultLanguage: string = FALLBACK_DEFAULT_LANGUAGE;

type DataListener = () => void;
const listeners = new Set<DataListener>();

/**
 * Run `listener` after every `installManifest()`. Modules that derive their own
 * state from the data (languages, themes, default tour, haptics) subscribe so a
 * re-installed manifest reaches them. Returns an unsubscribe function.
 */
export function onDataInstalled(listener: DataListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Resolve the tour's route: the manifest inlines it as `tour.route`, replacing
 * the `mapRoute.geoJSON` relative path that metadata.json uses on disk.
 */
function resolveMapRoute(tour: Manifest['tours'][number]): TourMetadata {
  const metadata = tour.metadata;
  const { route } = tour;
  const current = metadata.mapRoute;

  if (route && current) {
    const config: MapRouteConfig = typeof current === 'boolean' ? {} : current;
    return { ...metadata, mapRoute: { ...config, geoJSON: route } };
  }

  // A path with no inlined route can't be resolved (a manifest has no sibling
  // files). Draw straight lines rather than hand the map a string.
  if (current && typeof current !== 'boolean' && typeof current.geoJSON === 'string') {
    console.warn(`[TourDiscovery] ${metadata.id}: mapRoute.geoJSON is a path but no route was supplied — falling back to straight lines`);
    const { geoJSON: _, ...rest } = current;
    return { ...metadata, mapRoute: rest };
  }

  return metadata;
}

/**
 * THE normalisation step, shared by every data source: merges each tour's
 * metadata under its language files, resolves routes, applies env overrides,
 * and fills the registries. Replaces whatever was installed before.
 */
export function installManifest(manifest: Manifest): void {
  const nextMetadata: MetadataRegistry = {};
  const nextTours: TourRegistry = {};

  for (const tour of manifest.tours) {
    if (!tour?.id) {
      console.warn('[TourDiscovery] Skipping tour: missing id field');
      continue;
    }

    // Hidden fixture/test tours (id prefixed with "_") are kept in dev and test
    // builds — routable by URL via getTour() — but excluded from production so
    // they never ship in a customer app.
    const hidden = import.meta.env.PROD && tour.id.startsWith('_');

    const metadata = resolveMapRoute(tour);
    nextMetadata[tour.id] = metadata;

    for (const [language, file] of Object.entries(tour.languages ?? {})) {
      if (hidden) continue;

      // Merge metadata with tour data (tour data properties override metadata)
      const merged: TourData = { ...metadata, ...file } as TourData;

      // A style.json URL from the env overrides the basemap for every tour — the way
      // to bring your own map without committing its API key to metadata.json.
      if (import.meta.env.VITE_MAP_STYLE) {
        merged.mapStyle = import.meta.env.VITE_MAP_STYLE;
      }

      // Inject map API key from env var if available (env takes priority over metadata.json)
      if (merged.mapProvider) {
        const envKey = MAP_ENV_KEYS[merged.mapProvider];
        if (envKey) merged.mapApiKey = envKey;
      }

      (nextTours[tour.id] ??= {})[language] = merged;
    }
  }

  metadataRegistry = nextMetadata;
  tourRegistry = nextTours;
  appConfig = manifest.app ?? {};
  customThemes = manifest.themes ?? [];
  uiOverrides = manifest.ui ?? {};
  defaultLanguage = getDefaultLanguage();

  listeners.forEach((notify) => notify());
}

/**
 * Get the app-level config for the tour-selection landing screen.
 * Returns an empty object when there is none, so callers can read fields with
 * optional chaining and fall back to their own defaults.
 */
export function getAppConfig(): AppConfig {
  return appConfig;
}

/** Custom themes from the installed data, to be registered by the theme registry. */
export function getCustomThemes(): CustomTheme[] {
  return customThemes;
}

/** UI text overrides from the installed data, keyed by language code. */
export function getUiOverrides(): Record<string, UiText> {
  return uiOverrides;
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

/**
 * Dev-only: re-read every tour JSON from disk and install it again.
 *
 * An embedding editor may run the player with HMR off, so nothing
 * invalidates the eagerly imported JSON modules when the editor writes a file.
 * Re-importing each path under a fresh query string is what picks an edit up
 * without reloading the frame — which would throw away where the visitor had
 * scrolled to and which stop was open.
 *
 * Compiled data source only; a manifest-mode preview is fed whole manifests
 * (see previewBridge).
 */
export async function refreshTourData(): Promise<void> {
  if (!import.meta.env.DEV || DATA_SOURCE !== 'compiled') return;
  const { reloadCompiledManifest } = await import('./compiledData');
  installManifest(await reloadCompiledManifest());
}

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
