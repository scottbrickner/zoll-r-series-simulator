import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSimulator } from '../sync/SimulatorContext'
import { getScenario } from '../sync/scenarios'
import RSeriesPanel from '../components/rseries/RSeriesPanel'
import { softkeysForMode } from '../components/rseries/display/DisplayWidgets'
import SafetyLabel from '../components/SafetyLabel'

/**
 * Learner view — front-facing ZOLL R Series panel. Mirrors the synced state and
 * reacts to device events. The physical buttons are wired to the device actions
 * (charge/analyze/shock/energy/mode/sync) so the trainee can operate the unit;
 * the facilitator can drive the same actions remotely.
 */
export default function Learner() {
  const sim = useSimulator()
  const { state } = sim
  const [flash, setFlash] = useState(false)
  const [blanking, setBlanking] = useState(false)
  const [elapsed, setElapsed] = useState('0:00')
  const lastEventAt = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (state.mode === 'Off') {
      setElapsed('0:00')
      return
    }
    startRef.current = Date.now()
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000)
      const mm = Math.floor(s / 60)
      const ss = String(s % 60).padStart(2, '0')
      setElapsed(`${mm}:${ss}`)
    }, 1000)
    return () => clearInterval(id)
  }, [state.mode])

  // React to a shock: flash + blank/disrupt the ECG (post-shock artifact).
  useEffect(() => {
    const evt = state.lastEvent
    if (!evt || evt.at === lastEventAt.current) return
    lastEventAt.current = evt.at
    if (evt.type === 'shock') {
      setFlash(true)
      setBlanking(true)
      const tf = setTimeout(() => setFlash(false), 250)
      const tb = setTimeout(() => setBlanking(false), 1500)
      return () => {
        clearTimeout(tf)
        clearTimeout(tb)
      }
    }
  }, [state.lastEvent])

  // During the post-shock window, force the disrupted artifact trace.
  const viewState = blanking ? { ...state, rhythm: 'Post-Shock Artifact', running: true } : state

  const actions = {
    onShock: sim.deliverShock,
    onCharge: sim.charge,
    onAnalyze: sim.analyze,
    onEnergyUp: () => sim.cycleEnergy(1),
    onEnergyDown: () => sim.cycleEnergy(-1),
    onSyncToggle: sim.toggleSync,
    onModeCycle: () => {
      // Include Off so the knob can power the device down (Off → Monitor → Defib → Pacer → Off).
      const order = ['Off', 'Monitor', 'Defib', 'Pacer']
      const next = order[(order.indexOf(state.mode) + 1) % order.length]
      sim.setMode(next)
    },
    // Click a mode label to turn the knob straight to that mode.
    onSelectMode: (m) => sim.setMode(m),
    // Physical softkey i → the action for the current mode's label at that position.
    onSoftkey: (i) => {
      const label = softkeysForMode(state.mode)[i]
      if (label === 'Sync On/Off') sim.toggleSync()
      else if (label === 'Async On/Off') sim.toggleAsyncPacing()
      else if (label === 'Code Marker') sim.codeMarker()
      else sim.softkeyPress(label)
    },
    // pacer output/rate step via the knob's ghost up/down arrows (Pacer mode)
    onOutputUp: () => sim.adjustPacerOutput(10),
    onOutputDown: () => sim.adjustPacerOutput(-10),
    onRateUp: () => sim.adjustPacerRate(10),
    onRateDown: () => sim.adjustPacerRate(-10),
    onRecorder: sim.toggleRecorder,
    onFourToOneDown: () => sim.setFourToOne(true),
    onFourToOneUp: () => sim.setFourToOne(false),
    onLead: sim.cycleLead,
    onSize: sim.cycleSize,
    onAlarmSuspend: sim.suspendAlarms,
    onNibp: sim.measureNibp,
  }

  // Education-mode guidance is shown only in education mode with the notes
  // panel enabled; validation mode hides all learner-facing guidance.
  const showGuidance = state.learnerMode === 'education' && state.notesPanelOn

  return (
    <div className="learner-stage">
      <RSeriesPanel state={viewState} elapsed={elapsed} flash={flash} actions={actions} />
      {showGuidance && <GuidancePanel state={state} />}
      <Link className="corner-link" to="/">
        ← exit
      </Link>
      <SafetyLabel />
    </div>
  )
}

/** Plain-language explanation of the current device message. */
function explainDevice(state) {
  if (state.mode === 'Defib') {
    if (state.analyzing) return 'The device is analyzing the rhythm — do not touch the patient.'
    if (state.analyzeResult === 'shock') return 'A shockable rhythm was detected — charge and prepare to defibrillate.'
    if (state.analyzeResult === 'noshock') return 'No shockable rhythm — resume CPR; do not shock.'
    if (state.charging) return 'The defibrillator is charging to the selected energy.'
    if (state.shockReady) return `Charged to ${state.energy} J${state.syncEnabled ? ' (synchronized)' : ''} — clear the patient, then press SHOCK.`
    return 'DEFIB mode — select energy, then ANALYZE or CHARGE.'
  }
  if (state.mode === 'Pacer') return 'PACER mode — set rate, then raise output (mA) until each spike captures a QRS.'
  return 'MONITOR mode — observe the rhythm and vital signs.'
}

function cprCoaching(state) {
  const notes = []
  if (state.cprReleaseQuality !== 'full') notes.push('Allow full chest recoil (avoid leaning).')
  if (state.cprDepth < 45) notes.push(`Depth ${(state.cprDepth / 10).toFixed(1)} cm is shallow — aim 5–6 cm.`)
  else if (state.cprDepth > 60) notes.push('Too deep — keep to 5–6 cm.')
  if (state.cprRate < 100) notes.push(`Rate ${state.cprRate}/min is slow — target 100–120/min.`)
  else if (state.cprRate > 130) notes.push(`Rate ${state.cprRate}/min is fast — target 100–120/min.`)
  if (notes.length === 0) notes.push('Good compressions — maintain rate, depth, and recoil.')
  return notes
}

/**
 * Education-mode learner guidance: scenario notes, expected next actions,
 * protocol hints, a plain-language device-message explanation, and live CPR
 * coaching. Hidden entirely in validation mode.
 */
function GuidancePanel({ state }) {
  const sc = getScenario(state.scenarioId)
  const step = sc && sc.steps ? sc.steps[state.scenarioStep] : null
  return (
    <div className="coaching-banner">
      <div className="coaching-banner__title">
        Education{sc ? ` · ${sc.name}` : ''}{step ? ` · ${step.label}` : ''}
      </div>
      <p className="coaching-banner__device">{explainDevice(state)}</p>
      {sc && (
        <>
          <div className="coaching-banner__sub">Expected next actions</div>
          <ul>
            {sc.expectedActions.slice(0, 4).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
          {sc.protocolHints && sc.protocolHints.length > 0 && (
            <p className="coaching-banner__hint">Hint: {sc.protocolHints[0]}</p>
          )}
        </>
      )}
      {state.cprActive && (
        <>
          <div className="coaching-banner__sub">CPR coaching</div>
          <ul>
            {cprCoaching(state).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </>
      )}
    </div>
  )
}
