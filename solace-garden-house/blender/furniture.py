"""Procedural furniture placed from the Concept 01 plan."""

from __future__ import annotations

from typing import Any

from meshutil import box, cylinder


def _m(mats: dict[str, Any], key: str):
    return mats[key]


def sofa(name: str, x: float, y: float, z: float, w: float, d: float, rot_z: float, mats: dict) -> None:
    box(f"{name}_base", (x, y, z + 0.18), (w, d, 0.36), _m(mats, "walnut"), col="Furniture", tile=1.0)
    box(f"{name}_seat", (x, y, z + 0.40), (w - 0.10, d - 0.16, 0.12), _m(mats, "linen"), col="Furniture")
    box(f"{name}_back", (x, y + d / 2 - 0.10, z + 0.62), (w - 0.06, 0.14, 0.48), _m(mats, "linen"), col="Furniture")
    arm_y = d / 2 - 0.08
    box(f"{name}_armL", (x - w / 2 + 0.08, y, z + 0.50), (0.12, d - 0.08, 0.32), _m(mats, "linen"), col="Furniture")
    box(f"{name}_armR", (x + w / 2 - 0.08, y, z + 0.50), (0.12, d - 0.08, 0.32), _m(mats, "linen"), col="Furniture")
    del arm_y, rot_z


def lounge_chair(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_seat", (x, y, z + 0.34), (0.72, 0.70, 0.12), _m(mats, "sand"), col="Furniture")
    box(f"{name}_back", (x, y + 0.28, z + 0.58), (0.70, 0.10, 0.42), _m(mats, "sand"), col="Furniture")
    for i, (lx, ly) in enumerate(((-0.28, -0.26), (0.28, -0.26), (-0.28, 0.26), (0.28, 0.26))):
        box(f"{name}_leg{i}", (x + lx, y + ly, z + 0.16), (0.06, 0.06, 0.32), _m(mats, "walnut"), col="Furniture")


def coffee_table(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_top", (x, y, z + 0.36), (1.30, 0.70, 0.04), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_base", (x, y, z + 0.18), (1.10, 0.50, 0.32), _m(mats, "walnut"), col="Furniture")


def dining_table(name: str, x: float, y: float, z: float, mats: dict, seats: int = 8) -> None:
    box(f"{name}_top", (x, y, z + 0.74), (2.40, 1.10, 0.05), _m(mats, "oak"), col="Furniture", tile=0.8)
    box(f"{name}_apron", (x, y, z + 0.64), (2.20, 0.92, 0.08), _m(mats, "walnut"), col="Furniture")
    for i, (lx, ly) in enumerate(((-1.05, -0.42), (1.05, -0.42), (-1.05, 0.42), (1.05, 0.42))):
        box(f"{name}_leg{i}", (x + lx, y + ly, z + 0.36), (0.08, 0.08, 0.72), _m(mats, "walnut"), col="Furniture")
    # Three seats each long side + one each end
    offsets = [
        (-0.70, -0.72),
        (0.00, -0.72),
        (0.70, -0.72),
        (-0.70, 0.72),
        (0.00, 0.72),
        (0.70, 0.72),
        (-1.35, 0.00),
        (1.35, 0.00),
    ]
    for i, (ox, oy) in enumerate(offsets[:seats]):
        dining_chair(f"{name}_c{i}", x + ox, y + oy, z, mats)


def dining_chair(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_seat", (x, y, z + 0.46), (0.42, 0.42, 0.05), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_back", (x, y + 0.18, z + 0.72), (0.40, 0.05, 0.48), _m(mats, "walnut"), col="Furniture")
    for i, (lx, ly) in enumerate(((-0.16, -0.16), (0.16, -0.16), (-0.16, 0.16), (0.16, 0.16))):
        box(f"{name}_leg{i}", (x + lx, y + ly, z + 0.23), (0.04, 0.04, 0.46), _m(mats, "walnut"), col="Furniture")


def bed(name: str, x: float, y: float, z: float, w: float, d: float, mats: dict) -> None:
    box(f"{name}_frame", (x, y, z + 0.16), (w + 0.08, d + 0.08, 0.22), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_matt", (x, y, z + 0.34), (w, d, 0.18), _m(mats, "linen"), col="Furniture")
    box(f"{name}_duvet", (x, y - 0.05, z + 0.46), (w - 0.08, d - 0.22, 0.07), _m(mats, "sand"), col="Furniture")
    box(f"{name}_pL", (x - w * 0.22, y + d / 2 - 0.22, z + 0.50), (0.38, 0.28, 0.12), _m(mats, "linen"), col="Furniture")
    box(f"{name}_pR", (x + w * 0.22, y + d / 2 - 0.22, z + 0.50), (0.38, 0.28, 0.12), _m(mats, "linen"), col="Furniture")
    box(f"{name}_head", (x, y + d / 2 + 0.04, z + 0.62), (w + 0.10, 0.08, 0.70), _m(mats, "walnut"), col="Furniture")
    # nightstands
    ns_y = y + d / 2 - 0.10
    box(f"{name}_nsL", (x - w / 2 - 0.28, ns_y, z + 0.26), (0.44, 0.40, 0.52), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_nsR", (x + w / 2 + 0.28, ns_y, z + 0.26), (0.44, 0.40, 0.52), _m(mats, "walnut"), col="Furniture")


def desk(name: str, x: float, y: float, z: float, w: float, d: float, mats: dict) -> None:
    box(f"{name}_top", (x, y, z + 0.74), (w, d, 0.04), _m(mats, "oak"), col="Furniture")
    box(f"{name}_legL", (x - w / 2 + 0.06, y, z + 0.37), (0.06, d - 0.08, 0.74), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_legR", (x + w / 2 - 0.06, y, z + 0.37), (0.06, d - 0.08, 0.74), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_chair", (x, y - d / 2 - 0.32, z + 0.46), (0.46, 0.46, 0.08), _m(mats, "navy"), col="Furniture")
    box(f"{name}_cback", (x, y - d / 2 - 0.50, z + 0.72), (0.44, 0.08, 0.44), _m(mats, "navy"), col="Furniture")


def shelf(name: str, x: float, y: float, z: float, w: float, h: float, mats: dict) -> None:
    box(f"{name}_carc", (x, y, z + h / 2), (w, 0.32, h), _m(mats, "walnut"), col="Furniture")
    for i, zh in enumerate((0.12, h * 0.35, h * 0.62, h * 0.88)):
        box(f"{name}_s{i}", (x, y, z + zh), (w - 0.04, 0.30, 0.03), _m(mats, "oak"), col="Furniture")


def kitchen_run(name: str, x: float, y: float, z: float, w: float, d: float, mats: dict) -> None:
    box(f"{name}_base", (x, y, z + 0.45), (w, d, 0.90), _m(mats, "white_cab"), col="Furniture")
    box(f"{name}_top", (x, y, z + 0.92), (w + 0.04, d + 0.04, 0.04), _m(mats, "marble"), col="Furniture")
    box(f"{name}_uppers", (x, y - d / 2 + 0.16, z + 2.20), (w, 0.32, 0.70), _m(mats, "white_cab"), col="Furniture")
    # cooktop + sink marks
    box(f"{name}_cook", (x - w * 0.18, y, z + 0.945), (0.70, 0.48, 0.02), _m(mats, "matte_black"), col="Furniture")
    box(f"{name}_sink", (x + w * 0.22, y, z + 0.90), (0.62, 0.40, 0.06), _m(mats, "chrome"), col="Furniture")


def kitchen_island(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_base", (x, y, z + 0.45), (2.60, 1.05, 0.90), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_top", (x, y, z + 0.92), (2.70, 1.15, 0.05), _m(mats, "marble"), col="Furniture")
    for i, ox in enumerate((-0.70, 0.00, 0.70)):
        stool(f"{name}_st{i}", x + ox, y - 0.85, z, mats)


def stool(name: str, x: float, y: float, z: float, mats: dict) -> None:
    cylinder(f"{name}_post", (x, y, z + 0.36), 0.03, 0.70, _m(mats, "chrome"), col="Furniture", segs=10)
    cylinder(f"{name}_seat", (x, y, z + 0.72), 0.18, 0.05, _m(mats, "navy"), col="Furniture", segs=14)


def vanity(name: str, x: float, y: float, z: float, w: float, mats: dict) -> None:
    box(f"{name}_cab", (x, y, z + 0.40), (w, 0.50, 0.80), _m(mats, "white_cab"), col="Furniture")
    box(f"{name}_top", (x, y, z + 0.82), (w + 0.04, 0.54, 0.04), _m(mats, "marble"), col="Furniture")
    box(f"{name}_mirror", (x, y + 0.02, z + 1.70), (w - 0.10, 0.04, 0.90), _m(mats, "chrome"), col="Furniture")
    for i, ox in enumerate((-w * 0.22, w * 0.22) if w > 1.4 else (0.0,)):
        cylinder(f"{name}_basin{i}", (x + ox, y, z + 0.86), 0.18, 0.06, _m(mats, "ceramic"), col="Furniture", segs=14)


def tub(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_outer", (x, y, z + 0.28), (1.70, 0.75, 0.56), _m(mats, "ceramic"), col="Furniture")
    box(f"{name}_water", (x, y, z + 0.40), (1.50, 0.58, 0.08), _m(mats, "water"), col="Furniture")


def shower(name: str, x: float, y: float, z: float, w: float, d: float, mats: dict) -> None:
    box(f"{name}_tray", (x, y, z + 0.04), (w, d, 0.08), _m(mats, "stone"), col="Furniture")
    box(f"{name}_glassA", (x - w / 2, y, z + 1.10), (0.02, d, 2.20), _m(mats, "glass"), col="Furniture")
    box(f"{name}_glassB", (x, y + d / 2, z + 1.10), (w, 0.02, 2.20), _m(mats, "glass"), col="Furniture")
    cylinder(f"{name}_head", (x, y, z + 2.10), 0.08, 0.04, _m(mats, "chrome"), col="Furniture", segs=12)


def toilet(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_bowl", (x, y, z + 0.22), (0.38, 0.52, 0.40), _m(mats, "ceramic"), col="Furniture")
    box(f"{name}_tank", (x, y + 0.28, z + 0.52), (0.36, 0.14, 0.38), _m(mats, "ceramic"), col="Furniture")


def closet_run(name: str, x: float, y: float, z: float, w: float, mats: dict) -> None:
    box(f"{name}_carc", (x, y, z + 1.20), (w, 0.58, 2.40), _m(mats, "white_cab"), col="Furniture")
    box(f"{name}_doors", (x, y - 0.30, z + 1.20), (w - 0.04, 0.03, 2.30), _m(mats, "walnut"), col="Furniture")


def bench(name: str, x: float, y: float, z: float, mats: dict) -> None:
    box(f"{name}_top", (x, y, z + 0.42), (1.60, 0.42, 0.06), _m(mats, "oak"), col="Furniture")
    box(f"{name}_legL", (x - 0.68, y, z + 0.20), (0.08, 0.36, 0.40), _m(mats, "walnut"), col="Furniture")
    box(f"{name}_legR", (x + 0.68, y, z + 0.20), (0.08, 0.36, 0.40), _m(mats, "walnut"), col="Furniture")


def place_all(mats: dict) -> None:
    # Living — L-ish sofa + chairs facing courtyard (south)
    sofa("Furn_LivingSofa", 8.70, 14.55, 0.0, 3.10, 0.95, 0.0, mats)
    lounge_chair("Furn_LivingC1", 10.35, 13.15, 0.0, mats)
    lounge_chair("Furn_LivingC2", 9.40, 12.85, 0.0, mats)
    coffee_table("Furn_LivingCT", 8.85, 13.45, 0.0, mats)

    dining_table("Furn_Dining", 13.20, 13.40, 0.0, mats, seats=8)
    dining_table("Furn_OutDining", 15.00, -1.85, 0.0, mats, seats=8)

    kitchen_run("Furn_KitchenRun", 16.85, 15.55, 0.0, 3.20, 0.62, mats)
    kitchen_island("Furn_Island", 16.85, 13.15, 0.0, mats)

    # pantry shelves
    shelf("Furn_Pantry1", 15.55, 16.55, 0.0, 0.80, 2.20, mats)
    shelf("Furn_Pantry2", 16.55, 16.55, 0.0, 0.80, 2.20, mats)

    # office
    desk("Furn_OfficeA", 1.40, 15.70, 0.0, 1.60, 0.70, mats)
    desk("Furn_OfficeB", 3.20, 15.70, 0.0, 1.60, 0.70, mats)
    shelf("Furn_OfficeSh", 2.30, 16.55, 0.0, 2.20, 2.20, mats)

    # bedrooms
    bed("Furn_Bed3", 2.30, 2.10, 0.0, 1.70, 2.10, mats)
    desk("Furn_Bed3Desk", 3.70, 1.00, 0.0, 1.10, 0.55, mats)
    closet_run("Furn_Bed3Cl", 0.55, 3.90, 0.0, 1.40, mats)

    bed("Furn_Bed2", 2.30, 6.45, 0.0, 1.70, 2.10, mats)
    desk("Furn_Bed2Desk", 3.70, 5.20, 0.0, 1.10, 0.55, mats)
    closet_run("Furn_Bed2Cl", 0.55, 8.20, 0.0, 1.40, mats)

    bed("Furn_Primary", 22.05, 2.15, 0.0, 2.00, 2.20, mats)
    lounge_chair("Furn_PrimaryChair", 20.20, 1.10, 0.0, mats)

    closet_run("Furn_Dress1", 21.60, 6.65, 0.0, 1.50, mats)
    closet_run("Furn_Dress2", 23.40, 6.65, 0.0, 1.50, mats)

    # baths
    vanity("Furn_FamVanity", 1.40, 11.90, 0.0, 1.80, mats)
    tub("Furn_FamTub", 3.20, 10.20, 0.0, mats)
    toilet("Furn_FamWC", 0.70, 9.40, 0.0, mats)
    shower("Furn_FamShower", 3.50, 11.55, 0.0, 1.10, 1.20, mats)

    vanity("Furn_PriVanity", 23.00, 11.50, 0.0, 2.20, mats)
    shower("Furn_PriShower", 21.70, 8.10, 0.0, 1.50, 1.50, mats)
    toilet("Furn_PriWC", 24.40, 8.00, 0.0, mats)
    tub("Furn_PriTub", 23.20, 9.40, 0.0, mats)

    vanity("Furn_GuestVan", 21.55, 16.30, 0.0, 1.10, mats)
    toilet("Furn_GuestWC", 21.20, 15.20, 0.0, mats)

    # laundry
    box("Furn_LaundryM", (21.50, 13.20, 0.50), (0.70, 0.70, 1.00), _m(mats, "white_cab"), col="Furniture")
    box("Furn_LaundryD", (22.30, 13.20, 0.50), (0.70, 0.70, 1.00), _m(mats, "white_cab"), col="Furniture")
    box("Furn_LaundryC", (23.60, 13.35, 0.90), (1.80, 0.55, 0.90), _m(mats, "white_cab"), col="Furniture")

    # entry bench + hooks
    bench("Furn_EntryBench", 12.80, 17.55, 0.0, mats)
    box("Furn_CoatRail", (14.90, 18.20, 1.60), (1.20, 0.06, 0.06), _m(mats, "frame"), col="Furniture")

    # courtyard bench
    bench("Furn_CourtBench", 12.70, 5.60, 0.0, mats)
