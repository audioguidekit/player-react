export type MapProvider = 'openfreemap' | 'openstreetmap' | 'mapbox' | 'jawg' | 'maptiler' | 'carto';

interface TileConfig {
  /** Raster {z}/{x}/{y} template, or a MapLibre style URL when `vector` is set. */
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  /** Rendered by MapLibre GL instead of Leaflet's raster TileLayer. */
  vector?: boolean;
}

const OSM_FALLBACK: TileConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
};

const PROVIDERS: Record<MapProvider, (apiKey?: string, styleId?: string) => TileConfig> = {
  // Keyless, quota-free vector tiles — the default so the map works on a bare checkout.
  openfreemap: (_apiKey, styleId = 'bright') => ({
    url: `https://tiles.openfreemap.org/styles/${styleId}`,
    attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © OpenStreetMap contributors',
    maxZoom: 20,
    vector: true,
  }),

  openstreetmap: () => OSM_FALLBACK,

  mapbox: (apiKey, styleId = 'mapbox/outdoors-v12') => apiKey ? {
    url: `https://api.mapbox.com/styles/v1/${styleId}/tiles/{z}/{x}/{y}?access_token=${apiKey}`,
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © OpenStreetMap',
    maxZoom: 22,
  } : OSM_FALLBACK,

  jawg: (apiKey, styleId = 'jawg-terrain') => apiKey ? {
    url: `https://tile.jawg.io/${styleId}/{z}/{x}/{y}.png?access-token=${apiKey}`,
    attribution: '© <a href="https://www.jawg.io">Jawg Maps</a> © OpenStreetMap',
    maxZoom: 22,
  } : OSM_FALLBACK,

  maptiler: (apiKey, styleId = 'outdoor-v2') => apiKey ? {
    url: `https://api.maptiler.com/maps/${styleId}/256/{z}/{x}/{y}.png?key=${apiKey}`,
    attribution: '© <a href="https://www.maptiler.com/">MapTiler</a> © OpenStreetMap',
    maxZoom: 22,
  } : OSM_FALLBACK,

  // Requires an API key since Aug 2026; keyless tiles render an "API KEY REQUIRED" watermark.
  carto: (apiKey, styleId = 'rastertiles/voyager') => apiKey ? {
    url: `https://{s}.basemaps.cartocdn.com/${styleId}/{z}/{x}/{y}.png?key=${apiKey}`,
    attribution: '© <a href="https://carto.com/">CARTO</a> © OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: 'abcd',
  } : OSM_FALLBACK,
};

/**
 * Resolves the basemap. A `styleUrl` (a MapLibre style.json, key included in the
 * URL if the vendor needs one) wins over everything — that's the escape hatch for
 * bringing your own map. Its attribution comes from the style's own sources, so
 * nothing needs to be declared alongside it.
 */
export function getTileConfig(
  provider: MapProvider = 'openfreemap',
  apiKey?: string,
  styleId?: string,
  styleUrl?: string,
): TileConfig {
  if (styleUrl) return { url: styleUrl, attribution: '', maxZoom: 22, vector: true };
  return (PROVIDERS[provider] ?? PROVIDERS.openfreemap)(apiKey, styleId || undefined);
}
