import { getDB } from './db';
import type { TourProgress, DownloadedTour, StopProgress } from './db';

export interface AppPreferences {
  selectedLanguage: string;
  theme?: 'light' | 'dark';
}

export class StorageService {
  // ============================================
  // Preferences (localStorage)
  // ============================================

  getPreferences(): AppPreferences {
    const stored = localStorage.getItem('app-preferences');
    return stored ? JSON.parse(stored) : { selectedLanguage: 'en' };
  }

  setPreferences(prefs: Partial<AppPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem('app-preferences', JSON.stringify(updated));
  }

  // ============================================
  // Tour Progress (IndexedDB)
  // ============================================

  async getTourProgress(tourId: string): Promise<TourProgress | null> {
    const db = await getDB();
    const progress = await db.get('tour-progress', tourId);
    return progress || null;
  }

  async getAllTourProgress(): Promise<TourProgress[]> {
    const db = await getDB();
    return db.getAll('tour-progress');
  }

  async updateStopProgress(
    tourId: string,
    stopId: string,
    data: Partial<StopProgress>,
    totalStops: number
  ): Promise<void> {
    const db = await getDB();
    let progress = await this.getTourProgress(tourId);

    if (!progress) {
      progress = {
        tourId,
        stops: {},
        overallProgress: 0,
        lastUpdated: new Date(),
      };
    }

    // Update the specific stop
    progress.stops[stopId] = {
      completed: progress.stops[stopId]?.completed || false,
      lastPlaybackPosition: progress.stops[stopId]?.lastPlaybackPosition || 0,
      ...data,
      lastPlayed: data.lastPlayed || new Date(),
    };

    progress.lastStopId = stopId;
    progress.lastUpdated = new Date();

    // Recalculate overall progress
    const completedCount = Object.values(progress.stops).filter(
      (s) => s.completed
    ).length;
    progress.overallProgress = totalStops > 0 ? (completedCount / totalStops) * 100 : 0;

    await db.put('tour-progress', progress);
  }

  async markStopCompleted(tourId: string, stopId: string, totalStops: number): Promise<void> {
    await this.updateStopProgress(
      tourId,
      stopId,
      {
        completed: true,
        lastPlayed: new Date(),
      },
      totalStops
    );
  }

  async clearTourProgress(tourId: string): Promise<void> {
    const db = await getDB();
    await db.delete('tour-progress', tourId);
  }

  async clearAllProgress(): Promise<void> {
    const db = await getDB();
    await db.clear('tour-progress');
  }

  // ============================================
  // Downloaded Tours (IndexedDB)
  // ============================================

  async getDownloadedTours(): Promise<DownloadedTour[]> {
    const db = await getDB();
    return db.getAll('downloaded-tours');
  }

  async getDownloadedTour(tourId: string): Promise<DownloadedTour | null> {
    const db = await getDB();
    const tour = await db.get('downloaded-tours', tourId);
    return tour || null;
  }

  async isTourDownloaded(tourId: string): Promise<boolean> {
    const tour = await this.getDownloadedTour(tourId);
    return tour !== null;
  }

  async markTourDownloaded(
    tourId: string,
    assets: string[],
    sizeBytes: number = 0
  ): Promise<void> {
    const db = await getDB();
    const download: DownloadedTour = {
      tourId,
      downloadedAt: new Date(),
      version: '1.0',
      cachedAssets: assets,
      sizeBytes,
    };
    await db.put('downloaded-tours', download);
  }

  async removeTourDownload(tourId: string): Promise<void> {
    const db = await getDB();

    // Get cached assets before deleting
    const downloaded = await db.get('downloaded-tours', tourId);

    // Delete from IndexedDB
    await db.delete('downloaded-tours', tourId);

    // Clear cached assets from service worker cache
    if (downloaded && 'caches' in window) {
      try {
        const cache = await caches.open('tour-assets');
        for (const url of downloaded.cachedAssets) {
          await cache.delete(url);
        }
      } catch (error) {
        console.error('Failed to clear cached assets:', error);
      }
    }
  }

  async clearAllDownloads(): Promise<void> {
    const db = await getDB();
    const downloads = await this.getDownloadedTours();

    // Clear all cached assets
    if ('caches' in window) {
      try {
        const cache = await caches.open('tour-assets');
        for (const download of downloads) {
          for (const url of download.cachedAssets) {
            await cache.delete(url);
          }
        }
      } catch (error) {
        console.error('Failed to clear cached assets:', error);
      }
    }

    // Clear IndexedDB
    await db.clear('downloaded-tours');
  }

  // ============================================
  // App State (IndexedDB)
  // ============================================

  async getAppState<T = any>(key: string): Promise<T | null> {
    const db = await getDB();
    const value = await db.get('app-state', key);
    return value || null;
  }

  async setAppState<T = any>(key: string, value: T): Promise<void> {
    const db = await getDB();
    await db.put('app-state', value, key);
  }

  async deleteAppState(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('app-state', key);
  }

  // ============================================
  // Utility Methods
  // ============================================

  async getTotalStorageUsed(): Promise<number> {
    if (!('estimate' in navigator.storage)) {
      return 0;
    }
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }

  async getStorageQuota(): Promise<number> {
    if (!('estimate' in navigator.storage)) {
      return 0;
    }
    const estimate = await navigator.storage.estimate();
    return estimate.quota || 0;
  }

  async getStoragePercentUsed(): Promise<number> {
    const usage = await this.getTotalStorageUsed();
    const quota = await this.getStorageQuota();
    if (quota === 0) return 0;
    return (usage / quota) * 100;
  }
}

// Export singleton instance
export const storageService = new StorageService();
