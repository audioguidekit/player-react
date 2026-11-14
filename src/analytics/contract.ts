/**
 * The wire format of POST /e, as the edge Worker validates it
 * (the hosted edge Worker's contract and events route).
 *
 * The Worker rejects a WHOLE batch with 400 when one event is invalid, so
 * `sanitizeEvent` here is deliberately as strict as the Worker: a bad id is
 * dropped from the event instead of poisoning the batch.
 *
 * Note the wire keys: `sid` and `lang` (the Worker maps them to sessionId and
 * language). It also stamps `ts` itself and ignores a client clock.
 */

export const CLIENT_EVENT_TYPES = [
  'app_open',
  'tour_open',
  'tour_start',
  'tour_complete',
  'stop_view',
  'audio_play',
  'audio_complete',
  'language_change',
  'offline_download',
  'feedback_submit',
  'email_submit',
] as const;

export type EventType = (typeof CLIENT_EVENT_TYPES)[number];

/**
 * `email_submit` is a lead, not a metric: the Worker accepts it only as the sole
 * event of its request. The player never queues or batches it (see `submitNow`).
 */
export const SOLO_EVENT_TYPES: readonly EventType[] = ['email_submit'];

/** Limits of POST /e. */
export const MAX_BODY_BYTES = 4096;
export const MAX_BATCH = 50;

const SESSION = /^[A-Za-z0-9_-]{8,64}$/;
const ID = /^[A-Za-z0-9_.:-]{1,100}$/;
const LANGUAGE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/** What the player passes to `track`. */
export interface EventFields {
  tourId?: string;
  stopId?: string;
  /** Language code, e.g. "en". */
  language?: string;
  /** Seconds listened for audio events; the rating (1-5) for feedback_submit. */
  value?: number;
  /** feedback_submit free text, trimmed to 2000 characters. */
  comment?: string;
  /** email_submit. */
  email?: string;
  /** email_submit: the visitor agreed to be contacted. */
  consent?: boolean;
}

export interface WireEvent {
  type: EventType;
  sid: string;
  tourId?: string;
  stopId?: string;
  lang?: string;
  value?: number;
  comment?: string;
  email?: string;
  consent?: boolean;
}

export const MAX_COMMENT_CHARS = 2000;

const isKnownType = (type: string): type is EventType =>
  (CLIENT_EVENT_TYPES as readonly string[]).includes(type);

/** Builds the wire event, dropping every field the Worker would reject. Null when the type or session is unusable. */
export function sanitizeEvent(type: string, sid: string, fields: EventFields = {}): WireEvent | null {
  if (!isKnownType(type) || !SESSION.test(sid)) return null;
  const event: WireEvent = { type, sid };
  if (fields.tourId !== undefined && ID.test(fields.tourId)) event.tourId = fields.tourId;
  if (fields.stopId !== undefined && ID.test(fields.stopId)) event.stopId = fields.stopId;
  if (fields.language !== undefined && LANGUAGE.test(fields.language)) event.lang = fields.language;
  if (fields.value !== undefined && Number.isFinite(fields.value) && fields.value >= 0 && fields.value <= 1e9) {
    event.value = Math.round(fields.value * 10) / 10;
  }
  if (type === 'feedback_submit' && fields.comment) {
    const comment = fields.comment.trim().slice(0, MAX_COMMENT_CHARS);
    if (comment) event.comment = comment;
  }
  if (type === 'email_submit') {
    // An email event without an address and a consent flag is meaningless: drop it.
    if (!fields.email || !EMAIL.test(fields.email.trim()) || fields.consent !== true) return null;
    event.email = fields.email.trim();
    event.consent = true;
  }
  return event;
}
