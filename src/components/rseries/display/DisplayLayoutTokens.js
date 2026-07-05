/**
 * ZOLL R Series — Display layout tokens (Package 4A, Firmware Skeleton).
 *
 * RECONSTRUCTED from the manufacturer LCD firmware screens — not a dashboard. These
 * measurements are the permanent firmware skeleton: the operating-system layout every
 * future screen and widget fits inside. Dense, embedded, firmware-shaped — thin
 * divider lines, a narrow left parameter column, one continuous waveform field, a
 * compressed top status band, and a label-only softkey strip. The locked **673 × 515
 * logical space** is preserved.
 *
 * Anchors (measured as fractions of the LCD, then mapped to 673 × 515):
 *   • Left parameter column ≈ 20.5 % of width  → divider x = 138
 *   • Top status band ≈ 20 % of height (compressed, hugs the top) → rule y = 104
 *   • Softkey label strip at the bottom → rule y = 456, six columns (physical softkeys)
 *   • Waveform field spans between them as ONE continuous plotting area with three
 *     thin baseline reference lines: ECG, Pleth, CO₂.
 */

// Locked LCD logical canvas.
export const lcd = {
  width: 673,
  height: 515,
}

// Firmware structural anchors (measured from the manufacturer screens).
export const anchors = {
  paramDividerX: 138, // vertical rule: narrow left parameter column | main area (≈20.5%)
  topRuleY: 104, // horizontal rule under the compressed top status band (≈20%)
  readoutTop: 410, // top of the time / readout row
  softkeyRuleY: 456, // rule above the softkey label strip
  softkeyColumns: 6, // six softkeys (aligned to the physical buttons below the LCD)
  softkeyPitch: 673 / 6, // ≈112.17
}

// Waveform field: one continuous plotting area with three thin baseline reference
// lines. Widgets align to these baselines; the field is not boxed into lanes.
export const waveform = {
  top: 104,
  bottom: 410,
  baselines: {
    ecg: 168, // ECG lane baseline
    pleth: 258, // Pleth (SpO₂) lane baseline
    co2: 348, // CO₂ capnogram baseline
  },
}

// Firmware phosphor palette (approved LCD colours).
export const phosphor = {
  green: '#00ff66',
  amber: '#ffd100',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  white: '#ffffff',
  red: '#ff3830',
  rule: '#3f7d68', // firmware hairline rules on the glass (visible on black)
  ruleDim: '#2c5748',
  background: '#03100a', // near-black LCD glass
}

// Z-order layers, bottom → top.
export const LAYERS = {
  BASE: 'base', // the LCD glass
  STRUCTURE: 'structure', // firmware hairline rules + baselines
  REGION: 'region', // persistent firmware regions
  OVERLAY: 'overlay', // transient messages inside the waveform field
}

export const LAYER_ORDER = [LAYERS.BASE, LAYERS.STRUCTURE, LAYERS.REGION, LAYERS.OVERLAY]

// Skeleton styling: firmware chrome is thin, dim phosphor — NOT boxed cards.
export const frame = {
  background: phosphor.background,
  rule: phosphor.rule,
  ruleDim: phosphor.ruleDim,
  label: '#8fcfb2', // static chrome labels (SpO₂ / NIBP / channel tags …)
  labelBright: '#b6ead2',
  placeholder: '#5c9c84', // value placeholders (dashes)
  name: '#7fe0b8',
  hint: '#3f7d66',
}

// Framework text (reuse the LCD monospace family from the Typography Library).
export const displayType = {
  family: "'DejaVu Sans Mono', 'Consolas', 'SFMono-Regular', 'Menlo', 'Liberation Mono', 'Courier New', monospace",
  nameSize: 12,
  hintSize: 10,
  coordSize: 9,
}

// High-contrast per-region colours — DEBUG / overlay only.
export const debugColors = {
  leftParamColumn: '#35d0ff',
  paramSpO2: '#00e5ff',
  paramNIBP: '#cfe0ff',
  paramCO2RR: '#ffcf5a',
  topStatus: '#ff5d5d',
  statusClockMode: '#ff7ad6',
  statusCpr: '#ffb03a',
  statusEcgHr: '#7cff4d',
  waveformField: '#4d9bff',
  messageArea: '#ffd93b',
  readoutRow: '#ff9d5d',
  softkeyStrip: '#5dffc8',
}

// LCD outer boundary highlight (review/debug).
export const lcdBoundaryColor = '#e6ff7a'
