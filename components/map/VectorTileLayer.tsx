import { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import '@maplibre/maplibre-gl-leaflet';

// MapLibre resolves its worker at runtime from `import.meta.url`, which the
// bundler can't see — so the worker asset is never emitted and tiles silently
// never decode (blank basemap, no error). Point it at the bundled worker.
setWorkerUrl(maplibreWorkerUrl);

interface VectorTileLayerProps {
  /** MapLibre style URL (e.g. https://tiles.openfreemap.org/styles/bright). */
  styleUrl: string;
  /** Omit for a bring-your-own style — attribution is then read from the style. */
  attribution?: string;
}

/**
 * Renders a MapLibre GL vector style inside the Leaflet map. Falls back to raster
 * OpenStreetMap tiles if MapLibre can't start (no WebGL, blocked context).
 */
export const VectorTileLayer: React.FC<VectorTileLayerProps> = ({ styleUrl, attribution }) => {
  const map = useMap();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    let layer: L.MaplibreGL | undefined;
    try {
      // The binding's own getAttribution() joins every source's credit without
      // deduping — three identical "© Vendor © OpenStreetMap" on a typical style.
      // Opt out and register attribution below instead.
      layer = L.maplibreGL({ style: styleUrl, attributionControl: false });
      layer.addTo(map);
    } catch (err) {
      console.error('[map] MapLibre failed to initialise, falling back to raster tiles', err);
      setFailed(true);
      return;
    }

    // The Leaflet binding suppresses MapLibre's own attribution control, so feed
    // Leaflet's instead. A custom style declares attribution on its sources (and
    // TileJSON-backed sources only resolve it once loaded) — read it from there so
    // bringing your own map never means silently dropping the data credit.
    let cancelled = false;
    const added: string[] = [];
    // A style and the TileJSON its source resolves to usually carry the same credit
    // with different markup (`&copy;` vs `©`, differing link attrs), which Leaflet
    // would list twice. Compare rendered text — DOMParser is inert, so parsing the
    // untrusted-ish style attribution here neither runs script nor loads anything.
    const seen = new Set<string>();
    const add = (html?: unknown) => {
      if (cancelled || typeof html !== 'string') return;
      const text = (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      added.push(html);
      map.attributionControl?.addAttribution(html);
    };

    if (attribution) {
      add(attribution);
    } else {
      const gl = layer.getMaplibreMap();
      gl.once('load', () => {
        Object.values(gl.getStyle()?.sources ?? {}).forEach((source) =>
          add((source as { attribution?: string }).attribution),
        );
      });
    }

    return () => {
      cancelled = true;
      added.forEach((html) => map.attributionControl?.removeAttribution(html));
      map.removeLayer(layer);
    };
  }, [map, styleUrl, attribution, failed]);

  if (failed) {
    return (
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
        maxZoom={19}
      />
    );
  }
  return null;
};
