export type StopType = 'audio' | 'text' | 'image-text' | '3d-object' | 'video' | 'headline' | 'rating' | 'email' | 'quote' | 'image-gallery' | 'image-comparison' | 'image-hotspot' | 'embed';

/** GeoJSON FeatureCollection containing a single LineString (the walking route). */
export interface RouteGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      /** Coordinates in [lng, lat] order — GeoJSON standard. */
      coordinates: [number, number][];
    };
    properties: Record<string, unknown>;
  }>;
}

/**
 * Route polyline configuration.
 * In metadata.json, `geoJSON` is a relative path string ("./route.geojson").
 * At runtime (after build-time resolution) it becomes a parsed RouteGeoJSON object.
 *
 * The style fields are optional per-tour overrides of the theme's
 * `mapMarkers.route`. They exist because the basemap is per-tour
 * (`mapProvider` / `mapStyleId`), so a tour on dark tiles can recolor its line
 * without cloning a whole theme. Precedence: mapRoute → theme → built-in default.
 */
export interface MapRouteConfig {
  geoJSON?: string | RouteGeoJSON;  // path in metadata.json → resolved object at runtime
  minZoom?: number;                  // hide line below this zoom level (default: 13)
  completedColor?: string;           // visited segments + progress dot (theme default: '#459825')
  upcomingColor?: string;            // unvisited, dashed segments (theme default: '#888888')
  weight?: number;                   // line width in px (theme default: 3)
  opacity?: number;                  // 0–1 for the completed line; upcoming renders at 75% of it (theme default: 0.85)
  dashArray?: string;                // SVG dash pattern for upcoming segments (theme default: '8 6')
}

/**
 * Per-tour overrides for the map marker background colors. Each field falls back
 * to the theme's `mapMarkers.<state>.backgroundColor`. Number/checkmark colors stay
 * with the theme (white in both shipped themes), so pick backgrounds dark enough
 * for white text — for a deeper restyle give the tour its own `themeId`.
 */
export interface MapMarkerColors {
  upcoming?: string;   // stops not visited yet (theme: mapMarkers.inactive)
  completed?: string;  // stops already played (theme: mapMarkers.completed)
  active?: string;     // the stop currently playing (theme: mapMarkers.active) — also recolors its outline ring, so the pin reads as one solid color
  cluster?: string;    // the bubble shown for a group of stops (theme: mapMarkers.cluster)
}

export interface StopLocation {
  lat: number;
  lng: number;
}

export type OfflineMode = 'online-only' | 'optional' | 'offline-only';

/**
 * Tour metadata - shared properties across all language versions
 * These can be overridden in individual language files
 */
export interface TourMetadata {
  id: string;
  defaultLanguage?: string;
  offlineMode?: OfflineMode;
  transitionAudio?: string;
  themeId?: string;
  transcriptAvailable?: boolean;
  collectFeedback?: boolean;
  hapticsEnabled?: boolean;      // Enable or disable all haptic feedback for this tour (default: true)
  image?: string;
  showLanguageLabel?: boolean; // Show language name next to flag in selector (default: true)
  showStopImage?: boolean | 'thumbnail'; // Show stop image: true=full card, false=list, 'thumbnail'=compact with thumbnail (default: true)
  showStopDuration?: boolean;  // Show duration on cards (default: true)
  showStopNumber?: boolean;    // Show number indicator (default: true)
  fullscreenPlayer?: boolean;  // Show fullscreen player on stop click (default: false)
  showProgressBar?: boolean;   // Show progress bar in tour header (default: true)
  imageColor?: string;         // Solid color for the iOS status bar area and TourStart background when no image (e.g. '#1a2634')
  listView?: boolean;          // Enable list tab (default: true)
  mapView?: boolean;           // Enable map tab (default: false)
  mapProvider?: 'openfreemap' | 'openstreetmap' | 'mapbox' | 'jawg' | 'maptiler' | 'carto'; // Tile provider (default: 'openfreemap')
  mapStyle?: string;           // MapLibre style.json URL (key in the URL) — overrides mapProvider entirely
  mapApiKey?: string;          // API key for the chosen provider
  mapStyleId?: string;         // Provider-specific style/map ID (uses provider's default outdoor style if omitted)
  mapCenter?: { lat: number; lng: number }; // Initial map center; defaults to fitting all stops in view
  mapZoom?: number;            // Initial zoom level 0–23; if mapCenter is omitted, fitBounds zoom is used instead
  mapMarker?: 'number' | 'image' | 'empty'; // Marker style: 'number'=numbered circle (default), 'image'=stop photo in a circle, 'empty'=plain circle with no number/image. A custom mapMarkerIcon (tour- or stop-level) overrides this.
  mapMarkerIcon?: string;      // Custom marker image URL applied to all stops; overrides mapMarker. A per-stop mapMarkerIcon overrides this for that stop.
  mapMarkerColors?: MapMarkerColors; // Per-tour marker background colors; each falls back to the theme's mapMarkers
  mapCluster?: {
    disableClusteringAtZoom?: number; // Zoom level at which clustering stops (e.g. 16)
    spiderfyOnMaxZoom?: boolean;     // Fan out overlapping markers at max zoom (default: true)
  };
  mapRoute?: boolean | MapRouteConfig; // Show route polyline with progress indicator (default: false)
  mapLocateButton?: boolean;           // Show locate-me button on map (default: true)
}

/**
 * A string localized per language code, e.g. { en: "Choose a tour", de: "Wähle eine Tour" }.
 * The current language is looked up by code; missing codes fall back to defaults.
 */
export type LocalizedString = Record<string, string>;

/**
 * App-level configuration for multi-tour deployments (src/data/tour/app.json).
 *
 * Authors the tour-selection landing screen, which otherwise has no identity of
 * its own. Every field is optional — with no app.json the picker falls back to
 * the first tour's theme and the built-in translated title/subtitle, so single-
 * tour deployments are unaffected.
 */
export interface AppConfig {
  themeId?: string;            // Registered theme for the landing screen (default: first tour's theme)
  defaultLanguage?: string;    // Preferred language for the picker before the user chooses
  title?: LocalizedString;     // Landing heading; falls back to t.tourSelection.title when absent
  subtitle?: LocalizedString;  // Landing subheading; falls back to t.tourSelection.subtitle when absent
  logo?: string;               // Optional logo image URL shown in the header
  hero?: string;               // Optional full-screen backdrop image URL behind the picker (lowest layer)
  splash?: string;             // Optional full-screen intro image/video URL; tap to continue to the picker (branding)
  splashArrowColor?: string;   // Optional color for the splash's arrow hint button (border + arrow); defaults to white
  statusBarColor?: string;     // Optional color for the iOS status bar / browser chrome on the landing screen (theme-color); defaults to the theme header color
  tourOrder?: string[];        // Tour ids in display order; unlisted tours are appended in discovery order
  tourCard?: TourCardConfig;   // What each tour card shows in the list; applies to ALL tours (no per-tour override)
}

/**
 * Controls which elements render on every tour card in the selection list.
 * The title is always shown. All flags default to true (omitted = shown).
 */
export interface TourCardConfig {
  showImage?: boolean;        // Cover image/thumbnail (default: true)
  showDescription?: boolean;  // Description text (default: true)
  showMeta?: boolean;         // Meta row — duration (minutes) and stop count (default: true)
}

export interface BaseStop {
  id: string;
  type: StopType;
  location?: StopLocation;
  mapMarkerIcon?: string; // Per-stop custom marker image — overrides the tour-level mapMarkerIcon
}

export interface AudioStop extends BaseStop {
  type: 'audio';
  title: string;
  duration: string;
  isCompleted: boolean;
  isPlaying?: boolean;
  image: string;
  imageAlt?: string;
  imageCaption?: string;
  imageCredit?: string;
  audioFile?: string;
  transcription?: string;
  content?: string;
}

export interface TextStop extends BaseStop {
  type: 'text';
  title?: string;
  content?: string;
}

export interface ImageTextStop extends BaseStop {
  type: 'image-text';
  title?: string;
  image: string;
  imageAlt?: string;
  imageCaption?: string;
  imageCredit?: string;
  content?: string;
}

export interface ThreeDObjectStop extends BaseStop {
  type: '3d-object';
  modelUrl: string;
  caption?: string;
}

export interface VideoStop extends BaseStop {
  type: 'video';
  videoUrl: string;
  caption?: string;
}

export interface HeadlineStop extends BaseStop {
  type: 'headline';
  text: string;
}

export interface RatingStop extends BaseStop {
  type: 'rating';
  question?: string;
  description?: string;
}

export interface EmailStop extends BaseStop {
  type: 'email';
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
}

export interface QuoteStop extends BaseStop {
  type: 'quote';
  quote: string;
  author: string;
  year?: string;
}

export interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
}

export interface ImageGalleryStop extends BaseStop {
  type: 'image-gallery';
  images: GalleryImage[];
  caption?: string;
}

export interface ImageComparisonStop extends BaseStop {
  type: 'image-comparison';
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  caption?: string;
}

export interface Hotspot {
  x: number;
  y: number;
  title: string;
  description?: string;
}

export interface HotspotImageStop extends BaseStop {
  type: 'image-hotspot';
  image: string;
  imageAlt?: string;
  hotspots: Hotspot[];
  caption?: string;
}

export interface EmbedStop extends BaseStop {
  type: 'embed';
  embedUrl: string;
  embedType?: 'youtube' | 'spotify' | 'video' | 'generic';
  aspectRatio?: string;
  caption?: string;
}

export type Stop = AudioStop | TextStop | ImageTextStop | ThreeDObjectStop | VideoStop | HeadlineStop | RatingStop | EmailStop | QuoteStop | ImageGalleryStop | ImageComparisonStop | HotspotImageStop | EmbedStop;

export interface TourData {
  id: string;
  language: string;
  title: string;
  description: string;
  totalDuration: string;
  totalStops: number;
  stops: Stop[];
  image?: string;
  offlineMode?: OfflineMode;
  transitionAudio?: string;
  themeId?: string; // Optional theme ID for custom branding
  transcriptAvailable?: boolean;
  collectFeedback?: boolean; // Show rating button on main screen (default: true)
  hapticsEnabled?: boolean;      // Enable or disable all haptic feedback for this tour (default: true)
  showLanguageLabel?: boolean; // Show language name next to flag in selector (default: true)
  showStopImage?: boolean | 'thumbnail'; // Show stop image: true=full card, false=list, 'thumbnail'=compact with thumbnail (default: true)
  showStopDuration?: boolean;  // Show duration on cards (default: true)
  showStopNumber?: boolean;    // Show number indicator (default: true)
  fullscreenPlayer?: boolean;  // Show fullscreen player on stop click (default: false)
  showProgressBar?: boolean;   // Show progress bar in tour header (default: true)
  imageColor?: string;         // Solid color for the iOS status bar area and TourStart background when no image (e.g. '#1a2634')
  listView?: boolean;          // Enable list tab (default: true)
  mapView?: boolean;           // Enable map tab (default: false)
  mapProvider?: 'openfreemap' | 'openstreetmap' | 'mapbox' | 'jawg' | 'maptiler' | 'carto'; // Tile provider (default: 'openfreemap')
  mapStyle?: string;           // MapLibre style.json URL (key in the URL) — overrides mapProvider entirely
  mapApiKey?: string;          // API key for the chosen provider
  mapStyleId?: string;         // Provider-specific style/map ID (uses provider's default outdoor style if omitted)
  mapCenter?: { lat: number; lng: number }; // Initial map center; defaults to fitting all stops in view
  mapZoom?: number;            // Initial zoom level 0–23; if mapCenter is omitted, fitBounds zoom is used instead
  mapMarker?: 'number' | 'image' | 'empty'; // Marker style: 'number'=numbered circle (default), 'image'=stop photo in a circle, 'empty'=plain circle with no number/image. A custom mapMarkerIcon (tour- or stop-level) overrides this.
  mapMarkerIcon?: string;      // Custom marker image URL applied to all stops; overrides mapMarker. A per-stop mapMarkerIcon overrides this for that stop.
  mapMarkerColors?: MapMarkerColors; // Per-tour marker background colors; each falls back to the theme's mapMarkers
  mapCluster?: {
    disableClusteringAtZoom?: number;
    spiderfyOnMaxZoom?: boolean;
  };
  mapRoute?: boolean | MapRouteConfig; // Show route polyline with progress indicator (default: false)
  mapLocateButton?: boolean;           // Show locate-me button on map (default: true)
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  countryCode: string;
}

export interface TourRating {
  tourId: string;
  rating: number;
  feedback: string;
  email: string;
  submittedAt: string;
}

export type SheetType = 'NONE' | 'LANGUAGE' | 'RATING' | 'PLAYER_MINIMIZED' | 'TOUR_COMPLETE';