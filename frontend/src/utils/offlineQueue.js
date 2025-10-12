import { openDB } from 'idb';

const DB_NAME = 'argus-offline';
const DB_VERSION = 1;
const STORE_TIME_ENTRIES = 'timeEntries';
const STORE_PHOTOS = 'photos';

let dbPromise;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_TIME_ENTRIES)) {
          db.createObjectStore(STORE_TIME_ENTRIES, { keyPath: 'clientId' });
        }
        if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
          db.createObjectStore(STORE_PHOTOS, { keyPath: 'clientId' });
        }
      },
    });
  }
  return dbPromise;
};

const withStore = async (storeName, mode, callback) => {
  const db = await getDb();
  const tx = db.transaction(storeName, mode);
  const result = await callback(tx.store);
  await tx.done;
  return result;
};

export const queueTimeEntry = async (record) =>
  withStore(STORE_TIME_ENTRIES, 'readwrite', (store) =>
    store.put({ ...record, createdAt: record.createdAt ?? new Date().toISOString() }),
  );

export const removeQueuedTimeEntry = async (clientId) =>
  withStore(STORE_TIME_ENTRIES, 'readwrite', (store) => store.delete(clientId));

export const queuePhoto = async (record) =>
  withStore(STORE_PHOTOS, 'readwrite', (store) =>
    store.put({ ...record, createdAt: record.createdAt ?? new Date().toISOString() }),
  );

export const removeQueuedPhoto = async (clientId) =>
  withStore(STORE_PHOTOS, 'readwrite', (store) => store.delete(clientId));

const processStore = async (storeName, handler) =>
  withStore(storeName, 'readwrite', async (store) => {
    let cursor = await store.openCursor();
    let processed = false;
    while (cursor) {
      const record = cursor.value;
      try {
        await handler(record);
        await cursor.delete();
        processed = true;
      } catch (error) {
        console.error(`[offline] Sync fehlgeschlagen (${storeName})`, error);
      }
      cursor = await cursor.continue();
    }
    return processed;
  });

export const processTimeEntryQueue = (handler) => processStore(STORE_TIME_ENTRIES, handler);
export const processPhotoQueue = (handler) => processStore(STORE_PHOTOS, handler);

export const hasPendingOfflineData = async () => {
  const db = await getDb();
  const timeCount = await db.count(STORE_TIME_ENTRIES);
  const photoCount = await db.count(STORE_PHOTOS);
  return timeCount + photoCount > 0;
};
