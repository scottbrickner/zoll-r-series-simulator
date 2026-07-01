# Manual QA Checklist — ZOLL R Series Simulator

Run before any release/deploy. Use two browser windows on one machine
(facilitator + learner) opened from the launcher with the **same session id**.
A second pair with a **different session id** is used for isolation tests.

> Training simulation only. Not for clinical use.

## Setup
- [ ] `npm install` then `npm run build` completes with no errors.
- [ ] `npm run smoke` passes (logic smoke tests).
- [ ] `npm run preview` (or `npm run dev`) serves the app.

## Session launcher (`/`)
- [ ] Launcher shows a generated session id, **New session**, and Facilitator/Learner cards.
- [ ] **New session** generates a different id.
- [ ] **Open window** opens `/facilitator?session=<id>` / `/learner?session=<id>`.
- [ ] **Copy link** copies the correct URL (shows "Copied ✓").
- [ ] Safety footer "Training simulation only. Not for clinical use." is visible.

## Learner / facilitator sync (same session)
- [ ] Changing rhythm/vitals on facilitator updates the learner LCD live.
- [ ] Mode change (Monitor/Defib/Pacer) reflects on the learner dial + screen.
- [ ] Reloading either window restores the current state.

## Independent session IDs
- [ ] Open a second facilitator with a **different** session id.
- [ ] Changes in session A do **not** appear in session B and vice-versa.
- [ ] Event logs differ between the two sessions.

## MONITOR mode
- [ ] HR, SpO₂, NIBP (sys/dia/mean), EtCO₂, RR, elapsed time, lead, size show.
- [ ] DEFIB charge/shock controls do nothing in MONITOR mode.
- [ ] LEAD button cycles I, II, III, aVR, aVL, aVF, PADDLES, PADS (logged).
- [ ] SIZE button cycles x0.5–x3 and the ECG amplitude visibly scales (logged).

## DEFIB mode + charging
- [ ] Energy select cycles realistic joule values.
- [ ] CHARGE shows a charging progress bar then "DEFIB <n>J READY".
- [ ] SHOCK button illuminates only when charged.

## Shock delivery
- [ ] SHOCK delivers only when charged; shock artifact flashes/disrupts ECG.
- [ ] Shock count increments; charged state clears.
- [ ] Post-shock rhythm converts per the facilitator outcome.

## Failed shock attempt
- [ ] Pressing SHOCK when not charged does nothing and logs `shock_failed`.

## Synchronized cardioversion
- [ ] Sync toggle shows "SYNC" and markers above each QRS.
- [ ] Shock waits for the next QRS, logs as `sync_shock` (sync: true).

## PACER capture / non-capture
- [ ] Output ≥ threshold → "CAPTURE", paced QRS after spikes, HR = pacer rate.
- [ ] Output < threshold → "NO CAPTURE", bare spikes over underlying rhythm.
- [ ] Capture/loss transitions are logged.

## 4:1 button
- [ ] Holding 4:1 displays spikes at ¼ rate; release returns to normal (logged press/release).

## CPR feedback
- [ ] CPR active shows rate/depth, release bar, PPI, feedback message + ECG artifact.
- [ ] Stopping CPR removes artifact and starts the idle timer.

## Alarms
- [ ] A value crossing a limit flashes the parameter + shows an alarm banner.
- [ ] ALARM SUSPEND silences/flags suspended with a countdown; auto-resumes.
- [ ] Triggers/suspend/resume are logged.

## Disconnected leads / pads
- [ ] Leads off → "CHECK ECG LEADS", flat ECG, dashed HR.
- [ ] Pads off in DEFIB → "CHECK PADS".
- [ ] SpO₂ / NIBP / EtCO₂ unavailable → dashed values.

## Scenario loading
- [ ] Selecting + Load applies the scenario's mode/rhythm/vitals/checklist.
- [ ] Advance step changes state per the scenario; Force deterioration / Force ROSC work.

## Education mode
- [ ] Guidance panel shows device explanation, expected actions, hints, CPR coaching.

## Validation mode
- [ ] Learner guidance is hidden; facilitator checklist remains; pass/fail can be marked.

## Event log
- [ ] Events appear with timestamp/type/context; category filters work; Clear Log empties it.

## JSON export
- [ ] Export JSON downloads a file with session metadata, event log, checklist, notes, outcome.

## CSV export
- [ ] Export CSV downloads one row per event with the documented columns.

## Print report (`/report`)
- [ ] Report opens scoped to the session: summary, checklist table, timeline, shocks, pacing, CPR, alarms, notes, outcome.
- [ ] Validation-mode sessions show the VALIDATION banner. Print works.

## Error handling
- [ ] Corrupt a stored session (devtools: set `zoll-r-series-sim:state:<id>` to `"{bad"`), reload → app recovers (fresh state) or the error screen offers a reset.
- [ ] App still loads with storage disabled (private mode) — no crash.

## Final
- [ ] No console errors across launcher, learner, facilitator, report.
