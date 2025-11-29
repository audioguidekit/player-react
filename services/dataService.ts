import { TourData, Language } from '../types';

/**
 * Interface for tour manifest entry
 */
export interface TourManifestEntry {
  id: string;
  filename: string;
  title: string;
  description: string;
  thumbnail: string;
}

/**
 * Interface for tour manifest structure
 */
export interface TourManifest {
  tours: TourManifestEntry[];
}

/**
 * Base path for data files
 */
const DATA_BASE_PATH = '/data';

/**
 * Fetches and parses a JSON file
 * @param path - Relative path from public directory
 * @returns Parsed JSON data
 */
async function fetchJSON<T>(path: string): Promise<T> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    throw error;
  }
}

/**
 * Loads the tour manifest which lists all available tours
 * @returns Promise resolving to tour manifest
 */
export async function loadTourManifest(): Promise<TourManifest> {
  return fetchJSON<TourManifest>(`${DATA_BASE_PATH}/tours/index.json`);
}

/**
 * Loads a specific tour by its filename
 * @param filename - Tour JSON filename (e.g., 'tour.json')
 * @returns Promise resolving to tour data
 */
export async function loadTour(filename: string): Promise<TourData> {
  return fetchJSON<TourData>(`${DATA_BASE_PATH}/tours/${filename}`);
}

/**
 * Loads a tour by its ID from the manifest
 * @param tourId - Tour ID (e.g., 'rome-01')
 * @returns Promise resolving to tour data
 */
export async function loadTourById(tourId: string): Promise<TourData> {
  const manifest = await loadTourManifest();
  const tourEntry = manifest.tours.find(t => t.id === tourId);

  if (!tourEntry) {
    throw new Error(`Tour with ID '${tourId}' not found in manifest`);
  }

  return loadTour(tourEntry.filename);
}

/**
 * Loads all available languages
 * @returns Promise resolving to array of languages
 */
export async function loadLanguages(): Promise<Language[]> {
  return fetchJSON<Language[]>(`${DATA_BASE_PATH}/languages.json`);
}

/**
 * Loads all available tours
 * @returns Promise resolving to array of all tour data
 */
export async function loadAllTours(): Promise<TourData[]> {
  const manifest = await loadTourManifest();
  const tourPromises = manifest.tours.map(entry => loadTour(entry.filename));
  return Promise.all(tourPromises);
}

/**
 * Data service with caching support
 */
export class DataService {
  private tourCache: Map<string, TourData> = new Map();
  private languageCache: Language[] | null = null;
  private manifestCache: TourManifest | null = null;

  /**
   * Loads tour with caching
   */
  async getTour(filename: string): Promise<TourData> {
    if (this.tourCache.has(filename)) {
      return this.tourCache.get(filename)!;
    }

    const tour = await loadTour(filename);
    this.tourCache.set(filename, tour);
    return tour;
  }

  /**
   * Loads tour by ID with caching
   */
  async getTourById(tourId: string): Promise<TourData> {
    const manifest = await this.getManifest();
    const tourEntry = manifest.tours.find(t => t.id === tourId);

    if (!tourEntry) {
      throw new Error(`Tour with ID '${tourId}' not found in manifest`);
    }

    return this.getTour(tourEntry.filename);
  }

  /**
   * Loads languages with caching
   */
  async getLanguages(): Promise<Language[]> {
    if (this.languageCache) {
      return this.languageCache;
    }

    this.languageCache = await loadLanguages();
    return this.languageCache;
  }

  /**
   * Loads manifest with caching
   */
  async getManifest(): Promise<TourManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    this.manifestCache = await loadTourManifest();
    return this.manifestCache;
  }

  /**
   * Clears all caches
   */
  clearCache(): void {
    this.tourCache.clear();
    this.languageCache = null;
    this.manifestCache = null;
  }

  /**
   * Clears specific tour from cache
   */
  clearTourCache(filename: string): void {
    this.tourCache.delete(filename);
  }
}

/**
 * Default singleton instance
 */
export const dataService = new DataService();
