/**
 * RSeriesLabel — reusable PRINTED hardware legend (Package 3, Typography Library).
 *
 * Renders a device housing legend (LEAD, SIZE, ANALYZE, MONITOR, AC/BATT, …) as an
 * SVG <text> using the shared typography tokens. Printed legends live in SVG space
 * (the device is an SVG), so this returns a <text>; the consumer supplies the
 * enclosing <svg viewBox>. Compact, bold, device-like — never web-app typography.
 *
 * This is a TYPOGRAPHY primitive only: it draws type, not geometry, and modifies no
 * locked asset. It is not wired into the master (that is a later Master Assembly
 * phase).
 *
 * Props:
 *   preset      — a `printedPresets` key: 'control' | 'controlSmall' | 'therapy' |
 *                 'shock' | 'modeMonitor' | 'modeDefib' | 'modePacer' | 'modeOff' |
 *                 'indicator' (default 'control').
 *   children    — the legend text (string). Use '\n' or `lines` for multi-line.
 *   lines       — optional string[] for stacked lines (e.g. ['ALARM','SUSPEND']).
 *   x, y        — position in the enclosing SVG (default 0,0).
 *   textAnchor  — 'start' | 'middle' | 'end' (default 'middle').
 *   size/weight/spacing/family/fill — optional overrides (token key OR raw value).
 *   Any other SVG <text> prop (opacity, transform, …) is passed through.
 */
import { lineHeight, resolveTextStyle, printedPresets } from './typographyTokens'

export default function RSeriesLabel({
  preset = 'control',
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
  const style = resolveTextStyle(printedPresets[preset] || printedPresets.control, {
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
