/**
 * Field-descriptor coverage.
 *
 * Editors can generate their forms from FIELD_CATALOG, so a field the
 * schema accepts but the catalog does not describe is a field no editor can show.
 * This walks the GENERATED JSON Schemas and fails, listing every property path
 * without a descriptor. It also fails for a descriptor whose key is not in the
 * schema (a typo or a removed field), so the two cannot drift either way.
 *
 *   bun test            (from packages/schema, or `bun run schema:test` at the repo root)
 */
import { describe, expect, test } from 'bun:test';
import { FIELD_CATALOG, type FieldDescriptor } from '../src/fields/index.js';
import { schemaPaths, stopVariants, type SchemaPath } from '../scripts/schemaPaths.js';
import manifestSchema from '../src/schemas/manifest.schema.json' with { type: 'json' };
import tourMetadataSchema from '../src/schemas/tour-metadata.schema.json' with { type: 'json' };

const manifestRoot: any = manifestSchema;
const metadataRoot: any = tourMetadataSchema;

/** Which namespace of the catalog a descriptor lives in. Tour content, settings and map fields share one: they are all keys of a tour file. */
function scopeId(d: FieldDescriptor): string {
  switch (d.scope.kind) {
    case 'stop': return `stop:${d.scope.stopType}`;
    case 'tour-content':
    case 'tour-setting':
    case 'map': return 'tour';
    default: return d.scope.kind;
  }
}

/**
 * Schema paths that are deliberately NOT described, per scope. Every entry says why.
 * Anything not listed here must have a descriptor.
 */
const IGNORED: Record<string, { path: string | RegExp; why: string }[]> = {
  tour: [
    { path: 'id', why: 'The tour slug: assigned when the tour is created, never edited as a field.' },
    { path: 'language', why: 'Structural: the key the language file is filed under, set when a language is added.' },
    { path: 'totalStops', why: 'Computed: the number of audio stops, written by the publisher (validateManifest enforces it).' },
    { path: /^mapRoute\.geoJSON\./, why: 'The route geometry (FeatureCollection internals) is edited as one value through the `mapRoute.geoJSON` descriptor.' },
  ],
  theme: [
    { path: 'id', why: 'The theme slug: assigned when the theme is created, never edited as a field.' },
  ],
  stop: [
    { path: 'id', why: 'The stop id: generated when the stop is created (newStop).' },
    { path: 'type', why: 'Structural: the discriminator, chosen when the stop is created.' },
  ],
};

const ignored = (scope: string, path: string): boolean =>
  (IGNORED[scope.startsWith('stop:') ? 'stop' : scope] ?? []).some((rule) =>
    typeof rule.path === 'string' ? rule.path === path : rule.path.test(path),
  );

/** Every path the generated schemas know, per catalog scope. */
function schemaScopes(): Record<string, SchemaPath[]> {
  const scopes: Record<string, SchemaPath[]> = {};
  const add = (scope: string, paths: SchemaPath[]) => {
    const known = new Set((scopes[scope] ??= []).map((p) => `${p.path}|${p.leaf}`));
    for (const p of paths) if (!known.has(`${p.path}|${p.leaf}`)) scopes[scope].push(p);
  };

  // A tour's keys are those of metadata.json plus the language file's own (title, …); the
  // language file may override any metadata key, so it adds the same paths.
  add('tour', schemaPaths(metadataRoot, metadataRoot.definitions.TourMetadataFile));
  const tourFile = manifestRoot.definitions.TourFile;
  add('tour', schemaPaths(manifestRoot, { ...tourFile, properties: Object.fromEntries(Object.entries<any>(tourFile.properties).filter(([key]) => key !== 'stops')) }));

  for (const [type, variant] of Object.entries(stopVariants(manifestRoot))) add(`stop:${type}`, schemaPaths(manifestRoot, variant));

  add('app', schemaPaths(manifestRoot, manifestRoot.definitions.AppConfigFile));
  add('theme', schemaPaths(manifestRoot, manifestRoot.definitions.CustomTheme));
  add('ui', schemaPaths(manifestRoot, manifestRoot.definitions.UiText));
  return scopes;
}

function catalogKeys(): Record<string, Set<string>> {
  const keys: Record<string, Set<string>> = {};
  for (const d of FIELD_CATALOG) (keys[scopeId(d)] ??= new Set()).add(d.key);
  return keys;
}

describe('field descriptor coverage', () => {
  const scopes = schemaScopes();
  const catalog = catalogKeys();

  const missing = (): string[] =>
    Object.entries(scopes).flatMap(([scope, paths]) =>
      paths
        .filter((p) => p.leaf && !ignored(scope, p.path) && !catalog[scope]?.has(p.path))
        .map((p) => `${scope}: ${p.path}`),
    );

  test('every leaf property of the generated schemas has a descriptor', () => {
    const list = missing();
    expect(list, `${list.length} schema path(s) have no field descriptor:\n  ${list.join('\n  ')}\n`).toEqual([]);
  });

  test('every descriptor names a path that exists in the schema', () => {
    const stale: string[] = [];
    for (const [scope, keys] of Object.entries(catalog)) {
      const known = new Set((scopes[scope] ?? []).map((p) => p.path));
      for (const key of keys) if (!known.has(key)) stale.push(`${scope}: ${key}`);
    }
    expect(stale, `descriptor(s) for paths the schema does not have:\n  ${stale.join('\n  ')}\n`).toEqual([]);
  });

  test('the ignore-list only names paths that exist (no dead exceptions)', () => {
    const dead: string[] = [];
    for (const [scope, rules] of Object.entries(IGNORED)) {
      const all = Object.entries(scopes).filter(([id]) => (scope === 'stop' ? id.startsWith('stop:') : id === scope));
      for (const rule of rules) {
        const hit = all.some(([, paths]) => paths.some((p) => (typeof rule.path === 'string' ? rule.path === p.path : rule.path.test(p.path))));
        if (!hit) dead.push(`${scope}: ${rule.path}`);
      }
    }
    expect(dead).toEqual([]);
  });

  test('no field is described twice in the same scope', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const d of FIELD_CATALOG) {
      const id = `${scopeId(d)}: ${d.key}`;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes).toEqual([]);
  });

  test('labels and groups are sentence case, not Title Case', () => {
    // Capitalised words that are names or acronyms, not a sign of Title Case.
    const names = new Set(['YouTube', 'Spotify', 'URL', 'JSON', 'GeoJSON', 'API', 'CSS', 'SVG', 'UI', 'ID', 'iOS', 'QR', 'GPS', 'HTML']);
    const titleCased = (text: string) => {
      const words = text.split(/\s+/).slice(1);
      return words.some((w) => /^[A-Z][a-z]/.test(w) && !names.has(w));
    };
    const bad = FIELD_CATALOG.flatMap((d) => [d.label, d.group].filter(titleCased).map((t) => `${scopeId(d)}: ${d.key} -> "${t}"`));
    expect([...new Set(bad)]).toEqual([]);
  });

  test('select options agree with the schema enums', () => {
    const wrong: string[] = [];
    for (const d of FIELD_CATALOG) {
      if (d.control !== 'select' || !d.options) continue;
      const path = (scopes[scopeId(d)] ?? []).find((p) => p.path === d.key && p.enum?.length && p.type !== 'mixed'); // boolean | 'thumbnail' (showStopImage) is a string picker by design (decodeSetting)
      if (!path) continue;
      const allowed = new Set(path.enum!.map(String));
      for (const o of d.options) if (!allowed.has(o.value)) wrong.push(`${scopeId(d)}: ${d.key} offers "${o.value}", the schema allows ${[...allowed].join(', ')}`);
    }
    expect(wrong).toEqual([]);
  });

  test('summary', () => {
    const rows = Object.entries(scopes).map(([scope, paths]) => {
      const required = paths.filter((p) => p.leaf && !ignored(scope, p.path));
      const covered = required.filter((p) => catalog[scope]?.has(p.path)).length;
      return { scope, covered, required: required.length };
    });
    const total = rows.reduce((a, r) => ({ covered: a.covered + r.covered, required: a.required + r.required }), { covered: 0, required: 0 });
    console.log(rows.map((r) => `  ${r.scope.padEnd(18)} ${r.covered}/${r.required}`).join('\n') + `\n  ${'TOTAL'.padEnd(18)} ${total.covered}/${total.required}`);
    expect(rows.length).toBeGreaterThan(0);
  });
});
