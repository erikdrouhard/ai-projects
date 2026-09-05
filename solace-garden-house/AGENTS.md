# Solace — The Garden House

Headless Blender project that turns the Solace Concept 01 floor plan into a
realistic single-level house and a first-person walkthrough.

## What this is

- **Plan:** `plans/floor-plan.jpg` — 3 bed + office, ~305 m², U-shaped around a south-facing courtyard.
- **Builder:** `blender/build_house.py` — run with Blender 4.2+ in background mode.
- **Walkthrough:** `viewer/` — Three.js first-person explorer of the exported glTF.

## Layout

```
solace-garden-house/
  plans/              source floor plan
  blender/            headless scene builder (bpy)
  scripts/            install / build / serve
  textures/           generated PBR maps (created at build time)
  output/             .blend, renders, scene_info.json
  viewer/             first-person walkthrough
    assets/           house.glb + scene_info.json (copied by build)
```

## Commands

From this folder:

```bash
./scripts/install_blender.sh   # optional, downloads Blender 4.2 LTS
./scripts/build.sh             # generate textures, model, lights, export, render
./scripts/serve.sh             # http://127.0.0.1:8080 walkthrough
```

`BLENDER_BIN` overrides the Blender executable if it is not on `PATH`.

## Conventions

- Coordinates in the builder: **X east, Y north, Z up**, metres, origin at the SW exterior corner of the 25.40 × 17.00 m footprint.
- Object name prefixes: `Wall_`, `Glass_`, `Floor_`, `Roof_`, `Furn_`, `Land_`, `Lite_`.
- Materials are Principled BSDF with generated albedo / roughness maps so they survive glTF export.
- Collision AABBs are written to `scene_info.json` in Three.js space (Y-up).
- Keep every project file inside this folder.
- Keep `AGENTS.md` and `CLAUDE.md` identical at this project level.

## Notes

- Interior daylight galleries and courtyard faces are full-height glass.
- Cycles CPU is used for stills; the walkthrough uses the glTF + a matching sun.
- Do not commit Blender binaries. Generated `house.glb` and hero renders may be committed so the walkthrough works without a local Blender install.
