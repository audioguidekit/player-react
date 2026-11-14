import { splitBatches, takeBatch, encodeBatch } from './batch';
import { sanitizeEvent, type EventFields, type EventType, type WireEvent } from './contract';
import { createIdbStore, type OfflineStore } from './offlineQueue';

/** How one POST ended. `retry` = keep the events and try later; `drop` = the server refused them for good. */
export type SendResult = 'ok' | 'retry' | 'drop';

export interface EmitterOptions {
  endpoint: string;
  sessionId: string;
  flushIntervalMs?: number;
  /** Flush early once this many events are waiting. */
  flushAt?: number;
  /** In-memory cap; the oldest events are dropped beyond it. */
  maxQueue?: number;
  store?: OfflineStore;
}

export interface Emitter {
  track(type: EventType, fields?: EventFields): void;
  flush(): Promise<void>;
  /** Hand everything to the browser for delivery while the page goes away. */
  flushOnHide(): void;
  /** Deliver what the offline queue holds. */
  drain(): Promise<void>;
  destroy(): void;
}

// text/plain keeps the request "simple" (no CORS preflight) and is what sendBeacon sends anyway.
export async function postEvents(endpoint: string, events: WireEvent[], keepalive = false): Promise<SendResult> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: encodeBatch(events),
      keepalive,
      credentials: 'omit',
      cache: 'no-store',
    });
    if (response.ok) return 'ok';
    // The Worker answers 400/403/413 for events it will never accept: do not retry those.
    return response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 408 ? 'drop' : 'retry';
  } catch {
    return 'retry';
  }
}

const DRAIN_PAGE = 50;

/**
 * How often the queue is sent while the tab stays open. One request a minute keeps a
 * visit down to a handful of edge requests; nothing is lost by waiting, because the
 * queue also goes out on `visibilitychange` (hidden) and `pagehide`, and early once
 * `flushAt` events are waiting.
 */
export const DEFAULT_FLUSH_INTERVAL_MS = 60_000;

export function createEmitter(options: EmitterOptions): Emitter {
  const { endpoint, sessionId, flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS, flushAt = 20, maxQueue = 200 } = options;
  const store = options.store ?? createIdbStore();
  let queue: WireEvent[] = [];
  let flushing: Promise<void> | null = null;
  let draining = false;

  const post = (events: WireEvent[], keepalive = false) => postEvents(endpoint, events, keepalive);

  const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

  const runFlush = async () => {
    const events = queue;
    queue = [];
    if (events.length === 0) return;
    if (isOffline()) return void (await store.add(events));
    const { batches } = splitBatches(events);
    for (let i = 0; i < batches.length; i++) {
      const result = await post(batches[i]);
      if (result === 'retry') {
        await store.add(batches.slice(i).flat());
        return;
      }
    }
    void drain();
  };

  const flush = () => (flushing ??= runFlush().finally(() => (flushing = null)));

  const drain = async () => {
    if (draining || isOffline()) return;
    draining = true;
    try {
      for (;;) {
        const stored = await store.peek(DRAIN_PAGE);
        if (stored.length === 0) return;
        const { batch } = takeBatch(stored.map((s) => s.event));
        // Events that were stored but cannot be sent in any request are removed with the batch.
        const taken = stored.slice(0, Math.max(batch.length, 1));
        const result = batch.length > 0 ? await post(batch) : 'drop';
        if (result === 'retry') return;
        await store.remove(taken.map((s) => s.key));
      }
    } finally {
      draining = false;
    }
  };

  const onOnline = () => void drain();
  const onHide = () => {
    if (document.visibilityState === 'hidden') flushOnHide();
  };

  function flushOnHide() {
    const events = queue;
    queue = [];
    if (events.length === 0) return;
    if (isOffline()) return void store.add(events);
    for (const batch of splitBatches(events).batches) {
      const body = encodeBatch(batch);
      const queued =
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
      if (!queued) {
        void post(batch, true).then((result) => result === 'retry' && store.add(batch));
      }
    }
  }

  const timer = setInterval(() => void flush(), flushIntervalMs);
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flushOnHide);
  void drain(); // whatever an earlier visit left behind

  return {
    track(type, fields) {
      const event = sanitizeEvent(type, sessionId, fields);
      if (!event) return;
      queue.push(event);
      if (queue.length > maxQueue) queue = queue.slice(queue.length - maxQueue);
      if (queue.length >= flushAt) void flush();
    },
    flush,
    flushOnHide,
    drain,
    destroy() {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushOnHide);
    },
  };
}
