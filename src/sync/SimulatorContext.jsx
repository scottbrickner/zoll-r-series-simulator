import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { isSyncable, isNonPerfusing } from '../components/rseries/waveforms'
import { getScenario } from './scenarios'

/**
 * Cross-window simulator state + device behavior.
 *
 * Two windows on the same device (one /learner, one /facilitator) share a
 * single simulation state over a BroadcastChannel, mirrored into localStorage.
 * Action methods (charge, analyze, deliverShock, …) run timers in whichever
 * window invoked them and broadcast their state changes; the other window
 * mirrors passively. This module owns all DEFIB / cardioversion device logic.
 */

// Sync scope is keyed by sessionId so independent sessions never cross-sync.
import { DEFAULT_SESSION, channelName, storageKeyFor, newSessionId } from './sessionKeys'
export { DEFAULT_SESSION, channelName, storageKeyFor, newSessionId }

// ---- resilient storage / channel (deployment + private-mode safety) ----
export const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined'

function safeGetItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false // quota / private-mode / disabled storage
  }
}
export function clearSession(sessionId) {
  try {
    localStorage.removeItem(storageKeyFor(sessionId))
    return true
  } catch {
    return false
  }
}

export const RHYTHMS = [
  'Normal Sinus',
  'Sinus Bradycardia',
  'Sinus Tachycardia',
  'SVT',
  'Atrial Fibrillation',
  'Ventricular Tachycardia',
  'Ventricular Fibrillation',
  'Torsades de Pointes',
  'Asystole',
  'PEA',
  'Paced (Capture)',
  'Paced (Non-Capture)',
  'CPR Artifact',
  'Post-Shock Artifact',
]

// Realistic ZOLL biphasic selectable energies (Joules)
export const ENERGIES = [1, 2, 3, 5, 7, 10, 15, 20, 30, 50, 70, 85, 100, 120, 150, 200]
export const SHOCK_OUTCOMES = ['none', 'convert', 'deteriorate', 'rosc']
export const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'PADDLES', 'PADS']
export const ECG_SIZES = [0.5, 1, 1.5, 2, 3]

const CHARGE_MS = 2200 // time to charge to selected energy
const ANALYZE_MS = 3000 // ECG analysis duration
const SYNC_WAIT_MS = 350 // simulated wait for the next R wave

export const DEFAULT_STATE = {
  scenarioName: 'Untitled scenario',
  running: false,
  rhythm: 'Normal Sinus',
  hr: 72,
  spo2: 98,
  nibp: { sys: 120, dia: 80, mean: 93 },
  nibpMeasuring: false, // true while an NIBP cuff measurement is in progress

  // ---- power: AC mains + battery status (drive the two indicator pills) ----
  acConnected: true, // plugged into AC mains
  batteryStatus: 'charged', // 'charged' | 'charging' | 'low' | 'fault' | 'missing'
  asyncPacing: false, // asynchronous (fixed-rate) pacing vs demand pacing
  recording: false, // strip-chart recorder running
  etco2: 38,
  rr: 16, // respiratory rate
  mode: 'Off', // Off | Monitor | Defib | Pacer — device starts powered off
  energy: 120, // selected defib energy (J) — ZOLL default for Defib

  // ---- monitor: lead / size / connections / display toggles ----
  lead: 'II',
  ecgSize: 1, // ECG gain (x0.5 .. x3)
  plethOn: true,
  capnoOn: true,
  leadsConnected: true,
  padsConnected: true,
  spo2Connected: true,
  nibpAvailable: true,
  etco2Connected: true,

  // ---- alarms ----
  alarmLimits: {
    hrHigh: 120, hrLow: 50,
    spo2Low: 90,
    nibpSysHigh: 160, nibpSysLow: 90,
    etco2High: 50, etco2Low: 30,
    rrHigh: 30, rrLow: 8,
  },
  alarmsSuspended: false,
  alarmSuspendUntil: 0,
  alarmSuspendDuration: 120, // seconds
  testAlarm: false,

  // self-test window (Code Readiness): 'blank' | 'x' | 'check'
  selfTest: 'check',

  // ---- defib / cardioversion device state ----
  charging: false,
  chargeProgress: 0, // 0..1
  shockReady: false,
  shockCount: 0,
  analyzing: false,
  analyzeResult: null, // null | 'shock' | 'noshock'
  syncEnabled: false,

  // ---- pacer ----
  pacerRate: 70,
  pacerOutput: 0,
  captureThreshold: 60, // mA needed to capture (auto mode)
  captureMode: 'auto', // 'auto' | 'on' | 'off'
  intermittentCapture: false,
  underlyingRhythm: 'Asystole', // heart's own rhythm when not captured
  fourToOne: false, // 4:1 button held → pace at 1/4 rate

  // ---- CPR feedback ----
  cprActive: false,
  cprRate: 110, // compressions / min
  cprDepth: 50, // mm
  cprReleaseQuality: 'full', // 'full' | 'partial' | 'leaning'
  cprArtifactIntensity: 0.7, // 0..1
  cprPerfusionIndicator: 0, // 0..1 (derived)
  cprFeedbackMessage: '', // '' = auto (device computes)
  cprIdleTime: 0, // seconds since compressions stopped
  learnerMode: 'standard', // 'standard' | 'education' | 'validation'

  // ---- facilitator scenario settings ----
  shockable: true, // does ANALYZE advise a shock?
  postShockRhythm: 'Normal Sinus',
  autoConvert: true, // apply shockOutcome automatically on shock
  shockOutcome: 'convert', // none | convert | deteriorate | rosc

  // ---- scenario engine ----
  scenarioId: null,
  scenarioStep: 0,
  checklist: [], // [{ id, label, done }]
  facilitatorNotes: [], // [{ t, text }]
  scenarioOutcome: null,
  notesPanelOn: true, // learner guidance panel (education mode)

  // ---- session metadata ----
  sessionId: null,
  sessionStart: null,
  sessionEnded: null,
  learnerName: '',
  evaluatorName: '',

  // ---- validation / event log ----
  eventLog: [],

  // transient event for the learner view (shock flash / artifact)
  lastEvent: null, // { type, at, ... }
}

/** Whether the pacemaker is currently capturing (drives the paced QRS). */
export function pacingCaptured(s) {
  if (s.mode !== 'Pacer') return false
  if (s.captureMode === 'on') return true
  if (s.captureMode === 'off') return false
  return (s.pacerOutput || 0) >= (s.captureThreshold || 60)
}

/**
 * Assess CPR quality → perfusion score (0..1) + device feedback message.
 * A manual cprFeedbackMessage overrides the auto message.
 */
export function cprAssess(s) {
  if (!s.cprActive) return { perfusion: 0, message: 'RESUME CPR', auto: 'RESUME CPR' }
  let score = 1
  let msg = 'GOOD COMPRESSIONS'
  if (s.cprReleaseQuality === 'leaning') {
    score -= 0.4
    msg = 'FULLY RELEASE'
  } else if (s.cprReleaseQuality === 'partial') {
    score -= 0.2
  }
  if (s.cprDepth < 45) {
    score -= 0.35
    msg = 'PUSH HARDER'
  } else if (s.cprDepth > 60) {
    score -= 0.1
  }
  if (s.cprRate < 100) {
    score -= 0.2
    if (msg === 'GOOD COMPRESSIONS') msg = 'PUSH FASTER'
  } else if (s.cprRate > 130) {
    score -= 0.2
    if (msg === 'GOOD COMPRESSIONS') msg = 'SLOW DOWN'
  }
  const perfusion = Math.max(0.05, Math.min(1, score))
  return { perfusion, message: s.cprFeedbackMessage || msg, auto: msg }
}

/**
 * Resolve which monitored values are actually displayable (vs dashed) given
 * mode, perfusion, and cable/sensor connection. Used by both the display and
 * the alarm logic so they stay consistent.
 */
export function monitorView(s) {
  const pacing = s.mode === 'Pacer'
  const captured = pacingCaptured(s)
  const underlying = s.underlyingRhythm || 'Asystole'
  const leadsOff = !s.leadsConnected

  let hr = null
  if (!leadsOff) {
    if (pacing) hr = captured && !s.fourToOne ? s.pacerRate : isNonPerfusing(underlying) ? null : s.hr
    else hr = isNonPerfusing(s.rhythm) ? null : s.hr
  }
  const perfusing = hr != null
  const spo2 = s.spo2Connected && perfusing ? s.spo2 : null
  const nibp = s.nibpAvailable && perfusing ? s.nibp : null
  const etco2 = s.etco2Connected ? s.etco2 : null
  const rr = s.etco2Connected ? s.rr : null

  let status = null
  if (leadsOff) status = 'CHECK ECG LEADS'
  const padStatus = s.mode === 'Defib' && !s.padsConnected ? 'CHECK PADS — ATTACH PADS' : null

  return { pacing, captured, underlying, leadsOff, hr, spo2, nibp, etco2, rr, status, padStatus }
}

/** Active alarm conditions (independent of suspension). */
export function activeAlarms(s) {
  const v = monitorView(s)
  const L = s.alarmLimits || {}
  const a = []
  if (v.hr != null) {
    if (v.hr > L.hrHigh) a.push({ param: 'hr', message: 'HR HIGH' })
    else if (v.hr < L.hrLow) a.push({ param: 'hr', message: 'HR LOW' })
  }
  if (v.spo2 != null && v.spo2 < L.spo2Low) a.push({ param: 'spo2', message: 'SpO2 LOW' })
  if (v.nibp != null) {
    if (v.nibp.sys > L.nibpSysHigh) a.push({ param: 'nibp', message: 'NIBP HIGH' })
    else if (v.nibp.sys < L.nibpSysLow) a.push({ param: 'nibp', message: 'NIBP LOW' })
  }
  if (v.etco2 != null) {
    if (v.etco2 > L.etco2High) a.push({ param: 'etco2', message: 'EtCO2 HIGH' })
    else if (v.etco2 < L.etco2Low) a.push({ param: 'etco2', message: 'EtCO2 LOW' })
  }
  if (v.rr != null) {
    if (v.rr > L.rrHigh) a.push({ param: 'rr', message: 'RESP HIGH' })
    else if (v.rr < L.rrLow) a.push({ param: 'rr', message: 'RESP LOW' })
  }
  if (s.testAlarm) a.push({ param: 'test', message: 'TEST ALARM' })
  return a
}

let _sessionSeq = 0
function newSession() {
  _sessionSeq += 1
  const t = Date.now()
  return {
    sessionId: 'S-' + t.toString(36).toUpperCase() + '-' + _sessionSeq,
    sessionStart: t,
    sessionEnded: null,
  }
}

/** Map an event type to a filter category for the log viewer / exports. */
export function eventCategory(type) {
  if (/^(charge|shock|analyze|disarm|sync_wait|force_)/.test(type) || type === 'shock_failed') {
    return type.startsWith('sync') || type === 'sync_shock' ? 'sync' : 'defib'
  }
  if (type === 'sync_shock' || type === 'sync_toggle') return 'sync'
  if (/^(pacer|output|rate|four_to_one|capture|patient_response)/.test(type) || type === 'capture_mode' || type === 'capture_achieved' || type === 'loss_of_capture') return 'pacer'
  if (type.startsWith('cpr')) return 'cpr'
  if (type.startsWith('alarm')) return 'alarms'
  if (type === 'connection' || type === 'lead_change' || type === 'size_change' || type === 'monitor_mode' || type === 'mode' || type === 'vitals' || type === 'pleth' || type === 'capno') return 'monitor'
  if (type.startsWith('scenario') || type === 'force_deteriorate' || type === 'force_rosc' || type === 'session_started' || type === 'education_mode' || type === 'validation_mode' || type === 'learner_mode' || type === 'notes_panel') return 'scenario'
  if (type === 'facilitator_note') return 'note'
  return 'monitor'
}

export const LOG_CATEGORIES = ['defib', 'sync', 'pacer', 'cpr', 'monitor', 'alarms', 'scenario', 'note']

function outcomePatch(p) {
  switch (p.shockOutcome) {
    case 'none':
      return {}
    case 'deteriorate':
      return { rhythm: 'Ventricular Fibrillation' }
    case 'rosc':
      return { rhythm: 'Normal Sinus', hr: 84, spo2: 96, nibp: { sys: 118, dia: 74 } }
    case 'convert':
    default:
      return { rhythm: p.postShockRhythm || 'Normal Sinus' }
  }
}

const SimulatorContext = createContext(null)

/** Merge an untrusted/partial state object onto defaults so the UI never
 *  crashes on missing or malformed fields. */
function sanitizeState(obj, sessionId) {
  const s = { ...DEFAULT_STATE, ...(obj && typeof obj === 'object' ? obj : {}) }
  s.sessionId = sessionId
  if (!s.nibp || typeof s.nibp !== 'object') s.nibp = { ...DEFAULT_STATE.nibp }
  if (!s.alarmLimits || typeof s.alarmLimits !== 'object') s.alarmLimits = { ...DEFAULT_STATE.alarmLimits }
  if (!Array.isArray(s.eventLog)) s.eventLog = []
  if (!Array.isArray(s.checklist)) s.checklist = []
  if (!Array.isArray(s.facilitatorNotes)) s.facilitatorNotes = []
  if (!s.sessionStart) s.sessionStart = Date.now()
  return s
}

function loadInitialState(sessionId) {
  const raw = safeGetItem(storageKeyFor(sessionId))
  if (raw) {
    try {
      return sanitizeState(JSON.parse(raw), sessionId)
    } catch {
      // corrupted stored state — discard and start fresh for this scope
      clearSession(sessionId)
    }
  }
  return { ...DEFAULT_STATE, ...newSession(), sessionId }
}

export function SimulatorProvider({ children, sessionId = DEFAULT_SESSION }) {
  const [state, setState] = useState(() => loadInitialState(sessionId))
  const channelRef = useRef(null)
  const applyingRemote = useRef(false)
  const stateRef = useRef(state)

  // timers owned by the window that started the action
  const chargeIvl = useRef(null)
  const analyzeTo = useRef(null)
  const shockTo = useRef(null)
  const cprIdleIvl = useRef(null)
  const alarmSuspendTo = useRef(null)
  const testAlarmTo = useRef(null)
  const nibpTo = useRef(null)

  const STORAGE_KEY = storageKeyFor(sessionId)

  useEffect(() => {
    // BroadcastChannel may be unavailable (older browsers / some sandboxes);
    // fall back gracefully to localStorage `storage`-event sync only.
    let channel = null
    if (hasBroadcastChannel) {
      try {
        channel = new BroadcastChannel(channelName(sessionId))
      } catch {
        channel = null
      }
    }
    channelRef.current = channel

    if (channel) {
      channel.onmessage = (event) => {
        const msg = event.data
        if (!msg) return
        if (msg.type === 'state') {
          applyingRemote.current = true
          setState(sanitizeState(msg.payload, sessionId))
        } else if (msg.type === 'request-state') {
          channel.postMessage({ type: 'state', payload: stateRef.current })
        }
      }
      try {
        channel.postMessage({ type: 'request-state' })
      } catch {
        // ignore
      }
    }

    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          applyingRemote.current = true
          setState(sanitizeState(JSON.parse(e.newValue), sessionId))
        } catch {
          // ignore malformed remote write
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', onStorage)
      clearInterval(chargeIvl.current)
      clearTimeout(analyzeTo.current)
      clearTimeout(shockTo.current)
      clearInterval(cprIdleIvl.current)
      clearTimeout(alarmSuspendTo.current)
      clearTimeout(testAlarmTo.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    stateRef.current = state
    if (applyingRemote.current) {
      applyingRemote.current = false
    } else if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'state', payload: state })
      } catch {
        // ignore (channel closed / structured-clone failure)
      }
    }
    safeSetItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, STORAGE_KEY])

  const api = useMemo(() => {
    const update = (patch) =>
      setState((prev) => ({
        ...prev,
        ...(typeof patch === 'function' ? patch(prev) : patch),
      }))

    // Each event carries a snapshot of device/patient context so the log
    // viewer and CSV/JSON exports can flatten consistent columns per row.
    const log = (entry) =>
      update((p) => ({
        eventLog: [
          ...(p.eventLog || []),
          {
            id: (p.eventLog?.length || 0) + 1,
            t: Date.now(),
            category: eventCategory(entry.type),
            ctx: {
              mode: p.mode,
              rhythm: p.rhythm,
              hr: p.hr,
              energy: p.energy,
              shockCount: p.shockCount,
              syncEnabled: p.syncEnabled,
              pacerOutput: p.pacerOutput,
              pacerRate: p.pacerRate,
              capture: pacingCaptured(p),
              cprActive: p.cprActive,
              cprRate: p.cprRate,
              cprDepth: p.cprDepth,
              alarmsSuspended: p.alarmsSuspended,
              scenarioStep: p.scenarioStep,
              scenarioName: p.scenarioName,
              learnerMode: p.learnerMode,
            },
            ...entry,
          },
        ].slice(-1000),
      }))

    const clearTimers = () => {
      clearInterval(chargeIvl.current)
      clearTimeout(analyzeTo.current)
      clearTimeout(shockTo.current)
      clearInterval(cprIdleIvl.current)
      clearTimeout(nibpTo.current)
    }

    // Start a non-invasive blood-pressure measurement: inflate (measuring) for
    // ~3.5s, then complete (the physiological nibp becomes the displayed reading).
    const NIBP_MS = 3500
    const measureNibp = () => {
      const s = stateRef.current
      if (s.mode === 'Off' || !s.nibpAvailable || s.nibpMeasuring) return
      update({ nibpMeasuring: true })
      log({ type: 'nibp_start' })
      clearTimeout(nibpTo.current)
      nibpTo.current = setTimeout(() => {
        update({ nibpMeasuring: false })
        log({ type: 'nibp_result', value: stateRef.current.nibp })
      }, NIBP_MS)
    }

    const setMode = (mode) => {
      clearTimers()
      update({
        mode,
        charging: false,
        chargeProgress: 0,
        shockReady: false,
        analyzing: false,
        analyzeResult: null,
      })
      const mt = mode === 'Pacer' ? 'pacer_mode' : mode === 'Monitor' ? 'monitor_mode' : 'mode'
      log({ type: mt, mode })
    }

    // Apply a monitor-affecting patch; log any newly-triggered alarms.
    const applyMonitor = (patch, logEntry) => {
      const prev = stateRef.current
      const before = activeAlarms(prev).map((x) => x.param)
      const after = activeAlarms({ ...prev, ...patch })
      update(patch)
      if (logEntry) log(logEntry)
      after.forEach((al) => {
        if (!before.includes(al.param)) log({ type: 'alarm_triggered', param: al.param, message: al.message })
      })
    }

    const cycleLead = () => {
      const next = LEADS[(LEADS.indexOf(stateRef.current.lead) + 1) % LEADS.length]
      update({ lead: next })
      log({ type: 'lead_change', lead: next })
    }
    const cycleSize = () => {
      const next = ECG_SIZES[(ECG_SIZES.indexOf(stateRef.current.ecgSize) + 1) % ECG_SIZES.length]
      update({ ecgSize: next })
      log({ type: 'size_change', size: next })
    }

    const suspendAlarms = () => {
      const s = stateRef.current
      clearTimeout(alarmSuspendTo.current)
      if (s.alarmsSuspended) {
        update({ alarmsSuspended: false, alarmSuspendUntil: 0 })
        log({ type: 'alarm_resumed', via: 'manual' })
        return
      }
      const dur = s.alarmSuspendDuration || 120
      update({ alarmsSuspended: true, alarmSuspendUntil: Date.now() + dur * 1000 })
      log({ type: 'alarm_suspended', duration: dur })
      alarmSuspendTo.current = setTimeout(() => {
        update({ alarmsSuspended: false, alarmSuspendUntil: 0 })
        if (activeAlarms(stateRef.current).length) log({ type: 'alarm_resumed', via: 'timeout' })
      }, dur * 1000)
    }

    const triggerTestAlarm = () => {
      update({ testAlarm: true })
      log({ type: 'alarm_triggered', param: 'test', message: 'TEST ALARM' })
      clearTimeout(testAlarmTo.current)
      testAlarmTo.current = setTimeout(() => update({ testAlarm: false }), 8000)
    }

    // ---- scenario engine ----
    // transient device fields cleared when loading/resetting a scenario
    const TRANSIENT = {
      charging: false, chargeProgress: 0, shockReady: false, shockCount: 0,
      analyzing: false, analyzeResult: null, syncEnabled: false,
      fourToOne: false, cprIdleTime: 0,
      alarmsSuspended: false, alarmSuspendUntil: 0, testAlarm: false,
      lastEvent: null,
    }

    const applyScenario = (sc, logType) => {
      clearTimers()
      const init = sc.initial || {}
      const patch = {
        ...TRANSIENT,
        running: true,
        scenarioId: sc.id,
        scenarioName: sc.name,
        scenarioStep: 0,
        scenarioOutcome: null,
        facilitatorNotes: [],
        checklist: (sc.checklist || []).map((c) => ({ ...c, done: false })),
        ...init,
        alarmLimits: { ...DEFAULT_STATE.alarmLimits, ...(init.alarmLimits || {}) },
      }
      update(patch)
      log({ type: logType, scenarioId: sc.id, name: sc.name, level: sc.level })
    }

    const loadScenario = (id) => {
      const sc = getScenario(id)
      if (!sc) return
      applyScenario(sc, 'scenario_loaded')
    }

    const resetScenario = () => {
      const sc = getScenario(stateRef.current.scenarioId)
      if (!sc) return
      applyScenario(sc, 'scenario_reset')
    }

    const advanceStep = () => {
      const sc = getScenario(stateRef.current.scenarioId)
      if (!sc || !sc.steps) return
      const next = Math.min(sc.steps.length - 1, (stateRef.current.scenarioStep || 0) + 1)
      const step = sc.steps[next]
      const patch = { scenarioStep: next }
      if (step && step.apply) Object.assign(patch, step.apply)
      update(patch)
      log({ type: 'scenario_step', step: next, label: step ? step.label : '' })
    }

    const forceDeteriorate = () => {
      update({ rhythm: 'Ventricular Fibrillation', mode: 'Defib', hr: 0, shockable: true, cprActive: true, shockReady: false, charging: false })
      log({ type: 'force_deteriorate', rhythm: 'Ventricular Fibrillation' })
    }

    const forceRosc = () => {
      update({ rhythm: 'Normal Sinus', hr: 88, spo2: 95, nibp: { sys: 112, dia: 70, mean: 84 }, cprActive: false, shockReady: false, charging: false })
      log({ type: 'force_rosc' })
    }

    const markSkill = (outcome) => {
      update({ scenarioOutcome: outcome })
      log({ type: 'scenario_outcome', outcome })
    }

    const addFacilitatorNote = (text) => {
      if (!text || !text.trim()) return
      update((p) => ({ facilitatorNotes: [...(p.facilitatorNotes || []), { t: Date.now(), text: text.trim() }] }))
      log({ type: 'facilitator_note', text: text.trim() })
    }

    const toggleChecklist = (id) => {
      const cur = (stateRef.current.checklist || []).find((c) => c.id === id)
      const done = cur ? !cur.done : true
      update({ checklist: (stateRef.current.checklist || []).map((c) => (c.id === id ? { ...c, done } : c)) })
      log({ type: 'checklist_item', item: id, done })
    }

    const setEnergy = (energy) => {
      // selecting a new energy disarms a pending charge (real device behavior)
      clearInterval(chargeIvl.current)
      update({ energy, charging: false, chargeProgress: 0, shockReady: false })
    }

    const cycleEnergy = (dir) => {
      const s = stateRef.current
      const i = ENERGIES.indexOf(s.energy)
      const ni = Math.min(ENERGIES.length - 1, Math.max(0, (i < 0 ? 10 : i) + dir))
      setEnergy(ENERGIES[ni])
    }

    const charge = () => {
      const s = stateRef.current
      if (s.mode !== 'Defib' || s.charging || s.shockReady || s.analyzing) return
      log({ type: 'charge_attempt', energy: s.energy })
      update({ charging: true, chargeProgress: 0, shockReady: false })
      clearInterval(chargeIvl.current)
      const start = Date.now()
      chargeIvl.current = setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / CHARGE_MS)
        if (p >= 1) {
          clearInterval(chargeIvl.current)
          update({ charging: false, chargeProgress: 1, shockReady: true })
          log({ type: 'charge_complete', energy: stateRef.current.energy })
        } else {
          update({ chargeProgress: p })
        }
      }, 100)
    }

    const disarm = () => {
      clearInterval(chargeIvl.current)
      if (stateRef.current.charging || stateRef.current.shockReady) {
        log({ type: 'disarm', energy: stateRef.current.energy })
      }
      update({ charging: false, chargeProgress: 0, shockReady: false })
    }

    const analyze = () => {
      const s = stateRef.current
      if (s.analyzing || s.mode === 'Off') return
      log({ type: 'analyze_attempt', rhythm: s.rhythm })
      update({ analyzing: true, analyzeResult: null })
      clearTimeout(analyzeTo.current)
      analyzeTo.current = setTimeout(() => {
        const advised = stateRef.current.shockable
        update({ analyzing: false, analyzeResult: advised ? 'shock' : 'noshock' })
        log({
          type: 'analyze_result',
          result: advised ? 'shock_advised' : 'no_shock_advised',
          rhythm: stateRef.current.rhythm,
        })
      }, ANALYZE_MS)
    }

    const cancelAnalyze = () => {
      clearTimeout(analyzeTo.current)
      if (stateRef.current.analyzing) log({ type: 'analyze_cancel' })
      update({ analyzing: false })
    }

    const deliverShock = () => {
      const s = stateRef.current
      if (!s.shockReady) {
        log({ type: 'shock_failed', reason: 'not_charged', rhythm: s.rhythm })
        return
      }
      const sync = !!s.syncEnabled && isSyncable(s.rhythm)
      const fire = () => {
        const cur = stateRef.current
        update((p) => {
          const next = {
            shockReady: false,
            charging: false,
            chargeProgress: 0,
            shockCount: p.shockCount + 1,
          }
          if (p.autoConvert) Object.assign(next, outcomePatch(p))
          return next
        })
        log({
          type: sync ? 'sync_shock' : 'shock',
          energy: cur.energy,
          rhythm: cur.rhythm,
          sync,
          outcome: cur.autoConvert ? cur.shockOutcome : 'manual',
        })
        update({ lastEvent: { type: 'shock', at: Date.now(), energy: cur.energy, sync } })
      }
      if (sync) {
        log({ type: 'sync_wait', rhythm: s.rhythm })
        clearTimeout(shockTo.current)
        shockTo.current = setTimeout(fire, SYNC_WAIT_MS)
      } else {
        fire()
      }
    }

    const toggleSync = () => {
      const next = !stateRef.current.syncEnabled
      update({ syncEnabled: next })
      log({ type: 'sync_toggle', enabled: next })
    }

    // Softkey actions. Code Marker drops a timeline marker (used during a code for
    // the debrief); Async On/Off toggles asynchronous pacing; the rest are logged
    // so the session report shows which softkeys the learner used.
    const toggleRecorder = () => {
      const next = !stateRef.current.recording
      update({ recording: next })
      log({ type: next ? 'recorder_start' : 'recorder_stop' })
    }
    const codeMarker = () => log({ type: 'code_marker' })
    const softkeyPress = (label) => log({ type: 'softkey', label })
    const toggleAsyncPacing = () => {
      const next = !stateRef.current.asyncPacing
      update({ asyncPacing: next })
      log({ type: 'async_pacing', enabled: next })
    }

    // Apply a pacer-affecting patch, logging any capture transition it causes.
    const applyPacer = (patch, logEntry) => {
      const prev = stateRef.current
      const before = pacingCaptured(prev)
      const after = pacingCaptured({ ...prev, ...patch })
      update(patch)
      if (logEntry) log(logEntry)
      if (after && !before) {
        log({ type: 'capture_achieved', output: (patch.pacerOutput ?? prev.pacerOutput), threshold: prev.captureThreshold })
      } else if (!after && before) {
        log({ type: 'loss_of_capture', output: (patch.pacerOutput ?? prev.pacerOutput), threshold: prev.captureThreshold })
      }
    }

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

    const adjustPacerOutput = (delta) => {
      const v = clamp((stateRef.current.pacerOutput || 0) + delta, 0, 140)
      applyPacer({ pacerOutput: v }, { type: 'output_change', value: v })
    }
    const adjustPacerRate = (delta) => {
      const v = clamp((stateRef.current.pacerRate || 70) + delta, 30, 180)
      applyPacer({ pacerRate: v }, { type: 'rate_change', value: v })
    }
    const setFourToOne = (down) => {
      if (stateRef.current.fourToOne === down) return
      update({ fourToOne: down })
      log({ type: 'four_to_one', state: down ? 'press' : 'release' })
    }
    const setPacerResponse = (r) => {
      switch (r) {
        case 'capture':
          applyPacer({ captureMode: 'on' }, { type: 'patient_response', response: 'capture' })
          break
        case 'loss':
          applyPacer({ captureMode: 'off' }, { type: 'patient_response', response: 'loss_of_capture' })
          break
        case 'rosc':
          applyPacer(
            { captureMode: 'off', underlyingRhythm: 'Normal Sinus', hr: 84, spo2: 96, nibp: { sys: 118, dia: 74 } },
            { type: 'patient_response', response: 'rosc' },
          )
          break
        default:
          log({ type: 'patient_response', response: 'none' })
      }
    }

    // ---- CPR ----
    // Apply a CPR-affecting patch; recompute perfusion + log feedback changes.
    const applyCpr = (patch, logEntry) => {
      const prev = stateRef.current
      const merged = { ...prev, ...patch }
      const before = cprAssess(prev)
      const after = cprAssess(merged)
      patch.cprPerfusionIndicator = after.perfusion
      update(patch)
      if (logEntry) log(logEntry)
      if (after.message !== before.message) {
        log({ type: 'cpr_feedback', message: after.message })
      }
    }

    const startIdleTicker = () => {
      clearInterval(cprIdleIvl.current)
      let secs = stateRef.current.cprIdleTime || 0
      cprIdleIvl.current = setInterval(() => {
        secs += 1
        update({ cprIdleTime: secs })
        if ([10, 20, 30, 60].includes(secs)) log({ type: 'cpr_idle', seconds: secs })
      }, 1000)
    }

    const toggleCpr = () => {
      const active = !stateRef.current.cprActive
      if (active) {
        clearInterval(cprIdleIvl.current)
        applyCpr(
          { cprActive: true, cprIdleTime: 0 },
          { type: 'cpr_started', rate: stateRef.current.cprRate, depth: stateRef.current.cprDepth },
        )
      } else {
        applyCpr({ cprActive: false, cprIdleTime: 0 }, { type: 'cpr_stopped' })
        startIdleTicker()
      }
    }

    const setCprRelease = (q) => {
      const poor = q !== 'full'
      applyCpr(
        { cprReleaseQuality: q },
        { type: poor ? 'cpr_poor_release' : 'cpr_release', quality: q },
      )
    }

    const resetCprIdle = () => {
      update({ cprIdleTime: 0 })
      log({ type: 'cpr_idle_reset' })
      if (!stateRef.current.cprActive) startIdleTicker()
    }

    return {
      update,
      log,
      // Reset the CURRENT session scope (keeps the same sessionId / URL).
      reset: () => {
        clearTimers()
        setState({ ...DEFAULT_STATE, sessionId, sessionStart: Date.now(), sessionEnded: null })
      },
      // Reset just the run data (fresh start time + cleared log) within scope.
      resetSession: () => {
        clearTimers()
        const t = Date.now()
        update({
          ...DEFAULT_STATE,
          sessionId,
          sessionStart: t,
          sessionEnded: null,
          // preserve names + learner mode across a reset
          learnerName: stateRef.current.learnerName,
          evaluatorName: stateRef.current.evaluatorName,
          learnerMode: stateRef.current.learnerMode,
        })
        log({ type: 'session_started', sessionId })
      },
      // Copy current scenario/config into a brand-new session; returns its id.
      duplicateSession: () => {
        const id = newSessionId()
        const t = Date.now()
        const copy = {
          ...stateRef.current,
          sessionId: id,
          sessionStart: t,
          sessionEnded: null,
          eventLog: [],
          scenarioOutcome: null,
          facilitatorNotes: [],
        }
        try {
          localStorage.setItem(storageKeyFor(id), JSON.stringify(copy))
        } catch {
          // ignore
        }
        return id
      },
      endSession: () => update({ sessionEnded: Date.now() }),
      setLearnerName: (v) => update({ learnerName: v }),
      setEvaluatorName: (v) => update({ evaluatorName: v }),
      emitEvent: (type, extra = {}) =>
        update({ lastEvent: { type, at: Date.now(), ...extra } }),
      // device actions
      setMode,
      setEnergy,
      cycleEnergy,
      charge,
      disarm,
      analyze,
      cancelAnalyze,
      deliverShock,
      toggleSync,
      // pacer actions
      adjustPacerOutput,
      adjustPacerRate,
      setFourToOne,
      setPacerResponse,
      // live (drag) updates — no log; commit logs via applyPacer
      setPacerOutputLive: (v) => update({ pacerOutput: v }),
      commitPacerOutput: (v) => applyPacer({ pacerOutput: v }, { type: 'output_change', value: v }),
      setPacerRateLive: (v) => update({ pacerRate: v }),
      commitPacerRate: (v) => applyPacer({ pacerRate: v }, { type: 'rate_change', value: v }),
      setCaptureThresholdLive: (v) => update({ captureThreshold: v }),
      commitCaptureThreshold: (v) => applyPacer({ captureThreshold: v }, { type: 'threshold_change', value: v }),
      setCaptureMode: (m) => applyPacer({ captureMode: m }, { type: 'capture_mode', mode: m }),
      setIntermittent: (v) => update({ intermittentCapture: v }),
      setUnderlyingRhythm: (r) => update({ underlyingRhythm: r }),
      // CPR actions
      toggleCpr,
      setCprRelease,
      resetCprIdle,
      setCprRateLive: (v) => update({ cprRate: v }),
      commitCprRate: (v) => applyCpr({ cprRate: v }, { type: 'cpr_rate', value: v }),
      setCprDepthLive: (v) => update({ cprDepth: v }),
      commitCprDepth: (v) => applyCpr({ cprDepth: v }, { type: 'cpr_depth', value: v }),
      setCprArtifactLive: (v) => update({ cprArtifactIntensity: v }),
      commitCprArtifact: (v) => update({ cprArtifactIntensity: v }),
      setCprFeedbackMessage: (m) => applyCpr({ cprFeedbackMessage: m }, { type: 'cpr_feedback_set', message: m || 'auto' }),
      setLearnerMode: (m) => {
        update({ learnerMode: m })
        log({ type: m === 'education' ? 'education_mode' : m === 'validation' ? 'validation_mode' : 'learner_mode', mode: m })
      },
      setNotesPanel: (v) => {
        update({ notesPanelOn: v })
        log({ type: 'notes_panel', enabled: v })
      },
      // scenario engine
      loadScenario,
      resetScenario,
      advanceStep,
      forceDeteriorate,
      forceRosc,
      markSkill,
      addFacilitatorNote,
      toggleChecklist,
      // monitor: lead / size / alarms
      cycleLead,
      cycleSize,
      suspendAlarms,
      triggerTestAlarm,
      setAlarmSuspendDuration: (v) => update({ alarmSuspendDuration: v }),
      // vitals (live drag + commit-with-alarm-detection)
      setVitalLive: (key, v) => update({ [key]: v }),
      commitVital: (key, v) => applyMonitor({ [key]: v }, { type: 'vitals', param: key, value: v }),
      measureNibp,
      toggleRecorder,
      codeMarker,
      softkeyPress,
      toggleAsyncPacing,
      setAcConnected: (v) => { update({ acConnected: v }); log({ type: 'power', source: 'ac', state: v ? 'connected' : 'disconnected' }) },
      setBatteryStatus: (v) => { update({ batteryStatus: v }); log({ type: 'power', source: 'battery', state: v }) },
      setNibpLive: (part, v) => update((p) => ({ nibp: { ...p.nibp, [part]: v } })),
      commitNibp: (part, v) =>
        applyMonitor({ nibp: { ...stateRef.current.nibp, [part]: v } }, { type: 'vitals', param: 'nibp_' + part, value: v }),
      setAlarmLimit: (key, v) =>
        applyMonitor({ alarmLimits: { ...stateRef.current.alarmLimits, [key]: v } }, { type: 'alarm_limit', param: key, value: v }),
      // connections / display toggles
      setLeadsConnected: (v) => applyMonitor({ leadsConnected: v }, { type: 'connection', cable: 'leads', state: v ? 'connected' : 'disconnected' }),
      setPadsConnected: (v) => applyMonitor({ padsConnected: v }, { type: 'connection', cable: 'pads', state: v ? 'connected' : 'disconnected' }),
      setSpo2Connected: (v) => applyMonitor({ spo2Connected: v }, { type: 'connection', cable: 'spo2', state: v ? 'connected' : 'disconnected' }),
      setNibpAvailable: (v) => applyMonitor({ nibpAvailable: v }, { type: 'connection', cable: 'nibp', state: v ? 'connected' : 'disconnected' }),
      setEtco2Connected: (v) => applyMonitor({ etco2Connected: v }, { type: 'connection', cable: 'etco2', state: v ? 'connected' : 'disconnected' }),
      setPleth: (v) => { update({ plethOn: v }); log({ type: 'pleth', enabled: v }) },
      setCapno: (v) => { update({ capnoOn: v }); log({ type: 'capno', enabled: v }) },
      setSelfTest: (v) => { update({ selfTest: v }); log({ type: 'self_test', state: v }) },
      // facilitator setters
      setShockable: (v) => update({ shockable: v }),
      setPostShockRhythm: (r) => update({ postShockRhythm: r }),
      setAutoConvert: (v) => update({ autoConvert: v }),
      setShockOutcome: (o) => update({ shockOutcome: o }),
      clearLog: () => update({ eventLog: [] }),
    }
  }, [])

  const value = useMemo(() => ({ state, ...api }), [state, api])

  // ---- dev-only console debug helper: window.__sim ----
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__sim = {
      help: () => 'reset() · dump() · loadScenario(id) · simulateShock() · simulatePacingCapture() · simulateAlarm() · get(k)',
      dump: () => stateRef.current,
      get: (k) => stateRef.current[k],
      reset: api.resetSession,
      loadScenario: (id = 'vf-arrest') => api.loadScenario(id),
      simulateShock: () => {
        api.setMode('Defib')
        api.update({ shockReady: true, energy: 200 })
        setTimeout(() => api.deliverShock(), 30)
      },
      simulatePacingCapture: () => {
        api.setMode('Pacer')
        api.update({ pacerRate: 70, pacerOutput: 80, captureMode: 'on' })
      },
      simulateAlarm: () => api.triggerTestAlarm(),
    }
    return () => {
      if (window.__sim) delete window.__sim
    }
  }, [api])

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  )
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext)
  if (!ctx) {
    throw new Error('useSimulator must be used within a SimulatorProvider')
  }
  return ctx
}
