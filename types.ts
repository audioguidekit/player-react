export type StopType = 'audio' | 'text' | 'image-text' | '3d-object' | 'video' | 'headline' | 'rating' | 'email' | 'quote';

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
  audioFile?: string;
}

export interface TextStop extends BaseStop {
  type: 'text';
  content: string;
}

export interface ImageTextStop extends BaseStop {
  type: 'image-text';
  image: string;
  content: string;
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

export type Stop = AudioStop | TextStop | ImageTextStop | ThreeDObjectStop | VideoStop | HeadlineStop | RatingStop | EmailStop | QuoteStop;

// Legacy type aliases for backward compatibility
export type FeedItemType = StopType;
export type BaseFeedItem = BaseStop;
export type AudioFeedItem = AudioStop;
export type TextFeedItem = TextStop;
export type ImageTextFeedItem = ImageTextStop;
export type ThreeDObjectFeedItem = ThreeDObjectStop;
export type VideoFeedItem = VideoStop;
export type HeadlineFeedItem = HeadlineStop;
export type RatingFeedItem = RatingStop;
export type EmailFeedItem = EmailStop;
export type QuoteFeedItem = QuoteStop;
export type FeedItem = Stop;

export interface TourData {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  totalStops: number;
  stops: Stop[];
  image: string;
  offlineAvailable?: boolean;
}

export type ScreenName = 'START' | 'DETAIL' | 'ACTIVE_PLAYER';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export type SheetType = 'NONE' | 'LANGUAGE' | 'RATING' | 'PLAYER_MINIMIZED';