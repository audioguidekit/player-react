# Tour data validation

The schemas and types that describe the tour data files now live in the
**`@audioguidekit/schema`** package, [`packages/schema`](../../packages/schema).
This folder only keeps the re-exports old imports used (`authoring-types.ts`).

Editor + build-time validation for the tour data files (`src/data/tour/<id>/metadata.json`,
the per-language files like `en.json`, `app.json`) catches unsupported properties, bad
enum values, and missing required fields early. The same schemas validate a runtime
`manifest.json` (see [docs/manifest-mode.md](../../docs/manifest-mode.md)).

## How it works

The TypeScript types in `packages/schema/src` are the **single source of truth**
(`types.ts` for tours, stops and app config; `theme.ts`; `translations.ts`;
`manifest.ts` for the manifest). `authoring.ts` derives the authoring contracts from
them (it only strips runtime-injected stop state like `isCompleted`). Four JSON
Schemas are generated, into `packages/schema/src/schemas/`:

| Schema | Validates |
| --- | --- |
| `tour-metadata.schema.json` | `metadata.json` |
| `tour-file.schema.json` | language files (`en.json`, `de.json`, …) |
| `app-config.schema.json` | `app.json` |
| `manifest.schema.json` | a runtime `manifest.json` (embeds all of the above, plus custom themes and UI text) |

Validation runs in three places:

1. **In the editor** — a data file can point at its schema via a `$schema` key (and
   `.vscode/settings.json` can map the files). You get red squiggles + autocomplete
   as you type (unknown property names, invalid `type` / `mapProvider` / per-provider
   `mapStyleId`, etc.).
2. **At build / in CI** — `bun run validate` checks every file and exits non-zero on
   any problem. It runs before `vite build` and in `.github/workflows/validate.yml`.
3. **At publish time** — `validateManifest()` from the package returns readable errors
   (`tours[0].languages.en.stops[3]: …`) for a manifest, including cross-field rules a
   JSON Schema cannot express (matching ids, `totalStops`).

## When you change the types

Regenerate and commit the schemas:

```bash
bun run schema      # writes packages/schema/src/schemas/*.schema.json
```

CI fails if the committed schemas are stale (it regenerates and diffs). If the change is
**breaking for the manifest** (field removed/renamed, new required field), also bump
`SCHEMA_VERSION` in `packages/schema/src/manifest.ts`.

## Field descriptions

`packages/schema/src/fields/` holds what an editor needs to render a form for the data:
label, group, control kind, default, options and help for every stop type
(`stopTypes.ts`), tour setting (`tourSettings.ts`), map setting (`mapSettings.ts`) and
theme field (`themeFields.ts`). Any external editor can read
the descriptions; `FIELD_CATALOG` flattens them. Validation never defers to them:
the generated schemas are the authority.

## Notes

- `public/data/tour` is a generated copy (synced from `src/data/tour` by the
  vite-config plugin) — only the `src` files are authored and validated.
- OpenFreeMap and CARTO `mapStyleId` values are constrained to the sets documented
  in `docs/map.md`; keep `PROVIDER_STYLES` in `packages/schema/scripts/generate-schema.ts`
  in sync.
