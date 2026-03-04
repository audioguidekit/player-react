# Map View

An optional interactive map tab on the tour detail screen. When enabled, stops are shown as markers on a tile map. The user can switch between map and list views via a segmented control in the header.

> **Status:** Temporary doc — merge into `adding-tours.md` and `themes.md` when stable.

---

## Enabling the map

In `metadata.json`, set `mapView: true`. The tour will open in map view by default.

```json
{
  "mapView": true,
  "mapProvider": "openstreetmap"
}
```

Without `mapView: true` the map tab is hidden and everything works as before.

---

## metadata.json fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mapView` | boolean | `false` | Show map tab in tour detail |
| `mapProvider` | `"openstreetmap"` \| `"mapbox"` \| `"jawg"` \| `"maptiler"` | `"openstreetmap"` | Tile provider |
| `mapApiKey` | string | — | API key for the chosen provider |
| `mapStyleId` | string | — | Provider-specific style/map ID (see per-provider defaults below) |
| `mapMarkerIcon` | string (URL) | — | Custom image for all markers; replaces numbered circle |
| `mapMarkerNumber` | boolean | `true` | Show stop number on markers |
| `mapCluster` | object | — | Marker clustering behaviour (see below) |

### mapCluster

Behavioural clustering options. Visual sizing belongs in the theme (see `mapMarkers.cluster`).

```json
"mapCluster": {
  "disableClusteringAtZoom": 16,
  "spiderfyOnMaxZoom": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `disableClusteringAtZoom` | number | — | Zoom level at which clustering stops (e.g. `16`) |
| `spiderfyOnMaxZoom` | boolean | `true` | Fan out overlapping markers at max zoom |

---

## Adding GPS coordinates to stops

Only `audio` stops are shown on the map. Add a `location` field to any audio stop in a language file:

```json
{
  "id": "1",
  "type": "audio",
  "title": "Plaça Catalunya",
  "location": { "lat": 41.3851, "lng": 2.1734 }
}
```

Stops without `location` are silently skipped — no marker is rendered.

---

## Custom marker icons

### Tour-level (all stops)

Set `mapMarkerIcon` in `metadata.json` to a URL. All stops use this image instead of the numbered circle.

```json
"mapMarkerIcon": "https://example.com/marker.png"
```

### Stop-level (individual stop)

Add `mapMarkerIcon` directly to a stop in a language file. Overrides the tour-level icon for that stop only. Useful for unique images per stop.

```json
{
  "id": "3",
  "type": "audio",
  "mapMarkerIcon": "https://example.com/stop3-icon.png"
}
```

**Priority:** stop-level > tour-level > default numbered circle. Clusters are always unaffected.

The image is rendered at 32 × 32 px (`object-fit: contain`) inside a 44 × 44 px tap target.

---

## Hiding stop numbers

Set `mapMarkerNumber: false` in `metadata.json` to render plain dots instead of numbered markers. Completed stops still show the checkmark.

```json
"mapMarkerNumber": false
```

---

## Tile providers

All providers except OpenStreetMap require an API key via `mapApiKey`. If the key is missing the player silently falls back to OpenStreetMap.

### OpenStreetMap (default)

No key needed. Free for typical usage.

```json
"mapProvider": "openstreetmap"
```

### Mapbox

Requires an access token from [mapbox.com](https://www.mapbox.com/). Default style: `mapbox/outdoors-v12`.

```json
"mapProvider": "mapbox",
"mapApiKey": "pk.eyJ1IjoiZXhhb..."
```

To use a custom style from your Mapbox Studio account:

```json
"mapProvider": "mapbox",
"mapApiKey": "pk.eyJ1IjoiZXhhb...",
"mapStyleId": "yourname/cl9abc1234def"
```

### Jawg Maps

Requires an access token from [jawg.io](https://www.jawg.io/). Default style: `jawg-terrain`.

Available built-in styles: `jawg-streets`, `jawg-terrain`, `jawg-sunny`, `jawg-lagoon`, `jawg-dark`, `jawg-light`.

```json
"mapProvider": "jawg",
"mapApiKey": "your-jawg-access-token",
"mapStyleId": "jawg-lagoon"
```

### MapTiler

Requires an API key from [maptiler.com](https://www.maptiler.com/). Default style: `outdoor-v2`.

```json
"mapProvider": "maptiler",
"mapApiKey": "your-maptiler-api-key",
"mapStyleId": "topo-v2"
```

---

## Theming markers

Map markers have their own theme tokens, independent from the list's `stepIndicators`. Add a `mapMarkers` block to your `ThemeConfig`:

```typescript
mapMarkers: {
  active: {
    outlineColor: '#459825',
    numberColor: '#FFFFFF',
    backgroundColor: '#459825',
    shadow: '0 2px 8px rgba(0,0,0,0.35)',
  },
  inactive: {
    borderColor: 'transparent',
    numberColor: '#FFFFFF',
    backgroundColor: '#555555',
    numberFontSize: '12px',
    numberFontWeight: '700',
  },
  completed: {
    backgroundColor: '#459825',
    checkmarkColor: '#FFFFFF',
  },
  cluster: {
    backgroundColor: '#1A1A1A',
    numberColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.2)',
    shadow: '0 3px 10px rgba(0,0,0,0.35)',
    fontSize: '18px',
    fontWeight: '700',
    size: 64,             // visual diameter in px
    maxClusterRadius: 48, // clustering threshold in px
  },
},
```

If `mapMarkers` is absent the player falls back to `stepIndicators` (backward compatible).

| Token | Description |
|-------|-------------|
| `active.outlineColor` | Ring around the active marker |
| `active.backgroundColor` | Fill of the active marker |
| `active.numberColor` | Number text on the active marker |
| `active.shadow` | Drop shadow (also used for completed) |
| `inactive.backgroundColor` | Fill of unvisited markers |
| `inactive.borderColor` | Border of unvisited markers (`"transparent"` = none) |
| `inactive.numberColor` | Number text on unvisited markers |
| `inactive.numberFontSize` | Font size for marker numbers |
| `inactive.numberFontWeight` | Font weight for marker numbers |
| `completed.backgroundColor` | Fill when stop is finished |
| `completed.checkmarkColor` | Checkmark stroke colour |
| `cluster.backgroundColor` | Cluster bubble fill |
| `cluster.numberColor` | Count number colour |
| `cluster.borderColor` | Optional border |
| `cluster.shadow` | Drop shadow |
| `cluster.fontSize` | Count number font size |
| `cluster.fontWeight` | Count number font weight |
| `cluster.size` | Visual diameter in px (default `64`) |
| `cluster.maxClusterRadius` | Pixel radius for grouping markers (default `48`) |

---

## Offline behaviour

Map tiles require an internet connection. When the device is offline the map is replaced with an "unavailable offline" message and a **View list** button. Stop data, GPS coordinates, and audio files remain fully accessible offline.

---

## Architecture notes

| Component | Location | Role |
|-----------|----------|------|
| `TourMapView` | `components/TourMapView.tsx` | Main map component (lazy-loaded) |
| `MapZoomControls` | `components/map/MapZoomControls.tsx` | +/− zoom buttons |
| `MapLocateButton` | `components/map/MapLocateButton.tsx` | User location button |
| `UserLocationLayer` | `components/map/MapLocateButton.tsx` | Pulsing blue dot + drag detection |
| `useUserLocation` | `components/map/MapLocateButton.tsx` | Location state hook |
| `getTileConfig` | `src/utils/mapTileProvider.ts` | Tile URL/attribution resolver |
