import { GeneratedImage, ChatSession } from '../types';

const DB_NAME = 'nano_studio_db';
const STORE_NAME_IMAGES = 'images';
const STORE_NAME_CHATS = 'chats';
const VERSION = 2; // Incremented version

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Images Store
      if (!db.objectStoreNames.contains(STORE_NAME_IMAGES)) {
        const store = db.createObjectStore(STORE_NAME_IMAGES, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Chats Store
      if (!db.objectStoreNames.contains(STORE_NAME_CHATS)) {
        const store = db.createObjectStore(STORE_NAME_CHATS, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// --- Images ---

export const saveImage = async (image: GeneratedImage): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_NAME_IMAGES);
    const request = store.add(image);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getImages = async (): Promise<GeneratedImage[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_NAME_IMAGES);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // Newest first
    const results: GeneratedImage[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

export const deleteImage = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_NAME_IMAGES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Chats ---

export const saveChat = async (chat: ChatSession): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_CHATS], 'readwrite');
    const store = transaction.objectStore(STORE_NAME_CHATS);
    const request = store.put(chat); // put handles both add and update

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getChats = async (): Promise<ChatSession[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_CHATS], 'readonly');
    const store = transaction.objectStore(STORE_NAME_CHATS);
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev');
    const results: ChatSession[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

export const deleteChat = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_CHATS], 'readwrite');
    const store = transaction.objectStore(STORE_NAME_CHATS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
