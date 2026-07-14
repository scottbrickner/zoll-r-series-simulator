/**
 * displayModel — adapt the live simulator `state` to the DisplayWidgets model
 * (Master Assembly Phase E). This is the state→display binding for the LCD: it
 * mirrors the legacy `LcdScreen` behaviour (charging / ANALYZING / SHOCK ADVISED /
 * DEFIB READY, SYNC markers, pacing spikes, CPR artifact, leads-off, alarms) but
 * renders through the firmware skeleton + widgets (Packages 4A/5).
 *
 * Manual-correct differences from the legacy screen: the elapsed clock is in the
 * bottom readout row (not the top band), the top band shows the MODE word, and CPR
 * feedback is the PPI + release bar + rate/depth readout — the "Push Harder" /
 * "Good Compressions" prompts are VOICE (auditory), never a screen banner (§6).
 *
 * Pure function — no React, no side effects.
 */
import { ecgFor, pacedPath, pacerSpikes, cprArtifactPath, qrsMarkers, FLAT } from '../waveforms'
import { pacingCaptured, cprAssess, monitorView, activeAlarms } from '../../../sync/SimulatorContext'
import { softkeysForMode } from './DisplayWidgets'

/** Center/right therapy message + tone (mirrors LcdScreen.modeMessage/messageClass). */
function therapyMessage(s, view) {
  if (view.padStatus) return { text: view.padStatus, tone: 'alert' }
  if (s.analyzing) return { text: 'ANALYZING', tone: 'status' }
  if (s.mode === 'Defib') {
    if (s.analyzeResult === 'shock') return { text: 'SHOCK ADVISED', tone: 'alert' }
    if (s.analyzeResult === 'noshock') return { text: 'NO SHOCK ADVISED', tone: 'ready' }
    if (s.charging) return { text: 'CHARGING', tone: 'charging' }
    if (s.shockReady) return { text: `${s.syncEnabled ? 'SYNC ' : ''}DEFIB ${s.energy}J READY`, tone: 'ready' }
    return { text: `DEFIB ${s.energy}J`, tone: 'status' }
  }
  if (s.mode === 'Pacer') return { text: s.asyncPacing ? 'ASYNC PACE' : 'PACE', tone: 'status' }
  return { text: 'MONITOR', tone: 'status' }
}

/** Bottom readout row: elapsed time + mode readouts (mirrors LcdScreen.ValueRow). */
function buildReadout(s, elapsed) {
  const r = { time: elapsed }
  if (s.cprActive) {
    // Real CPR Help dashboard numbers.
    r.center = `${s.cprRate}/min`
    r.right = `${(s.cprDepth / 10).toFixed(1)} cm`
  } else if (s.mode === 'Pacer') {
    r.center = `${s.pacerOutput} mA`
    r.right = `${s.fourToOne ? Math.round(s.pacerRate / 4) : s.pacerRate} PPM`
  } else if (s.mode === 'Defib') {
    r.center = `${s.energy} J SEL.`
    r.right = s.charging ? `${Math.round(s.chargeProgress * 100)}%` : s.shockReady ? 'CHARGED' : `Shocks: ${s.shockCount}`
  }
  return r
}

const RELEASE = { full: 'full', partial: 'partial', leaning: 'partial', none: 'none' }

export function displayModel(state, elapsed) {
  const s = state
  const view = monitorView(s)
  const pacing = s.mode === 'Pacer'
  const captured = pacingCaptured(s)
  const underlying = s.underlyingRhythm || 'Asystole'

  // Primary ECG path (mirror LcdScreen): leads-off → flat; pacing → paced or
  // underlying + spikes; else the current rhythm.
  let ecgPath
  let spikes = null
  if (view.leadsOff) {
    ecgPath = FLAT
  } else if (pacing) {
    if (s.asyncPacing) {
      // asynchronous (fixed-rate): spikes march through regardless of intrinsic beats
      ecgPath = ecgFor(underlying)
      spikes = pacerSpikes({ rate: s.pacerRate, fourToOne: s.fourToOne })
    } else if (captured) {
      ecgPath = pacedPath({ rate: s.pacerRate, capture: true, fourToOne: s.fourToOne, intermittent: s.intermittentCapture })
    } else {
      ecgPath = ecgFor(underlying)
      spikes = pacerSpikes({ rate: s.pacerRate, fourToOne: s.fourToOne })
    }
  } else {
    ecgPath = ecgFor(s.rhythm)
  }

  // See-Thru CPR: with CPR active, show PADS (raw + artifact) + FIL (filtered).
  const pads = s.cprActive
  const overlay = s.cprActive ? cprArtifactPath({ rate: s.cprRate, intensity: s.cprArtifactIntensity }) : null
  const filteredPath = s.cprActive ? ecgFor(s.rhythm) : null

  const syncing = s.mode === 'Defib' && s.syncEnabled
  const markers = syncing ? qrsMarkers(s.rhythm) : []
  const capno = !!s.capnoOn && view.etco2 != null && view.etco2 !== 0

  const lead = view.leadsOff ? '--' : pacing ? 'P3' : s.mode === 'Defib' ? 'PADS' : s.lead
  const gain = `x${s.ecgSize || 1}`

  const alarms = s.alarmsSuspended ? [] : activeAlarms(s)
  const alarmed = new Set(alarms.map((a) => a.param))

  const { text: msgText, tone } = therapyMessage(s, view)

  return {
    spo2: view.spo2 == null ? '- -' : view.spo2,
    spo2Alarm: alarmed.has('spo2'),
    nibp: view.nibp ? { sys: view.nibp.sys, dia: view.nibp.dia, mean: view.nibp.mean } : { sys: null, dia: null },
    nibpAlarm: alarmed.has('nibp'),
    co2: { etco2: view.etco2, rr: view.rr },
    co2Alarm: alarmed.has('etco2') || alarmed.has('rr'),
    mode: s.mode ? s.mode.toUpperCase() : 'MONITOR',
    hr: view.hr == null ? '- -' : view.hr,
    hrAlarm: alarmed.has('hr'),
    lead,
    gain,
    cpr: s.cprActive ? { release: RELEASE[s.cprReleaseQuality] || 'partial', perfusion: cprAssess(s).perfusion, active: true } : null,
    waveform: {
      ecgPath,
      filteredPath,
      pads,
      lead,
      pleth: view.spo2 != null,
      capno,
      spikes,
      overlay,
      markers,
      leadsOffText: view.leadsOff ? view.status || 'CHECK ECG LEADS' : null,
      recording: !!s.recording,
      live: s.mode !== 'Off', // scroll the traces live whenever the device is on
    },
    message: msgText ? { text: msgText, tone } : null,
    readout: buildReadout(s, elapsed),
    softkeys: softkeysForMode(s.mode),
    highlightLastKey: syncing,
    alarms: alarms.map((a) => a.message),
  }
}
