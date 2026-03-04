/**
 * Route geometry utilities for the map route polyline.
 *
 * Uses flat/Euclidean math on lat/lng coordinates — accurate enough for
 * city-scale walking tours (error is a few centimetres per kilometre).
 * No external dependencies needed.
 */

/** [lng, lat] — GeoJSON coordinate convention used internally. */
type Coord = [number, number];

interface SnapPos {
  segmentIndex: number;
  t: number; // interpolation factor in [0, 1] along the segment
}

/** Project point P onto segment A→B, return t clamped to [0, 1]. */
function projectOntoSegment(
  ax: number, ay: number,
  bx: number, by: number,
  px: number, py: number,
): number {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  return Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
}

/** Find the nearest position on a polyline to a given [lng, lat] point. */
function snapToPolyline(coords: Coord[], point: Coord): SnapPos {
  let bestDist = Infinity, bestSeg = 0, bestT = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const t = projectOntoSegment(
      coords[i][0], coords[i][1],
      coords[i + 1][0], coords[i + 1][1],
      point[0], point[1],
    );
    const cx = coords[i][0] + t * (coords[i + 1][0] - coords[i][0]);
    const cy = coords[i][1] + t * (coords[i + 1][1] - coords[i][1]);
    const d = (cx - point[0]) ** 2 + (cy - point[1]) ** 2;
    if (d < bestDist) { bestDist = d; bestSeg = i; bestT = t; }
  }
  return { segmentIndex: bestSeg, t: bestT };
}

/** Interpolate a point on segment [segIdx, segIdx+1] at factor t. */
function interp(coords: Coord[], segIdx: number, t: number): Coord {
  return [
    coords[segIdx][0] + t * (coords[segIdx + 1][0] - coords[segIdx][0]),
    coords[segIdx][1] + t * (coords[segIdx + 1][1] - coords[segIdx][1]),
  ];
}

/** Slice a polyline between two snap positions, inclusive. */
function sliceCoords(coords: Coord[], from: SnapPos, to: SnapPos): Coord[] {
  const result: Coord[] = [interp(coords, from.segmentIndex, from.t)];
  for (let i = from.segmentIndex + 1; i <= to.segmentIndex; i++) {
    result.push(coords[i]);
  }
  result.push(interp(coords, to.segmentIndex, to.t));
  return result;
}

/** Convert [lng, lat] GeoJSON coords to Leaflet [lat, lng] tuples. */
function toLeaflet(coords: Coord[]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

export interface RouteLines {
  /** Leaflet [lat, lng] tuples for the completed portion of the route. */
  completed: [number, number][];
  /** Leaflet [lat, lng] tuples for the upcoming portion of the route. */
  upcoming: [number, number][];
}

/**
 * Build completed/upcoming polyline segments from a GeoJSON LineString route.
 * Completing stop N reveals the segment N→N+1, so the split is at the snap
 * position of the stop AFTER the last completed one.
 */
export function buildGeoJSONRouteLines(
  routeCoords: [number, number][],
  stops: Array<{ id: string; location: { lat: number; lng: number } }>,
  isStopCompleted: (id: string) => boolean,
): RouteLines {
  if (routeCoords.length < 2 || stops.length === 0) {
    return { completed: [], upcoming: toLeaflet(routeCoords) };
  }

  const start: SnapPos = { segmentIndex: 0, t: 0 };
  const end: SnapPos = { segmentIndex: routeCoords.length - 2, t: 1 };

  // Snap each stop onto the route geometry
  const snapped = stops.map(s => ({
    id: s.id,
    snap: snapToPolyline(routeCoords, [s.location.lng, s.location.lat]),
  }));

  // Find the last completed stop index
  let lastCompletedIdx = -1;
  for (let i = snapped.length - 1; i >= 0; i--) {
    if (isStopCompleted(snapped[i].id)) { lastCompletedIdx = i; break; }
  }

  if (lastCompletedIdx === -1) {
    return { completed: [], upcoming: toLeaflet(sliceCoords(routeCoords, start, end)) };
  }

  // If the last stop is completed, the entire route is completed — no upcoming segment.
  if (lastCompletedIdx === snapped.length - 1) {
    return { completed: toLeaflet(sliceCoords(routeCoords, start, end)), upcoming: [] };
  }

  // Split at the NEXT stop after the last completed one.
  const splitSnap = snapped[lastCompletedIdx + 1].snap;

  return {
    completed: toLeaflet(sliceCoords(routeCoords, start, splitSnap)),
    upcoming: toLeaflet(sliceCoords(routeCoords, splitSnap, end)),
  };
}

/**
 * Build completed/upcoming segments using straight lines between stops.
 * Used as a fallback when no GeoJSON route file is provided.
 * Completing stop N reveals the segment N→N+1, so the split is at stop N+1.
 */
export function buildStraightRouteLines(
  stops: Array<{ id: string; location: { lat: number; lng: number } }>,
  isStopCompleted: (id: string) => boolean,
): RouteLines {
  if (stops.length < 2) return { completed: [], upcoming: [] };

  const toLL = (s: { location: { lat: number; lng: number } }): [number, number] =>
    [s.location.lat, s.location.lng];

  // Find the last completed stop index
  let lastIdx = -1;
  for (let i = stops.length - 1; i >= 0; i--) {
    if (isStopCompleted(stops[i].id)) { lastIdx = i; break; }
  }

  if (lastIdx === -1) {
    return { completed: [], upcoming: stops.map(toLL) };
  }

  // Split at the NEXT stop after the last completed one.
  // If the last stop is completed, the entire route is completed.
  const splitIdx = Math.min(lastIdx + 1, stops.length - 1);

  return {
    completed: stops.slice(0, splitIdx + 1).map(toLL),  // stop 0 … splitIdx (inclusive)
    upcoming: stops.slice(splitIdx).map(toLL),           // splitIdx … end (shared junction)
  };
}
