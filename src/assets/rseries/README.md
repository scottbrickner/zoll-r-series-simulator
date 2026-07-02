# R Series modular SVG assets

Reusable SVG parts for the ZOLL R Series learner device. React assembles these
parts into the full device and animates them; **the parts themselves are static
artwork** (geometry only, no state, no baked LCD waveforms).

This structure exists so the device artwork can be rebuilt in **small approved
passes** — one part at a time — instead of one monolithic SVG.

## Folders

| Folder | Contents |
|--------|----------|
| `body/` | Housing / chassis parts: blue bumper, faceplate, screen bezel, lower handle-cradle, shadows, highlights. |
| `controls/` | Interactive hardware parts: softkeys, function buttons, therapy buttons, energy select, mode selector (back/arcs/knob/dot), pacer knobs, LED indicators, self-test window, NIBP button. |
| `lcd/` | LCD window/glass frame and the empty display background. The live digital display (waveforms, values, softkey labels) is a separate React overlay — **not** baked into these assets. |
| `icons/` | Small glyphs: NIBP arm+cuff, heart/CPR, bolt, connector marks, etc. |
| `labels/` | Printed text/wordmarks: ZOLL logo, control legends, arc labels. |
| `reference/` | Approved source references only (manufacturer photos, the frozen `RSeries_Master.svg` export, dimension guides). Used for comparison during a pass; **not shipped as device parts.** |

## Conventions (per part)

- **Coordinate space:** author each part in the master viewBox space
  (`0 0 1440 1120`) so parts drop into the assembled device at their final
  position without re-fitting. A part may instead use its own local box if it
  documents an intended `translate()`.
- **Format:** a part is either a raw `.svg` (a single `<g>` / `<symbol>`) or a
  small `.jsx` partial that returns SVG (`<g>…</g>`). Prefer one part per file.
- **Naming:** match the locked master layer names where applicable, e.g.
  `body/01_Bumper.svg`, `controls/13_ModeSelector_Knob.jsx`.
- **No state / no interactivity** inside a part. React adds `onClick`,
  `transform` (knob rotation), `fill` (LED/glow), and text at assembly time.
- **No baked waveforms** in `lcd/` — the display opening stays empty.
- **Palette:** use the Industrial Design Fidelity Guide v1.0 colors
  (ZOLL Blue `#0066B3`, faceplate `#E5E6E2`, warm-gray buttons `#F2F2EF`,
  knob `#2B2B2B`/`#424242`, LCD `#00FF66`/`#FFD100`/`#00FFFF`/`#FF00FF`/`#FF3830`).

## Status

Scaffold only — no parts built yet. The current shipping device remains
[`src/components/rseries/RSeriesDevice.jsx`](../../components/rseries/RSeriesDevice.jsx)
(the locked master). Parts will be added and wired in incrementally, each in its
own approved pass.
