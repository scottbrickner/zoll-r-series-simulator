# ART DIRECTION

**Project:** ZOLL R Series Simulator
**Status:** Binding rules **and** the approved visual language — not suggestions
**Last reviewed:** 2026-07-02

This is the single authority for the device's **appearance**. It records both the
*rules* that govern every visual change and the *approved look* those rules
protect. When a rule here conflicts with a request to change the look, the rule
wins until this document is deliberately amended. SVG structure and the asset
inventory live in [`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md); frozen
measurements in `../visual-alignment-report.md`.

---

## The five rules

### 1. Never redesign

The device's form, layout, and control arrangement are a **reconstruction of a
real instrument**, not a canvas. Do not reimagine the housing, rearrange
controls, invent new controls, change the silhouette, or "improve" the layout.
The body geometry is **locked** (master `viewBox 0 0 1440 1120`, 22 named
layers). React animates state; it never redraws artwork.

### 2. Never modernize

Do not restyle the device toward contemporary UI fashion — no flat-design
flattening, no material-design shadows, no neumorphism, no gradients-for-taste,
no rounded-everything, no trendy color palettes, no "cleaner" reinterpretation.
The R Series looks the way it looks. Fidelity to the real device outranks any
aesthetic trend.

### 3. Follow manufacturer photos

The **manufacturer reference material is the source of truth** — the dimensioned
product drawing and product photography, measured in
`../visual-alignment-report.md`. Every proportion, control position, color, and
legend is judged against that reference, not against preference or memory. When in
doubt, measure against the reference; do not guess.

### 4. No generic medical-monitor appearance

This is **not** "a medical monitor." It is *the ZOLL R Series*. Reject anything
that would make it read as a generic patient monitor or defibrillator: stock UI
chrome, placeholder iconography, invented button styles, a generic bezel, or a
made-up LCD layout. Specificity to the real device is the point — genericness is a
failure.

### 5. Industrial reconstruction only

All appearance work is **industrial reconstruction** — rebuilding a physical
product accurately in vector form — under the approved visual language below. Not
illustration, not a game asset, not a glossy 3D render, not a UI mockup.

---

## Approved visual language

The device is rendered as a **factory-new industrial instrument photographed in a
neutral studio**. Every decision below serves that single intent.

- **Factory-new appearance.** Brand new, out of the box: clean surfaces, crisp
  printed legends, no scratches, scuffs, wear, dust, fingerprints, aging, sticker
  residue, field labels, or asset tags. Pristine reference state.
- **Neutral CAD lighting.** Even, neutral, diffuse illumination as in a
  CAD/product-shot environment. No dramatic key lights, colored gels, rim lights,
  or mood lighting.
- **Satin molded plastic.** Surfaces are satin/matte molded plastic (the real
  R Series housing finish) — not high-gloss, metallic, or glassy (except the LCD
  cover). Material is conveyed with a **single restrained highlight gradient**,
  not a texture/normal map.
- **Minimal shadows.** Shadows are minimal and soft, used only to seat the device
  and separate layers (`21_Shadows`). No long cast shadows, heavy contact
  shadows, or baked ambient occlusion. Depth comes from bevels and layering.
- **Perfect orthographic front view.** Straight-on, orthographic, with no
  perspective, foreshortening, tilt, or vanishing point — an engineering
  elevation, which is what makes control positions measurable and trainable.
- **Body geometry locked.** The silhouette, panel layout, control positions, LCD
  opening, knobs, buttons, and cradle are locked and measured against the
  manufacturer reference. No coordinate, path, `viewBox`, or proportion changes
  outside a deliberate, documented alignment pass.

## Approved palette

Aligned to the manufacturer reference legend and the Industrial Design Fidelity
Guide v1.0. Colors and animation are the **only** visual properties React may vary
at runtime; geometry is fixed.

| Element | Color |
|---------|-------|
| ZOLL Blue bumper | `#0066B3` (≈ Pantone 3005 C); molded via gradient `#2a86c8 → #0066b3 → #004a82` |
| Faceplate | `#E5E6E2` (≈ RAL 7035); gradient `#f0f1ee → #e5e6e2 → #d6d8d3` |
| Warm-gray buttons | `#F2F2EF`; gradient `#fafaf8 → #d1d2ce` |
| Knobs | `#2B2B2B` / `#424242` (radial to `#161616` / `#0d0d0d`) |
| ENERGY SELECT beige | `#f3ecdb → #ddd0b3` (≈ RAL 1015) |
| ANALYZE / CHARGE | peach `#fbeede → #f3dcc4` |
| SHOCK button | orange radial `#f6a05a → #ef7d22 → #cf6510` |
| PACER accents / rings / 4:1 | teal `#0f9c97` / `#16b3ad` |
| Status LEDs | green (`#2fd24a`) / yellow |
| Code-readiness (self-test) window | dark `#0a0a0a` with red X `#ff3830` / green check `#00ff66` |
| LCD phosphor | green `#00FF66`, amber `#FFD100`, cyan `#00FFFF`, magenta `#FF00FF`, red `#FF3830` |

## Master-SVG philosophy

- There is **one master SVG** and it is the single source of truth for the
  device's appearance. Everything visual derives from it.
- The master is authored so React can **animate state on top of fixed geometry** —
  LEDs, self-test window, button glow, knob rotation, softkey labels, and
  waveforms are attribute/prop changes on named layers, never regenerated shapes.
- The LCD content is a **separate overlay**; the opening in the artwork is left
  empty and the live display is composited into it. Nothing dynamic is baked into
  the master.
- Any modular parts (see [`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md)) must
  reassemble to the **exact same geometry** as the master.

## Intentionally simplified (accepted — not defects)

Recorded so these are not mistaken for defects to "fix" (full list in
`../visual-alignment-report.md`):

- The molded top "hump" contour is a stylized approximation of the stepped
  elevation, not a pixel trace.
- The trapezoidal taper (top ~348 mm vs bottom ~310 mm) is rendered subtly.
- Molded-plastic texture is one highlight gradient, not a true texture map.
- Cradle feet and mode-knob tab shapes are simplified profiles.
- Screws, seams, and bevels are reconstructions — the supplied reference was a
  flat raster with no liftable vector paths.

These are below the threshold that warrants geometry churn and are addressed only
in a deliberate, documented future alignment pass — never casually.

---

## Industrial design passes

Appearance is rebuilt into an approved modular library one **Industrial Design
Pass** at a time. A pass adds modular parts that reassemble to the identical
locked geometry; **it never changes the look.**

- **Pass 1 — Body: complete. Body assets are LOCKED and APPROVED.** The
  housing/chassis parts in `src/assets/rseries/body/` are frozen. They may not be
  restyled or re-opened outside a deliberate, documented alignment pass.
- **Pass 2 — Controls Library: the next milestone.** Reconstruct buttons, knobs,
  energy select, mode selector, pacer knobs, LEDs, self-test, and NIBP as approved
  reusable parts. Same rule: match the locked geometry exactly.

See [`ROADMAP.md`](ROADMAP.md).

---

## How these rules are enforced

- **Geometry is locked.** Coordinates, paths, `viewBox`, and proportions do not
  change outside a deliberate, documented alignment pass.
- **One master SVG.** The device has a single source-of-truth master. Any modular
  parts must reassemble to the *identical* geometry.
- **React is state-only.** Runtime may change **fill/color, glow/opacity,
  `transform` on knob/dot layers, LED state, self-test state, softkey text, and
  waveform `d` data — nothing else.** React must never regenerate a shape, and the
  printed mode-selector arcs (`12`) never rotate.
- **Reference-anchored review.** A visual change is acceptable only if it moves the
  reconstruction *closer* to the manufacturer reference, and it is recorded in the
  alignment report.

## If a visual change is genuinely needed

1. Confirm the change increases fidelity to the manufacturer reference (not taste,
   not modernization).
2. Treat it as a **deliberate alignment pass**: measure against the reference,
   make the smallest change, and record before/after in
   `../visual-alignment-report.md`.
3. Keep the master SVG as the single source of truth; update it, do not fork the
   look in React.
4. If the change is a redesign, modernization, or genericization — **stop.** It
   violates rules 1, 2, and 4. Escalate to the project owner instead of
   implementing it.
