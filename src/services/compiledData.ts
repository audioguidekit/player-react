/**
 * The compiled data source: reads src/data/** at build time (import.meta.glob)
 * and assembles it into the same `Manifest` the runtime source delivers, so
 * `installManifest()` is the only normalisation there is.
 *
 * Imported dynamically, and only when DATA_SOURCE is 'compiled' — in a manifest
 * build this module (and with it every tour file) is never bundled.
 */
import type { TourFile, TourMetadataFile, AppConfigFile, CustomTheme, UiText, Manifest, ManifestTour, RouteGeoJSON, MapRouteConfig } from '@audioguidekit/schema';
import { SCHEMA_VERSION } from '@audioguidekit/schema';

// Tour JSON files (language files and metadata.json both match; told apart below).
// Uses /src/data/tour/ path - files must be in src directory for Vite to import them.
const tourModules = import.meta.glob<TourFile>('/src/data/tour/**/*.json', {
  eager: true,
  import: 'default',
});

const metadataModules = import.meta.glob<TourMetadataFile>('/src/data/tour/**/metadata.json', {
  eager: true,
  import: 'default',
});

// App-level config for the tour-selection landing screen (optional, single file)
const appConfigModules = import.meta.glob<AppConfigFile>('/src/data/tour/app.json', {
  eager: true,
  import: 'default',
});

// GeoJSON route files (resolved at build time, so no runtime fetch needed)
const geojsonModules = import.meta.glob<RouteGeoJSON>('/src/data/tour/**/*.geojson', {
  eager: true,
  import: 'default',
});

// Custom themes: JSON, deep-merged over a built-in theme by the theme registry.
const themeModules = import.meta.glob<CustomTheme>('/src/data/themes/*.json', {
  eager: true,
  import: 'default',
});

// UI text overrides: src/data/ui/<code>.json
const uiModules = import.meta.glob<UiText>('/src/data/ui/*.json', {
  eager: true,
  import: 'default',
});

/** Files in the tour folder that are not language files. */
const isLanguageFile = (path: string) =>
  !path.includes('metadata.json') &&
  !path.includes('app.json') &&
  !path.includes('index.json') &&
  !path.includes('-original');

/**
 * Resolve a mapRoute.geoJSON relative path against the metadata file's
 * directory. The route moves into `tour.route`; the path is dropped from the
 * metadata, since a manifest has no sibling files to resolve it against.
 */
function resolveRoute(metadata: TourMetadataFile, metadataPath: string): { metadata: TourMetadataFile; route?: RouteGeoJSON } {
  if (!metadata.mapRoute || typeof metadata.mapRoute === 'boolean') return { metadata };
  const config = metadata.mapRoute as MapRouteConfig;
  if (typeof config.geoJSON !== 'string') return { metadata }; // already resolved or absent

  const { geoJSON, ...rest } = config;
  const dir = metadataPath.substring(0, metadataPath.lastIndexOf('/'));
  const resolvedPath = `${dir}/${geoJSON.replace(/^\.\//, '')}`;

  const route = geojsonModules[resolvedPath];
  if (!route) {
    console.warn(`[TourDiscovery] mapRoute.geoJSON not found: ${resolvedPath} — falling back to straight lines`);
    return { metadata: { ...metadata, mapRoute: rest } };
  }
  return { metadata: { ...metadata, mapRoute: rest }, route };
}

export function buildCompiledManifest(): Manifest {
  const metadataById = new Map<string, { metadata: TourMetadataFile; route?: RouteGeoJSON }>();
  for (const [path, metadata] of Object.entries(metadataModules)) {
    if (!metadata?.id) {
      console.warn(`[TourDiscovery] Skipping metadata ${path}: missing id field`);
      continue;
    }
    metadataById.set(metadata.id, resolveRoute(metadata, path));
  }

  const tours = new Map<string, ManifestTour>();
  for (const [path, file] of Object.entries(tourModules)) {
    if (!isLanguageFile(path)) continue;

    // Validate tour data has required fields
    if (!file?.id || !file?.language) {
      console.warn(`[TourDiscovery] Skipping ${path}: missing id or language field`);
      continue;
    }

    let tour = tours.get(file.id);
    if (!tour) {
      const found = metadataById.get(file.id);
      tour = { id: file.id, metadata: found?.metadata ?? { id: file.id }, languages: {}, ...(found?.route && { route: found.route }) };
      tours.set(file.id, tour);
    }
    tour.languages[file.language] = file;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    app: Object.values(appConfigModules)[0],
    themes: Object.values(themeModules).filter((theme) => {
      // A file without an id can't be referenced by a tour's themeId, so skip it
      // rather than registering something unreachable under a guessed name.
      return !!theme?.id;
    }),
    ui: Object.fromEntries(
      Object.entries(uiModules).map(([path, value]) => [path.split('/').pop()!.replace(/\.json$/, ''), value]),
    ),
    tours: [...tours.values()],
  };
}

/**
 * Dev-only: re-read the tour JSON from disk. Only the JSON is re-read: themes
 * and route GeoJSON are code, and changing those still needs a reload.
 */
export async function reloadCompiledManifest(): Promise<Manifest> {
  const stamp = Date.now();
  const reread = async (modules: Record<string, unknown>) => {
    await Promise.all(
      Object.keys(modules).map(async (path) => {
        const fresh = await import(/* @vite-ignore */ `${path}?reload=${stamp}`);
        modules[path] = fresh.default;
      }),
    );
  };

  await Promise.all([
    reread(tourModules as Record<string, unknown>),
    reread(metadataModules as Record<string, unknown>),
    reread(appConfigModules as Record<string, unknown>),
  ]);

  return buildCompiledManifest();
}
