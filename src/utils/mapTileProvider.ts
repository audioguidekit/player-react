export type MapProvider = 'openstreetmap' | 'mapbox' | 'jawg' | 'maptiler';

interface TileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
}

const OSM_FALLBACK: TileConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
};

const PROVIDERS: Record<MapProvider, (apiKey?: string, styleId?: string) => TileConfig> = {
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
};

export function getTileConfig(provider: MapProvider = 'openstreetmap', apiKey?: string, styleId?: string): TileConfig {
  return (PROVIDERS[provider] ?? PROVIDERS.openstreetmap)(apiKey, styleId);
}
