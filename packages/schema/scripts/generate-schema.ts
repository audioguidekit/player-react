/**
 * Generates the JSON Schemas from the TypeScript contracts in packages/schema/src.
 *
 *   TourFile          → tour-file.schema.json      (en.json, de.json, …)
 *   TourMetadataFile  → tour-metadata.schema.json  (metadata.json)
 *   AppConfigFile     → app-config.schema.json     (app.json)
 *   Manifest          → manifest.schema.json       (runtime manifest.json)
 *
 * The TypeScript types stay the single source of truth — re-run this whenever
 * they change (from the repo root: `bun run schema`).
 *
 * The schemas power three things:
 *   1. Live editor validation (.vscode/settings.json maps files → schema)
 *   2. The build/CI gate (scripts/validate-tours.ts, run before vite build)
 *   3. validateManifest() in the published package
 */
import { createGenerator, type Schema } from 'ts-json-schema-generator';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'src/schemas');
const tsconfig = resolve(root, 'tsconfig.json');
const FILES: Record<string, string> = {
  TourFile: resolve(root, 'src/authoring.ts'),
  TourMetadataFile: resolve(root, 'src/authoring.ts'),
  AppConfigFile: resolve(root, 'src/authoring.ts'),
  Manifest: resolve(root, 'src/manifest.ts'),
};

/** Providers with a fixed style list — keep in sync with docs/map.md. */
const PROVIDER_STYLES: Record<string, string[]> = {
  openfreemap: ['bright', 'liberty', 'positron', 'fiord', 'dark'],
  carto: [
    'rastertiles/voyager',
    'light_all',
    'dark_all',
    'light_nolabels',
    'dark_nolabels',
  ],
};

function generate(type: string): Schema {
  return createGenerator({ path: FILES[type], tsconfig, type, topRef: true }).createSchema(type);
}

/**
 * Within a closed (additionalProperties:false) object schema, the `$schema` key
 * that data files carry would otherwise be rejected — allow it explicitly.
 */
function allowSchemaKey(def: Schema): void {
  def.properties = { ...def.properties, $schema: { type: 'string' } };
}

/**
 * OpenFreeMap and CARTO only serve a fixed set of style IDs (other providers accept
 * arbitrary strings). Constrain mapStyleId to the documented set for those two.
 */
function addStyleConditionals(def: Schema): void {
  if (!def.properties?.mapProvider) return;
  const allOf = (def.allOf as Schema[]) ?? [];
  for (const [provider, styles] of Object.entries(PROVIDER_STYLES)) {
    allOf.push({
      if: {
        properties: { mapProvider: { const: provider } },
        required: ['mapProvider'],
      },
      then: {
        properties: { mapStyleId: { enum: styles } },
      },
    });
  }
  def.allOf = allOf;
}

/**
 * Turn the stops `anyOf` union into a `oneOf` with a `type` discriminator so Ajv
 * reports errors against the matching variant only (e.g. "stop 3 of type 'audio'
 * is missing 'image'") instead of dumping every variant's failures.
 */
function addStopDiscriminator(def: Schema): void {
  const items = def.properties?.stops as Schema | undefined;
  const variants = (items?.items as Schema | undefined)?.anyOf as Schema[] | undefined;
  if (!items?.items || !variants) return;
  (items.items as Schema) = { oneOf: variants, discriminator: { propertyName: 'type' } };
}

/**
 * A CustomTheme is a deep partial of ThemeConfig, but the TypeScript `DeepPartial` cannot
 * express that for the generator: it does not evaluate conditional types on optional members
 * (`mapMarkers?: { active: {...} }`), so their members came out required and a theme setting
 * one map colour was rejected. Drop every `required` below the root (only `id` stays) instead.
 */
function makeDeepPartial(node: Schema): void {
  for (const child of Object.values((node.properties as Record<string, Schema>) ?? {})) {
    delete child.required;
    makeDeepPartial(child);
  }
  for (const key of ['items', 'additionalProperties'] as const) {
    const child = node[key];
    if (child && typeof child === 'object') {
      delete (child as Schema).required;
      makeDeepPartial(child as Schema);
    }
  }
  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    for (const child of (node[key] as Schema[] | undefined) ?? []) {
      delete child.required;
      makeDeepPartial(child);
    }
  }
}

/** Follow `$ref` wrappers (type aliases emit these) to the concrete object def. */
function resolveDef(schema: Schema, rootType: string): Schema {
  let def = (schema.definitions?.[rootType] as Schema) ?? schema;
  while (def?.$ref) {
    const name = String(def.$ref).split('/').pop()!;
    def = schema.definitions![name] as Schema;
  }
  return def;
}

/**
 * Apply the conditionals/discriminator to every definition that needs them —
 * a manifest embeds TourFile and TourMetadata as nested definitions, the
 * per-file schemas have them at the root.
 */
function finalize(schema: Schema, rootType: string): Schema {
  for (const def of Object.values(schema.definitions ?? {}) as Schema[]) {
    if (typeof def !== 'object' || !def.properties) continue;
    addStyleConditionals(def);
    if (def.properties.stops) addStopDiscriminator(def);
  }
  const customTheme = schema.definitions?.CustomTheme as Schema | undefined;
  if (customTheme) makeDeepPartial(customTheme);
  // Data files carry an editor-only `$schema` hint; a manifest may too.
  allowSchemaKey(resolveDef(schema, rootType));
  return schema;
}

function write(rootType: string, file: string): void {
  const schema = finalize(generate(rootType), rootType);
  writeFileSync(resolve(outDir, file), JSON.stringify(schema, null, 2) + '\n');
  console.log(`✓ ${rootType} → packages/schema/src/schemas/${file}`);
}

write('TourFile', 'tour-file.schema.json');
write('TourMetadataFile', 'tour-metadata.schema.json');
write('AppConfigFile', 'app-config.schema.json');
write('Manifest', 'manifest.schema.json');
