/**
 * Field descriptions for editors: label, group, control, default, options.
 *
 * Plain data plus a few pure helpers. An editor can render its forms from these, and
 * a coverage test can walk {@link FIELD_CATALOG} to prove every field the schema
 * knows about has an editor (or is explicitly ignored).
 */
export * from './stopTypes.js';
export * from './tourSettings.js';
export * from './mapSettings.js';
export * from './themeFields.js';
export * from './appSettings.js';
export * from './stopExtras.js';
export * from './generated/themeTokens.js';
export * from './generated/uiText.js';

import { STOP_TYPES, type FieldSpec, type FieldKind } from './stopTypes.js';
import { TOUR_CONTENT_FIELDS, SETTINGS_SECTIONS, TOUR_EXTRA_FIELDS } from './tourSettings.js';
import { MAP_SECTIONS, MAP_PAGE_SECTIONS } from './mapSettings.js';
import { THEME_SECTIONS, THEME_IDENTITY_FIELDS } from './themeFields.js';
import { APP_SECTIONS } from './appSettings.js';
import { STOP_MAP_FIELDS, STOP_NESTED_FIELDS } from './stopExtras.js';
import { THEME_TOKEN_SECTIONS } from './generated/themeTokens.js';
import { UI_TEXT_SECTIONS } from './generated/uiText.js';

/** Where a field lives in the data model. */
export type FieldScope =
  | { kind: 'stop'; stopType: string }
  /** A translated field of the language file (title, description, …). */
  | { kind: 'tour-content' }
  /** A field of `metadata.json` (TourMetadataFile). */
  | { kind: 'tour-setting' }
  /** A map field of `metadata.json`; `key` may be a dotted path. */
  | { kind: 'map' }
  /** A field of a custom theme; `key` is a dotted path into ThemeConfig. */
  | { kind: 'theme' }
  /** A field of `app.json` / `manifest.app`: landing screen and installed-app identity. */
  | { kind: 'app' }
  /** One interface text, overridable per language in `manifest.ui`; `key` is a dotted path into Translations. */
  | { kind: 'ui' };

/** One field, flattened: everything an editor needs to render it. */
export interface FieldDescriptor {
  scope: FieldScope;
  /** Property name, or dotted path for nested settings. Items of a list are written `images[].url`. */
  key: string;
  label: string;
  /** Section/heading the field is shown under. */
  group: string;
  /** The editor control to use. */
  control: FieldKind;
  required: boolean;
  translatable: boolean;
  /** What the player does when the key is absent. */
  default?: string | number | boolean;
  options?: { value: string; label: string }[];
  help?: string;
}

const describe = (field: FieldSpec, scope: FieldScope, group: string): FieldDescriptor => ({
  scope,
  key: field.key,
  label: field.label,
  group,
  control: field.kind,
  required: field.required ?? false,
  translatable: field.translatable ?? false,
  default: field.defaultsOn !== undefined ? field.defaultsOn : field.default,
  options: field.options,
  help: field.help,
});

/**
 * Every field the generated schemas accept, described. `packages/schema/test/field-coverage.test.ts`
 * walks the schemas and fails for any property path missing here (bar a short, explained ignore-list
 * of ids and computed values), and for any descriptor whose key is not in a schema.
 *
 * Scopes: each stop type, the tour (content, settings, map), the app, a custom theme, interface text.
 */
export const FIELD_CATALOG: FieldDescriptor[] = [
  ...STOP_TYPES.flatMap((stop) => {
    const scope: FieldScope = { kind: 'stop', stopType: stop.type };
    return [
      ...stop.fields.map((f) => describe(f, scope, stop.label)),
      ...(STOP_NESTED_FIELDS[stop.type] ?? []).map((f) => describe(f, scope, stop.label)),
      ...STOP_MAP_FIELDS.map((f) => describe(f, scope, 'Map')),
    ];
  }),
  ...TOUR_CONTENT_FIELDS.map((f) => describe(f, { kind: 'tour-content' }, 'Tour')),
  ...SETTINGS_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'tour-setting' }, s.title))),
  ...TOUR_EXTRA_FIELDS.map((f) => describe(f, { kind: 'tour-setting' }, 'Languages')),
  ...MAP_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'map' }, s.title))),
  ...MAP_PAGE_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'map' }, s.title))),
  ...APP_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'app' }, s.title))),
  ...THEME_IDENTITY_FIELDS.map((f) => describe(f, { kind: 'theme' }, 'Theme')),
  ...THEME_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'theme' }, s.title))),
  ...THEME_TOKEN_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'theme' }, s.title))),
  ...UI_TEXT_SECTIONS.flatMap((s) => s.fields.map((f) => describe(f, { kind: 'ui' }, s.title))),
];
