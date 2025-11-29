import { useState, useEffect } from 'react';
import { TourData, Language } from '../types';
import { dataService } from '../services/dataService';

/**
 * Generic loading state interface
 */
export interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load tour data by ID
 * @param tourId - Tour ID to load (e.g., 'rome-01')
 * @returns Loading state with tour data
 */
export function useTourData(tourId?: string): LoadingState<TourData> {
  const [state, setState] = useState<LoadingState<TourData>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!tourId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const tour = await dataService.getTourById(tourId);

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
  }, [tourId]);

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

/**
 * Hook to load all available tours
 * @returns Loading state with array of tours
 */
export function useAllTours(): LoadingState<TourData[]> {
  const [state, setState] = useState<LoadingState<TourData[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const manifest = await dataService.getManifest();
        const tours = await Promise.all(
          manifest.tours.map(entry => dataService.getTour(entry.filename))
        );

        if (!cancelled) {
          setState({ data: tours, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to load tours'),
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
