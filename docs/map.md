# Map View

An optional interactive map tab on the tour detail screen. When enabled, stops are shown as markers on a tile map. The user can switch between map and list views via a segmented control in the header.


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
| `mapProvider` | `"openstreetmap"` \| `"mapbox"` \| `"jawg"` \| `"maptiler"` \| `"carto"` | `"openstreetmap"` | Tile provider |
| `mapApiKey` | — | — | Set via env var (see Tile providers below), not in this file |
| `mapStyleId` | string | — | Provider-specific style/map ID (see per-provider defaults below) |
| `mapCenter` | `{ lat, lng }` | — | Initial map center; if omitted, the map fits all stops in view |
| `mapZoom` | number (0–23) | — | Initial zoom level; if `mapCenter` is omitted, fitBounds zoom is used |
| `mapMarkerIcon` | string (URL) | — | Custom image for all markers; replaces numbered circle |
| `mapMarkerNumber` | boolean | `true` | Show stop number on markers |
| `mapCluster` | object | — | Marker clustering behaviour (see below) |
| `mapRoute` | `boolean` \| object | `false` | Route polyline with progress indicator (see below) |

### mapCenter and mapZoom

By default the map automatically fits all stops in view. Use `mapCenter` and `mapZoom` to set a fixed starting position:

```json
"mapCenter": { "lat": 41.3851, "lng": 2.1734 },
"mapZoom": 13
```

Both fields are independent — you can set either or both:

| Combination | Behaviour |
|-------------|-----------|
| neither set | fitBounds to show all stops |
| `mapCenter` only | center there at zoom 13 |
| `mapCenter` + `mapZoom` | center there at the given zoom |
| `mapZoom` only | fitBounds to show all stops, then override zoom |

---

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

All providers except OpenStreetMap and CARTO require an API key. Keys are set as environment variables — never put them in `metadata.json`.

Copy `.env` to `.env.local` and fill in your keys:

```bash
VITE_MAPBOX_API_KEY=pk.eyJ1...
VITE_JAWG_API_KEY=your-jawg-token
VITE_MAPTILER_API_KEY=your-maptiler-key
```

`.env.local` is gitignored. The active provider's key is automatically injected at build time — no other configuration needed.

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

### CARTO

No API key required — free public basemaps. Default style: `rastertiles/voyager`.

Available raster styles:

| Style | `mapStyleId` |
|-------|-------------|
| Voyager (default) | `rastertiles/voyager` |
| Positron (light) | `light_all` |
| Dark Matter | `dark_all` |
| Positron no labels | `light_nolabels` |
| Dark Matter no labels | `dark_nolabels` |

```json
"mapProvider": "carto"
```

To use a different style:

```json
"mapProvider": "carto",
"mapStyleId": "dark_all"
```

---

## Theming markers

Marker colors (active, inactive, completed, clusters, user location dot) are controlled via `mapMarkers` in your `ThemeConfig`. See [themes.md](./themes.md#mapmarkers-optional) for the full reference.

---

## Route line and progress indicator

An optional polyline connecting all stops in sequence. The line is split into two visual segments: a solid section for stops already visited, and a dashed section for stops still to come — functioning as a progress indicator along the route.

The line is only shown at street-level zoom (controlled by `minZoom`) and is hidden when zoomed out, keeping the map uncluttered at overview zoom levels.

### Enabling

```json
"mapRoute": true
```

This draws straight lines between stop coordinates using theme default colors.

### With a GeoJSON route file

For accurate walking paths that follow actual streets, provide a GeoJSON `LineString` file:

```json
"mapRoute": {
  "geoJSON": "./route.geojson"
}
```

Place `route.geojson` next to `metadata.json` in the tour folder:

```
src/data/tour/
  my-tour/
    metadata.json
    route.geojson    ← drop it here
    en.json
```

The file is bundled at build time — no runtime fetch occurs. The coordinates in the GeoJSON file follow the standard GeoJSON convention: `[longitude, latitude]` (note: reversed compared to the `{ lat, lng }` objects used elsewhere in the app).

**Format:**
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [2.1734, 41.3851],
        [2.1740, 41.3860]
      ]
    },
    "properties": {}
  }]
}
```

Tools that export GPX tracks (Komoot, Google Maps, Strava, etc.) can convert to GeoJSON via [geojson.io](https://geojson.io) or similar.

### Progress tracking

The line splits at the **last completed stop**. Segment `[stop_n → stop_{n+1}]` turns solid once `stop_{n+1}` is completed — progress advances stop-by-stop, with no fractional display within a walking leg.

All stops with a `location` field contribute to the route (not limited to audio stops). Stops without coordinates are silently skipped; the line connects the remaining stops in sequence.

### Configuration fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `geoJSON` | string | — | Relative path to a GeoJSON file, e.g. `"./route.geojson"` |
| `minZoom` | number | `13` | Line is hidden below this zoom level |

### Theming

All visual styling (colors, line weight, opacity, dash pattern) is controlled via `mapMarkers.route` in your `ThemeConfig`. See [themes.md](./themes.md#mapmarkers-optional) for the full reference.

---

## Offline behaviour

Map tiles require an internet connection. When the device is offline the map is replaced with an "unavailable offline" message and a **View list** button. Stop data, GPS coordinates, and audio files remain fully accessible offline.

---

## Architecture notes

| Component | Location | Role |
|-----------|----------|------|
| `TourMapView` | `components/TourMapView.tsx` | Main map component (lazy-loaded) |
| `MapRoute` | `components/map/MapRoute.tsx` | Route polyline with progress split |
| `MapZoomControls` | `components/map/MapZoomControls.tsx` | +/− zoom buttons |
| `MapLocateButton` | `components/map/MapLocateButton.tsx` | User location button |
| `UserLocationLayer` | `components/map/MapLocateButton.tsx` | Pulsing blue dot + drag detection |
| `useUserLocation` | `components/map/MapLocateButton.tsx` | Location state hook |
| `getTileConfig` | `src/utils/mapTileProvider.ts` | Tile URL/attribution resolver |
| `buildGeoJSONRouteLines` | `src/utils/routeGeometry.ts` | Snap stops to GeoJSON line, slice for progress |
| `buildStraightRouteLines` | `src/utils/routeGeometry.ts` | Straight-line fallback route segments |
