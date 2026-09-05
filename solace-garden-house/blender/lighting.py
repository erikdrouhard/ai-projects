"""Realistic daylight (Nishita sky + sun) and warm interior fixtures."""

from __future__ import annotations

import math

import bpy
from mathutils import Euler

import config as C


def _area(name: str, loc, size, energy: float, color, rot=None) -> bpy.types.Object:
    light = bpy.data.lights.new(name, type="AREA")
    light.shape = "RECTANGLE"
    light.size = size[0]
    light.size_y = size[1]
    light.energy = energy
    light.color = color
    light.spread = 160.0
    obj = bpy.data.objects.new(name, light)
    obj.location = loc
    obj.rotation_euler = rot if rot is not None else Euler((math.pi, 0.0, 0.0), "XYZ")
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _spot(name: str, loc, energy: float, color, rot, size: float = 0.8) -> bpy.types.Object:
    light = bpy.data.lights.new(name, type="SPOT")
    light.energy = energy
    light.color = color
    light.spot_size = size
    light.spot_blend = 0.45
    obj = bpy.data.objects.new(name, light)
    obj.location = loc
    obj.rotation_euler = rot
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_world_and_sun() -> dict:
    world = bpy.context.scene.world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    out.location = (400, 0)
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.location = (160, 0)
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.location = (-200, 0)
    sky.sky_type = "NISHITA"
    # Nishita: sun_elevation / sun_rotation in radians
    elev = math.radians(C.SUN["elevation_deg"])
    # Rotation: 0 points sun toward +Y in Blender sky? Nishita sun_rotation
    # is azimuth. We want afternoon from southwest shining into the south
    # courtyard. sun_rotation ~ 215° from north, converted for the node.
    sky.sun_elevation = elev
    sky.sun_rotation = math.radians(55.0)
    sky.sun_disc = True
    sky.sun_intensity = 0.85
    sky.air_density = 1.05
    sky.dust_density = 0.35
    sky.ozone_density = 1.0
    bg.inputs["Strength"].default_value = 1.05
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

    sun = bpy.data.lights.new("Lite_Sun", type="SUN")
    sun.energy = C.SUN["energy"]
    sun.color = (1.0, 0.94, 0.84)
    sun.angle = math.radians(C.SUN["angle_deg"])
    sun_obj = bpy.data.objects.new("Lite_Sun", sun)
    # Direction: from SW down into the courtyard.
    # Elevation 38°, azimuth ~225° (SW) from +Y north, clockwise-from-north
    az = math.radians(225.0)
    el = elev
    # Incoming light direction (toward scene)
    dx = math.sin(az) * math.cos(el)
    dy = math.cos(az) * math.cos(el)
    dz = math.sin(el)
    # Place sun far along the reverse incoming vector
    sun_obj.location = (12.7 - dx * 40.0, 6.0 - dy * 40.0, 4.0 + dz * 40.0)
    # Point -Z of sun object toward scene center
    from meshutil import look_at

    look_at(sun_obj, (12.7, 6.0, 1.0))
    bpy.context.scene.collection.objects.link(sun_obj)

    return {
        "sun_direction_blender": [-dx, -dy, -dz],
        "sun_color": [1.0, 0.94, 0.84],
        "sun_energy": C.SUN["energy"],
        "elevation_deg": C.SUN["elevation_deg"],
    }


def build_interior() -> None:
    warm = (1.0, 0.82, 0.58)
    cool = (0.92, 0.96, 1.0)
    z = C.CEILING - 0.06

    rooms = [
        ("Living", (8.90, 13.80), (3.6, 3.2), 220, warm),
        ("Dining", (13.20, 13.80), (3.2, 3.0), 200, warm),
        ("Kitchen", (16.90, 13.40), (3.0, 2.6), 260, (1.0, 0.90, 0.75)),
        ("Office", (2.30, 14.65), (3.2, 2.8), 140, warm),
        ("Bed2", (2.30, 6.60), (3.2, 2.8), 120, warm),
        ("Bed3", (2.30, 2.25), (3.2, 2.8), 120, warm),
        ("Primary", (22.05, 2.25), (4.4, 2.8), 160, warm),
        ("PriBath", (23.00, 9.60), (3.4, 3.2), 150, cool),
        ("FamBath", (2.30, 10.60), (3.2, 2.4), 130, cool),
        ("Dressing", (23.00, 5.75), (3.2, 1.6), 90, warm),
        ("WGallery", (5.40, 8.50), (1.1, 12.0), 90, cool),
        ("EGallery", (19.85, 10.60), (1.1, 8.0), 80, cool),
        ("Entry", (12.80, 17.70), (2.4, 1.2), 80, warm),
        ("Laundry", (23.00, 13.35), (3.2, 1.6), 80, cool),
        ("Covered", (15.05, -1.90), (6.4, 3.0), 70, warm),
    ]
    for name, (x, y), size, energy, color in rooms:
        _area(f"Lite_{name}", (x, y, z), size, energy, color)

    # Kitchen pendants over the island
    for i, ox in enumerate((-0.7, 0.0, 0.7)):
        _spot(
            f"Lite_Pendant{i}",
            (16.85 + ox, 13.15, 2.35),
            40.0,
            (1.0, 0.78, 0.52),
            Euler((math.pi, 0.0, 0.0), "XYZ"),
            size=0.7,
        )

    # Courtyard uplights
    for i, (x, y) in enumerate(((8.20, 3.20), (17.20, 3.40), (12.70, 7.40))):
        _spot(
            f"Lite_Court{i}",
            (x, y, 0.15),
            25.0,
            (1.0, 0.88, 0.65),
            Euler((0.0, 0.0, 0.0), "XYZ"),
            size=1.1,
        )

    # Pool edge
    _area("Lite_Pool", (13.70, -8.85, 2.6), (8.0, 2.4), 90, (0.75, 0.90, 1.0), rot=Euler((math.pi, 0, 0), "XYZ"))
