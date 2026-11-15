# @audioguidekit/schema

The data contract of [AudioGuideKit](https://audioguidekit.org), the open-source audio guide player: TypeScript types, JSON Schemas, manifest validation and editor field descriptions. Use it when you write tours, manifests or an editor for the player.

```bash
npm install @audioguidekit/schema
```

ESM only, Node 20.10 or later (or any bundler).

## Validate a manifest

```ts
import { validateManifest, SCHEMA_VERSION, type Manifest } from '@audioguidekit/schema';

const result = validateManifest(manifest);
if (!result.valid) console.error(result.errors);
// each error starts with the path of the problem: 'tours[0].languages.en.stops[3]: …'
```

`validateManifest` checks the `schemaVersion` first, then the JSON Schema, then the rules a schema cannot express (matching ids, `totalStops`). `validateTourFile`, `validateTourMetadata` and `validateAppConfig` check single tour files.

## What is inside

- **Types**: `Manifest`, `ManifestTour`, `TourFile`, `TourMetadataFile`, `AppConfigFile`, every `Stop` type, `ThemeConfig`, `CustomTheme`, `Translations`, `UiText`.
- **JSON Schemas** for a language file, `metadata.json`, `app.json` and the manifest: as `jsonSchemas` from the package, or as files at `@audioguidekit/schema/schemas/<name>.schema.json` (`manifest`, `tour-file`, `tour-metadata`, `app-config`).
- **Field descriptions** at `@audioguidekit/schema/fields`: label, group, control, default, options and help text for every field the schemas accept. `FIELD_CATALOG` lists them all, `STOP_TYPES` per stop type. An editor can be generated from them.

```ts
import { FIELD_CATALOG, STOP_TYPES } from '@audioguidekit/schema/fields';
```

## Versions

`SCHEMA_VERSION` is the version of the manifest format. It goes up only when a manifest written for the old version would break, and a player refuses a manifest with a version it does not understand. The package version follows semver: a new `SCHEMA_VERSION` is a new major version.

## Links

- Documentation: https://audioguidekit.org/docs/reference/schema-package
- Source and issues: https://github.com/audioguidekit/player-react (`packages/schema`)

MIT licence.
