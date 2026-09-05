# Solace — The Garden House

Headless Blender build of **Solace Concept 01**: a single-level 3-bed + office
house (~305 m²) wrapped around a south-facing planted courtyard, plus a
first-person walkthrough.

The source plan is `plans/floor-plan.jpg`.

## What you get

- A U-shaped house with daylight galleries, primary suite, kitchen / living /
  dining, lap pool, and woodland edge
- Procedural PBR materials (oak, plaster, stone, marble, glass, water)
- Nishita sky + sun and warm interior area lights
- `output/house.glb` and hero Cycles stills
- `viewer/` — click to lock the pointer and walk the house

## Requirements

- Blender 4.2 LTS or newer (4.2.23 used here)
- Python 3 only for the static file server

## Build and walk

```bash
./scripts/install_blender.sh
./scripts/build.sh
./scripts/serve.sh
```

Open http://127.0.0.1:8080/ and click **Enter the house**.

| Control | Action |
| --- | --- |
| Click | Capture mouse |
| WASD | Walk |
| Shift | Run |
| Esc | Release mouse |
| Room list | Teleport |

`./scripts/build.sh --skip-render` exports the walkthrough without Cycles stills.

`BLENDER_BIN=/path/to/blender` overrides discovery.

## Coordinates

Builder space is metres, **X east, Y north, Z up**, origin at the southwest
exterior corner of the 25.40 × 17.00 m footprint. The courtyard void is
12.40 × 10.80 m. The glTF export is Y-up for the viewer.
