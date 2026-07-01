import {
  ecgFor,
  isNonPerfusing,
  qrsMarkers,
  pacedPath,
  pacerSpikes,
  cprArtifactPath,
  CAPNO_PATH,
  FLAT,
} from './waveforms'
import { pacingCaptured, cprAssess, monitorView, activeAlarms } from '../../sync/SimulatorContext'

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
// scale the ECG channel vertically about the baseline (y=40) per SIZE gain
const sizeTransform = (size) => `translate(0 ${(40 - 40 * (size || 1)).toFixed(1)}) scale(1 ${size || 1})`

// ECG trace placement inside the LCD (local 673 x 515 space)
const TRACE = { x: 196, y: 150, w: 472, h: 120 }

/**
 * Live LCD content in the display's 673 x 515 local coordinate space.
 * Mirrors the synced state and the DEFIB / cardioversion device behavior:
 * charging progress, ANALYZING / SHOCK ADVISED, DEFIB READY, SYNC indicator,
 * and sync markers above each QRS when synchronized cardioversion is enabled.
 */
export default function LcdScreen({ state, elapsed }) {
  const pacing = state.mode === 'Pacer'
  const captured = pacingCaptured(state)
  const underlying = state.underlyingRhythm || 'Asystole'
  const view = monitorView(state)

  // ECG trace: leads-off → flat; pacing → paced/underlying; else rhythm.
  let ecg
  let spikes = null
  if (view.leadsOff) {
    ecg = FLAT
  } else if (pacing) {
    if (captured) {
      ecg = pacedPath({ rate: state.pacerRate, capture: true, fourToOne: state.fourToOne, intermittent: state.intermittentCapture })
    } else {
      ecg = ecgFor(underlying)
      spikes = pacerSpikes({ rate: state.pacerRate, fourToOne: state.fourToOne })
    }
  } else {
    ecg = ecgFor(state.rhythm)
  }

  // displayed values (null → dashes)
  const dash3 = '- - -'
  const hrText = view.hr == null ? '- -' : view.hr
  const spo2Text = view.spo2 == null ? dash3 : view.spo2
  const nibpText = view.nibp == null ? dash3 : `${view.nibp.sys}/${view.nibp.dia}`
  const etco2Text = view.etco2 == null ? '- -' : view.etco2
  const rrText = view.rr == null ? '- -' : view.rr

  const capno = !state.capnoOn || view.etco2 == null || view.etco2 === 0 ? FLAT : CAPNO_PATH
  const syncing = state.mode === 'Defib' && state.syncEnabled
  const markers = syncing ? qrsMarkers(state.rhythm) : []

  // alarms
  const suspended = state.alarmsSuspended
  const alarms = activeAlarms(state)
  const visibleAlarms = suspended ? [] : alarms
  const alarmedParams = new Set(visibleAlarms.map((a) => a.param))
  const flashCls = (param) => (alarmedParams.has(param) ? ' lcd-alarm-flash' : '')
  const suspendRemain = suspended ? Math.max(0, Math.ceil((state.alarmSuspendUntil - Date.now()) / 1000)) : 0
  const sizeT = sizeTransform(state.ecgSize)

  // CPR feedback
  const cpr = cprAssess(state)
  const cprArtifact = state.cprActive
    ? cprArtifactPath({ rate: state.cprRate, intensity: state.cprArtifactIntensity })
    : null
  const releaseFill = state.cprReleaseQuality === 'full' ? 1 : state.cprReleaseQuality === 'partial' ? 0.5 : 0.18
  const ppiColor = cpr.perfusion >= 0.7 ? '#36d44a' : cpr.perfusion >= 0.4 ? '#ffce3a' : '#ff5a4d'

  return (
    <g className="lcd">
      <line x1="186" y1="118" x2="673" y2="118" className="lcd__rule" />
      <line x1="186" y1="0" x2="186" y2="452" className="lcd__rule" />

      {/* ---- left parameter column ---- */}
      <text x="16" y="34" className="lcd-cyan" fontSize="24">SpO2 %</text>
      <text x="22" y="86" className={`lcd-cyan${flashCls('spo2')}`} fontSize="40">{spo2Text}</text>

      <text x="16" y="176" className="lcd-white" fontSize="22">
        NIBP <tspan fontSize="16">mmHg</tspan>
      </text>
      <text x="22" y="214" className={`lcd-white${flashCls('nibp')}`} fontSize="22">{nibpText}</text>
      {view.nibp != null && <text x="22" y="240" className="lcd-white" fontSize="15">({view.nibp.mean})</text>}

      <text x="16" y="306" className="lcd-amber" fontSize="22">
        CO2 <tspan fontSize="16">mmHg</tspan>
      </text>
      <text x="22" y="356" className={`lcd-amber${flashCls('etco2')}`} fontSize="38">{etco2Text}</text>
      <text x="22" y="392" className={`lcd-amber${flashCls('rr')}`} fontSize="18">RR <tspan>{rrText}</tspan></text>

      {/* ---- top status band ---- */}
      <text x="204" y="34" className="lcd-mag" fontSize="26">IDLE</text>
      <text x="204" y="84" className="lcd-mag" fontSize="42">{elapsed}</text>

      <text x="430" y="32" className="lcd-mag" fontSize="22">CPR</text>
      {/* Release indicator bar (fills with full release) */}
      <rect x="404" y="40" width="18" height="52" className="lcd-mag-stroke" />
      <rect x="406" y={42 + 48 * (1 - releaseFill)} width="14" height={48 * releaseFill} fill={state.cprReleaseQuality === 'full' ? '#36d44a' : state.cprReleaseQuality === 'partial' ? '#ffce3a' : '#ff5a4d'} />
      {/* Perfusion Performance Indicator diamond (filled by perfusion) */}
      <path d="M460,42 L488,66 L460,90 L432,66 Z" className="lcd-mag-stroke" />
      {state.cprActive && <path d="M460,42 L488,66 L460,90 L432,66 Z" fill={ppiColor} opacity={0.25 + cpr.perfusion * 0.6} />}
      <text x="392" y="110" className="lcd-mag" fontSize="17">Release</text>
      <text x="452" y="110" className="lcd-mag" fontSize="17">PPI</text>
      {/* CPR rate / depth + idle time */}
      {state.cprActive ? (
        <>
          <text x="430" y="128" className="lcd-mag" fontSize="16" textAnchor="middle">{state.cprRate}/min · {(state.cprDepth / 10).toFixed(1)}cm</text>
        </>
      ) : state.cprIdleTime > 0 ? (
        <text x="430" y="128" className={state.cprIdleTime >= 10 ? 'lcd-msg-alert' : 'lcd-amber'} fontSize="16" textAnchor="middle">CPR IDLE {fmtClock(state.cprIdleTime)}</text>
      ) : null}

      <text x="556" y="30" className="lcd-grn" fontSize="22">ECG</text>
      <text x="556" y="54" className="lcd-grn" fontSize="20">{pacing ? 'P1' : view.leadsOff ? '--' : state.lead}</text>
      <text x="618" y="54" className="lcd-grn" fontSize="20">x{state.ecgSize}</text>
      <text x="666" y="92" className={`lcd-grn lcd-hr${flashCls('hr')}`} textAnchor="end" fontSize="64">{hrText}</text>

      {/* ---- SYNC indicator ---- */}
      {syncing && (
        <text x="200" y="138" className="lcd-amber" fontSize="20" fontWeight="700">SYNC</text>
      )}

      {/* ---- alarm banner / suspend indicator (top center) ---- */}
      {visibleAlarms.length > 0 && (
        <text x="300" y="16" className="lcd-msg-alert lcd-alarm-flash" fontSize="18" fontWeight="800" textAnchor="middle">
          ⚠ {visibleAlarms[0].message}{visibleAlarms.length > 1 ? ` +${visibleAlarms.length - 1}` : ''}
        </text>
      )}
      {suspended && (
        <text x="300" y="16" className="lcd-amber" fontSize="16" fontWeight="700" textAnchor="middle">
          ⊘ ALARMS SUSPENDED {fmtClock(suspendRemain)}
        </text>
      )}

      {/* ---- ECG waveform (gain-scaled) ---- */}
      <text x={TRACE.x + 4} y={TRACE.y - 4} className="lcd-grn" fontSize="18">ECG</text>
      <svg x={TRACE.x} y={TRACE.y} width={TRACE.w} height={TRACE.h} viewBox="0 0 300 80" preserveAspectRatio="none">
        <g transform={sizeT}>
          <path className={state.running ? 'lcd-trace lcd-trace--sweep' : 'lcd-trace'} d={ecg} />
          {spikes && <path className="lcd-trace lcd-pacer-spike" d={spikes} />}
          {cprArtifact && <path className={`lcd-trace lcd-cpr-artifact ${state.running ? 'lcd-trace--sweep' : ''}`} d={cprArtifact} />}
        </g>
      </svg>
      {/* leads-off message over the ECG */}
      {view.leadsOff && (
        <text x={TRACE.x + TRACE.w / 2} y={TRACE.y + TRACE.h / 2} className="lcd-msg-alert" fontSize="22" fontWeight="700" textAnchor="middle">
          {view.status}
        </text>
      )}
      {/* CPR feedback message */}
      {state.cprActive && (
        <text x={TRACE.x + TRACE.w / 2} y={TRACE.y - 4} textAnchor="middle" fontSize="20" fontWeight="700" className={cpr.perfusion >= 0.7 ? 'lcd-msg-ok' : 'lcd-msg-alert'}>
          {cpr.message}
        </text>
      )}
      {/* sync markers above each QRS */}
      {markers.map((mx, i) => {
        const sx = TRACE.x + (mx / 300) * TRACE.w
        return <path key={i} d={`M${sx - 5},${TRACE.y - 2} L${sx + 5},${TRACE.y - 2} L${sx},${TRACE.y + 6} Z`} className="lcd-sync-marker" />
      })}

      {/* ---- CO2 capnogram ---- */}
      <text x="200" y="288" className="lcd-amber" fontSize="18">CO2</text>
      <svg x="196" y="292" width="472" height="104" viewBox="0 0 300 80" preserveAspectRatio="none">
        <path className={state.running ? 'lcd-trace lcd-trace--amber lcd-trace--sweep' : 'lcd-trace lcd-trace--amber'} d={capno} />
      </svg>

      {/* ---- mode / therapy message (pad status takes priority in Defib) ---- */}
      <text x="430" y="430" className={view.padStatus ? 'lcd-msg-alert lcd-alarm-flash' : `lcd-white ${messageClass(state)}`} textAnchor="middle" fontSize={view.padStatus ? 28 : 36}>
        {view.padStatus || modeMessage(state)}
      </text>

      {/* ---- charging progress bar ---- */}
      {state.mode === 'Defib' && state.charging && (
        <g>
          <rect x="300" y="444" width="264" height="14" rx="3" fill="none" stroke="#e6ebef" strokeWidth="1.5" />
          <rect x="302" y="446" width={260 * state.chargeProgress} height="10" rx="2" className="lcd-charge-fill" />
        </g>
      )}

      {/* ---- value row ---- */}
      <ValueRow state={state} />

      {/* ---- softkey labels ---- */}
      <line x1="0" y1="468" x2="673" y2="468" className="lcd__rule" />
      {SOFTKEYS(state).map((label, i) => (
        <g key={i}>
          {i > 0 && <line x1={i * 112} y1="472" x2={i * 112} y2="512" className="lcd__rule" />}
          <text x={i * 112 + 56} y="491" className={`lcd-white ${i === 5 && syncing ? 'lcd-amber' : ''}`} textAnchor="middle" fontSize="15">{label[0]}</text>
          {label[1] && <text x={i * 112 + 56} y="507" className={`lcd-white ${i === 5 && syncing ? 'lcd-amber' : ''}`} textAnchor="middle" fontSize="15">{label[1]}</text>}
        </g>
      ))}
    </g>
  )
}

function ValueRow({ state }) {
  if (state.mode === 'Pacer') {
    const captured = pacingCaptured(state)
    return (
      <>
        <text x="150" y="452" className="lcd-white" textAnchor="middle" fontSize="24">{state.pacerOutput} mA</text>
        <text x="320" y="452" className="lcd-white" textAnchor="middle" fontSize="24">{state.fourToOne ? Math.round(state.pacerRate / 4) : state.pacerRate} PPM</text>
        <text x="500" y="452" textAnchor="middle" fontSize="22" className={captured ? 'lcd-msg-ok' : 'lcd-amber'}>
          {captured ? 'CAPTURE' : 'NO CAPTURE'}
        </text>
        <text x="630" y="452" className="lcd-white" textAnchor="middle" fontSize="18">{state.fourToOne ? '4:1' : 'Async'}</text>
      </>
    )
  }
  if (state.mode === 'Defib') {
    const right = state.charging
      ? `${Math.round(state.chargeProgress * 100)}%`
      : state.shockReady
        ? 'CHARGED'
        : 'Shocks: ' + state.shockCount
    return (
      <>
        <text x="250" y="452" className="lcd-white" textAnchor="middle" fontSize="24">{state.energy} J SEL.</text>
        <text x="500" y="452" className="lcd-white" textAnchor="middle" fontSize="24">{right}</text>
      </>
    )
  }
  return null
}

function modeMessage(state) {
  if (state.analyzing) return 'ANALYZING'
  if (state.mode === 'Defib') {
    if (state.analyzeResult === 'shock') return 'SHOCK ADVISED'
    if (state.analyzeResult === 'noshock') return 'NO SHOCK ADVISED'
    if (state.charging) return 'CHARGING'
    if (state.shockReady) return `${state.syncEnabled ? 'SYNC ' : ''}DEFIB ${state.energy}J READY`
    return `DEFIB ${state.energy}J`
  }
  if (state.mode === 'Pacer') return 'PACE'
  return 'MONITOR'
}

function messageClass(state) {
  if (state.analyzeResult === 'shock' || state.shockReady) return 'lcd-msg-alert'
  if (state.analyzeResult === 'noshock') return 'lcd-msg-ok'
  return ''
}

function SOFTKEYS(state) {
  const last = state.mode === 'Pacer' ? ['Pacing', 'On/Off'] : ['Sync', 'On/Off']
  return [['Options'], ['Param'], ['Code', 'Marker'], ['Report', 'Data'], ['Alarms'], last]
}
