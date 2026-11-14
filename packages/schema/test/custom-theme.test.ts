/**
 * A CustomTheme is a deep partial of ThemeConfig: a theme may override one colour of
 * one block and nothing else, so nothing inside it is required except `id`.
 * Regression: members of OPTIONAL nested blocks (`mapMarkers?: { active: {...}, ... }`)
 * were generated as required, so a theme setting only `mapMarkers.active.numberColor`
 * was rejected.
 */
import { describe, expect, test } from 'bun:test';
import Ajv from 'ajv';
import manifestSchema from '../src/schemas/manifest.schema.json' with { type: 'json' };

const root: any = manifestSchema;
const defs: Record<string, any> = root.definitions;

function validatorFor(definition: string) {
  const ajv = new Ajv({ strict: false, allErrors: true });
  return ajv.compile({ ...defs[definition], definitions: defs });
}

/** Every `required` list reachable from a definition, with the path it sits at. */
function requiredLists(node: any, path: string, seen: string[] = []): { path: string; required: string[] }[] {
  if (!node || typeof node !== 'object') return [];
  if (node.$ref) {
    const name = String(node.$ref).split('/').pop()!;
    return seen.includes(name) ? [] : requiredLists(defs[name], path, [...seen, name]);
  }
  const found = Array.isArray(node.required) ? [{ path, required: node.required as string[] }] : [];
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) value.forEach((v, i) => found.push(...requiredLists(v, `${path}/${key}[${i}]`, seen)));
    else if (value && typeof value === 'object') found.push(...requiredLists(value, `${path}/${key}`, seen));
  }
  return found;
}

/** One theme per leaf-bearing block: the first leaf found under each object-valued property, at every depth. */
function singleLeafThemes(node: any, prefix: string[] = [], seen: string[] = []): { path: string; value: unknown }[] {
  if (node?.$ref) {
    const name = String(node.$ref).split('/').pop()!;
    return seen.includes(name) ? [] : singleLeafThemes(defs[name], prefix, [...seen, name]);
  }
  const out: { path: string; value: unknown }[] = [];
  for (const [key, child] of Object.entries<any>(node?.properties ?? {})) {
    if (prefix.length === 0 && ['id', 'name', 'description', 'extends', '$schema'].includes(key)) continue;
    const resolved = child.$ref ? defs[String(child.$ref).split('/').pop()!] : child;
    const path = [...prefix, key];
    if (resolved?.properties) out.push(...singleLeafThemes(resolved, path, seen));
    else {
      const sample = resolved?.enum ? resolved.enum[0] : resolved?.type === 'number' ? 1 : resolved?.type === 'boolean' ? true : resolved?.type === 'array' ? [] : 'x';
      const value = path.reduceRight<unknown>((inner, k) => ({ [k]: inner }), sample);
      out.push({ path: path.join('.'), value });
    }
  }
  return out;
}

describe('CustomTheme schema', () => {
  test('only `id` is required anywhere inside a custom theme', () => {
    const lists = requiredLists(defs.CustomTheme, 'CustomTheme');
    expect(lists).toEqual([{ path: 'CustomTheme', required: ['id'] }]);
  });

  test('a theme that overrides a single leaf of any block is valid', () => {
    const validate = validatorFor('CustomTheme');
    const themes = singleLeafThemes(defs.CustomTheme);
    expect(themes.length).toBeGreaterThan(100); // the walk really reached the leaves
    const failures = themes
      .map(({ path, value }) => ({ path, ok: validate({ id: 'one-leaf', ...(value as object) }), errors: validate.errors }))
      .filter((r) => !r.ok)
      .map((r) => `${r.path}: ${JSON.stringify(r.errors)}`);
    expect(failures).toEqual([]);
  });

  test('the case from the bug report: mapMarkers with only `upcoming`-style single colours', () => {
    const validate = validatorFor('CustomTheme');
    expect(validate({ id: 't', mapMarkers: { active: { numberColor: '#fff' } } })).toBe(true);
    expect(validate({ id: 't', mapMarkers: { userLocation: {} } })).toBe(true);
    expect(validate({ id: 't', mapMarkers: { inactive: { borderColor: 5 } } })).toBe(false); // still typed
    expect(validate({ mapMarkers: {} })).toBe(false); // id stays required
  });
});
