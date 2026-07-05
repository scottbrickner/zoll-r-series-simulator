# CHANGELOG

All notable changes to the ZOLL R Series Simulator are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); the
project uses date-stamped milestone entries pending a tagged 1.0.

> **Training simulation only. Not for clinical use.**

---

## [Unreleased]

Working toward the **Release Candidate** milestone ([`ROADMAP.md`](ROADMAP.md)
#20). No changes may alter the locked device geometry.

### Milestone reached
- **Industrial Design — physical front-panel asset library COMPLETE.** All thirteen
  front-panel families are built and **APPROVED / FROZEN** (see `[0.1.25]`). No
  further physical-appearance passes are planned; artwork is frozen.

### Next phases (post-physical-asset library)
1. **Typography Library** — 🟡 **started** (`[0.1.26]`): tokens + `RSeriesLabel` /
   `RSeriesLCDText` primitives built. Remaining: separate printed wordmarks/legends
   into a `labels/` asset group and adopt the tokens in `LcdScreen.jsx` / master.
2. **Display Operating Framework** — the LCD operating model that drives what the
   screen shows per mode/state.
3. **Display Widgets** — the on-screen LCD widgets (values, waveforms, banners,
   softkey labels) as reusable parts.
4. **Master Assembly** — assemble the approved modular parts into the shipping
   device, replacing the monolithic master part-by-part (identical geometry).
5. **React Wiring** — bind live state to the assembled parts (button/knob/LED/
   indicator/self-test state, softkey layouts, waveforms).
6. **Clinical behavior refinement** — expand the waveform library and deepen
   scenario/behaviour fidelity.

---

## [0.1.30] — 2026-07-05 — Package 4: firmware reconstruction refined to reference screens

Refined the firmware framework and the Manufacturer reference panel against the
manufacturer LCD reference screens supplied by the user (MONITOR / PACE / CPR modes).
Layout only — no patient data pipeline, no simulator logic; locked assets unchanged.

### Changed
- `DisplayRegions.js` — the **Value / Readout Row is now full-width** (x 0…673) so it
  includes the firmware **clock at the far left** (e.g. 13:38 / 17:16), matching the
  reference; the Left Parameter Column ends at y=442 above it. Note updated: SpO₂ at
  the top of the column, then NIBP, then CO₂/RR.
- `FirmwareReference.jsx` — retraced to match the reference arrangement: SpO₂ (cyan)
  at the top-left of the status row; a tight status band (IDLE + magenta timer · CPR
  Release bar + PPI diamond · ECG lead + ♥ + large green HR on the far right); NIBP
  and CO₂/RR down the narrow left column; one continuous ECG + CO₂ plotting area; the
  centered mode word (MONITOR); a full-width readout row with the clock at far left;
  and the firmware softkey strip (Options · Param · Code Marker · Report Data · Alarms
  · Sync On/Off). Readings are a static illustration.
- Recorded in `visual-alignment-report.md §11.3`. (No manufacturer screenshot is
  embedded in the repo; drop a capture at `public/lcd_reference.png` to trace it in
  the Manufacturer panel.)

## [0.1.29] — 2026-07-05 — Package 4 REBUILT: firmware LCD framework

Rebuilt the Display Operating Framework as a **traced reconstruction of the firmware
LCD layout** — discarding the earlier dashboard-style assumptions (boxed waveform
lanes, button-like softkeys, a full-width top status bar). Rectangles are lifted from
the firmware-accurate `LcdScreen.jsx` coordinates (which match the PACE-mode
reference in `visual-alignment-report.md §1`). **Layout only** — no patient data, no
waveforms, no values, no simulator logic; the locked 673×515 space and `LcdScreen.jsx`
are unchanged.

### Changed (firmware layout)
- `DisplayRegions.js` — retraced to the firmware regions: a **narrow Left Parameter
  Column** (SpO₂ / NIBP / CO₂·RR), a **tightly packed Top Status Strip** (Timer/Mode ·
  CPR Release/PPI · ECG/Lead/HR), **ONE continuous Waveform Plotting Area** (no boxed
  lanes), a Value/Readout Row, and a firmware **Softkey Label Strip** (thin column
  rules + centered labels, no buttons). Transient overlays (Alarm Banner, Therapy/Mode
  Message) draw **over the waveform area**.
- `DisplayLayoutTokens.js` — firmware anchors (top rule y=118, softkey pitch 112),
  phosphor palette, and per-region `debugColors` retargeted to the firmware regions.
- `DisplayFramework.jsx` — firmware skeleton: hairline rules, continuous waveform
  region, firmware softkey strip (no button chrome). Added `showBackground` (so the
  framework can overlay the firmware reference) alongside `mode` (`clean`/`debug`).

### Added
- `display/FirmwareReference.jsx` — a firmware-layout **reconstruction** (the
  "Manufacturer" panel) from the documented reference (no manufacturer screenshot
  ships in the repo). Continuous representative ECG/CO₂ strokes, idle-dash values,
  firmware softkey labels. Honors a real capture at `public/lcd_reference.png` if
  present.
- `DisplayFrameworkReview.jsx` — rebuilt as the requested **Manufacturer → Overlay →
  Framework** stacked comparison (region boundaries traced onto the firmware render),
  plus the region legend and layer hierarchy.
- Recorded in `COMPONENT_LIBRARY.md §7.1`; `visual-alignment-report.md §11.2`.

## [0.1.28] — 2026-07-05 — Package 4: Display Framework — reviewable preview

Made the LCD operating framework clearly reviewable. **Review/debug visualization
only** — no production display geometry changed (the region rectangles are
unchanged), no patient data, no waveforms, no values, no simulator logic.

### Changed
- `src/views/DisplayFrameworkReview.jsx` — rebuilt so `/display-framework-review`
  **immediately shows a large, centered LCD preview at the top** (above the fold),
  with a **mode switcher**: (1) Clean framework, (2) Debug overlay, (3) Manufacturer
  approximation. Added a **colour-coded region legend** (name · rectangle · inject
  targets) and kept the layer hierarchy. Default mode is the debug overlay.
- `src/components/rseries/display/DisplayFramework.jsx` — added a `mode` prop
  (`clean` | `debug` | `manufacturer`) and `showCoords`:
  - **debug** — a distinct high-contrast colour per region, semi-transparent fills,
    bold outlines, region names + coordinates (`x,y·w×h`), and a bright LCD boundary.
  - **manufacturer** — an abstract sketch of the real LCD arrangement (tinted
    parameter zones, flat dashed lane baselines, softkey cells). No data, no
    waveforms, no values.
  Existing props (`showBoundaries`/`showNames`/`showHints`/`showStructure`/`slots`/
  `idPrefix`) and the clean-mode look are unchanged (backward compatible).
- `src/components/rseries/display/DisplayLayoutTokens.js` — added `debugColors` (a
  distinct hue per region, review-only) and `lcdBoundaryColor`.
- Recorded in `visual-alignment-report.md` §11.1.

## [0.1.27] — 2026-07-05 — Package 4: Display Operating Framework

Built the reusable **LCD operating framework** — the permanent layout skeleton (13
fixed regions) into which all future display widgets render. **Layout only:** no
patient data, no waveforms, no values, and no simulator logic. No locked asset
changed; the existing `LcdScreen.jsx` overlay is untouched. Authored in the same
locked 673×515 LCD logical space, matched to the manufacturer LCD proportions.

### Added
- `src/components/rseries/display/DisplayLayoutTokens.js` — LCD canvas, structural
  anchors (parameter divider x=186, softkey rule y=468, six columns), band heights,
  z-`LAYERS`, and placeholder styling.
- `src/components/rseries/display/DisplayRegions.js` — the **13 fixed regions** as
  `{ id, name, layer, parent, rect, injects }` in 673×515 space (single source of
  truth), plus lookup helpers.
- `src/components/rseries/display/DisplayFramework.jsx` — renders the empty labeled
  skeleton (background + dividers + region placeholders) and exposes each region as
  an injection **slot** (`slots={{ [id]: node }}`, clipped to bounds). Props:
  `showBoundaries` / `showNames` / `showHints` / `showStructure` / `slots` /
  `idPrefix`.
- `src/views/DisplayFrameworkReview.jsx` + route `/display-framework-review` — the
  empty framework with toggles for boundaries / names / inject hints / structure,
  the layer hierarchy, and a region → injection-target table.

### Regions
- Persistent (`region` layer): Status Bar (→ Clock, Patient Mode), Top Information
  Banner, Left Parameter Stack, Waveform Region 1/2/3, Therapy Banner, Bottom Status
  Area, Bottom Softkey Label Strip.
- Transient (`overlay` layer, drawn on top): Alarm Banner, Center Message Area.
- Injection targets exposed for later phases: Waveforms, Vitals, Therapy Messages,
  Charging Status, Pacing, CPR Feedback, Softkey Labels, Alarm Messages, Status
  Icons.
- Recorded in `COMPONENT_LIBRARY.md` §7.1; `visual-alignment-report.md` §11.

## [0.1.26] — 2026-07-05 — Package 3: Typography Library

Built the reusable **typography system** for the device — shared tokens plus two SVG
label primitives. First of the post-physical-asset phases. **Typography only:** not
the LCD framework, not simulator behaviour, and no locked physical asset changed.
System-safe fonts only — no external font files.

### Added
- `src/components/rseries/typography/typographyTokens.js` — the single source of
  truth for type: `fontFamily` (printed sans matching the housing / lcd monospace),
  `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`, `color` (printed legend +
  LCD phosphor), plus semantic `printedPresets` / `lcdPresets` and a
  `resolveTextStyle()` helper (accepts token keys or raw overrides).
- `src/components/rseries/typography/RSeriesLabel.jsx` — reusable **printed hardware
  legend** primitive (SVG `<text>`): compact, bold, device-like sans. Presets:
  `control`, `controlSmall`, `therapy`, `shock`, `mode{Monitor,Defib,Pacer,Off}`,
  `indicator`; multi-line via `lines` (e.g. ALARM / SUSPEND).
- `src/components/rseries/typography/RSeriesLCDText.jsx` — reusable **LCD-style
  screen text** primitive (SVG `<text>`): monospaced phosphor, distinct from the
  printed legends. Presets: `softkey`, `status`, `message`, `ready`, `select`,
  `alert`, `prompt`.
- `src/views/TypographyReview.jsx` + route `/typography-review` — token legend and
  live examples: printed control/mode legends, therapy (ANALYZE/CHARGE/SHOCK), pacer
  (OUTPUT mA / RATE ppm / 4:1), indicator (AC/BATT), the white softkey label strip,
  and LCD status/message labels (MONITOR/PACE/DEFIB/SYNC, DEFIB READY, XXXJ SEL.,
  CHECK CPR PUCK, SET PACE MA).
- Recorded in `COMPONENT_LIBRARY.md` §8; `visual-alignment-report.md` §10;
  `ROADMAP.md` (Milestones 18 / 21).

## [0.1.25] — 2026-07-05 — Industrial Design Package COMPLETE — physical front panel frozen

**The physical ZOLL R Series front-panel industrial asset library is COMPLETE.**
Every physical front-panel family has been reconstructed as an approved, reusable
modular part matching the locked master geometry, and all are **APPROVED / FROZEN.**
Documentation only — no artwork, component, or simulator-logic change.

### Approved / frozen — the complete physical front-panel library
| # | Family | Pass | Master layer(s) |
|---|--------|------|-----------------|
| 1 | **Body** (housing/chassis) | Pass 1 | `01`–`06`, `19`, `21`–`22` (geometry LOCKED) |
| 2 | **Mode Selector** | Pass 2A | `11`–`14` |
| 3 | **Function Buttons** | Pass 2B | `08` |
| 4 | **Energy Select** | Pass 2C | `10` |
| 5 | **Therapy Buttons** (ANALYZE / CHARGE / SHOCK) | Pass 2D.1 | `09` |
| 6 | **Pacer Knobs** (OUTPUT / RATE) | Pass 2E | `15` |
| 7 | **Code Readiness Window** | Pass 2F | `17` |
| 8 | **Physical Softkey Row** | Pass 2G | `07` |
| 9 | **Softkey Framework** | Package 4 | `07` |
| 10 | **4:1 Button** | Pass 2H | `15` |
| 11 | **NIBP Button** | Pass 2I | `18` |
| 12 | **AC Power Indicator** | Pass 2J | `16` |
| 13 | **Battery Indicator** | Pass 2J | `16` |

### Status
- The physical front panel is **complete**. No further physical-appearance passes
  are planned; the artwork is **frozen** (no geometry/material/colour edits unless a
  family is explicitly reopened in a new dated pass in `visual-alignment-report.md`).
- The approved parts remain the reference and — except the Mode Selector — are **not
  yet wired into the shipping master** (`RSeriesDevice.jsx` still renders); wire-in
  is a later phase.

### Future work shifts to (non-physical-artwork)
1. **Typography Library** — typographic tokens + `labels/` wordmark group.
2. **Display Operating Framework** — LCD operating model per mode/state.
3. **Display Widgets** — on-screen LCD widgets as reusable parts.
4. **Master Assembly** — assemble approved parts into the shipping device.
5. **React Wiring** — bind live state to the assembled parts.
6. **Clinical behavior refinement** — waveform/scenario fidelity.

### Recorded in
- `ROADMAP.md` (Milestone 16 marked complete; future phases listed),
  `COMPONENT_LIBRARY.md` §5 / status-at-a-glance, `visual-alignment-report.md` §8.18.

## [0.1.24] — 2026-07-05 — Industrial Design Pass 2J: Indicator Lights — APPROVED / FROZEN

The **Indicator Light** component is **APPROVED and FROZEN.** Documentation only —
no artwork, component, or simulator-logic change. The approved part remains the
reference and is not yet wired into the shipping master.

### Approved / frozen (the reference)
- **Physical lens asset is approved** (`indicator_light.svg`) — small round
  front-panel lens: thin gray molded rim, recessed seat, translucent unlit lens.
- **Illumination is React-controlled** (composited by `IndicatorLight.jsx`).
- **No glow is baked into `indicator_light.svg`** — the asset is the unlit lens only.
- **AC indicator** supports **off / on** (on = green).
- **Battery indicator** supports **off**, **charging (yellow)**, **charged
  (green)**, **alternating yellow/green fault**, and **disabled / muted**.
- **Styling matches small physical front-panel lenses, not app LEDs.**
- Frozen record: `visual-alignment-report.md` §8.17 / §8.17.1;
  `COMPONENT_LIBRARY.md` §5. Freeze rule: no geometry/material/colour edits unless
  explicitly reopened in a new dated pass.

## [0.1.23] — 2026-07-05 — Industrial Design Pass 2J: AC Power & Battery Indicator Lights

Built the reusable **indicator lights** — the small round AC-power / Battery lens
indicators that sit just left of the Code Readiness window. Not wired into the
shipping master; no body, LCD, Mode Selector, Function Button, Energy Select,
Therapy Button, Pacer Knob, Code Readiness, softkey, 4:1, NIBP, LCD-asset, or
simulator-logic change.

### Added
- `src/components/rseries/controls/IndicatorLight.jsx` — one reusable round lens
  indicator for both AC and Battery. The **physical lens is fixed geometry** (thin
  gray molded rim, recessed seat, translucent unlit lens, one restrained satin
  reflection) and carries **no baked illumination** — React composites a lit-lens
  overlay on top (the lens lights up, never a bloom/halo). Props: `type`
  (`ac`/`battery`), `status` (`off`/`green`/`yellow`/`charging`/`fault`),
  `flashing`, `enabled`, `cx/cy/r`, `idPrefix`. Geometry never changes.
- `src/assets/rseries/controls/indicator_light.svg` — blank **unlit** physical lens
  asset. Footprint matches the locked master layer 16 (`16_LEDIndicators`, cy 100,
  r 13; AC cx 952 / BATT cx 996).
- Manual-accurate behaviour: AC lights **green** on AC power; Battery shows **steady
  yellow = charging**, **steady green = charged**, **alternating yellow/green = no
  battery or charging fault** (opposed discrete SMIL opacity animations).
- `/controls-review` gains an Indicator Lights section: blank lens; AC off / on;
  Battery off / charging (yellow) / charged (green) / fault (alternating); disabled.
- Recorded in `visual-alignment-report.md` §8.17; `COMPONENT_LIBRARY.md` §5.

## [0.1.22] — 2026-07-05 — Industrial Design Pass 2I: NIBP Button — APPROVED / FROZEN

The refined **NIBP Button** is **APPROVED and FROZEN.** Documentation only — no
artwork, component, or simulator-logic change. The approved part remains the
reference and is not yet wired into the shipping master.

### Approved / frozen (the reference)
- **Pale / white molded circular face** — not a saturated blue fill.
- **Thin gray rim / bezel** around the face.
- **Blue arm + BP-cuff pictogram** — reads as an arm wearing a blood-pressure cuff,
  **not** a generic person / people icon.
- **Not a generic blue app-style button** — low visual weight, factory-new satin
  molded plastic.
- **React states supported:** `default`, `pressed`, `active`, `measuring`,
  `disabled` (all kept subtle; colour/opacity only, geometry never changes).
- Frozen record: `visual-alignment-report.md` §8.16 / §8.16.1 / §8.16.2;
  `COMPONENT_LIBRARY.md` §5. Freeze rule: no geometry/material/colour edits unless
  explicitly reopened in a new dated pass.

## [0.1.21] — 2026-07-05 — NIBP Button: manufacturer-accuracy refinement

Corrected the **NIBP Button** to match the manufacturer front-panel icon. The first
cut read as a large saturated-blue web button with a large white icon; the real
control is a small, subtle, **pale-faced** button with a **thin gray molded rim**
and a **compact blue** arm/cuff pictogram. Footprint unchanged (master layer 18);
material/colour/scale only — no geometry change. Not wired into the shipping master;
no body, LCD, Mode Selector, Function Button, Energy Select, Therapy Button, Pacer
Knob, Code Readiness, softkey, 4:1, LCD-asset, or simulator-logic change.

### Changed
- `src/components/rseries/controls/NIBPButton.jsx` + `nibp_button.svg` — flipped
  from a saturated-blue face + large white glyph to a **pale satin molded face**
  (`#fbfbfa → #eeeeeb → #deded9`) with a **thin gray molded rim** (`#c6c8c3`) and a
  subtle molded side edge. The pictogram is now a **compact two-tone blue** arm + BP
  cuff (~0.82 scale, centered): squeeze bulb + tube, forearm + fist (`#0066b3`), and
  a darker-blue cuff band (`#004a82`) with a closure seam (`#2a86c8`) — still an arm
  wearing a cuff, **not** a person icon. Overall visual weight reduced ~40–50%.
- States kept but made **subtle**: `pressed` (seats down 1.5px + slight face darken +
  soft lower shadow), `active` (thin subtle blue rim ring, **not** a glow),
  `measuring` (same thin ring, very gently pulsing), `enabled=false` (grayer face +
  desaturated icon + 0.6 opacity). Prop API unchanged.
- `/controls-review` NIBP section retitled "Pass 2I — refined" with updated notes.
- Recorded in `visual-alignment-report.md` §8.16.1.

## [0.1.20] — 2026-07-05 — Industrial Design Pass 2I: NIBP Button

Built the reusable **NIBP Button** — the small blue button in the lower-left
control area that starts / stops a non-invasive blood-pressure (NIBP) measurement.
Not wired into the shipping master; no body, LCD, Mode Selector, Function Button,
Energy Select, Therapy Button, Pacer Knob, Code Readiness, softkey, 4:1, or
simulator-logic change.

### Added
- `src/components/rseries/controls/NIBPButton.jsx` — reusable small blue molded
  push-button. Satin molded ZOLL-blue plastic (single restrained highlight — not
  glossy), subtle bevel, darker molded side edge for depth, and a slight recessed
  seat/socket. The face carries a **white arm + blood-pressure-cuff pictogram** (a
  forearm/fist wearing an inflatable cuff with a squeeze bulb — **not** a generic
  person / people icon). Props: `cx/cy/r`, `pressed`, `active`, `measuring`,
  `enabled`, `onClick`, `idPrefix`. Geometry never changes; React controls only
  state — `pressed` (seats down + darkens + deeper lower shadow), `active`
  (restrained brighter blue ring, **not** a SHOCK-style glow), `measuring` (the
  same ring, gently pulsing while a reading is taken), `enabled=false`
  (muted/desaturated + reduced opacity).
- `src/assets/rseries/controls/nibp_button.svg` — blank reusable button asset
  (default state). Footprint locked to master layer 18 (`18_BP_Button`, cx 128,
  cy 792, r 32); belongs with the lower-left control area.
- `/controls-review` gains an NIBP Button section: blank asset; default / pressed /
  active / measuring / disabled.
- Recorded in `visual-alignment-report.md` §8.16; `COMPONENT_LIBRARY.md` §5.

## [0.1.19] — 2026-07-03 — Industrial Design Pass 2H: 4:1 Button

Built the reusable **4:1 Button** — the small round teal button between the PACER
OUTPUT (mA) and RATE (ppm) knobs. Not wired into the shipping master; no body, LCD,
Mode Selector, Function Button, Energy Select, Therapy Button, Pacer Knob, Code
Readiness, softkey, or simulator-logic change.

### Added
- `src/components/rseries/controls/FourToOneButton.jsx` — reusable small round teal
  molded push-button with a centered white `4:1` legend. Satin molded plastic
  (single restrained highlight — not glossy), subtle bevel, darker molded side edge
  for depth, and a slight recessed seat/socket. Props: `cx/cy/r`, `pressed`,
  `active`, `enabled`, `onClick`, `idPrefix`. Geometry never changes; React
  controls only state — `pressed` (seats down + darkens + deeper lower shadow),
  `active` (restrained brighter teal ring/fill, **not** a SHOCK-style glow),
  `enabled=false` (muted/desaturated + reduced opacity).
- `src/assets/rseries/controls/four_to_one_button.svg` — blank reusable button
  asset (default state). Footprint belongs with the pacer control area (master
  layer 15).
- `/controls-review` gains a 4:1 Button section: blank asset; default / pressed /
  active-latched / disabled; and the button seated in context between the two
  pacer knobs (OUTPUT / RATE).
- Recorded in `visual-alignment-report.md` §8.15; `COMPONENT_LIBRARY.md` §5.

## [0.1.15] — 2026-07-02 — Industrial Design Pass 2E: Pacer Knobs

Built the reusable Pacer Knob system. Not wired into the shipping master; no body,
LCD, Mode Selector, Function Button, Energy Select, Therapy Button, or
simulator-logic change.

### Added
- `src/components/rseries/controls/PacerKnob.jsx` — reusable rotary knob for
  OUTPUT (mA) / RATE (ppm). Two layers: a fixed teal socket ring (never rotates)
  and a rotating knob (black molded body, teal inner accent, simplified molded
  grip ridges, inner recessed face, centre hub, white indicator line). Props:
  `cx/cy/r`, `rotationAngle`, `pressed`, `enabled`, `onClick`, `idPrefix`.
  Geometry never changes; React controls only rotation + pressed/disabled state.
- `src/assets/rseries/controls/pacer_knob.svg` — blank reusable knob asset.
- Satin molded plastic, factory-new, minimal reflections/shadows (not glossy).
  Footprint matches the locked master layer 15.
- `/controls-review` gains a Pacer Knobs section: blank asset; OUTPUT / RATE;
  default / pressed / disabled; minimum / midpoint / maximum rotations.
- Recorded in `visual-alignment-report.md` §8.11; `COMPONENT_LIBRARY.md` §5.
- The 4:1 button is a separate later part (not built this pass).

## [0.1.16] — 2026-07-02 — Industrial Design Pass 2F: Code Readiness Window

Built the reusable Code Readiness / self-test window. Not wired into the shipping
master; no body, LCD, or previously-frozen-control change, and no simulator logic.

### Added
- `src/components/rseries/controls/CodeReadiness.jsx` — physical black window in a
  dark-gray satin molded bezel (fixed geometry) with a React-driven display.
  Props: `status` ('blank' / 'ready' / 'notReady' / 'testing'), `flashing`,
  `x/y/w/h`, `idPrefix`. Only the display changes: green check / red X / rotating
  amber self-test spinner (SMIL) / optional flashing pulse. Geometry never changes.
- `src/assets/rseries/controls/code_readiness_window.svg` — physical window asset
  (blank; no status baked in). Footprint matches the locked master layer 17.
- `/controls-review` gains a Code Readiness section: physical asset; blank / ready
  (green check) / notReady (red X) / testing / ready-flashing.
- Facilitator-ready: `status` is a plain prop for later facilitator control (no
  simulator logic wired). Recorded in `visual-alignment-report.md` §8.12;
  `COMPONENT_LIBRARY.md` §5.

## [0.1.18] — 2026-07-03 — Industrial Design Pass 2G: Physical Softkey Assembly

Built the physical softkey assets (the industrial design behind the approved
Softkey Framework). Not wired into the shipping master; no body, LCD, or
previously-frozen-control change, and no simulator logic.

### Added
- `src/assets/rseries/controls/softkey_blank.svg` — a single warm-gray molded
  softkey (110 × 58, radius 6): satin face + darker molded side edge + subtle top
  bevel. No labels, no text.
- `src/assets/rseries/controls/softkey_row.svg` — six identical keys at pitch 122
  (layer-07 spacing), drawn once and reused six times.
- `/softkey-review` gains a Physical Softkey Assembly section: single key →
  six-key row → mounted beneath the LCD.
- Recorded in `visual-alignment-report.md` §8.14; `COMPONENT_LIBRARY.md` §5.

## [0.1.17] — 2026-07-03 — Package 4: Softkey Framework

Built the reusable Softkey Framework. Not wired into the shipping master; no body,
LCD, previously-frozen-control, or simulator-logic change.

### Added
- `src/components/rseries/controls/SoftKey.ts` — softkey model (`SoftKey`:
  id/label/enabled/visible/highlighted/pressed), `makeSoftKey`, `normalizeRow`.
- `src/components/rseries/controls/softkeyLayouts.ts` — per-mode layouts. Monitor
  uses the R Series baseline (Options / Param / Code Marker / Report Data /
  Alarms / Sync On/Off); Pacer / Defib / Sync are example layouts.
- `src/components/rseries/controls/SoftKeyRow.tsx` — programmable six-key row
  (`<g>`); React drives label/enabled/visible/highlighted/pressed. The physical
  keys (locked layer 07) never change. This is one row, not six buttons.
- `src/views/SoftkeyReview.jsx` + route `/softkey-review` — physical keys; Monitor
  / Pacer / Defib / Sync layouts; per-key states.

### Note — TypeScript introduced
- These three framework files are **TypeScript** (`.ts` / `.tsx`) as requested —
  the first TS in this otherwise-JavaScript project (see `DECISIONS.md` D2). Vite/
  esbuild transpiles them at build with no `tsconfig` and no type-check step; the
  build and smoke tests pass. Can be converted to `.js`/`.jsx` for consistency if
  preferred. Recorded in `visual-alignment-report.md` §8.13, `COMPONENT_LIBRARY.md`
  §5.

## [0.1.14] — 2026-07-02 — End-of-day finalization: Pass 2 controls frozen

Docs-only finalization of today's Industrial Design work (no artwork or code
change). The following control families are now **APPROVED / FROZEN**:

- ✅ **Body** (Pass 1)
- ✅ **Mode Selector** (Pass 2A)
- ✅ **Function Button** (Pass 2B)
- ✅ **Energy Select** (Pass 2C)
- ✅ **Therapy Button family** (Pass 2D.1)

Freeze rule: no geometry/material edits to these unless explicitly reopened in a
new dated pass. Approved parts remain the reference; except the Mode Selector they
are not yet wired into the shipping master.

**Next milestone: Industrial Design Pass 2E — Pacer Knobs** (`15_PacerKnobs`).
Recorded in `ROADMAP.md` (milestone 16), `COMPONENT_LIBRARY.md` §5, and
`visual-alignment-report.md` §8.10.

## [0.1.13] — 2026-07-02 — Therapy Button family APPROVED & FROZEN

Approved and froze the Therapy Button family. Docs-only pass (no artwork or code
change).

- **ANALYZE** and **CHARGE** physical molded assets — approved.
- **SHOCK** physical molded asset — approved.
- **SHOCK glow** — approved as a **separate React-controlled overlay layer**;
  appears **only** when `shockReady` / charged-ready is true; **not baked into
  `shock_button.svg`**.
- **Pressed** and **disabled** remain physical interaction states (no glow).
- `therapy_button.svg`, `shock_button.svg`, and the `TherapyButton.jsx` geometry/
  material are frozen; the glow behaviour + state wiring may still be connected at
  master wire-in. Recorded in `visual-alignment-report.md` §8.9 and
  `COMPONENT_LIBRARY.md` §5.

## [0.1.12] — 2026-07-02 — Therapy Button finalization (Pass 2D.1)

Refined the Therapy Button family to the manufacturer photos and split the
physical control from its behaviour. Only TherapyButton.jsx + the two therapy
SVGs + the Controls Review page changed.

### Changed
- **ANALYZE / CHARGE** — shallower molded bevel / minimal highlight, deeper
  pressed lower shadow; warm-peach satin plastic, compact red uppercase text.
- **SHOCK (physical)** — molded orange with a satin finish, shallow recessed
  centre, subtle molded outer lip, reduced gloss. **No longer an arcade button**;
  no baked illumination or exaggerated reflections.
- **SHOCK glow is now a separate React overlay layer** (`shockReady`), a soft
  pulsing warm-orange bloom rendered via inline SMIL — **never baked into the
  SVG**. Extinguishes on press/disable. Added a `glowOnly` flag to render the
  overlay on its own for review.
- `/controls-review` therapy section rebuilt: ANALYZE/CHARGE default/pressed/
  disabled, and SHOCK idle / glow-overlay-only / charged-ready / pressed /
  disabled (demonstrating the glow separate from the molded button).
- Documented the two-layer SHOCK model (physical SVG + React glow overlay) in
  `COMPONENT_LIBRARY.md` §5 and `visual-alignment-report.md` §8.9.

## [0.1.11] — 2026-07-02 — Industrial Design Pass 2D: Therapy Buttons

Built the reusable Therapy Button family. Not wired into the shipping master; no
body, LCD, Mode Selector, Function Button, Energy Select, or simulator-logic
change.

### Added
- `src/components/rseries/controls/TherapyButton.jsx` — one component, two
  variants: `action` (peach rectangular button, red uppercase label — ANALYZE /
  CHARGE) and `shock` (flat orange circular button). Props: `variant`, `label`,
  footprint, `pressed`, `enabled`, `onClick`, `idPrefix`.
- `src/assets/rseries/controls/therapy_button.svg` — blank peach action button.
- `src/assets/rseries/controls/shock_button.svg` — flat orange shock button.
- SHOCK is deliberately **flat** — no glow ring, no glossy hotspot (not an
  arcade button). Footprints match the locked master layer 09.
- `/controls-review` gains a Therapy Buttons section: individual assets +
  ANALYZE / CHARGE / SHOCK in pressed / unpressed / disabled states.
- Recorded in `visual-alignment-report.md` §8.8; `COMPONENT_LIBRARY.md` §5 updated.

## [0.1.10] — 2026-07-02 — Energy Select APPROVED & FROZEN

Approved the manufacturer-accurate Energy Select. Docs-only pass (no code change).

- The Energy Select control (warm-beige molded ▲ / ENERGY / SELECT / ▼ rocker,
  **no numeric value on the button face**) is **approved and frozen**:
  `energy_select_button.svg` + `EnergySelect.jsx` geometry (96×150, radius 16),
  plastic colour, bevel, triangles, and typography are locked.
- Recorded that the **selected energy (joules) is displayed on the LCD, not on the
  physical ENERGY SELECT button** — the button only adjusts the value.
- `energyValue`/`energyUnits` props retained for API compatibility (not rendered
  on the face). Recorded in `visual-alignment-report.md` §8.7 and
  `COMPONENT_LIBRARY.md` §5.

## [0.1.9] — 2026-07-02 — Energy Select content-centering refinement (2C.1)

Refinement to match the manufacturer screenshot. Only the content (arrows + text)
changed; outer dimensions, corner radius, plastic colour, and bevel unchanged.

### Changed
- **Vertically centered** the ▲ / ENERGY / SELECT / ▼ content block with balanced
  spacing (reduced excess space above/below the arrows).
- **Enlarged the red triangles** (26×18 → 30×22, still solid triangles, equal
  size) and bumped ENERGY/SELECT 14→15 px.
- **Removed the on-face energy value** — the real device shows the selected energy
  on the LCD, not the button face (matching the manufacturer photo).
  `energyValue`/`energyUnits` props retained for API/labelling.
- `/energy-select-review` gains a manufacturer-reference slot
  (`public/energy_select_reference.png`); examples labelled by caption.
- Recorded in `visual-alignment-report.md` §8.7. No other control or geometry
  changed.

## [0.1.8] — 2026-07-02 — Industrial Design Pass 2C: Energy Select

Built the reusable Energy Select control. Not wired into the shipping master; no
body, LCD, cradle, Mode Selector, Function Button, or simulator-logic change.

### Added
- `src/components/rseries/controls/EnergySelect.jsx` — reusable warm-beige molded
  vertical rocker (▲ / ENERGY / SELECT / value / ▼). Props: `x/y/w/h`,
  `energyValue`, `energyUnits`, `pressed`, `enabled`, `highlighted`, `onClick`,
  `idPrefix`. Geometry fixed (96×150, radius 16); React changes only the
  displayed energy + pressed/enabled/highlighted state.
- `src/assets/rseries/controls/energy_select_button.svg` — blank reusable shell.
- `src/views/EnergySelectReview.jsx` + route `/energy-select-review` — blank
  shell, default/pressed/disabled states, and examples 30/50/70/100/120/150/200/
  360 J.
- Warm beige satin plastic, deeper molded side edge, flat red triangles, compact
  red ENERGY/SELECT. Recorded in `visual-alignment-report.md` §8.6.

## [0.1.7] — 2026-07-02 — Function Button material fine-tune (asset FROZEN)

Styling-only pass; no geometry, corner radius, dimensions, or type size changed.

### Changed
- Reduced the glossy top highlight ~50% (white 0.70 → 0.35).
- Warmed the plastic slightly (face `#faf9f3 → #edeae1 → #d4d1c8`; side edge
  `#b6b3aa`).
- Reduced label letter-spacing ~3% (0.30 → 0.29).
- Improved the pressed state: darker warm plastic (`#dcdbd4 → #bdbbb2`) + a
  deeper lower shadow (bottom-pooled) instead of added gloss.
- **`function_button.svg` (blank reusable asset) is permanently FROZEN.** Recorded
  in `visual-alignment-report.md` §8.5.

## [0.1.6] — 2026-07-02 — Industrial Design Pass 2B: Function Buttons

Built the reusable Function Button library part. No body, LCD, cradle, Mode
Selector, or simulator-logic change; the shipping master was not modified.

### Added
- `src/components/rseries/controls/FunctionButton.jsx` — one reusable warm-gray
  molded push-button (props: `x/y/w/h`, `lines`, `pressed`, `active`, `onClick`,
  `idPrefix`); supports 1- or 2-line labels (ALARM SUSPEND stacks on two lines).
- `src/assets/rseries/controls/function_button.svg` — the blank reusable button
  asset.
- Styling: warm-gray satin face, darker molded side edge (depth), top bevel
  highlight, compact black uppercase label; pressed/unpressed/latched states.
  Footprint matches the locked master layer 08 (positions unchanged).
- `/controls-review` now shows the Function Buttons: individual asset + LEAD /
  SIZE / ALARM SUSPEND / RECORDER in pressed and unpressed states.
- Recorded in `visual-alignment-report.md` §8.4; `COMPONENT_LIBRARY.md` §5 updated
  (Pass 2A done/frozen, 2B built-not-yet-wired).

## [0.1.5] — 2026-07-02 — Mode Selector label alignment (reopened → re-frozen)

Owner-approved pass aligning the labels/printed sections to the manufacturer
photos, then re-freeze. The **knob was not touched** (approved).

### Changed — labels & printed sections only
- **Removed the wrapping colored arcs**; colour now lives only in the printed
  sections (per the reference — flat, printed labelling; teal no longer wraps).
- **MONITOR** → subtle light gray (`#9a9d99`, 18 px, weight 600), lower contrast
  (was `#6f757c`, 22 px, 700 — too dark/large/prominent).
- **PACER** → flat teal section with an angled leading edge (was a chunky tag).
- **DEFIB** → flat red section with a short inward tab toward the knob (was a
  large, overly-modern tab).
- **OFF** → widened so the 9 o’clock dot sits at its right end, close to the knob.
- Colour segregated: teal=PACER, red=DEFIB, gray=MONITOR, black=OFF; no colour
  across OFF or MONITOR. Applied to master, export, and Pass 2 parts. Removed the
  now-unused `arc()`/`pt()` helpers and the `mode_selector_arcs.svg` part.
- `/controls-review` now shows reference → current → updated + all four states.
- Recorded in `visual-alignment-report.md` §8.3. **Mode Selector re-frozen.**

## [0.1.4] — 2026-07-02 — Mode Selector indicator alignment (reopened → re-frozen)

Owner-approved fine-tune pass fixing the mode indicator, then re-freeze.

### Changed — indicator/dot alignment (Mode Selector only)
- The knob's white line previously pointed **opposite** the selected mode. Fixed
  by correcting `MODE_ANGLE` (Off 90, Monitor 150, Defib −150, Pacer 30) so the
  line points **at** the mode.
- Replaced the single rotating dot with **four fixed** white position dots (one
  per section, on the collar) that do **not** rotate; the knob line aligns to the
  selected mode's dot: OFF→9, PACER→7, DEFIB→1, MONITOR→11 o’clock.
- Lengthened the white pointer (66→70) for an unambiguous indication.
- Applied identically to the master (`RSeriesDevice.jsx`), the frozen export
  (`RSeries_Master.svg`), and the Pass 2 parts. Arcs, labels, knob body, and
  colour assignments unchanged. Recorded in `visual-alignment-report.md` §8.2.
- `/controls-review` now demonstrates all four states (OFF/MONITOR/DEFIB/PACER).
- **Mode Selector re-frozen.**

## [0.1.3] — 2026-07-02 — Mode Selector finalized & FROZEN

Final, tightly-scoped fidelity pass on the Mode Selector, then permanent freeze.

### Changed — final pass (five scoped properties only)
- Knob **grip geometry** (20×84), white **pointer size** (12×66), **knob depth**
  (deeper dome gradient `#545454→#2c2c2c→#101010` + recessed inner shadow ring),
  printed **arc saturation** (red `#d4271b`, teal `#0ba199`), and **MONITOR gray
  strip contrast** (`#6f757c`). Everything else in the control was left locked.
- Applied identically to the master (`RSeriesDevice.jsx`), the frozen export
  (`public/RSeries_Master.svg`), the Pass 2 parts, and `ModeSelector.jsx`.
- **The Mode Selector is now permanently frozen** — no future geometry edits
  unless explicitly reopened. Recorded in `visual-alignment-report.md` §8.1.

### Added
- `src/views/ModeSelectorCompare.jsx` + route `/mode-selector-compare` — a
  four-panel comparison harness (reference → current SVG → overlay → difference
  annotations) that loads `public/mode_selector_reference.png`. Dev/QA only.

## [0.1.2] — 2026-07-02 — Industrial Design Pass 2 (started): Mode Selector

First control of Pass 2 (Controls Library). No simulator behavior changed.

### Added
- Reusable **Mode Selector** parts in `src/assets/rseries/controls/`:
  `mode_selector_background.svg`, `mode_selector_arcs.svg`,
  `mode_selector_labels.svg`, `mode_selector_knob.svg`,
  `mode_selector_indicator_dot.svg`.
- `src/components/rseries/controls/ModeSelector.jsx` — reusable component composing
  the parts, with props `mode`, `knobAngle`, `activeMode` (only the knob grip/
  insert and the single dot rotate; arcs/labels/background never rotate).
- `src/views/ControlsReview.jsx` + route `/controls-review` — exploded parts plus
  a live-props demo. Dev/QA only; not part of the shipping simulator.

### Changed — alignment pass (Mode Selector) against a manufacturer close-up photo
- **Reopened the locked Mode Selector geometry** (master layers `12` arcs and `13`
  knob) as a deliberate, documented alignment pass. Updated in the master
  (`RSeriesDevice.jsx`), the frozen export (`public/RSeries_Master.svg`), and the
  Pass 2 parts so they stay identical:
  - knob finger grip → lighter satin-gray molded grip (`#8f8f8f→#565656`);
  - white pointer → bolder / longer; knob sheen strengthened;
  - red arc concentrated at DEFIB, teal arc concentrated at PACER (removed from the
    neutral OFF / MONITOR positions).
  - Knob centre/radius unchanged; labels reviewed and retained. Recorded in
    `visual-alignment-report.md` §8.

## [0.1.1] — 2026-07-02 — Documentation reorganization

Consolidated `/docs` into a single canonical set and reconciled it with the
current codebase. No code or simulator behavior changed.

### Added
- `docs/README.md` — documentation index and the "read `/docs` first" mandate.
- `docs/ROADMAP.md` — reframed around the **Industrial Design passes**; records
  Pass 1 (Body) as **LOCKED / APPROVED** and Pass 2 (Controls Library) as the
  **next milestone**. Replaces `DEVELOPMENT_ROADMAP.md`.
- `docs/DECISIONS.md` — decision log (lightweight ADRs) with rationale and
  consequences.

### Changed
- `docs/COMPONENT_LIBRARY.md` — corrected the body-part status from "scaffold /
  placeholders" to **built, approved, and LOCKED** (Pass 1); folded in the SVG
  structural standards; marked `controls/` as the Pass 2 target.
- `docs/ART_DIRECTION.md` — folded in the approved visual language and palette;
  added the body-locked / Pass 2 context.
- `docs/PROJECT_VISION.md`, `docs/ARCHITECTURE.md`, `docs/SIMULATOR_REQUIREMENTS.md`
  — refreshed cross-links and the Industrial Design pass framing.
- Root `README.md` — refreshed the docs index and corrected a stale "next work"
  backlog that still listed already-implemented behavior (defib, pacer, CPR,
  scenarios, exports) as to-do.

### Removed (content folded into the canonical set)
- `DEVELOPMENT_ROADMAP.md` → `ROADMAP.md`.
- `DESIGN_GUIDE.md` → folded into `ART_DIRECTION.md`.
- `SVG_STANDARDS.md` → folded into `COMPONENT_LIBRARY.md`.

---

## [0.1.0] — 2026-07-02 — Documentation freeze

Feature development paused to establish the permanent project documentation
("the project bible"). Future sessions read `/docs` before making changes.

### Added
- `/docs` directory with the authoritative documentation set and a root
  `README.md` that orients new developers and points into `/docs`.

---

## [0.0.x] — through 2026-06-30 — Working simulator (pre-industrial-design rebuild)

Checkpoint commit *"working ZOLL R Series simulator before industrial-design
rebuild."* All milestones below were completed in this line of work. (Versions
predate a formal SemVer tag; `package.json` reads `0.0.0`.)

### Architecture
- React 19 + Vite 8 (JavaScript/ESM) SPA with `react-router-dom` v7; routes for
  Home, Learner, Facilitator, Report, and an ArtPreview/QA view.
- Cross-window shared-state engine (`SimulatorContext.jsx`) over
  `BroadcastChannel`, mirrored to `localStorage`, **keyed per session id** so
  independent sessions never cross-sync.
- Pure session-scope helpers (`sessionKeys.js`) shared by the app and Node smoke
  tests; `ErrorBoundary`; `BASE_URL`-aware routing for subpath deploys; resilient
  storage/channel wrappers with a `storage`-event fallback.

### Learner
- `/learner` device view mirroring facilitator state live; elapsed clock;
  shock/CPR flash effects; education-mode guidance panel; safety label.

### Facilitator
- `/facilitator` console: mode, rhythm, vitals, defib energy, charge/analyze/
  shock/disarm, sync, pacer, CPR, connections, alarm limits/suspend, self-test.
- Scenario loader, step advance, force deterioration / ROSC, checklist, outcome,
  notes; event-log viewer with category filters; JSON/CSV export; report link.
- Dev-only Debug panel and `window.__sim` console helpers.

### Waveforms
- Waveform library (`waveforms.js`): 14 rhythms + pleth/capnogram tiles, QRS
  markers, syncable/non-perfusing classification, ECG gain scaling,
  `pacedPath`/`pacerSpikes`/`cprArtifactPath`.

### Defibrillation
- Energy select across ZOLL biphasic values; charge → ready → shock sequencing
  with a charging progress model; disarm/timeout; shock gated on charge;
  post-shock artifact; shock count; outcome-driven conversion; failed-shock log.

### Cardioversion
- SYNC toggle with QRS markers; shock waits for the next R wave; synchronized
  shock logging; energy escalation; unstable-SVT scenario.

### Pacing
- Transcutaneous pacing: rate (PPM) + output (mA); capture threshold model
  (auto/on/off); electrical capture vs. failure-to-capture on the ECG; 4:1;
  intermittent capture; capture/loss logging.

### CPR
- CPR feedback: rate, depth, release quality, perfusion indicator, auto feedback
  message, ECG compression artifact, idle timer; start/stop + quality logging;
  CPR-quality validation scenario.

### Scenarios
- Eight facilitator scenarios with initial state, expected actions, education
  notes, protocol hints, validation checklist, outcomes, and multi-step
  progression.

### Device artwork (geometry LOCKED)
- Proportion-matched vector reconstruction of the R Series front panel measured
  from manufacturer reference; master SVG `viewBox 0 0 1440 1120`; top alignment
  mismatches corrected (aspect ≈1.281 vs 1.263).
- **Device geometry permanently LOCKED** — 22 named layers; React animates state
  only, never redraws artwork. Documented in `../visual-alignment-report.md`.

### Industrial Design Pass 1 — Body
- Housing/chassis reconstructed as modular SVG parts under
  `src/assets/rseries/body/` (bumper, faceplate, bezels, LCD frame/glass, cradle,
  connector bump, screw cover); reviewed via the exploded `/art-preview`
  ("Pass 1.5") view. **Body assets locked and approved.**

### LCD framework
- Separate `#LCD_Content` overlay (673×515 logical space) scaled into the LCD
  opening; renders values, waveforms, softkey labels, banners, and status.

### React integration
- Master SVG authored in JSX so React binds state to individual layers (LEDs,
  self-test, button glow, knob rotation, softkey text, waveforms) over fixed
  geometry.

### Testing
- Node smoke tests (`scripts/smoke.mjs`) for session keying, scenario presets,
  waveform library, and JSON/CSV export; `npm run build` as a route/compile check;
  full manual `QA_CHECKLIST.md`.

### Reports & exports
- Per-session JSON export, event-log CSV export, and a printable `/report`
  (summary, checklist, timeline, shocks, pacing, CPR, alarms, notes, outcome;
  VALIDATION banner).

### Safety
- Fixed "Training simulation only. Not for clinical use." label on every view.

---

## Notes on versioning

- `package.json` currently reads `0.0.0`; the `0.1.x` entries above mark
  documentation milestones and do not yet bump the package version.
- The **Release Candidate** milestone will introduce the first tagged version and
  freeze scope for classroom adoption.
