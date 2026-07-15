/**
 * padArt — shared SVG artwork for the guided pad-placement stage.
 *
 * Clean clinical line-art body map (black outline on white, no fills/shading)
 * and matte-white ZOLL OneStep defibrillation pads. Kept separate from the
 * interaction logic so the artwork can be reviewed on its own (PadArtReview).
 *
 * Each piece takes a `uid` so its filter ids stay unique when several instances
 * share one <svg> document. All art is centred/relative so thumbnails scale.
 */

const INK = '#1a1a1a' // uniform near-black line

/* ---------------- torso ---------------- */

/**
 * Anatomical body map (head → abdomen) drawn in a local ~200×230 box (call
 * inside an <svg>, positioned by the caller via `x`). Line-art only: white fill,
 * crisp black outline, thin contour lines. Neutral male chest.
 */
export function Torso({ x = 0, view }) {
  // Continuous silhouette: bald head → neck → deltoids → arms at the sides →
  // chest → abdomen, cropped flat across the abdomen (no pelvis / lower limbs).
  const body =
    'M100,7 C119,7 130,21 130,39 C130,47 129,53 128,57 C134,56 137,61 134,66 ' +
    'C131,69 128,67 127,65 C125,73 120,79 114,84 C111,90 111,96 112,102 ' +
    'C115,110 124,114 134,117 C147,121 157,127 165,135 C173,142 176,152 175,163 ' +
    'C174,180 173,204 172,224 L172,228 L154,228 C153,214 153,180 153,158 ' +
    'C152,148 151,142 150,137 C148,153 145,186 145,214 L144,228 L56,228 L55,214 ' +
    'C55,186 52,153 50,137 C49,142 48,148 47,158 C47,180 47,214 46,228 ' +
    'L28,228 L28,224 C27,204 26,180 25,163 C24,152 27,142 35,135 ' +
    'C43,127 53,121 66,117 C76,114 85,110 88,102 C89,96 89,90 86,84 ' +
    'C80,79 75,73 73,65 C72,67 69,69 66,66 C63,61 66,56 72,57 ' +
    'C71,53 70,47 70,39 C70,21 81,7 100,7 Z'

  return (
    <g transform={`translate(${x},16)`}>
      <text x={100} y={-2} textAnchor="middle" fill="#333" fontSize="13" fontWeight="700">
        {view === 'front' ? 'Anterior (front)' : 'Posterior (back)'}
      </text>

      {/* body silhouette — white fill, crisp black outline */}
      <path d={body} fill="#ffffff" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />

      {view === 'front' ? (
        <g fill="none" stroke={INK} strokeLinecap="round">
          {/* sternocleidomastoid (subtle) */}
          <path d="M93,96 C93,103 94,109 95,113" strokeWidth={1} opacity={0.4} />
          <path d="M107,96 C107,103 106,109 105,113" strokeWidth={1} opacity={0.4} />
          {/* sternal notch */}
          <path d="M97,118 C98,121 102,121 103,118" strokeWidth={1} opacity={0.7} />
          {/* clavicles */}
          <path d="M99,122 C87,121 75,123 61,128" strokeWidth={1.1} />
          <path d="M101,122 C113,121 125,123 139,128" strokeWidth={1.1} />
          {/* short sternum line */}
          <path d="M100,121 L100,150" strokeWidth={1.1} />
          {/* faint pectoral outline (flat, neutral) */}
          <path d="M63,139 C74,147 85,148 95,146" strokeWidth={1} opacity={0.4} />
          <path d="M137,139 C126,147 115,148 105,146" strokeWidth={1} opacity={0.4} />
          {/* light abdominal midline (linea alba) */}
          <path d="M100,152 L100,214" strokeWidth={1} opacity={0.35} />
          {/* deltoid + upper-arm contour */}
          <path d="M46,133 C40,146 42,159 51,166" strokeWidth={1} opacity={0.5} />
          <path d="M154,133 C160,146 158,159 149,166" strokeWidth={1} opacity={0.5} />
          <path d="M44,156 C47,178 46,200 43,220" strokeWidth={1} opacity={0.35} />
          <path d="M156,156 C153,178 154,200 157,220" strokeWidth={1} opacity={0.35} />
          {/* nipple marks */}
          <circle cx={78} cy={143} r={1.4} fill={INK} stroke="none" />
          <circle cx={122} cy={143} r={1.4} fill={INK} stroke="none" />
        </g>
      ) : (
        <g fill="none" stroke={INK} strokeLinecap="round">
          {/* spine line */}
          <path d="M100,112 L100,222" strokeWidth={1.1} />
          {/* upper trapezius (subtle) */}
          <path d="M100,113 C110,119 120,125 131,131" strokeWidth={1} opacity={0.4} />
          <path d="M100,113 C90,119 80,125 69,131" strokeWidth={1} opacity={0.4} />
          {/* scapular borders (subtle) */}
          <path d="M82,135 C76,149 80,167 94,163" strokeWidth={1} opacity={0.4} />
          <path d="M118,135 C124,149 120,167 106,163" strokeWidth={1} opacity={0.4} />
          {/* deltoid + upper-arm contour */}
          <path d="M46,133 C40,146 42,159 51,166" strokeWidth={1} opacity={0.5} />
          <path d="M154,133 C160,146 158,159 149,166" strokeWidth={1} opacity={0.5} />
          <path d="M44,156 C47,178 46,200 43,220" strokeWidth={1} opacity={0.35} />
          <path d="M156,156 C153,178 154,200 157,220" strokeWidth={1} opacity={0.35} />
        </g>
      )}
    </g>
  )
}

/* ---------------- pads ---------------- */

const RED = '#C0392B' // muted medical red

/** Soft, subtle matte drop shadow (not glossy). */
function MatteShadow({ id }) {
  return (
    <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.3" floodColor="#20242a" floodOpacity="0.2" />
    </filter>
  )
}

/** A small line-art head-and-torso used inside the pad decals. */
function TorsoGlyph({ stroke = '#8a8a8a', sw = 0.7, fill = 'none' }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <circle cx={0} cy={-5.4} r={1.9} />
      <path d="M-4.4,1.6 C-4.4,-1.6 -2.2,-3 0,-3 C2.2,-3 4.4,-1.6 4.4,1.6 L4.4,4.6 L-4.4,4.6 Z" />
    </g>
  )
}

/**
 * Triangular ZOLL OneStep CPR-feedback pad ("2"): a matte-white rounded triangle
 * with the compression-sensor puck (thin red crosshair) at the top-left, three
 * red ECG-electrode markers near the corners, and a translucent blue placement
 * decal. Drawn centred on (0,0), ~44 wide.
 */
export function TrianglePadArt({ uid = 'tri' }) {
  const sh = `sh-${uid}`
  // small ECG "heartbeat" squiggle
  const ecg = 'M-3.4,0 L-1.6,0 L-0.8,-2.4 L0.2,3 L1,-1 L2,0 L3.4,0'
  return (
    <g>
      <defs><MatteShadow id={sh} /></defs>

      {/* red cable-connector stub */}
      <rect x={-4} y={14} width={8} height={9} rx={2} fill={RED} />

      {/* matte-white rounded-triangle shell */}
      <g filter={`url(#${sh})`}>
        <path
          d="M3,-17 C7,-17 10,-13 12,-7 L17,11 Q19,16 13,17 C6,18 -6,18 -13,17 Q-19,16 -17,11 L-12,-7 C-10,-13 -7,-17 3,-17 Z"
          fill="#ffffff" stroke="#cccccc" strokeWidth={1} strokeLinejoin="round"
        />
      </g>

      {/* ECG-electrode markers near the three corners */}
      <g fill="none" stroke={RED} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round">
        <path d={ecg} transform="translate(9,-9) scale(0.85)" />
        <path d={ecg} transform="translate(-11,12) scale(0.85)" />
        <path d={ecg} transform="translate(13,12) scale(0.85)" />
      </g>

      {/* translucent blue placement decal: torso + 2 chest dots + "2" */}
      <path d="M4,-3 L14,15 L-6,15 Z" fill="#7ab5e0" opacity="0.3" />
      <g transform="translate(4,4)">
        <TorsoGlyph stroke="#6b7480" sw={0.7} />
        <circle cx={-1.6} cy={1.4} r={0.8} fill={RED} />
        <circle cx={1.8} cy={2.2} r={0.8} fill={RED} />
      </g>
      <text x={4} y={14} textAnchor="middle" fontSize={5} fontWeight="800" fill="#ffffff">2</text>

      {/* CPR compression-sensor puck (protrudes top-left) */}
      <g transform="translate(-12,-12) rotate(-12)">
        <g filter={`url(#${sh})`}>
          <ellipse cx={0} cy={0} rx={10} ry={7.5} fill="#ffffff" stroke="#b0b0b0" strokeWidth={1} />
        </g>
        {/* thin red crosshair spanning the oval (full lines) */}
        <g stroke={RED} strokeWidth={0.9} strokeLinecap="round">
          <line x1={-10} y1={0} x2={10} y2={0} />
          <line x1={0} y1={-7.5} x2={0} y2={7.5} />
        </g>
      </g>
    </g>
  )
}

/**
 * Rectangular ZOLL OneStep standard pad ("1"): a matte-white rounded rectangle
 * with a red placement decal (grey torso + a red pad on the lower-left chest)
 * and a red "1" half-circle badge. Drawn centred on (0,0), ~28×36.
 */
export function RectanglePadArt({ uid = 'rect' }) {
  const sh = `shr-${uid}`
  const W = 28, H = 36
  return (
    <g>
      <defs><MatteShadow id={sh} /></defs>

      {/* red cable-connector stub */}
      <rect x={-4} y={H / 2 - 3} width={8} height={9} rx={2} fill={RED} />

      {/* matte-white rounded-rectangle shell */}
      <g filter={`url(#${sh})`}>
        <rect x={-(W / 2)} y={-(H / 2)} width={W} height={H} rx={7} fill="#ffffff" stroke="#cccccc" strokeWidth={1} />
      </g>

      {/* red placement decal */}
      <rect x={-9} y={-13} width={18} height={19} rx={2.5} fill={RED} />
      {/* light torso silhouette inside the decal with a red pad on the chest */}
      <g transform="translate(0,-4) scale(1.35)">
        <TorsoGlyph stroke="#f4eceb" sw={0.5} fill="#f4eceb" />
        {/* single red pad on the lower-left chest */}
        <rect x={-2.7} y={0.2} width={2.8} height={3.1} rx={0.6} fill={RED} stroke="#a8332a" strokeWidth={0.3} />
      </g>
      {/* red "1" half-circle badge at the bottom edge of the decal */}
      <path d="M-4.5,6 A4.5,4.5 0 0 0 4.5,6 Z" fill={RED} />
      <text x={0} y={9.6} textAnchor="middle" fontSize={5} fontWeight="800" fill="#ffffff">1</text>
    </g>
  )
}
