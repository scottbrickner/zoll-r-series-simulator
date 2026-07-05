/**
 * ZOLL R Series — Display layout tokens (Package 4, Display Operating Framework).
 *
 * REBUILT as a traced reconstruction of the FIRMWARE LCD layout — not a modern
 * dashboard. The measurements below are anchored to the manufacturer reference
 * documented in `visual-alignment-report.md §1` (the PACE-mode reference screen) and
 * to the firmware-accurate `LcdScreen.jsx` reconstruction, which uses the SAME
 * coordinates. The framework preserves the locked **673 × 515 logical space**.
 *
 * Firmware layout (source of truth), all in 673 × 515:
 *   • Narrow left parameter column: x 0…186 (vertical rule at x=186).
 *   • Tightly packed top status strip: x 186…673, y 0…118 (rule at y=118).
 *   • ONE continuous waveform plotting area beneath (ECG upper / CO₂ lower) — the
 *     traces flow directly on the black, with small channel tags; NOT boxed lanes.
 *   • Therapy / mode messages are drawn OVER the waveform area (not a separate box).
 *   • Value / readout row just above the softkeys.
 *   • Firmware softkey strip: y 468…515, six columns split by thin rules, centered
 *     white labels — NO button chrome.
 */

// Locked LCD logical canvas (matches LcdScreen.jsx authoring space).
export const lcd = {
  width: 673,
  height: 515,
}

// Firmware structural anchors (match LcdScreen.jsx; do not change).
export const anchors = {
  paramDividerX: 186, // vertical rule: left parameter column | main area
  topRuleY: 118, // horizontal rule under the top status strip
  softkeyRuleY: 468, // horizontal rule above the softkey label strip
  softkeyColumns: 6, // six softkeys; firmware separators at x = i*112
  softkeyPitch: 112, // firmware column pitch (LcdScreen: i*112, last col wider)
}

// Firmware phosphor palette (approved LCD colours).
export const phosphor = {
  green: '#00ff66',
  amber: '#ffd100',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  white: '#ffffff',
  red: '#ff3830',
  dim: '#0e3a2a',
  rule: '#24463c', // firmware hairline rules on the glass
  background: '#03100a', // near-black LCD glass
}

// Z-order layers, bottom → top. Regions declare which layer they belong to.
export const LAYERS = {
  BASE: 'base', // the LCD background itself
  STRUCTURE: 'structure', // firmware hairline rules
  REGION: 'region', // persistent content regions
  OVERLAY: 'overlay', // transient messages drawn above the waveform area
}

export const LAYER_ORDER = [LAYERS.BASE, LAYERS.STRUCTURE, LAYERS.REGION, LAYERS.OVERLAY]

// Placeholder styling for the empty framework skeleton (dim, firmware-like).
export const frame = {
  background: phosphor.background,
  rule: phosphor.rule,
  regionStroke: '#1f6f5c',
  regionFill: '#0a1c15',
  nestedStroke: '#2b5f7a',
  overlayStroke: '#b06a2a',
  overlayFill: '#170f04',
  name: '#7fe0b8',
  hint: '#3f7d66',
  dim: '#2f5f50',
}

// Framework text (reuse the LCD monospace family from the Typography Library).
export const displayType = {
  family: "'DejaVu Sans Mono', 'Consolas', 'SFMono-Regular', 'Menlo', 'Liberation Mono', 'Courier New', monospace",
  nameSize: 12,
  hintSize: 10,
  coordSize: 9,
}

// High-contrast per-region colours — DEBUG / overlay comparison only (a distinct
// hue per firmware region so boundaries and the legend are unmistakable).
export const debugColors = {
  leftParamColumn: '#35d0ff',
  paramSpO2: '#00e5ff',
  paramNIBP: '#cfe0ff',
  paramCO2: '#ffcf5a',
  topStatus: '#ff5d5d',
  statusTimer: '#ff7ad6',
  statusCpr: '#ffb03a',
  statusEcgHr: '#7cff4d',
  waveformArea: '#4d9bff',
  valueRow: '#ff9d5d',
  softkeyStrip: '#5dffc8',
  alarmBanner: '#ff4d4d',
  therapyMessage: '#ffd93b',
}

// LCD outer boundary highlight (review modes).
export const lcdBoundaryColor = '#e6ff7a'
