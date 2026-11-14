import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { TourData, Language } from '../types';
import { dataService } from '../src/services/dataService';
import { refreshTourData } from '../src/services/tourDiscovery';

/**
 * Live preview: an embedding editor posts `agk:data-changed` into its preview iframe after
 * every save. Re-reading the JSON and bumping this version re-runs the loaders
 * in place, so an edit shows up without reloading the page — the frame keeps
 * its scroll position, the open stop and the sheet it was on.
 */
let dataVersion = 0;
const dataVersionListeners = new Set<() => void>();

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addEventListener('message', async (event: MessageEvent) => {
    if (event.data?.type !== 'agk:data-changed') return;
    await refreshTourData();
    dataService.clearCache();
    dataVersion += 1;
    dataVersionListeners.forEach(notify => notify());
  });
}

function useDataVersion(): number {
  return useSyncExternalStore(
    listener => {
      dataVersionListeners.add(listener);
      return () => dataVersionListeners.delete(listener);
    },
    () => dataVersion,
    () => 0,
  );
}

/**
 * Generic loading state interface
 */
export interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load tour data by tour ID and language code.
 *
 * When `tourId` is provided the specific tour is loaded (with the standard
 * language fallback). When it is omitted the first available tour is used,
 * preserving the original single-tour behavior.
 *
 * @param tourId - Tour ID to load (e.g., 'new-york'); optional
 * @param languageCode - Language code to load (e.g., 'en', 'de')
 * @returns Loading state with tour data
 */
export function useTourData(tourId?: string, languageCode?: string): LoadingState<TourData> {
  const [state, setState] = useState<LoadingState<TourData>>({
    data: null,
    loading: true,
    error: null,
  });

  const version = useDataVersion();
  // A version bump is a refresh of the tour already on screen, so it keeps the
  // current data visible instead of flashing the loading state; a different
  // tour or language is a real load.
  const requestKey = `${tourId ?? ''}|${languageCode ?? ''}`;
  const lastRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!languageCode) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const isRefresh = lastRequestRef.current === requestKey;
    lastRequestRef.current = requestKey;

    let cancelled = false;

    const loadData = async () => {
      try {
        if (!isRefresh) setState(prev => ({ ...prev, loading: true, error: null }));
        const tour = tourId
          ? await dataService.getTourById(tourId, languageCode)
          : await dataService.getTourByLanguage(languageCode);

        if (!cancelled) {
          setState({ data: tour, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to load tour'),
          });
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [tourId, languageCode, requestKey, version]);

  return state;
}

/**
 * Hook to load languages
 * @returns Loading state with languages array
 */
export function useLanguages(): LoadingState<Language[]> {
  const [state, setState] = useState<LoadingState<Language[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const languages = await dataService.getLanguages();

        if (!cancelled) {
          setState({ data: languages, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to load languages'),
          });
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
