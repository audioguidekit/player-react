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
    downloadForOffline: string;
    availableOffline: string;
    downloading: string;
    stops: string;
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
    emailError: string;
    emailConsent: string;
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
    offline: string;
  };
  map: {
    locationError: string;
  };
  tourSelection: {
    title: string;
    subtitle: string;
    tours: string;
  };
  playback: {
    speed: string;
  };
  stopSearch: {
    label: string;
    placeholder: string;
    clear: string;
    resultOne: string;
    resultMany: string;
    noResults: string;
  };
  textSize: {
    label: string;
    default: string;
    large: string;
    larger: string;
  };
  directions: {
    label: string;
    to: string;
    openIn: string;
    googleMaps: string;
    appleMaps: string;
    waze: string;
  };
  embed: {
    blocked: string;
  };
}

export type LanguageCode = 'en' | 'cs' | 'de' | 'fr' | 'it' | 'es';
