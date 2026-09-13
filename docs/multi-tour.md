# Multi-tour & the selection screen

The player supports bundling **several tours** in one deployment. When more than
one tour is discovered, the app opens on a **tour-selection screen** (a list of
cards) instead of going straight into a tour. With a single tour the picker is
skipped entirely and that tour opens directly — so single-tour deployments are
unaffected.

For a single tour's content (`metadata.json`, language files, stops) see
[adding-tours.md](./adding-tours.md). This page covers the **multi-tour layout**
and the app-level **`app.json`** that themes and authors the selection screen.

## File structure

Each tour lives in its own subfolder under `src/data/tour/`. The optional
`app.json` sits at the root, alongside the tour folders:

```
src/data/tour/
├── app.json              # App-level config for the selection screen (optional)
├── new-york/
│   ├── metadata.json     # Shared per-tour properties
│   ├── en.json           # English content
│   └── route.geojson
└── lower-manhattan/
    ├── metadata.json
    ├── en.json
    ├── de.json
    └── route.geojson
```

Tours are discovered by their internal `id`/`language` fields, not by filename
or folder name — but one folder per tour keeps things tidy.

> Files are mirrored to `public/data/tour/` by Vite for test HTTP access. Only
> maintain the `src/` version.

### The `_fixture/` folder

A folder id prefixed with `_` (currently just `_fixture/`) is a **hidden tour**:
`getAvailableTourIds()` filters it out, so it never appears in the picker, the
default-tour selection, or `public/data/tour/`'s mirrored/flat copies — it's
only reachable directly at `/tour/_fixture`. `_fixture` specifically backs the
E2E suite: it's the one tour with a stop of every content type (real tours are
audio-only), plus a deliberate XSS payload for sanitization tests. See
`tests/content-types.spec.ts` / `tests/sanitization.spec.ts` / `tests/config-flags.spec.ts`.
It ships in every deployment regardless of which real tour content is active
(`bun run tour:use` never touches it) — leave it in place.

## How the selection screen is themed

Without `app.json` the picker borrows the **first tour's** `themeId` and shows a
built-in, translated title/subtitle. Add `app.json` to take control of the
theme, copy, logo, hero backdrop, and card layout.

## app.json

Every field is optional. Omitting the file (or any field) keeps the previous
default behavior.

```json
{
  "$schema": "../../schema/app-config.schema.json",
  "themeId": "default-light",
  "defaultLanguage": "en",
  "title":    { "en": "Discover New York", "de": "Entdecke New York" },
  "subtitle": { "en": "Pick a walking tour to begin", "de": "Wähle eine Tour zum Starten" },
  "logo": "https://your-storage.com/logo.svg",
  "hero": "https://your-storage.com/cover.webp",
  "tourOrder": ["new-york", "lower-manhattan"],
  "tourCard": {
    "showImage": true,
    "showDescription": true,
    "showMeta": true
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `themeId` | string | first tour's theme, else `"default-light"` | Theme for the selection screen. References a registered theme (`"default-light"` / `"default-dark"`); see [themes.md](./themes.md). |
| `defaultLanguage` | string | first tour's `defaultLanguage`, else `"en"` | Preferred language before the user picks one. Takes priority over per-tour `metadata.json`. |
| `title` | `LocalizedString` | built-in `t.tourSelection.title` ("Choose a tour") | Landing heading. Per-language map; missing languages fall back to the built-in translation. |
| `subtitle` | `LocalizedString` | built-in `t.tourSelection.subtitle` ("Select a tour to begin your visit") | Landing subheading. Same fallback as `title`. |
| `logo` | string | — | Image URL shown above the title in the header (rendered ~32px tall). Tapping it re-opens the `splash` if one is set. |
| `hero` | string | — | Image URL used as a **full-screen backdrop** behind all content (lowest layer, `object-fit: cover`). The header and the card list have no background of their own, so it shows through behind the logo, title and subtitle and around the cards — pick something light enough for the header text to stay readable, or pre-wash the image. |
| `splash` | string | — | Image **or video** URL for a full-screen branding intro shown over the picker — see below. |
| `splashArrowColor` | string | `"#FFFFFF"` | Color (hex) of the splash's arrow hint button (its circle border and the arrow inside). Set it so the hint stays visible on your splash — white is invisible on a white background. |
| `statusBarColor` | string | theme header color | Color (hex) for the iOS status bar / browser chrome (`theme-color`) **while the splash is shown**. Set it to match your splash. The picker itself uses the theme's header color. |
| `tourOrder` | string[] | discovery order | Tour `id`s in display order. Listed ids come first; any remaining tours are appended. Unknown ids are ignored. |
| `tourCard` | `TourCardConfig` | all shown | What every tour card displays — see below. |

### Where the images live

`logo`, `hero` and `splash` take any URL. For assets that ship with the app, put
the file in `public/` and reference it root-relative — `"/images/app/logo.webp"`
resolves to `public/images/app/logo.webp`, is copied to `dist/` untouched, and
works offline. Remote URLs (R2, S3, a CDN) are equally valid and keep the bundle
small.

### Localized strings

`title` and `subtitle` are maps of `languageCode → string`:

```json
"title": { "en": "Discover New York", "de": "Entdecke New York" }
```

The current language is looked up by code. If a language is missing, the value
falls back to the built-in translation (already provided in all supported
locales — see [languages.md](./languages.md)).

### Splash / intro screen (`splash`)

A branding option for museums: a **full-screen image or video** shown over the
selection screen until the visitor taps anywhere to continue. The selection
screen is functional and hard to brand; the splash gives a clean full-bleed
canvas first.

```json
"splash": "https://your-storage.com/intro.mp4"
```

- **Image or video** — videos (`.mp4`, `.webm`, `.ogg`, `.mov`) autoplay muted and
  loop; anything else is treated as an image. Both fill the frame (`object-fit: cover`).
- A **pulsing arrow button** hints that swiping continues to the picker. The
  arrow is the same glyph as the in-tour back button, mirrored to point onward.
  Swiping left or tapping anywhere slides the splash off to the left (with haptic
  feedback) to reveal the list. Color it with `splashArrowColor` (defaults to
  white) so it stays visible against your splash.
- Shown **once per visit** — it does not reappear when returning to the picker
  from a tour. Omit or set `""` to disable.
- **Re-open from the logo** — if both `logo` and `splash` are set, tapping the
  logo in the selection header brings the splash back (e.g. to replay branding).

### Tour card layout (`tourCard`)

Controls which elements render on **every** tour card in the list. The **title
is always shown**. These are app-wide — there is no per-tour override.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showImage` | boolean | `true` | Cover image (16:9 thumbnail at the top of the card) |
| `showDescription` | boolean | `true` | Description text |
| `showMeta` | boolean | `true` | Meta row: total duration (minutes) and stop count |

| `showImage` | `showDescription` | `showMeta` | Result |
|-------|----------|--------|--------|
| `true` | `true` | `true` | Full card (default): image, title, description, meta |
| `true` | `false` | `false` | Image + title only |
| `false` | `true` | `true` | Title, description, meta — no image |
| `false` | `false` | `false` | Title only |

The card cover uses a **16:9** aspect ratio (supply source images at ~16:9, e.g.
800×450). Tapping a card scales the whole card down slightly as a single press
effect.

## Behavior notes

- **Single tour** → the selection screen is skipped and the tour opens directly,
  so `title`, `subtitle`, `logo`, `hero` and `tourCard` never render. `splash` is
  the exception: it is portaled to `<body>` above everything, so it still plays
  over the tour on first load — which also means it appears over a deep link
  straight into a tour (`/tour/<id>`) in multi-tour apps.
- **Themes stay in code.** `app.json` references a registered `themeId`; it cannot
  define a new theme inline. To add a new look, create a theme in
  `src/theme/themes/` (see [themes.md](./themes.md)).
- **No per-tour override for `tourCard`** — card layout is intentionally uniform
  across the list.

> **Rebuild after editing `app.json`.** It is bundled into the app at build time
> (via `import.meta.glob`), so changes require a dev-server reload or a rebuild
> to take effect.

## Validation

`app.json` is validated against a generated JSON Schema on every build:

```bash
bun run validate     # checks app.json, metadata.json and language files
bun run build        # runs validate, then builds
```

The schema is generated from `types.ts` — if you change `AppConfig`, re-run
`bun run schema`. Editor validation is wired up via `.vscode/settings.json`.
