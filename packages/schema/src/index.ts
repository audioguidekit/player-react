/**
 * @audioguidekit/schema — the data contract between the player and its editors.
 *
 *   Types          TourFile, TourMetadataFile, AppConfigFile, every Stop type,
 *                  ThemeConfig, CustomTheme, Translations, Manifest
 *   SCHEMA_VERSION bumped on breaking changes to the manifest format
 *   Validation     validateManifest() and the generated JSON Schemas
 *   Fields         editor field descriptions (also at '@audioguidekit/schema/fields')
 */
export * from './types.js';
export * from './theme.js';
export * from './translations.js';
export * from './authoring.js';
export * from './manifest.js';
export * from './validate.js';
export * from './fields/index.js';
