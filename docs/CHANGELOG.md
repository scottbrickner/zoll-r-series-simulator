# CHANGELOG

All notable changes to the ZOLL R Series Simulator are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); the
project uses date-stamped milestone entries pending a tagged 1.0.

> **Training simulation only. Not for clinical use.**

---

## [Unreleased]

Working toward the **Release Candidate** milestone ([`ROADMAP.md`](ROADMAP.md)
#20). No changes may alter the locked device geometry.

### Next milestone
- **Industrial Design Pass 2: Controls Library** — reconstruct the interactive
  controls (buttons, knobs, energy select, mode selector, pacer knobs, LEDs,
  self-test, NIBP) as approved reusable modular parts under
  `src/assets/rseries/controls/`, each matching the locked master geometry.

### Also planned
- Wire the approved modular parts into the shipping assembly (replacing the
  monolithic master part-by-part).
- Expand the waveform library (AV blocks, VT/VF variants, noise) and add per-trace
  rate coupling.
- Formalize typography tokens and separate printed wordmarks into `labels/`.
- Grow automated testing toward component/interaction and visual-regression
  coverage; wire CI.

---

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
