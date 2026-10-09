const DB_NAME = 'radio-web-app';
const DB_VERSION = 2;
const STORE = 'cache';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
	if (typeof indexedDB === 'undefined') {
		return Promise.reject(new Error('IndexedDB is not available'));
	}
	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains(STORE)) {
					request.result.createObjectStore(STORE);
				}
			};
			request.onsuccess = () => {
				// Let a newer tab upgrade the schema instead of blocking it forever.
				request.result.onversionchange = () => {
					request.result.close();
					dbPromise = null;
				};
				resolve(request.result);
			};
			request.onerror = () => {
				dbPromise = null;
				reject(request.error);
			};
		});
	}
	return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export const indexedDbCache = {
	async read<T>(key: string): Promise<T | null> {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readonly');
		const result = await requestToPromise<T | undefined>(tx.objectStore(STORE).get(key));
		return result ?? null;
	},

	async write<T>(key: string, value: T): Promise<void> {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(value, key);
		// Quota errors abort the transaction after the put request already succeeded.
		await new Promise<void>((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
			tx.onabort = () => reject(tx.error);
		});
	}
};
