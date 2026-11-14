/**
 * Stop fields that are not part of `STOP_TYPES[].fields`.
 *
 * `STOP_TYPES` drives `newStop()`, `isIncomplete()` and the translation editor, which
 * loop over every listed field, so what only the map or a nested editor handles is
 * described here instead. All of it is in `FIELD_CATALOG`.
 *
 * Array items are written `images[].url`.
 */
import type { FieldSpec } from './stopTypes.js';

/** On every stop type: where it is on the map, and its own marker. Edited on the map page, not in the stop form. */
export const STOP_MAP_FIELDS: FieldSpec[] = [
  { key: 'location.lat', label: 'Latitude', kind: 'number', help: 'Decimal degrees, -90 to 90. Only stops with a location get a marker.' },
  { key: 'location.lng', label: 'Longitude', kind: 'number', help: 'Decimal degrees, -180 to 180.' },
  { key: 'mapMarkerIcon', label: 'Custom marker image', kind: 'image', help: 'Replaces the marker for this stop only. Overrides the tour-wide marker.' },
];

/** The parts of the stops whose single field (`images`, `hotspots`) is a list of objects. */
export const STOP_NESTED_FIELDS: Record<string, FieldSpec[]> = {
  'image-gallery': [
    { key: 'images[].url', label: 'Image', kind: 'image', required: true },
    { key: 'images[].alt', label: 'Image description', kind: 'text', translatable: true, help: 'Read aloud by screen readers.' },
    { key: 'images[].caption', label: 'Caption', kind: 'text', translatable: true },
    { key: 'images[].credit', label: 'Photo credit', kind: 'text' },
  ],
  video: [
    { key: 'subtitles[].src', label: 'Subtitle file', kind: 'file', required: true, translatable: true, help: 'A WebVTT file (.vtt). On another website it must allow cross-origin requests (CORS).' },
    { key: 'subtitles[].srclang', label: 'Subtitle language', kind: 'text', required: true, help: 'A language code such as "en" or "pt-BR".' },
    { key: 'subtitles[].label', label: 'Subtitle name', kind: 'text', required: true, translatable: true, help: 'What the captions menu shows, e.g. "English".' },
  ],
  'image-hotspot': [
    { key: 'hotspots[].x', label: 'Horizontal position', kind: 'number', required: true, help: 'Percent of the image width, 0 to 100.' },
    { key: 'hotspots[].y', label: 'Vertical position', kind: 'number', required: true, help: 'Percent of the image height, 0 to 100.' },
    { key: 'hotspots[].title', label: 'Title', kind: 'text', required: true, translatable: true },
    { key: 'hotspots[].description', label: 'Description', kind: 'prose', translatable: true },
  ],
};
