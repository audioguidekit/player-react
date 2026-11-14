/**
 * Czech translations
 * TODO: Translate all strings to Czech
 */

import { Translations } from '../types';

export const cs: Translations = {
  loading: {
    tourData: 'Načítání dat prohlídky...',
    preparing: 'Příprava vaší prohlídky...',
    audio: 'Načítání audia a obrázků',
  },
  errors: {
    loadFailed: 'Chyba při načítání dat',
    tourLoadFailed: 'Nepodařilo se načíst data prohlídky',
    downloadFailed: 'Stahování selhalo',
    retry: 'Zkusit znovu',
    httpsTooltip: '💡 Tip: Pro offline stahování použijte HTTPS nebo přístup přes localhost',
  },
  startCard: {
    preparing: 'Příprava...',
    loadingTour: 'Načítání prohlídky...',
    replayTour: 'Přehrát znovu',
    resumeTour: 'Pokračovat',
    downloadTour: 'Stáhnout prohlídku',
    startTour: 'Spustit prohlídku',
    offlineInfo: 'Stáhněte si tuto prohlídku a užijte si ji offline v oblastech s omezeným připojením.',
    downloadForOffline: 'Stáhnout pro offline',
    availableOffline: 'Dostupné offline',
    downloading: 'Stahování...',
    stops: 'zastávek',
  },
  rating: {
    title: 'Jak se vám prohlídka líbila?',
    subtitle: 'Vaše zpětná vazba je pro nás cenná!',
    tapToRate: 'Klepněte pro hodnocení',
    shareDetails: 'Chcete sdílet více podrobností?',
    feedbackPlaceholder: 'Popište, co se vám líbilo nebo nelíbilo...',
    next: 'Další',
    stayInLoop: 'Zůstat v obraze?',
    emailInfo: 'Zadejte svůj e-mail a dostávejte informace o nových prohlídkách a exkluzivních nabídkách.',
    emailPlaceholder: 'vas@email.cz',
    subscribe: 'Přihlásit se',
    skip: 'Přeskočit',
    thankYou: 'Děkujeme!',
    appreciateFeedback: 'Vážíme si vaší zpětné vazby.',
    close: 'Zavřít',
    subscribed: 'Jste přihlášeni!',
    checkInbox: 'Zkontrolujte svou e-mailovou schránku.',
    emailError: "Odeslání se nepovedlo. Zkontrolujte připojení a zkuste to znovu.",
    emailConsent: "Souhlasím se zasíláním novinek o nových průvodcích e-mailem.",
  },
  tourComplete: {
    title: 'Prohlídka dokončena!',
    message: 'Poslechli jste si všechny audio zastávky. Doufáme, že se vám prohlídka líbila.',
    rateTour: 'Ohodnotit prohlídku',
    skipRating: 'Přeskočit hodnocení',
    done: 'Hotovo',
  },
  tourHeader: {
    minLeft: 'min zbývá',
    offline: 'Offline',
  },
  map: {
    locationError: 'Poloha nedostupná',
  },
  tourSelection: {
    title: 'Vyberte prohlídku',
    subtitle: 'Vyberte prohlídku a začněte svou návštěvu',
    tours: 'prohlídky',
  },
  playback: {
    speed: "Rychlost",
  },
  stopSearch: {
    label: "Hledat zastávky",
    placeholder: "Hledat zastávky",
    clear: "Vymazat hledání",
    resultOne: "Nalezena 1 zastávka",
    resultMany: "Nalezeno zastávek: {count}",
    noResults: "Vašemu hledání neodpovídá žádná zastávka.",
  },
  textSize: {
    label: "Velikost textu",
    default: "Výchozí velikost textu",
    large: "Velký text",
    larger: "Největší text",
  },
  directions: {
    label: "Navigovat",
    to: "Navigovat k: {name}",
    openIn: "Otevřít navigaci v",
    googleMaps: "Google Maps",
    appleMaps: "Apple Maps",
    waze: "Waze",
  },
  embed: {
    blocked: "Tento obsah zde není dostupný.",
  },
} as const;
