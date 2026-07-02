# DECISIONS

**Project:** ZOLL R Series Simulator
**Type:** Decision log (lightweight ADRs)
**Last reviewed:** 2026-07-02

The key architectural and design decisions for the project — what was decided, why,
and the consequences. New decisions are appended; a superseded decision is marked,
not deleted. Status: **Accepted** unless noted.

For the intent behind these decisions see [`PROJECT_VISION.md`](PROJECT_VISION.md);
for how they are realized see [`ARCHITECTURE.md`](ARCHITECTURE.md) and
[`ART_DIRECTION.md`](ART_DIRECTION.md).

---

## D1 — Fully client-side, static, no backend

**Decision.** The simulator is a static single-page app. No server, database,
account, or network dependency. `npm run build` emits a static `dist/`.

**Why.** Zero-friction deployment to classrooms, skills stations, and any static
host, and offline use on any machine with a browser. Nothing to operate or secure.

**Consequences.** State lives in the browser; there is no server-side persistence
or cross-device coordination. Cross-device live sync is out of scope (see D3, D9).

---

## D2 — React 19 + Vite 8, JavaScript (ESM), not TypeScript

**Decision.** Build with React 19 and Vite 8 in plain JavaScript/ESM;
`react-router-dom` v7 for routing; `oxlint` for linting.

**Why.** Fast, simple toolchain for a focused UI app; JS keeps the barrier low and
avoids a build-type layer for a project whose complexity is in device behavior, not
types.

**Consequences.** No compile-time type safety; correctness is guarded by defensive
state sanitization (see D8) and smoke tests (see D11). Pure logic is kept in
React-free modules so Node can test it.

---

## D3 — Two windows, one device: cross-window sync via BroadcastChannel + localStorage, keyed per session

**Decision.** A Learner window and a Facilitator window share one simulation state
over `BroadcastChannel`, mirrored to `localStorage`. Both are **scoped by a session
id** carried in the URL (`?session=…`); the state key is
`zoll-r-series-sim:state:<id>` and the channel is `zoll-r-series-sim:<id>`.

**Why.** One instructor can run a full station on one machine (facilitator on one
screen, learner on another) with no infrastructure. Per-session scoping lets
multiple instructors run **independent, concurrent** sessions on one deployment
without cross-talk.

**Consequences.** Live sync is per-browser/origin — two windows on the **same
machine + browser**. The window that invokes an action owns its timers and
broadcasts state; others mirror passively. The per-session URL scheme is
deliberately ready for a future relay server (D9).

---

## D4 — Device geometry is LOCKED; React animates state only

**Decision.** The device artwork is a locked reconstruction. React may change only
**fill/color, glow/opacity, `transform` on knob/dot layers, LED state, self-test
state, softkey text, and waveform `d` data** — never geometry. The printed
mode-selector arcs never rotate.

**Why.** The training value depends on the panel matching the real hardware so
muscle memory transfers. Locking geometry prevents drift and "improvements" that
would erode fidelity.

**Consequences.** Any appearance change is a deliberate, documented alignment pass
measured against the manufacturer reference. See [`ART_DIRECTION.md`](ART_DIRECTION.md)
and `../visual-alignment-report.md`.

---

## D5 — One master SVG authored in JSX as the source of truth

**Decision.** The shipping device is a single master SVG authored in JSX
(`RSeriesDevice.jsx`, `viewBox 0 0 1440 1120`, 22 named layers). A frozen static
export is committed at `public/RSeries_Master.svg`.

**Why.** Authoring in JSX lets React bind state to individual named layers while
geometry stays fixed — animation without redrawing. One master keeps a single
source of truth for the look.

**Consequences.** The monolithic master is what renders today. Modular parts (D6)
must reassemble to the identical geometry.

---

## D6 — Reconstruct the device as a modular SVG library, one approved Industrial Design Pass at a time

**Decision.** Rebuild the device from the monolithic master into an approved
modular part library (`src/assets/rseries/{body,controls,lcd,icons,labels}/`), one
deliberate **Industrial Design Pass** at a time, each part reassembling to the
identical locked geometry.

- **Pass 1 — Body: complete. Body assets are LOCKED and APPROVED.**
- **Pass 2 — Controls Library: the next milestone (not started).**

**Why.** A monolith is hard to review and easy to drift. Small approved passes let
each part be reviewed (via the `/art-preview` exploded view) and frozen
independently.

**Consequences.** Until a part is approved and wired in, the master monolith (D5)
still ships. Approved body parts are frozen reference and may not be restyled
outside an alignment pass. See [`ROADMAP.md`](ROADMAP.md) and
[`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md).

---

## D7 — Facilitator-authoritative, illustrative (not clinical) simulation

**Decision.** The facilitator is the source of truth for the scenario; the device
is modeled honestly and the instructor drives the patient. Waveforms, vital ranges,
and energies are illustrative teaching approximations. Automatic behaviors
(auto-convert, capture, alarms) reduce instructor burden but never override intent.

**Why.** The tool teaches recognition and workflow, not clinical reference data.
Keeping the instructor authoritative fits how skills stations actually run.

**Consequences.** Nothing here is medical data or clinically exact. A fixed safety
label appears on every view (D10). Not a medical device; not FDA/CE cleared.

---

## D8 — Degrade, don't crash

**Decision.** Storage and channel access are wrapped
(`safeGetItem`/`safeSetItem`/`clearSession`); missing `BroadcastChannel` falls back
to `storage`-event sync; corrupt/partial stored state is merged onto defaults
(`sanitizeState`); render failures show an `ErrorBoundary` recovery screen.

**Why.** Private-mode, disabled storage, quota limits, and older browsers must not
break a live training session.

**Consequences.** A session may lose history on corrupt storage, but the app never
crashes mid-scenario. Verified by smoke tests and manual QA.

---

## D9 — Cross-device live sync is out of scope (URL scheme reserved)

**Decision.** No relay server ships. The per-session URL scheme is designed so a
small relay could later carry state between devices without changing the app model.

**Why.** Keeps D1 (no backend) intact while not painting the design into a corner.

**Consequences.** Learner and facilitator must share a machine/browser for live
sync today. Listed as a long-term goal in [`PROJECT_VISION.md`](PROJECT_VISION.md).

---

## D10 — Non-removable training-only safety label

**Decision.** Every user-facing view renders a fixed label: **"Training simulation
only. Not for clinical use."** (`SafetyLabel.jsx`).

**Why.** The tool visually resembles a real defibrillator; the disclaimer must be
unmissable and permanent to prevent any clinical misuse.

**Consequences.** The label is a hard requirement of every view and may not be
removed. See the disclaimer in [`PROJECT_VISION.md`](PROJECT_VISION.md).

---

## D11 — Deterministic event log with JSON/CSV/print exports; smoke-testable pure logic

**Decision.** Every meaningful action appends a timestamped, categorized event with
a context snapshot. Sessions export as JSON and event-log CSV, plus a printable
`/report`. Pure logic (session keys, scenarios, waveforms, report builders) lives
in React-free modules and is covered by `scripts/smoke.mjs`.

**Why.** Debrief, scoring, and records need an inspectable, reproducible trail.
Keeping logic pure lets Node verify it without a browser.

**Consequences.** `npm run smoke` (and `npm test` = build + smoke) guard the
logic; browser-only behavior is covered by manual QA (`QA_CHECKLIST.md`). Full CI
and component/visual-regression tests remain a partial roadmap item.

---

## D12 — Education vs. validation modes; session reset/duplicate

**Decision.** `learnerMode ∈ {standard, education, validation}`. Education shows a
learner guidance panel; validation hides it and flags the session for scoring.
Facilitators can **Reset Session** (clear the current run) or **Duplicate → New
Session** (copy config into a fresh id).

**Why.** The same device must support teaching (coaching visible) and assessment
(unaided, scored) without separate builds; instructors need to re-run cleanly.

**Consequences.** Reports/exports flag `validationMode`; the report shows a
VALIDATION banner. Behavior detail in
[`SIMULATOR_REQUIREMENTS.md`](SIMULATOR_REQUIREMENTS.md) §10–11.
