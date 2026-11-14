/**
 * Italian translations
 * TODO: Translate all strings to Italian
 */

import { Translations } from '../types';

export const it: Translations = {
  loading: {
    tourData: 'Caricamento dati del tour...',
    preparing: 'Preparazione del tuo tour...',
    audio: 'Caricamento audio e immagini',
  },
  errors: {
    loadFailed: 'Errore di caricamento dati',
    tourLoadFailed: 'Impossibile caricare i dati del tour',
    downloadFailed: 'Download fallito',
    retry: 'Riprova',
    httpsTooltip: '💡 Suggerimento: Usa HTTPS o accedi tramite localhost per i download offline',
  },
  startCard: {
    preparing: 'Preparazione...',
    loadingTour: 'Caricamento del tour...',
    replayTour: 'Riproduci tour',
    resumeTour: 'Riprendi tour',
    downloadTour: 'Scarica tour',
    startTour: 'Inizia tour',
    offlineInfo: 'Scarica questo tour ora per godertelo offline in aree con connettività limitata.',
    downloadForOffline: 'Scarica per offline',
    availableOffline: 'Disponibile offline',
    downloading: 'Scaricamento...',
    stops: 'tappe',
  },
  rating: {
    title: 'Come ti è piaciuto questo tour?',
    subtitle: 'Il tuo feedback è prezioso per noi!',
    tapToRate: 'Tocca per valutare',
    shareDetails: 'Vuoi condividere più dettagli?',
    feedbackPlaceholder: 'Descrivi cosa ti è piaciuto o non ti è piaciuto...',
    next: 'Avanti',
    stayInLoop: 'Rimanere aggiornato?',
    emailInfo: 'Inserisci la tua email per ricevere aggiornamenti su nuovi tour e offerte esclusive.',
    emailPlaceholder: 'tuo@email.it',
    subscribe: 'Iscriviti',
    skip: 'Salta',
    thankYou: 'Grazie!',
    appreciateFeedback: 'Apprezziamo il tuo feedback.',
    close: 'Chiudi',
    subscribed: 'Sei iscritto!',
    checkInbox: 'Controlla la tua casella di posta.',
    emailError: "Invio non riuscito. Controlla la connessione e riprova.",
    emailConsent: "Accetto di ricevere via e-mail novità sulle nuove guide.",
  },
  tourComplete: {
    title: 'Tour completato!',
    message: 'Hai ascoltato tutte le fermate audio. Speriamo che tu abbia apprezzato il tour.',
    rateTour: 'Valuta questo tour',
    skipRating: 'Salta valutazione',
    done: 'Fatto',
  },
  tourHeader: {
    minLeft: 'min rimanenti',
    offline: 'Offline',
  },
  map: {
    locationError: 'Posizione non disponibile',
  },
  tourSelection: {
    title: 'Scegli un tour',
    subtitle: 'Seleziona un tour per iniziare la visita',
    tours: 'tour',
  },
  playback: {
    speed: "Velocità",
  },
  stopSearch: {
    label: "Cerca tappe",
    placeholder: "Cerca una tappa",
    clear: "Cancella la ricerca",
    resultOne: "1 tappa trovata",
    resultMany: "{count} tappe trovate",
    noResults: "Nessuna tappa corrisponde alla ricerca.",
  },
  textSize: {
    label: "Dimensione del testo",
    default: "Dimensione del testo predefinita",
    large: "Testo grande",
    larger: "Testo molto grande",
  },
  directions: {
    label: "Indicazioni",
    to: "Indicazioni per {name}",
    openIn: "Apri le indicazioni in",
    googleMaps: "Google Maps",
    appleMaps: "Mappe",
    waze: "Waze",
  },
  embed: {
    blocked: "Questo contenuto non è disponibile qui.",
  },
} as const;
