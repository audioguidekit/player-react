/**
 * Builds a runtime manifest (manifest.json) from the authored data in src/data:
 * tours, themes, UI text and app.json. The result is what a manifest-mode build
 * of the player fetches at /data/manifest.json (see docs/manifest-mode.md).
 *
 *   bun scripts/build-manifest.ts [--data src/data] [--out dist/data/manifest.json]
 *                                 [--include-hidden]
 *
 * Tours whose id starts with "_" (test fixtures) are left out unless
 * --include-hidden is passed. The output is checked with validateManifest(); any
 * problem is printed and the exit code is non-zero.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCHEMA_VERSION,
  validateManifest,
  type Manifest,
  type ManifestTour,
  type TourFile,
  type TourMetadataFile,
  type CustomTheme,
  type UiText,
  type AppConfigFile,
  type RouteGeoJSON,
} from '@audioguidekit/schema';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function option(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const dataDir = resolve(root, option('data') ?? 'src/data');
const outFile = resolve(root, option('out') ?? 'dist/data/manifest.json');
const includeHidden = process.argv.includes('--include-hidden');

/** The editor-only `$schema` hint has no place in a manifest. */
function readJson<T>(file: string): T {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (data && typeof data === 'object') delete data.$schema;
  return data as T;
}

function walk(dir: string, accept: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path, accept) : accept(path) ? [path] : [];
    });
}

// --- tours ---------------------------------------------------------------

const tourDir = join(dataDir, 'tour');
const jsonFiles = walk(tourDir, (f) => f.endsWith('.json'));

const isLanguageFile = (file: string) => {
  const name = basename(file);
  return name !== 'metadata.json' && name !== 'app.json' && name !== 'index.json' && !name.includes('-original');
};

const metadataById = new Map<string, { metadata: TourMetadataFile; route?: RouteGeoJSON }>();
for (const file of jsonFiles.filter((f) => basename(f) === 'metadata.json')) {
  const metadata = readJson<TourMetadataFile>(file);
  if (!metadata?.id) {
    console.warn(`! skipping ${relative(root, file)}: no id`);
    continue;
  }

  // metadata.json points at its route by relative path; a manifest has no
  // sibling files, so the route is inlined as `tour.route` and the path dropped.
  let route: RouteGeoJSON | undefined;
  if (metadata.mapRoute && typeof metadata.mapRoute === 'object' && typeof metadata.mapRoute.geoJSON === 'string') {
    const { geoJSON, ...rest } = metadata.mapRoute;
    const routeFile = resolve(dirname(file), geoJSON);
    if (existsSync(routeFile)) route = readJson<RouteGeoJSON>(routeFile);
    else console.warn(`! ${relative(root, file)}: route ${geoJSON} not found — dropped`);
    metadata.mapRoute = rest;
  }
  metadataById.set(metadata.id, { metadata, route });
}

const tours = new Map<string, ManifestTour>();
for (const file of jsonFiles.filter(isLanguageFile)) {
  const tour = readJson<TourFile>(file);
  if (!tour?.id || !tour?.language) {
    console.warn(`! skipping ${relative(root, file)}: missing id or language`);
    continue;
  }
  if (!includeHidden && tour.id.startsWith('_')) continue;

  let entry = tours.get(tour.id);
  if (!entry) {
    const found = metadataById.get(tour.id);
    entry = { id: tour.id, metadata: found?.metadata ?? { id: tour.id }, languages: {}, ...(found?.route && { route: found.route }) };
    tours.set(tour.id, entry);
  }
  entry.languages[tour.language] = tour;
}

// --- app, themes, ui ------------------------------------------------------

const appFile = join(tourDir, 'app.json');
const app = existsSync(appFile) ? readJson<AppConfigFile>(appFile) : undefined;

const themes = walk(join(dataDir, 'themes'), (f) => f.endsWith('.json'))
  .map((f) => readJson<CustomTheme>(f))
  .filter((theme) => !!theme?.id);

const ui: Record<string, UiText> = {};
for (const file of walk(join(dataDir, 'ui'), (f) => f.endsWith('.json'))) {
  ui[basename(file, '.json')] = readJson<UiText>(file);
}

// --- write ----------------------------------------------------------------

const manifest: Manifest = {
  schemaVersion: SCHEMA_VERSION,
  ...(app && { app }),
  themes,
  ui,
  tours: [...tours.values()],
};

const result = validateManifest(manifest);
if (!result.valid) {
  console.error(`\n✗ The manifest built from ${relative(root, dataDir)} is not valid:`);
  for (const error of result.errors) console.error(`    ${error}`);
  process.exit(1);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(manifest) + '\n');
console.log(
  `✓ ${relative(root, outFile)} — schema v${SCHEMA_VERSION}, ${manifest.tours.length} tour(s), ` +
    `${themes.length} theme(s), ${Object.keys(ui).length} UI language override(s)`,
);
