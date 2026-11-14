import { openDB, type IDBPDatabase } from 'idb';
import type { WireEvent } from './contract';

/**
 * Events that could not be delivered, kept in IndexedDB until the device is
 * back online. Its own database, so it never touches the tour storage.
 * Every call swallows failures: IndexedDB can be missing (private windows),
 * and analytics must never break the player.
 */
export interface OfflineStore {
  add(events: WireEvent[]): Promise<void>;
  /** Oldest first. */
  peek(limit: number): Promise<{ key: number; event: WireEvent }[]>;
  remove(keys: number[]): Promise<void>;
  count(): Promise<number>;
}

const DB_NAME = 'agk-analytics';
const STORE = 'events';
/** Past this many stored events the oldest are dropped. */
export const MAX_STORED_EVENTS = 500;

export function createIdbStore(cap = MAX_STORED_EVENTS): OfflineStore {
  let dbPromise: Promise<IDBPDatabase> | null = null;
  const db = () =>
    (dbPromise ??= openDB(DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore(STORE, { autoIncrement: true });
      },
    }));

  return {
    async add(events) {
      try {
        const tx = (await db()).transaction(STORE, 'readwrite');
        for (const event of events) void tx.store.add(event);
        // Drop the oldest beyond the cap.
        const total = await tx.store.count();
        if (total > cap) {
          let excess = total - cap;
          let cursor = await tx.store.openCursor();
          while (cursor && excess > 0) {
            await cursor.delete();
            excess--;
            cursor = await cursor.continue();
          }
        }
        await tx.done;
      } catch {
        /* storage unavailable: the events are lost, which is acceptable */
      }
    },
    async peek(limit) {
      try {
        const store = (await db()).transaction(STORE).store;
        const out: { key: number; event: WireEvent }[] = [];
        let cursor = await store.openCursor();
        while (cursor && out.length < limit) {
          out.push({ key: cursor.key as number, event: cursor.value as WireEvent });
          cursor = await cursor.continue();
        }
        return out;
      } catch {
        return [];
      }
    },
    async remove(keys) {
      try {
        const tx = (await db()).transaction(STORE, 'readwrite');
        for (const key of keys) void tx.store.delete(key);
        await tx.done;
      } catch {
        /* ignore */
      }
    },
    async count() {
      try {
        return await (await db()).count(STORE);
      } catch {
        return 0;
      }
    },
  };
}
