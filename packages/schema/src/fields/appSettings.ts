/**
 * The app-level settings (`app.json`, `manifest.app`): the landing screen that lists
 * the tours, and the identity the installed app takes on a phone's home screen.
 *
 * Grouped by what the owner is deciding. Only the grouping and wording live here;
 * validation is the generated `app-config.schema.json`. Every field is optional.
 */
import type { FieldSpec } from './stopTypes.js';

export interface AppSection {
  title: string;
  description?: string;
  fields: FieldSpec[];
}

export const APP_SECTIONS: AppSection[] = [
  {
    title: 'Landing screen',
    description: 'What visitors see before they pick a tour.',
    fields: [
      { key: 'title', label: 'Heading', kind: 'localized', translatable: true, help: 'One text per language. Without one the built-in "Choose a tour" is used.' },
      { key: 'subtitle', label: 'Subheading', kind: 'localized', translatable: true },
      { key: 'logo', label: 'Logo', kind: 'image', help: 'Shown in the header.' },
      { key: 'hero', label: 'Background image', kind: 'image', help: 'Fills the screen behind the tour list.' },
      { key: 'themeId', label: 'Theme', kind: 'theme', help: 'Colours and fonts of the landing screen. Defaults to the first tour\'s theme.' },
      { key: 'statusBarColor', label: 'Browser bar colour', kind: 'color', help: 'The phone\'s status bar and browser chrome on the landing screen. Defaults to the theme\'s header colour.' },
      { key: 'defaultLanguage', label: 'Default language', kind: 'text', help: 'A language code such as "en". Used until the visitor picks one.' },
      { key: 'tourOrder', label: 'Tour order', kind: 'tourlist', help: 'Tours not listed follow in the order they were added.' },
    ],
  },
  {
    title: 'Intro splash',
    description: 'A full-screen image or video shown first; the visitor taps to continue.',
    fields: [
      { key: 'splash', label: 'Splash image or video', kind: 'image' },
      { key: 'splashArrowColor', label: 'Arrow colour', kind: 'color', default: '#ffffff', help: 'The "continue" hint on the splash.' },
    ],
  },
  {
    title: 'Tour cards',
    description: 'What each card in the tour list shows. Applies to every tour.',
    fields: [
      { key: 'tourCard.showImage', label: 'Cover image', kind: 'boolean', defaultsOn: true },
      { key: 'tourCard.showDescription', label: 'Description', kind: 'boolean', defaultsOn: true },
      { key: 'tourCard.showMeta', label: 'Duration and number of stops', kind: 'boolean', defaultsOn: true },
    ],
  },
  {
    title: 'Installed app',
    description: 'How the app looks once a visitor adds it to their home screen.',
    fields: [
      { key: 'name', label: 'App name', kind: 'text', help: 'Under the home-screen icon and in the install prompt.' },
      { key: 'shortName', label: 'Short name', kind: 'text', help: 'Used where space is tight. Defaults to the app name.' },
      { key: 'description', label: 'Description', kind: 'prose', help: 'Shown in the install prompt.' },
      { key: 'icon', label: 'Icon', kind: 'image', help: 'A square image; the home-screen icon set is generated from it.' },
      { key: 'themeColor', label: 'Theme colour', kind: 'color', help: 'The colour of the browser or system chrome around the installed app.' },
      { key: 'backgroundColor', label: 'Splash background', kind: 'color', help: 'Shown while the installed app starts.' },
      {
        key: 'display', label: 'Framing', kind: 'select', default: 'standalone',
        options: [
          { value: 'standalone', label: 'Standalone (no browser bar)' },
          { value: 'minimal-ui', label: 'Minimal browser controls' },
          { value: 'browser', label: 'In a browser tab' },
          { value: 'fullscreen', label: 'Full screen' },
        ],
      },
      {
        key: 'orientation', label: 'Orientation', kind: 'select', default: 'portrait',
        options: [
          { value: 'portrait', label: 'Portrait' },
          { value: 'landscape', label: 'Landscape' },
          { value: 'any', label: 'Either way' },
        ],
      },
    ],
  },
  {
    title: 'Embeds',
    description: 'Which websites an embed stop may show.',
    fields: [
      {
        key: 'embedAllowlist',
        label: 'Allowed embed websites',
        kind: 'stringlist',
        help: 'Hostnames such as "maps.example.org", or "*.example.org" for all its subdomains. When there are entries, other websites\' generic embeds are replaced by a notice. YouTube, Spotify and video embeds are not affected. Leave empty for no limit.',
      },
    ],
  },
  {
    title: 'Privacy',
    description: 'Anonymous usage counts. No cookies, no personal data.',
    fields: [
      {
        key: 'analytics',
        label: 'Anonymous usage analytics',
        kind: 'boolean',
        defaultsOn: true,
        help: 'Counts visits, stop views and listening time. Visitors who send Global Privacy Control or Do Not Track are never counted.',
      },
    ],
  },
];

export const APP_FIELDS: FieldSpec[] = APP_SECTIONS.flatMap((s) => s.fields);
