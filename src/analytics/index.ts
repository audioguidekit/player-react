/**
 * Anonymous, first-party usage analytics. See docs/analytics.md.
 *
 * `initAnalytics` runs once at startup. When analytics is off (compiled build
 * without an endpoint, `app.analytics: false`, or a Global Privacy Control /
 * Do Not Track signal) every `track` call is a no-op: no timers, no storage,
 * no requests.
 */
import type { AppConfig } from '@audioguidekit/schema';
import { DATA_SOURCE } from '../services/dataSource';
import { resolveAnalyticsConfig, privacySignalOn } from './config';
import { createEmitter, postEvents, type Emitter } from './emitter';
import { getSessionId } from './session';
import { sanitizeEvent, SOLO_EVENT_TYPES, type EventFields, type EventType } from './contract';

export type { EventFields, EventType } from './contract';

let emitter: Emitter | null = null;
/** Where an explicit form submission can go, even when passive tracking is off. */
let submitEndpoint: string | null = null;
let started = false;

export function initAnalytics(app: AppConfig | undefined): void {
  if (started) return;
  started = true;
  const config = resolveAnalyticsConfig({
    dataSource: DATA_SOURCE,
    envEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined,
    app,
  });
  if (!config) return;
  submitEndpoint = config.endpoint;
  if (privacySignalOn()) return;
  emitter = createEmitter({ endpoint: config.endpoint, sessionId: getSessionId() });
  track('app_open');
}

export function track(type: EventType, fields?: EventFields): void {
  // A solo type must never share a request or sit in the offline queue: it goes through submitNow.
  if (SOLO_EVENT_TYPES.includes(type)) return;
  emitter?.track(type, fields);
}

/**
 * Submit something the visitor typed in on purpose (an email address). Unlike
 * `track` this reports success so the form can show an error, and it still goes
 * out when passive tracking is off: pressing "subscribe" is not tracking.
 * Returns 'unavailable' when the build has no endpoint to send to.
 */
export async function submitNow(type: EventType, fields: EventFields): Promise<'sent' | 'failed' | 'unavailable'> {
  if (!submitEndpoint) return 'unavailable';
  const event = sanitizeEvent(type, getSessionId(), fields);
  if (!event) return 'unavailable'; // not a sendable event (invalid address or consent)
  const ok = (await postEvents(submitEndpoint, [event])) === 'ok';
  return ok ? 'sent' : 'failed';
}

/** For tests. */
export function resetAnalyticsForTests(): void {
  emitter?.destroy();
  emitter = null;
  submitEndpoint = null;
  started = false;
}
