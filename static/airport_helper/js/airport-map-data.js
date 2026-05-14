window.AIRPORT_MAP_DATA = {
    version: "1.0.0",
    airports: {
        JFK: {
            name: "JFK International Airport",
            terminal: "Terminal 4",
            width: 1100,
            height: 620,
            feetPerUnit: 2.6,
            defaultLocationId: "security",
            bounds: {
                north: 40.6486,
                south: 40.6408,
                west: -73.7866,
                east: -73.7722,
            },
            zones: [
                { label: "Check-In Hall", x: 110, y: 430, width: 190, height: 110 },
                { label: "Security", x: 290, y: 360, width: 150, height: 92 },
                { label: "Central Concourse", x: 450, y: 270, width: 210, height: 120 },
                { label: "B Gates", x: 720, y: 220, width: 260, height: 140 }
            ],
            points: [
                { id: "entrance", label: "Terminal Entrance", shortLabel: "Entrance", type: "hub", icon: "🛂", x: 92, y: 515, keywords: ["Entrance", "Terminal Entrance"] },
                { id: "baggage", label: "Baggage Claim", shortLabel: "Baggage", type: "baggage", icon: "🛄", x: 170, y: 560, keywords: ["Baggage", "Baggage Claim"] },
                { id: "checkin", label: "Check-In Hall", shortLabel: "Check-In", type: "hub", icon: "🎫", x: 210, y: 480, keywords: ["Check-In", "Ticketing"] },
                { id: "security", label: "Security Checkpoint", shortLabel: "Security", type: "hub", icon: "🛂", x: 340, y: 405, keywords: ["Security", "Checkpoint"] },
                { id: "coffee", label: "Starbucks", shortLabel: "Starbucks", type: "coffee", icon: "☕", x: 420, y: 430, keywords: ["Coffee", "Starbucks"] },
                { id: "concourse", label: "Central Concourse", shortLabel: "Concourse", type: "hub", icon: "📍", x: 530, y: 325, keywords: ["Concourse", "Center"] },
                { id: "bathroom_s", label: "Bathroom South", shortLabel: "Bathroom", type: "bathroom", icon: "🚽", x: 548, y: 428, keywords: ["Bathroom", "Restroom"] },
                { id: "pizza", label: "Sky Pizza", shortLabel: "Pizza", type: "food", icon: "🍕", x: 645, y: 365, keywords: ["Food", "Pizza", "Restaurant"] },
                { id: "bathroom_n", label: "Bathroom North", shortLabel: "Bathroom", type: "bathroom", icon: "🚽", x: 622, y: 285, keywords: ["Bathroom", "Restroom"] },
                { id: "gate_a12", label: "Gate A12", shortLabel: "A12", type: "gate", icon: "✈️", x: 690, y: 248, keywords: ["A12", "Gate A12"] },
                { id: "lounge", label: "Gold Lounge", shortLabel: "Lounge", type: "hub", icon: "☕", x: 796, y: 228, keywords: ["Lounge", "Club"] },
                { id: "gate_b14", label: "Gate B14", shortLabel: "B14", type: "gate", icon: "✈️", x: 786, y: 352, keywords: ["B14", "Gate B14"] },
                { id: "gate_b23", label: "Gate B23", shortLabel: "B23", type: "gate", icon: "✈️", x: 946, y: 242, keywords: ["B23", "Gate B23"] }
            ],
            edges: [
                { from: "entrance", to: "checkin" },
                { from: "checkin", to: "baggage" },
                { from: "checkin", to: "security" },
                { from: "security", to: "coffee" },
                { from: "security", to: "concourse" },
                { from: "coffee", to: "bathroom_s" },
                { from: "coffee", to: "concourse" },
                { from: "concourse", to: "bathroom_n" },
                { from: "concourse", to: "pizza" },
                { from: "concourse", to: "gate_a12" },
                { from: "gate_a12", to: "lounge" },
                { from: "lounge", to: "gate_b23" },
                { from: "pizza", to: "gate_b14" },
                { from: "gate_b14", to: "gate_b23" }
            ]
        },
        LAX: {
            name: "Los Angeles International Airport",
            terminal: "Terminal B",
            width: 1100,
            height: 620,
            feetPerUnit: 2.7,
            defaultLocationId: "security",
            bounds: {
                north: 33.9467,
                south: 33.9376,
                west: -118.4164,
                east: -118.3982,
            },
            zones: [
                { label: "Arrival Hall", x: 92, y: 438, width: 200, height: 110 },
                { label: "Security", x: 250, y: 350, width: 150, height: 94 },
                { label: "Concourse Hub", x: 415, y: 276, width: 210, height: 120 },
                { label: "West Gates", x: 700, y: 210, width: 270, height: 158 }
            ],
            points: [
                { id: "entrance", label: "Terminal Entrance", shortLabel: "Entrance", type: "hub", icon: "🛂", x: 98, y: 518, keywords: ["Entrance"] },
                { id: "baggage", label: "Baggage Claim", shortLabel: "Baggage", type: "baggage", icon: "🛄", x: 168, y: 560, keywords: ["Baggage", "Baggage Claim"] },
                { id: "checkin", label: "Check-In Hall", shortLabel: "Check-In", type: "hub", icon: "🎫", x: 204, y: 478, keywords: ["Check-In", "Ticketing"] },
                { id: "security", label: "Security Checkpoint", shortLabel: "Security", type: "hub", icon: "🛂", x: 306, y: 398, keywords: ["Security"] },
                { id: "coffee", label: "Blue Cup Coffee", shortLabel: "Coffee", type: "coffee", icon: "☕", x: 378, y: 430, keywords: ["Coffee", "Cafe"] },
                { id: "hub", label: "Concourse Hub", shortLabel: "Hub", type: "hub", icon: "📍", x: 500, y: 334, keywords: ["Concourse Hub"] },
                { id: "bathroom", label: "Bathroom West", shortLabel: "Bathroom", type: "bathroom", icon: "🚽", x: 575, y: 302, keywords: ["Bathroom", "Restroom"] },
                { id: "tacos", label: "Sunset Tacos", shortLabel: "Tacos", type: "food", icon: "🍕", x: 650, y: 398, keywords: ["Food", "Tacos", "Restaurant"] },
                { id: "gate_52b", label: "Gate 52B", shortLabel: "52B", type: "gate", icon: "✈️", x: 670, y: 286, keywords: ["52B", "Gate 52B"] },
                { id: "gate_54a", label: "Gate 54A", shortLabel: "54A", type: "gate", icon: "✈️", x: 810, y: 232, keywords: ["54A", "Gate 54A"] },
                { id: "lounge", label: "Pacific Lounge", shortLabel: "Lounge", type: "hub", icon: "☕", x: 798, y: 312, keywords: ["Lounge", "Club"] },
                { id: "gate_60", label: "Gate 60", shortLabel: "60", type: "gate", icon: "✈️", x: 946, y: 318, keywords: ["60", "Gate 60"] }
            ],
            edges: [
                { from: "entrance", to: "checkin" },
                { from: "checkin", to: "baggage" },
                { from: "checkin", to: "security" },
                { from: "security", to: "coffee" },
                { from: "security", to: "hub" },
                { from: "coffee", to: "hub" },
                { from: "hub", to: "bathroom" },
                { from: "hub", to: "tacos" },
                { from: "hub", to: "gate_52b" },
                { from: "gate_52b", to: "gate_54a" },
                { from: "gate_52b", to: "lounge" },
                { from: "lounge", to: "gate_60" },
                { from: "gate_54a", to: "gate_60" }
            ]
        },
        ORD: {
            name: "Chicago O'Hare International Airport",
            terminal: "Terminal 1",
            width: 1100,
            height: 620,
            feetPerUnit: 2.65,
            defaultLocationId: "security",
            bounds: {
                north: 41.9844,
                south: 41.9723,
                west: -87.9153,
                east: -87.8931,
            },
            zones: [
                { label: "Check-In Hall", x: 94, y: 442, width: 205, height: 106 },
                { label: "Security", x: 252, y: 364, width: 156, height: 96 },
                { label: "Rotunda", x: 432, y: 292, width: 214, height: 128 },
                { label: "C Concourse", x: 702, y: 218, width: 282, height: 150 }
            ],
            points: [
                { id: "entrance", label: "Terminal Entrance", shortLabel: "Entrance", type: "hub", icon: "🛂", x: 92, y: 520, keywords: ["Entrance"] },
                { id: "baggage", label: "Baggage Claim", shortLabel: "Baggage", type: "baggage", icon: "🛄", x: 162, y: 565, keywords: ["Baggage", "Baggage Claim"] },
                { id: "checkin", label: "Check-In Hall", shortLabel: "Check-In", type: "hub", icon: "🎫", x: 210, y: 485, keywords: ["Check-In", "Ticketing"] },
                { id: "security", label: "Security Checkpoint", shortLabel: "Security", type: "hub", icon: "🛂", x: 305, y: 408, keywords: ["Security"] },
                { id: "coffee", label: "Cloud Cup", shortLabel: "Coffee", type: "coffee", icon: "☕", x: 358, y: 446, keywords: ["Coffee", "Cafe"] },
                { id: "rotunda", label: "Rotunda Hub", shortLabel: "Rotunda", type: "hub", icon: "📍", x: 520, y: 352, keywords: ["Rotunda", "Hub"] },
                { id: "bathroom", label: "Bathroom East", shortLabel: "Bathroom", type: "bathroom", icon: "🚽", x: 600, y: 320, keywords: ["Bathroom", "Restroom"] },
                { id: "gate_b9", label: "Gate B9", shortLabel: "B9", type: "gate", icon: "✈️", x: 618, y: 402, keywords: ["B9", "Gate B9"] },
                { id: "pizza", label: "Windy City Pizza", shortLabel: "Pizza", type: "food", icon: "🍕", x: 695, y: 430, keywords: ["Food", "Pizza", "Restaurant"] },
                { id: "gate_c18", label: "Gate C18", shortLabel: "C18", type: "gate", icon: "✈️", x: 792, y: 270, keywords: ["C18", "Gate C18"] },
                { id: "lounge", label: "Sky Club", shortLabel: "Lounge", type: "hub", icon: "☕", x: 840, y: 340, keywords: ["Lounge", "Club"] },
                { id: "gate_h12", label: "Gate H12", shortLabel: "H12", type: "gate", icon: "✈️", x: 952, y: 246, keywords: ["H12", "Gate H12"] }
            ],
            edges: [
                { from: "entrance", to: "checkin" },
                { from: "checkin", to: "baggage" },
                { from: "checkin", to: "security" },
                { from: "security", to: "coffee" },
                { from: "security", to: "rotunda" },
                { from: "coffee", to: "rotunda" },
                { from: "rotunda", to: "bathroom" },
                { from: "rotunda", to: "gate_b9" },
                { from: "rotunda", to: "gate_c18" },
                { from: "gate_b9", to: "pizza" },
                { from: "pizza", to: "lounge" },
                { from: "gate_c18", to: "lounge" },
                { from: "lounge", to: "gate_h12" }
            ]
        }
    }
};
