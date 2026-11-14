# Manifest mode: one generic build, content at runtime

By default the player **compiles its content in**: tours, themes, UI text and
`app.json` are read from `src/data/**` at build time (`import.meta.glob`), so every
content change is a rebuild. **Manifest mode** inverts that: you build the player
**once**, with no content in it, and it fetches a single `manifest.json` when it
starts. Publishing new content is then "upload a file", and one build can serve
any number of different apps.

| | Compiled (default) | Manifest mode |
|---|---|---|
| Content comes from | `src/data/**`, bundled | `/data/manifest.json`, fetched at startup |
| Content change needs | a rebuild | uploading a new `manifest.json` |
| Selected by | nothing | `VITE_DATA_SOURCE=manifest` at build time |
| Installed-app name and icons | baked in from `app.json` | served by the host |

Nothing changes for you unless you set `VITE_DATA_SOURCE=manifest`.

## Building

```bash
# 1. the player, with no content compiled in
VITE_DATA_SOURCE=manifest bun run build:manifest     # same as: VITE_DATA_SOURCE=manifest vite build

# 2. a manifest, from the authored files in src/data (tours, themes, ui, app.json)
bun run manifest                                     # → dist/data/manifest.json
```

Serve `dist/` with the manifest at `/data/manifest.json`. `bun run manifest` takes
`--data <dir>` (default `src/data`), `--out <file>` (default
`dist/data/manifest.json`) and `--include-hidden` (tours whose id starts with `_`
are test fixtures and are left out otherwise). It validates what it writes and
exits non-zero on any problem. Note `bun run build` (validate + compiled build) is
unchanged; the manifest build skips the validate step because there is no data in it.

A manifest build contains **no tour data and no tenant identity**: the build never
reads `app.json`, no web app manifest is generated, and `public/data/tour` is not
copied into the output.

### Build-time settings

| Variable | Default | Meaning |
|---|---|---|
| `VITE_DATA_SOURCE` | `compiled` | `manifest` selects manifest mode |
| `VITE_MANIFEST_URL` | `/data/manifest.json` | Where to fetch the manifest from. A different origin needs CORS. The service worker's offline route follows this URL, same origin or not |
| `VITE_ANALYTICS_ENDPOINT` | `/e` in manifest mode, none in compiled mode | Where analytics events are posted; in a compiled build setting it is what turns analytics on. See [analytics.md](./analytics.md) |
| `VITE_PREVIEW_ORIGINS` | none | Fallback for the runtime tag below: comma-separated origins allowed to send live-preview manifests. Empty (and no tag) disables the bridge |

## What the player does at startup

1. Shows a loading screen and fetches `/data/manifest.json` (revalidated every time).
2. Checks `schemaVersion`. A version this build does not know gets an error screen
   ("this guide needs a newer version of the app"): the player never guesses.
3. Installs the manifest through the same normalisation the compiled path uses, then
   mounts the app. The player does **not** run the full JSON Schema check: that is the
   publisher's job (`validateManifest`, below). It only refuses what it cannot run.
4. Applies the identity from `manifest.app` at runtime: tab title (`name`),
   `apple-mobile-web-app-title` (`shortName`), description and `theme-color`
   (`themeColor`). The screens then manage `theme-color` per screen as usual.

If the fetch fails, an error screen with **Try again** appears, unless the visitor has
opened the app before (next section).

### Offline

The service worker serves `/data/manifest.json` **network-first** (4 s timeout) and
falls back to the copy from the last successful visit, so an app that has been
opened once opens again with no signal, and a republish shows up on the next online
visit. The very first visit, before the worker controls the page, also stores the
manifest itself (cache `agk-manifest`). Only a response that parses as JSON with a
supported `schemaVersion` is ever stored, so a captive portal's HTML or a broken publish
cannot replace the last good copy; when the fresh answer is unusable the player opens from
that copy (a manifest of another `schemaVersion` still shows the "needs a newer version"
screen instead). Media keeps its existing caching (see
`src/sw.ts`). Test it: `bun run test:manifest` includes an offline reload.

## Installed-app identity (PWA)

A web app manifest and icons are per tenant, so a generic build cannot contain them.
In manifest mode:

- `index.html` links `/manifest.webmanifest`, `/favicon.svg`, `/apple-touch-icon.png`
  and `/icons/icon-*.png` as **host-served paths**.
- The build generates no `manifest.webmanifest` and the service worker does **not**
  precache the icons or `favicon.svg` (a precached copy would pin them forever).
  The files in `public/` are neutral AudioGuideKit defaults that stay in `dist/`
  as fallbacks for a plain static host.
- **The host must serve them**, generated from `manifest.app`. With one Worker in
  front of every customer this is: look up the tenant's `manifest.json`, then answer
  `GET /manifest.webmanifest` with

  ```json
  {
    "name": "<app.name>", "short_name": "<app.shortName ?? app.name>",
    "description": "<app.description>",
    "theme_color": "<app.themeColor>", "background_color": "<app.backgroundColor>",
    "display": "<app.display ?? standalone>", "orientation": "<app.orientation ?? portrait>",
    "scope": "/", "start_url": "/",
    "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" }, "…"]
  }
  ```

  and `/icons/*`, `/apple-touch-icon.png`, `/favicon.svg` from the tenant's icon set
  (rendered from `app.icon`). Icon sizes are listed in [pwa.md](./pwa.md); the manifest
  the compiled build generates (`vite.config.ts`) is the reference for the exact fields.
  Serve `/manifest.webmanifest` with `Content-Type: application/manifest+json`.

## The manifest format

```jsonc
{
  "schemaVersion": 1,
  "app": { /* AppConfigFile: landing screen + installed-app identity, optional */ },
  "themes": [ /* optional. CustomTheme: { id, name?, extends?, ...any subset of ThemeConfig } */ ],
  "ui": { "<lang>": { /* optional. any subset of the interface text, merged over the built-in locale */ } },
  "tours": [
    {
      "id": "barcelona",
      "metadata": { /* TourMetadataFile: what metadata.json holds, "id" included */ },
      "languages": { "en": { /* TourFile: what en.json holds */ }, "de": { } },
      "route": { /* RouteGeoJSON, optional: replaces mapRoute.geoJSON ("./route.geojson") */ }
    }
  ]
}
```

It is `src/data/**` as one document: `app` is `app.json`, each `themes[]` entry a
`themes/*.json`, `ui.<lang>` a `ui/<lang>.json`, and per tour `metadata` plus
`languages` the files of its folder. Media is **always a URL**, never inlined.

Rules beyond the JSON Schema (checked by `validateManifest`): tour ids and theme ids are
unique; `metadata.id`, each language file's `id` and the tour's `id` agree; a language
file's `language` equals its key (the player warns and trusts the key); `totalStops` equals the number of audio stops (the
same rule `bun run validate` applies); every tour has at least one language.

References are checked too: `app.themeId`, a tour's `themeId` (in `metadata` or a language file)
and a theme's `extends` must name a **built-in theme** (`default-light`, `default-dark`) or a theme
of the manifest; every id in `app.tourOrder` must be a tour; a custom theme cannot reuse a
built-in id. `extends` may name **another custom theme** of the manifest (a chain, in any order;
the player resolves it depth first), but a **cycle is invalid**: `validateManifest` reports it and
the player, if it ever sees one, warns and starts the closing link from the default theme.
`themes` and `ui` may be left out entirely.

### Versioning

`SCHEMA_VERSION` (in `packages/schema/src/manifest.ts`) is an integer.

> **Bump it on every breaking change** to the manifest: a field removed or renamed, a
> changed meaning, a new *required* field. Adding an optional field is not breaking.

A player refuses a manifest whose version differs from its own. So a bump is a
deliberate rollout: publishers keep producing the old version for tenants
pinned to older player builds until those tenants move. If a migration between versions
is ever needed, it belongs in `@audioguidekit/schema`, so publishers and players share it.

## Live preview

An editor embeds the player in an `<iframe>` and sends it whole manifests:

```js
iframe.contentWindow.postMessage({ type: 'agk:manifest', manifest }, playerOrigin);
```

Who may send is decided **at runtime**, so one generic build serves every customer and the
editor's preview host alike. The edge Worker injects this tag into `index.html` **only on the
preview host** (as the first thing inside `<head>`):

```html
<meta name="agk-preview-origins" content="https://app.example.com,http://localhost:5173">
```

The tag wins when it holds at least one valid origin; otherwise the build-time
`VITE_PREVIEW_ORIGINS` (same format) is the fallback, for self-hosters and local
development. Entries must be exact origins: `null`, `*` and anything that does not
parse are dropped, and a trailing path is cut. Messages from any other origin are
ignored, and with no origins at all there is no bridge. A page carrying the tag does
not register the service worker (an editor's frame is not an installable app, and a
precached `index.html` would never see an injected tag). It installs the manifest and re-renders **without reloading the page**
(the app remounts, so the visitor's open stop and scroll position are reset, but the
URL, audio permissions and the frame itself stay). The player answers the sender:

| Message | When |
|---|---|
| `{ type: 'agk:ready' }` | at startup, once it listens (to each allowed origin, if framed) |
| `{ type: 'agk:manifest-applied' }` | the manifest was installed |
| `{ type: 'agk:manifest-error', message }` | refused, e.g. an unknown `schemaVersion`; what was on screen stays |

A framed player that has preview origins and whose `/data/manifest.json` cannot be fetched
waits for a preview manifest instead of showing the error screen (without origins it shows the
normal error screen). Once a preview manifest is installed, the result of the initial fetch,
success or failure, is ignored. The older dev-only
`agk:data-changed` message (compiled mode, used by an embedding editor) is unchanged.

## For tools that produce manifests: `@audioguidekit/schema`

`packages/schema` is the contract between the player and whatever writes manifests.

```ts
import { validateManifest, SCHEMA_VERSION, type Manifest } from '@audioguidekit/schema';
import { FIELD_CATALOG, STOP_TYPES } from '@audioguidekit/schema/fields';

const result = validateManifest(manifest);   // { valid, errors: string[] }
```

- **Types**: `Manifest`, `ManifestTour`, `TourFile`, `TourMetadataFile`, `AppConfigFile`,
  every `Stop` type, `ThemeConfig`, `CustomTheme`, `Translations`, `UiText`.
- **JSON Schemas**: `tour-file`, `tour-metadata`, `app-config`, `manifest` in
  `packages/schema/src/schemas/` (generated by `bun run schema`, shipped in
  `dist/schemas/`), also as `jsonSchemas` from the package.
- **Field descriptions** (`/fields`): label, group, control, default, options and help text for
  **every field the schemas accept**, which is what an editor is generated from. `FIELD_CATALOG`
  flattens them into `FieldDescriptor`s with a `scope`: each stop type, the tour (content,
  settings, map), `app` (landing screen and installed-app identity), a custom `theme` (every token,
  curated sections first, the rest generated), and `ui` (every interface text key, with the
  English text as its `default`). Keys are dotted paths; items of a list are `images[].url`.
  Ids, computed values and route geometry are the only things left out, listed with reasons in
  the coverage test. `bun run schema` regenerates the schemas **and** the large generated lists
  (`src/fields/generated/`); `bun run schema:test` fails for any schema path without a
  descriptor and for any descriptor whose path is not in a schema.
- **Consuming it now**, before it is on npm: it is a Bun workspace package. From another
  repo, depend on the folder and build it once:

  ```bash
  # in the consumer's package.json:  "@audioguidekit/schema": "file:../player-react/packages/schema"
  bun run --cwd ../player-react/packages/schema build     # tsc → dist/ (ESM + .d.ts)
  ```

  The built package imports in plain Node ESM. When published to npm only the
  dependency line changes.
