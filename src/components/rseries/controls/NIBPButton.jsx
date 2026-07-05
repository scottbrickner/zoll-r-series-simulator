/**
 * NIBP Button — reusable small NIBP (non-invasive blood pressure) button
 * (Industrial Design Pass 2I + refinement). The button in the lower-left control
 * area that starts / stops an NIBP measurement, reconstructed to match the
 * MANUFACTURER FRONT-PANEL ICON: a small, subtle button with a PALE / very-light-
 * gray molded face, a THIN gray molded rim, and a COMPACT BLUE arm + BP-cuff
 * pictogram inside.
 *
 * It is deliberately NOT a large saturated-blue web button and NOT a large white
 * icon on a blue background — low visual weight, factory-new molded plastic.
 *
 * Returns a <g> (a part). The consumer supplies the enclosing <svg viewBox>.
 * The GEOMETRY never changes — React draws state only:
 *   • a subtle molded side edge (depth) beneath the face,
 *   • a thin gray molded rim / bezel,
 *   • the pale satin molded face with one restrained bevel highlight,
 *   • the compact two-tone blue arm + BP-cuff pictogram.
 *
 * The pictogram reads as an arm wearing a blood-pressure cuff (forearm + fist,
 * darker-blue inflatable cuff band with a closure seam, squeeze bulb on a tube) —
 * NOT a generic person / people icon.
 *
 * Props:
 *   cx, cy, r  — center + rim radius (default 50, 50, 34).
 *   pressed    — pushed-in: seats down slightly, face darkens a touch, soft lower shadow.
 *   active     — armed/engaged: a thin, subtle blue ring at the rim (NOT a glow).
 *   measuring  — a measurement is in progress: the same thin ring, very gently
 *                pulsing. Subtle — no bloom.
 *   enabled    — false → muted (grayer face, desaturated icon) + reduced opacity.
 *   onClick    — optional; makes the button a hit target.
 *   idPrefix   — unique gradient id prefix (needed when many render in one <svg>).
 */
export default function NIBPButton({
  cx = 50,
  cy = 50,
  r = 34,
  pressed = false,
  active = false,
  measuring = false,
  enabled = true,
  onClick,
  idPrefix = 'nibp',
}) {
  const dim = !enabled
  const faceId = `${idPrefix}-face`
  const hiId = `${idPrefix}-hi`
  const lowId = `${idPrefix}-low`
  const dy = pressed ? 1.5 : 0 // face seats down slightly when pressed
  const rf = r - 3 // pale face radius (inside the thin rim)

  // A thin subtle blue ring shows while armed (active) or taking a reading
  // (measuring). Never a SHOCK-style bloom — a single restrained ring; measuring
  // gently pulses it.
  const ringOn = (active || measuring) && !pressed && !dim

  // Pale face: default / pressed (a touch darker/grayer) / disabled (grayer, flat).
  const face = dim
    ? { top: '#f0f1ee', mid: '#e6e7e3', bot: '#dadbd6' }
    : pressed
      ? { top: '#ededea', mid: '#dedeD9', bot: '#cececa' }
      : { top: '#fbfbfa', mid: '#eeeeeb', bot: '#deded9' }
  const sideEdge = dim ? '#bcbeb9' : '#b6b8b3'
  const rimFill = dim ? '#cbcdc8' : '#c6c8c3'
  const rimStroke = '#a9aba6'

  // Two-tone blue pictogram — desaturated to blue-gray when disabled.
  const ink = dim
    ? { arm: '#8a97a4', cuff: '#6f7d8a', seam: '#a7b2bd' }
    : { arm: '#0066b3', cuff: '#004a82', seam: '#2a86c8' }

  return (
    <g id="nibp_button" className={onClick ? 'rs-hit' : undefined} onClick={onClick} opacity={dim ? 0.6 : 1}>
      <defs>
        {/* pale satin molded face — restrained top-to-bottom gradient */}
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={face.top} />
          <stop offset="0.55" stopColor={face.mid} />
          <stop offset="1" stopColor={face.bot} />
        </linearGradient>
        {/* single restrained satin sheen (not a glossy hotspot) */}
        <linearGradient id={hiId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* pressed: soft shadow that pools toward the lower edge */}
        <radialGradient id={lowId} cx="0.5" cy="0.82" r="0.7">
          <stop offset="0" stopColor="#000000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* molded side edge (subtle depth beneath the face) */}
      <circle cx={cx} cy={cy + 1.5} r={r} fill={sideEdge} />

      {/* thin gray molded rim / bezel */}
      <circle cx={cx} cy={cy} r={r} fill={rimFill} stroke={rimStroke} strokeWidth="1" />

      {/* pale molded face — seats down slightly when pressed */}
      <g transform={dy ? `translate(0 ${dy})` : undefined}>
        <circle cx={cx} cy={cy} r={rf} fill={`url(#${faceId})`} />

        {/* subtle bevel highlight (restrained satin, upper face only) */}
        {!pressed && (
          <ellipse cx={cx - rf * 0.19} cy={cy - rf * 0.33} rx={rf * 0.55} ry={rf * 0.26} fill={`url(#${hiId})`} pointerEvents="none" />
        )}

        {/* pressed: soft lower shadow (pushed-in depth, no gloss) */}
        {pressed && (
          <circle cx={cx} cy={cy} r={rf} fill={`url(#${lowId})`} pointerEvents="none" />
        )}

        {/* active/measuring: a thin, subtle blue ring near the rim (NOT a glow) */}
        {ringOn && (
          <circle cx={cx} cy={cy} r={rf - 1} fill="none" stroke="#3a8fd6" strokeWidth="1.5" opacity="0.5" pointerEvents="none">
            {measuring && (
              <animate attributeName="opacity" values="0.18;0.5;0.18" dur="1.8s" repeatCount="indefinite" />
            )}
          </circle>
        )}

        {/* ===== compact blue arm + BP-cuff pictogram (centered on the face) ===== */}
        <g transform={`translate(${cx} ${cy}) scale(${(r / 34) * 0.82})`} pointerEvents="none">
          {/* squeeze bulb + tube (behind the arm) */}
          <path d="M1,8.5 C-4,16 -8,16 -12,14.5" fill="none" stroke={ink.arm} strokeWidth={2} strokeLinecap="round" />
          <ellipse cx={-13.5} cy={15.5} rx={4} ry={5} fill={ink.arm} />
          {/* forearm */}
          <rect x={-15} y={-4} width={27} height={8} rx={4} fill={ink.arm} />
          {/* simplified fist at the right end */}
          <ellipse cx={12} cy={0} rx={5} ry={5.5} fill={ink.arm} />
          {/* inflatable cuff band (darker blue) wrapped around the arm */}
          <rect x={-5} y={-8.5} width={12} height={17} rx={2.5} fill={ink.cuff} />
          {/* cuff closure / velcro seam */}
          <line x1={2} y1={-6.5} x2={2} y2={6.5} stroke={ink.seam} strokeWidth={1} strokeLinecap="round" />
        </g>
      </g>
    </g>
  )
}
