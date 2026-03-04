import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import tw from 'twin.macro';
import styled, { useTheme } from 'styled-components';
import { Stop, MapRouteConfig, RouteGeoJSON } from '../types';
import { getTileConfig, MapProvider } from '../src/utils/mapTileProvider';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ThemeConfig } from '../src/theme/types';
import { MapZoomControls } from './map/MapZoomControls';
import { MapLocateButton, UserLocationLayer, useUserLocation } from './map/MapLocateButton';
import { MapRoute } from './map/MapRoute';

interface TourMapViewProps {
  stops: Stop[];
  currentStopId: string | null;
  isPlaying: boolean;
  isStopCompleted: (stopId: string) => boolean;
  onStopClick: (stopId: string) => void;
  mapProvider?: MapProvider;
  mapApiKey?: string;
  mapStyleId?: string;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
  mapMarkerIcon?: string;
  mapMarkerNumber?: boolean;
  mapCluster?: {
    disableClusteringAtZoom?: number;
    spiderfyOnMaxZoom?: boolean;
  };
  mapRoute?: boolean | MapRouteConfig;
  onRequestListView?: () => void;
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

const ControlsOverlay = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

// ─── Internal sub-components (require MapContainer context) ───────────────────

const MapRefCapture: React.FC<{ mapRef: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
};

interface MapBoundsFitterProps {
  locations: Array<{ lat: number; lng: number }>;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const MapBoundsFitter: React.FC<MapBoundsFitterProps> = ({ locations, center, zoom }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current || locations.length === 0) return;
    hasFitted.current = true;

    if (center) {
      // Explicit center provided — use it with the given zoom (or a sensible default)
      map.setView([center.lat, center.lng], zoom ?? 13);
    } else if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], zoom ?? 15);
    } else {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [48, 48] });
      // Override the fitBounds-calculated zoom if the user specified one
      if (zoom !== undefined) map.setZoom(zoom);
    }
  }, [map, locations, center, zoom]);

  return null;
};

interface MapMarkersProps {
  stops: Stop[];
  currentStopId: string | null;
  isStopCompleted: (stopId: string) => boolean;
  onStopClick: (stopId: string) => void;
  theme: ThemeConfig;
  markerIcon?: string;
  showNumber?: boolean;
  clusterConfig?: TourMapViewProps['mapCluster'];
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  stops, currentStopId, isStopCompleted, onStopClick, theme, markerIcon, showNumber = true, clusterConfig,
}) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  const createStopIcon = useCallback(
    (stop: Stop, index: number): L.DivIcon => {
      // Custom image marker: stop-level overrides tour-level; no number, no state variants
      const resolvedIcon = stop.mapMarkerIcon || markerIcon;
      if (resolvedIcon) {
        return L.divIcon({
          html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer"><img src="${resolvedIcon}" style="width:32px;height:32px;object-fit:contain" draggable="false" /></div>`,
          className: '',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
      }

      // Default: themed numbered / checkmark circle
      const isActive = stop.id === currentStopId;
      const isCompleted = isStopCompleted(stop.id);
      const m = theme.mapMarkers ?? theme.stepIndicators;

      let bg: string, border: string, shadow: string, content: string;

      if (isCompleted) {
        bg = m.completed.backgroundColor;
        border = 'none';
        shadow = theme.mapMarkers?.active.shadow ?? '0 2px 6px rgba(0,0,0,0.25)';
        const c = m.completed.checkmarkColor;
        content = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="11" viewBox="0 0 10 8"><path d="M1 4L3.5 6.5L9 1" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
      } else if (isActive) {
        bg = m.active.backgroundColor;
        border = `3px solid ${m.active.outlineColor}`;
        shadow = theme.mapMarkers?.active.shadow ?? '0 2px 6px rgba(0,0,0,0.25)';
        const fs = theme.mapMarkers?.inactive.numberFontSize ?? '12px';
        const fw = theme.mapMarkers?.inactive.numberFontWeight ?? '700';
        content = showNumber ? `<span style="font-size:${fs};font-weight:${fw};color:${m.active.numberColor}">${index + 1}</span>` : '';
      } else {
        bg = m.inactive.backgroundColor;
        border = m.inactive.borderColor !== 'transparent' ? `2px solid ${m.inactive.borderColor}` : 'none';
        shadow = '0 2px 6px rgba(0,0,0,0.25)';
        const fs = theme.mapMarkers?.inactive.numberFontSize ?? '12px';
        const fw = theme.mapMarkers?.inactive.numberFontWeight ?? '600';
        content = showNumber ? `<span style="font-size:${fs};font-weight:${fw};color:${m.inactive.numberColor}">${index + 1}</span>` : '';
      }

      return L.divIcon({
        html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:32px;height:32px;border-radius:50%;background:${bg};border:${border};display:flex;align-items:center;justify-content:center;box-shadow:${shadow};box-sizing:border-box">${content}</div></div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
    },
    [markerIcon, currentStopId, isStopCompleted, theme, showNumber]
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

  useEffect(() => {
    // Remove previous cluster group
    if (clusterGroupRef.current) {
      clusterGroupRef.current.remove();
      clusterGroupRef.current = null;
    }

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
        marker.on('click', () => onStopClick(stop.id));
        group.addLayer(marker);
      }
    });

    group.addTo(map);
    clusterGroupRef.current = group;

    return () => {
      group.remove();
      clusterGroupRef.current = null;
    };
  }, [map, stops, createStopIcon, createClusterIcon, onStopClick]);

  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────

export const TourMapView: React.FC<TourMapViewProps> = ({
  stops,
  currentStopId,
  isPlaying,
  isStopCompleted,
  onStopClick,
  mapProvider = 'openstreetmap',
  mapApiKey,
  mapStyleId,
  mapCenter,
  mapZoom,
  mapMarkerIcon,
  mapMarkerNumber = true,
  mapCluster,
  mapRoute,
  onRequestListView,
}) => {
  const theme = useTheme() as ThemeConfig;

  // Resolve route config: merge metadata overrides onto theme defaults
  const routeConfig = mapRoute && mapRoute !== false
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
  const tileConfig = getTileConfig(mapProvider, mapApiKey, mapStyleId);
  const mapRef = useRef<L.Map | null>(null);

  const {
    locateState,
    userLocation,
    shouldCenter,
    handleLocate,
    handleCentered,
    handleUserMoved,
  } = useUserLocation();

  const locations = stops
    .filter(s => s.type === 'audio' && s.location != null)
    .map(s => s.location!);

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
      >
        <TileLayer
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
          {...(tileConfig.subdomains ? { subdomains: tileConfig.subdomains } : {})}
        />
        <MapRefCapture mapRef={mapRef} />
        <MapBoundsFitter locations={locations} center={mapCenter} zoom={mapZoom} />
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
          markerIcon={mapMarkerIcon || undefined}
          showNumber={mapMarkerNumber}
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

      <ControlsOverlay>
        <MapZoomControls mapRef={mapRef} />
        <MapLocateButton
          locateState={locateState}
          onLocate={() => handleLocate(locateState, userLocation)}
        />
      </ControlsOverlay>
    </MapWrapper>
  );
};
