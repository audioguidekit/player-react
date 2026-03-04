import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Stop, RouteGeoJSON } from '../../types';
import { buildGeoJSONRouteLines, buildStraightRouteLines } from '../../src/utils/routeGeometry';

interface MapRouteProps {
  stops: Stop[];
  isStopCompleted: (id: string) => boolean;
  geoJSON?: RouteGeoJSON;
  completedColor: string;
  upcomingColor: string;
  weight: number;
  opacity: number;
  dashArray: string;
  minZoom: number;
}

export const MapRoute: React.FC<MapRouteProps> = ({
  stops,
  isStopCompleted,
  geoJSON,
  completedColor,
  upcomingColor,
  weight,
  opacity,
  dashArray,
  minZoom,
}) => {
  const map = useMap();
  const completedLine = useRef<L.Polyline | null>(null);
  const upcomingLine = useRef<L.Polyline | null>(null);

  // All stops that have a GPS location — not restricted to audio type
  const stopsWithLocation = useMemo(
    () => stops.filter(s => s.location != null),
    [stops],
  );

  // Resolved GeoJSON coordinate array (null = use straight lines)
  const routeCoords = useMemo((): [number, number][] | null => {
    if (!geoJSON) return null;
    const coords = geoJSON.features[0]?.geometry?.coordinates;
    return Array.isArray(coords) && coords.length >= 2
      ? (coords as [number, number][])
      : null;
  }, [geoJSON]);

  const lines = useMemo(() => {
    if (stopsWithLocation.length < 2) return { completed: [], upcoming: [] };
    if (routeCoords) {
      return buildGeoJSONRouteLines(routeCoords, stopsWithLocation as Array<{ id: string; location: { lat: number; lng: number } }>, isStopCompleted);
    }
    return buildStraightRouteLines(stopsWithLocation as Array<{ id: string; location: { lat: number; lng: number } }>, isStopCompleted);
  }, [stopsWithLocation, routeCoords, isStopCompleted]);

  const syncVisibility = useCallback(() => {
    const visible = map.getZoom() >= minZoom;
    [completedLine, upcomingLine].forEach(ref => {
      if (!ref.current) return;
      if (visible) ref.current.addTo(map);
      else ref.current.remove();
    });
  }, [map, minZoom]);

  // Rebuild polylines whenever line data or style changes
  useEffect(() => {
    completedLine.current?.remove();
    upcomingLine.current?.remove();
    completedLine.current = null;
    upcomingLine.current = null;

    if (lines.completed.length >= 2) {
      completedLine.current = L.polyline(lines.completed, {
        color: completedColor,
        weight,
        opacity,
        lineCap: 'round',
        lineJoin: 'round',
      });
    }

    if (lines.upcoming.length >= 2) {
      upcomingLine.current = L.polyline(lines.upcoming, {
        color: upcomingColor,
        weight,
        opacity: opacity * 0.75,
        dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      });
    }

    syncVisibility();

    return () => {
      completedLine.current?.remove();
      upcomingLine.current?.remove();
      completedLine.current = null;
      upcomingLine.current = null;
    };
  }, [lines, completedColor, upcomingColor, weight, opacity, dashArray, map, syncVisibility]);

  // Show/hide on zoom changes
  useEffect(() => {
    map.on('zoomend', syncVisibility);
    return () => { map.off('zoomend', syncVisibility); };
  }, [map, syncVisibility]);

  return null;
};
