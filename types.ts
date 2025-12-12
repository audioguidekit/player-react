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

export interface TourData {
  id: string;
  language: string;
  title: string;
  description: string;
  totalDuration: string;
  totalStops: number;
  stops: Stop[];
  image: string;
  offlineAvailable?: boolean;
  transitionAudio?: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TourRating {
  tourId: string;
  rating: number;
  feedback: string;
  email: string;
  submittedAt: string;
}

export type SheetType = 'NONE' | 'LANGUAGE' | 'RATING' | 'PLAYER_MINIMIZED' | 'TOUR_COMPLETE';