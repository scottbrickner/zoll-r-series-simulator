/**
 * FirmwareReference — a traced reconstruction of the ZOLL R Series FIRMWARE LCD
 * (Package 4A, the "Manufacturer" comparison stand-in).
 *
 * A firmware-LAYOUT reconstruction aligned to the same measured anchors as the
 * skeleton (`DisplayLayoutTokens.js`) — a vector reconstruction for this training
 * simulator so the skeleton can be overlaid against a firmware-shaped screen. It is
 * NOT a copy of any screenshot. If a real manufacturer capture is available, drop it
 * at `public/lcd_reference.png`; the review page shows it in this panel's place.
 *
 * It reproduces firmware structure with representative static readouts: SpO₂ at the
 * top-left, a compressed status band (clock · CPR release/PPI · lead/gain/♥/HR), a
 * narrow left parameter column (NIBP, CO₂/RR), one continuous waveform field with
 * ECG / Pleth / CO₂ on their baselines, a mode word inside the field, a time / readout
 * row, and the firmware softkey label strip. No simulator logic.
 *
 * Returns a <g> in 673 × 515 space; the consumer supplies the enclosing <svg>.
 */
import { lcd, anchors, waveform, phosphor } from './DisplayLayoutTokens'

const F = "'DejaVu Sans Mono', 'Consolas', 'Menlo', 'Courier New', monospace"
const DIV = anchors.paramDividerX
const TOP = anchors.topRuleY
const WB = waveform.bottom
const SK = anchors.softkeyRuleY
const COLS = anchors.softkeyColumns
const PITCH = anchors.softkeyPitch
const W = lcd.width
const B = waveform.baselines

// Representative repeating ECG stroke centered on a baseline across [x0, x1].
function ecgPath(x0, x1, base, beat = 108) {
  let d = `M${x0},${base}`
  for (let p = x0; p < x1; p += beat) {
    d +=
      ` L${p + 12},${base} Q${p + 18},${base - 5} ${p + 24},${base}` +
      ` L${p + 36},${base} L${p + 40},${base + 4} L${p + 44},${base - 28} L${p + 48},${base + 10} L${p + 52},${base}` +
      ` L${p + 66},${base} Q${p + 74},${base - 10} ${p + 82},${base}` +
      ` L${p + beat},${base}`
  }
  return d
}

// Representative pleth (rounded pulse) across [x0, x1].
function plethPath(x0, x1, base, amp = 20, period = 96) {
  let d = `M${x0},${base}`
  for (let p = x0; p < x1; p += period) {
    d += ` Q${p + 20},${base - amp} ${p + 40},${base - amp * 0.5} T${p + period},${base}`
  }
  return d
}

// Representative capnogram (rounded plateaus) across [x0, x1].
function capnoPath(x0, x1, base, amp = 22, period = 140) {
  let d = `M${x0},${base}`
  for (let p = x0; p < x1; p += period) {
    d +=
      ` L${p + 16},${base} C${p + 24},${base} ${p + 28},${base - amp} ${p + 38},${base - amp}` +
      ` L${p + period - 38},${base - amp} C${p + period - 28},${base - amp} ${p + period - 24},${base} ${p + period - 16},${base}` +
      ` L${p + period},${base}`
  }
  return d
}

const SOFTKEYS = ['Options', 'Param', 'Code Marker', 'Report Data', 'Alarms', 'Sync On/Off']

export default function FirmwareReference() {
  return (
    <g className="firmware-reference" fontFamily={F}>
      <rect x="0" y="0" width={lcd.width} height={lcd.height} fill={phosphor.background} />

      {/* firmware hairline rules */}
      <g stroke={phosphor.rule} strokeWidth="1">
        <line x1={DIV} y1="0" x2={DIV} y2={WB} />
        <line x1={DIV} y1={TOP} x2={W} y2={TOP} />
        <line x1="0" y1={TOP} x2={DIV} y2={TOP} />
        <line x1="0" y1="232" x2={DIV} y2="232" />
        <line x1="0" y1={WB} x2={W} y2={WB} />
        <line x1="0" y1={SK} x2={W} y2={SK} />
      </g>

      {/* SpO₂ top-left */}
      <text x="8" y="24" fill={phosphor.cyan} fontSize="16">SpO₂ %</text>
      <text x="12" y="66" fill={phosphor.cyan} fontSize="34">100</text>

      {/* compressed status band */}
      <text x={DIV + 8} y="24" fill={phosphor.magenta} fontSize="13">IDLE</text>
      <text x={DIV + 8} y="60" fill={phosphor.magenta} fontSize="30">13:38</text>
      <text x="304" y="22" fill={phosphor.cyan} fontSize="12">CPR</text>
      <rect x="304" y="30" width="12" height="42" fill="none" stroke={phosphor.magenta} strokeWidth="1.25" />
      <path d="M360,32 L382,52 L360,72 L338,52 Z" fill="none" stroke={phosphor.magenta} strokeWidth="1.25" />
      <text x="300" y="88" fill={phosphor.magenta} fontSize="10">Release</text>
      <text x="352" y="88" fill={phosphor.magenta} fontSize="10">PPI</text>
      <text x="458" y="22" fill={phosphor.green} fontSize="13">ECG</text>
      <text x="458" y="42" fill={phosphor.green} fontSize="12">III</text>
      <text x="486" y="42" fill={phosphor.green} fontSize="12">x3</text>
      <text x="524" y="24" fill={phosphor.green} fontSize="14">♥</text>
      <text x="664" y="72" textAnchor="end" fill={phosphor.green} fontSize="46" fontWeight="700">72</text>

      {/* left parameter column */}
      <text x="8" y="152" fill={phosphor.white} fontSize="15">NIBP <tspan fontSize="11">mmHg</tspan></text>
      <text x="12" y="186" fill={phosphor.white} fontSize="20">- - -</text>
      <text x="8" y="272" fill={phosphor.amber} fontSize="15">CO₂ <tspan fontSize="11">mmHg</tspan></text>
      <text x="12" y="304" fill={phosphor.amber} fontSize="24">25</text>
      <text x="12" y="334" fill={phosphor.amber} fontSize="14">RR 12</text>

      {/* continuous waveform field: ECG / Pleth / CO₂ on baselines */}
      <path d={ecgPath(DIV + 6, W - 6, B.ecg)} fill="none" stroke={phosphor.green} strokeWidth="1.5" />
      <path d={plethPath(DIV + 6, W - 6, B.pleth)} fill="none" stroke={phosphor.cyan} strokeWidth="1.5" />
      <path d={capnoPath(DIV + 6, W - 6, B.co2)} fill="none" stroke={phosphor.amber} strokeWidth="1.5" />

      {/* mode word inside the waveform field (no box) */}
      <text x={(DIV + W) / 2} y={WB - 18} textAnchor="middle" fill={phosphor.white} fontSize="28">MONITOR</text>

      {/* time / readout row */}
      <text x="8" y={WB + 30} fill={phosphor.white} fontSize="18">13:38</text>

      {/* softkey label strip */}
      <g stroke={phosphor.rule} strokeWidth="1">
        {Array.from({ length: COLS - 1 }, (_, i) => (
          <line key={i} x1={(i + 1) * PITCH} y1={SK + 4} x2={(i + 1) * PITCH} y2={lcd.height - 3} />
        ))}
      </g>
      {SOFTKEYS.map((label, i) => (
        <text key={i} x={i * PITCH + PITCH / 2} y={SK + 32} textAnchor="middle" fill={phosphor.white} fontSize="12">{label}</text>
      ))}
    </g>
  )
}
