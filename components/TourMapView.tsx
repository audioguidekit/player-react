import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import tw from 'twin.macro';
import styled, { useTheme } from 'styled-components';
import { Stop, MapRouteConfig, RouteGeoJSON } from '../types';
import { getTileConfig, MapProvider } from '../src/utils/mapTileProvider';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ThemeConfig } from '../src/theme/types';
import { MapLocateButton, UserLocationLayer, useUserLocation } from './map/MapLocateButton';
import { MapRoute } from './map/MapRoute';
import { VectorTileLayer } from './map/VectorTileLayer';

interface TourMapViewProps {
  stops: Stop[];
  currentStopId: string | null;
  isStopCompleted: (stopId: string) => boolean;
  onStopClick: (stopId: string) => void;
  mapProvider?: MapProvider;
  mapStyle?: string;
  mapApiKey?: string;
  mapStyleId?: string;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
  mapMarker?: 'number' | 'image' | 'empty';
  mapMarkerIcon?: string;
  mapCluster?: {
    disableClusteringAtZoom?: number;
    spiderfyOnMaxZoom?: boolean;
  };
  mapRoute?: boolean | MapRouteConfig;
  onRequestListView?: () => void;
  showLocateButton?: boolean;
  active?: boolean; // false when the map is mounted but hidden (list view) — suppresses portaled controls
}

// ─── Styled components ────────────────────────────────────────────────────────

const MapWrapper = styled.div`
  ${tw`flex-1 w-full relative overflow-hidden`}
  height: 100%;
`;

const OfflinePlaceholder = styled.div`
  ${tw`flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 14px;
  height: 100%;
`;

const OfflineTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ViewListButton = styled.button`
  ${tw`px-4 py-2 rounded-full text-sm font-medium transition-colors`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const NoLocationsPlaceholder = styled.div`
  ${tw`flex-1 flex items-center justify-center`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 14px;
  height: 100%;
`;

// Portaled into #map-controls-portal (InnerFrame-relative, z-75, pointer-events:none).
// --btn-bottom is written in real-time by MiniPlayer (ResizeObserver + yDrag).
const ControlsOverlay = styled.div`
  position: absolute;
  bottom: var(--btn-bottom, 12px);
  right: 12px;
  pointer-events: all;
`;

// ─── Internal sub-components (require MapContainer context) ───────────────────

// Leaflet 1.9 removed the Tap handler that synthesised dblclick from touch.
// With user-scalable=no enforced, browsers also skip dblclick synthesis.
// This component re-implements double-tap zoom around the tap point.
const MapDoubleTapZoom: React.FC = () => {
  const map = useMap();
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const container = map.getContainer();

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const now = Date.now();
      const prev = lastTapRef.current;

      if (prev && now - prev.time < 300 && Math.abs(touch.clientX - prev.x) < 30 && Math.abs(touch.clientY - prev.y) < 30) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
        map.setZoomAround(point, map.getZoom() + 1, { animate: true });
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
      }
    };

    container.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => container.removeEventListener('touchend', onTouchEnd);
  }, [map]);

  return null;
};

interface MapInitialCameraProps {
  locations: Array<{ lat: number; lng: number }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  activeLocation?: { lat: number; lng: number } | null;
}

// Owns the map's single initial camera placement, by precedence:
//   explicit mapCenter  >  active stop (deep link / resume)  >  fit all stops.
// currentStopId — and so activeLocation — is populated asynchronously (useDeepLink
// / useAutoResume set it after mount). So when no target is known yet, the fit-all
// fallback is deferred one frame; if an active stop lands first it claims the
// camera, avoiding the old fit-bounds-then-fly-to double move. place() re-reads the
// latest activeLocation via a ref, so the deferral is timing-safe. Fires once.
const MapInitialCamera: React.FC<MapInitialCameraProps> = ({ locations, center, zoom, activeLocation }) => {
  const map = useMap();
  const placedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const activeLocationRef = useRef(activeLocation);
  activeLocationRef.current = activeLocation;

  useEffect(() => {
    if (placedRef.current || locations.length === 0) return;

    const place = () => {
      if (placedRef.current) return;
      placedRef.current = true;
      const active = activeLocationRef.current;
      if (center) {
        map.setView([center.lat, center.lng], zoom ?? 13);
      } else if (active) {
        map.setView([active.lat, active.lng], zoom ?? 15);
      } else if (locations.length === 1) {
        map.setView([locations[0].lat, locations[0].lng], zoom ?? 15);
      } else {
        const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
        map.fitBounds(bounds, { padding: [48, 48] });
        // Honor an explicit zoom over the fitBounds-calculated one
        if (zoom !== undefined) map.setZoom(zoom);
      }
    };

    // A known target (explicit center or an already-resolved active stop) places
    // immediately — one move, no animation race.
    if (center || activeLocation) {
      place();
      return;
    }

    // No target yet — defer the fit-all fallback one frame so a late active stop
    // can win. If it arrives, this effect re-runs (cleanup cancels the pending
    // frame) and the branch above places at the stop instead.
    rafRef.current = requestAnimationFrame(place);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [map, locations, center, zoom, activeLocation]);

  return null;
};

// Wraps marker inner HTML in the shared 44×44 tap target (keeps tap dimensions
// consistent across all icon variants).
const divIcon44 = (inner: string): L.DivIcon =>
  L.divIcon({
    html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer">${inner}</div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

interface MapMarkersProps {
  stops: Stop[];
  currentStopId: string | null;
  isStopCompleted: (stopId: string) => boolean;
  onStopClick: (stopId: string) => void;
  theme: ThemeConfig;
  markerIcon?: string;
  markerMode?: 'number' | 'image' | 'empty';
  clusterConfig?: TourMapViewProps['mapCluster'];
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  stops, currentStopId, isStopCompleted, onStopClick, theme, markerIcon, markerMode = 'number', clusterConfig,
}) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; index: number; visualKey: string }>>(new Map());

  // Volatile inputs are read inside the stable icon builder via refs. Without this,
  // frequent parent re-renders (audio position saves recreate isStopCompleted every
  // few seconds) would change createStopIcon → tear down and rebuild the whole marker
  // layer → image <img> markers re-fetch/decode → visible blink.
  const onStopClickRef = useRef(onStopClick);
  const isStopCompletedRef = useRef(isStopCompleted);
  const currentStopIdRef = useRef(currentStopId);
  const themeRef = useRef(theme);
  const markerModeRef = useRef(markerMode);
  const markerIconRef = useRef(markerIcon);
  onStopClickRef.current = onStopClick;
  isStopCompletedRef.current = isStopCompleted;
  currentStopIdRef.current = currentStopId;
  themeRef.current = theme;
  markerModeRef.current = markerMode;
  markerIconRef.current = markerIcon;

  // Encodes everything that changes a stop's icon, so we only repaint when it changes.
  const iconStateKey = (stop: Stop): string => {
    if (stop.mapMarkerIcon || markerIcon) return `custom:${stop.mapMarkerIcon || markerIcon}`;
    const a = stop.id === currentStopId ? 'a' : '';
    const c = isStopCompleted(stop.id) ? 'c' : '';
    return `${markerMode}:${a}${c}`;
  };
  const completedKey = stops.map(s => (s.type === 'audio' && isStopCompleted(s.id) ? '1' : '0')).join('');

  // Stable across renders: all dynamic state is read from refs at call time.
  const createStopIcon = useCallback(
    (stop: Stop, index: number): L.DivIcon => {
      const markerIcon = markerIconRef.current;
      const currentStopId = currentStopIdRef.current;
      const isStopCompleted = isStopCompletedRef.current;
      const theme = themeRef.current;
      const markerMode = markerModeRef.current;

      // Custom image marker: stop-level overrides tour-level; no number, no state variants
      const resolvedIcon = stop.mapMarkerIcon || markerIcon;
      if (resolvedIcon) {
        return divIcon44(`<img src="${resolvedIcon}" style="width:32px;height:32px;object-fit:contain" draggable="false" />`);
      }

      // Default: themed numbered / checkmark circle
      const isActive = stop.id === currentStopId;
      const isCompleted = isStopCompleted(stop.id);
      const m = theme.mapMarkers ?? theme.stepIndicators;
      const defaultShadow = '0 2px 6px rgba(0,0,0,0.25)';
      const activeShadow = theme.mapMarkers?.active.shadow ?? defaultShadow;

      // Image mode: stop photo cropped into the circle, ring for active/completed.
      // Falls back to an empty circle when the stop has no image.
      if (markerMode === 'image') {
        const stopImage = 'image' in stop ? (stop as { image?: string }).image : undefined;
        const ringColor = isActive ? m.active.outlineColor : isCompleted ? m.completed.backgroundColor : null;
        const border = ringColor ? `3px solid ${ringColor}` : 'none';
        const inner = stopImage
          ? `<img src="${stopImage}" style="width:100%;height:100%;object-fit:cover" draggable="false" />`
          : '';
        return divIcon44(`<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:${m.inactive.backgroundColor};border:${border};box-shadow:${activeShadow};box-sizing:border-box">${inner}</div>`);
      }

      // 'number' shows the index; 'empty' suppresses it (completed still shows the checkmark)
      const showNumber = markerMode === 'number';

      let bg: string, border: string, shadow: string, content: string;

      if (isCompleted) {
        bg = m.completed.backgroundColor;
        border = 'none';
        shadow = activeShadow;
        const c = m.completed.checkmarkColor;
        content = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="11" viewBox="0 0 10 8"><path d="M1 4L3.5 6.5L9 1" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
      } else if (isActive) {
        bg = m.active.backgroundColor;
        border = `3px solid ${m.active.outlineColor}`;
        shadow = activeShadow;
        const fs = theme.mapMarkers?.inactive.numberFontSize ?? '12px';
        const fw = theme.mapMarkers?.inactive.numberFontWeight ?? '700';
        content = showNumber ? `<span style="font-size:${fs};font-weight:${fw};color:${m.active.numberColor}">${index + 1}</span>` : '';
      } else {
        bg = m.inactive.backgroundColor;
        border = m.inactive.borderColor !== 'transparent' ? `2px solid ${m.inactive.borderColor}` : 'none';
        shadow = defaultShadow;
        const fs = theme.mapMarkers?.inactive.numberFontSize ?? '12px';
        const fw = theme.mapMarkers?.inactive.numberFontWeight ?? '600';
        content = showNumber ? `<span style="font-size:${fs};font-weight:${fw};color:${m.inactive.numberColor}">${index + 1}</span>` : '';
      }

      return divIcon44(`<div style="width:32px;height:32px;border-radius:50%;background:${bg};border:${border};display:flex;align-items:center;justify-content:center;box-shadow:${shadow};box-sizing:border-box">${content}</div>`);
    },
    []
  );

  const createClusterIcon = useCallback(
    (cluster: L.MarkerCluster): L.DivIcon => {
      const c = theme.mapMarkers?.cluster;
      const count  = cluster.getChildCount();
      const size   = c?.size            ?? 64;
      const tap    = size + 8; // tap area slightly larger than visual
      const bg     = c?.backgroundColor ?? '#1A1A1A';
      const color  = c?.numberColor     ?? '#FFFFFF';
      const border = c?.borderColor     ? `2px solid ${c.borderColor}` : 'none';
      const shadow = c?.shadow          ?? '0 3px 10px rgba(0,0,0,0.35)';
      const fs     = c?.fontSize        ?? '18px';
      const fw     = c?.fontWeight      ?? '700';

      return L.divIcon({
        html: `<div style="width:${tap}px;height:${tap}px;display:flex;align-items:center;justify-content:center"><div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;box-shadow:${shadow};box-sizing:border-box;border:${border}"><span style="font-size:${fs};font-weight:${fw};color:${color}">${count}</span></div></div>`,
        className: '',
        iconSize: [tap, tap],
        iconAnchor: [tap / 2, tap / 2],
      });
    },
    [theme]
  );

  // Build the marker layer only when the set of stops (or clustering) changes —
  // NOT on every active/completed change, so markers don't flicker.
  useEffect(() => {
    if (clusterGroupRef.current) {
      clusterGroupRef.current.remove();
      clusterGroupRef.current = null;
    }
    markersRef.current.clear();

    const group = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      showCoverageOnHover: false,
      maxClusterRadius: theme.mapMarkers?.cluster?.maxClusterRadius ?? 48,
      disableClusteringAtZoom: clusterConfig?.disableClusteringAtZoom,
      spiderfyOnMaxZoom: clusterConfig?.spiderfyOnMaxZoom ?? true,
      zoomToBoundsOnClick: true,
      animate: true,
    });

    let audioIndex = 0;
    stops.forEach(stop => {
      if (stop.type === 'audio') {
        const idx = audioIndex++;
        if (!stop.location) return;
        const marker = L.marker([stop.location.lat, stop.location.lng], {
          icon: createStopIcon(stop, idx),
        });
        marker.on('click', () => onStopClickRef.current(stop.id));
        group.addLayer(marker);
        markersRef.current.set(stop.id, { marker, index: idx, visualKey: iconStateKey(stop) });
      }
    });

    group.addTo(map);
    clusterGroupRef.current = group;

    return () => {
      group.remove();
      clusterGroupRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, stops, clusterConfig, createStopIcon, createClusterIcon]);

  // Repaint only the markers whose visual state actually changed (active / completed / mode).
  useEffect(() => {
    markersRef.current.forEach((entry, stopId) => {
      const stop = stops.find(s => s.id === stopId);
      if (!stop) return;
      const key = iconStateKey(stop);
      if (key !== entry.visualKey) {
        entry.marker.setIcon(createStopIcon(stop, entry.index));
        entry.visualKey = key;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStopId, completedKey, markerMode, theme, stops, createStopIcon]);

  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────

export const TourMapView: React.FC<TourMapViewProps> = ({
  stops,
  currentStopId,
  isStopCompleted,
  onStopClick,
  mapProvider = 'openfreemap',
  mapStyle,
  mapApiKey,
  mapStyleId,
  mapCenter,
  mapZoom,
  mapMarker,
  mapMarkerIcon,
  mapCluster,
  mapRoute,
  onRequestListView,
  showLocateButton = true,
  active = true,
}) => {
  const theme = useTheme() as ThemeConfig;

  const markerMode = mapMarker ?? 'number';

  // Resolve route config: merge metadata overrides onto theme defaults
  const routeConfig = mapRoute
    ? (typeof mapRoute === 'boolean' ? {} : mapRoute) as MapRouteConfig
    : null;
  const themeRoute = theme.mapMarkers?.route ?? {};
  const resolvedRoute = routeConfig ? {
    completedColor: themeRoute.completedColor ?? '#459825',
    upcomingColor:  themeRoute.upcomingColor  ?? '#888888',
    weight:         themeRoute.weight         ?? 3,
    opacity:        themeRoute.opacity        ?? 0.85,
    dashArray:      themeRoute.dashArray      ?? '8 6',
    minZoom:        routeConfig.minZoom       ?? 13,
    geoJSON:        typeof routeConfig.geoJSON === 'object' ? routeConfig.geoJSON as RouteGeoJSON : undefined,
  } : null;
  const isOnline = useOnlineStatus();
  const tileConfig = getTileConfig(mapProvider, mapApiKey, mapStyleId, mapStyle);
  const {
    locateState,
    userLocation,
    shouldCenter,
    handleLocate,
    handleCentered,
    handleUserMoved,
  } = useUserLocation();

  const locations = useMemo(
    () => stops
      .filter(s => s.type === 'audio' && s.location != null)
      .map(s => s.location!),
    [stops]
  );

  // The active stop (deep link / resume) the camera should focus on first.
  // currentStopId resolves asynchronously, so this is null until it lands.
  const activeLocation = (currentStopId ? stops.find(s => s.id === currentStopId) : undefined)?.location ?? null;

  if (!isOnline) {
    return (
      <OfflinePlaceholder>
        <OfflineTitle>Map unavailable offline</OfflineTitle>
        <div>Map tiles require an internet connection.</div>
        {onRequestListView && (
          <ViewListButton onClick={onRequestListView}>View list</ViewListButton>
        )}
      </OfflinePlaceholder>
    );
  }

  if (locations.length === 0) {
    return (
      <NoLocationsPlaceholder>No stops have GPS coordinates</NoLocationsPlaceholder>
    );
  }

  const defaultCenter: [number, number] = [locations[0].lat, locations[0].lng];

  return (
    <MapWrapper>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', background: theme.mainContent.backgroundColor }}
        zoomControl={false}
        bounceAtZoomLimits={false}
        maxZoom={tileConfig.maxZoom}
      >
        {tileConfig.vector ? (
          <VectorTileLayer styleUrl={tileConfig.url} attribution={tileConfig.attribution} />
        ) : (
          <TileLayer
            url={tileConfig.url}
            attribution={tileConfig.attribution}
            maxZoom={tileConfig.maxZoom}
            {...(tileConfig.subdomains ? { subdomains: tileConfig.subdomains } : {})}
          />
        )}
        <MapDoubleTapZoom />
        <MapInitialCamera locations={locations} center={mapCenter} zoom={mapZoom} activeLocation={activeLocation} />
        {resolvedRoute && (
          <MapRoute
            stops={stops}
            isStopCompleted={isStopCompleted}
            geoJSON={resolvedRoute.geoJSON}
            completedColor={resolvedRoute.completedColor}
            upcomingColor={resolvedRoute.upcomingColor}
            weight={resolvedRoute.weight}
            opacity={resolvedRoute.opacity}
            dashArray={resolvedRoute.dashArray}
            minZoom={resolvedRoute.minZoom}
          />
        )}
        <MapMarkers
          stops={stops}
          currentStopId={currentStopId}
          isStopCompleted={isStopCompleted}
          onStopClick={onStopClick}
          theme={theme}
          markerIcon={mapMarkerIcon}
          markerMode={markerMode}
          clusterConfig={mapCluster}
        />
        <UserLocationLayer
          position={userLocation}
          shouldCenter={shouldCenter}
          onCentered={handleCentered}
          onUserMoved={handleUserMoved}
          dotColor={theme.mapMarkers?.userLocation?.dotColor}
          borderColor={theme.mapMarkers?.userLocation?.borderColor}
        />
      </MapContainer>

      {showLocateButton && active && (() => {
        const portal = document.getElementById('map-controls-portal');
        if (!portal) return null;
        return createPortal(
          <ControlsOverlay>
            <MapLocateButton
              locateState={locateState}
              onLocate={() => handleLocate(locateState, userLocation)}
            />
          </ControlsOverlay>,
          portal
        );
      })()}
    </MapWrapper>
  );
};
