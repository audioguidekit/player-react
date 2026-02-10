export type StopType = 'audio' | 'text' | 'image-text' | '3d-object' | 'video' | 'headline' | 'rating' | 'email' | 'quote' | 'image-gallery' | 'image-comparison' | 'hotspot-image' | 'embed';

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
  image?: string;
  showLanguageLabel?: boolean; // Show language name next to flag in selector (default: true)
  showStopImage?: boolean | 'thumbnail'; // Show stop image: true=full card, false=list, 'thumbnail'=compact with thumbnail (default: true)
  showStopDuration?: boolean;  // Show duration on cards (default: true)
  showStopNumber?: boolean;    // Show number indicator (default: true)
  fullscreenPlayer?: boolean;  // Show fullscreen player on stop click (default: false)
}

export interface BaseStop {
  id: string;
  type: StopType;
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
  image: string;
  offlineMode?: OfflineMode;
  transitionAudio?: string;
  themeId?: string; // Optional theme ID for custom branding
  transcriptAvailable?: boolean;
  collectFeedback?: boolean; // Show rating button on main screen (default: true)
  showLanguageLabel?: boolean; // Show language name next to flag in selector (default: true)
  showStopImage?: boolean | 'thumbnail'; // Show stop image: true=full card, false=list, 'thumbnail'=compact with thumbnail (default: true)
  showStopDuration?: boolean;  // Show duration on cards (default: true)
  showStopNumber?: boolean;    // Show number indicator (default: true)
  fullscreenPlayer?: boolean;  // Show fullscreen player on stop click (default: false)
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