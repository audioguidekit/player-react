/**
 * Every file a tour needs to work without a network: what "Download for offline" fetches into
 * the `tour-assets` cache. Pure, so a test can list what a tour would download.
 */
import type { TourData } from '../../types';
import { usableSubtitles } from '../video/subtitles';

export function extractTourAssetUrls(tour: TourData): string[] {
  const urls = new Set<string>();

  if (tour.image) urls.add(tour.image);
  if (tour.transitionAudio) urls.add(tour.transitionAudio);

  tour.stops.forEach((stop) => {
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
        usableSubtitles(stop.subtitles).forEach((track) => urls.add(track.src));
        break;
      case '3d-object':
        if (stop.modelUrl) urls.add(stop.modelUrl);
        break;
      case 'image-gallery':
        stop.images.forEach((img) => { if (img.url) urls.add(img.url); });
        break;
      case 'image-comparison':
        if (stop.before) urls.add(stop.before);
        if (stop.after) urls.add(stop.after);
        break;
      case 'image-hotspot':
        if (stop.image) urls.add(stop.image);
        break;
    }
  });

  return Array.from(urls);
}
