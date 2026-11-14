/**
 * English translations
 */

import { Translations } from '../types';

export const en: Translations = {
  loading: {
    tourData: 'Loading tour data...',
    preparing: 'Preparing your tour...',
    audio: 'Loading audio and images',
  },
  errors: {
    loadFailed: 'Error Loading Data',
    tourLoadFailed: 'Failed to load tour data',
    downloadFailed: 'Download Failed',
    retry: 'Retry',
    httpsTooltip: '💡 Tip: Use HTTPS or access via localhost for offline downloads',
  },
  startCard: {
    preparing: 'Preparing...',
    loadingTour: 'Loading tour...',
    replayTour: 'Replay tour',
    resumeTour: 'Resume tour',
    downloadTour: 'Download tour',
    startTour: 'Start tour',
    offlineInfo: 'Download this tour now to enjoy it offline in areas with limited connectivity.',
    downloadForOffline: 'Download for offline',
    availableOffline: 'Available offline',
    downloading: 'Downloading...',
    stops: 'stops',
  },
  rating: {
    title: 'How did you like this tour?',
    subtitle: 'Your feedback is valuable for us!',
    tapToRate: 'Tap to rate',
    shareDetails: 'Mind sharing more details?',
    feedbackPlaceholder: 'Describe what you liked or disliked...',
    next: 'Next',
    stayInLoop: 'Stay in the loop?',
    emailInfo: 'Enter your email to receive updates about new tours and exclusive offers from this property.',
    emailPlaceholder: 'your@email.com',
    subscribe: 'Subscribe',
    skip: 'Skip',
    thankYou: 'Thank you!',
    appreciateFeedback: 'We appreciate your feedback.',
    close: 'Close',
    subscribed: "You're subscribed!",
    checkInbox: 'Check your inbox for updates.',
    emailError: "Couldn't send that. Check your connection and try again.",
    emailConsent: "I agree to receive news about new guides by email.",
  },
  tourComplete: {
    title: 'Tour completed!',
    message: "You've listened to all the audio stops. We hope you enjoyed the tour.",
    rateTour: 'Rate this tour',
    skipRating: 'Skip rating',
    done: 'Done',
  },
  tourHeader: {
    minLeft: 'min left',
    offline: 'Offline',
  },
  map: {
    locationError: 'Location unavailable',
  },
  tourSelection: {
    title: 'Choose a tour',
    subtitle: 'Select a tour to begin your visit',
    tours: 'tours',
  },
  playback: {
    speed: "Speed",
  },
  stopSearch: {
    label: "Search stops",
    placeholder: "Search stops",
    clear: "Clear search",
    resultOne: "1 stop found",
    resultMany: "{count} stops found",
    noResults: "No stops match your search.",
  },
  textSize: {
    label: "Text size",
    default: "Default text size",
    large: "Large text",
    larger: "Largest text",
  },
  directions: {
    label: "Directions",
    to: "Directions to {name}",
    openIn: "Open directions in",
    googleMaps: "Google Maps",
    appleMaps: "Apple Maps",
    waze: "Waze",
  },
  embed: {
    blocked: "This content is not available here.",
  },
} as const;
