/**
 * German translations
 * TODO: Translate all strings to German
 */

import { Translations } from '../types';

export const de: Translations = {
  loading: {
    tourData: 'Tourdaten werden geladen...',
    preparing: 'Ihre Tour wird vorbereitet...',
    audio: 'Audio und Bilder werden geladen',
  },
  errors: {
    loadFailed: 'Fehler beim Laden der Daten',
    tourLoadFailed: 'Tourdaten konnten nicht geladen werden',
    downloadFailed: 'Download fehlgeschlagen',
    retry: 'Erneut versuchen',
    httpsTooltip: '💡 Tipp: Verwenden Sie HTTPS oder greifen Sie über localhost zu für Offline-Downloads',
  },
  startCard: {
    preparing: 'Vorbereitung...',
    loadingTour: 'Tour wird geladen...',
    replayTour: 'Tour wiederholen',
    resumeTour: 'Tour fortsetzen',
    downloadTour: 'Tour herunterladen',
    startTour: 'Tour starten',
    offlineInfo: 'Laden Sie diese Tour jetzt herunter, um sie offline in Gebieten mit eingeschränkter Konnektivität zu genießen.',
  },
  rating: {
    title: 'Wie hat Ihnen diese Tour gefallen?',
    subtitle: 'Ihr Feedback ist wertvoll für uns!',
    tapToRate: 'Zum Bewerten tippen',
    shareDetails: 'Möchten Sie mehr Details teilen?',
    feedbackPlaceholder: 'Beschreiben Sie, was Ihnen gefallen oder nicht gefallen hat...',
    next: 'Weiter',
    stayInLoop: 'Auf dem Laufenden bleiben?',
    emailInfo: 'Geben Sie Ihre E-Mail-Adresse ein, um Updates über neue Touren und exklusive Angebote zu erhalten.',
    emailPlaceholder: 'ihre@email.de',
    subscribe: 'Abonnieren',
    skip: 'Überspringen',
    thankYou: 'Vielen Dank!',
    appreciateFeedback: 'Wir schätzen Ihr Feedback.',
    close: 'Schließen',
    subscribed: 'Sie sind angemeldet!',
    checkInbox: 'Überprüfen Sie Ihren Posteingang.',
  },
  tourComplete: {
    title: 'Tour abgeschlossen!',
    message: 'Sie haben alle Audio-Stops angehört. Wir hoffen, Sie haben die Tour genossen.',
    rateTour: 'Tour bewerten',
    skipRating: 'Bewertung überspringen',
    done: 'Fertig',
  },
  tourHeader: {
    minLeft: 'Min. übrig',
  },
} as const;
