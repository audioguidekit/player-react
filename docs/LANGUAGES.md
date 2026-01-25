# Multi-Language Tour System

Audio Tour Player supports multiple languages with seamless switching and progress preservation.

## Overview

The language system allows you to:
- Provide tours in multiple languages
- Automatically detect user's device/browser language
- Remember user's language preference across sessions
- Let users switch languages on the fly
- Preserve playback position and progress when switching
- Maintain a single tour across all languages

### Smart Language Selection

The app provides a seamless multilingual experience:

1. **First-time visitors:** App detects device language (e.g., Czech phone → Czech tour)
2. **Returning visitors:** App remembers their language choice
3. **Manual selection:** Users can change language anytime via language picker
4. **Intelligent fallback:** If device language unavailable, defaults to configurable default language

**Example User Flow:**
```
Czech user visits on iPhone → App auto-selects Czech
  ↓
User changes to English → Preference saved
  ↓
User refreshes page → App remembers English choice
  ↓
User clears localStorage → App detects Czech again
```

## Configuring UI Languages

The app separates **tour content languages** (tour data files) from **UI languages** (buttons, labels, messages). You can configure which UI languages to include in your build to reduce bundle size.

### Configuration File

Edit `src/config/languages.ts` to configure languages:

```typescript
// Language imports - uncomment languages you need
import { en } from '../translations/locales/en';
import { cs } from '../translations/locales/cs';
// import { de } from '../translations/locales/de';  // Not needed
// import { fr } from '../translations/locales/fr';  // Not needed

/**
 * Default language for the app.
 * Used when user's browser language is not supported.
 */
export const defaultLanguage: LanguageCode = 'en';

export const supportedLanguages = {
  en,
  cs,
  // de,
  // fr,
};
```

### Default Language

The `defaultLanguage` setting controls the fallback language used when:
- User's browser/device language is not supported
- A tour is not available in the requested language
- No language preference has been set

Change it to any supported language code:
```typescript
export const defaultLanguage: LanguageCode = 'de';  // German as default
```

### Tree-Shaking

Vite automatically removes unused language files from the bundle:
- **All 6 languages:** ~1,734 KB
- **English only:** ~1,726 KB
- Savings grow as translation files expand

### Graceful Fallback

If a tour is in a language without UI translations, the app falls back to English automatically:

```
Tour in German (de.json) + UI only supports English
  → Tour content in German
  → UI labels in English (no error shown)
```

This allows you to support tour content in many languages while keeping the bundle small.

## How It Works

### Tour Discovery System

Tours are automatically discovered at build time using Vite's `import.meta.glob`. The system reads the `language` field from each tour JSON file to determine which language it belongs to.

**Key benefit:** You can name files however you want - the language is determined by the JSON content, not the filename.

### File Structure

Tour files can be organized flexibly. The `language` field inside each JSON determines the language:

```
/public/data/tours/
├── en.json          # Has "language": "en"
├── cs.json          # Has "language": "cs"
├── de.json          # Has "language": "de"
└── ...
```

Future structure for multiple tours:
```
/public/data/tours/
├── barcelona/
│   ├── en.json      # "id": "barcelona", "language": "en"
│   ├── cs.json      # "id": "barcelona", "language": "cs"
│   └── de.json      # "id": "barcelona", "language": "de"
└── london/
    ├── en.json      # "id": "london", "language": "en"
    └── fr.json      # "id": "london", "language": "fr"
```

### Language Detection

Available languages are automatically detected from tour files at build time. No separate `languages.json` file is required - the system discovers languages from the `language` field in tour JSONs.

**Language display names** are defined in `src/services/tourDiscovery.ts`:

```typescript
const languageNames: Record<string, string> = {
  en: 'English',
  cs: 'Čeština',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
};
```

## Creating Multi-Language Tours

### Step 1: Create Tour Files

Create one JSON file per language using the language code as the filename:

**File: `/public/data/tours/en.json`**
```json
{
  "id": "barcelona",
  "language": "en",
  "title": "Unlimited Barcelona",
  "description": "Discover the rich history and culture of Barcelona",
  "totalDuration": "20 minutes",
  "totalStops": 10,
  "image": "https://example.com/barcelona.jpg",
  "stops": [
    {
      "id": "1",
      "type": "audio",
      "title": "Welcome and Instructions",
      "duration": "1:30 mins",
      "isCompleted": false,
      "image": "https://example.com/stop1.jpg",
      "audioFile": "https://example.com/audio/en/01.mp3"
    }
  ]
}
```

**File: `/public/data/tours/cs.json`**
```json
{
  "id": "barcelona",
  "language": "cs",
  "title": "Neomezená Barcelona",
  "description": "Objevte bohatou historii a kulturu Barcelony",
  "totalDuration": "20 minut",
  "totalStops": 10,
  "image": "https://example.com/barcelona.jpg",
  "stops": [
    {
      "id": "1",
      "type": "audio",
      "title": "Vítejte a pokyny",
      "duration": "1:30 mins",
      "isCompleted": false,
      "image": "https://example.com/stop1.jpg",
      "audioFile": "https://example.com/audio/cs/01.mp3"
    }
  ]
}
```

### Step 2: Ensure Consistency

**IMPORTANT:** All language versions must have:

1. **Same Tour ID**
   - All files must use the same `id` value
   - Example: `"id": "barcelona"` in all language files

2. **Same Stop IDs**
   - Stop IDs must match across languages
   - Example: Stop with `"id": "1"` in English = Stop with `"id": "1"` in Czech

3. **Matching Language Codes**
   - The `language` field must match a code in `languages.json`
   - Example: `"language": "en"` must have `{"code": "en", ...}` in languages.json

4. **Same Number of Stops**
   - All language versions should have the same stops
   - Users can switch languages at any point

### Step 3: Add Language to languages.json

If adding a new language, update `/public/data/languages.json`:

```json
[
  {
    "code": "en",
    "name": "English",
    "flag": "🇬🇧"
  },
  {
    "code": "pt",
    "name": "Português",
    "flag": "🇵🇹"
  }
]
```

## Language Switching Behavior

### User Experience

When a user switches language:

1. **Audio Stops Immediately**
   - Current audio playback stops
   - No jarring transitions

2. **Position is Preserved**
   - Current stop number saved
   - Playback position within stop saved
   - Console log: `[LANGUAGE_CHANGE] Saved position: {stopId} at {time}s`

3. **Tour Reloads**
   - New language file loads (e.g., `cs.json`)
   - UI updates with translated content

4. **User Resumes**
   - Same stop, same position, new language
   - Audio is paused and ready to play
   - User presses play to continue in new language

### Example Flow

```
User is at "Stop 5" at 1:23 in English
    ↓
Opens language sheet, selects Czech
    ↓
Audio stops, saves: Stop 5 @ 1:23
    ↓
App loads cs.json
    ↓
Seeks to Stop 5 @ 1:23 (Czech audio)
    ↓
User presses play → continues in Czech
```

### Progress Tracking

Progress is tracked per **tour ID** (not per language):

- **Completed Stops:** Marked completed across all languages
- **Progress Percentage:** Preserved when switching
- **Resume Position:** Saved automatically

**Example:**
- User completes Stops 1-3 in English → 30% complete
- Switches to Czech → Still 30% complete
- Stops 1-3 remain marked as completed

## Technical Implementation

### Language Preference Persistence

The app automatically remembers the user's language preference across sessions using localStorage.

#### Automatic Language Detection

On first visit, the app intelligently selects a language using this priority:

1. **Saved User Preference** (highest priority)
   - If user previously selected a language, use that
   - Stored in `localStorage` under key `app-preferences`
   - Respects explicit user choice

2. **Browser/Device Language** (auto-detection)
   - Detects from `navigator.language` (e.g., "cs-CZ", "en-US", "de-DE")
   - Extracts language code (e.g., "cs-CZ" → "cs")
   - Matches against available languages
   - Console logs: `[LANGUAGE] Detected browser language: cs-CZ, using: cs`

3. **English Fallback**
   - If browser language not available in app

4. **First Available Language**
   - Ultimate fallback

#### Storage Implementation

**Location:** `App.tsx` (lines 65-104)

```typescript
// On app mount - check saved preference first
const preferences = storageService.getPreferences();
const savedLanguageCode = preferences.selectedLanguage;

if (savedLanguageCode) {
  languageToUse = languages.find(l => l.code === savedLanguageCode);
}

// If no saved preference, detect browser language
if (!languageToUse) {
  const browserLanguage = navigator.language || navigator.languages?.[0];
  const browserLangCode = browserLanguage.split('-')[0].toLowerCase();
  languageToUse = languages.find(l => l.code === browserLangCode);
}
```

**When user changes language:**

```typescript
// App.tsx - handleLanguageChange function
const handleLanguageChange = (language: Language) => {
  // Save preference to localStorage
  storageService.setPreferences({ selectedLanguage: language.code });

  // Update app state
  setSelectedLanguage(language);
};
```

#### localStorage Structure

**Key:** `app-preferences`

**Value:**
```json
{
  "selectedLanguage": "cs",
  "theme": "light"
}
```

#### Mobile Device Language Detection

**iOS Safari:**
- Reads from: Settings → General → Language & Region → iPhone Language
- Examples:
  - Czech device (cs-CZ) → App opens in Czech
  - German device (de-DE) → App opens in German

**Android Chrome:**
- Reads from: Settings → Languages → Preferred languages (first preference)
- Examples:
  - French phone (fr-FR) → App opens in French
  - Spanish phone (es-ES) → App opens in Spanish

**Fallback Behavior:**
- Unsupported language (e.g., Polish "pl-PL") → Falls back to default language
- No browser language available → Falls back to default language

### Data Loading

Tours are loaded by language code:

```typescript
// App.tsx
const { data: tour } = useTourData(selectedLanguage?.code);
```

When `selectedLanguage` changes, the tour automatically reloads with the new language file.

### File Naming Convention

Tour files use the pattern: `{languageCode}.json`

```
en.json   → English
cs.json   → Czech
de.json   → German
fr.json   → French
```

### Data Service

The data service loads tours by language:

```typescript
// Load tour by language code
const tour = await dataService.getTourByLanguage('en');
```

This fetches `/data/tours/en.json` and caches it for performance.

## Tour JSON Structure

### Required Fields

Every language version must include:

```json
{
  "id": "barcelona",           // Same across all languages
  "language": "en",            // Matches code in languages.json
  "title": "...",              // Translated
  "description": "...",        // Translated
  "totalDuration": "...",      // Can be translated
  "totalStops": 10,            // Same number
  "image": "...",              // Usually same URL
  "stops": [...]               // Same structure
}
```

### Stop Structure

Each stop must maintain the same structure:

```json
{
  "id": "1",                   // Same across languages
  "type": "audio",             // Same type
  "title": "Welcome",          // Translated
  "duration": "1:30 mins",     // Same or translated
  "isCompleted": false,        // Always false initially
  "image": "...",              // Usually same URL
  "audioFile": "..."           // Language-specific audio URL
}
```

## Best Practices

### 1. Consistent Stop IDs

✅ **Good:**
```json
// en.json
{"id": "1", "title": "Welcome"}

// cs.json
{"id": "1", "title": "Vítejte"}
```

❌ **Bad:**
```json
// en.json
{"id": "1", "title": "Welcome"}

// cs.json
{"id": "stop-1", "title": "Vítejte"}  // Different ID!
```

### 2. Same Tour ID

✅ **Good:**
```json
// All files use same ID
// en.json
{"id": "barcelona", "language": "en"}

// cs.json
{"id": "barcelona", "language": "cs"}
```

❌ **Bad:**
```json
// en.json
{"id": "barcelona-en", "language": "en"}

// cs.json
{"id": "barcelona-cs", "language": "cs"}  // Different IDs!
```

### 3. Audio File Organization

Organize audio files by language:

```
/audio/
├── en/
│   ├── 01.mp3
│   ├── 02.mp3
│   └── 03.mp3
├── cs/
│   ├── 01.mp3
│   ├── 02.mp3
│   └── 03.mp3
└── de/
    ├── 01.mp3
    ├── 02.mp3
    └── 03.mp3
```

Reference in tour files:
```json
{
  "audioFile": "https://example.com/audio/en/01.mp3"  // English
}
```

### 4. Translation Quality

- Use native speakers for translations
- Maintain the same tone and style
- Keep durations accurate
- Translate UI text consistently

### 5. Testing Each Language

For each language, verify:
- [ ] Tour loads without errors
- [ ] All text displays correctly
- [ ] Audio files play properly
- [ ] Images load correctly
- [ ] Language switching works
- [ ] Progress is preserved
- [ ] No missing translations
- [ ] Browser language auto-detection works
- [ ] Language preference persists after refresh
- [ ] Saved preference takes precedence over browser language

## Adding a New Language

### Quick Checklist

1. [ ] Add language to `/public/data/languages.json`
2. [ ] Create `/public/data/tours/{code}.json`
3. [ ] Use same tour ID as other languages
4. [ ] Use same stop IDs as other languages
5. [ ] Translate all text content
6. [ ] Update audio file URLs to language-specific files
7. [ ] Test language switching
8. [ ] Verify progress preservation

### Example: Adding Portuguese

**1. Update languages.json:**
```json
[
  {
    "code": "pt",
    "name": "Português",
    "flag": "🇵🇹"
  }
]
```

**2. Create pt.json:**
```json
{
  "id": "barcelona",
  "language": "pt",
  "title": "Barcelona Ilimitada",
  "description": "Descubra a rica história e cultura de Barcelona",
  "totalDuration": "20 minutos",
  "totalStops": 10,
  "image": "https://example.com/barcelona.jpg",
  "stops": [
    {
      "id": "1",
      "type": "audio",
      "title": "Boas-vindas e Instruções",
      "duration": "1:30 mins",
      "isCompleted": false,
      "image": "https://example.com/stop1.jpg",
      "audioFile": "https://example.com/audio/pt/01.mp3"
    }
  ]
}
```

**3. Test:**
```bash
npm run dev
# Open app
# Select Portuguese from language picker
# Verify content loads in Portuguese
# Switch to another language
# Verify position is preserved
```

## Troubleshooting

### Language Not Appearing

**Problem:** New language doesn't show in language picker

**Solutions:**
1. Check `languages.json` syntax
2. Verify language code is lowercase
3. Clear browser cache
4. Restart dev server

### Tour Doesn't Load

**Problem:** Selecting language shows error

**Solutions:**
1. Verify `{code}.json` file exists
2. Check tour file has `language` field
3. Ensure `language` matches code in `languages.json`
4. Validate JSON syntax
5. Check browser console for errors

### Progress Not Preserved

**Problem:** Switching language loses position

**Solutions:**
1. Verify same tour `id` in all language files
2. Ensure stop IDs match across languages
3. Check browser console for errors
4. Test with latest code version

### Wrong Audio Plays

**Problem:** Switching language plays audio from wrong language

**Solutions:**
1. Check `audioFile` URLs in tour JSON
2. Verify audio files exist at specified URLs
3. Clear browser cache
4. Check audio file naming convention

### Language Not Auto-Detected

**Problem:** App doesn't detect browser language on first visit

**Solutions:**
1. Check browser language settings:
   - Chrome: Settings → Languages
   - Safari: System Preferences → Language & Region
2. Verify language code matches available languages (case-sensitive)
3. Check console for detection logs: `[LANGUAGE] Detected browser language: ...`
4. Ensure no saved preference exists (clear localStorage)
5. Test with: `console.log(navigator.language)`

### Language Not Persisting

**Problem:** App doesn't remember language choice after refresh

**Solutions:**
1. Check localStorage is enabled in browser
2. Verify localStorage has `app-preferences` key:
   ```javascript
   localStorage.getItem('app-preferences')
   ```
3. Check for private/incognito mode (localStorage disabled)
4. Verify `storageService.setPreferences()` is called on language change
5. Check browser console for storage errors
6. Test with:
   ```javascript
   // Should show saved language
   JSON.parse(localStorage.getItem('app-preferences'))
   ```

### Wrong Language After Clearing Cache

**Problem:** App shows wrong language after clearing browser cache

**Expected Behavior:**
- Clearing cache should trigger browser language detection again
- If device is set to Czech, app should detect Czech

**Solutions:**
1. Verify device/browser language is set correctly
2. Clear localStorage (cache clearing doesn't always clear localStorage):
   ```javascript
   localStorage.removeItem('app-preferences')
   ```
3. Hard refresh: Cmd/Ctrl + Shift + R

## API Reference

### Types

```typescript
interface TourData {
  id: string;           // Tour identifier
  language: string;     // Language code
  title: string;        // Translated title
  description: string;  // Translated description
  totalDuration: string;
  totalStops: number;
  stops: Stop[];
  image: string;
  offlineAvailable?: boolean;
  transitionAudio?: string;
}

interface Language {
  code: string;         // ISO 639-1 code
  name: string;         // Native name
  flag: string;         // Emoji flag
}
```

### Loading Tours by Language

```typescript
import { dataService } from './src/services/dataService';

// Load specific language
const tour = await dataService.getTourByLanguage('en');

// Load with hook
const { data: tour } = useTourData('en');
```

### Language Detection

The app automatically detects and applies the user's language preference:

```typescript
// Implemented in App.tsx (lines 65-104)

// 1. Check for saved preference
const preferences = storageService.getPreferences();
const savedLanguageCode = preferences.selectedLanguage;

// 2. Detect browser language if no saved preference
const browserLanguage = navigator.language || navigator.languages?.[0];
const browserLangCode = browserLanguage.split('-')[0].toLowerCase(); // 'en-US' → 'en'

// 3. Match against available languages
const languages = await dataService.getLanguages();
const detectedLanguage = languages.find(l => l.code === browserLangCode);

// 4. Fallback chain: saved → detected → defaultLanguage → first available
const languageToUse = savedLanguage || detectedLanguage ||
                      languages.find(l => l.code === defaultLanguage) ||
                      languages[0];
```

**Testing Language Detection:**

Desktop browser:
```javascript
// Chrome DevTools → Console
navigator.language  // Check current language
localStorage.getItem('app-preferences')  // Check saved preference
```

Mobile device:
- iOS: Settings → General → Language & Region
- Android: Settings → Languages → Preferred languages

## Migration from Old System

If you have existing tour files, migrate them:

### Before (old system)
```
/public/data/tours/
└── tour.json
```

### After (new system)
```
/public/data/tours/
├── en.json
├── cs.json
└── de.json
```

### Migration Steps

1. **Rename existing file:**
   ```bash
   mv tour.json en.json
   ```

2. **Add language field:**
   ```json
   {
     "id": "barcelona",
     "language": "en",  // Add this
     "title": "..."
   }
   ```

3. **Create additional languages:**
   - Copy `en.json` to `cs.json`, `de.json`, etc.
   - Update `language` field in each
   - Translate content
   - Update audio URLs

4. **Update code:**
   - Change `useTourData(tourId)` to `useTourData(languageCode)`
   - Remove tour ID-based loading if not needed

## Implemented Features

✅ **Automatic Language Detection** (Implemented)
- Detects browser/device language on first visit
- Stores user preference across sessions
- Intelligent fallback chain

✅ **Language Preference Persistence** (Implemented)
- Remembers user's language choice in localStorage
- Works across page refreshes and browser sessions

## Future Enhancements

Potential improvements to the language system:

- **Language Fallback:** If translation missing, fall back to default language
- **Partial Translations:** Allow mixing languages (English audio, Czech UI)
- **Regional Variants:** Support `en-US` vs `en-GB`, `pt-BR` vs `pt-PT`
- **RTL Support:** Add right-to-left language support (Arabic, Hebrew)
- **Translation Management:** Tools for managing translations
- **Language Analytics:** Track which languages are most used
- **Crowdsourced Translations:** Allow community contributions

## Resources

- **ISO 639-1 Language Codes:** https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- **Emoji Flags:** https://emojipedia.org/flags
- **Translation Services:**
  - Google Translate API
  - DeepL API
  - Professional translation services

---

**Related Documentation:**
- [Adding Tours](./ADDING_TOURS.md) - How to create tours
- [Data Structure](../public/data/README.md) - JSON format details
- [Main Documentation](../README.md) - General information
