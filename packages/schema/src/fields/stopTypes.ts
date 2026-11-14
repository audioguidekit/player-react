/**
 * What each of the player's 13 stop types actually contains.
 *
 * This is the one hand-maintained description of the content model for editors
 * (any editor built on this package). It drives the editor forms, the "add
 * a stop" picker and the defaults for a new stop — but NOT validation, which
 * always defers to the generated schemas in `../schemas/`. Keeping the two separate means a drift here produces a caught
 * validation error, never a silently malformed tour file.
 *
 * Field lists mirror `types.ts`. Required flags mirror the generated schema.
 */

import type { StopType } from '../types.js';
export type { StopType };

export type FieldKind =
  | 'text'        // single-line
  | 'prose'       // multi-line
  | 'richtext'    // multi-line, rendered as HTML by the player
  | 'audio'       // media picker: upload or URL
  | 'image'       // media picker: upload or URL
  | 'file'        // media picker for other assets (3D models, video)
  | 'url'         // plain URL, never uploaded (embeds)
  | 'select'
  | 'boolean'
  | 'color'
  | 'theme'       // picks from the themes the player has registered
  | 'fontstack'   // comma-separated font names, stored as an array
  | 'number'
  | 'gallery'     // array of { url, alt, caption, credit }
  | 'hotspots'    // array of { x, y, title, description }
  | 'geojson'     // a walking route: GeoJSON FeatureCollection with one LineString (edited on the map, stored whole)
  | 'localized'   // { <language code>: text }, one entry per language
  | 'tourlist'    // an ordered list of tour ids
  | 'stringlist'; // a list of short text values (e.g. hostnames), entered comma-separated or one per line, stored as an array of strings

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  /**
   * For `boolean` fields: what the player does when the key is absent, so an
   * untouched switch shows the behaviour the visitor actually gets. Taken from
   * the `(default: …)` comments on `TourMetadata` in types.ts.
   */
  defaultsOn?: boolean;
  /**
   * For non-boolean fields: the value the player uses when the key is absent
   * (the `(default: …)` comments in types.ts). Select defaults are the option
   * `value`, as a string.
   */
  default?: string | number;
  /**
   * Prose that differs per language. These are the fields the translation
   * editor shows side by side; everything else (URLs, coordinates, layout
   * flags) is shared and copied verbatim when a language is added.
   */
  translatable?: boolean;
}

export interface StopTypeSpec {
  type: StopType;
  label: string;
  description: string;
  /** Lucide icon name, resolved in the admin UI. */
  icon: string;
  fields: FieldSpec[];
}

/** Image fields repeat across several stop types with identical meaning. */
const imageCredits = (): FieldSpec[] => [
  { key: 'imageAlt', label: 'Image description', kind: 'text', translatable: true, help: 'Read aloud by screen readers. Describe what is in the picture.' },
  { key: 'imageCaption', label: 'Caption', kind: 'text', translatable: true },
  { key: 'imageCredit', label: 'Photo credit', kind: 'text' },
];

export const STOP_TYPES: StopTypeSpec[] = [
  {
    type: 'audio',
    label: 'Audio',
    description: 'A narrated stop. This is the main building block of a tour.',
    icon: 'Headphones',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, translatable: true },
      // Narration is recorded per language, so the audio file and its length
      // belong to the translation, not the stop. The shipped barcelona tour
      // proves it: en/01.mp3 vs de/01.mp3, "1:30 mins" vs "1:46 Min." — the
      // German recording is a different take, a different length, and even
      // spells the unit differently. Treating these as shared would overwrite
      // one language's narration the first time anyone edited another's.
      { key: 'audioFile', label: 'Audio', kind: 'audio', translatable: true, help: 'MP3 or M4A. Upload a file or paste a URL. Each language needs its own recording.' },
      { key: 'duration', label: 'Duration', kind: 'text', required: true, translatable: true, help: 'Shown on the card, e.g. "3:30 mins". Filled in automatically when you upload audio.' },
      { key: 'image', label: 'Image', kind: 'image', required: true },
      ...imageCredits(),
      { key: 'transcription', label: 'Transcript', kind: 'prose', translatable: true, help: 'Shown when the visitor turns on transcripts.' },
      { key: 'content', label: 'Extra text', kind: 'richtext', translatable: true },
    ],
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Written content with no audio.',
    icon: 'AlignLeft',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', translatable: true },
      { key: 'content', label: 'Text', kind: 'richtext', translatable: true },
    ],
  },
  {
    type: 'image-text',
    label: 'Image and text',
    description: 'A picture with written content beneath it.',
    icon: 'Image',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', translatable: true },
      { key: 'image', label: 'Image', kind: 'image', required: true },
      ...imageCredits(),
      { key: 'content', label: 'Text', kind: 'richtext', translatable: true },
    ],
  },
  {
    type: 'headline',
    label: 'Headline',
    description: 'A section divider between groups of stops.',
    icon: 'Heading',
    fields: [{ key: 'text', label: 'Headline', kind: 'text', required: true, translatable: true }],
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'A pulled quotation with attribution.',
    icon: 'Quote',
    fields: [
      { key: 'quote', label: 'Quote', kind: 'prose', required: true, translatable: true },
      { key: 'author', label: 'Author', kind: 'text', required: true, translatable: true },
      { key: 'year', label: 'Year', kind: 'text' },
    ],
  },
  {
    type: 'image-gallery',
    label: 'Gallery',
    description: 'Several images the visitor can swipe through.',
    icon: 'Images',
    fields: [
      { key: 'images', label: 'Images', kind: 'gallery', required: true },
      { key: 'caption', label: 'Caption', kind: 'text', translatable: true },
    ],
  },
  {
    type: 'image-comparison',
    label: 'Before and after',
    description: 'Two images with a slider between them.',
    icon: 'Columns2',
    fields: [
      { key: 'before', label: 'Before image', kind: 'image', required: true },
      { key: 'after', label: 'After image', kind: 'image', required: true },
      { key: 'beforeLabel', label: 'Before label', kind: 'text', translatable: true },
      { key: 'afterLabel', label: 'After label', kind: 'text', translatable: true },
      { key: 'caption', label: 'Caption', kind: 'text', translatable: true },
    ],
  },
  {
    type: 'image-hotspot',
    label: 'Hotspot image',
    description: 'An image with tappable points that reveal detail.',
    icon: 'MousePointerClick',
    fields: [
      { key: 'image', label: 'Image', kind: 'image', required: true },
      { key: 'imageAlt', label: 'Image description', kind: 'text', translatable: true },
      { key: 'hotspots', label: 'Hotspots', kind: 'hotspots', required: true },
      { key: 'caption', label: 'Caption', kind: 'text', translatable: true },
    ],
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A video file played inline.',
    icon: 'Video',
    fields: [
      // Like audio: a video carries a soundtrack, so each language needs its own.
      { key: 'videoUrl', label: 'Video', kind: 'file', required: true, translatable: true },
      { key: 'caption', label: 'Caption', kind: 'text', translatable: true },
    ],
  },
  {
    type: 'embed',
    label: 'Embed',
    description: 'YouTube, Spotify or another external player.',
    icon: 'Code',
    fields: [
      // A linked YouTube or Spotify item is usually language-specific too.
      { key: 'embedUrl', label: 'Embed URL', kind: 'url', required: true, translatable: true },
      {
        key: 'embedType', label: 'Kind', kind: 'select',
        options: [
          { value: 'youtube', label: 'YouTube' },
          { value: 'spotify', label: 'Spotify' },
          { value: 'video', label: 'Video file' },
          { value: 'generic', label: 'Other' },
        ],
      },
      { key: 'aspectRatio', label: 'Aspect ratio', kind: 'text', help: 'For example 16/9.' },
      { key: 'caption', label: 'Caption', kind: 'text', translatable: true },
    ],
  },
  {
    type: '3d-object',
    label: '3D object',
    description: 'A model the visitor can rotate.',
    icon: 'Box',
    fields: [
      { key: 'modelUrl', label: 'Model', kind: 'file', required: true, help: 'A .glb or .gltf file.' },
      { key: 'caption', label: 'Caption', kind: 'text', translatable: true },
    ],
  },
  {
    type: 'rating',
    label: 'Rating',
    description: 'Asks the visitor to rate the tour. Usually the last stop.',
    icon: 'Star',
    fields: [
      { key: 'question', label: 'Question', kind: 'text', translatable: true },
      { key: 'description', label: 'Description', kind: 'prose', translatable: true },
    ],
  },
  {
    type: 'email',
    label: 'Email capture',
    description: 'Collects a visitor email address.',
    icon: 'Mail',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', translatable: true },
      { key: 'description', label: 'Description', kind: 'prose', translatable: true },
      { key: 'placeholder', label: 'Field placeholder', kind: 'text', translatable: true },
      { key: 'buttonText', label: 'Button text', kind: 'text', translatable: true },
      { key: 'consentText', label: 'Consent checkbox text', kind: 'text', translatable: true, help: 'Adds a checkbox the visitor must tick before submitting. Leave empty for no checkbox.' },
    ],
  },
];

export const stopSpec = (type: string): StopTypeSpec | undefined =>
  STOP_TYPES.find((s) => s.type === type);

/** Fields whose value differs per language, for the translation editor. */
export const translatableKeys = (type: string): string[] =>
  (stopSpec(type)?.fields ?? []).filter((f) => f.translatable).map((f) => f.key);

/**
 * A new stop, with every required field present so the document stays
 * schema-valid the moment it is created. Required media and text start empty:
 * an empty string satisfies the schema, and the editor flags the stop as
 * incomplete rather than refusing to create it — blocking creation until a file
 * is uploaded would make adding ten stops needlessly serial.
 */
export function newStop(type: StopType, id: string): Record<string, unknown> {
  const stop: Record<string, unknown> = { id, type };
  for (const field of stopSpec(type)?.fields ?? []) {
    if (!field.required) continue;
    stop[field.key] = field.kind === 'gallery' || field.kind === 'hotspots' ? [] : '';
  }
  return stop;
}

/** True when a required field is still blank — surfaced as "needs attention". */
export function isIncomplete(stop: Record<string, any>): boolean {
  const spec = stopSpec(stop.type);
  if (!spec) return true;
  return spec.fields.some((f) => {
    if (!f.required) return false;
    const v = stop[f.key];
    return Array.isArray(v) ? v.length === 0 : !v;
  });
}
