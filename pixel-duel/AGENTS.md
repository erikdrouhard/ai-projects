# Pixel Duel: Wizard vs Orc Warlord

A single self-contained `index.html` (vanilla JS + Canvas 2D, no assets, no network)
that plays a looping pixel-art fight: the orc warlord leaps in with his axe, the
wizard blocks it with a magic ward, then finishes the orc with a wand blast.

Open `index.html` directly in a browser.

## Lineage

Built from `pixel-wizard/` and `pixel-orc/` (separate branches). The orc engine
(framebuffer, IK rig, per-pixel part rasterizers, particle pool, fixed timestep) is
the base; the wizard's drawing code is ported in. Keep all changes inside this folder.

## Rendering

- Logical 128x96 buffer of palette indices, integer-scaled to the window with
  smoothing disabled. 37-colour fixed palette (orc set + wizard robe/skin/gold + 4 magic).
- Layers: `bg` (static) -> `fb` (frame) and `sp` (sprites) with `tg` tagging each
  sprite pixel as orc body, axe, or wizard.
- The wizard is drawn facing right into `wsp` around local origin `WL`, outlined and
  rim-lit there, then mirrored into `sp` at `WIZ_X` (`x' = WIZ_X + WL - x`). Any
  wizard-space effect position (gem) must go through that mapping.
- Orc passes (outline, moon rim, warm/cold point rims, hit flash, dissolve) skip
  wizard-tagged pixels.
- A Bayer dither fade to black hides the loop reset.

## Choreography

One director state machine (`D_*` constants, `DUR` table) drives both fighters.
The orc samples pose at 12 fps (`SAMPLE = 5`), the wizard at 10 fps (`WSAMPLE = 6`),
the sim runs at 60 Hz.

STANDOFF -> CHARGE (orc crouch; wizard raises ward) -> LEAP -> SLAM -> RECOIL (block
hit-stop, sparks, ward flare, orc hops back) -> STAGGER -> WCHARGE (wizard charge,
orc rises) -> WCAST (projectile; hitting the orc forces KNOCK) -> KNOCK (hit-stop,
white flash, axe flung on a ballistic arc) -> KNEEL -> DISSOLVE (embers) -> VICTORY
-> FADE -> reset.

- `placeWard()` evaluates the blocked pose once at startup and puts the ward where
  the blade's cutting edge lands, so the contact is exact. Retuning `K_BLOCK` or
  `LAND_X` moves the ward automatically.
- The flung axe's arc is solved at launch so it lands buried head-first at
  `AXE_STUCK_X/Y` exactly on its final spin.

## Performance constraints

- No allocation in the loop: mutable floats live in `F` (Float64Array), RNG state in
  an Int32Array, `rndi()` returns Smis, rounded values are `| 0`.
- `warmUp()` runs four full loops plus the event-only paths (bursts, free axe,
  shockwave, flash) so everything is optimized before the first visible frame.
