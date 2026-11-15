import type { TourData } from '../../types';

/**
 * Tour structure (`tourStructure` in metadata.json):
 * - 'guided' (default): a route. Stops are numbered, one plays after another, and the map draws the route line.
 * - 'free': free exploration (a museum, a gallery). Visitors start each stop themselves: nothing plays next on its own,
 *   stops carry no numbers and the map draws no line. The transition sound still plays once when a stop ends, as a
 *   "this stop has finished" signal. Previous/next buttons stay: they are the visitor's own choice.
 * The player applies it here instead of rewriting showStopNumber / mapRoute, so the author's other settings come back
 * untouched when the tour is switched back to guided.
 */
export const isFreeExploration = (tour: Pick<TourData, 'tourStructure'> | null | undefined): boolean =>
  tour?.tourStructure === 'free';

/** What the stop list, the mini player and the map should show for this tour. */
export function structureDisplay(tour: Pick<TourData, 'tourStructure' | 'showStopNumber' | 'mapRoute' | 'mapMarker'>) {
  const free = isFreeExploration(tour);
  return {
    showStopNumber: free ? false : tour.showStopNumber,
    mapRoute: free ? undefined : tour.mapRoute,
    // A numbered marker would bring the numbers back on the map; a photo marker or a custom icon stays.
    mapMarker: free && (tour.mapMarker ?? 'number') === 'number' ? ('empty' as const) : tour.mapMarker,
  };
}
