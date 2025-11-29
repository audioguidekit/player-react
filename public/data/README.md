# Tour Data Structure

This directory contains all the dynamically loadable tour data in JSON format.

## Directory Structure

```
/public/data/
├── README.md           # This file
├── languages.json      # Supported languages
└── tours/
    ├── index.json      # Tour manifest (lists all available tours)
    └── *.json          # Individual tour data files
```

## File Formats

### Tour Manifest (`tours/index.json`)

The manifest file lists all available tours:

```json
{
  "tours": [
    {
      "id": "unique-tour-id",
      "filename": "tour-file.json",
      "title": "Tour Title",
      "description": "Brief description",
      "thumbnail": "https://example.com/image.jpg"
    }
  ]
}
```

**Fields:**
- `id` (string, required): Unique identifier for the tour
- `filename` (string, required): JSON filename in the tours/ directory
- `title` (string, required): Display title for the tour
- `description` (string, required): Short description
- `thumbnail` (string, required): URL to thumbnail image

### Tour Data (`tours/*.json`)

Each tour file contains complete tour information:

```json
{
  "id": "unique-tour-id",
  "title": "Tour Title",
  "description": "Detailed tour description",
  "totalDuration": "53 mins",
  "totalStops": 20,
  "image": "https://example.com/cover-image.jpg",
  "stops": [
    {
      "id": "1",
      "title": "Stop Title",
      "duration": "5 min audio",
      "isCompleted": false,
      "image": "https://example.com/stop-image.jpg"
    }
  ]
}
```

**Tour Fields:**
- `id` (string, required): Must match the ID in the manifest
- `title` (string, required): Tour title
- `description` (string, required): Full description
- `totalDuration` (string, required): Total tour duration (e.g., "53 mins")
- `totalStops` (number, required): Total number of stops
- `image` (string, required): URL to main tour image
- `stops` (array, required): Array of stop objects

**Stop Fields:**
- `id` (string, required): Unique identifier within the tour
- `title` (string, required): Stop title
- `duration` (string, required): Audio duration (e.g., "5 min audio")
- `isCompleted` (boolean, required): Whether user has completed this stop
- `isPlaying` (boolean, optional): Whether stop is currently playing
- `image` (string, required): URL to stop image

### Languages (`languages.json`)

List of supported languages:

```json
[
  {
    "code": "en",
    "name": "English",
    "flag": "🇬🇧"
  }
]
```

**Language Fields:**
- `code` (string, required): ISO language code (e.g., "en", "cs", "de")
- `name` (string, required): Display name in native language
- `flag` (string, required): Flag emoji

## Adding a New Tour

1. **Create tour JSON file** in `tours/` directory (e.g., `paris-tour.json`)
2. **Add entry to manifest** in `tours/index.json`
3. **Validate JSON** structure matches the schema above
4. **Test loading** by setting `DEFAULT_TOUR_ID` in `App.tsx`

### Example: Adding a Paris Tour

**Step 1:** Create `tours/paris-tour.json`:
```json
{
  "id": "paris-01",
  "title": "Historic Paris",
  "description": "Discover the iconic landmarks of Paris",
  "totalDuration": "45 mins",
  "totalStops": 5,
  "image": "https://images.unsplash.com/photo-paris.jpg",
  "stops": [
    {
      "id": "1",
      "title": "Eiffel Tower",
      "duration": "8 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-eiffel.jpg"
    }
  ]
}
```

**Step 2:** Update `tours/index.json`:
```json
{
  "tours": [
    {
      "id": "rome-01",
      "filename": "ancient-rome.json",
      "title": "Ancient Rome",
      "description": "Explore rich history of the one of the greatest Europe's nations",
      "thumbnail": "https://images.unsplash.com/photo-rome.jpg"
    },
    {
      "id": "paris-01",
      "filename": "paris-tour.json",
      "title": "Historic Paris",
      "description": "Discover the iconic landmarks of Paris",
      "thumbnail": "https://images.unsplash.com/photo-paris.jpg"
    }
  ]
}
```

## Loading Tours Programmatically

### Using the Data Service

```typescript
import { dataService } from '@/services/dataService';

// Load specific tour by ID
const tour = await dataService.getTourById('rome-01');

// Load all languages
const languages = await dataService.getLanguages();

// Load tour manifest
const manifest = await dataService.getManifest();

// Clear cache to force reload
dataService.clearCache();
```

### Using React Hooks

```typescript
import { useTourData, useLanguages } from '@/hooks/useDataLoader';

function MyComponent() {
  const { data: tour, loading, error } = useTourData('rome-01');
  const { data: languages } = useLanguages();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{tour.title}</div>;
}
```

## Image Guidelines

- **Tour cover images**: Recommended size 1000x1000px or larger
- **Stop images**: Recommended size 800x600px or larger
- **Thumbnails**: Recommended size 400x300px
- Format: JPEG or WebP for photos, PNG for graphics
- Use CDN URLs (e.g., Unsplash, Cloudinary) for best performance

## Best Practices

1. **Consistent IDs**: Use lowercase kebab-case (e.g., `rome-01`, `paris-tour`)
2. **Image URLs**: Use HTTPS and CDN-hosted images
3. **Durations**: Use consistent format (e.g., "5 min audio", "53 mins")
4. **Descriptions**: Keep concise and engaging
5. **Testing**: Always test loading in the app after changes
6. **Validation**: Ensure JSON is valid (use a JSON validator)

## Troubleshooting

### Tour not loading
- Check that tour ID in App.tsx matches the manifest
- Verify JSON syntax is valid
- Check browser console for errors
- Ensure image URLs are accessible

### Images not displaying
- Verify URLs are valid and accessible
- Check for CORS issues with external image hosts
- Ensure URLs use HTTPS

### Cache issues
- Clear browser cache
- Use `dataService.clearCache()` in code
- Restart development server

## Future Enhancements

Planned features for the data structure:
- Multi-language content support (different text per language)
- Audio file URLs for actual playback
- GPS coordinates for location-based features
- Offline caching strategy
- User progress persistence
- Dynamic theme configuration
