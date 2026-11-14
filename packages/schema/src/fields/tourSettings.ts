/**
 * The tour-level settings, grouped.
 *
 * `TourMetadata` is ~35 mostly-optional flags. Presented as one flat list it
 * reads as a config dump; grouped by the question each one answers, it reads as
 * a settings screen. Only the grouping and the wording live here — validation
 * is still the generated `tour-metadata.schema.json`.
 *
 * Every field is optional in the schema, and an editor should delete rather than write
 * a default, so an untouched setting stays absent from metadata.json and the
 * file stays short enough to read by hand.
 */
import type { FieldSpec } from './stopTypes.js';

export interface SettingsSection {
  title: string;
  description?: string;
  /** Fields stored in metadata.json, shared by every language. */
  fields: FieldSpec[];
}

/**
 * Title, description and total duration live in the *language* file, not
 * metadata, because they are translated. The settings page edits them
 * separately for the currently selected language.
 */
export const TOUR_CONTENT_FIELDS: FieldSpec[] = [
  { key: 'title', label: 'Title', kind: 'text', required: true, translatable: true, help: 'Shown on the start screen.' },
  { key: 'description', label: 'Description', kind: 'prose', required: true, translatable: true },
  { key: 'totalDuration', label: 'Total duration', kind: 'text', required: true, translatable: true, help: 'Free text, e.g. "45 mins". Shown on the start screen and the tour card.' },
  { key: 'image', label: 'Cover image', kind: 'image', help: 'The hero image on the start screen.' },
];

/**
 * A tour setting the settings page does not render as a field, because the language
 * manager owns it. Described here (and in FIELD_CATALOG) so every editor can find it.
 */
export const TOUR_EXTRA_FIELDS: FieldSpec[] = [
  { key: 'defaultLanguage', label: 'Default language', kind: 'text', help: 'A language code such as "en". Shown first, and used when the visitor\'s language is not offered.' },
];

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Appearance',
    fields: [
      { key: 'themeId', label: 'Theme', kind: 'theme', help: 'Colours, fonts and logo.' },
      {
        key: 'imageColor', label: 'Background colour', kind: 'color',
        help: 'Fills the status bar area, and the start screen when there is no cover image.',
      },
    ],
  },
  {
    title: 'Offline',
    description: 'Visitors can download a tour to play it without a signal.',
    fields: [
      {
        key: 'offlineMode', label: 'Downloading', kind: 'select', default: 'optional',
        options: [
          { value: 'optional', label: 'Offer a download (recommended)' },
          { value: 'offline-only', label: 'Require a download before playing' },
          { value: 'online-only', label: 'No download — always stream' },
        ],
        help: 'Require a download for places with no signal; stream only if you change the content often.',
      },
    ],
  },
  {
    title: 'Playback',
    fields: [
      { key: 'transitionAudio', label: 'Transition sound', kind: 'audio', help: 'Played between stops.' },
      { key: 'transcriptAvailable', label: 'Offer transcripts', kind: 'boolean', defaultsOn: false, help: 'Lets visitors read along. Only useful if your stops have transcripts.' },
      { key: 'fullscreenPlayer', label: 'Open a full-screen player', kind: 'boolean', defaultsOn: false, help: 'Tapping a stop fills the screen instead of using the bar at the bottom.' },
      { key: 'showTextSize', label: 'Text size control', kind: 'boolean', defaultsOn: true, help: 'Lets visitors make stop texts, transcripts and titles larger (three steps). Their choice is remembered on their device and adds to the phone\'s own text size setting.' },
      { key: 'showPlaybackSpeed', label: 'Playback speed control', kind: 'boolean', defaultsOn: true, help: 'Lets visitors listen at 0.75x to 2x. Their choice is remembered on their device. Turn off to always play at normal speed.' },
      { key: 'hapticsEnabled', label: 'Vibration feedback', kind: 'boolean', defaultsOn: true, help: 'On by default.' },
    ],
  },
  {
    title: 'What visitors see',
    fields: [
      {
        key: 'showStopImage', label: 'Stop images', kind: 'select', default: 'true',
        options: [
          { value: 'true', label: 'Full-width picture' },
          { value: 'thumbnail', label: 'Small thumbnail' },
          { value: 'false', label: 'No picture' },
        ],
      },
      { key: 'showStopDuration', label: 'Show each stop\'s length', kind: 'boolean', defaultsOn: true },
      { key: 'showStopNumber', label: 'Number the stops', kind: 'boolean', defaultsOn: true },
      { key: 'showProgressBar', label: 'Show a progress bar', kind: 'boolean', defaultsOn: true },
      { key: 'stopSearchThreshold', label: 'Show stop search from', kind: 'number', default: 8, help: 'A search field appears above the stop list when the tour has more stops than this. It looks through titles and text. Use a very large number to never show it.' },
      { key: 'showLanguageLabel', label: 'Name the language next to its flag', kind: 'boolean', defaultsOn: true },
      // On unless explicitly false — the player checks `collectFeedback !== false`.
      { key: 'collectFeedback', label: 'Ask visitors to rate the tour', kind: 'boolean', defaultsOn: true, help: 'Shows a rating button on the start screen and keeps rating stops in the tour. Turn off to remove both.' },
    ],
  },
  {
    title: 'Map',
    description: 'Stops need coordinates before they appear on a map.',
    fields: [
      { key: 'listView', label: 'List view', kind: 'boolean', defaultsOn: true, help: 'On by default. Turning both views off leaves nothing to show.' },
      { key: 'showDirections', label: 'Directions button', kind: 'boolean', defaultsOn: true, help: 'Stops with coordinates get a "Directions" button that opens Google Maps, Apple Maps or Waze. It works without the map view.' },
      { key: 'mapView', label: 'Map view', kind: 'boolean', defaultsOn: false, help: 'Off by default. Only audio stops get a marker.' },
    ],
  },
];

/**
 * `showStopImage` is `boolean | 'thumbnail'` in the schema, so the three-way
 * picker has to round-trip through strings.
 */
export const decodeSetting = (key: string, value: string): unknown => {
  if (key === 'showStopImage') {
    return value === 'true' ? true : value === 'false' ? false : value;
  }
  return value;
};

export const encodeSetting = (key: string, value: unknown): string =>
  key === 'showStopImage' ? String(value) : String(value ?? '');
