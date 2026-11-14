import type { ThemeConfig, ThemeId } from './theme.js';
import type { Translations } from './translations.js';
import type { AppConfigFile, TourFile, TourMetadataFile } from './authoring.js';
import type { RouteGeoJSON } from './types.js';

/**
 * Version of the manifest format the player and any publisher agree on.
 *
 * RULE: bump on every BREAKING change — a removed or renamed field, a changed
 * meaning, a new required field. Adding an optional field is not breaking.
 * A player build refuses a manifest whose `schemaVersion` it does not know, so
 * a bump is a deliberate, coordinated rollout (see docs/manifest-mode.md).
 */
export const SCHEMA_VERSION = 1;

// Arrays are values, not objects to recurse into: a font stack is `string[]` and has to
// stay one (mapped over, it was generated as an index-signature object, which rejected
// every real `typography.fontFamily.sans`). A line comment, so it stays out of the schema.
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * A custom theme as authored in JSON (`src/data/themes/<id>.json`): any subset
 * of {@link ThemeConfig}, deep-merged over a built-in theme by the player.
 */
export interface CustomTheme extends DeepPartial<ThemeConfig> {
  id: ThemeId;
  name?: string;
  /**
   * What to inherit from: a built-in theme or another custom theme of the same manifest
   * (a chain is fine, a cycle is not). Defaults to 'default-light'.
   */
  extends?: ThemeId;
}

/**
 * Interface text overrides for one language, merged over the player's built-in
 * locale (or over English for a language with no built-in locale).
 */
export type UiText = DeepPartial<Translations>;

/** One tour inside a manifest: shared metadata plus one file per language. */
export interface ManifestTour {
  /** Same as `metadata.id` and every language file's `id`. */
  id: string;
  metadata: TourMetadataFile;
  /** Language code → that language's tour file. */
  languages: Record<string, TourFile>;
  /**
   * The walking route, inlined. Replaces the `mapRoute.geoJSON` relative path
   * that `metadata.json` uses on disk (a manifest has no sibling files).
   */
  route?: RouteGeoJSON;
}

/**
 * Everything the player needs at runtime, in one JSON document served at
 * `/data/manifest.json`. Media is referenced by URL, never inlined.
 */
export interface Manifest {
  /** Integer; the player rejects a version it does not know. */
  schemaVersion: number;
  /** App-level config: landing screen and installed-app identity. */
  app?: AppConfigFile;
  /** Custom themes, referenced by `themeId` (default: none). */
  themes?: CustomTheme[];
  /** Interface text overrides keyed by language code (default: none). */
  ui?: Record<string, UiText>;
  tours: ManifestTour[];
}
