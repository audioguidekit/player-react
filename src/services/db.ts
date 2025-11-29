import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'audiotour-db';
const DB_VERSION = 1;

export interface StopProgress {
  completed: boolean;
  lastPlaybackPosition: number;
  lastPlayed?: Date;
}

export interface TourProgress {
  tourId: string;
  stops: {
    [stopId: string]: StopProgress;
  };
  overallProgress: number;
  lastStopId?: string;
  lastUpdated: Date;
}

export interface DownloadedTour {
  tourId: string;
  downloadedAt: Date;
  version: string;
  cachedAssets: string[];
  sizeBytes: number;
}

export interface DB {
  'tour-progress': {
    key: string;
    value: TourProgress;
  };
  'downloaded-tours': {
    key: string;
    value: DownloadedTour;
  };
  'app-state': {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<DB> | null = null;

export async function getDB(): Promise<IDBPDatabase<DB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<DB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tour progress store
      if (!db.objectStoreNames.contains('tour-progress')) {
        db.createObjectStore('tour-progress', { keyPath: 'tourId' });
      }

      // Downloaded tours store
      if (!db.objectStoreNames.contains('downloaded-tours')) {
        db.createObjectStore('downloaded-tours', { keyPath: 'tourId' });
      }

      // App state store (for miscellaneous app data)
      if (!db.objectStoreNames.contains('app-state')) {
        db.createObjectStore('app-state');
      }
    },
  });

  return dbInstance;
}

// Helper function to close the database connection (for testing or cleanup)
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
