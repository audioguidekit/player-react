// Authoring + data types live in @audioguidekit/schema (packages/schema) so the
// player and external tools read one definition. Re-exported here so
// existing imports from '../types' keep working.
export type * from '@audioguidekit/schema';

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