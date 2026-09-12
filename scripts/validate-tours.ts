/**
 * Validates every tour data file against the generated JSON Schemas and exits
 * non-zero on any problem. Catches unsupported/misspelled properties, invalid
 * enum values (stop `type`, `mapProvider`, per-provider `mapStyleId`, …) and missing
 * required fields per stop type.
 *
 * Run directly (`bun run validate`) or as the pre-step of `bun run build`.
 * Schemas come from scripts/generate-schema.ts — run `bun run schema` first if
 * you changed types.ts.
 */
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { Glob } from 'bun';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ajv = new Ajv({ allErrors: true, discriminator: true, strict: false });
addFormats(ajv);

const tourSchema = require(resolve(root, 'src/schema/tour-file.schema.json'));
const metaSchema = require(resolve(root, 'src/schema/tour-metadata.schema.json'));
const appSchema = require(resolve(root, 'src/schema/app-config.schema.json'));
const validateTour = ajv.compile(tourSchema);
const validateMeta = ajv.compile(metaSchema);
const validateApp = ajv.compile(appSchema);

/** Turn an Ajv error into a single human-readable line. */
function formatError(e: ErrorObject): string {
  const where = e.instancePath || '(root)';
  if (e.keyword === 'additionalProperties') {
    return `${where}: unsupported property "${(e.params as any).additionalProperty}"`;
  }
  if (e.keyword === 'enum') {
    return `${where} ${e.message} → ${JSON.stringify((e.params as any).allowedValues)}`;
  }
  if (e.keyword === 'discriminator') {
    return `${where}: ${e.message} (check the stop "type" value)`;
  }
  return `${where} ${e.message}`;
}

// Only the source of truth — public/data/tour is generated from this by the
// vite-config sync plugin, so validating it too would double-report errors.
const tourFiles = [
  ...new Glob('src/data/tour/**/*.json').scanSync({ cwd: root, absolute: true }),
];

let failed = 0;

for (const file of tourFiles.sort()) {
  const rel = relative(root, file);
  const isMeta = file.endsWith('/metadata.json');
  const isApp = file.endsWith('/app.json');
  const data = require(file);
  const validate = isApp ? validateApp : isMeta ? validateMeta : validateTour;

  if (validate(data)) {
    console.log(`✓ ${rel}`);
    continue;
  }

  failed++;
  console.error(`\n✗ ${rel}`);
  for (const err of validate.errors ?? []) {
    console.error(`    ${formatError(err)}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed validation.`);
  process.exit(1);
}
console.log(`\nAll ${tourFiles.length} tour file(s) valid.`);
