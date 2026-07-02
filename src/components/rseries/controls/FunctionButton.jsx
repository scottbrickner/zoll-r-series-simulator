/**
 * Function Button — reusable warm-gray molded push-button (Industrial Design
 * Pass 2B). ONE component, different labels: LEAD / SIZE / ALARM SUSPEND /
 * RECORDER. Authored in the locked master coordinate space (0 0 1440 1120) so
 * an instance drops into the assembled device at its final position; the button
 * footprint (x/y/w/h) matches the locked master layer 08_FunctionButtons.
 *
 * Returns a <g> (a part). The consumer supplies the enclosing <svg viewBox>.
 * React draws state only — the molded satin face, the darker molded side edge
 * (depth), the (restrained) bevel highlight, the pressed/latched states, and the
 * printed label. It is a physical molded button, not a web-UI button.
 *
 * Props:
 *   x, y, w, h — button footprint in master space.
 *   lines      — 1 or 2 label lines, e.g. ['LEAD'] or ['ALARM', 'SUSPEND'].
 *   pressed    — pushed-in state (darker plastic + deeper lower shadow, no gloss).
 *   active     — latched/amber state (e.g. ALARM SUSPEND engaged).
 *   onClick    — optional; makes the button a hit target.
 *   idPrefix   — unique gradient id prefix (needed when many render in one <svg>).
 */
const R = 9 // subtle molded corner radius (locked)

export default function FunctionButton({
  x,
  y,
  w,
  h,
  lines = [],
  pressed = false,
  active = false,
  onClick,
  idPrefix = 'fb',
}) {
  const faceId = `${idPrefix}-face`
  const hiId = `${idPrefix}-hi`
  const lowId = `${idPrefix}-low`
  const dy = pressed ? 3 : 0 // face seats down onto the side edge when pressed
  const edge = active ? '#dcb87d' : '#b6b3aa' // darker warm molded side edge
  const stroke = active ? '#e0a92b' : pressed ? '#b6b3aa' : '#c2bfb6'
  const cx = x + w / 2

  return (
    <g id="function_button" className={onClick ? 'rs-hit' : undefined} onClick={onClick}>
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          {active ? (
            <>
              <stop offset="0" stopColor="#fff0d6" />
              <stop offset="1" stopColor="#f5d79b" />
            </>
          ) : pressed ? (
            <>
              <stop offset="0" stopColor="#dcdbd4" />
              <stop offset="1" stopColor="#bdbbb2" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#faf9f3" />
              <stop offset="0.5" stopColor="#edeae1" />
              <stop offset="1" stopColor="#d4d1c8" />
            </>
          )}
        </linearGradient>
        {/* restrained satin sheen (~50% of the previous gloss) */}
        <linearGradient id={hiId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* pressed: shadow that pools toward the lower edge */}
        <linearGradient id={lowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* darker molded side edge (depth beneath the face) */}
      <rect x={x} y={y + 3} width={w} height={h} rx={R} fill={edge} />

      {/* molded satin face — seats down when pressed */}
      <g transform={dy ? `translate(0 ${dy})` : undefined}>
        <rect x={x} y={y} width={w} height={h} rx={R} fill={`url(#${faceId})`} stroke={stroke} strokeWidth="1" />
        {!pressed && (
          /* top bevel highlight (restrained) */
          <rect x={x + 3} y={y + 2} width={w - 6} height={Math.round(h * 0.42)} rx={R - 3} fill={`url(#${hiId})`} pointerEvents="none" />
        )}
        {pressed && (
          <>
            {/* deeper lower shadow (pressed depth without gloss) */}
            <rect x={x + 2} y={y + h - 18} width={w - 4} height="16" rx={R - 4} fill={`url(#${lowId})`} pointerEvents="none" />
            {/* faint top inner shadow at the pushed-in top edge */}
            <rect x={x + 1} y={y + 1} width={w - 2} height="6" rx={R - 3} fill="#000000" opacity="0.08" pointerEvents="none" />
          </>
        )}
        {/* compact black uppercase label (1 or 2 lines) */}
        {lines.map((ln, i) => (
          <text
            key={ln}
            x={cx}
            y={y + h / 2 + 5 + (i - (lines.length - 1) / 2) * 18}
            textAnchor="middle"
            fill="#2a2f36"
            fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif"
            fontSize="16"
            fontWeight="700"
            letterSpacing="0.29"
            pointerEvents="none"
          >
            {ln}
          </text>
        ))}
      </g>
    </g>
  )
}
