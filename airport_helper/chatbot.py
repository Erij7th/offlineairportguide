from django.utils import timezone


TERMINAL_GUIDE = {
    "A": {
        "food": "Cloud Nine Cafe ☕ and Runway Pizza 🍕 are both a short stroll from the A gates.",
        "restroom": "Restrooms are usually closest to A4 and A11, with a family room near the center hub.",
        "fun": "If you have time to spare, the A concourse lounge nook has soft seating and charging spots.",
    },
    "B": {
        "food": "Try Golden Gate Bites ✨ for sandwiches or Jet Fuel Coffee ☕ for a quick caffeine stop.",
        "restroom": "The easiest restroom stops are near B6 and B15, with water refill points nearby.",
        "fun": "The B hall usually has the calmest window seats for plane spotting and relaxing.",
    },
    "C": {
        "food": "C gates are best for Harbor Grill 🍔 and Cloud Cup Coffee ☕ before boarding.",
        "restroom": "Look near C3 and C10 for the nearest restrooms, plus a quiet nursing room in the center.",
        "fun": "C concourse has the friendliest charging bar for catching up on messages or podcasts.",
    },
    "D": {
        "food": "Skyline Kitchen 🍜 and Gate Side Snacks 🥨 are the fastest options around the D corridor.",
        "restroom": "Restrooms are typically easiest to find close to D2 and D9.",
        "fun": "D is great for a quick lap, a snack, and some people-watching before your flight.",
    },
    "MAIN": {
        "food": "The main hub usually has coffee, pizza, and a grab-and-go snack market within a few minutes.",
        "restroom": "Restrooms are usually posted near the main atrium and security exit points.",
        "fun": "The central seating zone is the best spot for charging up and taking a quiet break.",
    },
}

JOKES = [
    "Why did the airplane bring a pencil? It wanted to draw a flight plan ✈️",
    "I told the gate agent a joke about turbulence... it had a few ups and downs 😄",
    "Airports are proof that walking in circles can still count as progress 💙",
]


def build_bot_reply(user, prompt):
    prompt_lower = prompt.lower()
    ticket = _select_ticket(user, prompt_lower)

    if any(word in prompt_lower for word in ("hello", "hi", "hey", "good morning", "good evening")):
        return _hello_reply(user, ticket)

    if any(word in prompt_lower for word in ("joke", "funny", "laugh")):
        return _pick_joke(prompt)

    if any(word in prompt_lower for word in ("bored", "kill time", "waiting", "what should i do")):
        return _fun_reply(ticket)

    if any(word in prompt_lower for word in ("food", "coffee", "eat", "restaurant", "pizza", "hungry")):
        return _food_reply(ticket)

    if any(word in prompt_lower for word in ("bathroom", "restroom", "toilet", "washroom")):
        return _restroom_reply(ticket)

    if any(word in prompt_lower for word in ("wifi", "offline", "internet", "signal", "airplane mode")):
        return (
            "You can still rely on your saved ticket details here even when airport WiFi is having a dramatic moment. "
            "If you go online later, you can refresh updates without losing anything 💾"
        )

    if any(word in prompt_lower for word in ("gate", "terminal", "where is my flight", "where am i going")):
        return _gate_reply(ticket)

    if any(word in prompt_lower for word in ("delay", "delayed", "status", "cancelled", "canceled", "on time")):
        return _status_reply(ticket)

    if any(word in prompt_lower for word in ("time", "board", "boarding", "when do i leave", "departure")):
        return _time_reply(ticket)

    if any(word in prompt_lower for word in ("help", "what can you do", "options")):
        return _capability_reply(ticket)

    if ticket:
        return (
            f"Your closest trip is {ticket.flight_number} to {ticket.destination}, leaving from gate {ticket.gate} "
            f"at {_format_ticket_time(ticket)}. Ask about food, bathrooms, status, or just say 'tell me a joke' 🤖"
        )

    return (
        "I can help once you save a ticket. Add one with the Scan New Ticket button and I’ll be ready with gate info, "
        "food tips, restroom directions, and travel-friendly small talk ✈️"
    )


def _select_ticket(user, prompt_lower):
    tickets = list(user.tickets.all())
    if not tickets:
        return None

    for ticket in tickets:
        if ticket.flight_number.lower() in prompt_lower:
            return ticket

    now = timezone.now()
    upcoming_tickets = [ticket for ticket in tickets if ticket.departure_time >= now]
    return upcoming_tickets[0] if upcoming_tickets else tickets[0]


def _hello_reply(user, ticket):
    if ticket:
        return (
            f"Hi {user.username}! Your next flight is {ticket.flight_number} to {ticket.destination}. "
            f"Want gate details, food nearby, or a quick airport joke? 💬"
        )
    return f"Hi {user.username}! Save a ticket and I’ll help with the little airport details that usually cause stress."


def _gate_reply(ticket):
    if not ticket:
        return "Save a ticket first and I’ll tell you exactly which gate to head toward."
    return (
        f"{ticket.flight_number} is set for gate {ticket.gate}. "
        f"If you're heading there now, {_guide(ticket)['fun'].lower()}"
    )


def _status_reply(ticket):
    if not ticket:
        return "Once you add a ticket, I can track its saved status for you."
    return (
        f"{ticket.flight_number} to {ticket.destination} is currently {ticket.get_status_display().lower()}. "
        f"It departs at {_format_ticket_time(ticket)} from gate {ticket.gate}."
    )


def _time_reply(ticket):
    if not ticket:
        return "I can share departure timing as soon as you save your flight details."
    return (
        f"Your flight {ticket.flight_number} leaves {ticket.departure_airport or 'the airport'} "
        f"on {_format_ticket_time(ticket)}. I’d aim to be near gate {ticket.gate} a little early ✨"
    )


def _food_reply(ticket):
    if not ticket:
        return "Save your ticket and I’ll point you toward the best snack stop near your gate."
    return _guide(ticket)["food"]


def _restroom_reply(ticket):
    if not ticket:
        return "I can help with restroom directions once you’ve saved a ticket and gate."
    return _guide(ticket)["restroom"]


def _fun_reply(ticket):
    if not ticket:
        return "Try a quick stretch, a playlist refresh, or a tea break while you wait. Airports count as cardio somehow ✨"
    return _guide(ticket)["fun"]


def _capability_reply(ticket):
    if ticket:
        return (
            f"I can talk about {ticket.flight_number}, including gate {ticket.gate}, departure timing, flight status, "
            "food nearby, restroom tips, WiFi survival, and boredom relief."
        )
    return (
        "I’m your offline airport buddy. Save a ticket and I’ll help with flight timing, gate info, food, bathrooms, "
        "and friendly chat while you wait."
    )


def _guide(ticket):
    return TERMINAL_GUIDE.get(ticket.gate_zone, TERMINAL_GUIDE["MAIN"])


def _format_ticket_time(ticket):
    return timezone.localtime(ticket.departure_time).strftime("%a, %b %d at %I:%M %p").replace(" 0", " ")


def _pick_joke(prompt):
    return JOKES[sum(ord(char) for char in prompt) % len(JOKES)]
