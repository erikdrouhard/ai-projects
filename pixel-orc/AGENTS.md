# Pixel Orc

A single self-contained `index.html` that renders an animated 16-bit style orc warlord performing a charged jumping axe lunge. Vanilla JavaScript + Canvas 2D, no external assets, libraries, or network requests. Open the file directly in a browser.

## Architecture

- **Framebuffer:** everything is drawn as palette indices into a `Uint8Array` at 128x96, converted to RGBA through a precomputed `Uint32Array` palette, `putImageData`'d to an offscreen canvas, then blitted to the fullscreen canvas at the largest integer scale (device pixels, centered, smoothing off, `image-rendering: pixelated`).
- **Palette:** 27 fixed colors in `PAL`. Nothing on screen comes from outside it.
- **Rig:** `computePose()` fills pose parameters `P` (hip position, lean, shoulder rotation, elbow bend, head tilt, axe angle, cloth sway, feet) from the state machine. `computeRig()` turns them into integer joints `J`; knees and elbows come from two-bone IK so feet stay planted and both fists stay on the haft.
- **Rasterization:** limbs, torso and the axe are rasterized per pixel in part-local coordinates (`limb`, `torso`, `axe`), so they can sit at any angle without canvas transforms. Head, skull buckle and fists are small pixel maps. An outline pass, a moonlit top-edge pass and a warm blade-reflection pass run on the sprite layer.
- **Timing:** pose is sampled every 5 ticks (12 fps) from a fixed 60 Hz timestep; rAF only presents. States and durations (ticks) are in `DUR`: IDLE, CHARGE, LEAP, SLAM, RECOVER, RETURN. Impact triggers a 5-tick hit-stop (`freeze`) that pauses the character but not particles or shake.
- **Secondary motion:** cloth sway and pauldron bounce are damped springs updated at 60 Hz and latched at each pose sample, which produces the delayed overshoot on landing and stand-up.
- **Effects:** pooled typed-array particles (charge sparks, impact embers, dust, bouncing stone fragments), slash-trail blade silhouettes interpolated along the swing, flattened ground shockwave, impact starburst, growing and fading ground cracks, 1-2 px screen shake.

## Constraints

- No allocation inside the loop. Float state that changes per tick lives in typed arrays (`P`, `F`, `Q`, `SEED`) because V8 boxes non-Smi numbers stored in closure variables. Round with `ri()` (`Math.round(v) | 0`) to avoid `-0` heap numbers. `warmUp()` runs two full loops plus a burst of rig evaluations at startup so the JIT reaches its top tier before the first visible frame.
- All drawing snaps to integer coordinates. No gradients, anti-aliasing, transparency or `shadowBlur`.
- Keep everything in the single `index.html`.

## Project Notes

- Keep project files inside this directory.
- Keep `AGENTS.md` and `CLAUDE.md` identical at this project level.
