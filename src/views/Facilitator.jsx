import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ENERGIES,
  LOG_CATEGORIES,
  RHYTHMS,
  SHOCK_OUTCOMES,
  useSimulator,
} from '../sync/SimulatorContext'
import { SCENARIOS, DEFIB_SCENARIO_IDS, getScenario } from '../sync/scenarios'
import { exportSessionJSON, exportEventCSV } from '../sync/report'
import { getFacilitatorRole, lockFacilitator, getSmeScenarioIds, setSmeScenarioIds } from '../config/access'
import FacilitatorBasic from './FacilitatorBasic'
import SafetyLabel from '../components/SafetyLabel'

/**
 * "Pull from Clinical Patient Simulator" - direct user request to let this
 * device be started from whatever a companion sim (the "Clinical Patient
 * Simulator" bundle, a separate deployment) currently has running, for
 * realistic threshold/cardioversion/defib practice setup.
 *
 * Deliberately clipboard-mediated, NOT a live network fetch: this project's
 * own docs/DECISIONS.md D1 ("no server, database, account, or network
 * dependency") and D9 (cross-device live sync explicitly deferred/out of
 * scope) rule out adding a Supabase/backend client here - reconciled by
 * treating the OTHER app's "Copy for ZOLL" button + a paste here as one
 * facilitator manually relaying two numbers between two open tabs, no
 * different in kind from reading a value off one screen and typing it into
 * another. Zero new dependencies, zero network calls.
 *
 * Translates the companion app's own 17-rhythm vocabulary onto this app's
 * 14-entry RHYTHMS list - the two don't overlap 1:1 (this device has no AV-
 * block/junctional granularity, appropriate for a defib/pacer/monitor
 * device rather than a full telemetry teaching tool), so unmapped rhythms
 * report "no close equivalent" rather than guessing.
 */
const RHYTHM_FROM_CLINICAL_SIM = {
  'Sinus Rhythm': 'Normal Sinus',
  'Sinus Tachycardia': 'Sinus Tachycardia',
  'Sinus Bradycardia': 'Sinus Bradycardia',
  'Atrial Fibrillation': 'Atrial Fibrillation',
  'Supraventricular Tachycardia': 'SVT',
  'PEA': 'PEA',
  'Ventricular Tachycardia': 'Ventricular Tachycardia',
  'Torsades de Pointes': 'Torsades de Pointes',
  'Ventricular Fibrillation': 'Ventricular Fibrillation',
  'Asystole': 'Asystole',
}

/** Accepts either the Console's own "Rhythm, NNN bpm" copy format or a raw {rhythm,hr} JSON blob (for anyone scripting this) - returns {rhythm, hr} or null if neither shape parses. */
function parsePulledSnapshot(text) {
  const trimmed = (text || '').trim()
  if (!trimmed) return null
  try {
    const obj = JSON.parse(trimmed)
    if (obj && typeof obj.rhythm === 'string' && Number.isFinite(obj.hr)) return { rhythm: obj.rhythm, hr: obj.hr }
  } catch { /* not JSON - fall through to the plain-text format */ }
  const m = trimmed.match(/^(.+?),\s*(\d+(?:\.\d+)?)\s*bpm?\s*$/i)
  if (m) return { rhythm: m[1].trim(), hr: Math.round(parseFloat(m[2])) }
  return null
}

/**
 * Facilitator view — controls that drive the learner's device in real time,
 * including DEFIB / synchronized cardioversion behavior and a validation log.
 */
export default function Facilitator() {
  const sim = useSimulator()
  const { state, update, reset } = sim
  const [role, setRole] = useState(getFacilitatorRole())
  const [pick, setPick] = useState(state.scenarioId || SCENARIOS[0].id)
  const [note, setNote] = useState('')
  const [pullText, setPullText] = useState('')
  const [pullStatus, setPullStatus] = useState('')
  const [logFilter, setLogFilter] = useState('all')
  const [smeIds, setSmeIds] = useState(() => getSmeScenarioIds() || DEFIB_SCENARIO_IDS)
  const toggleSme = (id) => {
    const next = smeIds.includes(id) ? smeIds.filter((x) => x !== id) : [...smeIds, id]
    setSmeIds(next)
    setSmeScenarioIds(next)
  }
  const applyPull = () => {
    const parsed = parsePulledSnapshot(pullText)
    if (!parsed) {
      setPullStatus('Could not read that - paste the Console\'s own "Copy for ZOLL" text, or a rhythm name and rate like "Sinus Bradycardia, 45 bpm".')
      return
    }
    const mapped = RHYTHM_FROM_CLINICAL_SIM[parsed.rhythm]
    if (!mapped) {
      setPullStatus(`"${parsed.rhythm}" has no close equivalent in this device's rhythm list - nothing changed. Pick one from Rhythm above instead.`)
      return
    }
    update({ rhythm: mapped, hr: parsed.hr })
    setPullStatus(`Applied ${mapped} at ${parsed.hr} bpm from the Clinical Patient Simulator. Continue independently from here.`)
  }

  // Bedside SMEs get the locked basic view; NPD/NE unlock the full console.
  if (role !== 'educator') return <FacilitatorBasic onUnlock={() => setRole('educator')} />

  const scenario = getScenario(state.scenarioId)
  const fullLog = state.eventLog || []
  const shownLog = logFilter === 'all' ? fullLog : fullLog.filter((e) => e.category === logFilter)
  const routeFor = (role) => `${import.meta.env.BASE_URL}${role}?session=${state.sessionId}`

  return (
    <div className="facilitator">
      <header className="facilitator__header">
        <div>
          <h1>Facilitator Console</h1>
          <p className="muted" style={{ margin: 0 }}>Session <strong>{state.sessionId}</strong></p>
        </div>
        <div className="facilitator__header-actions">
          <button className="btn" onClick={() => window.open(routeFor('learner'), '_blank')}>
            Open learner window
          </button>
          <button className="btn btn--ghost" onClick={() => { lockFacilitator(); setRole('sme') }} title="Return to basic (SME) mode">
            Lock (SME)
          </button>
          <Link className="btn btn--ghost" to="/">
            Exit
          </Link>
        </div>
      </header>

      <div className="facilitator__grid">
        <Panel title="Scenario">
          <Field label="Scenario">
            <select value={pick} onChange={(e) => setPick(e.target.value)}>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
              ))}
            </select>
          </Field>
          <div className="row">
            <button className="btn btn--primary" onClick={() => sim.loadScenario(pick)}>Load</button>
            <button className="btn btn--ghost" onClick={sim.resetScenario} disabled={!state.scenarioId}>Reset scenario</button>
          </div>
          <div className="row" style={{ marginTop: '0.5rem' }}>
            <button className="btn" onClick={sim.advanceStep} disabled={!state.scenarioId}>Advance step ▸</button>
            <button className="btn btn--danger" onClick={sim.forceDeteriorate}>Force deterioration</button>
            <button className="btn" onClick={sim.forceRosc}>Force ROSC</button>
          </div>
          {scenario && (
            <p className="muted">
              Loaded: <strong>{scenario.name}</strong> · step {state.scenarioStep + 1}
              {scenario.steps ? `/${scenario.steps.length}` : ''}
              {scenario.steps && scenario.steps[state.scenarioStep] ? ` — ${scenario.steps[state.scenarioStep].label}` : ''}
            </p>
          )}

          <Field label="Learner mode">
            <div className="segmented">
              {['standard', 'education', 'validation'].map((m) => (
                <button
                  key={m}
                  className={`segmented__btn ${state.learnerMode === m ? 'is-active' : ''}`}
                  onClick={() => sim.setLearnerMode(m)}
                >
                  {m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </Field>
          <Toggle on={state.notesPanelOn} onClick={() => sim.setNotesPanel(!state.notesPanelOn)} label="Learner notes panel" />

          <div className="row" style={{ marginTop: '0.6rem' }}>
            <button className={`btn ${state.running ? 'btn--danger' : 'btn--primary'}`} onClick={() => update({ running: !state.running })}>
              {state.running ? 'Stop monitoring' : 'Start monitoring'}
            </button>
            <button className="btn btn--ghost" onClick={reset}>Full reset</button>
          </div>
        </Panel>

        <Panel title="SME scenario access">
          <p className="muted" style={{ marginTop: 0 }}>
            Choose which scenarios bedside SMEs may run in the locked (basic) facilitator. Saved on this station.
          </p>
          <div style={{ display: 'grid', gap: 6 }}>
            {SCENARIOS.map((s) => (
              <label key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={smeIds.includes(s.id)} onChange={() => toggleSme(s.id)} />
                <span>{s.name} <span className="muted">({s.level})</span></span>
              </label>
            ))}
          </div>
          <div className="row" style={{ marginTop: '0.6rem' }}>
            <button className="btn btn--ghost" onClick={() => { setSmeIds(DEFIB_SCENARIO_IDS); setSmeScenarioIds(DEFIB_SCENARIO_IDS) }}>Reset to defib default</button>
          </div>
        </Panel>

        <Panel title="Validation & Checklist">
          <div className="row">
            <Field label="Learner">
              <input type="text" value={state.learnerName} placeholder="name…" onChange={(e) => sim.setLearnerName(e.target.value)} />
            </Field>
            <Field label="Evaluator">
              <input type="text" value={state.evaluatorName} placeholder="name…" onChange={(e) => sim.setEvaluatorName(e.target.value)} />
            </Field>
          </div>
          {scenario ? (
            <>
              <div className="checklist">
                {(state.checklist || []).map((c) => (
                  <label className="checklist__item" key={c.id}>
                    <input type="checkbox" checked={!!c.done} onChange={() => sim.toggleChecklist(c.id)} />
                    <span className={c.done ? 'is-done' : ''}>{c.label}</span>
                  </label>
                ))}
              </div>

              <Field label="Outcome">
                <select value={state.scenarioOutcome || ''} onChange={(e) => e.target.value && sim.markSkill(e.target.value)}>
                  <option value="">— select outcome —</option>
                  {(scenario.outcomes || []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <div className="row">
                <button className="btn btn--primary" onClick={() => sim.markSkill('PASSED')}>Mark passed</button>
                <button className="btn btn--danger" onClick={() => sim.markSkill('FAILED')}>Mark failed</button>
              </div>
              {state.scenarioOutcome && <p className="muted">Outcome: <strong>{state.scenarioOutcome}</strong></p>}

              <Field label="Add facilitator note">
                <div className="row">
                  <input type="text" value={note} placeholder="observation…" onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { sim.addFacilitatorNote(note); setNote('') } }} />
                  <button className="btn" onClick={() => { sim.addFacilitatorNote(note); setNote('') }}>Add</button>
                </div>
              </Field>
              {(state.facilitatorNotes || []).length > 0 && (
                <ul className="notes-list">
                  {state.facilitatorNotes.map((n, i) => (
                    <li key={i}><span className="muted">{fmtTime(n.t)}</span> {n.text}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="muted">Load a scenario to enable the checklist.</p>
          )}
        </Panel>

        <Panel title="CPR Feedback">
          <div className="row">
            <button
              className={`btn ${state.cprActive ? 'btn--danger' : 'btn--primary'}`}
              onClick={sim.toggleCpr}
            >
              {state.cprActive ? 'Stop CPR' : 'Start CPR'}
            </button>
            <button className="btn btn--ghost" onClick={sim.resetCprIdle}>
              Reset idle timer
            </button>
          </div>

          <Slider
            label="Compression rate"
            unit="/min"
            min={60}
            max={160}
            value={state.cprRate}
            onChange={sim.setCprRateLive}
            onCommit={sim.commitCprRate}
          />
          <Slider
            label="Compression depth"
            unit="mm"
            min={20}
            max={75}
            value={state.cprDepth}
            onChange={sim.setCprDepthLive}
            onCommit={sim.commitCprDepth}
          />
          <Field label="Release quality">
            <div className="segmented">
              {[['full', 'Full'], ['partial', 'Partial'], ['leaning', 'Leaning']].map(([q, lbl]) => (
                <button
                  key={q}
                  className={`segmented__btn ${state.cprReleaseQuality === q ? 'is-active' : ''}`}
                  onClick={() => sim.setCprRelease(q)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </Field>
          <Slider
            label="Artifact intensity"
            unit=""
            min={0}
            max={100}
            value={Math.round(state.cprArtifactIntensity * 100)}
            onChange={(v) => sim.setCprArtifactLive(v / 100)}
            onCommit={(v) => sim.commitCprArtifact(v / 100)}
          />
          <Field label="Feedback message">
            <select
              value={state.cprFeedbackMessage}
              onChange={(e) => sim.setCprFeedbackMessage(e.target.value)}
            >
              <option value="">Auto (device)</option>
              {['GOOD COMPRESSIONS', 'PUSH HARDER', 'PUSH FASTER', 'SLOW DOWN', 'FULLY RELEASE', 'RESUME CPR'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <p className="muted">
            {state.cprActive
              ? `Perfusion ${Math.round(state.cprPerfusionIndicator * 100)}%`
              : state.cprIdleTime > 0
                ? `Idle ${state.cprIdleTime}s`
                : 'CPR stopped'}
          </p>
        </Panel>

        <Panel title="Rhythm & Vitals">
          <Field label="Rhythm">
            <select
              value={state.rhythm}
              onChange={(e) => update({ rhythm: e.target.value })}
            >
              {RHYTHMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pull from Clinical Patient Simulator">
            <div className="row">
              <input type="text" value={pullText} placeholder='paste "Copy for ZOLL" text from the Console…'
                onChange={(e) => setPullText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyPull() }} />
              <button className="btn" onClick={applyPull}>Apply</button>
            </div>
            {pullStatus && <p className="muted">{pullStatus}</p>}
          </Field>

          <Slider
            label="Heart rate" unit="bpm" min={0} max={220} value={state.hr}
            onChange={(v) => sim.setVitalLive('hr', v)} onCommit={(v) => sim.commitVital('hr', v)}
          />
          <Slider
            label="SpO₂" unit="%" min={50} max={100} value={state.spo2}
            onChange={(v) => sim.setVitalLive('spo2', v)} onCommit={(v) => sim.commitVital('spo2', v)}
          />
          <Slider
            label="EtCO₂" unit="mmHg" min={0} max={80} value={state.etco2}
            onChange={(v) => sim.setVitalLive('etco2', v)} onCommit={(v) => sim.commitVital('etco2', v)}
          />
          <Slider
            label="Resp rate" unit="/min" min={0} max={50} value={state.rr}
            onChange={(v) => sim.setVitalLive('rr', v)} onCommit={(v) => sim.commitVital('rr', v)}
          />
          <div className="row">
            <Slider
              label="NIBP sys" unit="" min={40} max={220} value={state.nibp.sys}
              onChange={(v) => sim.setNibpLive('sys', v)} onCommit={(v) => sim.commitNibp('sys', v)}
            />
            <Slider
              label="NIBP dia" unit="" min={20} max={140} value={state.nibp.dia}
              onChange={(v) => sim.setNibpLive('dia', v)} onCommit={(v) => sim.commitNibp('dia', v)}
            />
            <Slider
              label="NIBP mean" unit="" min={30} max={180} value={state.nibp.mean}
              onChange={(v) => sim.setNibpLive('mean', v)} onCommit={(v) => sim.commitNibp('mean', v)}
            />
          </div>
        </Panel>

        <Panel title="Monitoring & Connections">
          <p className="muted">Lead: <strong>{state.lead}</strong> · Size: <strong>x{state.ecgSize}</strong> (cycle on the device)</p>
          <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
            <Toggle on={state.leadsConnected} onClick={() => sim.setLeadsConnected(!state.leadsConnected)} label="ECG leads" />
            <Toggle on={state.padsConnected} onClick={() => sim.setPadsConnected(!state.padsConnected)} label="Defib pads" />
            <Toggle on={state.spo2Connected} onClick={() => sim.setSpo2Connected(!state.spo2Connected)} label="SpO₂ sensor" />
            <Toggle on={state.nibpAvailable} onClick={() => sim.setNibpAvailable(!state.nibpAvailable)} label="NIBP" />
            <Toggle on={state.etco2Connected} onClick={() => sim.setEtco2Connected(!state.etco2Connected)} label="EtCO₂" />
            <Toggle on={state.plethOn} onClick={() => sim.setPleth(!state.plethOn)} label="Pleth" />
            <Toggle on={state.capnoOn} onClick={() => sim.setCapno(!state.capnoOn)} label="Capnogram" />
          </div>
          <Field label="Self-test window">
            <div className="segmented">
              {[['check', 'Completed'], ['x', 'Not done'], ['blank', 'Blank']].map(([v, lbl]) => (
                <button
                  key={v}
                  className={`segmented__btn ${state.selfTest === v ? 'is-active' : ''}`}
                  onClick={() => sim.setSelfTest(v)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </Field>
        </Panel>

        <Panel title="Alarms">
          <div className="row" style={{ marginBottom: '0.6rem' }}>
            <button className={`btn ${state.alarmsSuspended ? 'btn--primary' : 'btn--ghost'}`} onClick={sim.suspendAlarms}>
              {state.alarmsSuspended ? 'Resume alarms' : 'Suspend alarms'}
            </button>
            <button className="btn btn--danger" onClick={sim.triggerTestAlarm}>Test alarm</button>
          </div>
          <Slider
            label="Suspend duration" unit="s" min={15} max={300} value={state.alarmSuspendDuration}
            onChange={(v) => sim.setAlarmSuspendDuration(v)} onCommit={(v) => sim.setAlarmSuspendDuration(v)}
          />
          {[
            ['hrHigh', 'HR high', 60, 250], ['hrLow', 'HR low', 20, 100],
            ['spo2Low', 'SpO₂ low', 70, 99],
            ['nibpSysHigh', 'NIBP sys high', 120, 240], ['nibpSysLow', 'NIBP sys low', 50, 120],
            ['etco2High', 'EtCO₂ high', 40, 80], ['etco2Low', 'EtCO₂ low', 10, 40],
            ['rrHigh', 'RR high', 20, 60], ['rrLow', 'RR low', 0, 20],
          ].map(([key, label, min, max]) => (
            <Slider
              key={key}
              label={label}
              unit=""
              min={min}
              max={max}
              value={state.alarmLimits[key]}
              onChange={(v) => update((p) => ({ alarmLimits: { ...p.alarmLimits, [key]: v } }))}
              onCommit={(v) => sim.setAlarmLimit(key, v)}
            />
          ))}
        </Panel>

        <Panel title="Device Mode">
          <div className="segmented">
            {['Monitor', 'Defib', 'Pacer'].map((m) => (
              <button
                key={m}
                className={`segmented__btn ${state.mode === m ? 'is-active' : ''}`}
                onClick={() => sim.setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {state.mode === 'Defib' && (
            <div className="defib-controls">
              <Field label="Energy (J)">
                <select
                  value={state.energy}
                  onChange={(e) => sim.setEnergy(Number(e.target.value))}
                >
                  {ENERGIES.map((j) => (
                    <option key={j} value={j}>
                      {j} J
                    </option>
                  ))}
                </select>
              </Field>

              <label className="slider" style={{ marginBottom: '0.6rem' }}>
                <span className="slider__label">
                  Sync (cardioversion):{' '}
                  <strong>{state.syncEnabled ? 'ON' : 'OFF'}</strong>
                </span>
                <button
                  className={`btn ${state.syncEnabled ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={sim.toggleSync}
                >
                  {state.syncEnabled ? 'Sync ON' : 'Sync OFF'}
                </button>
              </label>

              <div className="row">
                <button className="btn" onClick={sim.analyze} disabled={state.analyzing}>
                  {state.analyzing ? 'Analyzing…' : 'Analyze'}
                </button>
                <button
                  className="btn btn--primary"
                  disabled={state.charging || state.shockReady || state.analyzing}
                  onClick={sim.charge}
                >
                  Charge
                </button>
              </div>
              <div className="row" style={{ marginTop: '0.6rem' }}>
                <button
                  className="btn btn--danger"
                  disabled={!state.shockReady}
                  onClick={sim.deliverShock}
                >
                  Deliver {state.syncEnabled ? 'Sync ' : ''}Shock
                </button>
                <button
                  className="btn btn--ghost"
                  disabled={!state.charging && !state.shockReady}
                  onClick={sim.disarm}
                >
                  Disarm
                </button>
              </div>

              <p className="muted">
                {state.analyzing
                  ? 'ANALYZING — controls locked'
                  : state.analyzeResult === 'shock'
                    ? 'SHOCK ADVISED'
                    : state.analyzeResult === 'noshock'
                      ? 'NO SHOCK ADVISED'
                      : state.charging
                        ? `Charging ${Math.round(state.chargeProgress * 100)}%`
                        : state.shockReady
                          ? `Charged — ${state.energy} J ready`
                          : 'Disarmed'}
                {' · '}Shocks: {state.shockCount}
              </p>
            </div>
          )}

          {state.mode === 'Pacer' && (
            <div className="defib-controls">
              <Slider
                label="Pacer rate"
                unit="ppm"
                min={30}
                max={180}
                value={state.pacerRate}
                onChange={sim.setPacerRateLive}
                onCommit={sim.commitPacerRate}
              />
              <Slider
                label="Output"
                unit="mA"
                min={0}
                max={140}
                value={state.pacerOutput}
                onChange={sim.setPacerOutputLive}
                onCommit={sim.commitPacerOutput}
              />
              <button
                className={`btn ${state.fourToOne ? 'btn--primary' : 'btn--ghost'}`}
                onMouseDown={() => sim.setFourToOne(true)}
                onMouseUp={() => sim.setFourToOne(false)}
                onMouseLeave={() => sim.setFourToOne(false)}
              >
                Hold 4:1 {state.fourToOne ? '(active)' : ''}
              </button>
            </div>
          )}
        </Panel>

        {state.mode === 'Pacer' && (
          <Panel title="Pacer Capture">
            <Slider
              label="Capture threshold"
              unit="mA"
              min={0}
              max={140}
              value={state.captureThreshold}
              onChange={sim.setCaptureThresholdLive}
              onCommit={sim.commitCaptureThreshold}
            />
            <Field label="Capture">
              <div className="segmented">
                {['auto', 'on', 'off'].map((m) => (
                  <button
                    key={m}
                    className={`segmented__btn ${state.captureMode === m ? 'is-active' : ''}`}
                    onClick={() => sim.setCaptureMode(m)}
                  >
                    {m === 'auto' ? 'Auto' : m === 'on' ? 'Capture' : 'No capture'}
                  </button>
                ))}
              </div>
            </Field>
            <label className="slider" style={{ marginBottom: '0.7rem' }}>
              <span className="slider__label">
                Intermittent capture:{' '}
                <strong>{state.intermittentCapture ? 'On' : 'Off'}</strong>
              </span>
              <button
                className={`btn ${state.intermittentCapture ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => sim.setIntermittent(!state.intermittentCapture)}
              >
                {state.intermittentCapture ? 'Intermittent ON' : 'Intermittent OFF'}
              </button>
            </label>
            <Field label="Underlying rhythm (during pacing)">
              <select
                value={state.underlyingRhythm}
                onChange={(e) => sim.setUnderlyingRhythm(e.target.value)}
              >
                {RHYTHMS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Patient response">
              <select value="" onChange={(e) => e.target.value && sim.setPacerResponse(e.target.value)}>
                <option value="">— apply response —</option>
                <option value="none">No change</option>
                <option value="capture">Capture</option>
                <option value="loss">Loss of capture</option>
                <option value="rosc">ROSC</option>
              </select>
            </Field>
            <p className="muted">
              {state.captureMode === 'auto'
                ? `Auto: output ${state.pacerOutput} mA ${state.pacerOutput >= state.captureThreshold ? '≥' : '<'} threshold ${state.captureThreshold} mA`
                : `Forced: ${state.captureMode === 'on' ? 'capturing' : 'not capturing'}`}
            </p>
          </Panel>
        )}

        <Panel title="Therapy / Cardioversion">
          <label className="slider" style={{ marginBottom: '0.7rem' }}>
            <span className="slider__label">
              Rhythm is shockable (Analyze):{' '}
              <strong>{state.shockable ? 'Yes' : 'No'}</strong>
            </span>
            <button
              className={`btn ${state.shockable ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => sim.setShockable(!state.shockable)}
            >
              {state.shockable ? 'Shockable' : 'Not shockable'}
            </button>
          </label>

          <Field label="Post-shock rhythm">
            <select
              value={state.postShockRhythm}
              onChange={(e) => sim.setPostShockRhythm(e.target.value)}
            >
              {RHYTHMS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="Shock outcome">
            <select
              value={state.shockOutcome}
              onChange={(e) => sim.setShockOutcome(e.target.value)}
            >
              {SHOCK_OUTCOMES.map((o) => (
                <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>
              ))}
            </select>
          </Field>

          <label className="slider">
            <span className="slider__label">
              Auto-convert after shock:{' '}
              <strong>{state.autoConvert ? 'Yes' : 'No'}</strong>
            </span>
            <button
              className={`btn ${state.autoConvert ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => sim.setAutoConvert(!state.autoConvert)}
            >
              {state.autoConvert ? 'Auto-convert ON' : 'Auto-convert OFF'}
            </button>
          </label>
        </Panel>

        <Panel title={`Event Log (${shownLog.length}/${fullLog.length})`}>
          <div className="row" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button className="btn btn--primary" onClick={() => exportSessionJSON(state)}>Export JSON</button>
            <button className="btn btn--primary" onClick={() => exportEventCSV(state)}>Export CSV</button>
            <button className="btn" onClick={() => window.open(routeFor('report'), '_blank')}>Print Report</button>
            <button className="btn btn--ghost" onClick={sim.clearLog}>Clear Log</button>
            <button className="btn btn--ghost" onClick={sim.resetSession}>Reset Session</button>
            <button className="btn btn--danger" onClick={() => window.open(`${import.meta.env.BASE_URL}facilitator?session=${sim.duplicateSession()}`, '_blank')}>Duplicate → New Session</button>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Session {state.sessionId} · {fmtTime(state.sessionStart)}
            {state.learnerMode === 'validation' ? ' · VALIDATION' : ''}
          </p>
          <div className="logfilter">
            <button className={`logfilter__btn ${logFilter === 'all' ? 'is-active' : ''}`} onClick={() => setLogFilter('all')}>all</button>
            {LOG_CATEGORIES.map((c) => (
              <button key={c} className={`logfilter__btn ${logFilter === c ? 'is-active' : ''}`} onClick={() => setLogFilter(c)}>{c}</button>
            ))}
          </div>
          <div className="eventlog">
            {shownLog.slice(-60).reverse().map((e) => (
              <div className="eventlog__row" key={e.id}>
                <span className="eventlog__t">{fmtTime(e.t)}</span>
                <span className={`eventlog__type eventlog__type--${e.type}`}>{e.type}</span>
                <span className="eventlog__detail">
                  {e.ctx ? `[${e.ctx.mode}] ` : ''}{logDetail(e)}
                </span>
              </div>
            ))}
            {shownLog.length === 0 && <p className="muted">No events.</p>}
          </div>
        </Panel>

        {import.meta.env.DEV && (
          <Panel title="Debug (dev only)">
            <p className="muted" style={{ marginTop: 0 }}>
              Also available in the console as <code>window.__sim</code>.
            </p>
            <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
              <button className="btn btn--ghost" onClick={sim.resetSession}>Reset session</button>
              <button className="btn btn--ghost" onClick={() => console.log('[sim] state', state)}>Dump state → console</button>
              <button className="btn" onClick={() => sim.loadScenario('vf-arrest')}>Load VF test scenario</button>
              <button className="btn btn--danger" onClick={() => { sim.setMode('Defib'); sim.update({ shockReady: true, energy: 200 }); setTimeout(() => sim.deliverShock(), 30) }}>Simulate shock</button>
              <button className="btn" onClick={() => { sim.setMode('Pacer'); sim.update({ pacerRate: 70, pacerOutput: 80, captureMode: 'on' }) }}>Simulate pacing capture</button>
              <button className="btn" onClick={sim.triggerTestAlarm}>Simulate alarm</button>
            </div>
          </Panel>
        )}

        <Panel title="Live state (debug)">
          <pre className="debug">{JSON.stringify(state, null, 2)}</pre>
        </Panel>
      </div>
      <SafetyLabel />
    </div>
  )
}

const OUTCOME_LABEL = {
  none: 'No change',
  convert: 'Convert (→ post-shock rhythm)',
  deteriorate: 'Deteriorate (→ VF)',
  rosc: 'ROSC (→ NSR + vitals)',
}

function fmtTime(t) {
  const d = new Date(t)
  return d.toLocaleTimeString([], { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

function logDetail(e) {
  const bits = []
  if (e.rhythm) bits.push(e.rhythm)
  if (e.energy != null) bits.push(e.energy + 'J')
  if (e.sync != null) bits.push(e.sync ? 'SYNC' : 'unsync')
  if (e.outcome) bits.push('→ ' + e.outcome)
  if (e.result) bits.push(e.result)
  if (e.reason) bits.push(e.reason)
  if (e.mode) bits.push(e.mode)
  if (e.quality) bits.push(e.quality)
  if (e.message) bits.push(e.message)
  if (e.seconds != null) bits.push(e.seconds + 's')
  if (e.value != null) bits.push(String(e.value))
  if (e.enabled != null) bits.push(e.enabled ? 'on' : 'off')
  if (e.state) bits.push(e.state)
  if (e.response) bits.push(e.response)
  if (e.name) bits.push(e.name)
  if (e.level) bits.push(e.level)
  if (e.label) bits.push(e.label)
  if (e.step != null) bits.push('step ' + (e.step + 1))
  if (e.item) bits.push(e.item + (e.done != null ? (e.done ? ' ✓' : ' ✗') : ''))
  if (e.text) bits.push('“' + e.text + '”')
  return bits.join(' · ')
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h2 className="panel__title">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ on, onClick, label }) {
  return (
    <button className={`btn ${on ? 'btn--primary' : 'btn--ghost'}`} onClick={onClick} style={{ fontSize: '0.78rem' }}>
      {label}: {on ? 'ON' : 'OFF'}
    </button>
  )
}

function Slider({ label, unit, min, max, value, onChange, onCommit }) {
  const commit = (e) => onCommit && onCommit(Number(e.target.value))
  return (
    <label className="slider">
      <span className="slider__label">
        {label}: <strong>{value}</strong> {unit}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
      />
    </label>
  )
}
