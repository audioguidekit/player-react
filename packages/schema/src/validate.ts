import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv';
import { SCHEMA_VERSION } from './manifest.js';
import { BUILT_IN_THEME_IDS } from './theme.js';
import manifestSchema from './schemas/manifest.schema.json' with { type: 'json' };
import tourFileSchema from './schemas/tour-file.schema.json' with { type: 'json' };
import tourMetadataSchema from './schemas/tour-metadata.schema.json' with { type: 'json' };
import appConfigSchema from './schemas/app-config.schema.json' with { type: 'json' };

/** The generated JSON Schemas, for tools that bring their own validator. */
export const jsonSchemas = {
  manifest: manifestSchema,
  tourFile: tourFileSchema,
  tourMetadata: tourMetadataSchema,
  appConfig: appConfigSchema,
} as const;

export interface ValidationResult {
  valid: boolean;
  /** One human-readable line per problem, each starting with where it is. */
  errors: string[];
}

// Everything below is created on first use, so importing this package for its
// types or SCHEMA_VERSION (the player does) leaves Ajv out of the bundle.
let ajv: Ajv | undefined;
let compiled: Map<object, ValidateFunction> | undefined;

function validatorFor(schema: object): ValidateFunction {
  ajv ??= new Ajv({ allErrors: true, discriminator: true, strict: false });
  compiled ??= new Map();
  let fn = compiled.get(schema);
  if (!fn) {
    fn = ajv.compile(schema);
    compiled.set(schema, fn);
  }
  return fn;
}

/** `/tours/0/languages/en/stops/3` → `tours[0].languages.en.stops[3]` */
function formatPath(pointer: string): string {
  if (!pointer) return '(root)';
  return pointer
    .split('/')
    .slice(1)
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((out, part) => (/^\d+$/.test(part) ? `${out}[${part}]` : out ? `${out}.${part}` : part), '');
}

/** Turn an Ajv error into a single human-readable line. */
export function formatAjvError(e: ErrorObject): string {
  const where = formatPath(e.instancePath);
  const params = e.params as Record<string, unknown>;
  switch (e.keyword) {
    case 'additionalProperties':
      return `${where}: unsupported property "${params.additionalProperty}"`;
    case 'enum':
      return `${where} ${e.message} → ${JSON.stringify(params.allowedValues)}`;
    case 'discriminator':
      return `${where}: ${e.message} (check the stop "type" value)`;
    case 'required':
      return `${where}: missing required property "${params.missingProperty}"`;
    default:
      return `${where} ${e.message}`;
  }
}

function run(schema: object, value: unknown): ValidationResult {
  const validate = validatorFor(schema);
  if (validate(value)) return { valid: true, errors: [] };
  // `oneOf`/`anyOf` wrappers repeat what their branches already say.
  const errors = (validate.errors ?? [])
    .filter((e) => e.keyword !== 'oneOf' && e.keyword !== 'anyOf')
    .map(formatAjvError);
  return { valid: false, errors: [...new Set(errors)] };
}

export const validateTourFile = (value: unknown): ValidationResult => run(tourFileSchema, value);
export const validateTourMetadata = (value: unknown): ValidationResult => run(tourMetadataSchema, value);
export const validateAppConfig = (value: unknown): ValidationResult => run(appConfigSchema, value);

type Loose = Record<string, any>;
const isObject = (v: unknown): v is Loose => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Rules the JSON Schema cannot express.
 *
 * `totalStops` is the denominator of the player's progress percentage, and only
 * an audio track reaching 100% ever marks a stop complete, so counting every
 * stop leaves the bar permanently short of 100% on any tour with a non-audio
 * stop — silently.
 *
 * References: every theme named by `app.themeId`, a tour's `themeId` (metadata or
 * language file) or a theme's `extends` must be built in or defined in the manifest, and
 * every id in `app.tourOrder` must be a tour. The player would quietly fall back to
 * the default theme / skip the id; a publisher wants to hear about the typo instead.
 * `extends` chains between custom themes are supported by the player; cycles are not.
 */
export function semanticErrors(manifest: Loose): string[] {
  const errors: string[] = [];
  const tourIds = new Set<string>();
  const customThemeIds = new Set<string>();
  const builtIn = new Set<string>(BUILT_IN_THEME_IDS);

  const themes: Loose[] = Array.isArray(manifest.themes) ? manifest.themes : [];
  themes.forEach((theme, i) => {
    if (customThemeIds.has(theme.id)) errors.push(`themes[${i}].id: duplicate theme id "${theme.id}"`);
    if (builtIn.has(theme.id)) {
      errors.push(`themes[${i}].id: "${theme.id}" is a built-in theme and cannot be redefined`);
    }
    customThemeIds.add(theme.id);
  });
  const knownTheme = (id: unknown) => typeof id === 'string' && (builtIn.has(id) || customThemeIds.has(id));
  const themeList = () => [...builtIn, ...customThemeIds].map((id) => `"${id}"`).join(', ');

  const extendsOf = new Map<string, string>();
  themes.forEach((theme, i) => {
    if (theme.extends === undefined) return;
    if (!knownTheme(theme.extends)) {
      errors.push(`themes[${i}].extends: unknown theme "${theme.extends}" (available: ${themeList()})`);
      return;
    }
    extendsOf.set(theme.id, theme.extends);
  });
  // A cycle is reported once, at the first theme (in file order) that lies on it.
  const reported = new Set<string>();
  themes.forEach((theme, i) => {
    const chain: string[] = [];
    let id: string | undefined = theme.id;
    while (id !== undefined && extendsOf.has(id) && !chain.includes(id)) {
      chain.push(id);
      id = extendsOf.get(id);
    }
    if (id !== undefined && chain.includes(id) && !reported.has(id)) {
      const cycle = chain.slice(chain.indexOf(id));
      cycle.forEach((member) => reported.add(member));
      errors.push(`themes[${i}].extends: cycle ${[...cycle, id].join(' → ')}`);
    }
  });

  const app = isObject(manifest.app) ? manifest.app : undefined;
  if (app?.themeId !== undefined && !knownTheme(app.themeId)) {
    errors.push(`app.themeId: unknown theme "${app.themeId}" (available: ${themeList()})`);
  }

  const tours: Loose[] = Array.isArray(manifest.tours) ? manifest.tours : [];
  tours.forEach((tour: Loose, i: number) => {
    const at = `tours[${i}]`;
    if (tourIds.has(tour.id)) errors.push(`${at}.id: duplicate tour id "${tour.id}"`);
    tourIds.add(tour.id);
    if (tour.metadata?.id !== tour.id) {
      errors.push(`${at}.metadata.id: "${tour.metadata?.id}" does not match the tour id "${tour.id}"`);
    }
    if (tour.metadata?.themeId !== undefined && !knownTheme(tour.metadata.themeId)) {
      errors.push(`${at}.metadata.themeId: unknown theme "${tour.metadata.themeId}" (available: ${themeList()})`);
    }
    for (const [lang, file] of Object.entries<Loose>(tour.languages ?? {})) {
      const lat = `${at}.languages.${lang}`;
      if (file?.id !== tour.id) errors.push(`${lat}.id: "${file?.id}" does not match the tour id "${tour.id}"`);
      if (file?.language !== lang) errors.push(`${lat}.language: "${file?.language}" does not match its key "${lang}"`);
      if (file?.themeId !== undefined && !knownTheme(file.themeId)) {
        errors.push(`${lat}.themeId: unknown theme "${file.themeId}" (available: ${themeList()})`);
      }
      const audio = (file?.stops ?? []).filter((s: Loose) => s?.type === 'audio').length;
      if (Array.isArray(file?.stops) && file.totalStops !== audio) {
        errors.push(
          `${lat}.totalStops: is ${file.totalStops} but the tour has ${audio} audio stop(s); totalStops counts audio stops only`,
        );
      }
    }
    if (Object.keys(tour.languages ?? {}).length === 0) errors.push(`${at}.languages: a tour needs at least one language`);
  });

  if (Array.isArray(app?.tourOrder)) {
    app.tourOrder.forEach((id: unknown, i: number) => {
      if (!tourIds.has(id as string)) errors.push(`app.tourOrder[${i}]: no tour with id "${id}"`);
    });
  }

  return errors;
}

/**
 * Validate a manifest: the schema version first (a different version cannot be
 * judged against this version's schema, so the check stops there), then the
 * generated JSON Schema, then the cross-field rules the schema cannot express.
 */
export function validateManifest(value: unknown): ValidationResult {
  if (!isObject(value)) return { valid: false, errors: ['(root): a manifest must be a JSON object'] };

  if (!Number.isInteger(value.schemaVersion)) {
    return { valid: false, errors: ['schemaVersion: missing or not an integer'] };
  }
  if (value.schemaVersion !== SCHEMA_VERSION) {
    return {
      valid: false,
      errors: [
        `schemaVersion: manifest is version ${value.schemaVersion}, this build understands version ${SCHEMA_VERSION}`,
      ],
    };
  }

  const result = run(manifestSchema, value);
  if (!result.valid) return result;

  const errors = semanticErrors(value);
  return { valid: errors.length === 0, errors };
}
