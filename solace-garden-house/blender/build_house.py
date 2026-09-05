#!/usr/bin/env python3
"""Headless Solace Garden House builder. Run via Blender --background --python."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import bpy

import config as C
import furniture
import landscape
import lighting
import materials
import meshutil as mu


def _parse_args() -> dict:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    out = {
        "output": ROOT.parent / "output",
        "textures": ROOT.parent / "textures",
        "viewer": ROOT.parent / "viewer" / "assets",
        "skip_render": False,
    }
    i = 0
    while i < len(argv):
        if argv[i] == "--output":
            out["output"] = Path(argv[i + 1])
            i += 2
        elif argv[i] == "--textures":
            out["textures"] = Path(argv[i + 1])
            i += 2
        elif argv[i] == "--viewer":
            out["viewer"] = Path(argv[i + 1])
            i += 2
        elif argv[i] == "--skip-render":
            out["skip_render"] = True
            i += 1
        else:
            i += 1
    return out


def _door(along: float, width: float = C.DOOR_W, z1: float = C.DOOR_H) -> dict:
    return {"along": along, "width": width, "z0": 0.0, "z1": z1}


def _slider(along: float, width: float = C.SLIDE_W) -> dict:
    return {"along": along, "width": width, "z0": 0.0, "z1": C.CEILING}


def glass_facade(
    name: str,
    axis: str,
    a0: float,
    a1: float,
    fixed: float,
    mats: dict,
    openings: list[dict] | None = None,
) -> None:
    """Full-height glass with bronze frames. openings are gaps (sliders)."""
    openings = list(openings or [])
    openings.sort(key=lambda o: o["along"])
    length = a1 - a0
    spans: list[tuple[float, float]] = []
    cursor = 0.0
    for op in openings:
        s0 = max(0.0, op["along"])
        s1 = min(length, op["along"] + op["width"])
        if s0 > cursor + 0.03:
            spans.append((cursor, s0))
        cursor = max(cursor, s1)
    if cursor < length - 0.03:
        spans.append((cursor, length))

    for i, (s0, s1) in enumerate(spans):
        mid = a0 + (s0 + s1) / 2
        span = s1 - s0
        if axis == "x":
            loc = (mid, fixed, C.CEILING / 2)
            size = (span - 0.02, C.GLASS_T, C.CEILING - 0.04)
            # head / sill / jambs
            mu.box(f"{name}_{i}_head", (mid, fixed, C.CEILING - 0.04), (span, C.FRAME, 0.08), mats["frame"], tile=0.5)
            mu.box(f"{name}_{i}_sill", (mid, fixed, 0.04), (span, C.FRAME, 0.08), mats["frame"], tile=0.5)
        else:
            loc = (fixed, mid, C.CEILING / 2)
            size = (C.GLASS_T, span - 0.02, C.CEILING - 0.04)
            mu.box(f"{name}_{i}_head", (fixed, mid, C.CEILING - 0.04), (C.FRAME, span, 0.08), mats["frame"], tile=0.5)
            mu.box(f"{name}_{i}_sill", (fixed, mid, 0.04), (C.FRAME, span, 0.08), mats["frame"], tile=0.5)
        mu.box(f"{name}_{i}_glass", loc, size, mats["glass"], collide=True, tile=2.0)
        # mullions every ~1.7 m
        n = max(1, int(span / 1.7))
        for k in range(n + 1):
            t = s0 + (k / n) * span if n else s0
            p = a0 + t
            if axis == "x":
                mu.box(f"{name}_{i}_mul{k}", (p, fixed, C.CEILING / 2), (C.FRAME, C.FRAME + 0.01, C.CEILING), mats["frame"], tile=0.4)
            else:
                mu.box(f"{name}_{i}_mul{k}", (fixed, p, C.CEILING / 2), (C.FRAME + 0.01, C.FRAME, C.CEILING), mats["frame"], tile=0.4)


def door_leaf(name: str, cx: float, cy: float, axis: str, mats: dict, swing: float = 0.55) -> None:
    """A slightly-open door so the walkthrough can pass the opening."""
    import math

    w, t, h = C.DOOR_W, C.DOOR_THICK, C.DOOR_H
    if axis == "x":
        # hinge at left of opening, swing around Z
        hx = cx - w / 2
        obj = mu.box(name, (hx + w / 2 * math.cos(swing), cy + w / 2 * math.sin(swing) * 0.15, h / 2), (w, t, h), mats["walnut"], col="Furniture", tile=0.6)
        obj.rotation_euler[2] = swing
    else:
        hy = cy - w / 2
        obj = mu.box(name, (cx + w / 2 * math.sin(swing) * 0.15, hy + w / 2 * math.cos(swing), h / 2), (t, w, h), mats["walnut"], col="Furniture", tile=0.6)
        obj.rotation_euler[2] = swing


def build_floors_roofs(mats: dict) -> None:
    zf = -C.SLAB / 2
    zc = C.CEILING + 0.05
    zr = C.CEILING + 0.18
    slabs = [
        ("West", (C.WEST_W / 2, C.BUILDING_D / 2), (C.WEST_W, C.BUILDING_D)),
        ("East", (C.COURTYARD_X + C.COURTYARD_W + C.EAST_W / 2, C.BUILDING_D / 2), (C.EAST_W, C.BUILDING_D)),
        ("North", (C.COURTYARD_X + C.COURTYARD_W / 2, C.COURTYARD_D + C.NORTH_D / 2), (C.COURTYARD_W, C.NORTH_D)),
        ("Entry", (13.55, 17.775), (4.30, 1.55)),
    ]
    for name, (x, y), (w, d) in slabs:
        mu.box(f"Floor_{name}", (x, y, 0.02), (w - 0.04, d - 0.04, 0.04), mats["oak"], tile=1.0)
        mu.box(f"Slab_{name}", (x, y, zf), (w, d, C.SLAB), mats["concrete"], tile=2.0)
        mu.box(f"Ceil_{name}", (x, y, zc), (w - 0.04, d - 0.04, 0.08), mats["plaster"], tile=2.5)
        mu.box(
            f"Roof_{name}",
            (x, y, zr),
            (w + C.OVERHANG * (0 if name == "Entry" else 1), d + C.OVERHANG * (0 if name == "Entry" else 1), C.ROOF_T),
            mats["roof"],
            tile=3.0,
        )
    # ceiling lights as emissive discs (visual only)
    for i, (x, y) in enumerate(
        (
            (8.9, 13.8),
            (13.2, 13.8),
            (16.9, 13.4),
            (2.3, 14.65),
            (2.3, 6.6),
            (2.3, 2.25),
            (22.05, 2.25),
            (5.4, 8.5),
            (19.85, 10.6),
        )
    ):
        mu.cylinder(f"LiteVis_{i}", (x, y, C.CEILING - 0.02), 0.16, 0.03, mats["warm_emit"], col="Architecture", segs=12)


def build_architecture(mats: dict) -> None:
    W = C.WALL
    H = C.CEILING
    plaster = mats["plaster"]

    # --- Exterior solid ---
    mu.axis_wall("Wall_ExtWest", "y", 0.0, C.BUILDING_D, 0.0, 0.0, H, W, plaster)
    mu.axis_wall("Wall_ExtEast", "y", 0.0, C.BUILDING_D, C.BUILDING_W, 0.0, H, W, plaster)
    # North facade with entry opening (house → vestibule)
    mu.axis_wall("Wall_ExtNorthW", "x", 0.0, 11.40, C.BUILDING_D, 0.0, H, W, plaster)
    mu.axis_wall(
        "Wall_ExtNorthC",
        "x",
        11.40,
        15.70,
        C.BUILDING_D,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(1.00, width=1.40)],
    )
    mu.axis_wall("Wall_ExtNorthE", "x", 15.70, C.BUILDING_W, C.BUILDING_D, 0.0, H, W, plaster)
    # South solid returns (only the short masonry jambs; glass fills the rest)
    mu.axis_wall("Wall_SWJambW", "x", 0.0, 0.35, 0.0, 0.0, H, W, plaster)
    mu.axis_wall("Wall_SEJambE", "x", C.BUILDING_W - 0.35, C.BUILDING_W, 0.0, 0.0, H, W, plaster)

    # Entry vestibule
    mu.axis_wall("Wall_EntryW", "y", 17.00, 18.55, 11.40, 0.0, H, W, plaster)
    mu.axis_wall("Wall_EntryE", "y", 17.00, 18.55, 15.70, 0.0, H, W, plaster)
    mu.axis_wall(
        "Wall_EntryN",
        "x",
        11.40,
        15.70,
        18.55,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(1.35, width=1.10)],
    )
    mu.axis_wall(
        "Wall_Coats",
        "y",
        17.00,
        18.55,
        14.20,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(0.25, width=0.75)],
    )
    door_leaf("Furn_FrontDoor", 12.90, 18.55, "x", mats, swing=0.7)

    # --- West wing interiors ---
    mu.axis_wall("Wall_W_Bed3Bed2", "x", 0.0, 4.65, 4.45, 0.0, H, W, plaster)
    mu.axis_wall("Wall_W_Bed2Bath", "x", 0.0, 4.65, 8.75, 0.0, H, W, plaster)
    mu.axis_wall("Wall_W_BathOff", "x", 0.0, 4.65, 12.45, 0.0, H, W, plaster)
    mu.axis_wall(
        "Wall_W_Gallery",
        "y",
        0.20,
        16.80,
        4.55,
        0.0,
        H,
        W,
        plaster,
        openings=[
            _door(2.00),  # bed3
            _door(6.30),  # bed2
            _door(10.20),  # bath
            _door(13.90),  # office
        ],
    )
    door_leaf("Furn_DoorBed3", 4.55, 0.20 + 2.00 + 0.45, "y", mats)
    door_leaf("Furn_DoorBed2", 4.55, 0.20 + 6.30 + 0.45, "y", mats)
    door_leaf("Furn_DoorBath", 4.55, 0.20 + 10.20 + 0.45, "y", mats)
    door_leaf("Furn_DoorOffice", 4.55, 0.20 + 13.90 + 0.45, "y", mats)

    # --- North wing interiors (pantry) ---
    mu.axis_wall(
        "Wall_PantryS",
        "x",
        15.10,
        17.30,
        15.15,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(0.20)],
    )
    mu.axis_wall("Wall_PantryE", "y", 15.15, 16.80, 17.30, 0.0, H, W, plaster)
    mu.axis_wall("Wall_PantryW", "y", 15.15, 16.80, 15.10, 0.0, H, W, plaster)

    # --- East wing interiors ---
    mu.axis_wall(
        "Wall_E_PrimaryN",
        "x",
        19.10,
        25.20,
        4.45,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(2.40, width=1.00)],
    )
    mu.axis_wall(
        "Wall_E_DressBath",
        "x",
        20.70,
        25.20,
        7.10,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(1.60)],
    )
    mu.axis_wall(
        "Wall_E_BathLaund",
        "x",
        20.70,
        25.20,
        12.10,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(0.40)],
    )
    mu.axis_wall("Wall_E_LaundN", "x", 20.70, 25.20, 14.60, 0.0, H, W, plaster, openings=[_door(0.30)])
    mu.axis_wall(
        "Wall_E_StoreSplit",
        "y",
        14.70,
        16.80,
        22.60,
        0.0,
        H,
        W,
        plaster,
        openings=[_door(0.20, width=0.70)],
    )
    mu.axis_wall(
        "Wall_E_Gallery",
        "y",
        4.55,
        16.80,
        20.70,
        0.0,
        H,
        W,
        plaster,
        openings=[
            _door(0.40),  # dressing
            _door(3.40),  # primary bath
            _door(8.00),  # laundry
            _door(10.50),  # guest wc
        ],
    )
    # primary bath private WC enclosure
    mu.axis_wall("Wall_PriWC", "x", 23.80, 25.20, 8.70, 0.0, H, W, plaster, openings=[_door(0.20, width=0.70)])
    mu.axis_wall("Wall_PriWCy", "y", 7.20, 8.70, 23.80, 0.0, H, W, plaster)

    # --- Glass facades (courtyard + south rooms + galleries) ---
    glass_facade("Glass_SouthWest", "x", 0.35, C.COURTYARD_X, 0.0, mats)
    glass_facade("Glass_SouthEast", "x", C.COURTYARD_X + C.COURTYARD_W, C.BUILDING_W - 0.35, 0.0, mats)
    glass_facade(
        "Glass_CourtWest",
        "y",
        0.15,
        C.COURTYARD_D,
        C.COURTYARD_X,
        mats,
        openings=[_slider(3.80, width=1.20)],
    )
    glass_facade(
        "Glass_CourtEast",
        "y",
        4.50,
        C.COURTYARD_D,
        C.COURTYARD_X + C.COURTYARD_W,
        mats,
        openings=[_slider(3.40, width=1.20)],
    )
    # Primary bedroom west face onto courtyard / garden throat
    glass_facade("Glass_PrimaryW", "y", 0.15, 4.45, 19.10, mats)
    glass_facade(
        "Glass_CourtNorth",
        "x",
        C.COURTYARD_X,
        C.COURTYARD_X + C.COURTYARD_W,
        C.COURTYARD_D,
        mats,
        openings=[
            _slider(1.60, width=2.40),  # living
            _slider(5.20, width=2.40),  # dining
        ],
    )

    build_floors_roofs(mats)


def b2t(p) -> list[float]:
    return [float(p[0]), float(p[2]), float(-p[1])]


def convert_collider(c: dict) -> dict:
    corners = []
    for x in (c["min"][0], c["max"][0]):
        for y in (c["min"][1], c["max"][1]):
            for z in (c["min"][2], c["max"][2]):
                corners.append(b2t([x, y, z]))
    xs, ys, zs = zip(*corners)
    return {
        "min": [min(xs), min(ys), min(zs)],
        "max": [max(xs), max(ys), max(zs)],
    }


def write_scene_info(path: Path, sun_info: dict) -> None:
    rooms = []
    for key, r in C.ROOMS.items():
        cx = r["x"] + r["w"] / 2
        cy = r["y"] + r["d"] / 2
        rooms.append(
            {
                "id": key,
                "label": r["label"],
                "center": b2t([cx, cy, 1.25]),
                "size": [r["w"], r["d"]],
            }
        )
    sd = sun_info["sun_direction_blender"]
    pool = C.OUTDOOR["pool"]
    info = {
        "title": "Solace — The Garden House",
        "spawn": {
            "position": b2t([C.SPAWN["x"], C.SPAWN["y"], C.SPAWN["z"]]),
            "lookAt": b2t([C.SPAWN["look_x"], C.SPAWN["look_y"], C.SPAWN["look_z"]]),
        },
        "sun": {
            "direction": b2t(sd),
            "color": sun_info["sun_color"],
            "intensity": 2.4,
        },
        "ceiling": C.CEILING,
        "eyeHeight": 1.62,
        "rooms": rooms,
        "colliders": [convert_collider(c) for c in mu.COLLIDERS],
        "bounds": convert_collider({"min": [-8.0, -16.0, 0.0], "max": [32.0, 26.0, 4.0]}),
        "pool": convert_collider(
            {
                "min": [pool["x"], pool["y"], -1.0],
                "max": [pool["x"] + pool["w"], pool["y"] + pool["d"], 1.0],
            }
        ),
    }
    path.write_text(json.dumps(info, indent=2), encoding="utf-8")


def create_cameras() -> None:
    for name, spec in C.CAMERAS.items():
        cam_data = bpy.data.cameras.new(name)
        cam_data.lens = spec["focal"]
        cam_data.clip_start = 0.05
        cam_data.clip_end = 200.0
        cam = bpy.data.objects.new(f"Cam_{name}", cam_data)
        cam.location = spec["loc"]
        mu.look_at(cam, spec["look"])
        bpy.context.scene.collection.objects.link(cam)


def render_all(out_dir: Path) -> None:
    scene = bpy.context.scene
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.cycles.transmission_bounces = 8
    scene.cycles.transparent_max_bounces = 8
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    for name in C.CAMERAS:
        cam = bpy.data.objects[f"Cam_{name}"]
        scene.camera = cam
        dest = out_dir / f"render_{name}.png"
        scene.render.filepath = str(dest)
        print(f"RENDER {name} -> {dest}")
        bpy.ops.render.render(write_still=True)


def export_glb(path: Path) -> None:
    # Hide light objects from export clutter
    for obj in bpy.data.objects:
        if obj.name.startswith("Lite_") or obj.name.startswith("Cam_"):
            obj.hide_render = False
            obj.hide_set(False)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
    )


def main() -> None:
    args = _parse_args()
    out_dir = Path(args["output"])
    tex_dir = Path(args["textures"])
    viewer_dir = Path(args["viewer"])
    out_dir.mkdir(parents=True, exist_ok=True)
    tex_dir.mkdir(parents=True, exist_ok=True)
    viewer_dir.mkdir(parents=True, exist_ok=True)

    print("RESET SCENE")
    mu.reset_scene()
    print("MATERIALS")
    mats = materials.build_library(tex_dir, size=768)
    print("ARCHITECTURE")
    build_architecture(mats)
    print("FURNITURE")
    furniture.place_all(mats)
    print("LANDSCAPE")
    landscape.build(mats)
    print("LIGHTING")
    sun_info = lighting.build_world_and_sun()
    lighting.build_interior()
    create_cameras()

    blend_path = out_dir / "solace_garden_house.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f"SAVED {blend_path}")

    info_path = out_dir / "scene_info.json"
    write_scene_info(info_path, sun_info)
    (viewer_dir / "scene_info.json").write_text(info_path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"SCENE INFO {info_path} colliders={len(mu.COLLIDERS)}")

    glb_path = out_dir / "house.glb"
    print("EXPORT GLB")
    export_glb(glb_path)
    dest_glb = viewer_dir / "house.glb"
    dest_glb.write_bytes(glb_path.read_bytes())
    print(f"GLB {glb_path} ({glb_path.stat().st_size} bytes)")

    if not args["skip_render"]:
        print("RENDER")
        render_all(out_dir)
    print("DONE")


if __name__ == "__main__":
    main()
