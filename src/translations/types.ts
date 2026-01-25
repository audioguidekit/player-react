/**
 * Translation types and interfaces
 */

export interface Translations {
  loading: {
    tourData: string;
    preparing: string;
    audio: string;
  };
  errors: {
    loadFailed: string;
    tourLoadFailed: string;
    downloadFailed: string;
    retry: string;
    httpsTooltip: string;
  };
  startCard: {
    preparing: string;
    loadingTour: string;
    replayTour: string;
    resumeTour: string;
    downloadTour: string;
    startTour: string;
    offlineInfo: string;
  };
  rating: {
    title: string;
    subtitle: string;
    tapToRate: string;
    shareDetails: string;
    feedbackPlaceholder: string;
    next: string;
    stayInLoop: string;
    emailInfo: string;
    emailPlaceholder: string;
    subscribe: string;
    skip: string;
    thankYou: string;
    appreciateFeedback: string;
    close: string;
    subscribed: string;
    checkInbox: string;
  };
  tourComplete: {
    title: string;
    message: string;
    rateTour: string;
    skipRating: string;
    done: string;
  };
  tourHeader: {
    minLeft: string;
  };
}

export type LanguageCode = 'en' | 'cs' | 'de' | 'fr' | 'it' | 'es';
