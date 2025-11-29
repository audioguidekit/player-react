# How to Add New Tours - Step by Step Guide

This guide walks you through adding a new tour to AudioTour Pro.

## Quick Start

Adding a new tour takes just 3 steps:
1. Create a tour JSON file
2. Add entry to the tour manifest
3. Test your new tour

## Detailed Instructions

### Step 1: Create Your Tour JSON File

Create a new file in `/public/data/tours/` with your tour data.

**Filename Convention:** Use lowercase with hyphens (e.g., `paris-tour.json`, `london-walking.json`)

**Template:**

```json
{
  "id": "your-tour-id",
  "title": "Your Tour Title",
  "description": "Brief description of your tour (1-2 sentences)",
  "totalDuration": "45 mins",
  "totalStops": 5,
  "image": "https://images.unsplash.com/photo-xxxxx",
  "stops": [
    {
      "id": "1",
      "title": "First Stop Name",
      "duration": "5 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-xxxxx"
    },
    {
      "id": "2",
      "title": "Second Stop Name",
      "duration": "8 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-xxxxx"
    }
  ]
}
```

**Field Guidelines:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✓ | Unique identifier (lowercase-with-hyphens) | `"paris-01"` |
| `title` | string | ✓ | Display title | `"Historic Paris"` |
| `description` | string | ✓ | Brief tour description | `"Discover iconic landmarks"` |
| `totalDuration` | string | ✓ | Total tour length | `"45 mins"` or `"1.5 hours"` |
| `totalStops` | number | ✓ | Number of stops in tour | `5` |
| `image` | string | ✓ | Main tour cover image URL | Full HTTPS URL |
| `stops` | array | ✓ | Array of stop objects | See below |

**Stop Object Fields:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✓ | Unique stop ID (within tour) | `"1"`, `"2"`, `"3"` |
| `title` | string | ✓ | Stop name | `"Eiffel Tower"` |
| `duration` | string | ✓ | Audio length | `"5 min audio"` |
| `isCompleted` | boolean | ✓ | Initial completion status | `false` |
| `image` | string | ✓ | Stop image URL | Full HTTPS URL |

### Step 2: Update the Tour Manifest

Edit `/public/data/tours/index.json` to add your tour to the list.

**Before:**
```json
{
  "tours": [
    {
      "id": "rome-01",
      "filename": "ancient-rome.json",
      "title": "Ancient Rome",
      "description": "Explore rich history of the one of the greatest Europe's nations",
      "thumbnail": "https://images.unsplash.com/photo-rome.jpg"
    }
  ]
}
```

**After (add your tour):**
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
      "id": "your-tour-id",
      "filename": "your-tour.json",
      "title": "Your Tour Title",
      "description": "Brief description for the tour list",
      "thumbnail": "https://images.unsplash.com/photo-thumb.jpg"
    }
  ]
}
```

**Manifest Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Must match the `id` in your tour JSON file |
| `filename` | string | Your tour JSON filename |
| `title` | string | Display title (can differ from tour file) |
| `description` | string | Short description for lists |
| `thumbnail` | string | Smaller preview image URL |

### Step 3: Test Your New Tour

**Option A: Set as Default Tour**

Edit `App.tsx` and change the `DEFAULT_TOUR_ID`:

```typescript
// Change this line:
const DEFAULT_TOUR_ID = 'rome-01';

// To your tour ID:
const DEFAULT_TOUR_ID = 'your-tour-id';
```

**Option B: Load Programmatically**

```typescript
import { useTourData } from './hooks/useDataLoader';

function TourSelector() {
  const { data: tour } = useTourData('your-tour-id');
  // Your component code
}
```

**Test Checklist:**
- [ ] Start dev server: `npm run dev`
- [ ] Open browser to `http://localhost:3000`
- [ ] Check for console errors (F12 → Console)
- [ ] Verify tour title appears
- [ ] Click "Start Tour" - stops should load
- [ ] Check that all images load
- [ ] Test navigation between stops

## Complete Example: Adding "Paris Tour"

### 1. Create `/public/data/tours/paris-highlights.json`

```json
{
  "id": "paris-01",
  "title": "Paris Highlights",
  "description": "Discover the most iconic landmarks of the City of Light",
  "totalDuration": "52 mins",
  "totalStops": 6,
  "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop",
  "stops": [
    {
      "id": "1",
      "title": "Eiffel Tower",
      "duration": "8 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop"
    },
    {
      "id": "2",
      "title": "Arc de Triomphe",
      "duration": "6 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-1560624619-3c2b74ab6d4b?w=800&auto=format&fit=crop"
    },
    {
      "id": "3",
      "title": "Notre-Dame Cathedral",
      "duration": "10 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop"
    },
    {
      "id": "4",
      "title": "Louvre Museum",
      "duration": "12 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop"
    },
    {
      "id": "5",
      "title": "Sacré-Cœur",
      "duration": "7 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-1548082284-8ecee23183f3?w=800&auto=format&fit=crop"
    },
    {
      "id": "6",
      "title": "Champs-Élysées",
      "duration": "9 min audio",
      "isCompleted": false,
      "image": "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800&auto=format&fit=crop"
    }
  ]
}
```

### 2. Update `/public/data/tours/index.json`

```json
{
  "tours": [
    {
      "id": "rome-01",
      "filename": "ancient-rome.json",
      "title": "Ancient Rome",
      "description": "Explore rich history of the one of the greatest Europe's nations",
      "thumbnail": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&auto=format&fit=crop"
    },
    {
      "id": "paris-01",
      "filename": "paris-highlights.json",
      "title": "Paris Highlights",
      "description": "Discover the most iconic landmarks of the City of Light",
      "thumbnail": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop"
    }
  ]
}
```

### 3. Update `App.tsx`

```typescript
const DEFAULT_TOUR_ID = 'paris-01';  // Changed from 'rome-01'
```

### 4. Test

```bash
npm run dev
# Open http://localhost:3000
```

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

### Multiple Languages

To support multiple languages, create separate tour files:

```
/public/data/tours/
├── paris-highlights-en.json
├── paris-highlights-fr.json
└── paris-highlights-de.json
```

Update your code to load based on language:

```typescript
const languageCode = 'en'; // Get from user selection
const tourId = `paris-01-${languageCode}`;
const { data: tour } = useTourData(tourId);
```

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
- **Code Integration:** See `MIGRATION_GUIDE.md`
- **Main Documentation:** See `README.md`
- **TypeScript Types:** See `types.ts`

---

**Need more help?** Check the documentation files or review the example tour (`ancient-rome.json`).
