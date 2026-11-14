# Multi-language tours

Tours are automatically discovered by language at build time using Vite's `import.meta.glob`. Available languages are derived from the `language` field in tour JSON files — no separate config needed.

## File structure

```
src/data/tour/
├── metadata.json    # Shared properties
├── en.json          # "language": "en"
├── cs.json          # "language": "cs"
└── de.json          # "language": "de"
```

The `language` field in each JSON determines the language, not the filename.

## Configuration

Set the default language in `metadata.json`:

```json
{
  "id": "barcelona",
  "defaultLanguage": "en"
}
```

Used when the user's browser language is unavailable or no preference is saved.

## Language selection order

1. `?lang=` URL parameter (e.g. `yoursite.com/tour/barcelona?lang=de`)
2. Saved user preference (localStorage `app-preferences`)
3. Browser/device language (`navigator.language`)
4. `defaultLanguage` from metadata
5. First available language

## Adding a new language

1. - [ ] Create `src/data/tour/{code}.json` with the same `id` as other language files
2. - [ ] Set `"language": "{code}"` in the file
3. - [ ] Use matching stop `id` values across all language files
4. - [ ] Translate all text content, update `audioFile` URLs
5. - [ ] (Optional) Add display name and flag to `languageMetadata` in `src/services/tourDiscovery.ts`
6. - [ ] (Optional) Add UI translation file to `src/translations/locales/{code}.ts`
7. - [ ] Verify language appears in language picker and content loads correctly

> If step 5 is skipped, the language code is used as the display name with a generic flag. If step 6 is skipped, the UI falls back to the default language.

## Language metadata

Display name, flag, and country code are defined in `src/services/tourDiscovery.ts`:

```typescript
const languageMetadata: Record<string, { name: string; flag: string; countryCode: string }> = {
  en: { name: 'English', flag: '🇬🇧', countryCode: 'GB' },
  cs: { name: 'Čeština', flag: '🇨🇿', countryCode: 'CZ' },
  de: { name: 'Deutsch', flag: '🇩🇪', countryCode: 'DE' },
  fr: { name: 'Français', flag: '🇫🇷', countryCode: 'FR' },
  it: { name: 'Italiano', flag: '🇮🇹', countryCode: 'IT' },
  es: { name: 'Español', flag: '🇪🇸', countryCode: 'ES' },
};
```

`countryCode` is used for SVG flag icons from the `country-flag-icons` package.

## Progress and switching

Progress is tracked per tour `id`, not per language. Completed stops and playback position are preserved when switching languages. When the user changes language:

- Current audio stops immediately
- Current stop and position are saved
- Tour reloads in the new language
- Audio is paused at the same position, ready to play

## localStorage

Language preference is stored under key `app-preferences`:

```json
{ "selectedLanguage": "cs" }
```

## Consistency requirements

All language files for the same tour must have:
- The same `id`
- The same stop `id` values
- The same number of stops, and therefore the same `totalStops` (which counts `audio` stops only, not the length of `stops`)

## Troubleshooting

**Language not in picker** — Verify `language` field is lowercase and the dev server has been restarted.

**Tour doesn't load** — Verify file exists at `src/data/tour/{code}.json` with valid `id` and `language` fields.

**Progress not preserved** — Verify all language files share the same tour `id` and stop `id` values.
