/**
 * Walks a generated JSON Schema and lists every property path in it.
 *
 * Shared by `generate-fields.ts` (which writes descriptors for what the schema
 * contains) and the field-coverage test (which proves every path has one).
 *
 * Path syntax: `a.b.c`; items of an array of objects are written `images[]`
 * (`images[].url`); an open-ended map of objects uses `*` (`ui.*.rating`).
 * Primitive arrays (a font stack, `tourOrder`) and maps of primitives (a
 * LocalizedString) are leaves.
 */
type Json = Record<string, any>;

export interface SchemaPath {
  path: string;
  /** True for a value the editor sets directly; false for an object/array of objects that only groups others. */
  leaf: boolean;
  /** `string`, `number`, `boolean`, `array` (of primitives), `record` (map of primitives), or `mixed` (e.g. boolean | object). */
  type: string;
  enum?: unknown[];
  description?: string;
}

const PRIMITIVES = new Set(['string', 'number', 'integer', 'boolean']);

export function deref(root: Json, schema: Json | undefined): Json {
  let node = schema ?? {};
  while (node.$ref) node = root.definitions[String(node.$ref).split('/').pop()!];
  return node;
}

/** What kind of value a (dereferenced) schema node is, when it is not an object that groups properties. */
function primitiveType(root: Json, node: Json): string | undefined {
  if (node.enum || node.const !== undefined) return 'string';
  if (typeof node.type === 'string' && PRIMITIVES.has(node.type)) return node.type === 'integer' ? 'number' : node.type;
  if (node.type === 'array') {
    const items = deref(root, node.items);
    if (!items.properties && !items.anyOf && !items.oneOf) return 'array';
    return undefined;
  }
  if (node.type === 'object' && !node.properties && node.additionalProperties && typeof node.additionalProperties === 'object') {
    const inner = deref(root, node.additionalProperties);
    if (primitiveType(root, inner)) return 'record';
  }
  return undefined;
}

export function schemaPaths(root: Json, schema: Json, prefix = '', out: SchemaPath[] = []): SchemaPath[] {
  const node = deref(root, schema);
  const here = (extra: Partial<SchemaPath> & { leaf: boolean; type: string }) => {
    if (prefix) out.push({ path: prefix, description: node.description, enum: node.enum, ...extra });
  };

  const branches = (node.anyOf ?? node.oneOf) as Json[] | undefined;
  if (branches) {
    // boolean | object (mapRoute), boolean | 'thumbnail' (showStopImage), string | object (geoJSON)
    const resolved = branches.map((b) => deref(root, b));
    const objects = resolved.filter((b) => b.type === 'object' || b.type === 'array');
    const primitives = resolved.filter((b) => !(b.type === 'object' || b.type === 'array'));
    if (primitives.length) {
      const types = new Set(primitives.map((b) => primitiveType(root, b) ?? 'string'));
      here({ leaf: true, type: objects.length || types.size > 1 ? 'mixed' : [...types][0], enum: resolved.flatMap((b) => b.enum ?? b.const ?? []) });
    }
    for (const branch of objects) schemaPaths(root, branch, prefix, out);
    return out;
  }

  const prim = primitiveType(root, node);
  if (prim) {
    here({ leaf: true, type: prim });
    return out;
  }

  if (node.type === 'array') {
    here({ leaf: false, type: 'array-of-objects' });
    const items = deref(root, node.items);
    schemaPaths(root, items, `${prefix}[]`, out);
    return out;
  }

  if (node.type === 'object' || node.properties) {
    if (prefix) here({ leaf: false, type: 'object' });
    for (const [key, value] of Object.entries<Json>(node.properties ?? {})) {
      if (key === '$schema') continue;
      schemaPaths(root, value, prefix ? `${prefix}.${key}` : key, out);
    }
    if (!node.properties && node.additionalProperties && typeof node.additionalProperties === 'object') {
      schemaPaths(root, node.additionalProperties, prefix ? `${prefix}.*` : '*', out);
    }
    return out;
  }

  // An unconstrained value (`{}` or `type: object` with nothing known): a leaf we cannot describe further.
  here({ leaf: true, type: 'unknown' });
  return out;
}

/** The variants of the stop union, keyed by their `type` value. */
export function stopVariants(root: Json): Record<string, Json> {
  const stops = deref(root, deref(root, root.definitions.TourFile).properties.stops.items);
  const variants: Json[] = stops.oneOf ?? stops.anyOf ?? [];
  const byType: Record<string, Json> = {};
  for (const variant of variants.map((v) => deref(root, v))) {
    const type = variant.properties.type;
    byType[type.const ?? type.enum[0]] = variant;
  }
  return byType;
}
