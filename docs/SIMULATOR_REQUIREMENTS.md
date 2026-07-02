# SIMULATOR REQUIREMENTS

**Project:** ZOLL R Series Simulator
**Type:** Functional specification
**Last reviewed:** 2026-07-02

This is the complete functional specification for simulator **behavior**. It
describes what each part of the system does, the state it reads/writes, and the
events it logs. Geometry/appearance requirements live in
[`ART_DIRECTION.md`](ART_DIRECTION.md) and
[`COMPONENT_LIBRARY.md`](COMPONENT_LIBRARY.md); architecture in
[`ARCHITECTURE.md`](ARCHITECTURE.md); milestone status in [`ROADMAP.md`](ROADMAP.md).

Authoritative source: `src/sync/SimulatorContext.jsx` (state engine + device
logic), `src/sync/scenarios.js`, `src/sync/report.js`,
`src/components/rseries/waveforms.js`, and the views under `src/views/`.

> **Training simulation only. Not for clinical use.** All values, rhythms, and
> energies are illustrative teaching approximations. See
> [`PROJECT_VISION.md`](PROJECT_VISION.md).

---

## 1. Roles and windows

| Route | Role | Responsibility |
|-------|------|----------------|
| `/` | Launcher | Create/enter a session id; open or copy Facilitator/Learner links. |
| `/facilitator` | Instructor console | Drive the scenario, device, patient, scoring, log, exports. |
| `/learner` | Device screen | The trainee's view of the device; mirrors facilitator state live. |
| `/report` | Printable report | Per-session debrief summary. |
| `/art-preview` | Dev/QA | Artwork preview for alignment review. |

### 1.1 Learner (`/learner`) — requirements

- Renders the **locked master device** with a live LCD reflecting shared state.
- Shows an **elapsed clock** and **shock/CPR flash** effects from `lastEvent`.
- In **education mode**, shows a guidance panel: device explanation, expected
  actions, protocol hints, CPR coaching (from the loaded scenario).
- In **validation mode**, the guidance panel is **hidden**.
- Displays the safety label on every render.
- Read-only mirror of state; it does not author scenario control (the learner
  "operates the device" conceptually; the facilitator authors patient/scenario).

### 1.2 Facilitator (`/facilitator`) — requirements

- Controls: mode, rhythm, vitals (HR, SpO₂, NIBP sys/dia/mean, EtCO₂, RR),
  defib energy, charge/analyze/shock/disarm, SYNC, pacer rate/output/threshold/
  capture mode, CPR inputs, lead/size, connection toggles, alarm limits and
  suspend, self-test state.
- Scenario: load, advance step, force deterioration, force ROSC, set outcome,
  checklist toggles, facilitator notes.
- Learner mode selector: standard / education / validation.
- Event-log viewer with category filters and Clear Log; JSON and CSV export;
  link to `/report`.
- **Reset Session** and **Duplicate → New Session**.
- **Dev-only** Debug panel + `window.__sim` helpers (development build only).

---

## 2. Monitoring

Reads/derives via `monitorView(state)`; drives the LCD numerics and traces.

- **Displayed parameters:** HR, SpO₂, NIBP (sys/dia/mean), EtCO₂, RR, elapsed
  time, selected **lead**, ECG **size** (gain).
- **Leads:** cycle `I, II, III, aVR, aVL, aVF, PADDLES, PADS` (`LEADS`); logged
  `lead_change`.
- **Size / gain:** cycle `x0.5, x1, x1.5, x2, x3` (`ECG_SIZES`); ECG amplitude
  scales visibly; logged `size_change`.
- **Pleth / capno:** toggleable traces (`plethOn`, `capnoOn`); logged `pleth` /
  `capno`.
- **Connections:** `leadsConnected`, `padsConnected`, `spo2Connected`,
  `nibpAvailable`, `etco2Connected`. When disconnected:
  - Leads off → "CHECK ECG LEADS", flat ECG, dashed HR.
  - Pads off in Defib → "CHECK PADS".
  - SpO₂ / NIBP / EtCO₂ unavailable → dashed values.
  - Logged `connection`.
- **Non-perfusing rhythms** (`isNonPerfusing`, e.g. VF/VT/Asystole/PEA) suppress
  a perfusing HR/BP as appropriate.
- Defib charge/shock controls do nothing in **Monitor** mode.

---

## 3. Defibrillation (Defib mode)

Owned by the state engine's DEFIB logic. Sequence: **select → charge → ready →
shock**, with disarm/timeout.

- **Energy select:** realistic ZOLL biphasic joules
  `ENERGIES = [1,2,3,5,7,10,15,20,30,50,70,85,100,120,150,200]`; `setEnergy`.
- **Charge:** `charge()` runs a charging progress model (`charging`,
  `chargeProgress 0..1`) → `shockReady`; logs `charge_attempt`, then
  `charge_complete`. LCD shows a charging bar then "DEFIB <n>J READY".
- **Analyze (AED-style advisory):** `analyze()` → `analyze_attempt` →
  `analyze_result` (`'shock'` / `'noshock'`, from scenario `shockable`), or
  `analyze_cancel`. Result: `analyzeResult`.
- **Shock delivery:** `deliverShock()` delivers **only when charged**; SHOCK
  illuminates only when `shockReady`. On delivery:
  - shock artifact flashes/disrupts the ECG (`Post-Shock Artifact`);
  - `shockCount` increments; charged state clears;
  - post-shock rhythm applied per facilitator outcome (`autoConvert`,
    `shockOutcome ∈ {none, convert, deteriorate, rosc}`, `postShockRhythm`);
  - logged `shock`.
- **Failed shock:** pressing SHOCK when not charged does nothing; logs
  `shock_failed`.
- **Disarm / timeout:** `disarm()` clears the charge; logs `disarm`.

---

## 4. Synchronized cardioversion (Sync)

- **SYNC toggle:** `toggleSync()` → `syncEnabled`; LCD shows "SYNC" and QRS
  markers above each complex; logged `sync_toggle`.
- **Syncable rhythms:** `isSyncable(rhythm)` gates sync markers/behavior.
- **Synchronized shock:** with sync enabled, `deliverShock()` **waits for the
  next QRS** (`sync_wait`) then delivers on the R wave; logged `shock` with
  `sync: true`.
- **Energy escalation** supported across successive shocks.
- Reference scenario: *Unstable SVT — Cardioversion* (SYNC + 50–100 J).

---

## 5. Pacing (Pacer mode)

Capture modeled by `pacingCaptured(state)`.

- **Rate (PPM):** `setPacerRateLive` / `rate_change`.
- **Output (mA):** `setPacerOutputLive` / `output_change`.
- **Capture threshold & mode:** `captureThreshold`,
  `captureMode ∈ {auto, on, off}`; `threshold_change`, `capture_mode`.
- **Capture logic:**
  - Output ≥ threshold → **CAPTURE**: paced QRS after spikes, HR follows pacer
    rate; logs `capture_achieved`.
  - Output < threshold → **NO CAPTURE**: bare pacer spikes over the underlying
    rhythm (`underlyingRhythm`); logs `loss_of_capture`.
  - `intermittentCapture` models inconsistent capture.
- **4:1 button:** `fourToOne` (hold) → spikes at ¼ rate; release restores;
  logged `four_to_one`.
- **Waveforms:** `pacedPath()` and `pacerSpikes()` render capture / non-capture.
- Reference scenario: *Symptomatic Bradycardia — Pacing*.

---

## 6. CPR feedback

CPR quality modeled by `cprAssess(state)`.

- **Inputs:** `cprActive`, `cprRate` (comp/min), `cprDepth` (mm),
  `cprReleaseQuality ∈ {full, partial, leaning}`, `cprArtifactIntensity 0..1`.
- **Derived:** `cprPerfusionIndicator 0..1`, auto `cprFeedbackMessage`,
  `cprIdleTime`.
- **Display:** rate/depth, release bar, perfusion/PPI indicator, feedback
  message, and an ECG **compression artifact** (`cprArtifactPath`).
- **Lifecycle:** `cpr_started`, `cpr_stopped`, `cpr_feedback`, `cpr_idle`,
  `cpr_idle_reset`; facilitator overrides via `cpr_rate` / `cpr_depth` /
  `cpr_feedback_set`.
- Stopping CPR removes the artifact and starts the idle timer.
- Reference scenario: *CPR Quality Validation* (targets: rate 100–120/min,
  depth 5–6 cm, full recoil, minimal interruptions).

---

## 7. Alarms

Computed by `activeAlarms(state)` against `alarmLimits`.

- **Limits:** HR high/low, SpO₂ low, NIBP sys high/low, EtCO₂ high/low, RR
  high/low (defaults in `DEFAULT_STATE.alarmLimits`); editable via `alarm_limit`.
- **Trigger:** a value crossing a limit flashes the parameter and shows an alarm
  banner; logged `alarm_triggered`.
- **Suspend:** `alarmsSuspended` with `alarmSuspendUntil` and
  `alarmSuspendDuration` (default 120 s); shows a countdown and auto-resumes;
  logged `alarm_suspended` / `alarm_resumed`.
- **Test alarm:** `testAlarm`.

---

## 8. Rhythms & waveforms

`RHYTHMS` (14): Normal Sinus, Sinus Bradycardia, Sinus Tachycardia, SVT, Atrial
Fibrillation, Ventricular Tachycardia, Ventricular Fibrillation, Torsades de
Pointes, Asystole, PEA, Paced (Capture), Paced (Non-Capture), CPR Artifact,
Post-Shock Artifact. Plus pleth and capnogram tiles. These are **illustrative
teaching approximations, not clinically exact.** See
[`ROADMAP.md`](ROADMAP.md) §17 (Waveform library) for planned expansion.

---

## 9. Scenario engine

Eight presets in `scenarios.js`, each with `initial`, `expectedActions`,
`educationNotes`, `protocolHints`, `checklist`, `outcomes`, and `steps`:

`vf-arrest`, `pulseless-vt`, `svt-cardioversion`, `brady-pacing`, `asystole-pea`,
`rosc-monitoring`, `cpr-quality`, `monitor-unstable`.

- **Load:** `loadScenario(id)` applies only `initial` to shared state; metadata
  is looked up by id by learner (guidance) and facilitator (checklist).
- **Advance:** `advanceStep()` applies the next step's `apply` patch; logs
  `scenario_step`.
- **Force events:** `forceRosc()` (`force_rosc`), force-deterioration
  (`force_deteriorate`).
- **Outcome:** `scenario_outcome`.

---

## 10. Education mode

- `learnerMode = 'education'`.
- Learner sees a guidance panel: device explanation, expected actions, protocol
  hints, and CPR coaching from the loaded scenario.
- Facilitator checklist remains available.
- Purpose: teaching/coaching, not scoring.

## 11. Validation mode

- `learnerMode = 'validation'`.
- Learner guidance is **hidden**; the trainee performs unaided.
- Facilitator checklist remains for scoring; pass/fail per item
  (`toggleChecklist` → `checklist_item`); outcome recorded.
- Report and exports flag `validationMode: true`; report shows a VALIDATION
  banner.

---

## 12. Event logging

Every meaningful action appends a timestamped event with context. Types include:

`state`, `session_started`, `vitals`, `alarm_limit`, `connection`, `pleth`,
`capno`, `self_test`, `lead_change`, `size_change`, `charge_attempt`,
`charge_complete`, `disarm`, `analyze_attempt`, `analyze_result`,
`analyze_cancel`, `shock_failed`, `shock`, `sync_wait`, `sync_toggle`,
`capture_achieved`, `loss_of_capture`, `output_change`, `rate_change`,
`threshold_change`, `capture_mode`, `four_to_one`, `patient_response`,
`cpr_started`, `cpr_stopped`, `cpr_feedback`, `cpr_feedback_set`, `cpr_rate`,
`cpr_depth`, `cpr_idle`, `cpr_idle_reset`, `scenario_step`, `force_deteriorate`,
`force_rosc`, `scenario_outcome`, `checklist_item`, `facilitator_note`,
`notes_panel`, `alarm_triggered`, `alarm_suspended`, `alarm_resumed`.

- **Categories** (`eventCategory`, `LOG_CATEGORIES`): `defib`, `sync`, `pacer`,
  `cpr`, `monitor`, `alarms`, `scenario`, `note` — used by the log filter.
- Logs are **per session**; cleared by Clear Log or Reset Session.

---

## 13. Reports & exports

Built by `report.js`.

- **JSON export** (`exportSessionJSON`): `buildSessionData(state)` — session id,
  start/end/exported timestamps, learner mode + validation flag, scenario id/
  name/step, learner/evaluator names, outcome, shock count, checklist, notes,
  and the full event log. Filename `rseries-session-<id>.json`.
- **CSV export** (`exportEventCSV`): one row per event across fixed columns —
  `timestamp, eventType, action, mode, rhythm, heartRate, energy, shockCount,
  syncEnabled, pacerOutput, pacerRate, capture, cprRate, cprDepth, alarmState,
  scenarioStep, note`. Filename `rseries-eventlog-<id>.csv`.
- **Printable report** (`/report`): per-session summary — checklist table,
  timeline, shocks, pacing, CPR, alarms, notes, outcome; VALIDATION banner when
  applicable; browser print supported.

---

## 14. Sessions, sync & resilience

- State shared across same-session windows via `BroadcastChannel` mirrored to
  `localStorage`, **keyed by session id** (`zoll-r-series-sim:<id>` /
  `zoll-r-series-sim:state:<id>`). Different sessions never cross-sync.
- Late-opened/reloaded windows hydrate from the last known session state.
- **Reset Session** clears the current run; **Duplicate → New Session** copies
  config into a fresh id.
- **Resilience:** corrupt/private-mode/disabled storage degrades to fresh state
  or a recovery screen; absent `BroadcastChannel` falls back to `storage`-event
  sync (same-origin tabs). No crash.

---

## 15. Non-functional requirements

- **Offline / static:** no backend; `npm run build` → static `dist/`.
- **Deployable under a subpath** via `BASE_URL` (SPA fallback required).
- **Safety label** present on every user-facing view — non-removable.
- **Verifiable logic** covered by `scripts/smoke.mjs`; full manual QA in
  `QA_CHECKLIST.md`.
- **No change may alter the locked device geometry.** Behavior only.
