document.addEventListener("DOMContentLoaded", () => {
    const gpsController = initGpsHelper();

    initLoader();
    initReveal();
    initFlashSparkles();
    initFocusTargets();
    initChatAssistant(gpsController);
});

function initLoader() {
    const loader = document.querySelector("[data-loader]");
    if (!loader) {
        return;
    }

    const hideLoader = () => {
        loader.classList.add("is-hidden");
        window.setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 650);
    };

    window.addEventListener("load", hideLoader, { once: true });
    window.setTimeout(hideLoader, 1400);
}

function initReveal() {
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!revealItems.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 },
    );

    revealItems.forEach((item) => observer.observe(item));
}

function initFlashSparkles() {
    document.querySelectorAll("[data-flash].flash--success").forEach((flash) => {
        for (let index = 0; index < 7; index += 1) {
            const sparkle = document.createElement("span");
            sparkle.className = "sparkle";
            sparkle.style.left = `${12 + index * 11}%`;
            sparkle.style.top = `${20 + (index % 3) * 18}%`;
            sparkle.style.animationDelay = `${index * 0.08}s`;
            flash.appendChild(sparkle);
        }
    });
}

function initFocusTargets() {
    document.querySelectorAll("[data-focus-target]").forEach((button) => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.focusTarget);
            if (!target) {
                return;
            }

            target.focus();
            target.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });
}

function initChatAssistant(gpsController) {
    const chatForm = document.querySelector("[data-chat-form]");
    const chatLog = document.querySelector("[data-chat-log]");

    if (!chatForm || !chatLog) {
        return;
    }

    const chatInput = chatForm.querySelector('input[name="message"]');
    const submitButton = chatForm.querySelector(".chat-send-button");
    const csrfToken = chatForm.querySelector("[name=csrfmiddlewaretoken]").value;

    const scrollToBottom = () => {
        chatLog.scrollTop = chatLog.scrollHeight;
    };

    const formatTime = () =>
        new Intl.DateTimeFormat([], {
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date());

    const createBotAvatar = () => {
        const avatar = document.createElement("div");
        avatar.className = "bot-avatar";
        avatar.innerHTML = '<span class="bot-avatar-orbit"></span><span class="bot-avatar-core"><span class="bot-avatar-emoji" aria-hidden="true">&#128587;&#8205;&#9792;&#65039;</span></span>';
        return avatar;
    };

    const createMessageNode = (role, message, timestamp) => {
        const wrapper = document.createElement("div");
        wrapper.className = `chat-message chat-message-${role}`;

        if (role === "bot") {
            wrapper.appendChild(createBotAvatar());
        }

        const stack = document.createElement("div");
        stack.className = "message-stack";

        const bubble = document.createElement("div");
        bubble.className = role === "user" ? "chat-bubble chat-bubble-user" : "chat-bubble chat-bubble-bot";
        bubble.textContent = message;

        const stamp = document.createElement("span");
        stamp.className = "chat-timestamp";
        stamp.textContent = timestamp;

        stack.appendChild(bubble);
        stack.appendChild(stamp);
        wrapper.appendChild(stack);
        return wrapper;
    };

    const createTypingNode = () => {
        const wrapper = document.createElement("div");
        wrapper.className = "chat-message chat-message-bot";
        wrapper.dataset.typing = "true";
        wrapper.appendChild(createBotAvatar());

        const stack = document.createElement("div");
        stack.className = "message-stack";

        const bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-bot typing-bubble";
        bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        stack.appendChild(bubble);
        wrapper.appendChild(stack);
        return wrapper;
    };

    const appendMessage = (role, message, timestamp = formatTime()) => {
        chatLog.appendChild(createMessageNode(role, message, timestamp));
        scrollToBottom();
    };

    document.querySelectorAll("[data-chat-suggestion]").forEach((button) => {
        button.addEventListener("click", () => {
            chatInput.value = button.dataset.chatSuggestion;
            chatInput.focus();
        });
    });

    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (!message) {
            chatInput.focus();
            return;
        }

        appendMessage("user", message);
        chatInput.value = "";

        const typingNode = createTypingNode();
        chatLog.appendChild(typingNode);
        scrollToBottom();
        submitButton.disabled = true;

        try {
            const localReply = await resolveLocalAssistantShortcut(message, gpsController);
            typingNode.remove();

            if (localReply) {
                appendMessage("bot", localReply);
                return;
            }

            const formData = new FormData();
            formData.append("message", message);

            const response = await fetch(chatForm.action, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData,
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Something went wrong.");
            }

            appendMessage("bot", payload.bot.message, payload.bot.timestamp);
        } catch (error) {
            if (typingNode.parentNode) {
                typingNode.remove();
            }
            appendMessage("bot", error.message || "The concierge hit a small snag, but I am still here.");
        } finally {
            submitButton.disabled = false;
            chatInput.focus();
            scrollToBottom();
        }
    });

    scrollToBottom();
}

async function resolveLocalAssistantShortcut(message, gpsController) {
    if (!gpsController) {
        return null;
    }

    const normalized = message.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

    if (normalized.includes("where am i") || normalized.includes("current location")) {
        return gpsController.describeCurrentLocation();
    }

    if (
        normalized.includes("how do i get to my gate") ||
        normalized.includes("directions to my gate") ||
        normalized === "my gate"
    ) {
        return gpsController.navigateToTicketGate();
    }

    if (
        normalized.includes("find nearest coffee") ||
        normalized.includes("nearest coffee") ||
        normalized.includes("find coffee")
    ) {
        return gpsController.navigateToNearest("coffee");
    }

    if (normalized.includes("find nearest bathroom") || normalized.includes("bathroom nearby")) {
        return gpsController.navigateToNearest("bathroom");
    }

    if (normalized.includes("baggage claim")) {
        return gpsController.navigateToNearest("baggage");
    }

    return null;
}

function initGpsHelper() {
    const root = document.querySelector("[data-gps-app]");
    if (!root || !window.AIRPORT_MAP_DATA || !window.AIRPORT_MAP_DATA.airports) {
        return null;
    }

    const airports = buildAirportModels(window.AIRPORT_MAP_DATA.airports);
    const elements = {
        switchButtons: Array.from(root.querySelectorAll("[data-airport-code]")),
        searchForm: root.querySelector("[data-gps-search]"),
        searchInput: root.querySelector("#gps-destination"),
        datalist: root.querySelector("#gps-destinations"),
        locateButton: root.querySelector("[data-locate-user]"),
        quickButtons: Array.from(root.querySelectorAll("[data-gps-target]")),
        map: root.querySelector("[data-gps-map]"),
        status: root.querySelector("[data-gps-status]"),
        summary: root.querySelector("[data-gps-summary]"),
        airportName: root.querySelector("[data-gps-airport-name]"),
        estimate: root.querySelector("[data-gps-estimate]"),
        destination: root.querySelector("[data-gps-destination]"),
        directions: root.querySelector("[data-gps-directions]"),
    };

    const state = {
        airports,
        activeAirportCode: inferAirportCode(root.dataset.defaultAirport) || "JFK",
        ticketGate: (root.dataset.ticketGate || "").trim(),
        userPosition: null,
        destinationId: null,
        routeNodeIds: [],
        routeDistanceFeet: 0,
        geolocationEnabled: false,
    };

    hydrateMapCache();
    restoreGpsState(state);
    populateDatalist();
    bindEvents();
    render();

    return {
        describeCurrentLocation,
        navigateToTicketGate,
        navigateToNearest,
    };

    function bindEvents() {
        elements.switchButtons.forEach((button) => {
            button.addEventListener("click", () => {
                state.activeAirportCode = button.dataset.airportCode;
                state.destinationId = null;
                state.userPosition = createFallbackUserPosition(currentAirport());
                persistGpsState(state);
                populateDatalist();
                render();
            });
        });

        elements.searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const query = elements.searchInput.value.trim();
            if (!query) {
                elements.searchInput.focus();
                return;
            }
            navigateToQuery(query);
        });

        elements.locateButton.addEventListener("click", () => {
            requestUserLocation();
        });

        elements.quickButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.gpsTarget;
                if (target === "gate") {
                    navigateToTicketGate();
                    return;
                }
                navigateToNearest(target);
            });
        });
    }

    function currentAirport() {
        return state.airports[state.activeAirportCode] || state.airports.JFK;
    }

    function populateDatalist() {
        const airport = currentAirport();
        const options = new Set(["Gate", "Bathroom", "Coffee", "Baggage Claim", "Food"]);

        airport.points.forEach((point) => {
            options.add(point.label);
            point.keywords.forEach((keyword) => options.add(keyword));
        });

        elements.datalist.innerHTML = Array.from(options)
            .sort()
            .map((option) => `<option value="${escapeHtml(option)}"></option>`)
            .join("");

        elements.searchInput.placeholder = `Where do you want to go in ${airport.code}?`;
    }

    function render() {
        const airport = currentAirport();
        if (!state.userPosition) {
            state.userPosition = createFallbackUserPosition(airport);
        }

        elements.switchButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.airportCode === state.activeAirportCode);
        });

        const destination = getPointById(airport, state.destinationId);
        const travelMinutes = Math.max(0, Math.round(state.routeDistanceFeet / 260));

        elements.airportName.textContent = `${airport.name} · ${airport.terminal}`;
        elements.estimate.textContent = destination ? `${travelMinutes || 1} min` : "0 min";
        elements.destination.textContent = destination ? destination.label : "Choose a gate or amenity";
        elements.summary.textContent = destination
            ? `You are ${travelMinutes || 1} minutes from ${destination.label}`
            : `You are viewing ${airport.code} with cached airport maps`;
        elements.status.textContent = state.geolocationEnabled
            ? `📍 Live location near ${nearestPointToUser(airport, state.userPosition).label}`
            : `📍 Using cached indoor map in ${airport.code}. Tap to share your live location.`;

        renderDirections(airport, destination);
        renderMap(airport, destination);
        persistGpsState(state);
    }

    function renderDirections(airport, destination) {
        if (!destination || !state.routeNodeIds.length) {
            elements.directions.innerHTML = "<li>Choose a destination to draw your path and see walking directions.</li>";
            return;
        }

        const pathNodes = state.routeNodeIds.map((id) => getPointById(airport, id)).filter(Boolean);
        const steps = buildDirections(pathNodes, airport);
        elements.directions.innerHTML = steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    }

    function renderMap(airport, destination) {
        const routePoints = state.routeNodeIds
            .map((id) => getPointById(airport, id))
            .filter(Boolean)
            .map((point) => `${point.x},${point.y}`);

        const routeMarkup = destination && routePoints.length
            ? `<polyline class="route-line" points="${state.userPosition.x},${state.userPosition.y} ${routePoints.join(" ")}"></polyline>`
            : "";

        const zonesMarkup = airport.zones
            .map(
                (zone) => `
                    <g>
                        <rect class="map-zone" x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="26"></rect>
                        <text class="map-zone-label" x="${zone.x + 18}" y="${zone.y + 28}">${escapeHtml(zone.label)}</text>
                    </g>
                `,
            )
            .join("");

        const corridorMarkup = airport.edges
            .map((edge) => {
                const from = getPointById(airport, edge.from);
                const to = getPointById(airport, edge.to);
                return `<line class="map-corridor" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
            })
            .join("");

        const pointsMarkup = airport.points
            .map((point) => {
                const isDestination = destination && destination.id === point.id;
                return `
                    <g class="map-point map-point--${point.type} ${isDestination ? "map-point--destination" : ""}" transform="translate(${point.x}, ${point.y})">
                        ${isDestination ? '<circle class="map-destination-ring" r="22"></circle>' : ""}
                        <circle class="map-marker-circle" r="15"></circle>
                        <text class="map-marker-icon" y="6">${escapeHtml(point.icon)}</text>
                        <text class="map-point-label" x="24" y="5">${escapeHtml(point.shortLabel || point.label)}</text>
                    </g>
                `;
            })
            .join("");

        elements.map.innerHTML = `
            <svg viewBox="0 0 ${airport.width} ${airport.height}" aria-label="${escapeHtml(airport.name)} terminal map">
                ${zonesMarkup}
                ${corridorMarkup}
                ${routeMarkup}
                ${pointsMarkup}
                <g transform="translate(${state.userPosition.x}, ${state.userPosition.y})">
                    <circle class="map-user-pulse" r="28"></circle>
                    <circle class="map-user-dot" r="11"></circle>
                </g>
            </svg>
        `;
    }

    function navigateToQuery(query) {
        const airport = currentAirport();
        const destination = resolveDestination(airport, query, state.ticketGate, state.userPosition);
        if (!destination) {
            elements.status.textContent = `📍 I could not find “${query}” in ${airport.code}. Try a gate, coffee, bathroom, food, or baggage claim.`;
            return `I could not find ${query} on the cached ${airport.code} map.`;
        }

        state.destinationId = destination.id;
        buildRouteToDestination(destination);
        elements.searchInput.value = destination.label;
        render();
        const minutes = Math.max(1, Math.round(state.routeDistanceFeet / 260));
        return `📍 ${destination.label} is about ${minutes} minutes away. I drew the walking path on your map.`;
    }

    async function navigateToTicketGate() {
        if (!state.ticketGate) {
            render();
            return "✈️ Save a ticket with a gate first, then I can draw directions to it.";
        }

        return navigateToQuery(state.ticketGate);
    }

    async function navigateToNearest(type) {
        const airport = currentAirport();
        const destination = nearestPointByType(airport, type, state.userPosition);
        if (!destination) {
            return `📍 I could not find a ${type} stop on the cached ${airport.code} map.`;
        }

        state.destinationId = destination.id;
        buildRouteToDestination(destination);
        render();
        const minutes = Math.max(1, Math.round(state.routeDistanceFeet / 260));
        return `📍 ${destination.label} is about ${minutes} minutes away. I highlighted the route for you.`;
    }

    async function describeCurrentLocation() {
        await requestUserLocation({ quiet: true });
        const airport = currentAirport();
        const nearest = nearestPointToUser(airport, state.userPosition);
        render();
        return `📍 You are closest to ${nearest.label} in ${airport.name}. I pinned your location on the map.`;
    }

    function buildRouteToDestination(destination) {
        const airport = currentAirport();
        const origin = nearestPointToUser(airport, state.userPosition);
        const route = shortestPath(airport, origin.id, destination.id);
        state.routeNodeIds = route.pathIds;
        state.routeDistanceFeet = route.distanceFeet;
    }

    async function requestUserLocation(options = {}) {
        const quiet = Boolean(options.quiet);
        const airport = currentAirport();

        if (!navigator.geolocation) {
            state.geolocationEnabled = false;
            state.userPosition = createFallbackUserPosition(airport);
            render();
            return state.userPosition;
        }

        const projected = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    state.geolocationEnabled = true;
                    resolve(projectPositionToAirport(position.coords.latitude, position.coords.longitude, airport));
                },
                () => {
                    state.geolocationEnabled = false;
                    resolve(createFallbackUserPosition(airport));
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 15000,
                    timeout: 12000,
                },
            );
        });

        state.userPosition = projected;

        if (state.destinationId) {
            const destination = getPointById(airport, state.destinationId);
            if (destination) {
                buildRouteToDestination(destination);
            }
        }

        if (!quiet) {
            render();
        }

        return projected;
    }
}

function buildAirportModels(airports) {
    return Object.fromEntries(
        Object.entries(airports).map(([code, airport]) => {
            const points = airport.points.map((point) => ({
                ...point,
                keywords: point.keywords || [],
                shortLabel: point.shortLabel || point.label,
            }));
            const pointMap = Object.fromEntries(points.map((point) => [point.id, point]));
            const edges = airport.edges.map((edge) => ({
                ...edge,
                distanceFeet: edge.distanceFeet || Math.round(distanceBetween(pointMap[edge.from], pointMap[edge.to]) * airport.feetPerUnit),
            }));
            const adjacency = {};

            points.forEach((point) => {
                adjacency[point.id] = [];
            });

            edges.forEach((edge) => {
                adjacency[edge.from].push({ id: edge.to, distanceFeet: edge.distanceFeet });
                adjacency[edge.to].push({ id: edge.from, distanceFeet: edge.distanceFeet });
            });

            return [
                code,
                {
                    ...airport,
                    code,
                    points,
                    pointMap,
                    edges,
                    adjacency,
                },
            ];
        }),
    );
}

function hydrateMapCache() {
    try {
        localStorage.setItem("offline-airport-map-data", JSON.stringify(window.AIRPORT_MAP_DATA));
    } catch (_error) {
        return;
    }
}

function restoreGpsState(state) {
    try {
        const raw = localStorage.getItem("offline-airport-gps-state");
        if (!raw) {
            return;
        }

        const stored = JSON.parse(raw);
        if (stored.activeAirportCode && state.airports[stored.activeAirportCode]) {
            state.activeAirportCode = stored.activeAirportCode;
        }
        if (stored.destinationId) {
            state.destinationId = stored.destinationId;
        }
        if (stored.userPosition && stored.userPosition.airportCode === state.activeAirportCode) {
            state.userPosition = stored.userPosition;
        }
    } catch (_error) {
        return;
    }
}

function persistGpsState(state) {
    try {
        localStorage.setItem(
            "offline-airport-gps-state",
            JSON.stringify({
                activeAirportCode: state.activeAirportCode,
                destinationId: state.destinationId,
                userPosition: state.userPosition ? { ...state.userPosition, airportCode: state.activeAirportCode } : null,
            }),
        );
    } catch (_error) {
        return;
    }
}

function inferAirportCode(value) {
    const match = String(value || "").toUpperCase().match(/\b(JFK|LAX|ORD)\b/);
    return match ? match[1] : null;
}

function createFallbackUserPosition(airport) {
    const fallbackPoint = airport.pointMap[airport.defaultLocationId] || airport.points[0];
    return {
        x: fallbackPoint.x - 10,
        y: fallbackPoint.y + 14,
    };
}

function projectPositionToAirport(latitude, longitude, airport) {
    const { bounds, width, height } = airport;
    const withinLatitude = latitude <= bounds.north && latitude >= bounds.south;
    const withinLongitude = longitude >= bounds.west && longitude <= bounds.east;

    if (!withinLatitude || !withinLongitude) {
        return createFallbackUserPosition(airport);
    }

    const xRatio = (longitude - bounds.west) / (bounds.east - bounds.west);
    const yRatio = (bounds.north - latitude) / (bounds.north - bounds.south);

    return {
        x: clamp(Math.round(xRatio * width), 44, width - 44),
        y: clamp(Math.round(yRatio * height), 44, height - 44),
    };
}

function resolveDestination(airport, query, ticketGate, userPosition) {
    const normalized = query.toLowerCase().trim();

    if (!normalized) {
        return null;
    }

    if (normalized.includes("bathroom") || normalized.includes("restroom") || normalized.includes("toilet")) {
        return nearestPointByType(airport, "bathroom", userPosition);
    }

    if (normalized.includes("coffee") || normalized.includes("starbucks")) {
        return nearestPointByType(airport, "coffee", userPosition);
    }

    if (normalized.includes("food") || normalized.includes("pizza") || normalized.includes("restaurant")) {
        return nearestPointByType(airport, "food", userPosition);
    }

    if (normalized.includes("baggage")) {
        return nearestPointByType(airport, "baggage", userPosition);
    }

    if (normalized.includes("gate") || /^[a-z]\d+/i.test(normalized) || /^\d+[a-z]?$/i.test(normalized)) {
        const gateMatch = normalized.match(/([a-z]?\d+[a-z]?|[a-z]\d+)/i);
        const gateQuery = gateMatch ? gateMatch[1].toUpperCase() : ticketGate;
        return findGate(airport, gateQuery);
    }

    const exact = airport.points.find(
        (point) =>
            point.label.toLowerCase() === normalized ||
            point.keywords.some((keyword) => keyword.toLowerCase() === normalized),
    );
    if (exact) {
        return exact;
    }

    return (
        airport.points.find(
            (point) =>
                point.label.toLowerCase().includes(normalized) ||
                point.keywords.some((keyword) => keyword.toLowerCase().includes(normalized)),
        ) || null
    );
}

function findGate(airport, gateCode) {
    if (!gateCode) {
        return airport.points.find((point) => point.type === "gate") || null;
    }

    const normalizedGate = gateCode.replace(/^gate\s+/i, "").toUpperCase();
    return (
        airport.points.find(
            (point) =>
                point.type === "gate" &&
                (point.label.toUpperCase().includes(normalizedGate) ||
                    point.keywords.some((keyword) => keyword.toUpperCase() === normalizedGate)),
        ) || airport.points.find((point) => point.type === "gate") || null
    );
}

function nearestPointByType(airport, type, userPosition) {
    const matches = airport.points.filter((point) => point.type === type);
    if (!matches.length) {
        return null;
    }

    const origin = userPosition || createFallbackUserPosition(airport);
    return matches.reduce((closest, candidate) =>
        distanceBetween(origin, candidate) < distanceBetween(origin, closest) ? candidate : closest,
    );
}

function nearestPointToUser(airport, userPosition) {
    const origin = userPosition || createFallbackUserPosition(airport);
    return airport.points.reduce((closest, point) =>
        distanceBetween(origin, point) < distanceBetween(origin, closest) ? point : closest,
    );
}

function shortestPath(airport, startId, endId) {
    const distances = {};
    const previous = {};
    const unvisited = new Set(airport.points.map((point) => point.id));

    airport.points.forEach((point) => {
        distances[point.id] = Number.POSITIVE_INFINITY;
    });
    distances[startId] = 0;

    while (unvisited.size) {
        let currentId = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        unvisited.forEach((candidateId) => {
            if (distances[candidateId] < bestDistance) {
                bestDistance = distances[candidateId];
                currentId = candidateId;
            }
        });

        if (currentId === null || currentId === endId) {
            break;
        }

        unvisited.delete(currentId);

        airport.adjacency[currentId].forEach((neighbor) => {
            if (!unvisited.has(neighbor.id)) {
                return;
            }

            const nextDistance = distances[currentId] + neighbor.distanceFeet;
            if (nextDistance < distances[neighbor.id]) {
                distances[neighbor.id] = nextDistance;
                previous[neighbor.id] = currentId;
            }
        });
    }

    const pathIds = [];
    let currentId = endId;
    while (currentId) {
        pathIds.unshift(currentId);
        currentId = previous[currentId];
    }

    return {
        pathIds,
        distanceFeet: Math.round(distances[endId] || 0),
    };
}

function buildDirections(pathNodes, airport) {
    if (pathNodes.length < 2) {
        return ["You are already at your destination."];
    }

    const steps = [];
    for (let index = 0; index < pathNodes.length - 1; index += 1) {
        const current = pathNodes[index];
        const next = pathNodes[index + 1];
        const feet = Math.round(distanceBetween(current, next) * airport.feetPerUnit);
        const previous = index > 0 ? pathNodes[index - 1] : null;
        let prefix = index === 0 ? "Walk" : "Continue";

        if (previous) {
            const turn = determineTurn(previous, current, next);
            if (turn !== "straight") {
                prefix = `Turn ${turn} and continue`;
            }
        }

        let step = `${prefix} ${feet} feet to ${next.label}.`;
        if (index === pathNodes.length - 2) {
            step = `${prefix} ${feet} feet to ${next.label}. ${arrivalHint(next)}`;
        }
        steps.push(step);
    }

    return steps;
}

function determineTurn(previous, current, next) {
    const firstAngle = Math.atan2(current.y - previous.y, current.x - previous.x);
    const secondAngle = Math.atan2(next.y - current.y, next.x - current.x);
    let delta = ((secondAngle - firstAngle) * 180) / Math.PI;

    while (delta <= -180) {
        delta += 360;
    }
    while (delta > 180) {
        delta -= 360;
    }

    if (Math.abs(delta) < 25) {
        return "straight";
    }
    return delta > 0 ? "left" : "right";
}

function arrivalHint(point) {
    const hints = {
        gate: "Your gate marker is highlighted ahead.",
        bathroom: "The restroom is just ahead on your right.",
        coffee: "Your coffee stop is highlighted ahead.",
        food: "Your food stop is waiting just ahead.",
        baggage: "Baggage claim will be directly ahead.",
    };
    return hints[point.type] || "Your destination is highlighted on the map.";
}

function getPointById(airport, id) {
    return airport.pointMap[id] || null;
}

function distanceBetween(a, b) {
    if (!a || !b) {
        return 0;
    }
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
