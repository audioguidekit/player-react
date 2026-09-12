/**
 * Generates JSON Schemas for the tour data files from the TypeScript authoring
 * contracts in src/schema/authoring-types.ts.
 *
 *   TourFile          → src/schema/tour-file.schema.json   (en.json, de.json, …)
 *   TourMetadataFile  → src/schema/tour-metadata.schema.json (metadata.json)
 *
 * types.ts stays the single source of truth — re-run this whenever it changes:
 *   bun run schema
 *
 * The schemas power two things:
 *   1. Live editor validation (.vscode/settings.json maps files → schema)
 *   2. The build/CI gate (scripts/validate-tours.ts, run before vite build)
 */
import { createGenerator, type Schema } from 'ts-json-schema-generator';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, 'src/schema/authoring-types.ts');
const tsconfig = resolve(root, 'tsconfig.json');

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
  return createGenerator({ path, tsconfig, type, topRef: true }).createSchema(type);
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

/** Follow `$ref` wrappers (type aliases emit these) to the concrete object def. */
function resolveDef(schema: Schema, rootType: string): Schema {
  let def = (schema.definitions?.[rootType] as Schema) ?? schema;
  while (def?.$ref) {
    const name = String(def.$ref).split('/').pop()!;
    def = schema.definitions![name] as Schema;
  }
  return def;
}

function finalize(schema: Schema, rootType: string): Schema {
  const def = resolveDef(schema, rootType);
  allowSchemaKey(def);
  addStyleConditionals(def);
  if (rootType === 'TourFile') addStopDiscriminator(def);
  return schema;
}

function write(rootType: string, file: string): void {
  const schema = finalize(generate(rootType), rootType);
  const out = resolve(root, 'src/schema', file);
  writeFileSync(out, JSON.stringify(schema, null, 2) + '\n');
  console.log(`✓ ${rootType} → src/schema/${file}`);
}

write('TourFile', 'tour-file.schema.json');
write('TourMetadataFile', 'tour-metadata.schema.json');
write('AppConfigFile', 'app-config.schema.json');
