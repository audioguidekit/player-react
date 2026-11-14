/**
 * Map configuration, as documented in `docs/map.md`.
 *
 * These live on the map page rather than in tour settings: nearly all of them
 * are questions you can only answer while looking at a map, and two of them
 * (centre and zoom) are best answered by the map itself.
 *
 * Style ids are constrained per provider for the two providers the generated
 * schema constrains — pick a style the provider doesn't serve and
 * `bun run validate` fails, so the editor shouldn't offer it.
 */
import type { FieldSpec } from './stopTypes.js';

export interface MapProvider {
  value: string;
  label: string;
  /** Free and keyless, or needs an account. */
  needsKey: boolean;
  /** Style ids the provider serves. Empty = free-text (no fixed list). */
  styles: { value: string; label: string }[];
  defaultStyle?: string;
  note?: string;
}

export const MAP_PROVIDERS: MapProvider[] = [
  {
    value: 'openfreemap',
    label: 'OpenFreeMap',
    needsKey: false,
    defaultStyle: 'bright',
    note: 'No account, no quota. The only vector provider here — the rest are raster tiles.',
    styles: [
      { value: 'bright', label: 'Bright (default)' },
      { value: 'liberty', label: 'Liberty' },
      { value: 'positron', label: 'Positron (light)' },
      { value: 'fiord', label: 'Fiord' },
      { value: 'dark', label: 'Dark' },
    ],
  },
  {
    value: 'openstreetmap',
    label: 'OpenStreetMap',
    needsKey: false,
    note: 'No account needed.',
    styles: [],
  },
  {
    value: 'mapbox',
    label: 'Mapbox',
    needsKey: true,
    defaultStyle: 'mapbox/outdoors-v12',
    note: 'Needs an access token from mapbox.com.',
    styles: [],
  },
  {
    value: 'jawg',
    label: 'Jawg Maps',
    needsKey: true,
    defaultStyle: 'jawg-terrain',
    note: 'Needs an access token from jawg.io.',
    styles: [],
  },
  {
    value: 'maptiler',
    label: 'MapTiler',
    needsKey: true,
    defaultStyle: 'outdoor-v4',
    note: 'Needs an API key from maptiler.com.',
    styles: [],
  },
  {
    value: 'carto',
    label: 'CARTO',
    needsKey: true,
    defaultStyle: 'rastertiles/voyager',
    note: 'Needs an API key from carto.com.',
    styles: [
      { value: 'rastertiles/voyager', label: 'Voyager (default)' },
      { value: 'light_all', label: 'Light' },
      { value: 'dark_all', label: 'Dark' },
      { value: 'light_nolabels', label: 'Light, no labels' },
      { value: 'dark_nolabels', label: 'Dark, no labels' },
    ],
  },
];

export const mapProvider = (value: string): MapProvider | undefined =>
  MAP_PROVIDERS.find((p) => p.value === value);

export interface MapSection {
  title: string;
  description?: string;
  fields: FieldSpec[];
}

/**
 * Everything except the basemap picker, centre and zoom, which need the map
 * itself and are built into the page.
 */
export const MAP_SECTIONS: MapSection[] = [
  {
    title: 'Markers',
    fields: [
      {
        key: 'mapMarker', label: 'Marker style', kind: 'select', default: 'number',
        options: [
          { value: 'number', label: 'Numbered (default)' },
          { value: 'image', label: "The stop's image" },
          { value: 'empty', label: 'Plain dot' },
        ],
      },
      { key: 'mapMarkerIcon', label: 'Custom marker image', kind: 'image', help: 'Used for every marker, overriding the style above. A stop can still override it individually.' },
      { key: 'mapMarkerColors.upcoming', label: 'Not visited yet', kind: 'color' },
      { key: 'mapMarkerColors.completed', label: 'Visited', kind: 'color' },
      { key: 'mapMarkerColors.active', label: 'Playing now', kind: 'color' },
      { key: 'mapMarkerColors.cluster', label: 'Group of stops', kind: 'color' },
    ],
  },
  {
    title: 'Grouping',
    description: 'Nearby markers merge into one bubble until you zoom in.',
    fields: [
      { key: 'mapCluster.disableClusteringAtZoom', label: 'Stop grouping at zoom', kind: 'number', help: 'Above this zoom level every stop shows separately. 0–23.' },
      { key: 'mapCluster.spiderfyOnMaxZoom', label: 'Fan out overlapping stops', kind: 'boolean', defaultsOn: true, help: 'Tapping a group at full zoom spreads its stops apart.' },
    ],
  },
  {
    title: 'Route line',
    description: 'Drawn through the stops, or along the path you traced above.',
    fields: [
      { key: 'mapRoute.completedColor', label: 'Walked so far', kind: 'color' },
      { key: 'mapRoute.upcomingColor', label: 'Still ahead', kind: 'color' },
      { key: 'mapRoute.weight', label: 'Line width', kind: 'number', default: 3, help: 'In pixels. 3 by default.' },
      { key: 'mapRoute.opacity', label: 'Opacity', kind: 'number', default: 0.85, help: '0 to 1. The upcoming part draws at 75% of this.' },
      { key: 'mapRoute.dashArray', label: 'Dash pattern', kind: 'text', default: '8 6', help: 'For the part still ahead, e.g. "8 6".' },
      { key: 'mapRoute.minZoom', label: 'Hide below zoom', kind: 'number', default: 13, help: '13 by default.' },
    ],
  },
  {
    title: 'Controls',
    fields: [
      { key: 'mapLocateButton', label: 'Show the locate-me button', kind: 'boolean', defaultsOn: true },
    ],
  },
];

/**
 * The rest of the map settings: the basemap, the starting view and the route itself.
 * An editor may build dedicated controls for these (a provider picker, the map to pan and zoom,
 * the route tracer), so they are NOT in `MAP_SECTIONS`; they are described here, and in
 * FIELD_CATALOG, so a generated editor can offer them as plain fields.
 *
 * The style choices per provider are in {@link MAP_PROVIDERS}.
 */
export const MAP_PAGE_SECTIONS: MapSection[] = [
  {
    title: 'Basemap',
    fields: [
      {
        key: 'mapProvider', label: 'Map provider', kind: 'select', default: 'openfreemap',
        options: MAP_PROVIDERS.map((p) => ({ value: p.value, label: p.label })),
        help: 'Where the map tiles come from. Some providers need an account key.',
      },
      { key: 'mapStyleId', label: 'Map style', kind: 'text', help: 'A style the provider serves (see the provider\'s list). Blank uses its default.' },
      { key: 'mapStyle', label: 'Custom style URL', kind: 'url', help: 'A MapLibre style.json URL. Replaces the provider entirely.' },
      { key: 'mapApiKey', label: 'Provider API key', kind: 'text', help: 'For providers that need one. Visible to anyone who opens the tour, so use a key restricted to your domain.' },
    ],
  },
  {
    title: 'Starting view',
    description: 'Blank fits every stop in view.',
    fields: [
      { key: 'mapCenter.lat', label: 'Centre latitude', kind: 'number' },
      { key: 'mapCenter.lng', label: 'Centre longitude', kind: 'number' },
      { key: 'mapZoom', label: 'Zoom', kind: 'number', help: '0 (world) to 23 (street). Without a centre the map fits the stops instead.' },
    ],
  },
  {
    title: 'Route line',
    fields: [
      { key: 'mapRoute', label: 'Show the route', kind: 'boolean', defaultsOn: false, help: 'Draws a line through the stops, or along the path traced below, with progress.' },
      { key: 'mapRoute.geoJSON', label: 'Traced path', kind: 'geojson', help: 'A walking path drawn on the map. Without one the line joins the stops in order.' },
    ],
  },
];

export const MAP_FIELDS = MAP_SECTIONS.flatMap((s) => s.fields);

/**
 * `mapRoute` is `boolean | object` in the schema. The editor always writes the
 * object form once any styling is set, and `true` when the route is on but
 * unstyled — writing an empty object would be a third state meaning the same
 * as `true`.
 */
export function normalizeMapRoute(value: unknown): boolean | Record<string, unknown> | undefined {
  if (value === undefined || value === false) return undefined;
  if (value === true) return true;
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined && v !== '' && v !== null,
    );
    return entries.length === 0 ? true : Object.fromEntries(entries);
  }
  return undefined;
}
