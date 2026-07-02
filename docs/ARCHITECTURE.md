# ARCHITECTURE

**Project:** ZOLL R Series Simulator
**Stack:** React 19 + Vite 8 (JavaScript/ESM), `react-router-dom` v7
**Last reviewed:** 2026-07-02

This document describes the **React architecture**: the roles, the engines that
drive them, and how state flows between windows. Behavior detail is in
[`SIMULATOR_REQUIREMENTS.md`](SIMULATOR_REQUIREMENTS.md); SVG structure and the
asset library in [`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md); appearance rules
in [`ART_DIRECTION.md`](ART_DIRECTION.md); rationale in
[`DECISIONS.md`](DECISIONS.md).

---

## High-level shape

A **fully client-side single-page app**. No server, no database. Two windows on
one origin (Learner + Facilitator) share one simulation state via
`BroadcastChannel`, mirrored to `localStorage`, scoped per session id.

```
                         index.html
                             │
                        main.jsx  ── BrowserRouter(basename=BASE_URL)
                             │        └ ErrorBoundary
                          App.jsx  ── reads ?session=… → SimulatorProvider(key=sessionId)
                             │
        ┌──────────┬─────────┴──────────┬───────────┬──────────────┐
       Home     Learner            Facilitator    Report        ArtPreview
        (/)     (/learner)         (/facilitator) (/report)     (/art-preview)
                    │                    │
                    └──── useSimulator() (shared state + actions) ────┘
                             │
            ┌────────────────┼─────────────────────────────┐
     State engine       Scenario engine             Waveform engine
  SimulatorContext.jsx    scenarios.js                waveforms.js
   (+ sessionKeys.js,
      report.js)
                             │
                   BroadcastChannel + localStorage  (keyed by session id)
                             │
        Component library (SVG)  ◄── RSeriesDevice / LcdScreen (+ modular assets)
        Asset library            ◄── src/assets/rseries/*, public/RSeries_Master.svg
```

---

## Entry & routing

- **`src/main.jsx`** — mounts React under `StrictMode`, wraps the app in an
  `ErrorBoundary` and a `BrowserRouter` whose `basename` derives from
  `import.meta.env.BASE_URL` (enables subpath deploys, e.g. GitHub Pages).
- **`src/App.jsx`** — reads `?session=…` from the URL (falls back to
  `DEFAULT_SESSION`) and renders `SimulatorProvider` **keyed on `sessionId`**, so
  switching sessions remounts a fresh, isolated provider. Declares routes:
  `/` (Home), `/learner`, `/facilitator`, `/report`, `/art-preview`, and a
  catch-all redirect to `/`.

| Route | View | Role |
|-------|------|------|
| `/` | `views/Home.jsx` | Session launcher (create id, open/copy role links). |
| `/learner` | `views/Learner.jsx` | Device screen; live mirror of shared state. |
| `/facilitator` | `views/Facilitator.jsx` | Instructor authoring console. |
| `/report` | `views/Report.jsx` | Printable per-session debrief report. |
| `/art-preview` | `views/ArtPreview.jsx` | **Dev/QA only** — exploded body-part CAD review; not part of the shipping simulator. |

---

## The two roles

- **Learner** (`src/views/Learner.jsx`) — read-only mirror. Renders the locked
  master device + live LCD, elapsed clock, shock/CPR flash, and the education
  guidance panel. The device's buttons are wired to device actions so the trainee
  can operate the unit; the facilitator can drive the same actions remotely.
- **Facilitator** (`src/views/Facilitator.jsx`) — the authoring console. Invokes
  action methods on the shared state (mode/rhythm/vitals/defib/sync/pacer/CPR/
  alarms/scenario/log/export). Hosts the dev-only Debug panel.

Both windows point at the **same session id** to stay in sync; a second window
with a different id runs an independent session.

---

## State engine — `src/sync/SimulatorContext.jsx`

The heart of the app (~1000 lines). Responsibilities:

- **Shared state model** — `DEFAULT_STATE` defines every field: vitals, mode,
  monitor/lead/size/connections, alarms + limits, self-test, defib/cardioversion
  device state, pacer, CPR, scenario settings, scenario-engine state, session
  metadata, and the event log.
- **Cross-window sync** — `SimulatorProvider(sessionId)` opens a session-scoped
  `BroadcastChannel` and mirrors state to a session-scoped `localStorage` key.
  The window that invokes an action runs its timers locally and broadcasts state
  changes; other windows mirror passively (an `applyingRemote` guard prevents
  echo). Late/reloaded windows request the current state on join and hydrate from
  storage.
- **Device logic** — all DEFIB/cardioversion sequencing, pacing capture, CPR
  feedback, alarm evaluation, and scenario application live here. Pure derivations
  are exported as functions: `pacingCaptured`, `cprAssess`, `monitorView`,
  `activeAlarms`, `eventCategory`.
- **Action API** — exposed through `useSimulator()`: `setMode, setEnergy,
  cycleEnergy, charge, analyze, cancelAnalyze, deliverShock, disarm, toggleSync,`
  pacer setters (`adjustPacerOutput/Rate`, live+commit variants, `setFourToOne`,
  `setPacerResponse`, `setCaptureMode`, …), CPR setters, monitor/lead/size/alarm
  setters, connection toggles, scenario controls (`loadScenario, advanceStep,
  forceDeteriorate, forceRosc, markSkill, addFacilitatorNote, toggleChecklist`),
  session controls (`reset, resetSession, duplicateSession, endSession`), and
  `clearLog`.
- **Event logging** — every action appends a timestamped, categorized event with
  a snapshot of device/patient context (`ctx`) to the per-session log (capped at
  the last 1000 events).
- **Resilience** — `safeGetItem`/`safeSetItem`/`clearSession` swallow storage
  failures; `hasBroadcastChannel` gates the channel with a `storage`-event
  fallback; `sanitizeState` merges any partial/corrupt stored state onto defaults
  so the UI never crashes on missing fields.
- **Constants exported:** `RHYTHMS`, `ENERGIES`, `SHOCK_OUTCOMES`, `LEADS`,
  `ECG_SIZES`, `LOG_CATEGORIES`, `DEFAULT_SESSION`.
- **Dev helper:** in `import.meta.env.DEV`, installs `window.__sim`
  (`dump/get/reset/loadScenario/simulateShock/simulatePacingCapture/
  simulateAlarm`).

### Session scope — `src/sync/sessionKeys.js`

Pure, React-free helpers so Node smoke tests and the browser share one truth:
`channelName(id)`, `storageKeyFor(id)`, `newSessionId()`, `DEFAULT_SESSION`.
Base namespace `zoll-r-series-sim`; storage key `zoll-r-series-sim:state:<id>`,
channel `zoll-r-series-sim:<id>`.

---

## Scenario engine — `src/sync/scenarios.js`

Declarative preset data (8 scenarios), each with `initial` state plus teaching/
validation metadata (`expectedActions`, `educationNotes`, `protocolHints`,
`checklist`, `outcomes`, `steps`, `level`). `getScenario(id)` looks one up. The
state engine applies `initial` on load and steps via `apply` patches; views read
the metadata by id (learner → guidance, facilitator → checklist).

---

## Waveform engine — `src/components/rseries/waveforms.js`

Generates SVG path data for the LCD traces: rhythm library (`ecgFor`,
`RHYTHM_KEYS`), `pacedPath`, `pacerSpikes`, `cprArtifactPath`, `PLETH_PATH`,
`CAPNO_PATH`, plus classifiers `isSyncable`, `isNonPerfusing`, `qrsMarkers`, and
`FLAT`. Produces **trace geometry only** — never device geometry.

---

## Reporting — `src/sync/report.js`

`buildSessionData`, `toCSV`, `eventAction`, `iso`, `exportSessionJSON`,
`exportEventCSV`, `download`. Consumed by the facilitator log viewer and the
`/report` view. See [`SIMULATOR_REQUIREMENTS.md`](SIMULATOR_REQUIREMENTS.md) §13.

---

## Component library (SVG)

- **`RSeriesDevice.jsx`** — the **locked master SVG** authored in JSX
  (`viewBox 0 0 1440 1120`, 22 named layers). React binds state to layers;
  geometry never changes. This is what the shipping learner device renders.
- **`LcdScreen.jsx`** — the live LCD overlay (fixed 673×515 logical space),
  composited into the empty LCD opening.
- **`RSeriesPanel.jsx`** — thin device+LCD composition wrapper.
- Supporting: `ErrorBoundary.jsx`, `SafetyLabel.jsx`, `rseries.css`
  (colors/animation only — no geometry).

## Asset library

- `public/RSeries_Master.svg` — frozen static export of the master (reference/
  regression).
- `src/assets/rseries/{body,controls,lcd,icons,labels,reference}/` — the modular
  asset taxonomy, built one approved **Industrial Design Pass** at a time. The
  `body/` parts are **built, approved, and locked** (Pass 1); `controls/` is the
  **next** pass (scaffolded — `.gitkeep`); the remaining groups are scaffold. See
  [`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md) and [`ROADMAP.md`](ROADMAP.md).

---

## Data-flow summary

1. Facilitator (or learner) invokes an action via `useSimulator()`, which mutates
   the shared state and appends an event.
2. The provider persists to the session `localStorage` key and broadcasts on the
   session channel.
3. The other same-session window mirrors the new state (guarded against echo).
4. Views re-render: the LCD overlay recomputes waveforms/values; device layers
   update fill/glow/transform per state — **geometry unchanged**.
5. Reports/exports read the accumulated state + event log on demand.

## Design constraints (non-negotiable)

- **No backend.** Everything is client-side and static.
- **Sessions never cross-sync.** Scope is by id, everywhere.
- **Geometry is locked.** React animates state only (see
  [`ART_DIRECTION.md`](ART_DIRECTION.md)).
- **Degrade, don't crash.** Storage/channel failures fall back safely.
