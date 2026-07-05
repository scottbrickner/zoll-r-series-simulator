/**
 * 4:1 Button — reusable small round teal molded push-button (Industrial Design
 * Pass 2H). The button that sits between the PACER OUTPUT (mA) and RATE (ppm)
 * knobs; pressing it temporarily paces at a 4:1 ratio (pause-to-check underlying
 * rhythm). Reconstructed from the manufacturer photos to visually belong with the
 * pacer control area.
 *
 * Returns a <g> (a part). The consumer supplies the enclosing <svg viewBox>.
 * The GEOMETRY never changes — React draws state only:
 *   • a recessed seat/socket in the faceplate,
 *   • a darker molded side edge (depth) beneath the face,
 *   • the satin molded teal face with one restrained bevel highlight,
 *   • the white "4:1" legend.
 * It is a physical molded button, not a web-UI button, and not glossy.
 *
 * Props:
 *   cx, cy, r — center + face radius (default 50, 50, 34).
 *   pressed   — pushed-in: seats down slightly, darkens, deeper lower shadow.
 *   active    — latched/engaged: subtly brighter teal ring + fill (NOT a glow
 *               like SHOCK — a restrained ring, no bloom).
 *   enabled   — false → muted/desaturated teal + reduced opacity (disabled).
 *   onClick   — optional; makes the button a hit target.
 *   idPrefix  — unique gradient id prefix (needed when many render in one <svg>).
 */
export default function FourToOneButton({
  cx = 50,
  cy = 50,
  r = 34,
  pressed = false,
  active = false,
  enabled = true,
  onClick,
  idPrefix = 'ftob',
}) {
  const dim = !enabled
  const faceId = `${idPrefix}-face`
  const hiId = `${idPrefix}-hi`
  const lowId = `${idPrefix}-low`
  const dy = pressed ? 2 : 0 // face seats down onto the side edge when pressed

  // Teal family: default / active (brighter) / pressed (darker) / disabled (muted).
  const face = dim
    ? { top: '#9bb4b1', mid: '#8ba7a4', bot: '#7c9895' }
    : pressed
      ? { top: '#0f9c97', mid: '#0b807b', bot: '#086b67' }
      : active
        ? { top: '#22c4bd', mid: '#16b3ad', bot: '#0f9c97' }
        : { top: '#18b0aa', mid: '#0f9c97', bot: '#0b807b' }
  const sideEdge = dim ? '#758e8b' : '#0a716d'
  const rim = dim ? '#8a9d9a' : active ? '#16b3ad' : '#0a716d'
  const rimWidth = active ? 2 : 1
  const legend = dim ? '#dfe4e2' : '#ffffff'

  return (
    <g id="four_to_one_button" className={onClick ? 'rs-hit' : undefined} onClick={onClick} opacity={dim ? 0.7 : 1}>
      <defs>
        {/* satin teal molded face — restrained top-to-bottom gradient */}
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={face.top} />
          <stop offset="0.55" stopColor={face.mid} />
          <stop offset="1" stopColor={face.bot} />
        </linearGradient>
        {/* single restrained satin sheen (not a glossy hotspot) */}
        <linearGradient id={hiId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* pressed: shadow that pools toward the lower edge */}
        <radialGradient id={lowId} cx="0.5" cy="0.85" r="0.7">
          <stop offset="0" stopColor="#000000" stopOpacity="0.24" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* recessed seat / socket ring in the faceplate */}
      <circle cx={cx} cy={cy} r={r + 6} fill={dim ? '#cccec9' : '#c9cbc6'} />
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="#a7a9a4" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r + 3} fill="#8fa3a0" />

      {/* molded side edge (depth beneath the face) */}
      <circle cx={cx} cy={cy + 2.5} r={r} fill={sideEdge} />

      {/* molded satin face — seats down when pressed */}
      <g transform={dy ? `translate(0 ${dy})` : undefined}>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${faceId})`} stroke={rim} strokeWidth={rimWidth} />

        {/* active: a second restrained brighter ring (NOT a SHOCK-style glow) */}
        {active && !pressed && (
          <circle cx={cx} cy={cy} r={r - 3} fill="none" stroke="#5fe3dc" strokeWidth="1.5" opacity="0.55" pointerEvents="none" />
        )}

        {/* subtle bevel highlight (restrained satin, upper face only) */}
        {!pressed && (
          <ellipse cx={cx - r * 0.18} cy={cy - r * 0.32} rx={r * 0.56} ry={r * 0.26} fill={`url(#${hiId})`} pointerEvents="none" />
        )}

        {/* pressed: deeper lower shadow (pushed-in depth, no gloss) */}
        {pressed && (
          <circle cx={cx} cy={cy} r={r - 1} fill={`url(#${lowId})`} pointerEvents="none" />
        )}

        {/* white "4:1" legend, centered */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={legend}
          fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif"
          fontSize={r * 0.76}
          fontWeight="700"
          letterSpacing="0.5"
          pointerEvents="none"
        >
          4:1
        </text>
      </g>
    </g>
  )
}
