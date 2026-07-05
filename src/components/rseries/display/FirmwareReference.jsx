/**
 * FirmwareReference — a traced reconstruction of the ZOLL R Series FIRMWARE LCD
 * (Package 4, the "Manufacturer" comparison panel).
 *
 * A firmware-LAYOUT reconstruction built from the manufacturer reference (the
 * front-panel LCD screens documented in `visual-alignment-report.md §1` and the
 * firmware-accurate `LcdScreen.jsx` coordinates) — a vector reconstruction for this
 * training simulator, NOT a copy of any screenshot and NOT a modern dashboard. It
 * exists so the framework regions can be traced against a firmware-shaped screen
 * (Manufacturer → Overlay → Framework).
 *
 * It reproduces firmware STRUCTURE with representative readouts: SpO₂ at the top-left
 * of the status row, a tightly packed status band (timer · CPR release/PPI · ECG lead
 * + large HR), a narrow left parameter column (NIBP, CO₂/RR), ONE continuous waveform
 * plotting area (ECG + CO₂), a centered mode word over the waveform, a full-width
 * readout row with the clock at far left, and the firmware softkey label strip (thin
 * column rules + centered white labels, no buttons). No simulator logic; the readings
 * are a static illustration.
 *
 * If a real manufacturer capture is available, drop it at `public/lcd_reference.png`;
 * the review page shows it in this panel's place for exact tracing.
 *
 * Returns a <g> in 673 × 515 space; the consumer supplies the enclosing <svg>.
 */
import { lcd, anchors, phosphor } from './DisplayLayoutTokens'

const F = "'DejaVu Sans Mono', 'Consolas', 'Menlo', 'Courier New', monospace"
const DIVIDER = anchors.paramDividerX
const MAIN_R = lcd.width

// Representative repeating ECG stroke (P–QRS–T) across [x0, x1] on baseline.
function ecgPath(x0, x1, base, beat = 116) {
  let d = `M${x0},${base}`
  for (let p = x0; p < x1; p += beat) {
    d +=
      ` L${p + 14},${base} Q${p + 20},${base - 6} ${p + 26},${base}` + // P
      ` L${p + 40},${base} L${p + 44},${base + 5} L${p + 48},${base - 34} L${p + 52},${base + 12} L${p + 56},${base}` + // QRS
      ` L${p + 72},${base} Q${p + 82},${base - 12} ${p + 92},${base}` + // T
      ` L${p + beat},${base}`
  }
  return d
}

// Representative capnogram (rounded plateaus) across [x0, x1].
function capnoPath(x0, x1, base, amp = 24, period = 150) {
  let d = `M${x0},${base}`
  for (let p = x0; p < x1; p += period) {
    d +=
      ` L${p + 18},${base} C${p + 26},${base} ${p + 30},${base - amp} ${p + 40},${base - amp}` +
      ` L${p + period - 40},${base - amp} C${p + period - 30},${base - amp} ${p + period - 26},${base} ${p + period - 18},${base}` +
      ` L${p + period},${base}`
  }
  return d
}

const SOFTKEYS = [['Options'], ['Param'], ['Code', 'Marker'], ['Report', 'Data'], ['Alarms'], ['Sync', 'On/Off']]

export default function FirmwareReference() {
  const cols = anchors.softkeyColumns
  const pitch = anchors.softkeyPitch

  return (
    <g className="firmware-reference" fontFamily={F}>
      {/* LCD glass */}
      <rect x="0" y="0" width={lcd.width} height={lcd.height} fill={phosphor.background} />

      {/* firmware hairline rules */}
      <g stroke={phosphor.rule} strokeWidth="1">
        <line x1={DIVIDER} y1="0" x2={DIVIDER} y2="442" />
        <line x1={DIVIDER} y1={anchors.topRuleY} x2={MAIN_R} y2={anchors.topRuleY} />
        <line x1="0" y1={anchors.softkeyRuleY} x2={MAIN_R} y2={anchors.softkeyRuleY} />
      </g>

      {/* ── SpO₂ at the top-left of the status row (cyan) ── */}
      <text x="12" y="28" fill={phosphor.cyan} fontSize="18">SpO₂ %</text>
      <text x="16" y="76" fill={phosphor.cyan} fontSize="40">- - -</text>

      {/* ── tightly packed top status band ── */}
      {/* timer / mode (magenta) */}
      <text x="196" y="26" fill={phosphor.magenta} fontSize="16">IDLE</text>
      <text x="196" y="70" fill={phosphor.magenta} fontSize="36">13:38</text>
      {/* CPR block: Release bar + PPI diamond */}
      <text x="322" y="22" fill={phosphor.cyan} fontSize="14">CPR</text>
      <rect x="322" y="30" width="14" height="46" fill="none" stroke={phosphor.magenta} strokeWidth="1.5" />
      <path d="M382,30 L406,54 L382,78 L358,54 Z" fill="none" stroke={phosphor.magenta} strokeWidth="1.5" />
      <text x="314" y="94" fill={phosphor.magenta} fontSize="11">Release</text>
      <text x="372" y="94" fill={phosphor.magenta} fontSize="11">PPI</text>
      {/* ECG lead + heart + large HR (green) */}
      <text x="470" y="24" fill={phosphor.green} fontSize="16">ECG</text>
      <text x="470" y="46" fill={phosphor.green} fontSize="16">III</text>
      <text x="512" y="46" fill={phosphor.green} fontSize="16">x3</text>
      <text x="556" y="26" fill={phosphor.green} fontSize="16">♥</text>
      <text x="666" y="78" textAnchor="end" fill={phosphor.green} fontSize="56" fontWeight="700">72</text>

      {/* ── narrow left parameter column ── */}
      <text x="12" y="158" fill={phosphor.white} fontSize="18">NIBP <tspan fontSize="13">mmHg</tspan></text>
      <text x="18" y="196" fill={phosphor.white} fontSize="22">- - -</text>
      <text x="12" y="300" fill={phosphor.amber} fontSize="18">CO₂ <tspan fontSize="13">mmHg</tspan></text>
      <text x="18" y="340" fill={phosphor.amber} fontSize="30">25</text>
      <text x="18" y="372" fill={phosphor.amber} fontSize="16">RR 12</text>

      {/* ── one continuous waveform plotting area (representative strokes) ── */}
      <text x="194" y="136" fill={phosphor.green} fontSize="14">ECG</text>
      <path d={ecgPath(DIVIDER + 6, MAIN_R - 6, 198)} fill="none" stroke={phosphor.green} strokeWidth="1.6" />
      <text x="194" y="292" fill={phosphor.amber} fontSize="14">CO₂</text>
      <path d={capnoPath(DIVIDER + 6, MAIN_R - 6, 338)} fill="none" stroke={phosphor.amber} strokeWidth="1.6" />

      {/* ── mode word centered over the waveform area ── */}
      <text x={(DIVIDER + MAIN_R) / 2} y="424" textAnchor="middle" fill={phosphor.white} fontSize="32">MONITOR</text>

      {/* ── full-width readout row: clock at far left ── */}
      <text x="10" y="462" fill={phosphor.white} fontSize="18">13:38</text>

      {/* ── firmware softkey label strip (rules + centered labels, no buttons) ── */}
      <g stroke={phosphor.rule} strokeWidth="1">
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={i} x1={(i + 1) * pitch} y1={anchors.softkeyRuleY + 3} x2={(i + 1) * pitch} y2={lcd.height - 2} />
        ))}
      </g>
      {SOFTKEYS.map((lines, i) => (
        <g key={i} fill={phosphor.white}>
          <text x={i * pitch + pitch / 2} y={lines.length > 1 ? 490 : 496} textAnchor="middle" fontSize="13">{lines[0]}</text>
          {lines[1] && <text x={i * pitch + pitch / 2} y="506" textAnchor="middle" fontSize="13">{lines[1]}</text>}
        </g>
      ))}
    </g>
  )
}
