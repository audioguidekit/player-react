import { useState, useEffect, useCallback } from 'react';
import { TourData } from '../types';
import { storageService } from '../src/services/storageService';

interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

interface UseDownloadManagerReturn {
  isDownloading: boolean;
  isDownloaded: boolean;
  downloadProgress: DownloadProgress;
  startDownload: () => Promise<void>;
  error: string | null;
}

interface UseDownloadManagerOptions {
  onDownloadComplete?: () => void;
}

/**
 * Hook to manage offline tour downloads
 * Extracts all assets from tour data and caches them for offline use
 */
export const useDownloadManager = (
  tour: TourData | null,
  options?: UseDownloadManagerOptions
): UseDownloadManagerReturn => {
  const { onDownloadComplete } = options || {};
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    downloaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Check if tour is already downloaded
  useEffect(() => {
    const checkDownloadStatus = async () => {
      if (!tour) return;

      try {
        const downloaded = await storageService.isTourDownloaded(tour.id);
        setIsDownloaded(downloaded);
      } catch (err) {
        console.error('Failed to check download status:', err);
      }
    };

    checkDownloadStatus();
  }, [tour]);

  /**
   * Extract all asset URLs from tour data
   */
  const extractAssetUrls = useCallback((tourData: TourData): string[] => {
    const urls: Set<string> = new Set();

    // Add tour header image
    if (tourData.image) {
      urls.add(tourData.image);
    }

    // Extract assets from each stop
    tourData.stops.forEach((stop) => {
      switch (stop.type) {
        case 'audio':
          if (stop.image) urls.add(stop.image);
          if (stop.audioFile) urls.add(stop.audioFile);
          break;
        case 'image-text':
          if (stop.image) urls.add(stop.image);
          break;
        case 'video':
          if (stop.videoUrl) urls.add(stop.videoUrl);
          break;
        case '3d-object':
          if (stop.modelUrl) urls.add(stop.modelUrl);
          break;
      }
    });

    return Array.from(urls);
  }, []);

  /**
   * Download and cache a single asset
   */
  const downloadAsset = async (url: string, cache: Cache): Promise<boolean> => {
    try {
      console.log(`📥 Starting download for: ${url}`);

      // Check if already cached
      const cached = await cache.match(url);
      if (cached) {
        console.log(`✅ Asset already cached: ${url}`);
        return true;
      }

      // Fetch and cache the asset
      // Use cors mode explicitly to ensure we don't get opaque responses which break RangeRequests
      const response = await fetch(url, { mode: 'cors' });

      console.log(`🌐 Fetch status for ${url}: ${response.status} ${response.statusText}, type: ${response.type}`);

      if (!response.ok) {
        console.warn(`❌ Failed to fetch asset: ${url} (${response.status})`);
        return false;
      }

      if (response.type === 'opaque') {
        console.warn(`⚠️ Opaque response received for ${url}. Range requests will fail! Check CORS headers.`);
      }

      // Clone the response before caching (response can only be read once)
      await cache.put(url, response.clone());

      // Verify it was actually cached
      const verifyCache = await cache.match(url);
      if (verifyCache) {
        console.log(`✅ Successfully cached and verified: ${url}`);
        return true;
      } else {
        console.error(`❌ Cache put appeared to succeed but item not found in cache: ${url}`);
        return false;
      }
    } catch (err) {
      console.error(`❌ Error downloading asset ${url}:`, err);
      return false;
    }
  };

  /**
   * Start downloading all tour assets
   */
  const startDownload = useCallback(async () => {
    if (!tour || isDownloading || isDownloaded) {
      return;
    }

    // Check if Cache API is available (requires HTTPS or localhost)
    if (!('caches' in window)) {
      const errorMsg = 'Cache API not available. Offline downloads require HTTPS or localhost.';
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Extract all asset URLs
      const assetUrls = extractAssetUrls(tour);

      if (assetUrls.length === 0) {
        console.warn('No assets to download');
        setIsDownloading(false);
        return;
      }

      // Initialize progress
      setDownloadProgress({
        downloaded: 0,
        total: assetUrls.length,
        percentage: 0,
      });

      // Open cache
      const cache = await caches.open('tour-assets');

      // Download assets one by one (with progress tracking)
      let downloadedCount = 0;
      const successfullyDownloaded: string[] = [];

      for (const url of assetUrls) {
        const success = await downloadAsset(url, cache);

        if (success) {
          successfullyDownloaded.push(url);
        }

        downloadedCount++;

        // Update progress
        setDownloadProgress({
          downloaded: downloadedCount,
          total: assetUrls.length,
          percentage: Math.round((downloadedCount / assetUrls.length) * 100),
        });

        // Small delay to prevent overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate total size (approximate)
      let totalSize = 0;
      for (const url of successfullyDownloaded) {
        const cached = await cache.match(url);
        if (cached) {
          const blob = await cached.blob();
          totalSize += blob.size;
        }
      }

      // Mark tour as downloaded in IndexedDB
      await storageService.markTourDownloaded(
        tour.id,
        successfullyDownloaded,
        totalSize
      );

      setIsDownloaded(true);

      // Call completion callback if provided
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Download failed: ${errorMessage}`);
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [tour, isDownloading, isDownloaded, extractAssetUrls, onDownloadComplete]);

  return {
    isDownloading,
    isDownloaded,
    downloadProgress,
    startDownload,
    error,
  };
};
