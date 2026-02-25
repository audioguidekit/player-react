# How to Add New Tours - Step by Step Guide

This guide walks you through adding a new tour to AudioGuideKit.

## Quick Start

Adding a new tour takes just 2 steps:
1. Create tour files (metadata + language files)
2. Test your new tour

Tours are automatically discovered - no manifest needed.

## Tour File Structure

Place tour files in `src/data/tour/`:

```
/src/data/tour/
├── metadata.json    # Shared properties (id, theme, offline mode, etc.)
├── en.json          # English tour content
├── cs.json          # Czech tour content
└── de.json          # German tour content
```

> **Note:** Files are automatically synced to `public/data/tour/` by Vite for test HTTP access. You only need to maintain the `src/` version.

### metadata.json - Shared Properties

The `metadata.json` file contains properties shared across all language versions. These can be overridden in individual language files.

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

**Metadata Fields:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✓ | Unique tour identifier | `"paris-01"` |
| `defaultLanguage` | string | | Default language code if user preference is unavailable | `"en"` |
| `offlineMode` | string | | Offline behavior mode | `"optional"` (default) |
| `transitionAudio` | string | | Audio played between stops | Full HTTPS URL |
| `themeId` | string | | Theme for the tour | `"default-light"`, `"default-dark"` |
| `backgroundColor` | string | | Background color shown behind the player | `"#1A2634"` |
| `transcriptAvailable` | boolean | | Show transcription toggle | `true` |
| `collectFeedback` | boolean | | Show rating button | `true` |
| `fullscreenPlayer` | boolean | | Enable fullscreen overlay player | `true` |
| `showProgressBar` | boolean | | Show playback progress bar | `true` (default) |
| `showLanguageLabel` | boolean | | Show language name next to flag | `true` (default) |
| `showStopImage` | `boolean \| "thumbnail"` | | Show stop images in cards; `"thumbnail"` shows a small thumbnail instead of full card image | `true` (default) |
| `showStopDuration` | boolean | | Show duration on stop cards | `true` (default) |
| `showStopNumber` | boolean | | Show number indicator on stops | `true` (default) |
| `image` | string | | Default tour cover image | Full HTTPS URL |

### Stop Card Display Options

You can customize how stop cards appear in the tour detail view using three settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `showStopImage` | `true` | Show stop image in cards; accepts `true`, `false`, or `"thumbnail"` |
| `showStopDuration` | `true` | Show duration badge/text |
| `showStopNumber` | `true` | Show number indicator (1, 2, 3...) |

**Layout Behavior:**

When `showStopImage` is `true`, stops display as **cards** with images:
- Duration badge appears on the image (top-right)
- Number circle appears below the image (left of title)

When `showStopImage` is `"thumbnail"`, stops display as **compact list items** with a small thumbnail on the right.

When `showStopImage` is `false`, stops display as **list items** with no image:
- Compact rows with dividers between items
- Duration appears right-aligned
- Number circle appears left of title

**Example Combinations:**

| Image | Duration | Number | Result |
|-------|----------|--------|--------|
| `true` | `true` | `true` | Full card (default) |
| `true` | `true` | `false` | Card without number circle |
| `true` | `false` | `true` | Card without duration badge |
| `"thumbnail"` | `true` | `true` | Compact row with thumbnail |
| `false` | `true` | `true` | List: `[1] Title ......... 5:30` |
| `false` | `true` | `false` | List: `Title ......... 5:30` |
| `false` | `false` | `true` | List: `[1] Title` |
| `false` | `false` | `false` | List: `Title` (minimal) |

**Configuration Example:**

```json
{
  "id": "museum-tour",
  "showStopImage": false,
  "showStopDuration": true,
  "showStopNumber": true
}
```

This creates a compact list view, ideal for tours with many stops or when images aren't available.

### Language Files - Translatable Content

Each language file contains the translated content and can override metadata properties.

**Template (e.g., `en.json`):**

```json
{
  "id": "your-tour-id",
  "language": "en",
  "title": "Your Tour Title",
  "description": "Brief description of your tour (1-2 sentences)",
  "totalDuration": "45 mins",
  "totalStops": 5,
  "stops": [
    {
      "id": "1",
      "type": "audio",
      "title": "First Stop Name",
      "duration": "5 min audio",
      "image": "https://images.unsplash.com/photo-xxxxx",
      "audioFile": "https://your-storage.com/audio/stop-01.mp3"
    }
  ]
}
```

**Language File Fields:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✓ | Must match metadata.json id | `"paris-01"` |
| `language` | string | ✓ | Language code | `"en"`, `"cs"`, `"de"` |
| `title` | string | ✓ | Display title (translated) | `"Historic Paris"` |
| `description` | string | ✓ | Brief tour description | `"Discover iconic landmarks"` |
| `totalDuration` | string | ✓ | Total tour length | `"45 mins"` |
| `totalStops` | number | ✓ | Number of stops in tour | `5` |
| `stops` | array | ✓ | Array of stop objects | See below |

**Overriding Metadata:** Any property from metadata.json can be overridden in a language file:

```json
{
  "id": "barcelona",
  "language": "cs",
  "title": "Neomezená Barcelona",
  "themeId": "default-dark",  // Override theme for Czech version
  ...
}
```

**Stop Object Fields:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✓ | Unique stop ID (within tour) | `"1"`, `"2"`, `"3"` |
| `type` | string | ✓ | Stop type | `"audio"`, `"text"`, `"video"` |
| `title` | string | ✓ | Stop name | `"Eiffel Tower"` |
| `duration` | string | ✓ | Audio length | `"5 min audio"` |
| `image` | string | ✓ | Stop image URL | Full HTTPS URL |
| `audioFile` | string | | Audio file URL (for audio stops) | Full HTTPS URL |
| `transcription` | string | | Text transcription of audio | Long text |

### Step 2: Test Your New Tour

**Test Checklist:**
- [ ] Start dev server: `bun run dev`
- [ ] Open browser to `http://localhost:3000`
- [ ] Check for console errors (F12 → Console)
- [ ] Verify tour title appears
- [ ] Click "Start Tour" - stops should load
- [ ] Check that all images load
- [ ] Test navigation between stops
- [ ] Test language switching (if multiple languages)

## Complete Example: Adding "London Tour"

### 1. Create tour files in both locations

Create identical files in `/src/data/tour/` and `/src/data/tour/`:

**metadata.json:**

```json
{
  "id": "london-01",
  "offlineMode": "optional",
  "themeId": "default-light",
  "transcriptAvailable": true,
  "collectFeedback": true,
  "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop"
}
```

### 2. Create language file (e.g., `en.json`) in both locations:

```json
{
  "id": "london-01",
  "language": "en",
  "title": "London Highlights",
  "description": "Discover the most iconic landmarks of London",
  "totalDuration": "45 mins",
  "totalStops": 2,
  "stops": [
    {
      "id": "1",
      "type": "audio",
      "title": "Big Ben",
      "duration": "8 min audio",
      "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop",
      "audioFile": "https://your-storage.com/audio/london-01-bigben.mp3"
    },
    {
      "id": "2",
      "type": "audio",
      "title": "Tower Bridge",
      "duration": "6 min audio",
      "image": "https://images.unsplash.com/photo-1461949814715-0e9ad3b9e75a?w=800&auto=format&fit=crop",
      "audioFile": "https://your-storage.com/audio/london-02-tower.mp3"
    }
  ]
}
```

### 3. Test

```bash
bun run dev
# Open http://localhost:3000
```

Tours are auto-discovered - no manifest or config changes needed.

## Finding Images

### Recommended Sources

**Free Image Sources:**
- [Unsplash](https://unsplash.com) - High-quality photos
- [Pexels](https://pexels.com) - Free stock photos
- [Pixabay](https://pixabay.com) - Free images and videos

**Using Unsplash:**
1. Search for your location: `https://unsplash.com/s/photos/eiffel-tower`
2. Select a photo
3. Click "Share" → "Copy Link"
4. Use the format: `https://images.unsplash.com/photo-{id}?w=800&auto=format&fit=crop`

**Image Size Guidelines:**
- Tour cover: `w=1000` (or larger)
- Stop images: `w=800`
- Thumbnails: `w=400`

**Example URL with parameters:**
```
https://images.unsplash.com/photo-1502602898657-3e91760cbb34
  ?w=800           # Width
  &auto=format     # Auto format (WebP when supported)
  &fit=crop        # Crop to fit
  &q=80            # Quality (optional, 1-100)
```

## Validation Checklist

Before deploying your tour:

### JSON Validation
- [ ] Valid JSON syntax (use [JSONLint](https://jsonlint.com))
- [ ] All required fields present
- [ ] IDs are unique
- [ ] No trailing commas
- [ ] Quotes properly escaped

### Content Review
- [ ] Tour title is clear and descriptive
- [ ] Description is engaging (1-2 sentences)
- [ ] Stop titles are concise
- [ ] Durations are realistic
- [ ] Total duration matches sum of stops

### Images
- [ ] All image URLs are HTTPS
- [ ] Images load successfully
- [ ] Images are high quality
- [ ] Consistent aspect ratios
- [ ] Proper file sizes (not too large)

### Testing
- [ ] Tour loads without errors
- [ ] All stops display correctly
- [ ] Navigation works (next/previous)
- [ ] Images don't break layout
- [ ] Mobile view looks good
- [ ] Desktop view looks good

## Troubleshooting

### Tour Doesn't Load

**Problem:** Nothing appears after setting tour ID

**Solutions:**
1. Check browser console (F12) for errors
2. Verify tour ID matches exactly (case-sensitive)
3. Ensure JSON syntax is valid
4. Check that filename in manifest matches your file

### Images Don't Display

**Problem:** Gray boxes instead of images

**Solutions:**
1. Verify URLs are HTTPS (not HTTP)
2. Test URLs in browser directly
3. Check for CORS issues
4. Try different image host
5. Use Unsplash with proper parameters

### JSON Syntax Error

**Problem:** `SyntaxError: Unexpected token` in console

**Solutions:**
1. Validate JSON at [JSONLint](https://jsonlint.com)
2. Check for missing commas
3. Check for trailing commas (not allowed in JSON)
4. Ensure strings use double quotes (`"` not `'`)
5. Verify all brackets are closed

### Wrong Tour Loads

**Problem:** Different tour appears than expected

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify `DEFAULT_TOUR_ID` in `App.tsx`
3. Check for typos in tour ID
4. Restart development server

## Advanced Usage

### Offline Modes

AudioGuideKit supports three offline modes that control how users interact with tour downloads:

| Mode | Description | Use Case |
|------|-------------|----------|
| `optional` | User can choose to download. Default behavior. | Most tours - let users decide based on their connectivity |
| `online-only` | No download option shown. Requires internet. | Tours with frequently updated content, streaming-only audio |
| `offline-only` | Download required before playback starts. | Premium tours, guaranteed offline experience |

**Configuration:**

```json
{
  "id": "barcelona",
  "title": "Barcelona Tour",
  "offlineMode": "optional"
}
```

**Behavior Details:**

- **`optional`** (default): Shows "Download for Offline" button below the main action. When downloaded, shows "Available offline" status. User can start tour without downloading.

- **`online-only`**: Hides all download UI. No download button, no offline status. Tour plays directly from the network.

- **`offline-only`**: Main button shows "Download Tour" until downloaded. Shows info box explaining download is required. After download completes, button changes to "Start Tour".

**Note:** If `offlineMode` is not specified, tours default to `optional` for backward compatibility.

### Multiple Languages

AudioGuideKit has a built-in multi-language system. Tours are automatically loaded based on the user's selected language.

**Quick Overview:**
- Create `metadata.json` with shared properties
- Create one file per language: `en.json`, `cs.json`, `de.json`
- Add `"language": "en"` field to each tour file
- Use the same tour `id` across all languages
- Users can switch languages seamlessly with progress preserved

**Example:**
```
/src/data/tour/
├── metadata.json   # Shared: id, theme, offlineMode, etc.
├── en.json         # English version
├── cs.json         # Czech version
└── de.json         # German version
```

Each language file shares the same `id` (matching metadata.json) but has different `language` values:

```json
// metadata.json - shared properties
{
  "id": "barcelona",
  "themeId": "default-dark",
  "collectFeedback": true,
  "image": "https://..."
}

// en.json - English content
{
  "id": "barcelona",
  "language": "en",
  "title": "Unlimited Barcelona",
  ...
}

// cs.json - Czech content (with theme override)
{
  "id": "barcelona",
  "language": "cs",
  "title": "Neomezená Barcelona",
  "themeId": "default-dark",  // Overrides metadata
  ...
}
```

For complete language system documentation, see **[languages.md](./languages.md)**.

### Dynamic Tour Loading

Create a tour selector component:

```typescript
import { useAllTours } from './hooks/useDataLoader';

function TourSelector({ onSelectTour }) {
  const { data: tours, loading } = useAllTours();

  if (loading) return <div>Loading tours...</div>;

  return (
    <div>
      {tours.map(tour => (
        <button key={tour.id} onClick={() => onSelectTour(tour.id)}>
          {tour.title}
        </button>
      ))}
    </div>
  );
}
```

### Programmatic Tour Creation

Create tours from a database or API:

```typescript
import { dataService } from './services/dataService';

async function createTourFromAPI(apiData) {
  // Transform API data to tour format
  const tour = {
    id: apiData.slug,
    title: apiData.name,
    description: apiData.summary,
    totalDuration: apiData.duration,
    totalStops: apiData.points.length,
    image: apiData.coverImage,
    stops: apiData.points.map((point, index) => ({
      id: String(index + 1),
      title: point.title,
      duration: point.audioDuration,
      isCompleted: false,
      image: point.imageUrl
    }))
  };

  // Save to JSON file (backend required)
  return tour;
}
```

## Best Practices

1. **Consistent Naming**
   - Use lowercase-with-hyphens for IDs
   - Use descriptive filenames
   - Match IDs across manifest and tour files

2. **Image Optimization**
   - Use CDN-hosted images (Unsplash, Cloudinary)
   - Specify appropriate sizes with URL parameters
   - Use WebP format when possible
   - Lazy load images for performance

3. **Content Quality**
   - Write engaging descriptions
   - Use high-quality images
   - Ensure accurate information
   - Proofread all text

4. **Testing**
   - Test on mobile devices
   - Check different screen sizes
   - Verify all interactions work
   - Test with slow internet

5. **Version Control**
   - Commit JSON files separately from code
   - Use meaningful commit messages
   - Keep backup of working tours

## Getting Help

- **Data Structure:** See `/public/data/README.md`
- **Main Documentation:** See `README.md`
- **TypeScript Types:** See `types.ts`

---

**Need more help?** Check the documentation files or review the example tour (`tour.json`).