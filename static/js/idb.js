(function () {
    const root = typeof self !== "undefined" ? self : window;
    const DB_NAME = "offlineairportguide";
    const DB_VERSION = 1;
    const STORES = {
        meta: "meta",
        tickets: "tickets",
        chat: "chat_messages",
        queue: "sync_queue",
    };

    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORES.meta)) {
                    db.createObjectStore(STORES.meta, { keyPath: "key" });
                }
                if (!db.objectStoreNames.contains(STORES.tickets)) {
                    db.createObjectStore(STORES.tickets, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORES.chat)) {
                    db.createObjectStore(STORES.chat, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORES.queue)) {
                    db.createObjectStore(STORES.queue, { keyPath: "id" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function withStore(storeName, mode, callback) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = callback(store);

            transaction.oncomplete = () => resolve(request && request.result);
            transaction.onerror = () => reject(transaction.error || request.error);
            transaction.onabort = () => reject(transaction.error || request.error);
        });
    }

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function getAll(storeName) {
        return withStore(storeName, "readonly", (store) => store.getAll());
    }

    async function get(storeName, key) {
        return withStore(storeName, "readonly", (store) => store.get(key));
    }

    async function put(storeName, value) {
        return withStore(storeName, "readwrite", (store) => store.put(value));
    }

    async function deleteRecord(storeName, key) {
        return withStore(storeName, "readwrite", (store) => store.delete(key));
    }

    async function clear(storeName) {
        return withStore(storeName, "readwrite", (store) => store.clear());
    }

    async function replaceCollection(storeName, records) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            store.clear();

            (records || []).forEach((record) => {
                store.put(record);
            });

            transaction.oncomplete = () => resolve(records || []);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    async function setMeta(key, value) {
        return put(STORES.meta, { key, value });
    }

    async function getMeta(key) {
        const record = await get(STORES.meta, key);
        return record ? record.value : null;
    }

    function makeId(prefix) {
        if (root.crypto && typeof root.crypto.randomUUID === "function") {
            return `${prefix}-${root.crypto.randomUUID()}`;
        }
        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    async function queueChange(type, payload) {
        const record = {
            id: makeId("queue"),
            type,
            payload,
            queued_at: new Date().toISOString(),
        };
        await put(STORES.queue, record);
        return record;
    }

    async function getQueuedChanges() {
        const records = await getAll(STORES.queue);
        return records.sort((left, right) => left.queued_at.localeCompare(right.queued_at));
    }

    async function clearQueue() {
        return clear(STORES.queue);
    }

    async function saveSyncPayload(payload) {
        if (Array.isArray(payload.tickets)) {
            await replaceCollection(STORES.tickets, payload.tickets);
        }
        if (Array.isArray(payload.chat_messages)) {
            await replaceCollection(STORES.chat, payload.chat_messages);
        }
        if (payload.server_time) {
            await setMeta("last_sync_at", payload.server_time);
        }
        return payload;
    }

    root.OfflineAirportDB = {
        STORES,
        openDb,
        getAll,
        get,
        put,
        delete: deleteRecord,
        clear,
        replaceCollection,
        requestToPromise,
        setMeta,
        getMeta,
        queueChange,
        getQueuedChanges,
        clearQueue,
        saveSyncPayload,
        makeId,
    };
})();
