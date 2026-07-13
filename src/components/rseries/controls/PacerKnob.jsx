/**
 * Pacer Knob — reusable rotary knob system (Industrial Design Pass 2E).
 * Reconstructs the ZOLL R Series pacer knobs used for OUTPUT (mA) and RATE (ppm).
 *
 * Two independent layers:
 *   • FIXED teal socket ring — never rotates.
 *   • ROTATING knob — outer black molded body, teal inner accent, molded grip
 *     ridges, inner recessed face, centre hub, and one white indicator line.
 *     The whole knob (grip + indicator) rotates together.
 *
 * Satin molded plastic: factory-new, neutral CAD lighting, minimal reflections
 * and shadows — not glossy. Footprint matches the locked master layer 15 (r 78).
 *
 * Returns a <g> (a part); the consumer supplies the enclosing <svg viewBox>.
 * The GEOMETRY never changes. React controls only:
 *   rotationAngle — degrees; the knob (and its white indicator) rotate by this.
 *   pressed       — pushed-in (subtle deeper recess).
 *   enabled       — false → dimmed / desaturated / disabled.
 *
 * Props: cx, cy, r (default 90,90,78); rotationAngle; pressed; enabled; onClick;
 *        idPrefix (unique gradient id prefix when many render in one <svg>).
 */
const RIDGES = 18 // simplified molded grip flutes (not aggressive knurling)

export default function PacerKnob({
  cx = 90,
  cy = 90,
  r = 78,
  rotationAngle = 0,
  pressed = false,
  enabled = true,
  onClick,
  idPrefix = 'pk',
}) {
  const dim = !enabled
  const bodyId = `${idPrefix}-body`
  const faceId = `${idPrefix}-face`
  const teal = dim ? '#9fabA7' : '#0f9c97'
  const tealAccent = dim ? '#b0bab6' : '#16b3ad'
  const tealRim = dim ? '#8f9a96' : '#0a716d'
  const indicator = dim ? '#b7bcbf' : '#e6e9ec'
  const rot = `rotate(${rotationAngle} ${cx} ${cy})`

  return (
    <g id="pacer_knob" className={onClick ? 'rs-hit' : undefined} onClick={onClick} opacity={dim ? 0.72 : 1}>
      <defs>
        {/* outer black molded knob body — satin (not glossy) */}
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2e2e2e" />
          <stop offset="1" stopColor="#101010" />
        </linearGradient>
        {/* inner recessed face — satin dark */}
        <radialGradient id={faceId} cx="0.42" cy="0.34" r="0.9">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="0.6" stopColor="#1f1f1f" />
          <stop offset="1" stopColor="#0b0b0b" />
        </radialGradient>
      </defs>

      {/* ── FIXED teal socket ring (never rotates) ── */}
      <circle cx={cx} cy={cy} r={r} fill={teal} stroke={tealRim} strokeWidth="1.5" />

      {/* ── ROTATING knob ── */}
      <g transform={rot}>
        {/* outer black molded knob body */}
        <circle cx={cx} cy={cy} r={r - 6} fill={`url(#${bodyId})`} stroke="#080808" strokeWidth="1" />
        {/* teal inner accent ring */}
        <circle cx={cx} cy={cy} r={r - 9} fill="none" stroke={tealAccent} strokeWidth="2" opacity="0.8" />
        {/* molded grip ridges (simplified flutes) */}
        {Array.from({ length: RIDGES }).map((_, i) => {
          const a = (i * (360 / RIDGES) * Math.PI) / 180
          const r1 = r - 10
          const r2 = r - 18
          return (
            <line key={i}
              x1={cx + r1 * Math.sin(a)} y1={cy - r1 * Math.cos(a)}
              x2={cx + r2 * Math.sin(a)} y2={cy - r2 * Math.cos(a)}
              stroke="#3a3a3a" strokeWidth="2.4" strokeLinecap="round" />
          )
        })}
        {/* inner recessed face (depth) */}
        <circle cx={cx} cy={cy} r={r - 19} fill={`url(#${faceId})`} stroke="#070707" strokeWidth="1.5" />
        {/* broad horizontal gloss band across the face (per the manufacturer photo) */}
        {!pressed && <ellipse cx={cx} cy={cy - r * 0.14} rx={r - 12} ry={r * 0.16} fill="#ffffff" opacity="0.09" pointerEvents="none" />}
        {/* pressed: subtle deeper recess */}
        {pressed && <circle cx={cx} cy={cy} r={r - 19} fill="#000000" opacity="0.18" pointerEvents="none" />}
        {/* molded finger grip: a raised satin bar across the face (NOT a thin pointer),
            with a soft gloss streak — reads orientation as it rotates */}
        <rect x={cx - (r - 22)} y={cy - 7} width={2 * (r - 22)} height="14" rx="7" fill="#404040" stroke="#0a0a0a" strokeWidth="0.75" pointerEvents="none" />
        <rect x={cx - (r - 24)} y={cy - 4} width={2 * (r - 24)} height="4" rx="2" fill={indicator} opacity="0.5" pointerEvents="none" />
      </g>
    </g>
  )
}
