# Stop reference

Each stop in a tour's `stops` array must have `id` and `type`. All other fields depend on the type.

## Common fields (all stop types)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Unique within the tour; must match across all language files |
| `type` | StopType | ✓ | Determines which component renders the stop |
| `location` | `{ lat, lng }` | | GPS coordinates — shows the stop as a map marker |
| `mapMarkerIcon` | string (URL) | | Per-stop custom marker image; overrides the tour-level `mapMarkerIcon` |

---

## `audio`

The primary content type. Plays audio alongside a full-bleed image card. Appears in the stop list and on the map (if `location` is set).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✓ | Stop name shown in the list and card |
| `duration` | string | ✓ | Display string, e.g. `"5 min audio"` |
| `image` | string | ✓ | Cover image URL |
| `audioFile` | string | ✓ | Audio URL (MP3, M4A, etc.) |
| `imageAlt` | string | | Accessibility alt text |
| `imageCaption` | string | | Caption shown below the image |
| `imageCredit` | string | | Photo credit line |
| `transcription` | string | | Full text transcript; shown when transcription is toggled on |
| `content` | string | | Additional rich text shown below the audio player |

```json
{
  "id": "1",
  "type": "audio",
  "title": "Plaça Catalunya",
  "duration": "4 min audio",
  "image": "https://example.com/images/plaza.jpg",
  "audioFile": "https://example.com/audio/stop-01.mp3",
  "imageCaption": "Looking north towards the fountain",
  "transcription": "Welcome to Plaça Catalunya...",
  "location": { "lat": 41.3874, "lng": 2.1686 }
}
```

---

## `text`

Rich text content — no audio, no image. Good for introductions, summaries, or text-heavy sections.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | | Section heading |
| `content` | string | | Rich text body (supports markdown/HTML) |

```json
{
  "id": "2",
  "type": "text",
  "title": "About this neighbourhood",
  "content": "The Eixample district was built in the late 19th century..."
}
```

---

## `image-text`

Image with accompanying rich text below it. Good for illustrated explanations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | ✓ | Image URL |
| `title` | string | | Section heading |
| `imageAlt` | string | | Accessibility alt text |
| `imageCaption` | string | | Caption below the image |
| `imageCredit` | string | | Photo credit line |
| `content` | string | | Rich text body below the image |

```json
{
  "id": "3",
  "type": "image-text",
  "image": "https://example.com/images/facade.jpg",
  "title": "The façade",
  "imageCaption": "Original 1883 stonework",
  "content": "The building's ornamental facade..."
}
```

---

## `headline`

A visual section divider — large text, no interaction. Use to break a long stop list into named sections.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | ✓ | Headline text |

```json
{
  "id": "4",
  "type": "headline",
  "text": "Part Two: The Gothic Quarter"
}
```

---

## `quote`

A styled pull quote with attribution. Good for historical quotes or testimonials.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quote` | string | ✓ | The quote text |
| `author` | string | ✓ | Attribution name |
| `year` | string | | Year or date string |

```json
{
  "id": "5",
  "type": "quote",
  "quote": "Architecture is the learned game of forms in light.",
  "author": "Le Corbusier",
  "year": "1923"
}
```

---

## `video`

An inline video player.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `videoUrl` | string | ✓ | Direct video file URL (MP4, etc.) |
| `caption` | string | | Caption below the player |

```json
{
  "id": "6",
  "type": "video",
  "videoUrl": "https://example.com/videos/timelapse.mp4",
  "caption": "48-hour construction timelapse"
}
```

---

## `embed`

An iframe embed — YouTube, Spotify, or any generic URL. The player sizes the iframe to fit.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `embedUrl` | string | ✓ | The embed/iframe URL |
| `embedType` | `"youtube"` \| `"spotify"` \| `"video"` \| `"generic"` | | Controls aspect ratio defaults |
| `aspectRatio` | string | | Override aspect ratio, e.g. `"16/9"` |
| `caption` | string | | Caption below the embed |

```json
{
  "id": "7",
  "type": "embed",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "embedType": "youtube",
  "caption": "Original documentary footage"
}
```

---

## `image-gallery`

A swipeable horizontal image gallery.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | `GalleryImage[]` | ✓ | Array of image objects (see below) |
| `caption` | string | | Caption below the gallery |

**`GalleryImage` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✓ | Image URL |
| `alt` | string | | Accessibility alt text |
| `caption` | string | | Per-image caption |
| `credit` | string | | Per-image photo credit |

```json
{
  "id": "8",
  "type": "image-gallery",
  "images": [
    { "url": "https://example.com/img/a.jpg", "caption": "View from the east" },
    { "url": "https://example.com/img/b.jpg", "caption": "Interior courtyard" }
  ]
}
```

---

## `image-comparison`

A before/after drag slider comparing two images.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `before` | string | ✓ | "Before" image URL |
| `after` | string | ✓ | "After" image URL |
| `beforeLabel` | string | | Label on the before side (default: `"Before"`) |
| `afterLabel` | string | | Label on the after side (default: `"After"`) |
| `caption` | string | | Caption below the slider |

```json
{
  "id": "9",
  "type": "image-comparison",
  "before": "https://example.com/img/1960.jpg",
  "after": "https://example.com/img/2024.jpg",
  "beforeLabel": "1960",
  "afterLabel": "Today"
}
```

---

## `hotspot-image`

An image with tappable annotation pins that reveal titles and descriptions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | ✓ | Image URL |
| `hotspots` | `Hotspot[]` | ✓ | Array of pin objects (see below) |
| `imageAlt` | string | | Accessibility alt text |
| `caption` | string | | Caption below the image |

**`Hotspot` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | number | ✓ | Horizontal position as a percentage (0–100) |
| `y` | number | ✓ | Vertical position as a percentage (0–100) |
| `title` | string | ✓ | Pin label |
| `description` | string | | Expanded description shown on tap |

```json
{
  "id": "10",
  "type": "hotspot-image",
  "image": "https://example.com/img/cathedral.jpg",
  "hotspots": [
    { "x": 42, "y": 18, "title": "Rose window", "description": "Installed in 1386." },
    { "x": 65, "y": 70, "title": "Main entrance" }
  ]
}
```

---

## `rating`

A star rating prompt. Typically placed at the end of a tour. Controlled by `collectFeedback` in `metadata.json`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | | Rating prompt text |
| `description` | string | | Subtext below the prompt |

```json
{
  "id": "11",
  "type": "rating",
  "question": "How was your experience?",
  "description": "Your feedback helps us improve."
}
```

---

## `email`

An email capture form. Typically placed at the end of a tour alongside or instead of `rating`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | | Form heading |
| `description` | string | | Text above the input |
| `placeholder` | string | | Input placeholder text |
| `buttonText` | string | | Submit button label |

```json
{
  "id": "12",
  "type": "email",
  "title": "Stay in touch",
  "description": "Get notified about new tours.",
  "placeholder": "your@email.com",
  "buttonText": "Subscribe"
}
```

---

## `3d-object`

An interactive 3D model viewer.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `modelUrl` | string | ✓ | URL to the 3D model file (GLB/GLTF) |
| `caption` | string | | Caption below the viewer |

```json
{
  "id": "13",
  "type": "3d-object",
  "modelUrl": "https://example.com/models/artifact.glb",
  "caption": "Roman amphora, 2nd century CE"
}
```
