/**
 * ZOLL R Series — Display region map (Package 4A, Firmware Skeleton).
 *
 * RECONSTRUCTED from the manufacturer LCD firmware screens. Each region is a
 * rectangle in the locked 673 × 515 logical space (see `DisplayLayoutTokens.js`), a
 * z-layer, an optional parent (nesting), and the content React may LATER inject.
 *
 * This is the permanent firmware skeleton — the operating-system layout. It is dense
 * and embedded, NOT a dashboard: a narrow left parameter column of thin-divider
 * parameter modules, a compressed top status band that hugs the top edge, ONE
 * continuous waveform field (three baselines, no boxed lanes), a message zone INSIDE
 * the waveform field, a time / readout row, and a label-only softkey strip.
 *
 * Layout only. NO waveforms, NO vitals, NO patient data, NO messages, NO logic.
 */
import { lcd, anchors, waveform, LAYERS } from './DisplayLayoutTokens.js'

const DIV = anchors.paramDividerX // 138
const MAIN_W = lcd.width - DIV // 535
const W = lcd.width // 673
const TOP = anchors.topRuleY // 104
const WB = waveform.bottom // 410
const SK = anchors.softkeyRuleY // 456

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

export const REGIONS = [
  // ── Narrow left parameter column (≈20.5% width) — thin-divider modules ──
  {
    id: 'leftParamColumn',
    name: 'Left Parameter Column',
    layer: LAYERS.REGION,
    rect: { x: 0, y: 0, w: DIV, h: WB },
    injects: [INJECTS.VITALS],
    note: 'Narrow firmware parameter column; stacked modules split by thin divider lines.',
  },
  {
    id: 'paramSpO2',
    name: 'SpO₂',
    layer: LAYERS.REGION,
    parent: 'leftParamColumn',
    rect: { x: 0, y: 0, w: DIV, h: TOP }, // 0..104 (aligns with the top band)
    injects: [INJECTS.VITALS],
    note: 'SpO₂ % module (cyan), top of the column.',
  },
  {
    id: 'paramNIBP',
    name: 'NIBP',
    layer: LAYERS.REGION,
    parent: 'leftParamColumn',
    rect: { x: 0, y: TOP, w: DIV, h: 128 }, // 104..232
    injects: [INJECTS.VITALS],
    note: 'NIBP mmHg module (white).',
  },
  {
    id: 'paramCO2RR',
    name: 'CO₂ / RR',
    layer: LAYERS.REGION,
    parent: 'leftParamColumn',
    rect: { x: 0, y: 232, w: DIV, h: WB - 232 }, // 232..410
    injects: [INJECTS.VITALS],
    note: 'CO₂ mmHg + respiratory rate module (amber).',
  },

  // ── Compressed top status band (hugs the top) ──
  {
    id: 'topStatus',
    name: 'Top Status Band',
    layer: LAYERS.REGION,
    rect: { x: DIV, y: 0, w: MAIN_W, h: TOP }, // 0..104
    injects: [INJECTS.STATUS_ICONS],
    note: 'Compressed firmware status band across the top of the main area.',
  },
  {
    id: 'statusClockMode',
    name: 'Mode / Status',
    layer: LAYERS.REGION,
    parent: 'topStatus',
    rect: { x: DIV, y: 0, w: 162, h: TOP }, // 138..300
    injects: [INJECTS.STATUS_ICONS],
    note: 'Operating mode / status word (IDLE / MONITOR / DEFIB / PACER). The elapsed-time clock is in the readout row, not here (Operator’s Guide Fig. 2-2).',
  },
  {
    id: 'statusCpr',
    name: 'CPR (Release / PPI)',
    layer: LAYERS.REGION,
    parent: 'topStatus',
    rect: { x: 300, y: 0, w: 152, h: TOP }, // 300..452
    injects: [INJECTS.CPR],
    note: 'CPR release bar + perfusion (PPI) diamond.',
  },
  {
    id: 'statusEcgHr',
    name: 'Lead / Gain / HR',
    layer: LAYERS.REGION,
    parent: 'topStatus',
    rect: { x: 452, y: 0, w: W - 452, h: TOP }, // 452..673
    injects: [INJECTS.VITALS, INJECTS.STATUS_ICONS],
    note: 'ECG lead + gain, heart icon, and the large heart-rate readout.',
  },

  // ── ONE continuous waveform field (three baselines; no boxed lanes) ──
  {
    id: 'waveformField',
    name: 'Waveform Field',
    layer: LAYERS.REGION,
    rect: { x: DIV, y: TOP, w: MAIN_W, h: WB - TOP }, // 104..410
    injects: [INJECTS.WAVEFORMS],
    baselines: waveform.baselines, // three trace baselines within the field
    note: 'Continuous plotting field with three thin baseline reference lines (Trace 1/2/3). Channel tags are mode-dependent: ECG / Pleth / CO₂ in MONITOR; PADS + FIL (See-Thru CPR filtered) in DEFIB / CPR. No boxes.',
  },

  // ── Time / readout row (full width) ──
  {
    id: 'readoutRow',
    name: 'Time / Readout Row',
    layer: LAYERS.REGION,
    rect: { x: 0, y: WB, w: W, h: SK - WB }, // 410..456
    injects: [INJECTS.THERAPY, INJECTS.CHARGING, INJECTS.PACING],
    note: 'Firmware readout line: time at far left, then mode readouts (mA/PPM, J SEL., charge %).',
  },

  // ── Label-only softkey strip (no button chrome) ──
  {
    id: 'softkeyStrip',
    name: 'Softkey Label Strip',
    layer: LAYERS.REGION,
    rect: { x: 0, y: SK, w: W, h: lcd.height - SK }, // 456..515
    injects: [INJECTS.SOFTKEYS],
    columns: anchors.softkeyColumns,
    note: 'Firmware softkey LABELS only — thin column rules, centered text, no buttons (physical keys are below the LCD).',
  },

  // ── Message zone INSIDE the waveform field (transient, no box) ──
  {
    id: 'messageArea',
    name: 'Message Zone',
    layer: LAYERS.OVERLAY,
    rect: { x: DIV, y: 300, w: MAIN_W, h: WB - 300 }, // lower waveform field, 300..410
    injects: [INJECTS.THERAPY, INJECTS.CHARGING, INJECTS.CPR, INJECTS.ALARMS],
    note: 'Therapy / status messages (PACE · DEFIB READY · CHECK CPR PUCK · SET PACE MA · SYNC READY) drawn INSIDE the waveform field — no message box.',
  },
]

// Lookups / helpers.
export const REGION_BY_ID = REGIONS.reduce((m, r) => ((m[r.id] = r), m), {})
export const getRegion = (id) => REGION_BY_ID[id]
export const regionsInLayer = (layer) => REGIONS.filter((r) => r.layer === layer)
export const childRegions = (id) => REGIONS.filter((r) => r.parent === id)
export const topLevelRegions = () => REGIONS.filter((r) => !r.parent)
