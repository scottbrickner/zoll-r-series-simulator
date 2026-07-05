/**
 * RSeriesLCDText — reusable LCD-STYLE screen label (Package 3, Typography Library).
 *
 * Renders on-screen instrument text (softkey labels, mode/therapy status words,
 * DEFIB READY, XXXJ SEL. readouts, CHECK CPR PUCK, SET PACE MA, …) as an SVG <text>
 * using the shared typography tokens. LCD text uses the monospaced token family and
 * the phosphor palette, so it reads as an instrument display — distinct from the
 * printed hardware legends drawn by `RSeriesLabel`.
 *
 * Scope note: this is a TYPOGRAPHY primitive only. It is NOT the LCD framework
 * (`LcdScreen.jsx`) and NOT simulator behaviour; it draws type on request and is
 * wired to nothing. Intended to be composited on a dark LCD background.
 *
 * Props:
 *   preset      — an `lcdPresets` key: 'softkey' | 'status' | 'message' | 'ready' |
 *                 'select' | 'alert' | 'prompt' (default 'status').
 *   children    — the text (string). Use '\n' or `lines` for multi-line softkeys.
 *   lines       — optional string[] for stacked lines (e.g. ['Sync','On/Off']).
 *   x, y        — position in the enclosing SVG (default 0,0).
 *   textAnchor  — 'start' | 'middle' | 'end' (default 'middle').
 *   size/weight/spacing/family/fill — optional overrides (token key OR raw value).
 *   Any other SVG <text> prop is passed through.
 */
import { lineHeight, resolveTextStyle, lcdPresets } from './typographyTokens'

export default function RSeriesLCDText({
  preset = 'status',
  children,
  lines,
  x = 0,
  y = 0,
  textAnchor = 'middle',
  size,
  weight,
  spacing,
  family,
  fill,
  ...rest
}) {
  const style = resolveTextStyle(lcdPresets[preset] || lcdPresets.status, {
    size,
    weight,
    spacing,
    family,
    fill,
  })
  const arr = lines || (typeof children === 'string' ? children.split('\n') : [children])
  const lh = style.fontSize * lineHeight.snug

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fontFamily={style.fontFamily}
      fontSize={style.fontSize}
      fontWeight={style.fontWeight}
      letterSpacing={style.letterSpacing}
      fill={style.fill}
      {...rest}
    >
      {arr.length === 1
        ? arr[0]
        : arr.map((ln, i) => (
            <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
              {ln}
            </tspan>
          ))}
    </text>
  )
}
