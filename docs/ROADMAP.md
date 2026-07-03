# ROADMAP

**Project:** ZOLL R Series Simulator
**Last reviewed:** 2026-07-02

This roadmap is the single place to see where the project stands. It separates
**what is implemented and shipping** from **what is partial** and **what is
planned** — nothing planned is listed as done. Status legend:

- ✅ **Done** — implemented and in the shipping build.
- 🟡 **Partial** — foundations in place; meaningful work remains.
- ⬜ **Planned** — not yet started.

For the reasoning behind each area see [`PROJECT_VISION.md`](PROJECT_VISION.md);
for behavior detail see [`SIMULATOR_REQUIREMENTS.md`](SIMULATOR_REQUIREMENTS.md);
for decisions and their rationale see [`DECISIONS.md`](DECISIONS.md).

> **Current focus:** feature development is paused for a documentation freeze.
> Controls Library sub-passes 2A–2D (Mode Selector, Function Button, Energy
> Select, Therapy Buttons) are **APPROVED / FROZEN**. The **next milestone is
> Industrial Design Pass 2E — Pacer Knobs** (see below).

---

## Milestone overview

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Architecture (SPA, cross-window sync) | ✅ Done |
| 2 | Learner view | ✅ Done |
| 3 | Facilitator console | ✅ Done |
| 4 | Monitoring | ✅ Done |
| 5 | Defibrillation | ✅ Done |
| 6 | Synchronized cardioversion | ✅ Done |
| 7 | Pacing | ✅ Done |
| 8 | CPR feedback | ✅ Done |
| 9 | Alarms | ✅ Done |
| 10 | Scenario engine (8 scenarios) | ✅ Done |
| 11 | Education / validation modes | ✅ Done |
| 12 | Event logging, reports & exports | ✅ Done |
| 13 | LCD framework | ✅ Done |
| 14 | Device master artwork (geometry LOCKED) | ✅ Done |
| 15 | **Industrial Design Pass 1 — Body** | ✅ **Done (assets LOCKED / APPROVED)** |
| 16 | **Industrial Design Pass 2 — Controls Library** (2A–2D frozen) | 🟡 **In progress — NEXT: Pass 2E Pacer Knobs** |
| 17 | Waveform library | 🟡 Partial |
| 18 | Typography tokens | 🟡 Partial |
| 19 | Automated testing / CI | 🟡 Partial |
| 20 | Release Candidate (1.0) | ⬜ Planned |

---

## Implemented and shipping

### 1. Architecture — ✅ Done

- React 19 + Vite 8 (JavaScript, ESM), `react-router-dom` v7.
- Cross-window shared-state engine over `BroadcastChannel`, mirrored to
  `localStorage`, **keyed per session id** so sessions never cross-sync.
- Pure session-scope helpers (`sessionKeys.js`) shared by the browser app and the
  Node smoke tests.
- Resilient storage/channel wrappers; `ErrorBoundary`; SPA routing with
  `BASE_URL` support for subpath deploys. Fully static — no backend. See
  [`ARCHITECTURE.md`](ARCHITECTURE.md).

### 2. Learner — ✅ Done

- `/learner` hosts the locked master device, elapsed clock, and shock/CPR flash
  effects, mirroring facilitator state in real time.
- Education-mode guidance panel (device explanation, expected actions, hints, CPR
  coaching) that hides in validation mode. Safety label on every view.

### 3. Facilitator — ✅ Done

- `/facilitator` console: mode, rhythm, vitals, defib energy, charge/analyze/
  shock/disarm, sync, pacer settings, CPR inputs, connections, alarm limits.
- Scenario loader, step advance, force-deterioration / force-ROSC, checklist,
  outcome selection, facilitator notes.
- Event-log viewer with category filters; JSON/CSV export; link to the report.
- **Dev-only Debug panel** and `window.__sim` console helpers.

### 4. Monitoring — ✅ Done

- HR, SpO₂, NIBP, EtCO₂, RR, elapsed time; lead cycle (`I, II, III, aVR, aVL,
  aVF, PADDLES, PADS`); ECG size/gain (`x0.5 … x3`); pleth/capno toggles.
- Connection states drive "CHECK ECG LEADS" / "CHECK PADS" and dashed values;
  non-perfusing rhythms suppress a perfusing HR/BP.

### 5. Defibrillation — ✅ Done

- Energy select across realistic ZOLL biphasic values
  `[1,2,3,5,7,10,15,20,30,50,70,85,100,120,150,200] J`; charge → ready → shock
  sequencing with a charging progress model; disarm/timeout; SHOCK illuminates
  only when charged; post-shock artifact; shock count; post-shock rhythm
  conversion per facilitator outcome; failed-shock logging.

### 6. Synchronized cardioversion — ✅ Done

- SYNC toggle with QRS markers; shock waits for the next R wave; logged as a
  synchronized shock; energy escalation supported; unstable-SVT scenario.

### 7. Pacing — ✅ Done

- Transcutaneous pacing: rate (PPM) and output (mA); capture threshold model
  (auto/on/off); electrical capture vs. failure-to-capture rendered on the ECG;
  4:1 (hold to pace at ¼ rate); intermittent capture; capture/loss logging.

### 8. CPR feedback — ✅ Done

- Rate, depth, release quality, perfusion indicator, auto-computed feedback
  message, ECG compression artifact, and an idle timer; start/stop and
  quality-change logging; CPR-quality validation scenario.

### 9. Alarms — ✅ Done

- HR / SpO₂ / NIBP / EtCO₂ / RR limits; trigger flashes the parameter + banner;
  suspend with a countdown and auto-resume; test alarm; triggered/suspended/
  resumed logging.

### 10. Scenario engine — ✅ Done

- Eight facilitator scenarios (`vf-arrest`, `pulseless-vt`, `svt-cardioversion`,
  `brady-pacing`, `asystole-pea`, `rosc-monitoring`, `cpr-quality`,
  `monitor-unstable`), each with initial state, expected actions, education
  notes, protocol hints, validation checklist, outcomes, and multi-step
  progression.

### 11. Education / validation modes — ✅ Done

- `learnerMode ∈ {standard, education, validation}`. Education shows the learner
  guidance panel; validation hides it and flags the session for scoring.

### 12. Event logging, reports & exports — ✅ Done

- Per-session, timestamped, categorized event log; JSON export
  (`buildSessionData`), event-log CSV, and a printable `/report` (summary,
  checklist, timeline, shocks, pacing, CPR, alarms, notes, outcome; VALIDATION
  banner). See [`SIMULATOR_REQUIREMENTS.md`](SIMULATOR_REQUIREMENTS.md) §12–13.

### 13. LCD framework — ✅ Done

- Separate `#LCD_Content` overlay in a fixed 673×515 logical space, scaled into
  the physical LCD rect; renders values, waveforms, softkey labels, banners, and
  status independently of the locked artwork.

### 14. Device master artwork — ✅ Done (geometry LOCKED)

- Proportion-matched vector reconstruction of the R Series front panel measured
  from manufacturer reference; master SVG `viewBox 0 0 1440 1120`, aspect ≈1.281
  vs reference 1.263 (~1.4%). Authored in JSX (`RSeriesDevice.jsx`) so React
  animates state over 22 named layers, never redrawing artwork. A frozen static
  export is committed at `public/RSeries_Master.svg`. See
  [`ART_DIRECTION.md`](ART_DIRECTION.md) and `visual-alignment-report.md`.

  > This monolithic master is what the **shipping** learner device renders today.
  > The modular passes below rebuild it part-by-part; until a part is approved and
  > wired in, the master remains the source of truth on screen.

### 15. Industrial Design Pass 1 — Body — ✅ Done (assets LOCKED / APPROVED)

The housing/chassis has been reconstructed as approved modular SVG parts in
`src/assets/rseries/body/` and reviewed in the exploded `/art-preview` view
("Pass 1.5" CAD review). **These body assets are locked and approved.**

Approved, locked parts:

| Part | File |
|------|------|
| Blue bumper | `body/bumper.svg` |
| Faceplate | `body/faceplate.svg` |
| Screen — outer bezel | `body/screen_outer_bezel.svg` |
| Screen — inner bezel | `body/screen_inner_bezel.svg` |
| LCD opening | `body/lcd_opening.svg` |
| LCD glass | `body/lcd_glass.svg` |
| Lower cradle | `body/lower-cradle.svg` |
| Connector bump | `body/connector-bump.svg` |
| Screw cover (reusable ×2) | `body/screw-cover.svg` |

**Status note (honest):** these parts are the approved, frozen reference for the
body. They are reviewed via `/art-preview` but are **not yet assembled into the
shipping device** — the locked monolithic master (Milestone 14) still renders on
the learner screen. Wiring the approved parts into the shipping assembly happens
as the modular library is completed. Body assets may not be re-opened or restyled
outside a deliberate, documented alignment pass.

---

## Planned and partial

### 16. Industrial Design Pass 2 — Controls Library — 🟡 In progress (2A–2D APPROVED / FROZEN)

Reconstruct the interactive controls as approved, reusable modular parts in
`src/assets/rseries/controls/`, matching the locked master geometry exactly.
Built and approved **one sub-pass at a time**. Sub-pass status:

| Sub-pass | Control | Master layer(s) | Status |
|----------|---------|-----------------|--------|
| 2A | Mode selector (back / sections / knob / dots) | `11`–`14` | ✅ **APPROVED / FROZEN** |
| 2B | Function buttons (LEAD / SIZE / ALARM SUSPEND / RECORDER) | `08_FunctionButtons` | ✅ **APPROVED / FROZEN** |
| 2C | Energy select rocker | `10_EnergySelect` | ✅ **APPROVED / FROZEN** |
| 2D | Therapy buttons (ANALYZE / CHARGE / SHOCK) | `09_TherapyButtons` | ✅ **APPROVED / FROZEN** |
| **2E** | **Pacer knobs (OUTPUT / RATE) + 4:1** | `15_PacerKnobs` | ⬜ **Planned — NEXT MILESTONE** |
| 2F+ | Softkeys, LED indicators, self-test window, NIBP button | `07` / `16` / `17` / `18` | ⬜ pending |

> **Next milestone: Industrial Design Pass 2E — Pacer Knobs** (the OUTPUT and RATE
> knobs + the 4:1 button), master layer `15_PacerKnobs`.

Rules for the pass (see [`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md) and
[`ART_DIRECTION.md`](ART_DIRECTION.md)):

- Buttons and knobs are **single reusable static parts**; instances differ only by
  position, printed label, and the fill/glow/rotation React binds.
- Printed mode-selector arcs are a separate static part and **never rotate**.
- Each part reassembles to the **identical** master geometry — this pass adds
  modular parts, it does **not** change the locked look.
- Deliver and approve **one part at a time**, matching the body-pass workflow.
- Approved sub-passes are **frozen** — no geometry/material edits unless explicitly
  reopened in a new dated pass (see `visual-alignment-report.md`).

### 17. Waveform library — 🟡 Partial

- ✅ Library (`waveforms.js`): sinus (normal/brady/tachy), SVT, AF, VT, VF,
  Torsades, Asystole, PEA, Paced (capture/non-capture), CPR artifact, post-shock
  artifact; pleth + capnogram tiles; QRS markers; syncable/non-perfusing
  classification; ECG gain scaling.
- ⬜ **Remaining:** more rhythms/artifacts (AV blocks, VT/VF variants, noise),
  per-trace rate coupling, richer paced morphology.

### 18. Typography tokens — 🟡 Partial

- ✅ LCD numerics, labels, and softkey text render in the LCD framework; control
  legends are printed on the master `20_Labels` layer.
- ⬜ **Remaining:** formalize a typographic scale/token set and separate printed
  wordmarks/legends into a `labels/` asset group.

### 19. Automated testing / CI — 🟡 Partial

- ✅ Node smoke tests (`scripts/smoke.mjs`) cover session keying, scenario
  presets, the waveform library, and JSON/CSV export; `npm run build` doubles as a
  route/compile check; `QA_CHECKLIST.md` covers full manual QA in two windows.
- ⬜ **Remaining:** component/interaction tests, automated visual-regression
  against the alignment report, and CI wiring.

### 20. Release Candidate (1.0) — ⬜ Planned

- Freeze scope, complete the modular asset extraction, expand test coverage, full
  QA pass, versioned tag, and a documented 1.0 suitable for classroom adoption.
  Tracked in [`CHANGELOG.md`](CHANGELOG.md).

---

## Remaining work, at a glance

1. **Industrial Design Pass 2E: Pacer Knobs** (Milestone 16, next sub-pass) — the
   next milestone. Sub-passes 2A–2D are frozen.
2. Finish the Controls Library (softkeys, LEDs, self-test, NIBP), then complete the
   rest of the modular asset library (LCD, icons, labels) and wire approved parts
   into the shipping assembly.
3. Expand the waveform library and add rate coupling (Milestone 17).
4. Grow automated testing toward CI and visual regression (Milestone 19).
5. Harden and tag the Release Candidate (Milestone 20).

**No remaining work may alter the locked device geometry. Behavior and modular
reconstruction only.**
