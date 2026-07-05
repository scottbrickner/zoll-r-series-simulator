/**
 * ZOLL R Series — Typography tokens (Package 3, Typography Library).
 *
 * The single source of truth for the device's TYPE: printed hardware legends and
 * LCD-style screen text. Reusable tokens (family / size / weight / letter-spacing /
 * colour / line-height) plus semantic presets that map a label category to those
 * tokens. Consumed by `RSeriesLabel.jsx` (printed) and `RSeriesLCDText.jsx` (LCD).
 *
 * Scope note: this is the TYPOGRAPHY system only — reusable tokens and label
 * components. It is NOT the LCD framework and NOT simulator behaviour, and it does
 * not modify any locked physical asset. Sizes are in SVG user units (px) so labels
 * drop into the master coordinate space at their intended size.
 *
 * Fonts are SYSTEM-SAFE stacks only — no external font files are imported. Printed
 * legends use the same neutral sans the device housing already uses; LCD text uses
 * a monospaced stack so screen text reads as an instrument display, distinct from
 * the printed hardware legends.
 */

// ── Font families (system-safe stacks; no @font-face, no external files) ──
export const fontFamily = {
  // Printed housing legends — matches the master `.rs-svg` housing font.
  printed: "'Segoe UI', 'Helvetica Neue', 'Arial Narrow', Arial, system-ui, sans-serif",
  // LCD / screen text — monospaced so it reads as an instrument display.
  lcd: "'DejaVu Sans Mono', 'Consolas', 'SFMono-Regular', 'Menlo', 'Liberation Mono', 'Courier New', monospace",
}

// ── Size scale (SVG user units / px) ──
export const fontSize = {
  xxs: 11,
  xs: 13,
  sm: 15,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
}

// ── Weights (device legends are compact + bold; nothing light) ──
export const fontWeight = {
  regular: 400,
  medium: 600,
  bold: 700,
  heavy: 800,
}

// ── Letter spacing (printed legends are slightly tracked; screen text tighter) ──
export const letterSpacing = {
  tight: '0em',
  normal: '0.02em',
  wide: '0.08em',
  wider: '0.14em',
}

// ── Line height (used for stacked multi-line labels, e.g. ALARM SUSPEND) ──
export const lineHeight = {
  tight: 1.0,
  snug: 1.12,
  normal: 1.25,
}

// ── Colours (token names → hex). Printed = housing legends; lcd* = phosphor. ──
export const color = {
  // printed hardware legends
  ink: '#2a2f36', // primary dark legend (matches `.rs-dark`)
  red: '#c4231a', // ANALYZE / CHARGE / DEFIB (matches `.rs-red`)
  white: '#f1f4f7', // legend on a dark/coloured button (matches `.rs-white`)
  gray: '#6a7077', // small indicator legends AC / BATT (matches `.rs-mini-label`)
  monitorGray: '#9a9d99', // MONITOR — deliberately low-contrast (matches `.rs-mono-label`)
  green: '#1f9d57', // printed green legend (matches `.rs-grn-label`)
  teal: '#0f9c97', // PACER teal (matches `.rs-teal-label`)
  blue: '#0066b3', // ZOLL blue wordmark
  // LCD phosphor (matches the approved LCD palette)
  lcdWhite: '#ffffff',
  lcdGreen: '#00ff66',
  lcdAmber: '#ffd100',
  lcdCyan: '#00ffff',
  lcdMagenta: '#ff00ff',
  lcdRed: '#ff3830',
}

/**
 * Semantic presets: label category → token keys. Components resolve these to
 * concrete SVG text attributes. Every value is a TOKEN KEY (not a raw value) so
 * the system stays centralized; callers may still override any field.
 */
export const printedPresets = {
  // generic printed control legend (LEAD / SIZE / RECORDER …)
  control: { family: 'printed', size: 'md', weight: 'bold', spacing: 'normal', fill: 'ink' },
  // small tracked legend (ENERGY SELECT, OUTPUT mA, RATE ppm, 4:1, sub-legends)
  controlSmall: { family: 'printed', size: 'xs', weight: 'bold', spacing: 'wide', fill: 'ink' },
  // therapy action legends printed in red (ANALYZE / CHARGE)
  therapy: { family: 'printed', size: 'md', weight: 'bold', spacing: 'normal', fill: 'red' },
  // SHOCK — heavy, tracked, light legend (sits on the orange button)
  shock: { family: 'printed', size: 'lg', weight: 'heavy', spacing: 'wide', fill: 'white' },
  // mode-selector legends (colour carried by the printed word)
  modeMonitor: { family: 'printed', size: 'md', weight: 'heavy', spacing: 'wide', fill: 'monitorGray' },
  modeDefib: { family: 'printed', size: 'md', weight: 'heavy', spacing: 'wide', fill: 'red' },
  modePacer: { family: 'printed', size: 'md', weight: 'heavy', spacing: 'wide', fill: 'teal' },
  modeOff: { family: 'printed', size: 'md', weight: 'heavy', spacing: 'wide', fill: 'ink' },
  // small gray indicator legends (AC / BATT)
  indicator: { family: 'printed', size: 'xs', weight: 'bold', spacing: 'wider', fill: 'gray' },
}

export const lcdPresets = {
  // white softkey labels along the bottom of the display
  softkey: { family: 'lcd', size: 'sm', weight: 'bold', spacing: 'normal', fill: 'lcdWhite' },
  // mode / therapy status words (MONITOR / PACE / DEFIB / SYNC)
  status: { family: 'lcd', size: 'lg', weight: 'bold', spacing: 'wide', fill: 'lcdWhite' },
  // large centred message (e.g. selected-energy readouts)
  message: { family: 'lcd', size: 'xl', weight: 'bold', spacing: 'normal', fill: 'lcdWhite' },
  // ready / OK message in phosphor green (DEFIB READY)
  ready: { family: 'lcd', size: 'xl', weight: 'bold', spacing: 'normal', fill: 'lcdGreen' },
  // energy-selected readouts (SYNC/DEFIB XXXJ SEL.)
  select: { family: 'lcd', size: 'lg', weight: 'bold', spacing: 'normal', fill: 'lcdWhite' },
  // alert / attention message in phosphor red (CHECK CPR PUCK)
  alert: { family: 'lcd', size: 'lg', weight: 'bold', spacing: 'normal', fill: 'lcdRed' },
  // amber prompt (SET PACE MA)
  prompt: { family: 'lcd', size: 'lg', weight: 'bold', spacing: 'normal', fill: 'lcdAmber' },
}

/**
 * Resolve a preset (from `printedPresets` or `lcdPresets`) plus optional overrides
 * into concrete SVG `<text>` attributes. Overrides accept either a token key
 * (e.g. size='lg', fill='red') or a raw value (e.g. size={17}, fill='#123').
 */
export function resolveTextStyle(preset, overrides = {}) {
  const p = preset || {}
  const famKey = overrides.family || p.family || 'printed'
  const sizeKey = overrides.size ?? p.size ?? 'md'
  const weightKey = overrides.weight ?? p.weight ?? 'bold'
  const spacingKey = overrides.spacing || p.spacing || 'normal'
  const fillKey = overrides.fill || p.fill || 'ink'
  return {
    fontFamily: fontFamily[famKey] || famKey,
    fontSize: typeof sizeKey === 'number' ? sizeKey : fontSize[sizeKey] || fontSize.md,
    fontWeight: typeof weightKey === 'number' ? weightKey : fontWeight[weightKey] || fontWeight.bold,
    letterSpacing: letterSpacing[spacingKey] || spacingKey,
    fill: color[fillKey] || fillKey,
  }
}
