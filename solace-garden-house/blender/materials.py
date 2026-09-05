"""Procedural PBR materials that bake to images so glTF export keeps them."""

from __future__ import annotations

from pathlib import Path

import bpy
import numpy as np


TEXTURE_DIR = Path(__file__).resolve().parent.parent / "textures"
_CACHE: dict[str, bpy.types.Material] = {}
_IMAGES: dict[str, bpy.types.Image] = {}


def _fbm(w: int, h: int, octaves: int = 5, seed: int = 0, scale: float = 8.0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), dtype=np.float32)
    amp = 1.0
    norm = 0.0
    cur = scale
    for _ in range(octaves):
        gh = max(2, int(cur) + 2)
        gw = max(2, int(cur * w / h) + 2)
        grid = rng.random((gh, gw)).astype(np.float32)
        ys = np.linspace(0, gh - 1.001, h)
        xs = np.linspace(0, gw - 1.001, w)
        y0 = np.floor(ys).astype(np.int32)
        x0 = np.floor(xs).astype(np.int32)
        fy = (ys - y0)[:, None]
        fx = (xs - x0)[None, :]
        # smoothstep
        fy = fy * fy * (3 - 2 * fy)
        fx = fx * fx * (3 - 2 * fx)
        y1 = np.clip(y0 + 1, 0, gh - 1)
        x1 = np.clip(x0 + 1, 0, gw - 1)
        g00 = grid[y0[:, None], x0[None, :]]
        g10 = grid[y0[:, None], x1[None, :]]
        g01 = grid[y1[:, None], x0[None, :]]
        g11 = grid[y1[:, None], x1[None, :]]
        layer = g00 * (1 - fx) * (1 - fy) + g10 * fx * (1 - fy) + g01 * (1 - fx) * fy + g11 * fx * fy
        acc += layer * amp
        norm += amp
        amp *= 0.5
        cur *= 2.0
    return acc / max(norm, 1e-6)


def _to_image(name: str, rgba: np.ndarray, out_dir: Path) -> bpy.types.Image:
    if name in _IMAGES:
        return _IMAGES[name]
    h, w, _ = rgba.shape
    img = bpy.data.images.new(name, w, h, alpha=True, float_buffer=False)
    flat = np.clip(rgba, 0, 1).astype(np.float32).ravel()
    img.pixels.foreach_set(flat)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{name}.png"
    img.filepath_raw = str(path)
    img.file_format = "PNG"
    img.save()
    _IMAGES[name] = img
    return img


def _wood(size: int, seed: int, base: tuple[float, float, float], dark: tuple[float, float, float]) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=6, seed=seed, scale=10)
    yy = np.linspace(0, 28, size, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1.2, size, dtype=np.float32)[None, :]
    rings = np.sin(yy * 2.2 + n * 6.5 + np.sin(yy * 0.35) * 3.0 + xx * 0.8)
    grain = 0.5 + 0.5 * rings
    pore = _fbm(size, size, octaves=4, seed=seed + 3, scale=40)
    mix = np.clip(grain * 0.78 + pore * 0.22, 0, 1)
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    for i in range(3):
        albedo[..., i] = dark[i] + (base[i] - dark[i]) * mix
    albedo[..., 3] = 1.0
    rough = np.clip(0.32 + 0.28 * (1 - mix) + 0.08 * pore, 0.2, 0.85)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _plaster(size: int) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=5, seed=11, scale=14)
    fine = _fbm(size, size, octaves=3, seed=12, scale=50)
    tone = 0.90 + 0.06 * n + 0.03 * fine
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    albedo[..., 0] = tone * 0.97
    albedo[..., 1] = tone * 0.95
    albedo[..., 2] = tone * 0.90
    albedo[..., 3] = 1.0
    rough = np.clip(0.58 + 0.18 * n, 0.45, 0.85)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _stone(size: int) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=5, seed=21, scale=8)
    tiles = 8
    gy = np.arange(size)[:, None]
    gx = np.arange(size)[None, :]
    cell = 1.0 - (
        ((gy % (size // tiles)) < 3) | ((gx % (size // tiles)) < 3)
    ).astype(np.float32)
    grout = 1.0 - cell
    base = np.array([0.62, 0.58, 0.52], dtype=np.float32)
    var = np.array([0.48, 0.45, 0.40], dtype=np.float32)
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    mix = n * cell + 0.35 * grout
    for i in range(3):
        albedo[..., i] = var[i] + (base[i] - var[i]) * mix
    albedo[..., 3] = 1.0
    rough = np.clip(0.55 + 0.3 * grout + 0.1 * n, 0.4, 0.95)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _grass(size: int) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=6, seed=31, scale=16)
    streaks = _fbm(size, size, octaves=3, seed=32, scale=40)
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    albedo[..., 0] = 0.14 + 0.10 * n + 0.04 * streaks
    albedo[..., 1] = 0.28 + 0.22 * n
    albedo[..., 2] = 0.10 + 0.08 * n
    albedo[..., 3] = 1.0
    rough = np.clip(0.78 + 0.15 * n, 0.7, 0.98)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _concrete(size: int) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=5, seed=41, scale=10)
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    v = 0.55 + 0.12 * n
    albedo[..., 0] = v * 0.96
    albedo[..., 1] = v * 0.94
    albedo[..., 2] = v * 0.90
    albedo[..., 3] = 1.0
    rough = np.clip(0.70 + 0.15 * n, 0.55, 0.92)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _fabric(size: int, rgb: tuple[float, float, float], seed: int) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=4, seed=seed, scale=22)
    weave = (
        (np.sin(np.linspace(0, 80 * np.pi, size)[:, None]) * 0.5 + 0.5) * 0.15
        + (np.sin(np.linspace(0, 80 * np.pi, size)[None, :]) * 0.5 + 0.5) * 0.15
    )
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    t = 0.82 + 0.18 * n + weave
    for i in range(3):
        albedo[..., i] = rgb[i] * t
    albedo[..., 3] = 1.0
    rough = np.clip(0.72 + 0.15 * n, 0.6, 0.95)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _marble(size: int) -> tuple[np.ndarray, np.ndarray]:
    n = _fbm(size, size, octaves=6, seed=51, scale=5)
    yy = np.linspace(0, 6, size)[:, None]
    xx = np.linspace(0, 6, size)[None, :]
    vein = np.abs(np.sin(xx * 1.7 + yy * 0.4 + n * 7.0))
    vein = np.clip((0.18 - vein) * 8, 0, 1)
    albedo = np.zeros((size, size, 4), dtype=np.float32)
    albedo[..., 0] = 0.86 - 0.25 * vein + 0.04 * n
    albedo[..., 1] = 0.84 - 0.22 * vein + 0.03 * n
    albedo[..., 2] = 0.80 - 0.18 * vein + 0.02 * n
    albedo[..., 3] = 1.0
    rough = np.clip(0.18 + 0.25 * vein, 0.12, 0.5)
    r4 = np.repeat(rough[..., None], 4, axis=2)
    r4[..., 3] = 1.0
    return albedo, r4


def _make_pbr(
    name: str,
    albedo_img: bpy.types.Image,
    rough_img: bpy.types.Image,
    *,
    metallic: float = 0.0,
    specular: float = 0.5,
    emission: tuple[float, float, float, float] | None = None,
    transmission: float = 0.0,
    ior: float = 1.45,
    alpha: float = 1.0,
    roughness_mul: float = 1.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (500, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (160, 0)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = albedo_img
    tex.location = (-280, 80)
    tex.interpolation = "Smart"
    rtex = nt.nodes.new("ShaderNodeTexImage")
    rtex.image = rough_img
    rtex.location = (-280, -220)
    rtex.interpolation = "Smart"
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.location = (-500, 0)
    mapping.inputs["Scale"].default_value = (1.0, 1.0, 1.0)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-720, 0)
    nt.links.new(coord.outputs["UV"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], rtex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(rtex.outputs["Color"], bsdf.inputs["Roughness"])
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Specular IOR Level"].default_value = specular
    bsdf.inputs["IOR"].default_value = ior
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
        mat.shadow_method = "HASHED"
    if emission:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission[3] if len(emission) > 3 else 4.0
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    _CACHE[name] = mat
    return mat


def _solid(
    name: str,
    color: tuple[float, float, float],
    roughness: float,
    *,
    metallic: float = 0.0,
    transmission: float = 0.0,
    ior: float = 1.45,
    alpha: float = 1.0,
    emission: tuple[float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    if name in _CACHE:
        return _CACHE[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["IOR"].default_value = ior
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
        mat.shadow_method = "HASHED"
    if emission and emission_strength:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    _CACHE[name] = mat
    return mat


def build_library(out_dir: Path | None = None, size: int = 768) -> dict[str, bpy.types.Material]:
    """Create the full material set. Images are written to out_dir."""
    global TEXTURE_DIR
    if out_dir is not None:
        TEXTURE_DIR = Path(out_dir)
    TEXTURE_DIR.mkdir(parents=True, exist_ok=True)

    oak_a, oak_r = _wood(size, 7, (0.72, 0.55, 0.34), (0.38, 0.24, 0.13))
    wal_a, wal_r = _wood(size, 9, (0.42, 0.28, 0.16), (0.18, 0.10, 0.06))
    plas_a, plas_r = _plaster(size)
    stone_a, stone_r = _stone(size)
    grass_a, grass_r = _grass(size)
    conc_a, conc_r = _concrete(size)
    linen_a, linen_r = _fabric(size, (0.82, 0.78, 0.70), 61)
    navy_a, navy_r = _fabric(size, (0.22, 0.26, 0.32), 62)
    sand_a, sand_r = _fabric(size, (0.70, 0.62, 0.50), 63)
    marb_a, marb_r = _marble(size)

    oak_ai = _to_image("oak_albedo", oak_a, TEXTURE_DIR)
    oak_ri = _to_image("oak_rough", oak_r, TEXTURE_DIR)
    wal_ai = _to_image("walnut_albedo", wal_a, TEXTURE_DIR)
    wal_ri = _to_image("walnut_rough", wal_r, TEXTURE_DIR)
    pl_ai = _to_image("plaster_albedo", plas_a, TEXTURE_DIR)
    pl_ri = _to_image("plaster_rough", plas_r, TEXTURE_DIR)
    st_ai = _to_image("stone_albedo", stone_a, TEXTURE_DIR)
    st_ri = _to_image("stone_rough", stone_r, TEXTURE_DIR)
    gr_ai = _to_image("grass_albedo", grass_a, TEXTURE_DIR)
    gr_ri = _to_image("grass_rough", grass_r, TEXTURE_DIR)
    co_ai = _to_image("concrete_albedo", conc_a, TEXTURE_DIR)
    co_ri = _to_image("concrete_rough", conc_r, TEXTURE_DIR)
    li_ai = _to_image("linen_albedo", linen_a, TEXTURE_DIR)
    li_ri = _to_image("linen_rough", linen_r, TEXTURE_DIR)
    na_ai = _to_image("navy_albedo", navy_a, TEXTURE_DIR)
    na_ri = _to_image("navy_rough", navy_r, TEXTURE_DIR)
    sa_ai = _to_image("sand_albedo", sand_a, TEXTURE_DIR)
    sa_ri = _to_image("sand_rough", sand_r, TEXTURE_DIR)
    ma_ai = _to_image("marble_albedo", marb_a, TEXTURE_DIR)
    ma_ri = _to_image("marble_rough", marb_r, TEXTURE_DIR)

    mats = {
        "oak": _make_pbr("M_OakFloor", oak_ai, oak_ri, specular=0.45),
        "walnut": _make_pbr("M_Walnut", wal_ai, wal_ri, specular=0.4),
        "plaster": _make_pbr("M_Plaster", pl_ai, pl_ri, specular=0.35),
        "stone": _make_pbr("M_Stone", st_ai, st_ri, specular=0.4),
        "grass": _make_pbr("M_Grass", gr_ai, gr_ri, specular=0.2),
        "concrete": _make_pbr("M_Concrete", co_ai, co_ri, specular=0.3),
        "linen": _make_pbr("M_Linen", li_ai, li_ri, specular=0.2),
        "navy": _make_pbr("M_Navy", na_ai, na_ri, specular=0.2),
        "sand": _make_pbr("M_Sand", sa_ai, sa_ri, specular=0.2),
        "marble": _make_pbr("M_Marble", ma_ai, ma_ri, specular=0.6),
        "glass": _solid("M_Glass", (0.72, 0.84, 0.88), 0.02, transmission=0.95, ior=1.48, alpha=0.18),
        "water": _solid("M_Water", (0.08, 0.22, 0.28), 0.04, transmission=0.85, ior=1.333, alpha=0.55),
        "frame": _solid("M_Frame", (0.08, 0.08, 0.09), 0.35, metallic=0.65),
        "chrome": _solid("M_Chrome", (0.72, 0.74, 0.76), 0.12, metallic=0.9),
        "matte_black": _solid("M_MatteBlack", (0.04, 0.04, 0.045), 0.55),
        "ceramic": _solid("M_Ceramic", (0.93, 0.93, 0.92), 0.22),
        "soil": _solid("M_Soil", (0.18, 0.12, 0.07), 0.9),
        "leaf": _solid("M_Leaf", (0.16, 0.32, 0.12), 0.72),
        "leaf_dark": _solid("M_LeafDark", (0.08, 0.18, 0.07), 0.78),
        "bark": _solid("M_Bark", (0.22, 0.14, 0.08), 0.85),
        "white_cab": _solid("M_WhiteCab", (0.92, 0.91, 0.88), 0.35),
        "warm_emit": _solid(
            "M_WarmEmit",
            (1.0, 0.86, 0.62),
            0.4,
            emission=(1.0, 0.86, 0.62),
            emission_strength=12.0,
        ),
        "pool_tile": _solid("M_PoolTile", (0.55, 0.68, 0.70), 0.28),
        "roof": _solid("M_Roof", (0.18, 0.18, 0.17), 0.7),
    }
    return mats
