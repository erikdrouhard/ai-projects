# Tea Time

A single-screen iOS (SwiftUI) timer app for loose-leaf tea connoisseurs brewing
single-origin oolong and green teas by weight.

## Scope

- **Platform:** iPhone, SwiftUI, iOS 17+ (target). Single screen.
- **Audience:** Connoisseurs weighing fancy single-origin loose leaf. Not for tea bags.
- **Teas:** Curated set of 3–4 (two greens, two oolongs). No user-added teas in v1.
- **Per tea, the app must display:**
  - Water temperature (°C and °F)
  - Leaf amount (grams) and water volume (ml) reference
  - First-steep duration (timer)
- **Out of scope (v1):** weight tracking, multi-steep gongfu sequences, user library,
  notifications outside timer completion, Apple Watch.

## Decisions

- **Amount is shown by leaf weight in grams + matched water volume in ml.**
  We do not weigh on-device; we tell the user the ratio.
- **Single screen** holds tea selection, brewing parameters, and the timer.
  Tea picker is a horizontal swipe between cards (no separate menu screen).
- **Connoisseur aesthetic:** quiet, dark, serif-led. See `DESIGN.md`.

## Files

- `CLAUDE.md` / `AGENTS.md` — this file (kept identical).
- `DESIGN.md` — visual language, tea data, screen wireframe, interaction notes.

## Working rules

- All files for this project stay inside `tea-time/`.
- `CLAUDE.md` and `AGENTS.md` in this folder must remain byte-identical.
  When one is edited, mirror the change to the other immediately.
- Do not sync this file with the top-level `CLAUDE.md` — top-level is workspace
  rules; this one is project context. They are separate.
