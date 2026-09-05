"""Solace Garden House — dimensions taken from Concept 01.

Coordinate system (Blender): X east, Y north, Z up, metres.
Origin is the southwest exterior corner of the 25.40 x 17.00 m footprint.
"""

from __future__ import annotations

BUILDING_W = 25.40
BUILDING_D = 17.00
COURTYARD_W = 12.40
COURTYARD_D = 10.80

WEST_W = (BUILDING_W - COURTYARD_W) / 2  # 6.50
EAST_W = WEST_W
NORTH_D = BUILDING_D - COURTYARD_D  # 6.20

COURTYARD_X = WEST_W  # 6.50
COURTYARD_Y = 0.0

WALL = 0.20
GLASS_T = 0.028
FRAME = 0.07
GALLERY_W = 1.50
CEILING = 3.20
SLAB = 0.12
ROOF_T = 0.22
OVERHANG = 0.70
DOOR_H = 2.18
DOOR_W = 0.90
SLIDE_W = 2.60
DOOR_THICK = 0.04

# Rooms: interior clear rectangles (x, y, w, d)
ROOMS = {
    "bed3": {
        "label": "Bedroom 03",
        "x": 0.20,
        "y": 0.20,
        "w": 4.25,
        "d": 4.15,
        "area": 17.6,
    },
    "bed2": {
        "label": "Bedroom 02",
        "x": 0.20,
        "y": 4.55,
        "w": 4.25,
        "d": 4.10,
        "area": 17.4,
    },
    "family_bath": {
        "label": "Family Bath",
        "x": 0.20,
        "y": 8.85,
        "w": 4.25,
        "d": 3.50,
        "area": 14.9,
    },
    "office": {
        "label": "Office",
        "x": 0.20,
        "y": 12.55,
        "w": 4.25,
        "d": 4.20,
        "area": 17.9,
    },
    "west_gallery": {
        "label": "Daylight Gallery",
        "x": 4.65,
        "y": 0.20,
        "w": 1.50,
        "d": 16.55,
        "area": 24.8,
    },
    "living": {
        "label": "Living",
        "x": 6.70,
        "y": 11.00,
        "w": 4.70,
        "d": 5.75,
        "area": 26.9,
    },
    "dining": {
        "label": "Dining",
        "x": 11.40,
        "y": 11.00,
        "w": 3.70,
        "d": 5.75,
        "area": 19.0,
    },
    "kitchen": {
        "label": "Kitchen",
        "x": 15.10,
        "y": 11.00,
        "w": 3.60,
        "d": 4.00,
        "area": 23.5,
    },
    "pantry": {
        "label": "Pantry",
        "x": 15.10,
        "y": 15.15,
        "w": 2.20,
        "d": 1.60,
        "area": 5.2,
    },
    "entry": {
        "label": "Entry",
        "x": 11.40,
        "y": 17.00,
        "w": 2.80,
        "d": 1.55,
        "area": 4.3,
    },
    "coats": {
        "label": "Coats + Shoes",
        "x": 14.20,
        "y": 17.00,
        "w": 1.50,
        "d": 1.55,
        "area": 2.3,
    },
    "guest_wc": {
        "label": "Guest WC",
        "x": 20.80,
        "y": 14.70,
        "w": 1.70,
        "d": 2.05,
        "area": 3.5,
    },
    "plant_store": {
        "label": "Plant / Store",
        "x": 22.70,
        "y": 14.70,
        "w": 2.50,
        "d": 2.05,
        "area": 5.2,
    },
    "laundry": {
        "label": "Laundry",
        "x": 20.80,
        "y": 12.20,
        "w": 4.40,
        "d": 2.30,
        "area": 7.2,
    },
    "primary_bath": {
        "label": "Primary Bath",
        "x": 20.80,
        "y": 7.20,
        "w": 4.40,
        "d": 4.80,
        "area": 18.2,
    },
    "dressing": {
        "label": "Dressing",
        "x": 20.80,
        "y": 4.55,
        "w": 4.40,
        "d": 2.45,
        "area": 10.0,
    },
    "primary": {
        "label": "Primary Bedroom",
        "x": 19.10,
        "y": 0.20,
        "w": 5.90,
        "d": 4.15,
        "area": 23.9,
    },
    "east_gallery": {
        "label": "Private Suite Gallery",
        "x": 19.10,
        "y": 4.55,
        "w": 1.50,
        "d": 12.20,
        "area": 18.3,
    },
}

# Outdoor pieces (not enclosed)
OUTDOOR = {
    "courtyard": {"x": 6.50, "y": 0.00, "w": 12.40, "d": 10.80},
    "covered_dining": {"x": 11.20, "y": -3.80, "w": 7.70, "d": 3.80},
    "sun_terrace": {"x": 6.20, "y": -12.40, "w": 13.00, "d": 8.20},
    "pool": {"x": 8.70, "y": -10.60, "w": 10.00, "d": 3.50},
    "private_garden": {"x": 18.90, "y": -5.20, "w": 6.50, "d": 5.20},
    "herb": {"x": 20.40, "y": 17.20, "w": 4.60, "d": 3.20},
    "arrival": {"x": 10.20, "y": 18.55, "w": 5.80, "d": 6.00},
}

SPAWN = {
    "x": 12.80,
    "y": 17.70,
    "z": 1.62,
    "look_x": 12.80,
    "look_y": 12.40,
    "look_z": 1.45,
}

# Afternoon sun from the southwest, typical for a south-open courtyard.
SUN = {
    "elevation_deg": 38.0,
    "azimuth_deg": 215.0,  # 0 = north, clockwise... we use math: 0=+X (east)
    "azimuth_from_east_ccw_deg": 215.0,  # documented; lighting.py converts
    "energy": 6.5,
    "angle_deg": 0.53,
}

CAMERAS = {
    "aerial_south": {
        "loc": (12.7, -22.0, 14.5),
        "look": (12.7, 6.0, 1.2),
        "focal": 35,
    },
    "courtyard": {
        "loc": (12.7, -1.6, 1.55),
        "look": (12.7, 8.5, 1.4),
        "focal": 32,
    },
    "living": {
        "loc": (8.4, 15.6, 1.55),
        "look": (13.5, 11.6, 1.2),
        "focal": 28,
    },
}
