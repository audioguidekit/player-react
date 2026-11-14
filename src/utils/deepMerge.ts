/**
 * Merge a partial override onto a base object, key by key.
 *
 * Plain objects merge recursively; anything else — strings, numbers, and arrays
 * such as a font stack — replaces wholesale, because a half-merged list is
 * meaningless.
 *
 * Used wherever the app lets JSON in `src/data/` patch something defined in
 * TypeScript: custom themes over a built-in theme, and UI text over the
 * built-in locale.
 */
export function deepMerge<T>(base: T, overrides: unknown): T {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return (overrides === undefined ? base : overrides) as T;
  }

  const result: any = { ...(base as any) };
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (value === undefined) continue;
    result[key] = deepMerge((base as any)?.[key], value);
  }
  return result as T;
}
