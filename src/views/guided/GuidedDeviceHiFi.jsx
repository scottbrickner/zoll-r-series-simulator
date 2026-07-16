import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../../sync/SimulatorContext'
import RSeriesPanel from '../../components/rseries/RSeriesPanel'
import { softkeysForMode } from '../../components/rseries/display/DisplayWidgets'

/**
 * GuidedDeviceHiFi — Phase 5 (validated skills): the real ZOLL R Series panel.
 *
 * Loads the shockable arrest onto the device (powered OFF, so the learner must
 * turn on the monitor), wires the full device controls, and watches for the
 * first shock — at which point it stops the time-to-shock clock via onShock().
 * The device is fully interactive (rhythm identification + shock administration
 * happen on the high-fidelity simulator, not a simplified panel).
 */
export default function GuidedDeviceHiFi({ scenario, onShock }) {
  const sim = useSimulator()
  const { state } = sim
  const [flash, setFlash] = useState(false)
  const [blanking, setBlanking] = useState(false)
  const [elapsed, setElapsed] = useState('0:00')
  const lastEventAt = useRef(null)
  const startRef = useRef(Date.now())

  // Load the shockable arrest onto the device, powered OFF, exactly once.
  const setupDone = useRef(false)
  useEffect(() => {
    if (setupDone.current) return
    setupDone.current = true
    sim.update({
      mode: 'Off',
      rhythm: scenario.rhythm,
      hr: 0, spo2: 0, nibp: { sys: 0, dia: 0, mean: 0 },
      energy: 120,
      shockable: true, autoConvert: true, shockOutcome: 'convert', postShockRhythm: 'Normal Sinus',
      // CPR is still running while the monitor comes on and the rhythm is
      // identified (compressions don't stop for that) — See-Thru CPR shows
      // the raw compression-artifact trace on PADS and the clean filtered
      // rhythm on FIL, same as the real device.
      cprActive: true, cprRate: 110, cprDepth: 50, cprReleaseQuality: 'full',
      syncEnabled: false,
      charging: false, chargeProgress: 0, shockReady: false, shockCount: 0,
      analyzing: false, analyzeResult: null,
      lead: 'PADS',
      learnerMode: 'validation', notesPanelOn: false,
    })
  }, [sim, scenario.rhythm])

  // Track whether ANALYZE was ever pressed (role-appropriate feedback: BLS
  // should use it for the shock advisory, ACLS shouldn't need it).
  const usedAnalyze = useRef(false)
  useEffect(() => {
    if (state.analyzing) usedAnalyze.current = true
  }, [state.analyzing])

  // Watch for the first shock: arm once shockCount reads 0 (post-setup), then
  // fire onShock on the next increment.
  const armed = useRef(false)
  const shocked = useRef(false)
  useEffect(() => {
    if (!armed.current) { if (state.shockCount === 0) armed.current = true; return }
    if (!shocked.current && state.shockCount >= 1) {
      shocked.current = true
      onShock({ energy: state.energy, usedAnalyze: usedAnalyze.current })
    }
  }, [state.shockCount, state.energy, onShock])

  // Device on-time clock (LCD, from power-on).
  useEffect(() => {
    if (state.mode === 'Off') { setElapsed('0:00'); return }
    startRef.current = Date.now()
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000)
      setElapsed(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(id)
  }, [state.mode])

  // Post-shock flash + artifact blank.
  useEffect(() => {
    const evt = state.lastEvent
    if (!evt || evt.at === lastEventAt.current) return
    lastEventAt.current = evt.at
    if (evt.type === 'shock') {
      setFlash(true); setBlanking(true)
      const tf = setTimeout(() => setFlash(false), 250)
      const tb = setTimeout(() => setBlanking(false), 1500)
      return () => { clearTimeout(tf); clearTimeout(tb) }
    }
  }, [state.lastEvent])

  const viewState = blanking ? { ...state, rhythm: 'Post-Shock Artifact', running: true } : state

  const actions = {
    onShock: sim.deliverShock,
    onCharge: sim.charge,
    onAnalyze: sim.analyze,
    onEnergyUp: () => sim.cycleEnergy(1),
    onEnergyDown: () => sim.cycleEnergy(-1),
    onSyncToggle: sim.toggleSync,
    onModeCycle: () => {
      const order = ['Off', 'Monitor', 'Defib', 'Pacer']
      sim.setMode(order[(order.indexOf(state.mode) + 1) % order.length])
    },
    onSelectMode: (m) => sim.setMode(m),
    onSoftkey: (i) => {
      const label = softkeysForMode(state.mode)[i]
      if (label === 'Sync On/Off') sim.toggleSync()
      else if (label === 'Async On/Off') sim.toggleAsyncPacing()
      else if (label === 'Code Marker') sim.codeMarker()
      else sim.softkeyPress(label)
    },
    onOutputUp: () => sim.adjustPacerOutput(2),
    onOutputDown: () => sim.adjustPacerOutput(-2),
    onRateUp: () => sim.adjustPacerRate(2),
    onRateDown: () => sim.adjustPacerRate(-2),
    onRecorder: sim.toggleRecorder,
    onFourToOneDown: () => sim.setFourToOne(true),
    onFourToOneUp: () => sim.setFourToOne(false),
    onLead: sim.cycleLead,
    onSize: sim.cycleSize,
    onAlarmSuspend: sim.suspendAlarms,
    onNibp: sim.measureNibp,
  }

  return (
    <div className="guided-device-wrap">
      <RSeriesPanel state={viewState} elapsed={elapsed} flash={flash} actions={actions} />
    </div>
  )
}
