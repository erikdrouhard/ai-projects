"""Headless-safe mesh primitives for Blender 4.2 (no bpy.ops)."""

from __future__ import annotations

import math
from typing import Iterable, Sequence

import bmesh
import bpy
from mathutils import Vector


COLLIDERS: list[dict] = []
COLLECTIONS: dict[str, bpy.types.Collection] = {}


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    COLLIDERS.clear()
    COLLECTIONS.clear()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.world = bpy.data.worlds.new("World") if bpy.data.worlds.find("World") == -1 else bpy.data.worlds["World"]


def collection(name: str) -> bpy.types.Collection:
    if name in COLLECTIONS:
        return COLLECTIONS[name]
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    COLLECTIONS[name] = col
    return col


def link(obj: bpy.types.Object, col_name: str) -> bpy.types.Object:
    col = collection(col_name)
    if obj.name not in col.objects:
        col.objects.link(obj)
    return obj


def assign(obj: bpy.types.Object, mat: bpy.types.Material | None) -> None:
    if mat is None:
        return
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_collider(cx: float, cy: float, cz: float, sx: float, sy: float, sz: float) -> None:
    COLLIDERS.append(
        {
            "min": [cx - sx / 2, cy - sy / 2, cz - sz / 2],
            "max": [cx + sx / 2, cy + sy / 2, cz + sz / 2],
        }
    )


def _box_uvs(mesh: bpy.types.Mesh, size: Sequence[float], tile: float = 1.0) -> None:
    sx, sy, sz = size
    mesh.uv_layers.new(name="UVMap")
    uv = mesh.uv_layers.active.data
    # After from_pydata, loops are created from faces.
    for poly in mesh.polygons:
        n = poly.normal
        for li in poly.loop_indices:
            v = mesh.vertices[mesh.loops[li].vertex_index].co
            if abs(n.z) >= 0.5:
                u, vv = v.x / tile, v.y / tile
            elif abs(n.y) >= 0.5:
                u, vv = v.x / tile, v.z / tile
            else:
                u, vv = v.y / tile, v.z / tile
            uv[li].uv = (u + 0.5 * max(sx, sy, sz) / tile, vv + 0.5 * max(sx, sy, sz) / tile)


def box(
    name: str,
    loc: Sequence[float],
    size: Sequence[float],
    mat: bpy.types.Material | None = None,
    col: str = "Architecture",
    collide: bool = False,
    tile: float = 1.2,
) -> bpy.types.Object:
    sx, sy, sz = size
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    verts = [
        (-hx, -hy, -hz),
        (hx, -hy, -hz),
        (hx, hy, -hz),
        (-hx, hy, -hz),
        (-hx, -hy, hz),
        (hx, -hy, hz),
        (hx, hy, hz),
        (-hx, hy, hz),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (2, 6, 7, 3),
        (0, 3, 7, 4),
        (1, 5, 6, 2),
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    _box_uvs(mesh, size, tile)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    link(obj, col)
    assign(obj, mat)
    if collide:
        add_collider(loc[0], loc[1], loc[2], sx, sy, sz)
    return obj


def cylinder(
    name: str,
    loc: Sequence[float],
    radius: float,
    depth: float,
    mat: bpy.types.Material | None = None,
    col: str = "Furniture",
    segs: int = 16,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segs,
        radius1=radius,
        radius2=radius,
        depth=depth,
    )
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rotation
    link(obj, col)
    assign(obj, mat)
    return obj


def ico(
    name: str,
    loc: Sequence[float],
    radius: float,
    mat: bpy.types.Material | None = None,
    col: str = "Landscape",
    subdivisions: int = 2,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    link(obj, col)
    assign(obj, mat)
    return obj


def wall_run(
    name: str,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    z0: float,
    z1: float,
    thickness: float,
    mat: bpy.types.Material | None,
    openings: Iterable[dict] | None = None,
    col: str = "Architecture",
    collide: bool = True,
    tile: float = 1.6,
) -> list[bpy.types.Object]:
    """Build a wall along an XY segment. Openings are {along, width, z0, z1}.

    `along` is metres from (x1,y1) toward (x2,y2). A full-height opening is a
    doorway / slider gap. Partial-height openings become punched holes.
    """
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length < 1e-6:
        return []
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    zc = (z0 + z1) / 2
    height = z1 - z0
    openings = list(openings or [])
    openings.sort(key=lambda o: o["along"])

    # Merge opening intervals along the run, then emit solid spans.
    spans = []
    cursor = 0.0
    for op in openings:
        a0 = max(0.0, op["along"])
        a1 = min(length, op["along"] + op["width"])
        if a1 <= cursor + 0.01:
            continue
        if a0 > cursor + 0.02:
            spans.append((cursor, a0, None))
        spans.append((a0, a1, op))
        cursor = a1
    if cursor < length - 0.02:
        spans.append((cursor, length, None))

    objs = []
    for i, (a0, a1, op) in enumerate(spans):
        mid = (a0 + a1) / 2
        cx = x1 + ux * mid
        cy = y1 + uy * mid
        span = a1 - a0
        if op is None:
            obj = box(
                f"{name}_{i}",
                (cx + px * 0.0, cy + py * 0.0, zc),
                (abs(ux) * span + abs(px) * thickness + 1e-4, abs(uy) * span + abs(py) * thickness + 1e-4, height),
                mat,
                col=col,
                collide=collide,
                tile=tile,
            )
            # Orient: scale-aligned boxes are axis-aligned. For diagonal walls
            # we would rotate; this house is orthogonal.
            objs.append(obj)
            continue

        oz0 = op.get("z0", z0)
        oz1 = op.get("z1", z1)
        # Lintel above opening
        if oz1 < z1 - 0.02:
            lh = z1 - oz1
            obj = box(
                f"{name}_{i}_lintel",
                (cx, cy, oz1 + lh / 2),
                (abs(ux) * span + abs(px) * thickness, abs(uy) * span + abs(py) * thickness, lh),
                mat,
                col=col,
                collide=collide,
                tile=tile,
            )
            objs.append(obj)
        # Sill below opening
        if oz0 > z0 + 0.02:
            sh = oz0 - z0
            obj = box(
                f"{name}_{i}_sill",
                (cx, cy, z0 + sh / 2),
                (abs(ux) * span + abs(px) * thickness, abs(uy) * span + abs(py) * thickness, sh),
                mat,
                col=col,
                collide=collide,
                tile=tile,
            )
            objs.append(obj)
    return objs


def axis_wall(
    name: str,
    axis: str,
    a0: float,
    a1: float,
    fixed: float,
    z0: float,
    z1: float,
    thickness: float,
    mat: bpy.types.Material | None,
    openings: Iterable[dict] | None = None,
    col: str = "Architecture",
    collide: bool = True,
) -> list[bpy.types.Object]:
    """Orthogonal wall. axis='x' means the wall runs along X at y=fixed."""
    if axis == "x":
        return wall_run(name, a0, fixed, a1, fixed, z0, z1, thickness, mat, openings, col, collide)
    return wall_run(name, fixed, a0, fixed, a1, z0, z1, thickness, mat, openings, col, collide)


def look_at(obj: bpy.types.Object, target: Sequence[float]) -> None:
    loc = Vector(obj.location)
    tgt = Vector(target)
    direction = tgt - loc
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
