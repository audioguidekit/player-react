export interface Stop {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isPlaying?: boolean;
  image: string;
  audioFile?: string;
}

export interface TourData {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  totalStops: number;
  stops: Stop[];
  image: string;
}

export type ScreenName = 'START' | 'DETAIL' | 'ACTIVE_PLAYER';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export type SheetType = 'NONE' | 'LANGUAGE' | 'RATING' | 'PLAYER_MINIMIZED';