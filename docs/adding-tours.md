# Adding tours

Tours are automatically discovered from `src/data/tour/` — no manifest needed.

## File structure

```
src/data/tour/
├── metadata.json    # Shared properties (id, theme, offline mode, etc.)
├── en.json          # English content
├── cs.json          # Czech content
└── de.json          # German content
```

> Files are automatically synced to `public/data/tour/` by Vite for test HTTP access. Only maintain the `src/` version.

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
| `backgroundColor` | string | — | Status bar / start screen background (e.g. `"#1A2634"`) |
| `transcriptAvailable` | boolean | — | Show transcription toggle |
| `collectFeedback` | boolean | — | Show rating button |
| `fullscreenPlayer` | boolean | `false` | Enable fullscreen overlay player |
| `showProgressBar` | boolean | `true` | Show playback progress bar |
| `showLanguageLabel` | boolean | `true` | Show language name next to flag |
| `showStopImage` | `boolean \| "thumbnail"` | `true` | Stop card layout (see below) |
| `showStopDuration` | boolean | `true` | Show duration on stop cards |
| `showStopNumber` | boolean | `true` | Show number indicator on stops |
| `image` | string | — | Default tour cover image URL |

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

### Language file fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Must match `metadata.json` id |
| `language` | string | ✓ | ISO 639-1 code: `"en"`, `"cs"`, `"de"` |
| `title` | string | ✓ | Translated tour title |
| `description` | string | ✓ | Translated description |
| `totalDuration` | string | ✓ | Total tour length |
| `totalStops` | number | ✓ | Number of stops |
| `stops` | array | ✓ | Array of stop objects |

### Stop fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Unique within tour, must match across languages |
| `type` | StopType | ✓ | See stop types below |
| `title` | string | ✓ | Stop name |
| `duration` | string | ✓ | Audio length (e.g. `"5 min audio"`) |
| `image` | string | ✓ | Stop image URL (for audio stops) |
| `imageAlt` | string | | Accessibility alt text |
| `imageCaption` | string | | Caption shown below image |
| `imageCredit` | string | | Photo credit |
| `audioFile` | string | | Audio URL (required for `type: "audio"`) |
| `transcription` | string | | Text transcription of audio |

### Stop types

`"audio"`, `"text"`, `"image-text"`, `"video"`, `"headline"`, `"rating"`, `"email"`, `"quote"`, `"image-gallery"`, `"image-comparison"`, `"hotspot-image"`, `"embed"`, `"3d-object"`

See `types.ts` for the full interface of each stop type.

## Multi-language requirements

- All language files must share the same `id`
- Stop `id` values must match across all languages
- `totalStops` must be the same across all languages
- See [languages.md](./languages.md) for the full language system

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
