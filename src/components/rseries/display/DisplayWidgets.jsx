/**
 * DisplayWidgets — the on-screen LCD WIDGETS (Package 5).
 *
 * The reusable value / waveform / status parts that fill the firmware skeleton's
 * injection SLOTS (Package 4A). Each widget is a pure, presentational SVG `<g>`
 * authored in its region's LOCAL coordinate space (0,0 = region top-left, sized to
 * the region rect) so it drops straight into `DisplayFramework`'s `slots` prop, which
 * translates it to the region origin and clips it to the region bounds.
 *
 * These are PARTS, not behaviour: every widget is driven by props. Binding live
 * simulator state to them is the later React Wiring phase — nothing here reads app
 * state, animates, or mutates. Values, colours, and waveform paths reuse the frozen
 * primitives: the phosphor palette + anchors (`DisplayLayoutTokens.js`), the region
 * rectangles (`DisplayRegions.js`), and the waveform library (`waveforms.js`).
 *
 * Pair with `DisplayFramework showPlaceholders={false}` so the skeleton's dim value
 * stand-ins step aside and the widgets supply the live values.
 */
import { anchors, waveform, phosphor } from './DisplayLayoutTokens'
import { REGION_BY_ID } from './DisplayRegions'
import { ecgFor, PLETH_PATH, CAPNO_PATH } from '../waveforms'

const T = "'DejaVu Sans Mono', 'Consolas', 'SFMono-Regular', 'Menlo', 'Liberation Mono', 'Courier New', monospace"

// Region-local geometry helpers: baselines and trace extent inside the field.
const FIELD = REGION_BY_ID.waveformField.rect
const B = {
  ecg: waveform.baselines.ecg - FIELD.y, // 64
  pleth: waveform.baselines.pleth - FIELD.y, // 154
  co2: waveform.baselines.co2 - FIELD.y, // 244
}
const TRACE_X = 6
const TRACE_W = FIELD.w - 12 // leave the same 6px margin the chrome baselines use
const PITCH = anchors.softkeyPitch
const COLS = anchors.softkeyColumns

/**
 * A waveform trace centered on a field baseline. Paths live in 300×80 space.
 * When `live`, the trace scrolls left continuously (two tiled copies + a SMIL
 * translate) so the rhythm reads as a live monitor sweep; else it's static.
 */
function Trace({ d, base, color, height = 78, width = 2, live = false, dur = 6 }) {
  const strokeProps = { fill: 'none', stroke: color, strokeWidth: width, strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }
  return (
    <svg x={TRACE_X} y={base - height / 2} width={TRACE_W} height={height} viewBox="0 0 300 80" preserveAspectRatio="none" overflow={live ? 'hidden' : 'visible'}>
      {live ? (
        <g>
          <animateTransform attributeName="transform" type="translate" from="0 0" to="-300 0" dur={`${dur}s`} repeatCount="indefinite" />
          <path d={d} {...strokeProps} />
          <path d={d} transform="translate(300 0)" {...strokeProps} />
        </g>
      ) : (
        <path d={d} {...strokeProps} />
      )}
    </svg>
  )
}

// ── Left parameter column ─────────────────────────────────────────────────
// Alarm flash reuses the LCD stylesheet's `lcd-alarm-flash` animation.
const flashCls = (on) => (on ? 'lcd-alarm-flash' : undefined)

/** SpO₂ % — cyan numeric (region paramSpO2). `alarm` flashes on breach. */
export function Spo2Widget({ value = '- - -', alarm = false } = {}) {
  return (
    <g fontFamily={T}>
      <text x="12" y="66" className={flashCls(alarm)} fill={phosphor.cyan} fontSize="30" fontWeight="700">{value}</text>
    </g>
  )
}

/** NIBP sys/dia (mean) mmHg + time of reading — white (region paramNIBP, local). */
export function NibpWidget({ sys, dia, mean, time, alarm = false } = {}) {
  const has = sys != null && dia != null
  return (
    <g fontFamily={T} fill={phosphor.white}>
      <text x="12" y="82" className={flashCls(alarm)} fontSize="22" fontWeight="700">{has ? `${sys}/${dia}` : '- - -'}</text>
      {mean != null && <text x="14" y="104" fontSize="14">({mean})</text>}
      {time && <text x="70" y="104" fontSize="11" fillOpacity="0.7">{time}</text>}
    </g>
  )
}

/** CO₂ (EtCO₂) mmHg + respiratory rate — amber (region paramCO2RR, local). */
export function Co2Widget({ etco2, rr, alarm = false } = {}) {
  return (
    <g fontFamily={T} fill={phosphor.amber} className={flashCls(alarm)}>
      <text x="12" y="74" fontSize="24" fontWeight="700">{etco2 != null ? etco2 : '- -'}</text>
      <text x="12" y="104" fontSize="14">RR {rr != null ? rr : '- -'}</text>
    </g>
  )
}

// ── Top status band ───────────────────────────────────────────────────────
/**
 * Operating mode / status word — magenta (region statusClockMode, local).
 * Per the R Series display (Operator's Guide Fig. 2-2), the top-left shows the MODE /
 * status word (IDLE / MONITOR / DEFIB / PACER); the elapsed-time clock is NOT here — it
 * lives in the bottom readout row (`ReadoutRowWidget`).
 */
export function ModeWidget({ mode = 'MONITOR' } = {}) {
  return (
    <g fontFamily={T} fill={phosphor.magenta}>
      <text x="8" y="30" fontSize="13">MODE</text>
      <text x="8" y="66" fontSize="26" fontWeight="700">{mode}</text>
    </g>
  )
}

const RELEASE_COLOR = { full: '#36d44a', partial: phosphor.amber, none: phosphor.red }
/**
 * CPR release bar fill + PPI (perfusion) diamond fill (region statusCpr, local).
 * The bar/diamond OUTLINES are drawn by the skeleton chrome; this fills them.
 *   release   'full' | 'partial' | 'none'
 *   perfusion 0..1 perfusion-performance level
 *   active    whether CPR is in progress (gates the PPI fill)
 */
export function CprWidget({ release = 'full', perfusion = 0.8, active = true } = {}) {
  // Bar outline (chrome): x=4,y=30,w=12,h=42 in local space. Fill from the bottom.
  const barH = 40
  const fill = release === 'full' ? 1 : release === 'partial' ? 0.5 : 0.18
  const ppi = RELEASE_COLOR[perfusion >= 0.7 ? 'full' : perfusion >= 0.4 ? 'partial' : 'none']
  return (
    <g>
      <rect x="5" y={31 + barH * (1 - fill)} width="10" height={barH * fill} fill={RELEASE_COLOR[release]} />
      {active && <path d="M60,33 L81,52 L60,71 L39,52 Z" fill={ppi} fillOpacity={0.25 + perfusion * 0.6} />}
    </g>
  )
}

/** ECG lead / gain, heart glyph, and the large HR readout — green (region statusEcgHr, local). */
export function EcgHrWidget({ lead = 'II', gain = 'x1', hr = '- -', alarm = false } = {}) {
  return (
    <g fontFamily={T} fill={phosphor.green}>
      <text x="6" y="22" fontSize="13">ECG</text>
      {/* lead + gain stacked so long lead names (e.g. PADDLES) don't collide */}
      <text x="6" y="42" fontSize="12">{lead}</text>
      <text x="6" y="58" fontSize="12" fillOpacity="0.85">{gain}</text>
      <text x="92" y="26" fontSize="14">♥</text>
      <text x="212" y="72" textAnchor="end" className={flashCls(alarm)} fontSize="46" fontWeight="700">{hr}</text>
    </g>
  )
}

// ── Continuous waveform field ─────────────────────────────────────────────
/**
 * Build the up-to-three trace descriptors for the waveform field from a waveform
 * model. Trace channels are MODE-DEPENDENT (R Series Operator's Guide):
 *   • Default (MONITOR): ECG (lead) · Pleth (SpO₂) · CO₂ capnogram.
 *   • With CPR pads + See-Thru CPR (DEFIB / CPR): Trace 1 = raw ECG from pads
 *     labeled **PADS**, Trace 2 = filtered ECG labeled **FIL** (removes CPR artifact),
 *     Trace 3 = CO₂. (PADS/FIL is not used in PACER — that shows lead II / P3.)
 *
 *   rhythm    ECG rhythm key for `ecgFor()` (Trace 1)
 *   ecgPath   explicit primary ECG path (overrides rhythm; e.g. paced/leads-off)
 *   filteredPath  explicit path for the FIL trace when on pads
 *   pads      use the PADS + FIL See-Thru CPR arrangement
 *   filtered  rhythm key revealed on the FIL trace (defaults to `rhythm`)
 *   lead      Trace 1 lead label when not on pads (e.g. 'II', 'P3'); defaults 'ECG'
 *   pleth     draw the SpO₂ pleth trace (ignored when `pads`)
 *   capno     draw the CO₂ capnogram
 */
export function waveTraces({ rhythm = 'Normal Sinus', ecgPath, filteredPath, pads = false, filtered, lead, pleth = true, capno = true } = {}) {
  const ecg = ecgPath || ecgFor(rhythm)
  const t = [{ label: pads ? 'PADS' : lead || 'ECG', base: B.ecg, color: phosphor.green, d: ecg, height: 78 }]
  if (pads) t.push({ label: 'FIL', base: B.pleth, color: phosphor.green, d: filteredPath || ecgPath || ecgFor(filtered || rhythm), height: 70 })
  else if (pleth) t.push({ label: 'Pleth', base: B.pleth, color: phosphor.cyan, d: PLETH_PATH, height: 64 })
  if (capno) t.push({ label: 'CO₂', base: B.co2, color: phosphor.amber, d: CAPNO_PATH, height: 64 })
  return t
}

/**
 * The waveform field (region waveformField, local 535×306): traces + channel tags,
 * plus optional live overlays aligned to the ECG baseline:
 *   spikes       pacer-spike path (drawn over the ECG trace)
 *   overlay      CPR-artifact path (drawn over the ECG trace)
 *   markers      sync QRS marker x-positions (in 0..300 trace space)
 *   leadsOffText message shown across the ECG when leads are off
 *   alarms       active alarm messages → flashing banner at the top of the field
 *   recording    strip-chart recorder running → blinking REC + scrolling strip
 */
export function WaveformFieldWidget({ traces = [], spikes, overlay, markers = [], leadsOffText, alarms = [], recording = false, live = false } = {}) {
  return (
    <g>
      {recording && (
        <g fontFamily={T}>
          {/* running paper strip: dashes scroll to suggest the recorder feeding */}
          <line x1={TRACE_X} y1="7" x2={FIELD.w - 96} y2="7" stroke={phosphor.red} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="7 5" className="lcd-rec-strip" />
          <circle cx={FIELD.w - 84} cy="12" r="5" fill={phosphor.red} className="lcd-rec-blink" />
          <text x={FIELD.w - 74} y="17" fill={phosphor.red} fontSize="13" fontWeight="800">REC</text>
        </g>
      )}
      {traces.map((tr, i) => (
        <g key={i}>
          <text x={TRACE_X} y={tr.base - 30} fontFamily={T} fill={tr.color} fillOpacity="0.85" fontSize="13">{tr.label}</text>
          <Trace d={tr.d} base={tr.base} color={tr.color} height={tr.height} live={live} />
        </g>
      ))}
      {overlay && <Trace d={overlay} base={B.ecg} color={phosphor.green} height={78} width={1.25} live={live} />}
      {spikes && <Trace d={spikes} base={B.ecg} color={phosphor.white} height={78} width={1.5} live={live} />}
      {markers.map((mx, i) => {
        const x = TRACE_X + (mx / 300) * TRACE_W
        return <path key={i} d={`M${x - 5},${B.ecg - 42} L${x + 5},${B.ecg - 42} L${x},${B.ecg - 34} Z`} fill={phosphor.amber} />
      })}
      {leadsOffText && (
        <text x={FIELD.w / 2} y={B.ecg} textAnchor="middle" fontFamily={T} className="lcd-alarm-flash" fill={phosphor.red} fontSize="20" fontWeight="700">{leadsOffText}</text>
      )}
      {alarms.length > 0 && (
        <text x={FIELD.w / 2} y="18" textAnchor="middle" fontFamily={T} className="lcd-alarm-flash" fill={phosphor.red} fontSize="16" fontWeight="800">
          ⚠ {alarms[0]}{alarms.length > 1 ? ` +${alarms.length - 1}` : ''}
        </text>
      )}
    </g>
  )
}

// ── Message zone (overlay, inside the waveform field) ─────────────────────
const TONE_COLOR = {
  status: phosphor.white,
  ready: '#36d44a',
  alert: phosphor.red,
  prompt: phosphor.amber,
  charging: phosphor.white,
}
/**
 * Mode / therapy message drawn inside the waveform field (region messageArea, local).
 * For firmware mode/therapy prompts only — MONITOR, DEFIB XXXJ READY, ANALYZING, SHOCK
 * ADVISED, PACE, SET PACE MA, etc. NOT for CPR feedback: "Push Harder" / "Good
 * Compressions" are VOICE prompts (auditory), and on-screen CPR feedback is the Real CPR
 * Help field (PPI + release bar + rate/depth), not this banner (Operator's Guide §6).
 */
export function MessageWidget({ text = 'MONITOR', tone = 'status' } = {}) {
  if (!text) return null
  return (
    <g fontFamily={T}>
      <text x={REGION_BY_ID.messageArea.rect.w / 2} y="92" textAnchor="middle" fill={TONE_COLOR[tone] || phosphor.white} fontSize="28" fontWeight="700" letterSpacing="1">
        {text}
      </text>
    </g>
  )
}

// ── Time / readout row ────────────────────────────────────────────────────
/** Firmware readout line: time at far left, then mode readouts (region readoutRow, local). */
export function ReadoutRowWidget({ time = '--:--', center, right } = {}) {
  return (
    <g fontFamily={T} fill={phosphor.white}>
      {time && <text x="8" y="30" fontSize="18">{time}</text>}
      {center && <text x="300" y="30" fontSize="16" fontWeight="700">{center}</text>}
      {right && <text x="470" y="30" fontSize="16" fontWeight="700">{right}</text>}
    </g>
  )
}

// ── Softkey label strip ───────────────────────────────────────────────────
/**
 * The six firmware softkey labels for a mode (R Series Operator's Guide, Fig. 2-2 /
 * §5 / §8). The first five are constant; the sixth is the mode toggle. ENERGY SELECT,
 * CHARGE, ANALYZE, OUTPUT mA, RATE ppm and 4:1 are PHYSICAL front-panel buttons
 * (Table 2-2), NOT softkeys, so they never appear here.
 *   • MONITOR / DEFIB → "Sync On/Off"
 *   • PACER           → "Async On/Off" (Async Pacing On/Off)
 */
const SOFTKEYS_BASE = ['Options', 'Param', 'Code Marker', 'Report Data', 'Alarms']
export function softkeysForMode(mode = 'MONITOR') {
  // case-insensitive: accepts 'Pacer' (app state) or 'PACER' (uppercased display).
  return [...SOFTKEYS_BASE, String(mode).toUpperCase() === 'PACER' ? 'Async On/Off' : 'Sync On/Off']
}

/** Mode-dependent softkey labels, centered per column (region softkeyStrip, local). */
export function SoftkeyWidget({ labels = [], highlightLast = false } = {}) {
  return (
    <g fontFamily={T}>
      {labels.slice(0, COLS).map((label, i) => (
        <text key={i} x={i * PITCH + PITCH / 2} y="32" textAnchor="middle" fill={highlightLast && i === COLS - 1 ? phosphor.amber : phosphor.white} fontSize="12" fontWeight="700">
          {label}
        </text>
      ))}
    </g>
  )
}

// ── Mounting helper ───────────────────────────────────────────────────────
/**
 * Map a display MODEL to a `slots` object for `DisplayFramework`. Only the regions
 * present in the model get a widget; the rest fall back to skeleton chrome. Pass the
 * result straight to `<DisplayFramework slots={mountWidgets(model)} showPlaceholders={false} />`.
 *
 * model shape (all optional):
 *   spo2 (+spo2Alarm), nibp:{sys,dia,mean,time} (+nibpAlarm), co2:{etco2,rr} (+co2Alarm)
 *   mode, hr (+hrAlarm), lead, gain
 *   cpr:{release,perfusion,active}
 *   waveform:{rhythm|ecgPath, filteredPath, pads, filtered, lead, pleth, capno,
 *             spikes, overlay, markers, leadsOffText}
 *   message:{text,tone}, readout:{time,center,right}, softkeys:[…], alarms:[…]
 *
 * The elapsed-time clock is the readout row's `time` (bottom-left), NOT the top band —
 * the top band's `statusClockMode` slot carries the MODE word (see `ModeWidget`).
 */
export function mountWidgets(model = {}) {
  const s = {}
  if (model.spo2 != null) s.paramSpO2 = <Spo2Widget value={model.spo2} alarm={model.spo2Alarm} />
  if (model.nibp) s.paramNIBP = <NibpWidget {...model.nibp} alarm={model.nibpAlarm} />
  if (model.co2) s.paramCO2RR = <Co2Widget {...model.co2} alarm={model.co2Alarm} />
  if (model.mode != null) s.statusClockMode = <ModeWidget mode={model.mode} />
  if (model.cpr) s.statusCpr = <CprWidget {...model.cpr} />
  if (model.hr != null || model.lead != null) s.statusEcgHr = <EcgHrWidget hr={model.hr} lead={model.lead} gain={model.gain} alarm={model.hrAlarm} />
  if (model.waveform) {
    const w = model.waveform
    s.waveformField = <WaveformFieldWidget traces={waveTraces(w)} spikes={w.spikes} overlay={w.overlay} markers={w.markers} leadsOffText={w.leadsOffText} alarms={model.alarms} recording={w.recording} live={w.live} />
  }
  if (model.message) s.messageArea = <MessageWidget {...model.message} />
  if (model.readout) s.readoutRow = <ReadoutRowWidget {...model.readout} />
  if (model.softkeys) s.softkeyStrip = <SoftkeyWidget labels={model.softkeys} highlightLast={model.highlightLastKey} />
  return s
}
