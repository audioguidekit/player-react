/**
 * Authoring contracts for the tour JSON files.
 *
 * These types describe exactly what a developer/content editor writes into the
 * data files — `metadata.json`, the per-language files (en.json, de.json, …) and
 * `app.json` — and, assembled, what a runtime manifest carries.
 *
 * They are DERIVED from the data types in `types.ts` so they can never drift:
 * the only difference is that runtime-injected playback state (`isCompleted`,
 * `isPlaying`) is stripped, since those are computed at runtime and never authored.
 *
 * The JSON Schemas are generated from these (see scripts/generate-schema.ts).
 */
import type { TourData, TourMetadata, AppConfig, Stop, AudioStop } from './types.js';

/** Playback state injected at runtime (see isStopCompleted) — never written in JSON. */
type RuntimeStopState = 'isCompleted' | 'isPlaying';

/** An audio stop as authored in JSON, with runtime playback state removed. */
type AuthoredAudioStop = Omit<AudioStop, RuntimeStopState>;

/** Any stop as authored in JSON. */
export type AuthoredStop = Exclude<Stop, AudioStop> | AuthoredAudioStop;

/**
 * Shape of a language file, e.g. `src/data/tour/<id>/en.json`.
 * Mirrors {@link TourData} but with runtime-only stop state removed.
 */
export interface TourFile extends Omit<TourData, 'stops'> {
  stops: AuthoredStop[];
}

/**
 * Shape of `src/data/tour/<id>/metadata.json` — properties shared across languages.
 */
export type TourMetadataFile = TourMetadata;

/**
 * Shape of `src/data/tour/app.json` — app-level config for the landing screen
 * and the installed-app identity.
 */
export type AppConfigFile = AppConfig;
