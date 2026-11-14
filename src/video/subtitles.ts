/**
 * Subtitles of a video stop. The schema is the publisher's gate; the player still refuses an
 * entry it cannot use (a manifest installed through the live preview is not schema-checked).
 */
import type { VideoSubtitle } from '../../types';

const LANGUAGE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

/** The subtitle entries that have a file, a valid language code and a name for the captions menu. */
export function usableSubtitles(subtitles: VideoSubtitle[] | undefined): VideoSubtitle[] {
  if (!Array.isArray(subtitles)) return [];
  return subtitles.filter(
    (track) =>
      !!track &&
      typeof track.src === 'string' &&
      track.src.trim() !== '' &&
      typeof track.srclang === 'string' &&
      LANGUAGE.test(track.srclang) &&
      typeof track.label === 'string' &&
      track.label.trim() !== '',
  );
}

/**
 * A subtitle file on another origin is only fetched when the video element has `crossorigin`
 * set. True when any file is cross-origin, so the card sets it (and no other video is touched).
 */
export function subtitlesNeedCors(subtitles: VideoSubtitle[], pageUrl: string): boolean {
  return subtitles.some((track) => {
    try {
      return new URL(track.src, pageUrl).origin !== new URL(pageUrl).origin;
    } catch {
      return false;
    }
  });
}
