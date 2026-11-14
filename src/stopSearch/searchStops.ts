/**
 * Searching the stop list. Pure functions: what text of a stop is searched, how a query is
 * compared, and which stops stay. The stop list component owns the input and the live region.
 */
import type { Stop } from '../../types';

/** A tour with more stops than this gets a search field (tour setting `stopSearchThreshold`). */
export const DEFAULT_STOP_SEARCH_THRESHOLD = 8;

/** The tour's threshold, falling back to the default for a missing or unusable value. */
export function stopSearchThreshold(setting: unknown): number {
  return typeof setting === 'number' && Number.isFinite(setting) && setting >= 0 ? Math.floor(setting) : DEFAULT_STOP_SEARCH_THRESHOLD;
}

/** True when a tour with `stopCount` stops gets the search field: strictly more than the threshold. */
export const showsStopSearch = (stopCount: number, setting: unknown): boolean => stopCount > stopSearchThreshold(setting);

/** Lower case, accents removed, tags and whitespace collapsed: "Café <b>Güell</b>" matches "cafe guell". */
export function normalizeForSearch(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every piece of visitor-facing text of a stop, one string. URLs, ids and layout flags are not searched. */
export function stopSearchText(stop: Stop): string {
  const parts: (string | undefined)[] = [];
  switch (stop.type) {
    case 'audio':
      parts.push(stop.title, stop.content, stop.transcription, stop.imageAlt, stop.imageCaption);
      break;
    case 'text':
      parts.push(stop.title, stop.content);
      break;
    case 'image-text':
      parts.push(stop.title, stop.content, stop.imageAlt, stop.imageCaption);
      break;
    case 'headline':
      parts.push(stop.text);
      break;
    case 'quote':
      parts.push(stop.quote, stop.author, stop.year);
      break;
    case 'rating':
      parts.push(stop.question, stop.description);
      break;
    case 'email':
      parts.push(stop.title, stop.description);
      break;
    case 'image-gallery':
      parts.push(stop.caption, ...stop.images.flatMap((image) => [image.alt, image.caption]));
      break;
    case 'image-comparison':
      parts.push(stop.caption, stop.beforeLabel, stop.afterLabel);
      break;
    case 'image-hotspot':
      parts.push(stop.caption, stop.imageAlt, ...stop.hotspots.flatMap((spot) => [spot.title, spot.description]));
      break;
    case 'video':
    case '3d-object':
    case 'embed':
      parts.push(stop.caption);
      break;
  }
  return normalizeForSearch(parts.filter((part): part is string => !!part).join(' '));
}

/**
 * Does the stop match the query? Every word of the query must appear somewhere in the stop's
 * text (so "gaudi park" finds a stop that mentions both, in any order). An empty query matches all.
 */
export function stopMatches(stop: Stop, query: string): boolean {
  const words = normalizeForSearch(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const text = stopSearchText(stop);
  return words.every((word) => text.includes(word));
}

/** Fill `{name}` placeholders of an interface text. */
export const fillText = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
