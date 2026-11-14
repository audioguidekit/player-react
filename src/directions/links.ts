/**
 * "Open in maps": deep links that start navigation to a stop in the visitor's maps app. They are
 * plain https links, so there is no SDK, no key and nothing sent anywhere until the visitor taps one.
 * On a phone the platform hands each link to the installed app (Google Maps, Apple Maps, Waze).
 */
import type { StopLocation } from '../../types';

export type DirectionsApp = 'google' | 'apple' | 'waze';

export interface DirectionsLink {
  app: DirectionsApp;
  url: string;
}

/** A location the player can use: finite coordinates inside the valid range. */
export function isUsableLocation(location: unknown): location is StopLocation {
  if (typeof location !== 'object' || location === null) return false;
  const { lat, lng } = location as Record<string, unknown>;
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

/** `41.4145, 2.1527` as `41.4145,2.1527`: up to 6 decimals (about 10 cm), never scientific notation. */
const coordinates = ({ lat, lng }: StopLocation): string => `${Number(lat.toFixed(6))},${Number(lng.toFixed(6))}`;

/** The three links for a stop's location, in the order they are offered. */
export function directionsLinks(location: StopLocation): DirectionsLink[] {
  const destination = coordinates(location);
  return [
    { app: 'google', url: `https://www.google.com/maps/dir/?api=1&destination=${destination}` },
    { app: 'apple', url: `https://maps.apple.com/?daddr=${destination}` },
    { app: 'waze', url: `https://waze.com/ul?ll=${destination}&navigate=yes` },
  ];
}
