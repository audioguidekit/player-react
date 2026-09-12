# Tour data validation

Editor + build-time validation for the tour data files (`src/data/tour/metadata.json`
and the per-language files like `en.json`), so unsupported properties, bad enum
values, and missing required fields are caught early.

## How it works

`types.ts` is the **single source of truth**. The authoring contracts in
[`authoring-types.ts`](./authoring-types.ts) are derived from it (they only strip
runtime-injected stop state like `isCompleted`). Two JSON Schemas are generated
from those contracts:

| Schema | Validates |
| --- | --- |
| `tour-metadata.schema.json` | `metadata.json` |
| `tour-file.schema.json` | language files (`en.json`, `de.json`, …) |

Validation runs in two places:

1. **In the editor** — each data file points at its schema via a `$schema` key, and
   `.vscode/settings.json` maps the files too. You get red squiggles + autocomplete
   as you type (unknown property names, invalid `type` / `mapProvider` / per-provider
   `mapStyleId`, etc.).
2. **At build / in CI** — `bun run validate` checks every file and exits non-zero on
   any problem. It runs before `vite build` and in `.github/workflows/validate.yml`.

## When you change `types.ts`

Regenerate and commit the schemas:

```bash
bun run schema      # writes src/schema/*.schema.json
```

CI fails if the committed schemas are stale (it regenerates and diffs).

## Notes

- `public/data/tour` is a generated copy (synced from `src/data/tour` by the
  vite-config plugin) — only the `src` files are authored and validated.
- OpenFreeMap and CARTO `mapStyleId` values are constrained to the sets documented
  in `docs/map.md`; keep `PROVIDER_STYLES` in `scripts/generate-schema.ts` in sync.
