# Adding tours

Tours are automatically discovered from `src/data/tour/` — no manifest needed.

> Bundling **more than one tour**? Put each tour in its own subfolder and add an
> app-level `app.json` to theme the selection screen. See [multi-tour.md](./multi-tour.md).

## File structure

```
src/data/tour/
├── metadata.json    # Shared properties (id, theme, offline mode, etc.)
├── en.json          # English content
├── cs.json          # Czech content
└── de.json          # German content
```

> Files are automatically synced to `public/data/tour/` by Vite for test HTTP access. Only maintain the `src/` version.

> **Shipping several separate builds** (a different tour set per client or venue)? Keep each set in its own folder under `tours-content/` and switch with `bun run tour:use <name>`. Note this **replaces** everything in `src/data/tour/` — so it's for swapping whole deployments, not for editing tours in place. `bun run tour:use barcelona` restores the repo's bundled demo tour.

## metadata.json

Shared properties across all language versions. Individual language files can override any field.

```json
{
  "id": "your-tour-id",
  "defaultLanguage": "en",
  "offlineMode": "optional",
  "transitionAudio": "https://your-storage.com/audio/transition.m4a",
  "themeId": "default-light",
  "transcriptAvailable": true,
  "collectFeedback": true,
  "image": "https://images.unsplash.com/photo-xxxxx"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | Unique tour identifier |
| `defaultLanguage` | string | `"en"` | Fallback language code |
| `offlineMode` | `"optional"` \| `"online-only"` \| `"offline-only"` | `"optional"` | Offline behavior |
| `transitionAudio` | string | — | Audio played between stops |
| `themeId` | string | — | `"default-light"` or `"default-dark"` |
| `imageColor` | string | — | Status bar / start screen background (e.g. `"#1A2634"`) |
| `transcriptAvailable` | boolean | — | Show transcription toggle |
| `collectFeedback` | boolean | — | Show rating button |
| `fullscreenPlayer` | boolean | `false` | Enable fullscreen overlay player |
| `showProgressBar` | boolean | `true` | Show playback progress bar |
| `showLanguageLabel` | boolean | `true` | Show language name next to flag |
| `showStopImage` | `boolean \| "thumbnail"` | `true` | Stop card layout (see below) |
| `showStopDuration` | boolean | `true` | Show duration on stop cards |
| `showStopNumber` | boolean | `true` | Show number indicator on stops |
| `listView` | boolean | `true` | Enable the list view (see [map.md](./map.md#view-modes)) |
| `mapView` | boolean | `false` | Enable the map view (see [map.md](./map.md)) |
| `hapticsEnabled` | boolean | `true` | Enable haptic feedback on taps |
| `image` | string | — | Default tour cover image URL. Can be overridden per language by adding `"image"` to the language file. |

### Stop card display options

| `showStopImage` | `showStopDuration` | `showStopNumber` | Result |
|-------|----------|--------|--------|
| `true` | `true` | `true` | Full card (default) |
| `true` | `true` | `false` | Card without number circle |
| `true` | `false` | `true` | Card without duration badge |
| `"thumbnail"` | `true` | `true` | Compact row with thumbnail |
| `false` | `true` | `true` | List: `[1] Title ......... 5:30` |
| `false` | `true` | `false` | List: `Title ......... 5:30` |
| `false` | `false` | `true` | List: `[1] Title` |
| `false` | `false` | `false` | List: `Title` |

> **Map & list views:** A tour can show a map view, a list view, or both, toggled in the header. `listView` defaults to `true`; enable the map with `mapView: true`. Set `listView: false` (with `mapView: true`) for a map-only tour. See [View modes](./map.md#view-modes) for the full combination table, plus the map config fields (`mapProvider`, `mapCenter`, etc.) in [map.md](./map.md).

### Haptic feedback

Set `"hapticsEnabled": false` to disable all haptic feedback for a tour. Defaults to `true`.

Haptics work on Android via the Vibration API and on iOS via a hidden-checkbox trick that fires the system Taptic Engine — the same feel as toggling a native switch. Desktop is a no-op. The flag is read once at startup; there is no runtime toggle.

### Offline modes

| Mode | Behavior |
|------|----------|
| `optional` | Download button shown, tour starts without downloading |
| `online-only` | No download UI, plays directly from network |
| `offline-only` | Download required before playback; button shows "Download Tour" until complete |

## Language files

Each language file contains translated content and can override any metadata field.

```json
{
  "id": "your-tour-id",
  "language": "en",
  "title": "Your Tour Title",
  "description": "Brief description (1-2 sentences)",
  "totalDuration": "45 mins",
  "totalStops": 5,
  "stops": [
    {
      "id": "1",
      "type": "audio",
      "title": "First Stop",
      "duration": "5 min audio",
      "image": "https://images.unsplash.com/photo-xxxxx",
      "audioFile": "https://your-storage.com/audio/stop-01.mp3"
    }
  ]
}
```

To override the cover image for a specific language, add `"image"` to that language file — it takes precedence over `metadata.json`'s `"image"`. Languages that don't include it fall back to the metadata value.

```json
{
  "id": "your-tour-id",
  "language": "es",
  "image": "https://your-storage.com/images/cover-es.webp",
  "title": "Tu título en español",
  ...
}
```

For stop fields, types, and per-type JSON examples see [stops.md](./stops.md). For the full language system (selection order, adding languages, localStorage) see [languages.md](./languages.md).

## Validation checklist

- [ ] Valid JSON (use [JSONLint](https://jsonlint.com))
- [ ] All required fields present
- [ ] Tour `id` matches across `metadata.json` and all language files
- [ ] Stop `id` values are consistent across languages
- [ ] `totalStops` matches the actual number of stops
- [ ] All image URLs are HTTPS and load successfully
- [ ] Audio files play correctly
- [ ] No console errors: `bun run test`

## Troubleshooting

**Tour doesn't load** — Check browser console for errors. Verify `id` matches exactly (case-sensitive). Validate JSON syntax.

**Images don't display** — Verify URLs are HTTPS. Check for CORS issues. Test the URL directly in a browser.

**JSON syntax error** — Missing/trailing commas, single quotes instead of double quotes, or unclosed brackets. Validate at [JSONLint](https://jsonlint.com).
