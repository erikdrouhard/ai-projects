"""Site, courtyard, pool, and woodland around the U-shaped house."""

from __future__ import annotations

import math
from typing import Any

from meshutil import box, cylinder, ico, add_collider
import config as C


def _tree(name: str, x: float, y: float, scale: float, mats: dict, dark: bool = False) -> None:
    h = 3.4 * scale
    r = 0.16 * scale
    cylinder(f"{name}_trunk", (x, y, h * 0.28), r, h * 0.55, mats["bark"], col="Landscape", segs=10)
    leaf = mats["leaf_dark"] if dark else mats["leaf"]
    ico(f"{name}_c1", (x, y, h * 0.72), 1.15 * scale, leaf, col="Landscape", subdivisions=1)
    ico(f"{name}_c2", (x + 0.45 * scale, y - 0.2 * scale, h * 0.86), 0.85 * scale, leaf, col="Landscape", subdivisions=1)
    ico(f"{name}_c3", (x - 0.35 * scale, y + 0.3 * scale, h * 0.90), 0.75 * scale, leaf, col="Landscape", subdivisions=1)


def _hedge(name: str, x: float, y: float, w: float, d: float, h: float, mats: dict) -> None:
    box(name, (x, y, h / 2), (w, d, h), mats["leaf"], col="Landscape", collide=True, tile=2.0)


def build(mats: dict[str, Any]) -> None:
    # Broad meadow / woodland floor
    box("Land_Ground", (12.7, 2.0, -0.06), (80.0, 80.0, 0.10), mats["grass"], col="Landscape", tile=8.0)

    # Arrival path + driveway
    box("Land_Arrival", (12.70, 21.20, 0.01), (3.20, 6.40, 0.04), mats["stone"], col="Landscape", tile=1.4)
    box("Land_EntryPad", (13.20, 18.40, 0.015), (5.20, 1.70, 0.03), mats["stone"], col="Landscape", tile=1.2)

    # Courtyard lawn + gravel edge
    cy = C.OUTDOOR["courtyard"]
    box(
        "Land_Courtyard",
        (cy["x"] + cy["w"] / 2, cy["y"] + cy["d"] / 2, -0.01),
        (cy["w"] - 0.08, cy["d"] - 0.08, 0.04),
        mats["grass"],
        col="Landscape",
        tile=3.0,
    )
    box("Land_CourtPath", (12.70, 5.40, 0.015), (2.20, 8.80, 0.03), mats["stone"], col="Landscape", tile=1.3)
    _tree("Land_CourtTree", 12.70, 7.40, 1.35, mats)
    # smaller courtyard planting
    for i, (px, py, s) in enumerate(((8.20, 3.20, 0.55), (17.20, 3.40, 0.60), (8.40, 8.80, 0.45), (17.10, 8.60, 0.50))):
        _tree(f"Land_CourtShrub{i}", px, py, s, mats)

    # Covered dining terrace
    od = C.OUTDOOR["covered_dining"]
    box(
        "Land_CoveredDeck",
        (od["x"] + od["w"] / 2, od["y"] + od["d"] / 2, -0.01),
        (od["w"], od["d"], 0.06),
        mats["stone"],
        col="Landscape",
        tile=1.1,
    )
    # canopy posts + roof
    for i, (px, py) in enumerate(((11.45, -3.55), (18.65, -3.55), (11.45, -0.30), (18.65, -0.30))):
        cylinder(f"Land_Col{i}", (px, py, 1.55), 0.08, 3.10, mats["frame"], col="Architecture", segs=10)
    box(
        "Roof_CoveredDining",
        (od["x"] + od["w"] / 2, od["y"] + od["d"] / 2, C.CEILING + 0.18),
        (od["w"] + 0.40, od["d"] + 0.30, 0.12),
        mats["roof"],
        col="Architecture",
        tile=2.0,
    )

    # Sun terrace + lap pool
    st = C.OUTDOOR["sun_terrace"]
    box(
        "Land_Terrace",
        (st["x"] + st["w"] / 2, st["y"] + st["d"] / 2, -0.02),
        (st["w"], st["d"], 0.08),
        mats["stone"],
        col="Landscape",
        tile=1.5,
    )
    pool = C.OUTDOOR["pool"]
    px = pool["x"] + pool["w"] / 2
    py = pool["y"] + pool["d"] / 2
    box("Land_PoolBasin", (px, py, -0.55), (pool["w"] + 0.24, pool["d"] + 0.24, 1.10), mats["pool_tile"], col="Landscape")
    box("Land_PoolWater", (px, py, -0.08), (pool["w"], pool["d"], 0.16), mats["water"], col="Landscape")
    add_collider(px, py, 0.4, pool["w"], pool["d"], 1.2)

    # Private garden + privacy hedge
    pg = C.OUTDOOR["private_garden"]
    box(
        "Land_PrivGarden",
        (pg["x"] + pg["w"] / 2, pg["y"] + pg["d"] / 2, -0.01),
        (pg["w"], pg["d"], 0.04),
        mats["grass"],
        col="Landscape",
        tile=2.2,
    )
    _hedge("Land_PrivacyHedge", 22.15, -5.05, 6.2, 0.45, 1.80, mats)
    _tree("Land_PrivTree", 22.40, -2.40, 0.85, mats)

    # Herb beds north of laundry
    hb = C.OUTDOOR["herb"]
    box(
        "Land_HerbPad",
        (hb["x"] + hb["w"] / 2, hb["y"] + hb["d"] / 2, 0.00),
        (hb["w"], hb["d"], 0.04),
        mats["stone"],
        col="Landscape",
    )
    for i, ox in enumerate((-1.50, -0.50, 0.50, 1.50)):
        cx = hb["x"] + hb["w"] / 2 + ox
        cy = hb["y"] + hb["d"] / 2
        box(f"Land_HerbBox{i}", (cx, cy, 0.22), (0.85, 1.40, 0.40), mats["walnut"], col="Landscape")
        box(f"Land_HerbSoil{i}", (cx, cy, 0.40), (0.75, 1.28, 0.08), mats["soil"], col="Landscape")
        box(f"Land_HerbPlant{i}", (cx, cy, 0.52), (0.70, 1.20, 0.16), mats["leaf"], col="Landscape")

    # Open lawn west / south
    box("Land_WestLawn", (-4.0, 6.0, -0.02), (8.0, 22.0, 0.04), mats["grass"], col="Landscape", tile=5.0)

    # Woodland ring — keep trees off the building and terrace
    ring = []
    for i in range(22):
        ang = (i / 22.0) * math.tau
        rx = 12.7 + math.cos(ang) * 22.0
        ry = 4.0 + math.sin(ang) * 20.0
        # skip the arrival notch (north-center)
        if 9.5 < rx < 16.5 and ry > 17.5:
            continue
        ring.append((rx, ry, 1.1 + (i % 5) * 0.18, i % 2 == 0))
    # extra west/south forest edge
    for i, (tx, ty, sc) in enumerate(
        (
            (-6.5, 2.0, 1.4),
            (-7.2, 8.0, 1.6),
            (-5.8, 14.0, 1.3),
            (-6.8, -4.0, 1.5),
            (2.0, -16.0, 1.4),
            (10.0, -18.0, 1.7),
            (18.0, -17.5, 1.5),
            (28.0, -8.0, 1.6),
            (30.0, 4.0, 1.4),
            (29.5, 14.0, 1.5),
            (27.0, 22.0, 1.3),
            (4.0, 24.0, 1.4),
            (20.0, 24.5, 1.5),
        )
    ):
        ring.append((tx, ty, sc, False))

    for i, (tx, ty, sc, dark) in enumerate(ring):
        _tree(f"Land_Wood{i}", tx, ty, sc, mats, dark=dark)
        add_collider(tx, ty, 1.0, 0.7, 0.7, 2.0)
