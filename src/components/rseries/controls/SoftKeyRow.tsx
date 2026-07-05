/**
 * Softkey Framework — the reusable six-key row (Package 4).
 *
 * Renders the six physical softkeys as a <g> (the consumer supplies the enclosing
 * <svg viewBox>). This is NOT six separate buttons — it is one programmable row
 * driven by a {@link SoftKey}[] layout. The physical key geometry is fixed; React
 * changes only the per-key label / enabled / visible / highlighted / pressed.
 *
 * Local geometry: six keys, 110 wide × 58 tall, 12 px gap (pitch 122) — the same
 * proportions as the locked body layer 07_Softkeys.
 */
import type { SoftKey } from './SoftKey'
import { normalizeRow } from './SoftKey'

const KEY_W = 110
const KEY_H = 58
const GAP = 12
const PITCH = KEY_W + GAP // 122

export interface SoftKeyRowProps {
  keys: SoftKey[]
  /** draw the pale physical key background (false → labels/state only). */
  showBackground?: boolean
}

/** Split a legend onto at most two centered lines (first word / the rest). */
function labelLines(label: string): string[] {
  if (!label) return []
  const parts = label.split(' ')
  if (parts.length <= 1) return [label]
  return [parts[0], parts.slice(1).join(' ')]
}

export default function SoftKeyRow({ keys, showBackground = true }: SoftKeyRowProps) {
  const row = normalizeRow(keys)
  return (
    <g id="softkey_row" fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif">
      {row.map((k, i) => {
        if (!k.visible) return null
        const x = i * PITCH
        const dim = !k.enabled
        const dy = k.pressed ? 1 : 0
        const fill = k.pressed ? '#dcddd8' : k.highlighted ? '#d7efec' : '#f2f2ef'
        const stroke = k.highlighted ? '#0f9c97' : '#c2c3bf'
        const textFill = dim ? '#9a9a94' : '#2a2f36'
        const lines = labelLines(k.label)
        return (
          <g key={k.id} opacity={dim ? 0.5 : 1} transform={dy ? `translate(0 ${dy})` : undefined}>
            {showBackground && (
              <rect x={x} y={0} width={KEY_W} height={KEY_H} rx={6} fill={fill} stroke={stroke} strokeWidth={k.highlighted ? 2 : 1.2} />
            )}
            {lines.map((ln, li) => (
              <text
                key={li}
                x={x + KEY_W / 2}
                y={KEY_H / 2 + 5 + (li - (lines.length - 1) / 2) * 16}
                textAnchor="middle"
                fill={textFill}
                fontSize={14}
                fontWeight={600}
              >
                {ln}
              </text>
            ))}
          </g>
        )
      })}
    </g>
  )
}
