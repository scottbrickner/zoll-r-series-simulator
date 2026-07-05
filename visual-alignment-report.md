# Visual Alignment Report — ZOLL R Series learner panel

Status: **LOCKED**, except where a dated, documented alignment pass reopens a
named region (see §8). The device artwork is a proportion-matched vector
reconstruction of the ZOLL R Series front panel, built as a master SVG
([`src/components/rseries/RSeriesDevice.jsx`](src/components/rseries/RSeriesDevice.jsx))
whose geometry is the single source of truth. React only drives interactive
attributes; it never regenerates the artwork.

---

## 1. Reference image used

- **Primary target:** the front-facing ZOLL R Series reference image supplied by
  the user (the dimensioned product drawing showing the device in **PACE** mode:
  SpO₂ 58, CO₂ 25 / RR 12, ECG + CO₂ capnogram, "PACE", 62 mA / 72 PPM).
- **Dimensional callouts from the reference drawing:** 13.70 in / 348 mm wide
  (top), 12.20 in / 310 mm (bottom), 10.90 in / 277 mm tall, lower cradle
  1.75 in / 44 mm. Whole-device aspect ratio ≈ **1.263**.
- **Source caveat:** the supplied "vector" PDF (`vector r series pace.pdf`) is a
  flat **raster** image (single embedded PNG, no vector paths, C2PA
  AI-generated provenance). No original vector geometry could be lifted, so all
  coordinates were **measured** from the rasterized reference, not traced.

## 2. Overlay settings

- **Reference raster** rendered from the PDF at matrix scale 1.35 →
  **1429 × 1129 px**, which matches the user's coordinate-grid overlay
  (gridlines every 50 px / 100 px). This pixel space was the measurement frame.
- Element positions in the reference were measured by color-segmentation
  (NumPy/PIL): blue bumper, black LCD, orange SHOCK, teal/green tabs, beige
  buttons, knob discs, etc.
- The generated SVG was measured live in the browser via `getBBox()` in SVG
  user units, then both sets were **normalized to each device's bounding box**
  (x and width as a fraction of device width; y and height as a fraction of
  device height) so the two could be compared independent of absolute scale.

## 3. Measured SVG scale

- **SVG viewBox:** `0 0 1440 1120` (master coordinate space).
- **Rendered device bounding box:** ≈ 1410 × 1102 user units → **aspect ratio
  1.281** (reference 1.263; deviation ≈ 1.4 %).
- **LCD logical content** is authored in a fixed **673 × 515** space
  ([`LcdScreen.jsx`](src/components/rseries/LcdScreen.jsx)) and placed/scaled into
  the physical LCD rect `x 204, y 200, w 697, h 526` via
  `scale(1.0357, 1.0214)`.
- **Display scale** in the learner view: `.rs-panel-wrap { width: min(1320px, 98vw) }`.

## 4. X / Y offsets (reference fraction vs. final SVG fraction)

Normalized to device bounding box. Target = reference; Final = locked SVG.

| Anchor | Axis | Reference | Final | Δ |
|--------|------|-----------|-------|---|
| Screen center | X | 0.379 | 0.378 | −0.001 |
| Screen center | Y | 0.411 | 0.419 | +0.008 |
| SHOCK center | X | 0.847 | 0.847 | 0.000 |
| Mode knob center | X | 0.845 | ~0.845 | ~0 |
| Pacer knob center | Y | 0.696 | 0.698 | +0.002 |
| Keypad column center | X | 0.723 | 0.721 | −0.002 |
| Code-readiness box | X | 0.682–0.792 | ~0.69–0.78 | ≤0.01 |

All anchors are within ≈ 1–2 % of the reference.

## 5. Top 10 mismatches fixed (final alignment pass)

Measured as a fraction of the device bounding box.

| # | Element | Reference | Before | After |
|---|---------|-----------|--------|-------|
| 1 | Device aspect ratio | 1.263 | 1.358 (too wide) | **1.281** |
| 2 | Screen center-x | 0.379 | 0.359 (too left) | **0.378** |
| 3 | Screen height | 0.478 | 0.501 (too tall) | **0.479** |
| 4 | SHOCK center-x | 0.847 | 0.872 (too right) | **0.847** |
| 5 | Pacer knob center-y | 0.696 | 0.771 (too low) | **0.698** |
| 6 | Pacer RATE knob x | 0.891 | ~0.90 | aligned (1276) |
| 7 | Keypad column center-x | 0.723 | 0.675 (too left) | **0.721** |
| 8 | Code-readiness box x | 0.682–0.792 | 0.713–0.796 (right) | **0.69–0.78** |
| 9 | Softkey height | ~0.06 | 0.042 (too short) | **~0.052** |
| 10 | Cradle height | ~0.19 | 0.215 (too tall) | **~0.19** |

### Earlier alignment passes (also fixed and verified < 2 %)
Screen size/position, therapy-column spacing (SHOCK→ANALYZE/CHARGE 118,
ANALYZE/CHARGE→ENERGY 130), softkey pitch (114), blue-bumper wall thickness
(19 px), pacer-knob diameter, SHOCK radius (48). Color system aligned to the
reference legend: ZOLL Blue (Pantone 3005 C), faceplate RAL 7035, ENERGY SELECT
beige (RAL 1015), ANALYZE/CHARGE peach, **teal** PACER + pacer rings + 4:1,
green/yellow status LEDs, dark blue-gray code-readiness window with green check.

## 6. Top remaining mismatches (accepted; not yet corrected)

These are below the threshold that warrants further geometry churn. Address only
in a deliberate future alignment pass (see README lock rule).

1. **Top blue "hump" contour** is a stylized approximation of the molded
   stepped elevation — silhouette is close but not a pixel trace.
2. **Trapezoidal taper** (top 348 mm vs bottom 310 mm) is rendered subtly;
   the real taper may be marginally stronger.
3. **Molded-plastic texture** is conveyed with a single highlight gradient, not
   a true texture/normal map.
4. **Screen center-y** sits ≈ 0.8 % low vs the reference.
5. **Cradle side-supports / feet** are simplified ellipses, not the exact molded
   foot profile.
6. **Mode-knob tab shapes** (OFF/MONITOR/PACER/DEFIB) are approximate polygons
   vs the reference's exact rounded tab geometry.
7. **Sub-pixel details** (screws, seams, button bevels) are reconstructions, as
   no original vector paths exist in the supplied raster source.

---

## 8. Alignment pass — 2026-07-02 — Mode Selector (Industrial Design Pass 2)

Reopened region: **Mode Selector** (master layers `12_ModeSelector_Arcs` and
`13_ModeSelector_Knob`). Triggered by a manufacturer close-up photo of the mode
dial supplied by the user, which is a clearer reference for this control than the
whole-panel raster in §1. Change made in the master **and** in the Pass 2 modular
parts (`src/assets/rseries/controls/mode_selector_*.svg`,
`src/components/rseries/controls/ModeSelector.jsx`) so they stay identical, and in
the frozen export `public/RSeries_Master.svg`. **Knob centre (1210, 556) and
radius (82) were NOT changed** — those anchor the rest of the panel and stay
locked; only the knob's internal grip/pointer/sheen and the arc extents moved.

| Element | Before | After | Reason |
|---------|--------|-------|--------|
| Knob finger grip | thin near-black bar `#0d0d0d`, 16×74 | lighter satin-gray molded grip `#8f8f8f→#565656`, 18×80, hairline edge | Photo shows a prominent lighter-gray molded grip, not a near-invisible dark bar. |
| Knob white pointer | insert 10×56 (`#f2f4f6`) | bolder pointer 10×62 (`#f4f6f8`) | Photo's white indicator reads bolder and reaches nearer the edge. |
| Knob sheen | ellipse rx40 ry26 @ 0.10 | rx44 ry28 @ 0.16 | Stronger upper satin highlight, matching the domed sheen in the photo. |
| Red arc | `arc(104, 6→74)` | `arc(104, 40→74)` | Concentrate red at DEFIB (upper-right); stop sweeping toward the top. |
| Teal arc | `arc(104, -152→-40)` | `arc(104, -152→-108)` | Concentrate teal at PACER (lower-left); remove teal from the neutral OFF / MONITOR positions, per the photo. |

**Reviewed and retained (no confident change from this crop):** the OFF / MONITOR
/ PACER / DEFIB label positions, sizes, and colors (OFF black rect `#101316`;
MONITOR gray `#8b9097`; PACER teal `#0f9c97`; DEFIB red `#cf2a20`) read as matching
the photo. Label geometry was **not** moved — the supplied image is a low-resolution
crop, and moving printed-legend geometry on that basis would violate "measure, do
not guess." A higher-resolution reference is needed to revisit label placement.

Supersedes accepted item §6.6 for the knob grip specifically; the OFF/MONITOR/
PACER/DEFIB **tab outline** shapes remain simplified polygons (still accepted).

### 8.1 Final fidelity pass — 2026-07-02 — Mode Selector **PERMANENTLY FROZEN**

A second, tightly-scoped pass on the same region. **Scope was limited to five
properties; everything else in the Mode Selector was left untouched.** Applied to
the master, the frozen export, and the Pass 2 parts identically.

| Property (only these) | Before | After |
|-----------------------|--------|-------|
| Knob grip geometry | 18×80, rx9 | 20×84, rx10 (fuller molded bar) |
| White pointer size | 10×62 | 12×66 (bolder, reaches nearer the edge) |
| Knob depth | dome `#4a4a4a→#2b2b2b→#161616`, no inner shade | deeper dome `#545454→#2c2c2c→#101010` + recessed inner shadow ring (r75, `#000`@0.30) |
| Printed arc saturation | red `#cf2a20`, teal `#0f9c97` | red `#d4271b`, teal `#0ba199` (arcs only; DEFIB/PACER tab fills unchanged) |
| MONITOR gray strip contrast | `#8b9097` | `#6f757c` (darker, higher contrast) |

**Not touched (locked):** knob centre (1210,556) and radius (82); arc angles
(red 40→74, teal −152→−108) and positions; all label geometry/positions/tab
shapes; background plate; indicator dot; centre cap; base ring.

> **FREEZE.** As of this pass the Mode Selector (master layers 11–14 and the
> `controls/mode_selector_*` parts) is **permanently frozen**. No future geometry
> edits to this control unless it is explicitly reopened by the project owner in a
> new, dated pass here. A side-by-side/overlay comparison harness lives at the
> dev route `/mode-selector-compare` (loads `public/mode_selector_reference.png`).

### 8.2 Fine-tune render pass — 2026-07-02 — indicator/dot alignment (reopened → re-frozen)

Explicitly reopened by the project owner to fix the mode indicator: the knob's
white line pointed **opposite** the selected mode (the old single dot pointed at
the mode while the line pointed away). Scope was limited to the indicator system;
knob body, arcs, labels, and all other geometry were left as-is.

| Change | Before | After |
|--------|--------|-------|
| Knob rotation angles (`MODE_ANGLE`) | Off −90, Monitor −45, Defib 55, Pacer −135 (line pointed away from the mode) | Off 90, Monitor 150, Defib −150, Pacer 30 — the white line now points **at** the mode |
| Position dots (layer 14) | one white dot that **rotated** with the knob | **four fixed** white dots (r5, white + `#9a9d99` hairline), one per section, on the collar (radius 89), **do not rotate** |
| White pointer length | 66 (`KR−16`) | 70 (`KR−12`) — reaches nearer the edge / the dot, for an unambiguous indication |

Dot / clock positions (knob line aligns to each when its mode is selected):
OFF → 9 o’clock `(1121,556)`, PACER → 7 o’clock `(1166,633)`, DEFIB → 1 o’clock
`(1254,479)`, MONITOR → 11 o’clock `(1166,479)`. Only the knob rotates; printed
background, arcs, labels, and the dots are fixed. Colour assignment unchanged and
still segregated: teal = PACER, red = DEFIB, gray = MONITOR, black = OFF; no arc
covers OFF or MONITOR. Applied identically to master, export, and Pass 2 parts.
Demonstrated in all four states on `/controls-review`.

> **RE-FROZEN.** The Mode Selector is frozen again as of this pass, under the same
> rule as §8.1 — no geometry edits unless explicitly reopened in a new dated pass.

### 8.3 Label alignment pass — 2026-07-02 — printed labels/sections (reopened → re-frozen)

Explicitly reopened by the project owner to align the **labels and printed colored
sections** to the manufacturer photos. The **knob is approved and was not touched**
(centre, radius, grip, pointer, depth, angles, and the four fixed dots are all
unchanged). Scope limited to layer 12 (labels/sections) + the `mode_selector_labels`
part; applied to master, export, and Pass 2 parts.

| Element | Before | After |
|---------|--------|-------|
| Colored arcs (wrapping) | red + teal arcs (stroke 16) wrapping the knob | **removed** — colour now lives only in the printed sections |
| MONITOR | `#6f757c`, 22 px, weight 700 (too dark/large/prominent) | `#9a9d99`, 18 px, weight 600 — subtle light gray, low contrast |
| PACER | chunky rounded tag (~42 tall) | flat teal section, ~24 tall, angled leading edge |
| DEFIB | large rounded tag (~28 tall, full-height left edge) | flat red section, ~26 tall, **short inward tab** toward the knob |
| OFF | rounded rect `x1008 w86` (right end 1094) | widened to `w104` (right end 1112) so the 9 o’clock dot sits at its right end, close to the knob |

Colour segregation (satisfies the acceptance list): teal = PACER only, red =
DEFIB only, gray = MONITOR, black = OFF; **no colour crosses OFF or MONITOR.**
Dots, angles, and knob-pointer alignment are unchanged from §8.2 (OFF→9, PACER→7,
DEFIB→1, MONITOR→11 o’clock). The now-unused `arc()`/`pt()` SVG helpers and the
`mode_selector_arcs.svg` part were removed. Demonstrated on `/controls-review`
(reference → current → updated, and all four states).

> **RE-FROZEN.** Mode Selector frozen again as of this pass — same rule as §8.1/§8.2.

## 8.4 Function Buttons — 2026-07-02 — Industrial Design Pass 2B (built)

Built the reusable **Function Button** part (`function_button.svg` +
`FunctionButton.jsx`) — one warm-gray molded push-button, different labels. The
footprint matches the **locked master layer 08_FunctionButtons** exactly and was
**not moved**: LEAD `(980,200,110,60)`, SIZE `(980,270,110,60)`, ALARM SUSPEND
`(980,340,110,70)` (two lines), RECORDER `(980,420,110,60)`; corner radius 9.

Approved styling (matches the manufacturer photo — a physical molded button, not
web UI): warm-gray satin face (`#fafaf8 → #ececea → #d1d2ce`), a darker molded
side edge (`#b3b4b0`, 3 px of depth), a subtle top bevel highlight, and a compact
black uppercase label (`#2a2f36`, 16 px, weight 700, letter-spacing 0.3). States:
unpressed (raised), pressed (face seats onto the side edge + darker + inner top
shadow), and latched/amber (for ALARM SUSPEND engaged). Demonstrated on
`/controls-review` (individual asset + all four labels × pressed/unpressed).

**Not wired into the master yet** — like the body parts, this is the approved
library reference; wiring layer 08 to use it is a later step. No body, LCD,
cradle, Mode Selector, or simulator-logic change.

### 8.5 Function Button — 2026-07-02 — material fine-tune (`function_button.svg` FROZEN)

Styling-only fine-tune. **No geometry, corner radius, dimensions, or type size
changed** (footprint still matches locked master layer 08; radius 9; label 16 px).

| Property | Before | After |
|----------|--------|-------|
| Gloss (top bevel highlight) | white @ 0.70 | white @ **0.35** (~50% reduction) |
| Face plastic (unpressed) | `#fafaf8 → #ececea → #d1d2ce` (cool neutral) | `#faf9f3 → #edeae1 → #d4d1c8` (slightly warmer) |
| Molded side edge | `#b3b4b0` | `#b6b3aa` (warmer) |
| Label letter-spacing | 0.30 | **0.29** (~3% reduction) |
| Pressed state | darker gradient + inner **top** shadow | **darker warm plastic** (`#dcdbd4 → #bdbbb2`) + **deeper lower shadow** (bottom-pooled, 0.22) + no top gloss (highlight suppressed when pressed) |

> **FROZEN.** `function_button.svg` (the blank reusable asset) is **permanently
> frozen** as of this pass — no future geometry edits unless explicitly reopened
> in a new dated pass. The `FunctionButton.jsx` state styling (pressed/active)
> may still evolve, but the part's geometry, radius, and dimensions are locked.

## 8.6 Energy Select — 2026-07-02 — Industrial Design Pass 2C (built)

Built the reusable **Energy Select** control (`energy_select_button.svg` +
`EnergySelect.jsx`) from the manufacturer photo. A vertical warm-beige molded
rocker (▲ / ENERGY / SELECT / value / ▼) — deliberately **not** a generic push
button.

- **Geometry (new, reusable):** 96 × 150 (narrower + taller than the Function
  Button's 110 × 60/70), corner radius 16 (larger), side-edge depth 4 (deeper),
  vertically oriented.
- **Plastic:** warm beige satin (`#f3ecda → #e8dcc0 → #d8c9a6`) over a deeper warm
  side edge (`#c9bd9c`); very slight satin sheen (white @ 0.15) — not glossy, no
  hard reflections; minimal shadow (the side edge carries the depth).
- **Triangles:** two flat printed red (`#cf2a20`) triangles, equal size (26 × 18),
  equal spacing, centered — one above and one below the text.
- **Typography:** ENERGY / SELECT — red (`#c4231a`), uppercase, compact
  (14 px / 800 / letter-spacing 0.2), centered; the selected value is dark.
- **React props:** `energyValue`, `energyUnits`, `pressed`, `enabled`,
  `highlighted`. Geometry never changes; React changes only the displayed energy,
  pressed, enabled, and highlighted state. Pressed = darker beige + deeper lower
  shadow; disabled = desaturated + dimmed; highlighted = subtle amber ring.
- Reviewed at the dev route `/energy-select-review` (blank shell, default,
  pressed, disabled, and examples 30/50/70/100/120/150/200/360 J).

**Not wired into the master** — approved library reference only, like the other
Pass 2 parts. No body, LCD, cradle, Mode Selector, Function Button, or
simulator-logic change.

### 8.7 Energy Select — 2026-07-02 — content-centering refinement (2C.1)

Refinement pass to match the manufacturer screenshot more closely. **Only the
content (arrows + text) changed** — outer dimensions (96×150), corner radius (16),
plastic colour system, bevel, and side-edge depth are UNCHANGED.

| Property | Before | After |
|----------|--------|-------|
| Content vertical position | top-heavy (arrows near the edges, empty value gap lower-centre) | **vertically centered** on the button centre, balanced top/bottom space |
| Triangles | 26 × 18 | **30 × 22** (larger, still solid red triangles — not chevrons, equal size) |
| ENERGY / SELECT size | 14 px | 15 px (slightly larger, same red / weight / compact spacing) |
| On-face energy value | printed `150 J` on the face | **removed** — the real device shows the selected energy on the LCD, not the button. `energyValue`/`energyUnits` props retained for API/labelling. |

Spacing is now balanced: ~26 px above the top triangle and below the bottom
triangle, with even gaps between each triangle and the text. Colours preserved
(triangles/text `#cf2a20` / `#c4231a`; beige face `#f3ecda→#e8dcc0→#d8c9a6`; side
edge `#c9bd9c`); no glossy highlight added (satin sheen 0.15 unchanged). Reviewed
at `/energy-select-review` (manufacturer reference slot, blank shell, default,
pressed, disabled, and examples 30/50/70/100/120/150/200/360 J). Not wired into
the master. No other control changed.

> **APPROVED & FROZEN.** The manufacturer-accurate Energy Select — a warm-beige
> molded ▲ / ENERGY / SELECT / ▼ rocker with **no numeric value on the button
> face** — is approved as of this pass. The **selected energy (joules) is
> displayed on the LCD, not on the physical ENERGY SELECT button** (the button
> only increments/decrements the value; the number appears in the defib area of
> the LCD). `energy_select_button.svg` and the `EnergySelect.jsx` geometry
> (footprint 96×150, radius 16), plastic colour, bevel, triangles, and typography
> are frozen — no future geometry edits unless explicitly reopened in a new dated
> pass. `EnergySelect.jsx` may still gain wiring/state props later. The
> `energyValue`/`energyUnits` props are retained for API compatibility but are
> **not** rendered on the face.

## 8.8 Therapy Buttons — 2026-07-02 — Industrial Design Pass 2D (built)

Built the reusable **Therapy Button family** (`TherapyButton.jsx` +
`therapy_button.svg` + `shock_button.svg`) from the manufacturer photos. Footprints
match the locked master layer 09 exactly and were **not moved**:

- **ANALYZE / CHARGE** — small beige/**peach** molded rectangular buttons
  (94 × 58, radius 6) with red uppercase text (`#c4231a`, 17 px, weight 700).
  Peach satin face (`#fdf0e0 → #f6e6d0 → #f2dcc0`) over a darker peach side edge
  (`#e3c9a6`); subtle top bevel; one reusable `variant='action'` part, N labels.
- **SHOCK** — a **flat orange circular** button (radius 46), `variant='shock'`.
  Satin orange face (`#f0893a → #e06f16`) over a darker orange side edge
  (`#c2600d`), darker rim, very subtle satin bevel. **NOT an arcade/glowing
  button** — no glow ring and no glossy hotspot (unlike the master's armed-glow
  circle). The printed "SHOCK" legend sits beside it on the device, so it is not
  drawn on the button face.

States: unpressed (raised), pressed (face seats down + darker + lower shadow / a
subtle inner top shadow on the shock circle), and disabled (desaturated + dimmed).
Factory-new satin molded plastic, minimal shadows. Reviewed on `/controls-review`
(individual assets + ANALYZE / CHARGE / SHOCK × pressed / unpressed / disabled).

**Not wired into the master** — approved library reference only, like the other
Pass 2 parts. No body, LCD, cradle, Mode Selector, Function Button, Energy Select,
or simulator-logic change.

## 8.9 Therapy Buttons — 2026-07-02 — finalization (Pass 2D.1)

Refinement pass finalizing the Therapy Button family to the manufacturer photos,
and formalizing the **physical vs behaviour** split. Only `TherapyButton.jsx`,
`therapy_button.svg`, `shock_button.svg`, and the Controls Review page changed.

- **ANALYZE / CHARGE** — warm-peach molded rectangles, compact red uppercase
  text, **shallower molded bevel / minimal highlight** (satin sheen 0.32 → 0.22),
  factory-new. Pressed: seats down + darker plastic + **deeper lower shadow**
  (0.20 → 0.26). Disabled: reduced opacity (0.72) + muted text, no glow. Same
  geometry for both — only the label differs.
- **SHOCK (physical)** — molded orange plastic with a **satin finish, shallow
  recessed centre, subtle molded outer lip, and reduced gloss** — no longer an
  arcade/glowing button, no exaggerated reflections, no baked illumination.
  Pressed: depress + darker orange + deeper lower shadow. Disabled: muted /
  desaturated orange, no glow.
- **SHOCK glow = separate React overlay (behaviour, not baked into the SVG).**
  `shockReady` renders a soft, subtly-pulsing (SMIL `<animate>`) warm-orange bloom
  halo as a distinct `#shock_glow` layer behind the physical button; it shows
  only while charged-ready and extinguishes immediately on press/disable. A
  `glowOnly` flag renders the overlay alone for review. States supported for the
  future wire-in: idle / charging (no glow), charged-ready (glow), pressed (glow
  off), post-shock (no glow), disabled.

Reviewed on `/controls-review` (individual physical assets; ANALYZE/CHARGE ×
default/pressed/disabled; SHOCK × idle / glow-overlay-only / charged-ready /
pressed / disabled). Footprints match the locked master layer 09; not wired into
the master. No body, LCD, Mode Selector, Function Button, Energy Select, or
simulator-logic change.

> **APPROVED & FROZEN (Pass 2D.1).** The Therapy Button family is approved:
> - **ANALYZE** and **CHARGE** physical molded assets — approved.
> - **SHOCK** physical molded asset — approved.
> - **SHOCK glow** — approved as a **separate React-controlled overlay layer**;
>   it appears **only** when `shockReady` / charged-ready is true and is **not
>   baked into `shock_button.svg`**.
> - **Pressed** and **disabled** remain physical interaction states (no glow).
>
> `therapy_button.svg`, `shock_button.svg`, and the `TherapyButton.jsx` geometry/
> material are frozen — no geometry/material edits unless explicitly reopened in a
> new dated pass. The glow-overlay behaviour and state wiring (shockReady /
> charging / pressed / disabled) may still be connected when the family is wired
> into the master.

## 8.11 Pacer Knobs — 2026-07-02 — Industrial Design Pass 2E (built)

Built the reusable **Pacer Knob** system (`pacer_knob.svg` + `PacerKnob.jsx`) from
the manufacturer photos — the rotary knob used for OUTPUT (mA) and RATE (ppm).
Footprint matches the locked master layer 15 (r 78).

- **Two layers:** a **fixed teal socket ring** (`#0f9c97`, never rotates) and a
  **rotating knob** — outer black molded body (satin `#2e2e2e → #101010`), teal
  inner accent (`#16b3ad`), simplified molded grip ridges (18 flutes — not
  aggressive knurling), inner recessed face (satin radial), centre hub, and one
  **white indicator line** that rotates with the knob.
- **Satin molded plastic:** factory-new, neutral lighting, minimal reflections /
  shadows — not glossy (slight `0.08` highlight only), with visible depth from the
  recessed face + socket layering.
- **React model:** `rotationAngle`, `pressed` (subtle deeper recess), `enabled`
  (dim + desaturated). **Geometry never changes** — only the rotation transform on
  the knob layer and state colours. The socket stays fixed; only the knob (grip +
  indicator) rotates. Rotation range for the examples: −135° / 0° / +135°.

Reviewed on `/controls-review` (blank asset; OUTPUT / RATE; default / pressed /
disabled; minimum / midpoint / maximum rotations). Not wired into the master. No
body, LCD, Mode Selector, Function Button, Energy Select, Therapy Button, or
simulator-logic change. The 4:1 button is a separate later part.

## 8.12 Code Readiness Window — 2026-07-02 — Industrial Design Pass 2F (built)

Built the reusable **Code Readiness / self-test window**
(`code_readiness_window.svg` + `CodeReadiness.jsx`). Footprint matches the locked
master layer 17 (116 × 68).

- **Physical asset:** a **black recessed window** (`#0a0a0a`) in a **dark-gray
  satin molded bezel** (`#3a3a3a → #242424`, stroke `#1a1a1a`), with a subtle inner
  top recess shadow and a minimal satin highlight. Factory-new, neutral lighting,
  minimal reflections. Fixed geometry.
- **React states (display only):** `status = 'blank' | 'ready' | 'notReady' |
  'testing'` → empty / green check (`#00ff66`) / red X (`#ff3830`) / rotating amber
  self-test spinner (`#ffb84d`, SMIL). Optional `flashing` pulses the content.
  Check/X reproduce the master's layer-17 proportions. **The SVG geometry never
  changes — React changes only the display.**
- **Facilitator-ready:** `status` is a plain prop a facilitator control can drive
  later. **No simulator logic wired** this pass.

Reviewed on `/controls-review` (physical asset; blank / ready / notReady / testing
/ ready-flashing). Not wired into the master. No body, LCD, Mode Selector, Function
Button, Energy Select, Therapy Button, Pacer Knob, or simulator-logic change.

## 8.14 Physical Softkey Assembly — 2026-07-03 — Industrial Design Pass 2G (built)

Built the physical softkey assets (`softkey_blank.svg` + `softkey_row.svg`) — the
industrial design behind the approved Softkey Framework (§8.13). Footprint and
spacing match the locked master layer 07_Softkeys exactly.

- **Single key** (`softkey_blank.svg`): a warm-gray molded key, 110 × 58, radius
  6 — satin face (`#fafaf8 → #ececea → #d1d2ce`) over a darker warm-gray molded
  side edge (`#b6b7b3`), with a subtle top bevel highlight. Factory-new satin
  molded plastic. **No labels, no text.**
- **Six-key row** (`softkey_row.svg`): six *identical* keys at pitch **122**
  (12 px gap) — the layer-07 spacing — drawn once and `<use>`d six times.
- **Physical only:** no React logic, no simulator behaviour. The LCD provides the
  labels later.

Reviewed on `/softkey-review` (single key → six-key row → mounted beneath the
LCD). Not wired into the master. No body, LCD, or previously-frozen-control change.

## 8.13 Softkey Framework — 2026-07-03 — Package 4 (built)

Built the reusable **Softkey Framework** (`SoftKey.ts` + `softkeyLayouts.ts` +
`SoftKeyRow.tsx`). This is a *programmable* six-key system, **not** six separate
buttons. The six physical softkeys are part of the locked body (master layer
07_Softkeys) and are unchanged; the framework is the label/state layer over them.

- **Model** (`SoftKey`): `id`, `label`, `enabled`, `visible`, `highlighted`,
  `pressed`. `normalizeRow()` pads/truncates any layout to exactly six slots.
- **Layouts** (per operating mode): **Monitor** uses the R Series baseline —
  Options / Param / Code Marker / Report Data / Alarms / Sync On/Off. **Pacer**,
  **Defib**, **Sync** are example layouts the framework supports (Pacer swaps in
  `4:1`; Sync highlights the Sync toggle). Per-mode legends should be confirmed
  against the R Series Operator's Guide before wire-in.
- **Row** (`SoftKeyRow`): renders six keys (110 × 58, pitch 122 — layer-07
  proportions) as a `<g>`; React changes only label / enabled (dim) / visible
  (hidden slot) / highlighted (teal accent) / pressed (inset). The physical key
  geometry never changes.
- **Note:** these three files are **TypeScript** (`.ts` / `.tsx`) as requested —
  the first TS in this JS project. Vite/esbuild transpiles them at build (no
  tsconfig / no type-check step). See CHANGELOG for the flag.

Reviewed on `/softkey-review` (physical keys; Monitor / Pacer / Defib / Sync
layouts; per-key states). Not wired into the master. No body, LCD, or previously-
frozen-control change, and no simulator logic.

## 8.15 4:1 Button — 2026-07-03 — Industrial Design Pass 2H (built)

Built the reusable **4:1 Button** (`four_to_one_button.svg` +
`FourToOneButton.jsx`) from the manufacturer photos — the small round teal button
that sits between the PACER **OUTPUT (mA)** and **RATE (ppm)** knobs (master layer
15). Pressing it temporarily paces at a 4:1 ratio (pause-to-check the underlying
rhythm).

- **Physical asset:** a **small round teal/blue-green molded button** (satin face
  `#18b0aa → #0f9c97 → #0b807b`) seated in a **recessed socket** (`#c9cbc6` rim →
  `#8fa3a0` seat), over a darker molded **side edge** (`#0a716d`) for depth, with a
  centered white **4:1** legend. A single restrained satin sheen (0.16 highlight —
  toned down from the first cut so it reads satin, **not glossy**). Factory-new,
  neutral CAD lighting, minimal shadows.
- **React states (colour/opacity only):** `pressed` (seats down 2px + darker teal +
  deeper lower shadow), `active` (a restrained brighter teal ring + fill — a
  latched look, **not** a SHOCK-style glow/bloom), `enabled=false` (muted /
  desaturated teal + 0.7 opacity). **The SVG geometry never changes.** Props:
  `cx/cy/r`, `pressed`, `active`, `enabled`, `onClick`, `idPrefix`.

Reviewed on `/controls-review` (blank asset; default / pressed / active-latched /
disabled; and seated in context between the OUTPUT and RATE pacer knobs). Not wired
into the master. No body, LCD, Mode Selector, Function Button, Energy Select,
Therapy Button, Pacer Knob, Code Readiness, softkey, or simulator-logic change.

## 8.16 NIBP Button — 2026-07-05 — Industrial Design Pass 2I (built)

Built the reusable **NIBP Button** (`nibp_button.svg` + `NIBPButton.jsx`) from the
manufacturer photos — the small blue button in the **lower-left control area**
(master layer 18, `18_BP_Button`, cx 128, cy 792, r 32) that starts / stops a
non-invasive blood-pressure (NIBP) measurement.

- **Physical asset:** a **small blue molded button** (satin ZOLL-blue face
  `#2a86c8 → #0066b3 → #004a82`) seated in a **recessed socket** (`#c9cbc6` rim →
  `#9aa1a6` seat), over a darker molded **side edge** (`#003c6b`) for depth. A
  single restrained satin sheen (0.18 highlight — reads satin, **not glossy**).
  Factory-new, neutral CAD lighting, minimal shadows.
- **Icon (white on blue):** an **arm + blood-pressure-cuff pictogram** — a forearm
  ending in a simplified hand/fist (knuckle grooves), an inflatable **cuff band**
  wrapped around the arm (white fill, darker-blue `#013f74` outline + closure seam),
  and a **squeeze bulb** on a tube. Deliberately an *arm with a BP cuff*, **not** a
  generic person / people icon. (The master's `18_BP_Button` legacy glyph is a
  blue-on-gray arm+cuff; the approved reusable part follows the real device: a white
  glyph on a blue button.)
- **React states (colour/opacity only):** `pressed` (seats down 2px + darker blue +
  deeper lower shadow), `active` (a restrained brighter blue ring — armed, **not** a
  SHOCK-style glow/bloom), `measuring` (the same ring, gently pulsing 0.25↔0.7 while
  a reading is taken), `enabled=false` (muted / desaturated blue + 0.7 opacity).
  **The SVG geometry never changes.** Props: `cx/cy/r`, `pressed`, `active`,
  `measuring`, `enabled`, `onClick`, `idPrefix`.

Reviewed on `/controls-review` (blank asset; default / pressed / active / measuring
/ disabled). Not wired into the master. No body, LCD, Mode Selector, Function
Button, Energy Select, Therapy Button, Pacer Knob, Code Readiness, softkey, 4:1, or
simulator-logic change.

### 8.16.1 NIBP Button — 2026-07-05 — manufacturer-accuracy refinement

Corrected the NIBP button to match the **manufacturer front-panel icon**. The first
cut (§8.16) read as a large saturated-blue web button with a large white icon; the
real control is a small, subtle, **pale-faced** button with a **compact blue**
pictogram. Footprint unchanged (master layer 18, cx 128, cy 792, r 32); this is a
material/colour/scale correction only — **no geometry, coordinate, or footprint
change.**

- **Was → now (colour inversion):** saturated ZOLL-blue face + large white
  arm/cuff glyph → **pale satin molded face** (`#fbfbfa → #eeeeeb → #deded9`) with a
  **thin gray molded rim** (`#c6c8c3`, stroke `#a9aba6`) and a subtle molded side
  edge (`#b6b8b3`). The button now reads as a low-weight front-panel key, not an app
  button.
- **Pictogram (compact, two-tone blue on the pale face):** scaled to ~0.82 of the
  face and confined to the centre for generous margin — an **arm + BP cuff**: a
  squeeze bulb + tube, a forearm ending in a simplified fist (`#0066b3`), and a
  **darker-blue inflatable cuff band** (`#004a82`) with a lighter closure seam
  (`#2a86c8`). Still deliberately an *arm wearing a cuff*, **not** a generic person /
  people icon. Overall visual weight reduced ~40–50% vs the first cut.
- **React states (kept subtle, colour/opacity only):** `pressed` (seats down 1.5px +
  face darkens a touch + soft lower shadow), `active` (a thin subtle blue ring at the
  rim, `#3a8fd6` @ 0.5 — **not** a glow), `measuring` (the same thin ring, very
  gently pulsing 0.18↔0.5), `enabled=false` (grayer face + desaturated blue-gray icon
  + 0.6 opacity). **The SVG geometry never changes.** Props unchanged: `cx/cy/r`,
  `pressed`, `active`, `measuring`, `enabled`, `onClick`, `idPrefix`.

Re-reviewed on `/controls-review`. Not wired into the master. No body, LCD, Mode
Selector, Function Button, Energy Select, Therapy Button, Pacer Knob, Code Readiness,
softkey, 4:1, or simulator-logic change.

### 8.16.2 NIBP Button — 2026-07-05 — APPROVED / FROZEN

The refined NIBP Button (§8.16.1) is **APPROVED and FROZEN.** Approved facts (the
frozen reference):

- **Pale / white molded circular face** — not a saturated blue fill.
- **Thin gray molded rim / bezel** around the face.
- **Blue arm + BP-cuff pictogram** (compact, two-tone) — reads as an arm wearing a
  blood-pressure cuff, **not** a generic person / people icon.
- **Not a generic blue app-style button** — low visual weight, factory-new satin
  molded plastic.
- **React states supported:** `default`, `pressed`, `active`, `measuring`,
  `disabled` — all kept subtle (colour/opacity only; the SVG geometry never
  changes). Props: `cx/cy/r`, `pressed`, `active`, `measuring`, `enabled`,
  `onClick`, `idPrefix`.

Freeze rule: no geometry/material/colour edits unless explicitly reopened in a new
dated pass here. The approved part remains the reference and is **not yet wired into
the shipping master**; React state wiring may be connected at master wire-in without
reopening the frozen artwork. Footprint locked to master layer 18 (`18_BP_Button`,
cx 128, cy 792, r 32).

## 8.10 End-of-day finalization — 2026-07-02 — Pass 2 controls frozen

Finalization of today's Industrial Design work. The following control families are
**APPROVED / FROZEN** (see the dated sub-sections above for scope):

| # | Family | Pass | Frozen record |
|---|--------|------|---------------|
| 1 | Body | Pass 1 | §1–§6 (geometry LOCKED) |
| 2 | Mode Selector | Pass 2A | §8.1 / §8.2 / §8.3 |
| 3 | Function Button | Pass 2B | §8.4 / §8.5 |
| 4 | Energy Select | Pass 2C | §8.6 / §8.7 |
| 5 | Therapy Button family | Pass 2D.1 | §8.8 / §8.9 |

Freeze rule (all of the above): no geometry/material edits unless explicitly
reopened in a new dated pass here. The approved parts remain the reference; except
the Mode Selector they are **not yet wired into the shipping master**. React state
wiring (e.g. the SHOCK glow overlay, knob rotation) may still be connected at
master wire-in without reopening the frozen geometry.

**Next milestone: Industrial Design Pass 2E — Pacer Knobs** (`15_PacerKnobs`,
OUTPUT / RATE knobs + 4:1). Not started.

## 9. Dev-only screenshot capture checklist

Capture each state at a fixed viewport (suggest **980 × 760**, learner route)
for regression comparison against this report. These are **dev-only** QA shots,
not part of the shipped app.

Set state by broadcasting on the `zoll-r-series-sim` channel (or via the
facilitator view), then screenshot `/learner`:

- [ ] **Default monitor mode** — `mode: 'Monitor'`, `rhythm: 'Normal Sinus'`,
      `running: false`, HR 72 / SpO₂ 98 / NIBP 120/80 / EtCO₂ 38.
- [ ] **DEFIB charged mode** — `mode: 'Defib'`, `rhythm: 'Ventricular Fibrillation'`,
      `charged: true`, `energy: 200` → expect SHOCK glow, "DEFIB READY", dial at DEFIB.
- [ ] **PACER mode** — `mode: 'Pacer'`, `pacerOutput: 62`, `pacerRate: 72` →
      expect "PACE", mA/PPM values, dial at PACER, teal rings.
- [ ] **Education mode on** — overlay labels/callouts enabled (behavior backlog).
- [ ] **Validation mode on** — learner-action checks / scoring enabled (behavior backlog).

> Education mode and Validation mode are **planned simulator behaviors** (see
> backlog below); their screenshots become valid once those features land.
