/**
 * The part of `ThemeConfig` worth putting in front of a non-developer.
 *
 * ThemeConfig has roughly 180 leaves — every font size, every shadow, every
 * hover state. Exposing all of them would be a worse experience than the
 * TypeScript file it replaces. This is the subset that changes how a tour
 * *looks* to someone describing their brand, grouped the way they'd describe
 * it. Anything not listed keeps the value it inherits from Default light, and
 * anyone who needs the rest can still hand-write a theme in TypeScript.
 *
 * `key` is a dotted path into ThemeConfig.
 */
import type { FieldSpec } from './stopTypes.js';

export interface ThemeSection {
  title: string;
  description?: string;
  fields: FieldSpec[];
}

export const THEME_SECTIONS: ThemeSection[] = [
  {
    title: 'Brand',
    description: 'The colours a visitor notices first.',
    fields: [
      { key: 'buttons.primary.backgroundColor', label: 'Button colour', kind: 'color' },
      { key: 'buttons.primary.textColor', label: 'Button text', kind: 'color' },
      { key: 'header.backgroundColor', label: 'Header background', kind: 'color' },
      { key: 'header.textColor', label: 'Header text', kind: 'color' },
      { key: 'header.iconColor', label: 'Header icons', kind: 'color' },
      { key: 'header.progressBar.highlightColor', label: 'Progress bar', kind: 'color' },
    ],
  },
  {
    title: 'Page',
    fields: [
      { key: 'mainContent.backgroundColor', label: 'Page background', kind: 'color' },
      { key: 'colors.text.primary', label: 'Main text', kind: 'color' },
      { key: 'colors.text.secondary', label: 'Secondary text', kind: 'color' },
    ],
  },
  {
    title: 'Stop cards',
    fields: [
      { key: 'cards.backgroundColor', label: 'Card background', kind: 'color' },
      { key: 'cards.textColor', label: 'Card text', kind: 'color' },
      { key: 'cards.borderColor', label: 'Card border', kind: 'color' },
      { key: 'cards.borderRadius', label: 'Corner rounding', kind: 'text', help: 'A CSS length, e.g. 12px or 0.75rem.' },
    ],
  },
  {
    title: 'Player',
    fields: [
      { key: 'miniPlayer.backgroundColor', label: 'Player background', kind: 'color' },
      { key: 'miniPlayer.textColor', label: 'Player text', kind: 'color' },
      { key: 'miniPlayer.controls.playButtonBackground', label: 'Play button', kind: 'color' },
      { key: 'miniPlayer.controls.playButtonIcon', label: 'Play icon', kind: 'color' },
      { key: 'miniPlayer.progressBar.highlightColor', label: 'Player progress', kind: 'color' },
    ],
  },
  {
    title: 'Logo',
    fields: [
      { key: 'branding.logoUrl', label: 'Logo', kind: 'image', help: 'Shown in the header.' },
      { key: 'branding.showLogoBorder', label: 'Show a border around the logo', kind: 'boolean', defaultsOn: true },
      {
        key: 'branding.logoSize', label: 'Logo size', kind: 'select',
        options: [
          { value: 'fit', label: 'Fit to 48×48' },
          { value: 'original', label: 'Original size' },
        ],
      },
    ],
  },
  {
    title: 'Type',
    description: 'Names of the bundled fonts: Inter, IBM Plex Sans, Space Grotesk, JetBrains Mono. Others fall back to the next in the list.',
    fields: [
      { key: 'typography.fontFamily.sans', label: 'Body font', kind: 'fontstack', help: 'Comma-separated, most preferred first.' },
      { key: 'typography.fontFamily.heading', label: 'Heading font', kind: 'fontstack', help: 'Leave blank to use the body font.' },
    ],
  },
  {
    title: 'Map markers',
    fields: [
      { key: 'mapMarkers.active.backgroundColor', label: 'Current stop', kind: 'color' },
      { key: 'mapMarkers.inactive.backgroundColor', label: 'Upcoming stops', kind: 'color' },
      { key: 'mapMarkers.completed.backgroundColor', label: 'Visited stops', kind: 'color' },
      { key: 'mapMarkers.route.completedColor', label: 'Route walked', kind: 'color' },
      { key: 'mapMarkers.route.upcomingColor', label: 'Route ahead', kind: 'color' },
    ],
  },
];

/**
 * The theme's own identity. The id is assigned when the theme is created and is not a field.
 * `extends` is what the theme starts from: a built-in theme or another custom theme.
 */
export const THEME_IDENTITY_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Name', kind: 'text', help: 'Shown in theme pickers.' },
  { key: 'description', label: 'Description', kind: 'prose' },
  { key: 'extends', label: 'Based on', kind: 'theme', default: 'default-light', help: 'Everything this theme does not set is inherited from it. A built-in theme, or another custom theme (no loops).' },
];

export const THEME_FIELDS: FieldSpec[] = THEME_SECTIONS.flatMap((s) => s.fields);

/** Read a dotted path out of a nested object. */
export function getPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<any>((node, key) => (node == null ? undefined : node[key]), source);
}

/**
 * Write a dotted path into a nested object, creating objects on the way.
 * Passing `undefined` removes the leaf and any object it leaves empty, so a
 * cleared field disappears from the file instead of pinning an inherited value.
 */
export function setPath(target: Record<string, any>, path: string, value: unknown): void {
  const keys = path.split('.');
  const leaf = keys.pop()!;
  const chain: Record<string, any>[] = [target];

  let node = target;
  for (const key of keys) {
    if (node[key] == null || typeof node[key] !== 'object') node[key] = {};
    node = node[key];
    chain.push(node);
  }

  if (value === undefined || value === '' || value === null) delete node[leaf];
  else node[leaf] = value;

  // Drop containers that are now empty, so clearing the last colour in a
  // section doesn't leave `"mapMarkers": { "route": {} }` behind.
  for (let i = chain.length - 1; i > 0; i--) {
    if (Object.keys(chain[i]).length === 0) delete chain[i - 1][keys[i - 1]];
  }
}
