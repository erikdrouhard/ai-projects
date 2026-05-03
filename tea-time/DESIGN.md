# Tea Time — Design Spec

A single-screen brewing timer for loose-leaf single-origin oolong and green tea.
This document is the source of truth for v1 visual language, tea data, and
interaction. It exists so that an image-gen pass and an App Creator scaffold
pass can both work from the same brief.

---

## 1. Audience and tone

The user is someone who weighs leaf on a 0.1g scale and cares whether their
Wuyi rock oolong sees 95°C or 100°C water. The app should feel like a quiet
ceramic object, not a kitchen utility. No tea-bag clichés (no string, no tag,
no animated steam). No gamification.

The aesthetic vocabulary leans:

- Tea ware (gaiwan, kyusu, hand-thrown porcelain)
- Tea ceremony reverence — calm, slow, deliberate
- Single-origin coffee menu boards (origin · varietal · year)
- Editorial typography over UI typography

---

## 2. Visual language

### 2.1 Palette

Default to a warm dark theme. Light theme is a stretch goal.

| Role             | Token        | Hex       | Notes                                  |
|------------------|--------------|-----------|----------------------------------------|
| Background       | `bg`         | `#1A1714` | Warm near-black, slight brown cast     |
| Surface          | `surface`    | `#22201C` | Card / pill background                 |
| Ink (primary)    | `ink`        | `#EDE6D9` | Off-white, paper-like                  |
| Ink (muted)      | `ink-muted`  | `#9B9082` | Metadata, secondary labels             |
| Jade (green)     | `jade`       | `#7A8C6B` | Accent for green teas                  |
| Clay (oolong)    | `clay`       | `#B5734A` | Accent for oolongs                     |
| Ember (timer)    | `ember`      | `#D9824A` | Active timer ring, "begin" state       |
| Hairline         | `hairline`   | `#3A352F` | 1px dividers                           |

The accent rotates with the selected tea: green teas use `jade`, oolongs use
`clay`. The timer ring while running uses `ember` regardless.

### 2.2 Typography

- **Display (tea name, English):** a refined serif. Default: *Cormorant Garamond*
  (or system `New York` as fallback). Weight 400, optical size large.
- **Display (tea name, native script 中文/日本語):** the same serif if it carries
  CJK; otherwise *Noto Serif SC / JP* at a smaller size beneath the English.
- **Body / data:** SF Pro Text. Tabular numerals for °C / °F / grams / time.
- **All-caps micro-labels** ("ORIGIN", "WATER", "LEAF", "STEEP") use SF Pro
  with +120 tracking, 11pt.

Sizes (rough):

```
Tea name (EN)     34pt serif
Tea name (CJK)    20pt serif
Origin · year     13pt sans, ink-muted
Micro-labels      11pt sans, ink-muted, +120 tracking
Data values       17pt sans tabular
Timer digits      72pt sans tabular, light weight
```

### 2.3 Layout grid

- 16pt outer margins.
- 24pt vertical rhythm between major blocks.
- Single-column. Everything centers on the long axis.
- One hero card occupies most of the screen; the timer sits in the lower third.

### 2.4 Motion

- Tea-to-tea swipe: 320ms ease-out, accent color crossfades.
- Timer start: ring fills from 12 o'clock, ember color, hairline-thin (2pt).
- On finish: a single soft chime + the ring pulses once. No confetti.

---

## 3. Tea catalog (v1)

Four teas, ordered greens → oolongs (light → dark). All values are
"recommended Western-style first steep" — the simplest brew the user will run.

### 3.1 Dragon Well · 龍井 (Long Jing)

- Type: Green, pan-fired
- Origin: Hangzhou, Zhejiang, China
- Water: **75 °C / 167 °F**
- Leaf : water: **3 g per 150 ml**
- First steep: **2:00**
- Accent: `jade`

### 3.2 Gyokuro · 玉露

- Type: Green, shaded
- Origin: Uji, Kyoto, Japan
- Water: **60 °C / 140 °F**
- Leaf : water: **4 g per 60 ml**
- First steep: **1:30**
- Accent: `jade`

### 3.3 Tieguanyin · 鐵觀音 (Iron Goddess)

- Type: Oolong, lightly oxidized
- Origin: Anxi, Fujian, China
- Water: **95 °C / 203 °F**
- Leaf : water: **5 g per 120 ml**
- First steep: **0:45**
- Accent: `clay`

### 3.4 Da Hong Pao · 大紅袍 (Big Red Robe)

- Type: Oolong, heavily roasted (Wuyi rock)
- Origin: Wuyi Mountains, Fujian, China
- Water: **100 °C / 212 °F**
- Leaf : water: **5 g per 120 ml**
- First steep: **0:30**
- Accent: `clay`

> Note on amounts: the app states a ratio, not a single dose. A user brewing
> a smaller pot scales both numbers. We display "5 g · 120 ml" as one unit.

---

## 4. The single screen

One screen, three regions stacked vertically.

```
┌──────────────────────────────────────┐
│                                      │
│              tea time                │  wordmark, 13pt tracked, ink-muted
│                                      │
│                                      │
│         ─── ●  ○  ○  ○ ───           │  swipe indicator, 4 dots
│                                      │
│                                      │
│            Dragon Well               │  34pt serif
│              龍井                     │  20pt serif
│                                      │
│        Hangzhou  ·  green            │  13pt sans, ink-muted
│                                      │
│  ───────────────────────────────     │  hairline divider
│                                      │
│   WATER          LEAF        STEEP   │  11pt micro-labels, tracked
│   75°C / 167°F   3g · 150ml  2:00    │  17pt tabular data
│                                      │
│  ───────────────────────────────     │
│                                      │
│                                      │
│                                      │
│              ╭─────╮                 │
│             │       │                │  timer ring (jade idle,
│             │  2:00 │                │  ember while running),
│             │       │                │  72pt timer digits inside
│              ╰─────╯                 │
│                                      │
│             ◉ Begin                  │  CTA, accent-colored,
│                                      │  becomes "Pause" while running
│                                      │
│                                      │
└──────────────────────────────────────┘
```

### 4.1 Regions

1. **Header strip** — wordmark + tea-position dots. The dots double as the only
   chrome that hints "you can swipe."
2. **Tea card** — name (EN + native), origin · type line, hairline-bracketed
   data row (Water / Leaf / Steep). This is the read-only "menu board."
3. **Brew control** — large circular timer with the steep duration inside.
   Single CTA below: *Begin → Pause → Resume → (auto on finish) Reset*.

### 4.2 Interactions

- **Swipe left/right** anywhere on the tea card → next/previous tea.
  Accent color and dot indicator animate together.
- **Tap Begin** → ring starts filling (counting down), digits tick, CTA becomes
  *Pause*. Accent color shifts to `ember`.
- **Tap Pause** → ring + digits freeze, CTA becomes *Resume*.
- **Long-press timer ring** → reset to the tea's default steep time. Subtle
  haptic. No confirmation dialog — long-press *is* the confirmation.
- **Timer hits 0** → soft chime, ring pulses once, CTA becomes *Begin* again,
  digits reset to default. No modal.
- **Swiping during a running timer** is disallowed; swipe gesture is captured
  but the card subtly resists (rubber-band) so the user knows why nothing moved.

### 4.3 Accessibility

- All temperature, weight, and time values readable by VoiceOver as a single
  composed sentence: "Dragon Well, green tea from Hangzhou. 75 degrees Celsius,
  167 Fahrenheit. 3 grams per 150 milliliters. Steep 2 minutes."
- Dynamic Type: serif display scales up to XXL; layout collapses the data row
  to stacked rows past XXL.
- Reduce Motion: ring fills with opacity instead of stroke animation.
- Minimum hit target on Begin / dots: 44×44pt.

---

## 5. Data shape (for the eventual SwiftUI scaffold)

```swift
struct Tea {
    let id: String                  // "long-jing"
    let nameEN: String              // "Dragon Well"
    let nameNative: String          // "龍井"
    let origin: String              // "Hangzhou"
    let category: Category          // .green | .oolong
    let waterCelsius: Int           // 75
    let leafGrams: Double           // 3.0
    let waterMilliliters: Int       // 150
    let firstSteepSeconds: Int      // 120
}

enum Category { case green, oolong
    var accent: Color { ... }       // jade | clay
}
```

Catalog is a static array in code for v1. No persistence beyond the
last-selected tea index in `UserDefaults`.

---

## 6. Open questions

- Does the user want **Fahrenheit-first** or **Celsius-first** display?
  Spec currently shows both with `°C / °F` order. Configurable later.
- Should the timer offer **multi-steep** sequencing (gongfu: 20s, 25s, 30s, …)?
  Out of v1 but the data model leaves room (`firstSteepSeconds` implies more).
- **Sound:** ship a single chime, or none at all? Connoisseur audience may
  prefer silence + haptic only. Default proposal: haptic + optional chime,
  off by default.

---

## 7. Things explicitly *not* in v1

- Tea bag mode
- User-added teas / editing the catalog
- Brew journal / history
- Apple Watch companion
- iCloud sync
- Light theme (dark only)
- Localization beyond English UI chrome (tea names are bilingual already)
