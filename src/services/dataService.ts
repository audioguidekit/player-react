<<<<<<< Updated upstream
import { TourData, Language } from '../types';
import {
  getAnyTourByLanguage,
  getTourWithFallback,
  getAllAvailableLanguages,
  getAvailableTourIds,
} from './tourDiscovery';
import { defaultLanguage } from '../config/languages';

/**
 * Interface for tour manifest entry (legacy, kept for compatibility)
 */
export interface TourManifestEntry {
  id: string;
  filename: string;
  title: string;
  description: string;
  thumbnail: string;
}

/**
 * Interface for tour manifest structure (legacy, kept for compatibility)
 */
export interface TourManifest {
  tours: TourManifestEntry[];
}

/**
 * Loads a tour by language code
 * Uses the tour discovery system to find tours by their internal language field
 * @param languageCode - Language code (e.g., 'en', 'de', 'cs')
 * @returns Promise resolving to tour data
 */
export async function loadTourByLanguage(languageCode: string): Promise<TourData> {
  const tour = getAnyTourByLanguage(languageCode);
  if (!tour) {
    throw new Error(`No tour found for language '${languageCode}'`);
  }
  return tour;
}

/**
 * Loads a tour by its ID with language preference
 * @param tourId - Tour ID (e.g., 'barcelona')
 * @param languageCode - Preferred language code
 * @returns Promise resolving to tour data
 */
export async function loadTourById(tourId: string, languageCode: string = defaultLanguage): Promise<TourData> {
  const tour = getTourWithFallback(tourId, languageCode);
  if (!tour) {
    throw new Error(`Tour with ID '${tourId}' not found`);
  }
  return tour;
}

/**
 * Loads all available languages
 * Uses the tour discovery system to get languages from tour files
 * @returns Promise resolving to array of languages
 */
export async function loadLanguages(): Promise<Language[]> {
  return getAllAvailableLanguages();
}

/**
 * Gets all available tour IDs
 * @returns Array of tour IDs
 */
export function getAvailableTours(): string[] {
  return getAvailableTourIds();
}

/**
 * Data service with caching support
 * Note: With the discovery system, caching is less critical since tours are
 * loaded at build time. This class is kept for API compatibility.
=======
import { TourData, Language } from '../../types';
import {
  getTour,
  getTourWithFallback,
  getAvailableLanguages,
  getTourLanguages,
  getDefaultTourId,
  getTourRegistry,
} from './tourDiscovery';

/**
 * Data service with caching support
 * Now uses tour discovery for automatic tour detection
>>>>>>> Stashed changes
 */
export class DataService {
  private tourCache: Map<string, TourData> = new Map();
  private languageCache: Language[] | null = null;
<<<<<<< Updated upstream
=======

  /**
   * Get cache key for tour
   */
  private getCacheKey(tourId: string, language: string): string {
    return `${tourId}:${language}`;
  }

  /**
   * Loads tour by ID and language with caching
   */
  async getTourByIdAndLanguage(tourId: string, language: string): Promise<TourData | null> {
    const cacheKey = this.getCacheKey(tourId, language);

    if (this.tourCache.has(cacheKey)) {
      return this.tourCache.get(cacheKey)!;
    }

    const tour = getTour(tourId, language);
    if (tour) {
      this.tourCache.set(cacheKey, tour);
    }
    return tour;
  }
>>>>>>> Stashed changes

  /**
   * Loads tour by language code with caching
   * Uses the default/first tour ID for single-tour apps
   */
  async getTourByLanguage(languageCode: string): Promise<TourData> {
<<<<<<< Updated upstream
    const cacheKey = `lang:${languageCode}`;
    if (this.tourCache.has(cacheKey)) {
      return this.tourCache.get(cacheKey)!;
    }

    const tour = await loadTourByLanguage(languageCode);
=======
    const tourId = getDefaultTourId();

    if (!tourId) {
      throw new Error('No tours discovered');
    }

    const cacheKey = this.getCacheKey(tourId, languageCode);

    if (this.tourCache.has(cacheKey)) {
      return this.tourCache.get(cacheKey)!;
    }

    // Try to get tour in requested language, with fallback
    const tour = getTourWithFallback(tourId, languageCode, 'en');

    if (!tour) {
      throw new Error(`Tour '${tourId}' not available in language '${languageCode}' or fallback`);
    }

>>>>>>> Stashed changes
    this.tourCache.set(cacheKey, tour);
    return tour;
  }

  /**
<<<<<<< Updated upstream
   * Loads tour by ID with language preference
   */
  async getTourById(tourId: string, languageCode: string = 'en'): Promise<TourData> {
    const cacheKey = `${tourId}:${languageCode}`;
    if (this.tourCache.has(cacheKey)) {
      return this.tourCache.get(cacheKey)!;
    }

    const tour = await loadTourById(tourId, languageCode);
    this.tourCache.set(cacheKey, tour);
    return tour;
  }

  /**
   * Loads languages (uses discovery system)
=======
   * Loads languages - now derived from discovered tours
>>>>>>> Stashed changes
   */
  async getLanguages(): Promise<Language[]> {
    if (this.languageCache) {
      return this.languageCache;
    }

    this.languageCache = getAvailableLanguages();
    return this.languageCache;
  }

  /**
<<<<<<< Updated upstream
=======
   * Get available languages for a specific tour
   */
  getTourLanguageCodes(tourId: string): string[] {
    return getTourLanguages(tourId);
  }

  /**
   * Get the default tour ID
   */
  getDefaultTourId(): string | null {
    return getDefaultTourId();
  }

  /**
   * Get all tours registry
   */
  getAllTours() {
    return getTourRegistry();
  }

  /**
>>>>>>> Stashed changes
   * Clears all caches
   */
  clearCache(): void {
    this.tourCache.clear();
    this.languageCache = null;
<<<<<<< Updated upstream
=======
  }

  /**
   * Clears specific tour from cache
   */
  clearTourCache(tourId: string, language: string): void {
    const cacheKey = this.getCacheKey(tourId, language);
    this.tourCache.delete(cacheKey);
>>>>>>> Stashed changes
  }
}

/**
 * Default singleton instance
 */
export const dataService = new DataService();

// Re-export types that might be used elsewhere
export type { TourRegistry } from './tourDiscovery';
