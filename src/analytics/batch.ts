import { MAX_BATCH, MAX_BODY_BYTES, type WireEvent } from './contract';

const encoder = new TextEncoder();

export const byteLength = (text: string): number => encoder.encode(text).length;

/** The request body for a batch. */
export const encodeBatch = (events: WireEvent[]): string => JSON.stringify({ events });

export interface BatchLimits {
  maxEvents: number;
  maxBytes: number;
}

export const DEFAULT_LIMITS: BatchLimits = { maxEvents: MAX_BATCH, maxBytes: MAX_BODY_BYTES };

export interface TakenBatch {
  /** Events that fit in one request, in order. */
  batch: WireEvent[];
  /** Everything after them. */
  rest: WireEvent[];
  /** Events that cannot fit in a request even alone (never retried). */
  dropped: WireEvent[];
}

// `{"events":[` + `]}`
const ENVELOPE_BYTES = byteLength(encodeBatch([]));

/**
 * Takes the longest prefix of `events` that is at most `maxEvents` long and
 * encodes to at most `maxBytes`. An event that is too big even alone is
 * dropped so it cannot block the queue forever.
 */
export function takeBatch(events: WireEvent[], limits: BatchLimits = DEFAULT_LIMITS): TakenBatch {
  const batch: WireEvent[] = [];
  const dropped: WireEvent[] = [];
  let bytes = ENVELOPE_BYTES;
  let index = 0;
  for (; index < events.length && batch.length < limits.maxEvents; index++) {
    const size = byteLength(JSON.stringify(events[index]));
    const needed = size + (batch.length > 0 ? 1 : 0); // comma between events
    if (ENVELOPE_BYTES + size > limits.maxBytes) {
      dropped.push(events[index]);
      continue;
    }
    if (bytes + needed > limits.maxBytes) break;
    batch.push(events[index]);
    bytes += needed;
  }
  return { batch, rest: events.slice(index), dropped };
}

/** Splits a whole queue into request-sized batches. */
export function splitBatches(events: WireEvent[], limits: BatchLimits = DEFAULT_LIMITS): { batches: WireEvent[][]; dropped: WireEvent[] } {
  const batches: WireEvent[][] = [];
  const dropped: WireEvent[] = [];
  let rest = events;
  while (rest.length > 0) {
    const taken = takeBatch(rest, limits);
    dropped.push(...taken.dropped);
    if (taken.batch.length > 0) batches.push(taken.batch);
    rest = taken.rest;
  }
  return { batches, dropped };
}
