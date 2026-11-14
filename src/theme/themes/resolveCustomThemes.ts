/**
 * Turn custom themes (partial JSON) into complete themes.
 *
 * A custom theme starts from what its `extends` names: a built-in theme, or another
 * custom theme of the same data (a chain is resolved depth first). With no `extends`, or
 * one that names nothing known, it starts from `fallback`. A cycle (a → b → a) cannot be
 * resolved: the link that closes it falls back too, with a console warning, so the app
 * still boots. `validateManifest` rejects cycles and unknown names up front.
 *
 * Pure (no data source, no env), so it is unit tested on its own.
 */
import type { CustomTheme } from '@audioguidekit/schema';
import type { ThemeConfig, ThemeId } from '../types';
import { deepMerge } from '../../utils/deepMerge';

export function resolveCustomThemes(
  customThemes: CustomTheme[],
  baseThemes: Record<ThemeId, ThemeConfig>,
  fallback: ThemeConfig,
): Record<ThemeId, ThemeConfig> {
  const byId = new Map<ThemeId, CustomTheme>();
  for (const theme of customThemes) {
    // A built-in id always wins (the registry puts built-ins last), so do not build on a shadowed one.
    if (!(theme.id in baseThemes)) byId.set(theme.id, theme);
  }

  const resolved: Record<ThemeId, ThemeConfig> = {};

  const resolve = (id: ThemeId, visiting: ThemeId[]): ThemeConfig => {
    if (id in baseThemes) return baseThemes[id];
    if (resolved[id]) return resolved[id];

    const overrides = byId.get(id)!;
    const parent = overrides.extends;
    let base = fallback;
    if (parent !== undefined) {
      if (visiting.includes(parent) || parent === id) {
        console.warn(`[Themes] "${id}" extends "${parent}", which closes a cycle (${[...visiting, id, parent].join(' → ')}); using the default theme instead`);
      } else if (parent in baseThemes || byId.has(parent)) {
        base = resolve(parent, [...visiting, id]);
      } else {
        console.warn(`[Themes] "${id}" extends unknown theme "${parent}"; using the default theme instead`);
      }
    }

    // `extends` is authoring metadata, not part of ThemeConfig — drop it so the
    // theme object the app consumes carries only real theme values.
    const merged = deepMerge(base, overrides);
    delete (merged as Partial<CustomTheme>).extends;
    return (resolved[id] = merged);
  };

  for (const id of byId.keys()) resolve(id, []);
  return resolved;
}
