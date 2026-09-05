"""Render hero cameras from the saved .blend using Cycles CPU."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
CAMS = ("aerial_south", "courtyard", "living")


def main() -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.cycles.transmission_bounces = 8
    scene.cycles.transparent_max_bounces = 8
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "Filmic"
    names = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else list(CAMS)
    if not names:
        names = list(CAMS)
    for name in names:
        cam = bpy.data.objects.get(f"Cam_{name}")
        if cam is None:
            print(f"MISSING camera Cam_{name}")
            continue
        scene.camera = cam
        dest = OUT / f"render_{name}.png"
        scene.render.filepath = str(dest)
        print(f"RENDER {name} -> {dest}")
        bpy.ops.render.render(write_still=True)
        print(f"WROTE {dest} {dest.stat().st_size if dest.exists() else 0}")
    print("DONE")


if __name__ == "__main__":
    main()
