# Pixel Wizard

A single self-contained `index.html` that renders an animated 16-bit style pixel art wizard casting a spell. Vanilla JavaScript + Canvas 2D, no external assets, libraries, or network requests. Open the file directly in a browser.

## Architecture

- **Framebuffer:** everything is drawn as palette indices into a `Uint8Array` at 128x96, converted to RGBA through a precomputed `Uint32Array` palette, `putImageData`'d to an offscreen canvas, then blitted to the fullscreen canvas at the largest integer scale (device pixels, centered, smoothing off, `image-rendering: pixelated`).
- **Palette:** 26 fixed colors in `PAL`. Nothing on screen comes from outside it.
- **Wizard:** drawn procedurally each frame into a separate sprite layer (`sp`), then an outline pass adds the dark silhouette edge and a rim pass lights edge pixels facing the gem.
- **Pose:** six parameters (arm raise, arm reach, staff angle, head tilt, lean, robe sway) eased between keyframes and sampled every 6 ticks (10 fps) so motion reads as sprite animation while the loop runs at 60 Hz.
- **State machine:** IDLE -> CHARGE -> CAST -> RECOVER, durations in ticks in `DUR`.
- **Particles:** fixed pool of typed arrays (`NP` slots), modes: orbit (spiral into gem) and free (burst, trail). Color steps white -> magic -> dark over life.
- **Loop:** fixed 60 Hz timestep with an accumulator, rAF presentation.

## Constraints

- No allocation inside the loop. Float state that changes per tick lives in typed arrays (`F`, `SEED`) because V8 boxes non-Smi numbers stored in closure variables. Round with `| 0` to avoid `-0` heap numbers. `warmUp()` runs two full loops at startup so the JIT sees every branch before the first visible frame.
- All drawing snaps to integer coordinates. No gradients, anti-aliasing, or `shadowBlur`.
- Keep everything in the single `index.html`.

## Project Notes

- Keep project files inside this directory.
- Keep `AGENTS.md` and `CLAUDE.md` identical at this project level.
