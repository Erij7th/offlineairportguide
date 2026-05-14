/* global OfflineAirportDB */
(function () {
    const config = window.OFFLINE_AIRPORT_CONFIG || {};
    const dashboard = {
        ticketsSection: document.querySelector("#tickets"),
        board: document.querySelector(".departure-board"),
        chatLog: document.querySelector("[data-chat-log]"),
        chatForm: document.querySelector("[data-chat-form]"),
        ticketForm: document.querySelector(".ticket-page form"),
    };

    document.addEventListener("DOMContentLoaded", initOfflineAirportApp);

    async function initOfflineAirportApp() {
        ensureBanner();
        setConnectivityState(navigator.onLine);
        registerConnectivityEvents();
        registerServiceWorker();

        if (config.isAuthenticated) {
            await renderCachedState();
            bindOfflineTicketForm();
            bindOfflineTicketDeletes();
            bindOfflineChatForm();

            if (navigator.onLine) {
                await syncAndRefresh();
            }
        }
    }

    function registerConnectivityEvents() {
        window.addEventListener("online", async () => {
            setConnectivityState(true);
            await syncAndRefresh();
        });

        window.addEventListener("offline", () => {
            setConnectivityState(false);
        });

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("message", async (event) => {
                const message = event.data || {};
                if (message.type === "sync-complete" && message.payload) {
                    await OfflineAirportDB.saveSyncPayload(message.payload);
                    await renderPayload(message.payload);
                    notify("Saved data synced successfully.", "success");
                }
            });
        }
    }

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator) || !config.serviceWorkerUrl) {
            return;
        }

        try {
            await navigator.serviceWorker.register(config.serviceWorkerUrl, { scope: "/" });
        } catch (error) {
            console.warn("Service worker registration failed.", error);
        }
    }

    async function syncAndRefresh() {
        await syncQueuedChanges();
        await refreshFromServer();
    }

    async function refreshFromServer() {
        if (!config.syncUrl || !navigator.onLine) {
            return renderCachedState();
        }

        try {
            const response = await fetch(config.syncUrl, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to refresh with status ${response.status}`);
            }

            const payload = await response.json();
            await OfflineAirportDB.saveSyncPayload(payload);
            await renderPayload(payload);
        } catch (error) {
            console.warn("Falling back to cached airport data.", error);
            await renderCachedState();
        }
    }

    async function renderCachedState() {
        const tickets = await OfflineAirportDB.getAll(OfflineAirportDB.STORES.tickets);
        const chatMessages = await OfflineAirportDB.getAll(OfflineAirportDB.STORES.chat);
        await renderPayload({
            tickets,
            chat_messages: chatMessages,
        });
    }

    async function renderPayload(payload) {
        if (dashboard.ticketsSection) {
            renderTickets(payload.tickets || []);
        }
        if (dashboard.board) {
            renderBoard(payload.tickets || []);
        }
        if (dashboard.chatLog) {
            renderChat(payload.chat_messages || []);
        }
    }

    function renderTickets(tickets) {
        const existingGrid = dashboard.ticketsSection.querySelector(".ticket-grid");
        const existingEmpty = dashboard.ticketsSection.querySelector(".empty-state");
        if (existingGrid) {
            existingGrid.remove();
        }
        if (existingEmpty) {
            existingEmpty.remove();
        }

        if (!tickets.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.innerHTML = `
                <div class="empty-state-icon"><i class="bi bi-ticket-perforated-fill"></i></div>
                <h3>No saved tickets yet</h3>
                <p>Your next synced pass will appear here.</p>
            `;
            dashboard.ticketsSection.appendChild(empty);
            return;
        }

        const grid = document.createElement("div");
        grid.className = "ticket-grid";
        grid.innerHTML = tickets
            .map((ticket) => {
                const statusColor = statusColorMap(ticket.status);
                const airportLabel = escapeHtml(ticket.departure_airport || "Saved offline");
                return `
                    <article class="ticket-card" data-ticket-id="${escapeHtml(ticket.id)}">
                        <div class="ticket-card-top">
                            <div>
                                <p class="ticket-label">${escapeHtml(ticket.airline || "Saved flight")}</p>
                                <h3>${escapeHtml(ticket.flight_number)}</h3>
                            </div>
                            <span class="status-pill status-pill--${escapeHtml(ticket.status)}">
                                <span class="status-dot status-dot--${statusColor}"></span>
                                <span class="board-flip">${escapeHtml(formatStatus(ticket.status))}</span>
                            </span>
                        </div>
                        <div class="ticket-details">
                            <div class="ticket-detail">
                                <span>Destination</span>
                                <strong>${escapeHtml(ticket.destination)}</strong>
                            </div>
                            <div class="ticket-detail">
                                <span>Gate</span>
                                <strong>${escapeHtml(ticket.gate)}</strong>
                            </div>
                            <div class="ticket-detail">
                                <span>Time</span>
                                <strong>${escapeHtml(formatDateTime(ticket.departure_time))}</strong>
                            </div>
                            <div class="ticket-detail">
                                <span>Airport</span>
                                <strong>${airportLabel}</strong>
                            </div>
                        </div>
                        ${ticket.notes ? `<p class="ticket-notes">${escapeHtml(ticket.notes)}</p>` : ""}
                    </article>
                `;
            })
            .join("");
        dashboard.ticketsSection.appendChild(grid);
    }

    function renderBoard(tickets) {
        if (!dashboard.board) {
            return;
        }

        const head = `
            <div class="board-head">
                <span class="board-cell">Flight</span>
                <span class="board-cell">Destination</span>
                <span class="board-cell">Gate</span>
                <span class="board-cell">Time</span>
                <span class="board-cell">Status</span>
            </div>
        `;

        const rows = tickets.length
            ? tickets
                  .map(
                      (ticket) => `
                          <div class="board-row">
                              <span class="board-cell"><i class="bi bi-airplane-fill"></i> ${escapeHtml(ticket.flight_number)}</span>
                              <span class="board-cell">${escapeHtml(ticket.destination)}</span>
                              <span class="board-cell"><i class="bi bi-sign-turn-right-fill"></i> ${escapeHtml(ticket.gate)}</span>
                              <span class="board-cell"><i class="bi bi-clock-fill"></i> ${escapeHtml(formatBoardTime(ticket.departure_time))}</span>
                              <span class="board-cell board-status--${escapeHtml(ticket.status)}">
                                  <span class="board-flip">${escapeHtml(formatStatus(ticket.status))}</span>
                              </span>
                          </div>
                      `,
                  )
                  .join("")
            : `
                <div class="board-row">
                    <span class="board-cell"><i class="bi bi-airplane-fill"></i> --</span>
                    <span class="board-cell">Your saved flights will appear here</span>
                    <span class="board-cell"><i class="bi bi-sign-turn-right-fill"></i> --</span>
                    <span class="board-cell"><i class="bi bi-clock-fill"></i> --:--</span>
                    <span class="board-cell"><span class="board-flip">Waiting</span></span>
                </div>
            `;

        dashboard.board.innerHTML = `${head}${rows}`;
    }

    function renderChat(chatMessages) {
        if (!dashboard.chatLog) {
            return;
        }

        dashboard.chatLog.innerHTML = chatMessages
            .map((message) => {
                const isBot = message.role === "bot";
                return `
                    <div class="chat-message chat-message-${escapeHtml(message.role)}">
                        ${isBot ? createBotAvatarMarkup() : ""}
                        <div class="message-stack">
                            <div class="chat-bubble ${isBot ? "chat-bubble-bot" : "chat-bubble-user"}">
                                ${escapeHtml(message.message).replace(/\n/g, "<br>")}
                            </div>
                            <span class="chat-timestamp">${escapeHtml(formatClock(message.created_at))}</span>
                        </div>
                    </div>
                `;
            })
            .join("");
        dashboard.chatLog.scrollTop = dashboard.chatLog.scrollHeight;
    }

    function bindOfflineChatForm() {
        if (!dashboard.chatForm) {
            return;
        }

        dashboard.chatForm.addEventListener(
            "submit",
            async (event) => {
                if (navigator.onLine) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();

                const input = dashboard.chatForm.querySelector('input[name="message"]');
                const message = String(input.value || "").trim();
                if (!message) {
                    return;
                }

                const timestamp = new Date().toISOString();
                const localUserId = OfflineAirportDB.makeId("chat-user");
                const localBotId = OfflineAirportDB.makeId("chat-bot");

                await OfflineAirportDB.put(OfflineAirportDB.STORES.chat, {
                    id: localUserId,
                    role: "user",
                    message,
                    created_at: timestamp,
                });
                await OfflineAirportDB.put(OfflineAirportDB.STORES.chat, {
                    id: localBotId,
                    role: "bot",
                    message: "You are offline right now. I saved that question and I will sync it when the connection returns.",
                    created_at: new Date(Date.now() + 1000).toISOString(),
                });
                await OfflineAirportDB.queueChange("chat_prompt", { message });
                await renderCachedState();
                input.value = "";
                notify("Message saved offline. It will sync automatically.", "info");
                await requestBackgroundSync();
            },
            true,
        );
    }

    function bindOfflineTicketForm() {
        if (!dashboard.ticketForm) {
            return;
        }

        dashboard.ticketForm.addEventListener(
            "submit",
            async (event) => {
                if (navigator.onLine) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();

                const formData = new FormData(dashboard.ticketForm);
                const payload = {
                    id: OfflineAirportDB.makeId("ticket"),
                    flight_number: String(formData.get("flight_number") || "").trim(),
                    destination: String(formData.get("destination") || "").trim(),
                    gate: String(formData.get("gate") || "").trim(),
                    departure_time: String(formData.get("departure_time") || "").trim(),
                    status: String(formData.get("status") || "on_time").trim() || "on_time",
                    airline: String(formData.get("airline") || "").trim(),
                    departure_airport: String(formData.get("departure_airport") || "").trim(),
                    notes: String(formData.get("notes") || "").trim(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                if (!payload.flight_number || !payload.destination || !payload.gate || !payload.departure_time) {
                    notify("Flight number, destination, gate, and time are required.", "error");
                    return;
                }

                await OfflineAirportDB.put(OfflineAirportDB.STORES.tickets, payload);
                await OfflineAirportDB.queueChange("ticket_upsert", payload);
                notify("Ticket saved offline. It will sync when internet returns.", "success");
                await requestBackgroundSync();

                if (config.dashboardUrl) {
                    window.location.href = config.dashboardUrl;
                }
            },
            true,
        );
    }

    function bindOfflineTicketDeletes() {
        document.querySelectorAll('#tickets form[action*="/tickets/"]').forEach((form) => {
            form.addEventListener(
                "submit",
                async (event) => {
                    if (navigator.onLine) {
                        return;
                    }

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    const match = form.action.match(/\/tickets\/([^/]+)\/delete\/?$/);
                    const ticketId = match ? match[1] : "";
                    if (!ticketId) {
                        return;
                    }

                    await OfflineAirportDB.delete(OfflineAirportDB.STORES.tickets, Number(ticketId) || ticketId);
                    await OfflineAirportDB.queueChange("ticket_delete", { id: ticketId });
                    await renderCachedState();
                    notify("Ticket removal saved offline. It will sync automatically.", "info");
                    await requestBackgroundSync();
                },
                true,
            );
        });
    }

    async function syncQueuedChanges() {
        const queuedChanges = await OfflineAirportDB.getQueuedChanges();
        if (!queuedChanges.length || !navigator.onLine || !config.syncUrl) {
            return;
        }

        const payload = buildSyncPayload(queuedChanges);
        if (!payload) {
            await OfflineAirportDB.clearQueue();
            return;
        }

        try {
            const response = await fetch(config.syncUrl, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
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
            await renderPayload(data);
        } catch (error) {
            console.warn("Queued sync failed.", error);
        }
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
                    payload.pending_chat_prompts.push({ message: prompt, local_id: record.id });
                }
            }
        });

        if (!payload.tickets.length && !payload.deleted_ticket_ids.length && !payload.pending_chat_prompts.length) {
            return null;
        }

        return payload;
    }

    async function requestBackgroundSync() {
        if (!("serviceWorker" in navigator)) {
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        if ("sync" in registration) {
            try {
                await registration.sync.register("offlineairportguide-sync");
                return;
            } catch (_error) {
                // Fall through to direct sync if Background Sync is unavailable.
            }
        }

        if (navigator.onLine) {
            await syncQueuedChanges();
        }
    }

    function ensureBanner() {
        if (document.querySelector("[data-connectivity-banner]")) {
            return;
        }

        const banner = document.createElement("div");
        banner.dataset.connectivityBanner = "true";
        banner.style.position = "fixed";
        banner.style.bottom = "1rem";
        banner.style.right = "1rem";
        banner.style.zIndex = "9999";
        banner.style.padding = "0.85rem 1rem";
        banner.style.borderRadius = "999px";
        banner.style.background = "rgba(26, 42, 79, 0.92)";
        banner.style.color = "#ffffff";
        banner.style.boxShadow = "0 10px 30px rgba(0,0,0,0.18)";
        banner.style.fontSize = "0.92rem";
        banner.style.display = "none";
        document.body.appendChild(banner);
    }

    function setConnectivityState(isOnline) {
        const banner = document.querySelector("[data-connectivity-banner]");
        if (!banner) {
            return;
        }

        banner.style.display = "block";
        banner.textContent = isOnline ? "Back online. Sync is active." : "Offline mode. Using saved airport data.";
        banner.style.background = isOnline ? "rgba(34, 88, 63, 0.94)" : "rgba(26, 42, 79, 0.94)";
    }

    function notify(message, level) {
        const banner = document.querySelector("[data-connectivity-banner]");
        if (!banner) {
            return;
        }

        banner.textContent = message;
        banner.style.display = "block";
        banner.style.background = level === "success"
            ? "rgba(34, 88, 63, 0.94)"
            : level === "error"
                ? "rgba(124, 32, 50, 0.94)"
                : "rgba(26, 42, 79, 0.94)";
    }

    function createBotAvatarMarkup() {
        return `
            <div class="bot-avatar">
                <span class="bot-avatar-orbit"></span>
                <span class="bot-avatar-core">
                    <span class="bot-avatar-emoji" aria-hidden="true">&#128587;&#8205;&#9792;&#65039;</span>
                </span>
            </div>
        `;
    }

    function formatDateTime(value) {
        if (!value) {
            return "--";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return new Intl.DateTimeFormat([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    }

    function formatBoardTime(value) {
        if (!value) {
            return "--:--";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return new Intl.DateTimeFormat([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(date);
    }

    function formatClock(value) {
        if (!value) {
            return "";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return new Intl.DateTimeFormat([], {
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    }

    function formatStatus(status) {
        return {
            on_time: "On Time",
            delayed: "Delayed",
            cancelled: "Cancelled",
        }[status] || "Saved";
    }

    function statusColorMap(status) {
        return {
            on_time: "green",
            delayed: "orange",
            cancelled: "red",
        }[status] || "green";
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
