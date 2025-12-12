# Multi-Language Tour System

AudioTour Pro supports multiple languages with seamless switching and progress preservation.

## Overview

The language system allows you to:
- Provide tours in multiple languages
- Let users switch languages on the fly
- Preserve playback position and progress when switching
- Maintain a single tour across all languages

## How It Works

### File Structure

Each language has its own tour file named with the language code:

```
/public/data/tours/
├── en.json          # English tour
├── cs.json          # Czech tour
├── de.json          # German tour
├── fr.json          # French tour
├── it.json          # Italian tour
└── es.json          # Spanish tour
```

### Language Codes

Language codes are defined in `/public/data/languages.json`:

```json
[
  {
    "code": "en",
    "name": "English",
    "flag": "🇬🇧"
  },
  {
    "code": "cs",
    "name": "Česky",
    "flag": "🇨🇿"
  },
  {
    "code": "de",
    "name": "Deutsch",
    "flag": "🇩🇪"
  }
]
```

**Field Descriptions:**
- `code`: ISO 639-1 language code (2 letters, lowercase)
- `name`: Native language name
- `flag`: Emoji flag representing the language

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

```typescript
// Get user's browser language
const browserLang = navigator.language.split('-')[0]; // 'en-US' → 'en'

// Check if supported
const languages = await dataService.getLanguages();
const isSupported = languages.some(l => l.code === browserLang);

// Fallback to default
const langCode = isSupported ? browserLang : 'en';
```

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

## Future Enhancements

Potential improvements to the language system:

- **Automatic Language Detection:** Detect browser language and auto-select
- **Language Fallback:** If translation missing, fall back to default language
- **Partial Translations:** Allow mixing languages (English audio, Czech UI)
- **Regional Variants:** Support `en-US` vs `en-GB`
- **RTL Support:** Add right-to-left language support (Arabic, Hebrew)
- **Translation Management:** Tools for managing translations

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
