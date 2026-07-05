# COMPONENT LIBRARY & SVG STANDARDS

**Project:** ZOLL R Series Simulator
**Scope:** every SVG asset and rendering component, the SVG structural rules, and
the modular part taxonomy — with filenames
**Last reviewed:** 2026-07-02

This is the inventory of the device's visual building blocks **and** the rules for
how they are structured in SVG. The look and the art-direction rules are in
[`ART_DIRECTION.md`](ART_DIRECTION.md); milestone/pass status in
[`ROADMAP.md`](ROADMAP.md).

> **Status at a glance (end of 2026-07-02).**
> - The **shipping** device is the single **locked master** (`RSeriesDevice.jsx`).
> - **APPROVED / FROZEN** control families (reusable parts, not yet wired into the
>   master except the Mode Selector):
>   1. ✅ **Body** (Pass 1)
>   2. ✅ **Mode Selector** (Pass 2A)
>   3. ✅ **Function Button** (Pass 2B)
>   4. ✅ **Energy Select** (Pass 2C)
>   5. ✅ **Therapy Button family** (Pass 2D.1)
> - **Next milestone: Industrial Design Pass 2E — Pacer Knobs** (`15_PacerKnobs`).
> - Remaining controls (softkeys, LEDs, self-test, NIBP) and `lcd/`, `icons/`,
>   `labels/` groups are pending later passes.

---

## 1. Core principle: geometry is static, React animates state

There is a hard line:

- **Artwork = geometry.** Shapes, coordinates, paths, `viewBox`, proportions,
  bevels, and printed legends. **Static. Locked.**
- **React = state.** Fill/color, glow, opacity, `transform` (knob rotation), LED
  on/off, self-test state, softkey text, and waveform `d` data — applied as
  attributes/props on **named layers**, never as new geometry.

> React must **never** redraw the artwork. No geometry, coordinate, `viewBox`, or
> path changes at runtime.

Master coordinate space is **`viewBox 0 0 1440 1120`**. Every part authored for the
device lives in this space so it drops into the assembled device at its final
position without re-fitting (or documents a local box with an intended
`translate()`).

---

## 2. Rendering components (React)

| Component | File | Role |
|-----------|------|------|
| Master device | `src/components/rseries/RSeriesDevice.jsx` | **Locked master SVG** authored in JSX; 22 named layers; `viewBox 0 0 1440 1120`. Ships today. |
| LCD screen | `src/components/rseries/LcdScreen.jsx` | Live LCD overlay in a 673×515 logical space. |
| Panel wrapper | `src/components/rseries/RSeriesPanel.jsx` | Sizes/frames the device + LCD. |
| Waveform library | `src/components/rseries/waveforms.js` | Trace path data + classifiers. |
| Device styling | `src/components/rseries/rseries.css` | Colors/animation only (no geometry). |
| Safety label | `src/components/SafetyLabel.jsx` | Non-removable "Training simulation only" label. |
| Error boundary | `src/components/ErrorBoundary.jsx` | Recovery screen on render failure. |

---

## 3. The master SVG — 22 named locked layers

The shipping device is a single master SVG authored in JSX so React can bind state
to individual layers while geometry stays fixed. A frozen static export is
committed at `public/RSeries_Master.svg` for reference/regression. Layers (locked,
ordered):

| Layer | Layer |
|-------|-------|
| `01_Bumper` | `12_ModeSelector_Arcs` *(never rotate)* |
| `02_Faceplate` | `13_ModeSelector_Knob` |
| `03_ScreenBezel` | `14_ModeSelector_Dots` |
| `04_LCD_Window` | `15_PacerKnobs` |
| `05_LCD_Glass` | `16_LEDIndicators` |
| `06_LCD_Background` *(empty)* | `17_SelfTestWindow` |
| `07_Softkeys` | `18_BP_Button` |
| `08_FunctionButtons` | `19_Handle` |
| `09_TherapyButtons` | `20_Labels` |
| `10_EnergySelect` | `21_Shadows` |
| `11_ModeSelector_Back` | `22_Highlights` |

Layers React may animate (attributes only): `16_LEDIndicators`,
`17_SelfTestWindow`, buttons (`07`/`08`/`09` fill/glow), `13`/`14_ModeSelector`
knob/dot `transform` (the printed arcs `12` **never** rotate), plus the separate
LCD content and waveforms.

---

## 4. Body (housing / chassis) — Pass 1, LOCKED / APPROVED

Master layers `01–06`, `19`, `21–22`. Modular parts in
`src/assets/rseries/body/` — **built, approved, and locked.** Reviewed in the
exploded `/art-preview` view ("Pass 1.5" CAD review). Not yet assembled into the
shipping device (the master monolith still renders); they are the frozen reference
for the body.

| Part | File (asset) | Master layer |
|------|--------------|--------------|
| Blue bumper | `body/bumper.svg` | `01_Bumper` |
| Faceplate | `body/faceplate.svg` | `02_Faceplate` |
| Screen outer bezel | `body/screen_outer_bezel.svg` | `03_ScreenBezel` |
| Screen inner bezel | `body/screen_inner_bezel.svg` | `03_ScreenBezel` |
| LCD opening | `body/lcd_opening.svg` | `04_LCD_Window` |
| LCD glass | `body/lcd_glass.svg` | `05_LCD_Glass` |
| Lower handle-cradle | `body/lower-cradle.svg` | (cradle) / `19_Handle` |
| Connector bump | `body/connector-bump.svg` | (housing detail) |
| Screw cover (reusable ×2) | `body/screw-cover.svg` | (housing detail) |
| Handle | *(in master)* | `19_Handle` |
| Shadows | *(in master)* | `21_Shadows` |
| Highlights | *(in master)* | `22_Highlights` |

> `06_LCD_Background` is intentionally **empty** — the live LCD is a separate
> overlay, never baked into the body.

---

## 5. Controls (interactive hardware) — Pass 2, IN PROGRESS

Master layers `07–18`, folder `src/assets/rseries/controls/`. This is **Industrial
Design Pass 2: Controls Library**. Parts are built one sub-pass at a time, each
reassembling to the identical master geometry (footprint/position locked).

| Control | Master layer | Reusable part | Status |
|---------|--------------|---------------|--------|
| Mode selector (back/arcs→sections/knob/dots) | `11`–`14` | `mode_selector_*` + `ModeSelector.jsx` | ✅ **Pass 2A — DONE / FROZEN** |
| Function buttons (LEAD / SIZE / ALARM SUSPEND / RECORDER) | `08_FunctionButtons` | `function_button.svg` (frozen) + `FunctionButton.jsx` (one part, N labels) | ✅ **Pass 2B — APPROVED / FROZEN (not yet wired into master)** |
| Energy select rocker | `10_EnergySelect` | `energy_select_button.svg` (frozen) + `EnergySelect.jsx` | ✅ **Pass 2C — APPROVED / FROZEN (not yet wired into master)** |
| Therapy buttons (ANALYZE / CHARGE / SHOCK) | `09_TherapyButtons` | `therapy_button.svg` + `shock_button.svg` (physical only) + `TherapyButton.jsx` (action + shock variants; React glow overlay) | ✅ **Pass 2D.1 — APPROVED / FROZEN (not yet wired into master)** |
| Pacer knobs (OUTPUT / RATE) | `15_PacerKnobs` | `pacer_knob.svg` + `PacerKnob.jsx` (fixed teal socket + rotating knob; React `rotationAngle`/`pressed`/`enabled`) | 🟡 **Pass 2E — built (not yet wired into master)** |
| Softkeys | `07_Softkeys` | **Physical:** `softkey_blank.svg` + `softkey_row.svg` (Pass 2G, warm-gray molded × 6). **Framework:** `SoftKey.ts` + `softkeyLayouts.ts` + `SoftKeyRow.tsx` (Package 4, React label/enabled/visible/highlighted/pressed, per-mode layouts) | 🟡 **built (not yet wired into master)** |
| 4:1 button | `15_PacerKnobs` | `four_to_one_button.svg` + `FourToOneButton.jsx` (small round teal molded button between the OUTPUT/RATE knobs; React `pressed`/`active`/`enabled`) | 🟡 **Pass 2H — built (not yet wired into master)** |
| LED indicators (AC / BATT) | `16_LEDIndicators` | state-driven fill | ⬜ pending |
| Self-test window (Code Readiness) | `17_SelfTestWindow` | `code_readiness_window.svg` (physical) + `CodeReadiness.jsx` (React `status`: blank / ready / notReady / testing + flashing) | 🟡 **Pass 2F — built (not yet wired into master)** |
| NIBP button (arm + cuff) | `18_BP_Button` | — | ⬜ pending |

**Reuse rules:** buttons and knobs are single reusable parts; instances differ
only by position, printed label, and React-bound fill/glow/rotation/state. The
Mode Selector's printed sections carry the colour (no wrapping arcs) and never
rotate — only the knob rotates.

> **Wiring note.** Built parts are the approved reference. As with the body parts,
> they are reviewed on `/controls-review` but are **not yet assembled into the
> shipping master** (`RSeriesDevice.jsx`) — except the Mode Selector, which has
> been wired in. The Function Button (Pass 2B) and Energy Select (Pass 2C) parts
> are built/approved; wiring layers 08 and 10 to use them is a later step.

> **SHOCK button — two layers (APPROVED / FROZEN, Pass 2D.1).** The SHOCK button
> consists of **two layers:**
> 1. **Physical molded button (SVG)** — `shock_button.svg` / the `TherapyButton`
>    `variant='shock'` geometry: molded orange plastic, satin finish, shallow
>    recessed centre, subtle molded outer lip, reduced gloss. **No glow is baked
>    in.** Approved.
> 2. **React-controlled glow overlay** — a separate layer that renders a soft,
>    subtly-pulsing warm-orange bloom **only** while `shockReady` / charged-ready
>    is true. It extinguishes immediately on press/disable. Approved.
>
> Approved facts (frozen): the **ANALYZE** and **CHARGE** physical molded assets
> are approved; the **SHOCK** physical molded asset is approved; the **SHOCK glow
> is approved as a separate React-controlled overlay layer** that appears only
> when `shockReady`/charged-ready is true and is **never baked into
> `shock_button.svg`**; **pressed** and **disabled** remain physical interaction
> states (no glow). Frozen — no geometry/material edits unless explicitly reopened
> in a new dated pass; the `TherapyButton.jsx` state wiring (shockReady/charging/
> pressed/disabled) may still be connected when the family is wired into the
> master.

> **Energy Select display note.** The approved Energy Select is a manufacturer-
> accurate ▲ / ENERGY / SELECT / ▼ rocker with **no numeric value on the button
> face**. The **selected energy (joules) is shown on the LCD, not on the physical
> ENERGY SELECT button** — the button only increments/decrements the value. When
> this part is wired in, the value belongs in the LCD overlay
> ([`LcdScreen.jsx`](../src/components/rseries/LcdScreen.jsx)), not on the button.
> `EnergySelect.jsx` keeps `energyValue`/`energyUnits` props for API compatibility
> but does not render them on the face.

---

## 6. Modular part taxonomy & conventions

Asset taxonomy under `src/assets/rseries/` (each part is one file where possible):

| Group | Contents | Pass status |
|-------|----------|-------------|
| `body/` | Housing/chassis: bumper, faceplate, bezels, LCD frame/glass, cradle, connector bump, screw cover. | ✅ Pass 1 — LOCKED / APPROVED |
| `controls/` | Buttons (softkeys, function, therapy), energy select, mode selector (back/arcs/knob/dot), pacer knobs, LEDs, self-test window, NIBP button. | ⬜ Pass 2 — NEXT (scaffold) |
| `lcd/` | LCD window/glass frame + the **empty** display background. | ⬜ scaffold |
| `icons/` | Small glyphs (NIBP arm+cuff, heart/CPR, bolt, connector marks). | ⬜ scaffold |
| `labels/` | Printed text/wordmarks/legends (ZOLL logo, control legends, arc labels). | ⬜ scaffold |
| `reference/` | Approved source references only — **not shipped as parts.** | reference |

**Per-part conventions**

- Author in the master `0 0 1440 1120` space (or a documented local box with an
  intended `translate()`).
- A part is a raw `.svg` (`<g>`/`<symbol>`) or a small `.jsx` partial returning
  `<g>…</g>`. Prefer **one part per file**.
- Name to match the locked master layer where applicable
  (e.g. `body/01_Bumper.svg`, `controls/13_ModeSelector_Knob.jsx`).
- **No state and no interactivity inside a part.** React adds `onClick`,
  `transform`, `fill`, and text at assembly time.
- Any modular reassembly must reproduce the master geometry **exactly**.

---

## 7. LCD framework

| Item | File | Notes |
|------|------|-------|
| LCD overlay component | `src/components/rseries/LcdScreen.jsx` | 673×515 logical space; renders values, waveforms, softkey labels, banners, status. |
| LCD frame/glass (body) | `body/lcd_opening.svg`, `body/lcd_glass.svg` | Static opening + glass (Pass 1). |
| LCD background | master `06_LCD_Background` | **Empty** by design. |
| Assets folder | `src/assets/rseries/lcd/` | Frame/glass parts (scaffold). |

The live display is a separate overlay authored in a fixed 673×515 space and
scaled/placed into the physical LCD rect (`204, 200, 697×526` in master space). It
renders **on top of** the empty opening and owns nothing structural about the
housing. Waveform path data comes from `waveforms.js` as `d` attributes — geometry
for the *trace*, never for the device.

Phosphor palette: green `#00FF66`, amber `#FFD100`, cyan `#00FFFF`,
magenta `#FF00FF`, red `#FF3830`.

---

## 8. Typography

| Item | Where | Notes |
|------|-------|-------|
| LCD numerics / values | `LcdScreen.jsx` | HR, SpO₂, NIBP, EtCO₂, RR, elapsed. |
| Softkey labels | `LcdScreen.jsx` | State-driven text along the softkey rule. |
| Banners / status text | `LcdScreen.jsx` | "DEFIB READY", "SYNC", "CHECK PADS", etc. |
| Printed control legends | master `20_Labels` | Faceplate legends. |
| Wordmarks / arc labels | target `src/assets/rseries/labels/` | To be separated into the `labels/` group (roadmap). |

Formalizing a typographic scale/token set and separating printed wordmarks into
`labels/` is a **partial** roadmap item — see [`ROADMAP.md`](ROADMAP.md) §18.

---

## 9. Icons

| Item | File | Notes |
|------|------|-------|
| Device glyphs (planned) | `src/assets/rseries/icons/` | NIBP arm+cuff, heart/CPR, bolt, connector marks (scaffold — `.gitkeep`). |
| NIBP arm+cuff glyph | master `18_BP_Button` | Currently drawn in the master button layer. |
| `public/icons.svg` | `public/icons.svg` | **Vite template leftover** (social icons) — not R Series device art. |
| `public/favicon.svg` | `public/favicon.svg` | Browser tab icon. |

---

## 10. Effects (runtime-only)

Applied by React over fixed geometry (never new shapes):

| Effect | Driven by | Rendered on |
|--------|-----------|-------------|
| Shock flash / post-shock artifact | `lastEvent`, `Post-Shock Artifact` waveform | Learner stage + LCD ECG |
| CPR compression artifact | `cprArtifactPath()` | LCD ECG |
| Button glow / press | button fill state | `07/08/09` layers |
| Knob rotation | `transform` on `13`/`14` and pacer-knob layers | Mode selector / pacer |
| LED on/off | alarm/status state | `16_LEDIndicators` |
| Self-test state | `selfTest` (`blank`/`x`/`check`) | `17_SelfTestWindow` |
| Shadows / highlights | static | `21_Shadows`, `22_Highlights` |

---

## 11. Reference assets (not shipped as parts)

| Item | File |
|------|------|
| Frozen master export | `public/RSeries_Master.svg` |
| Reference folder | `src/assets/rseries/reference/` |
| Alignment measurements | `../visual-alignment-report.md` |
| Reference screenshot | `../../RSeries_Master-screenshot.png` (on the machine, outside the repo) |

---

## 12. "React only animates state" — pre-change checklist

Before any SVG-touching change, confirm it does **not**:

- add, move, or reshape device geometry;
- change a coordinate, path, `viewBox`, or proportion of the housing/controls;
- bake dynamic content (values/waveforms) into a static part;
- rotate the printed mode-selector arcs (`12`);
- fork the device's look into React instead of the master SVG.

If it does any of those, it violates these standards and
[`ART_DIRECTION.md`](ART_DIRECTION.md).

---

## Filename quick index

```
src/components/rseries/RSeriesDevice.jsx     # locked master SVG (22 layers) — ships
src/components/rseries/LcdScreen.jsx         # live LCD overlay (673×515)
src/components/rseries/RSeriesPanel.jsx      # device + LCD wrapper
src/components/rseries/waveforms.js          # trace paths + classifiers
src/components/rseries/rseries.css           # colors/animation only
src/components/SafetyLabel.jsx               # training-only label
src/components/ErrorBoundary.jsx             # recovery screen
public/RSeries_Master.svg                    # frozen master export
src/assets/rseries/body/*.svg                # Pass 1 — LOCKED/APPROVED: bumper,
                                             #   faceplate, bezels, glass, cradle,
                                             #   connector-bump, screw-cover
src/components/rseries/controls/ModeSelector.jsx    # Pass 2A — mode selector (frozen)
src/components/rseries/controls/FunctionButton.jsx  # Pass 2B — reusable molded button
src/components/rseries/controls/EnergySelect.jsx    # Pass 2C — reusable energy select
src/assets/rseries/controls/mode_selector_*.svg     # Pass 2A parts (background/labels/knob/dots)
src/assets/rseries/controls/function_button.svg     # Pass 2B — reusable blank button (frozen)
src/assets/rseries/controls/energy_select_button.svg # Pass 2C — reusable blank shell
src/components/rseries/controls/TherapyButton.jsx   # Pass 2D — therapy button family
src/assets/rseries/controls/therapy_button.svg      # Pass 2D — peach action button
src/assets/rseries/controls/shock_button.svg        # Pass 2D — flat orange shock button
src/components/rseries/controls/PacerKnob.jsx       # Pass 2E — pacer knob (socket + rotating knob)
src/assets/rseries/controls/pacer_knob.svg          # Pass 2E — reusable pacer knob asset
src/components/rseries/controls/CodeReadiness.jsx   # Pass 2F — code readiness window (React status)
src/assets/rseries/controls/code_readiness_window.svg # Pass 2F — physical window asset
src/components/rseries/controls/FourToOneButton.jsx # Pass 2H — round teal 4:1 button (React pressed/active/enabled)
src/assets/rseries/controls/four_to_one_button.svg  # Pass 2H — physical 4:1 button asset
src/assets/rseries/controls/softkey_blank.svg       # Pass 2G — single molded softkey
src/assets/rseries/controls/softkey_row.svg         # Pass 2G — six-key molded row
src/components/rseries/controls/SoftKey.ts          # Package 4 — softkey model (TS)
src/components/rseries/controls/softkeyLayouts.ts   # Package 4 — per-mode layouts (TS)
src/components/rseries/controls/SoftKeyRow.tsx      # Package 4 — programmable 6-key row (TSX)
src/assets/rseries/{lcd,icons,labels,reference}/   # scaffold (.gitkeep)
```
