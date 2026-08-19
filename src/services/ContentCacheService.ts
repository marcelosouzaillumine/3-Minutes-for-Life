import type { Devotional } from '../types/Devotional';

export interface CachedDevotional {
  id: string; // The primary key for IndexedDB
  devotional_id: string;
  language: string;
  payload: Devotional;
  cached_at: number;
}

const DB_NAME = '3minutes_cache';
const DB_VERSION = 1;
const STORE_NAME = 'devotional_cache';

class IndexedDBWrapper {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      // Check if we're running in an environment with IndexedDB
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error("IndexedDB not supported or running server-side"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('devotional_id', 'devotional_id', { unique: false });
          store.createIndex('language', 'language', { unique: false });
        }
      };
    });
  }

  async put(value: any): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn("IndexedDB put failed:", err);
    }
  }

  async get(key: string): Promise<any> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn("IndexedDB get failed:", err);
      return null;
    }
  }
}

const dbWrapper = new IndexedDBWrapper();

export const ContentCacheService = {
  async setDevotional(devotional: Devotional, language: string): Promise<void> {
    const key = `${devotional.id}_${language}`;
    const cached: CachedDevotional = {
      id: key,
      devotional_id: devotional.id,
      language,
      payload: devotional,
      cached_at: Date.now()
    };
    await dbWrapper.put(cached);
  },

  async getDevotional(id: string, language: string): Promise<Devotional | null> {
    const key = `${id}_${language}`;
    const result = await dbWrapper.get(key) as CachedDevotional | undefined;
    if (result && result.payload) {
      return result.payload;
    }
    return null;
  },

  async setDaily(dateStr: string, devotional: Devotional, language: string): Promise<void> {
    const key = `DAILY_${dateStr}_${language}`;
    await dbWrapper.put({ id: key, payload: devotional });
    await this.setDevotional(devotional, language);
  },

  async getDaily(dateStr: string, language: string): Promise<Devotional | null> {
    const key = `DAILY_${dateStr}_${language}`;
    const result = await dbWrapper.get(key) as { payload: Devotional } | undefined;
    if (result && result.payload) {
      return result.payload;
    }
    return null;
  },

  async setLibrary(devotionals: Devotional[], language: string): Promise<void> {
    const key = `LIBRARY_${language}`;
    await dbWrapper.put({ id: key, payload: devotionals });
    // Also cache individually
    for (const d of devotionals) {
      await this.setDevotional(d, language);
    }
  },

  async getLibrary(language: string): Promise<Devotional[] | null> {
    const key = `LIBRARY_${language}`;
    const result = await dbWrapper.get(key) as { payload: Devotional[] } | undefined;
    return result ? result.payload : null;
  }
};
