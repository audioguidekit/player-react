import { getTourRegistry, defaultLanguage, onDataInstalled } from '../services/tourDiscovery';

/**
 * Reads `hapticsEnabled` from the first tour's metadata and returns it as a
 * boolean. Defaults to `true` when the field is absent or on any error
 * (fail-open), so haptics work out of the box without explicit config.
 */
function computeHapticsEnabled(): boolean {
  try {
    const registry = getTourRegistry();
    const tourIds = Object.keys(registry);
    if (tourIds.length === 0) return true;

    const firstId = tourIds[0];
    const languages = registry[firstId];
    const languageCodes = Object.keys(languages);
    if (languageCodes.length === 0) return true;

    // Prefer the app's default language if available
    const lang =
      languages[defaultLanguage] !== undefined
        ? defaultLanguage
        : languageCodes[0];

    const tour = languages[lang];
    if (typeof tour.hapticsEnabled === 'boolean') {
      return tour.hapticsEnabled;
    }

    return true;
  } catch {
    // Fail-open: keep haptics enabled if something goes wrong
    return true;
  }
}

/**
 * Whether haptic feedback is enabled for this tour.
 * Evaluated from tour metadata whenever data is installed.
 * Consumed exclusively via `useHaptics()` — do not import directly.
 */
export let hapticsEnabled: boolean = computeHapticsEnabled();

// Re-evaluated when data is (re)installed (live preview).
onDataInstalled(() => {
  hapticsEnabled = computeHapticsEnabled();
});

