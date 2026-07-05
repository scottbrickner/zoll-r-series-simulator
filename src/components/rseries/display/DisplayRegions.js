/**
 * ZOLL R Series — Display region map (Package 4, Display Operating Framework).
 *
 * REBUILT as a traced reconstruction of the FIRMWARE LCD layout. The rectangles are
 * lifted from the firmware-accurate `LcdScreen.jsx` coordinates (which match the
 * PACE-mode manufacturer reference in `visual-alignment-report.md §1`), in the
 * locked 673 × 515 logical space. This is a firmware layout, NOT a dashboard: a
 * narrow left parameter column, a tightly packed top status strip, ONE continuous
 * waveform plotting area (no boxed lanes), therapy messages that occupy the waveform
 * area, a readout row, and a firmware softkey strip.
 *
 * Layout only. NO patient data, NO waveforms, NO values, NO simulator logic.
 *
 * Firmware anchors (from LcdScreen.jsx): left divider x=186; top rule y=118; ECG
 * trace y 150…270; CO₂ capno y 292…396; mode message y≈430; value row y≈452;
 * softkey rule y=468 with column rules at x = i·112.
 */
import { lcd, anchors, LAYERS } from './DisplayLayoutTokens'

const MAIN_X = anchors.paramDividerX // 186
const MAIN_W = lcd.width - MAIN_X // 487
const W = lcd.width // 673

// Inject-target vocabulary (what future widgets render into a region).
export const INJECTS = {
  WAVEFORMS: 'Waveforms',
  VITALS: 'Vitals',
  THERAPY: 'Therapy Messages',
  CHARGING: 'Charging Status',
  PACING: 'Pacing',
  CPR: 'CPR Feedback',
  SOFTKEYS: 'Softkey Labels',
  ALARMS: 'Alarm Messages',
  STATUS_ICONS: 'Status Icons',
}

/**
 * Firmware regions. `id` is the injection slot key; rectangles are { x, y, w, h } in
 * 673 × 515 space; `layer` sets z-order; `parent` nests a sub-zone; `injects` names
 * what may later render there.
 */
export const REGIONS = [
  // ── Narrow left parameter column (SpO₂ / NIBP / CO₂·RR stacked) ──
  {
    id: 'leftParamColumn',
    name: 'Left Parameter Column',
    layer: LAYERS.REGION,
    rect: { x: 0, y: 0, w: MAIN_X, h: 442 },
    injects: [INJECTS.VITALS],
    note: 'Narrow firmware parameter column down the left edge (SpO₂ at top, then NIBP, then CO₂/RR).',
  },
  {
    id: 'paramSpO2',
    name: 'SpO₂',
    layer: LAYERS.REGION,
    parent: 'leftParamColumn',
    rect: { x: 0, y: 6, w: MAIN_X, h: 138 },
    injects: [INJECTS.VITALS],
    note: 'SpO₂ % (cyan).',
  },
  {
    id: 'paramNIBP',
    name: 'NIBP',
    layer: LAYERS.REGION,
    parent: 'leftParamColumn',
    rect: { x: 0, y: 150, w: MAIN_X, h: 120 },
    injects: [INJECTS.VITALS],
    note: 'NIBP mmHg (white).',
  },
  {
    id: 'paramCO2',
    name: 'CO₂ / RR',
    layer: LAYERS.REGION,
    parent: 'leftParamColumn',
    rect: { x: 0, y: 278, w: MAIN_X, h: 174 },
    injects: [INJECTS.VITALS],
    note: 'CO₂ mmHg + respiratory rate (amber).',
  },

  // ── Tightly packed top status strip (timer · CPR · ECG/HR) ──
  {
    id: 'topStatus',
    name: 'Top Status Strip',
    layer: LAYERS.REGION,
    rect: { x: MAIN_X, y: 0, w: MAIN_W, h: anchors.topRuleY }, // y 0..118
    injects: [INJECTS.STATUS_ICONS],
    note: 'Tightly packed firmware status band above the waveforms.',
  },
  {
    id: 'statusTimer',
    name: 'Timer / Mode',
    layer: LAYERS.REGION,
    parent: 'topStatus',
    rect: { x: MAIN_X, y: 0, w: 150, h: anchors.topRuleY },
    injects: [INJECTS.STATUS_ICONS],
    note: 'Elapsed timer + operating mode (magenta).',
  },
  {
    id: 'statusCpr',
    name: 'CPR (Release / PPI)',
    layer: LAYERS.REGION,
    parent: 'topStatus',
    rect: { x: 336, y: 0, w: 150, h: anchors.topRuleY },
    injects: [INJECTS.CPR],
    note: 'CPR release bar + perfusion (PPI) diamond.',
  },
  {
    id: 'statusEcgHr',
    name: 'ECG / Lead / HR',
    layer: LAYERS.REGION,
    parent: 'topStatus',
    rect: { x: 486, y: 0, w: W - 486, h: anchors.topRuleY },
    injects: [INJECTS.VITALS, INJECTS.STATUS_ICONS],
    note: 'Lead label, ECG size, and the large heart-rate readout (green).',
  },

  // ── ONE continuous waveform plotting area (no boxed lanes) ──
  {
    id: 'waveformArea',
    name: 'Waveform Plotting Area',
    layer: LAYERS.REGION,
    rect: { x: MAIN_X, y: anchors.topRuleY, w: MAIN_W, h: 324 }, // y 118..442
    injects: [INJECTS.WAVEFORMS],
    note: 'Continuous plotting area — ECG upper, CO₂ lower. Traces flow directly on the glass; no per-trace boxes.',
  },

  // ── Value / readout row just above the softkeys ──
  {
    id: 'valueRow',
    name: 'Value / Readout Row',
    layer: LAYERS.REGION,
    rect: { x: 0, y: 442, w: W, h: anchors.softkeyRuleY - 442 }, // y 442..468, FULL WIDTH
    injects: [INJECTS.THERAPY, INJECTS.CHARGING, INJECTS.PACING],
    note: 'Full-width firmware readout line: clock at far left, then mA/PPM/capture · energy J SEL. · charge %.',
  },

  // ── Firmware softkey label strip (separators + centered text, no buttons) ──
  {
    id: 'softkeyStrip',
    name: 'Softkey Label Strip',
    layer: LAYERS.REGION,
    rect: { x: 0, y: anchors.softkeyRuleY, w: W, h: lcd.height - anchors.softkeyRuleY }, // y 468..515
    injects: [INJECTS.SOFTKEYS],
    columns: anchors.softkeyColumns,
    note: 'Firmware label strip: six columns split by thin rules, centered white labels — NO button chrome.',
  },

  // ── Overlay layer (transient messages over the waveform area) ──
  {
    id: 'alarmBanner',
    name: 'Alarm Banner',
    layer: LAYERS.OVERLAY,
    rect: { x: 206, y: 2, w: 440, h: 22 }, // top-center, over the status strip
    injects: [INJECTS.ALARMS],
    note: 'Transient alarm / suspend message across the top-center.',
  },
  {
    id: 'therapyMessage',
    name: 'Therapy / Mode Message',
    layer: LAYERS.OVERLAY,
    rect: { x: MAIN_X, y: 352, w: MAIN_W, h: 86 }, // occupies the lower waveform area
    injects: [INJECTS.THERAPY, INJECTS.CHARGING, INJECTS.CPR],
    note: 'Mode / therapy text drawn OVER the waveform area (MONITOR / PACE / ANALYZING / DEFIB READY / charging).',
  },
]

// Lookups / helpers.
export const REGION_BY_ID = REGIONS.reduce((m, r) => ((m[r.id] = r), m), {})
export const getRegion = (id) => REGION_BY_ID[id]
export const regionsInLayer = (layer) => REGIONS.filter((r) => r.layer === layer)
export const childRegions = (id) => REGIONS.filter((r) => r.parent === id)
export const topLevelRegions = () => REGIONS.filter((r) => !r.parent)
