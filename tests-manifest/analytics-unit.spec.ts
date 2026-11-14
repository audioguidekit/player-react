import { test, expect } from '@playwright/test';
import { byteLength, encodeBatch, splitBatches, takeBatch } from '../src/analytics/batch';
import { resolveAnalyticsConfig, privacySignalOn } from '../src/analytics/config';
import { MAX_BATCH, MAX_BODY_BYTES, sanitizeEvent, type WireEvent } from '../src/analytics/contract';
import { DEFAULT_FLUSH_INTERVAL_MS, createEmitter } from '../src/analytics/emitter';

/** Pure logic of src/analytics: no browser, no network. */

const SID = 'abcdefgh12345678';
const event = (n: number, extra: Partial<WireEvent> = {}): WireEvent => ({ type: 'stop_view', sid: SID, stopId: `s${n}`, ...extra });

test.describe('analytics batching', () => {
  test('a batch holds at most 50 events and the rest waits for the next one', () => {
    const events = Array.from({ length: 120 }, (_, i) => event(i));
    const first = takeBatch(events);
    expect(first.batch).toHaveLength(MAX_BATCH);
    expect(first.rest).toHaveLength(70);
    const { batches } = splitBatches(events);
    expect(batches.map((b) => b.length)).toEqual([50, 50, 20]);
    expect(batches.flat()).toEqual(events); // order kept, nothing lost
  });

  test('a batch encodes to at most 4 KB, however the events are sized', () => {
    // ~190 bytes each: 50 of them would be ~9 KB, so the byte limit bites first.
    const events = Array.from({ length: 50 }, (_, i) => event(i, { tourId: 'a-tour-with-a-long-id'.repeat(4), lang: 'en' }));
    const { batches } = splitBatches(events);
    expect(batches.length).toBeGreaterThan(1);
    for (const batch of batches) expect(byteLength(encodeBatch(batch))).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(batches.flat()).toHaveLength(50);
  });

  test('the byte count is exact at the boundary', () => {
    const e = event(0, { tourId: 't'.repeat(60) });
    let fits = 0;
    while (byteLength(encodeBatch(Array(fits + 1).fill(e))) <= MAX_BODY_BYTES) fits++;
    expect(fits).toBeGreaterThan(1);
    expect(fits).toBeLessThan(MAX_BATCH);
    const taken = takeBatch(Array(fits + 5).fill(e)).batch;
    expect(taken).toHaveLength(fits); // one more would push the body past 4096 bytes
    expect(byteLength(encodeBatch(taken))).toBeLessThanOrEqual(MAX_BODY_BYTES);
  });

  test('an event too big for any request is dropped instead of blocking the queue', () => {
    const huge = event(1, { comment: 'x'.repeat(5000) });
    const { batch, dropped, rest } = takeBatch([event(0), huge, event(2)]);
    expect(batch.map((e) => e.stopId)).toEqual(['s0', 's2']);
    expect(dropped).toEqual([huge]);
    expect(rest).toEqual([]);
  });

  test('multibyte text is counted in bytes, not characters', () => {
    const comment = 'ž'.repeat(450); // 900 bytes
    const events = Array.from({ length: 6 }, () => event(0, { type: 'feedback_submit', comment }));
    for (const batch of splitBatches(events).batches) expect(byteLength(encodeBatch(batch))).toBeLessThanOrEqual(MAX_BODY_BYTES);
  });
});

test.describe('analytics event sanitising', () => {
  test('ids the Worker would reject are dropped from the event, not sent', () => {
    const e = sanitizeEvent('stop_view', SID, { tourId: 'ok-tour', stopId: 'has space', language: 'english-long', value: -1 });
    expect(e).toEqual({ type: 'stop_view', sid: SID, tourId: 'ok-tour' });
  });

  test('unknown types and bad session ids give no event', () => {
    expect(sanitizeEvent('qr_scan', SID)).toBeNull();
    expect(sanitizeEvent('stop_view', 'short')).toBeNull();
  });

  test('seconds listened are rounded to a tenth', () => {
    expect(sanitizeEvent('audio_complete', SID, { value: 12.3456 })?.value).toBe(12.3);
  });

  test('a rating comment is trimmed and cut to the 2000-character contract limit; comments ride on feedback_submit only', () => {
    expect(sanitizeEvent('feedback_submit', SID, { value: 5, comment: `  ${'a'.repeat(2500)}  ` })?.comment).toHaveLength(2000);
    expect(sanitizeEvent('stop_view', SID, { comment: 'nope' })?.comment).toBeUndefined();
  });

  test('an email event needs a valid address and consent', () => {
    expect(sanitizeEvent('email_submit', SID, { email: 'a@b.co', consent: true })).toMatchObject({ email: 'a@b.co', consent: true });
    expect(sanitizeEvent('email_submit', SID, { email: 'a@b.co', consent: false })).toBeNull();
    expect(sanitizeEvent('email_submit', SID, { email: 'not-an-email', consent: true })).toBeNull();
  });
});

test.describe('analytics configuration', () => {
  test('manifest mode: on at /e by default, off with app.analytics false', () => {
    expect(resolveAnalyticsConfig({ dataSource: 'manifest' })).toEqual({ endpoint: '/e' });
    expect(resolveAnalyticsConfig({ dataSource: 'manifest', app: { analytics: true } })).toEqual({ endpoint: '/e' });
    expect(resolveAnalyticsConfig({ dataSource: 'manifest', app: { analytics: false } })).toBeNull();
  });

  test('compiled mode: off without VITE_ANALYTICS_ENDPOINT, on with it, off again with app.analytics false', () => {
    expect(resolveAnalyticsConfig({ dataSource: 'compiled' })).toBeNull();
    expect(resolveAnalyticsConfig({ dataSource: 'compiled', envEndpoint: '  ' })).toBeNull();
    expect(resolveAnalyticsConfig({ dataSource: 'compiled', envEndpoint: 'https://stats.example.org/e' })).toEqual({ endpoint: 'https://stats.example.org/e' });
    expect(resolveAnalyticsConfig({ dataSource: 'compiled', envEndpoint: '/e', app: { analytics: false } })).toBeNull();
  });

  test('Global Privacy Control and Do Not Track both count as opting out', () => {
    expect(privacySignalOn({})).toBe(false);
    expect(privacySignalOn({ doNotTrack: '0' })).toBe(false);
    expect(privacySignalOn({ globalPrivacyControl: true } as Partial<Navigator>)).toBe(true);
    expect(privacySignalOn({ doNotTrack: '1' })).toBe(true);
    expect(privacySignalOn({ doNotTrack: 'yes' })).toBe(true);
  });
});

test.describe('analytics flush interval', () => {
  type Listener = () => void;

  /** Runs createEmitter against a stub window/document, recording the timer and the beacons it uses. */
  async function withStubbedBrowser<T>(run: (env: { intervals: number[]; beacons: string[]; fire: (target: 'document' | 'window', type: string) => void }) => Promise<T> | T): Promise<T> {
    const g = globalThis as Record<string, unknown>;
    const saved = { window: g.window, document: g.document, navigator: Object.getOwnPropertyDescriptor(g, 'navigator'), setInterval: g.setInterval, clearInterval: g.clearInterval };
    const listeners = { document: new Map<string, Listener[]>(), window: new Map<string, Listener[]>() };
    const target = (name: 'document' | 'window') => ({
      addEventListener: (type: string, fn: Listener) => listeners[name].set(type, [...(listeners[name].get(type) ?? []), fn]),
      removeEventListener: () => undefined,
      visibilityState: 'hidden',
    });
    const intervals: number[] = [];
    const beacons: string[] = [];
    g.window = target('window');
    g.document = target('document');
    Object.defineProperty(g, 'navigator', {
      configurable: true,
      value: { onLine: true, sendBeacon: (_url: string, blob: Blob) => (beacons.push(String(blob.size)), true) },
    });
    g.setInterval = ((_fn: Listener, ms: number) => (intervals.push(ms), 1)) as unknown as typeof setInterval;
    g.clearInterval = (() => undefined) as unknown as typeof clearInterval;
    try {
      return await run({ intervals, beacons, fire: (name, type) => listeners[name].get(type)?.forEach((fn) => fn()) });
    } finally {
      g.window = saved.window;
      g.document = saved.document;
      if (saved.navigator) Object.defineProperty(g, 'navigator', saved.navigator);
      g.setInterval = saved.setInterval;
      g.clearInterval = saved.clearInterval;
    }
  }

  const memoryStore = { add: async () => undefined, peek: async () => [], remove: async () => undefined } as never;

  test('the queue is sent once a minute, not every ten seconds', async () => {
    expect(DEFAULT_FLUSH_INTERVAL_MS).toBe(60_000);
    await withStubbedBrowser(({ intervals }) => {
      createEmitter({ endpoint: '/e', sessionId: SID, store: memoryStore }).destroy();
      expect(intervals).toEqual([60_000]);
    });
  });

  test('a caller can still choose another interval', async () => {
    await withStubbedBrowser(({ intervals }) => {
      createEmitter({ endpoint: '/e', sessionId: SID, store: memoryStore, flushIntervalMs: 5_000 }).destroy();
      expect(intervals).toEqual([5_000]);
    });
  });

  test('a hidden tab and pagehide still flush what is queued, so the longer interval loses nothing', async () => {
    await withStubbedBrowser(({ beacons, fire }) => {
      const emitter = createEmitter({ endpoint: '/e', sessionId: SID, store: memoryStore });
      emitter.track('app_open');
      expect(beacons).toHaveLength(0); // waiting for the timer
      fire('document', 'visibilitychange');
      expect(beacons).toHaveLength(1);
      emitter.track('app_open');
      fire('window', 'pagehide');
      expect(beacons).toHaveLength(2);
      emitter.destroy();
    });
  });
});
