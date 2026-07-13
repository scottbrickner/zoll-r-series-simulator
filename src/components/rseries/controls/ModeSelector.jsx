/**
 * Mode Selector — reusable control component (Industrial Design Pass 2).
 *
 * Composes the five approved Mode Selector parts into one control, in the LOCKED
 * master coordinate space (0 0 1440 1120), so it can later drop into the assembled
 * device without re-fitting. Geometry is identical to the locked master layers
 * 11–14 (see src/assets/rseries/controls/mode_selector_*.svg and the master
 * RSeriesDevice.jsx). React only animates STATE here — rotation and an
 * active-mode highlight — it never redraws geometry:
 *   • the printed background, arcs, and labels NEVER rotate;
 *   • ONLY the knob grip/insert and the single indicator dot rotate.
 *
 * Returns a <g> (a part). The consumer supplies the enclosing <svg viewBox>.
 *
 * Props:
 *   mode        — 'Off' | 'Monitor' | 'Defib' | 'Pacer'. Sets the default knob
 *                 angle via MODE_ANGLE.
 *   knobAngle   — optional number (degrees). Overrides the mode-derived angle
 *                 (e.g. for a live drag). Falls back to MODE_ANGLE[mode].
 *   activeMode  — optional 'Off'|'Monitor'|'Defib'|'Pacer'. Adds a subtle
 *                 highlight to that printed label (state overlay only).
 *   idPrefix    — optional unique id prefix so multiple instances don't collide
 *                 on the gradient id.
 */

// Locked master constants (must match RSeriesDevice.jsx exactly).
const KX = 1210
const KY = 556
const KR = 82

// Knob-rotation angles: the white indicator line (canonical points DOWN / 6
// o'clock) rotates to the fixed position dot for each mode
// (OFF 9 o'clock, PACER 7 o'clock, DEFIB 1 o'clock, MONITOR 11 o'clock).
export const MODE_ANGLE = { Off: 90, Monitor: 150, Defib: -150, Pacer: 30 }

// Fixed white position dots — one per mode section, on the collar (radius 89),
// at the same clock position the knob line points to. These do NOT rotate.
export const MODE_DOTS = [
  { mode: 'Off', cx: 1121, cy: 556 },     // 9 o'clock
  { mode: 'Pacer', cx: 1166, cy: 633 },   // 7 o'clock
  { mode: 'Defib', cx: 1254, cy: 479 },   // 1 o'clock
  { mode: 'Monitor', cx: 1166, cy: 479 }, // 11 o'clock
]

export default function ModeSelector({
  mode = 'Off',
  knobAngle,
  activeMode,
  idPrefix = 'ms',
}) {
  const angle = knobAngle != null ? knobAngle : (MODE_ANGLE[mode] ?? -90)
  const rot = `rotate(${angle} ${KX} ${KY})`
  const gradId = `${idPrefix}-knob`
  const gripId = `${idPrefix}-knobgrip`
  const ring = (m) => (activeMode === m ? '#ffffff' : 'none')

  return (
    <g id="mode_selector" fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif">
      <defs>
        <radialGradient id={gradId} cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#545454" />
          <stop offset="0.5" stopColor="#2c2c2c" />
          <stop offset="1" stopColor="#101010" />
        </radialGradient>
        <linearGradient id={gripId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f8f8f" />
          <stop offset="1" stopColor="#565656" />
        </linearGradient>
      </defs>

      {/* 11 — background base plate (static) */}
      <g id="mode_selector_background">
        <circle cx={KX} cy={KY} r={KR + 14} fill="#dcded9" stroke="#c1c3bf" />
      </g>

      {/* 12 — printed labels / colored sections (never rotate). Colour lives in
          the printed sections (no wrapping arcs), per the manufacturer photo.
          activeMode adds a translucent outline to the selected label — a state
          overlay, not a restyle. */}
      <g id="mode_selector_labels">
        <path d="M1022,474 H1150 L1164,489 L1150,504 H1022 Q1017,504 1017,499 V479 Q1017,474 1022,474 Z" fill="#c4c7c3" stroke={ring('Monitor')} strokeOpacity="0.6" strokeWidth="2" />
        <text x="1086" y="496" textAnchor="middle" fill="#2a2f36" fontSize="18" fontWeight="700">MONITOR</text>
        <rect x="1008" y="541" width="104" height="30" rx="15" fill="#101316" stroke={ring('Off')} strokeOpacity="0.6" strokeWidth="2" />
        <text x="1060" y="562" textAnchor="middle" fill="#f1f4f7" fontSize="18" fontWeight="800">OFF</text>
        <path d="M984,603 H1072 L1058,627 H984 Q979,627 979,622 V608 Q979,603 984,603 Z" fill="#0f9c97" stroke={ring('Pacer')} strokeOpacity="0.6" strokeWidth="2" />
        <text x="1024" y="620" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">PACER</text>
        <path d="M1298,490 H1370 Q1375,490 1375,495 V511 Q1375,516 1370,516 H1298 L1286,503 Z" fill="#cf2a20" stroke={ring('Defib')} strokeOpacity="0.6" strokeWidth="2" />
        <text x="1334" y="509" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800">DEFIB</text>
      </g>

      {/* 13 — knob: static recessed body, rotating grip + white indicator insert */}
      <g id="mode_selector_knob">
        <circle cx={KX} cy={KY} r={KR} fill="#161616" />
        <circle cx={KX} cy={KY} r={KR - 5} fill={`url(#${gradId})`} stroke="#0b0b0b" strokeWidth="2" />
        {/* recessed inner shadow ring — deepens the seated knob depth */}
        <circle cx={KX} cy={KY} r={KR - 7} fill="none" stroke="#000000" strokeOpacity="0.30" strokeWidth="3" />
        <ellipse cx={KX - 16} cy={KY - 28} rx="44" ry="28" fill="#ffffff" opacity="0.16" />
        {/* rotating molded finger grip — a raised satin-gray ridge spanning the face
            (NOT a stark white pointer line), per the manufacturer photo. A soft gloss
            streak + a slightly brighter cap at the pointing end read the orientation. */}
        <g id="mode_selector_knob_grip" transform={rot}>
          <rect x={KX - 11} y={KY - (KR - 14)} width="22" height={2 * (KR - 14)} rx="11" fill={`url(#${gripId})`} stroke="#2b2b2b" strokeWidth="1" />
          <rect x={KX - 8} y={KY - (KR - 20)} width="6" height={2 * (KR - 20)} rx="3" fill="#c4c8cb" opacity="0.45" />
          <rect x={KX - 9} y={KY - (KR - 16)} width="18" height="15" rx="7" fill="#aeb2b5" opacity="0.6" />
        </g>
        <circle cx={KX} cy={KY} r="10" fill="#232323" stroke="#3a3a3a" />
      </g>

      {/* 14 — one fixed white position dot per mode section (does NOT rotate).
          The knob line above rotates to point at the selected mode's dot. */}
      <g id="mode_selector_indicator_dot" pointerEvents="none">
        {MODE_DOTS.map((d) => (
          <circle key={d.mode} cx={d.cx} cy={d.cy} r="5" fill="#ffffff" stroke="#9a9d99" strokeWidth="1.2" />
        ))}
      </g>
    </g>
  )
}
