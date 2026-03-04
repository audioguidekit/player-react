export type StopType = 'audio' | 'text' | 'image-text' | '3d-object' | 'video' | 'headline' | 'rating' | 'email' | 'quote' | 'image-gallery' | 'image-comparison' | 'hotspot-image' | 'embed';

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
 */
export interface MapRouteConfig {
  geoJSON?: string | RouteGeoJSON;  // path in metadata.json → resolved object at runtime
  minZoom?: number;                  // hide line below this zoom level (default: 13)
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
  mapView?: boolean;           // Enable map tab (default: false)
  mapProvider?: 'openstreetmap' | 'mapbox' | 'jawg' | 'maptiler' | 'carto'; // Tile provider (default: 'openstreetmap')
  mapApiKey?: string;          // API key for the chosen provider
  mapStyleId?: string;         // Provider-specific style/map ID (uses provider's default outdoor style if omitted)
  mapCenter?: { lat: number; lng: number }; // Initial map center; defaults to fitting all stops in view
  mapZoom?: number;            // Initial zoom level 0–23; if mapCenter is omitted, fitBounds zoom is used instead
  mapMarkerCustomIcon?: boolean | string; // Custom marker image URL for all stops; false = use default numbered circle (default: false)
  mapMarkerNumber?: boolean;   // Show stop number on markers (default: true)
  mapCluster?: {
    disableClusteringAtZoom?: number; // Zoom level at which clustering stops (e.g. 16)
    spiderfyOnMaxZoom?: boolean;     // Fan out overlapping markers at max zoom (default: true)
  };
  mapRoute?: boolean | MapRouteConfig; // Show route polyline with progress indicator (default: false)
  mapLocateButton?: boolean;           // Show locate-me button on map (default: true)
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
  type: 'hotspot-image';
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
  mapView?: boolean;           // Enable map tab (default: false)
  mapProvider?: 'openstreetmap' | 'mapbox' | 'jawg' | 'maptiler' | 'carto'; // Tile provider (default: 'openstreetmap')
  mapApiKey?: string;          // API key for the chosen provider
  mapStyleId?: string;         // Provider-specific style/map ID (uses provider's default outdoor style if omitted)
  mapCenter?: { lat: number; lng: number }; // Initial map center; defaults to fitting all stops in view
  mapZoom?: number;            // Initial zoom level 0–23; if mapCenter is omitted, fitBounds zoom is used instead
  mapMarkerCustomIcon?: boolean | string; // Custom marker image URL for all stops; false = use default numbered circle (default: false)
  mapMarkerNumber?: boolean;   // Show stop number on markers (default: true)
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