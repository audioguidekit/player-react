/**
 * Tour configuration
 * Centralized place to manage tour-related settings
 */

import { getDefaultTourId, onDataInstalled } from '../services/tourDiscovery';

/**
 * Default tour ID to load when no specific tour is requested.
 *
 * Derived dynamically from the tour data discovered in the installed data (the first
 * tour), so the URL slug always matches the bundled tour's
 * actual `id` and can never drift from the data.
 */
export let DEFAULT_TOUR_ID: string = getDefaultTourId();

// A live binding: re-derived when data is (re)installed (live preview).
onDataInstalled(() => {
  DEFAULT_TOUR_ID = getDefaultTourId();
});
