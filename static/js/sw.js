/* global OfflineAirportDB */
importScripts("/static/js/idb.js");

const STATIC_CACHE = "offlineairportguide-static-v1";
const RUNTIME_CACHE = "offlineairportguide-runtime-v1";
const SYNC_TAG = "offlineairportguide-sync";
const OFFLINE_URL = "/offline/";
const APP_SHELL = [
    "/",
    OFFLINE_URL,
    "/static/airport_helper/css/app.css",
    "/static/airport_helper/js/airport-map-data.js",
    "/static/airport_helper/js/app.js",
    "/static/js/idb.js",
    "/static/js/app.js",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((name) => ![STATIC_CACHE, RUNTIME_CACHE].includes(name))
                    .map((name) => caches.delete(name)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (request.mode === "navigate") {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    if (url.origin === self.location.origin && url.pathname.startsWith("/static/")) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    if (url.origin === self.location.origin && url.pathname.startsWith("/api/sync/")) {
        event.respondWith(networkFirst(request, RUNTIME_CACHE));
        return;
    }

    event.respondWith(cacheFirst(request));
});

self.addEventListener("sync", (event) => {
    if (event.tag === SYNC_TAG) {
        event.waitUntil(flushSyncQueue());
    }
});

self.addEventListener("message", (event) => {
    const message = event.data || {};

    if (message.type === "queue-sync") {
        event.waitUntil(registerOrFlushSync());
    }
});

async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (_error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return caches.match(OFFLINE_URL);
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const networkPromise = fetch(request)
        .then((response) => {
            cache.put(request, response.clone());
            return response;
        })
        .catch(() => cached);

    return cached || networkPromise;
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (_error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw _error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
}

async function registerOrFlushSync() {
    if ("sync" in self.registration) {
        await self.registration.sync.register(SYNC_TAG);
        return;
    }
    await flushSyncQueue();
}

async function flushSyncQueue() {
    const queuedChanges = await OfflineAirportDB.getQueuedChanges();
    if (!queuedChanges.length) {
        await notifyClients("sync-idle");
        return;
    }

    const payload = buildSyncPayload(queuedChanges);
    if (!payload) {
        await OfflineAirportDB.clearQueue();
        return;
    }

    const response = await fetch("/api/sync/", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`);
    }

    const data = await response.json();
    await OfflineAirportDB.saveSyncPayload(data);
    await OfflineAirportDB.clearQueue();
    await notifyClients("sync-complete", data);
}

function buildSyncPayload(queue) {
    const payload = {
        tickets: [],
        deleted_ticket_ids: [],
        pending_chat_prompts: [],
    };

    queue.forEach((record) => {
        if (record.type === "ticket_upsert") {
            const ticket = { ...(record.payload || {}) };
            if (!Number.isInteger(ticket.id)) {
                delete ticket.id;
            }
            payload.tickets.push(ticket);
        }

        if (record.type === "ticket_delete") {
            const ticketId = Number(record.payload && record.payload.id);
            if (Number.isInteger(ticketId) && ticketId > 0) {
                payload.deleted_ticket_ids.push(ticketId);
            }
        }

        if (record.type === "chat_prompt") {
            const prompt = String(record.payload && record.payload.message || "").trim();
            if (prompt) {
                payload.pending_chat_prompts.push({
                    local_id: record.id,
                    message: prompt,
                });
            }
        }
    });

    if (!payload.tickets.length && !payload.deleted_ticket_ids.length && !payload.pending_chat_prompts.length) {
        return null;
    }

    return payload;
}

async function notifyClients(type, payload) {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    await Promise.all(
        clients.map((client) => client.postMessage({ type, payload })),
    );
}
