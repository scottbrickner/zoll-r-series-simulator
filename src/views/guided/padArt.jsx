/**
 * padArt — shared SVG artwork for the guided pad-placement stage.
 *
 * A two-view anatomical torso and the two ZOLL OneStep pad types (the
 * triangular CPR-feedback pad with its compression-sensor puck, and the
 * rectangular standard pad). Kept separate from the interaction logic so the
 * artwork can be reviewed/iterated on its own (see PadArtReview).
 *
 * Each piece takes a `uid` so its gradient/filter ids stay unique when several
 * instances share one <svg> document.
 */

/* ---------------- torso ---------------- */

/**
 * Anatomical upper body (bust) drawn in a local ~200×210 box (call inside an
 * <svg>, positioned by the caller via `x`). Modeled on a reference male
 * line-drawing: bald head with ears, neck with SCM + sternal-notch, clavicles,
 * defined deltoids and pectorals, nipple landmarks; arms hang at the sides.
 * Cropped at the lower chest (no abdomen / lower limbs).
 */
export function Torso({ x = 0, view }) {
  const uid = view
  const OUTLINE = '#7d715c'
  const LINE = '#a1927a'
  const FAINT = '#c4b9a4'
  const AREOLA = '#dcc0a8'
  const NIPPLE = '#a67f66'
  const SHADE = '#d8c7ac'

  // One continuous silhouette (oval bald head → longer neck → broad deltoids →
  // arms held at the sides → chest), shared by both views; interior anatomy
  // differs. Cropped flat across the lower chest (no abdomen / lower limbs).
  const body =
    'M100,7 C119,7 130,21 130,39 C130,47 129,53 128,57 C134,56 137,61 134,66 ' +
    'C131,69 128,67 127,65 C125,73 120,79 114,84 C111,90 111,96 112,102 ' +
    'C115,110 124,114 134,117 C147,121 157,127 165,135 C173,142 176,152 175,163 ' +
    'C174,175 173,186 171,197 L171,202 L155,202 C154,189 154,173 154,158 ' +
    'C153,149 152,142 151,137 C149,152 146,176 145,189 L144,202 L56,202 L55,189 ' +
    'C54,176 51,152 49,137 C48,142 47,149 46,158 C46,173 46,189 45,202 ' +
    'L29,202 L29,197 C27,186 26,175 25,163 C24,152 27,142 35,135 ' +
    'C43,127 53,121 66,117 C76,114 85,110 88,102 C89,96 89,90 86,84 ' +
    'C80,79 75,73 73,65 C72,67 69,69 66,66 C63,61 66,56 72,57 ' +
    'C71,53 70,47 70,39 C70,21 81,7 100,7 Z'

  return (
    <g transform={`translate(${x},18)`}>
      <defs>
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fefdfa" />
          <stop offset="0.55" stopColor="#f8f0e4" />
          <stop offset="1" stopColor="#efe4d3" />
        </linearGradient>
        <radialGradient id={`pec-${uid}`} cx="0.5" cy="0.42" r="0.72">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.65" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor={SHADE} stopOpacity="0.3" />
        </radialGradient>
      </defs>

      <text x={100} y={-2} textAnchor="middle" fill="#5b5750" fontSize="13" fontWeight="700">
        {view === 'front' ? 'Anterior (front)' : 'Posterior (back)'}
      </text>

      {/* body silhouette */}
      <path d={body} fill={`url(#skin-${uid})`} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />

      {view === 'front' ? (
        <>
          {/* pectoral + deltoid volume shading */}
          <ellipse cx={78} cy={140} rx={27} ry={15} fill={`url(#pec-${uid})`} />
          <ellipse cx={122} cy={140} rx={27} ry={15} fill={`url(#pec-${uid})`} />
          <ellipse cx={39} cy={146} rx={12} ry={22} fill={`url(#pec-${uid})`} />
          <ellipse cx={161} cy={146} rx={12} ry={22} fill={`url(#pec-${uid})`} />

          <g fill="none" stroke={LINE} strokeLinecap="round">
            {/* sternocleidomastoid (neck) — subtle, near-vertical */}
            <path d="M93,96 C93,103 94,109 95,113" strokeWidth={1.1} opacity={0.42} />
            <path d="M107,96 C107,103 106,109 105,113" strokeWidth={1.1} opacity={0.42} />
            {/* sternal notch */}
            <path d="M97,118 C98,121 102,121 103,118" strokeWidth={1.2} opacity={0.7} />
            {/* clavicles (flat, small dip at the notch) */}
            <path d="M99,122 C87,121 75,123 61,128" strokeWidth={1.8} />
            <path d="M101,122 C113,121 125,123 139,128" strokeWidth={1.8} />
            {/* deltoid separation + upper-arm contour */}
            <path d="M46,133 C40,146 42,159 51,166" strokeWidth={1.5} />
            <path d="M154,133 C160,146 158,159 149,166" strokeWidth={1.5} />
            <path d="M43,150 C46,164 45,178 41,190" strokeWidth={1.2} opacity={0.7} />
            <path d="M157,150 C154,164 155,178 159,190" strokeWidth={1.2} opacity={0.7} />
            {/* pectoral lower borders */}
            <path d="M59,134 C73,152 91,155 100,149" strokeWidth={1.7} />
            <path d="M141,134 C127,152 109,155 100,149" strokeWidth={1.7} />
            {/* sternum */}
            <path d="M100,120 L100,150" strokeWidth={1.8} />
          </g>
          {/* sternum highlight */}
          <path d="M102,123 L102,147" fill="none" stroke="#fffdf8" strokeWidth={1} strokeLinecap="round" opacity="0.8" />
          {/* nipples + areola */}
          <g>
            <circle cx={78} cy={142} r={5.5} fill={AREOLA} />
            <circle cx={122} cy={142} r={5.5} fill={AREOLA} />
            <circle cx={78} cy={142} r={2.3} fill={NIPPLE} />
            <circle cx={122} cy={142} r={2.3} fill={NIPPLE} />
          </g>
        </>
      ) : (
        <>
          {/* trapezius + scapular volume shading */}
          <ellipse cx={100} cy={128} rx={32} ry={27} fill={`url(#pec-${uid})`} />
          <ellipse cx={39} cy={146} rx={12} ry={22} fill={`url(#pec-${uid})`} />
          <ellipse cx={161} cy={146} rx={12} ry={22} fill={`url(#pec-${uid})`} />

          <g fill="none" stroke={LINE} strokeLinecap="round">
            {/* nape + spine groove */}
            <path d="M100,112 L100,196" strokeWidth={2} />
            {/* upper trapezius (nape → shoulders) */}
            <path d="M100,113 C110,119 120,125 131,131" strokeWidth={1.5} />
            <path d="M100,113 C90,119 80,125 69,131" strokeWidth={1.5} />
            {/* scapular (shoulder-blade) medial borders */}
            <path d="M82,135 C76,149 80,167 94,163" strokeWidth={1.6} />
            <path d="M118,135 C124,149 120,167 106,163" strokeWidth={1.6} />
            {/* deltoid separation + upper-arm contour */}
            <path d="M46,133 C40,146 42,159 51,166" strokeWidth={1.5} />
            <path d="M154,133 C160,146 158,159 149,166" strokeWidth={1.5} />
            <path d="M43,150 C46,164 45,178 41,190" strokeWidth={1.2} opacity={0.7} />
            <path d="M157,150 C154,164 155,178 159,190" strokeWidth={1.2} opacity={0.7} />
          </g>
          {/* spine highlight */}
          <path d="M102,116 L102,192" fill="none" stroke="#fffdf8" strokeWidth={1} strokeLinecap="round" opacity="0.6" />
        </>
      )}
    </g>
  )
}

/* ---------------- pads ---------------- */

/**
 * Triangular ZOLL OneStep CPR-feedback pad ("2"): a white rounded-triangle body
 * with the compression-sensor puck protruding at the top-left (target cross-hair),
 * a blue placement triangle marked "2", and a red connector tab. Modeled on the
 * real pad; drawn centred on (0,0), ~44 wide.
 */
export function TrianglePadArt({ uid = 'tri' }) {
  return (
    <g>
      <defs>
        <linearGradient id={`shell-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f3f3f1" />
          <stop offset="1" stopColor="#e2e2df" />
        </linearGradient>
        <radialGradient id={`puck-${uid}`} cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.75" stopColor="#f0f1f3" />
          <stop offset="1" stopColor="#d7dade" />
        </radialGradient>
        <filter id={`sh-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.7" stdDeviation="1" floodColor="#2a2f36" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* red connector tab (bottom) */}
      <rect x={-4.5} y={14} width={9} height={9} rx={2} fill="#d5342b" stroke="#a82920" strokeWidth={0.8} />

      {/* rounded-triangle shell (apex up, wide base) */}
      <g filter={`url(#sh-${uid})`}>
        <path
          d="M3,-17 C7,-17 10,-13 12,-7 L17,11 Q19,16 13,17 C6,18 -6,18 -13,17 Q-19,16 -17,11 L-12,-7 C-10,-13 -7,-17 3,-17 Z"
          fill={`url(#shell-${uid})`} stroke="#c2c5c8" strokeWidth={1} strokeLinejoin="round"
        />
      </g>

      {/* blue placement triangle + "2" */}
      <path d="M5,-2 L13,13 L-3,13 Z" fill="#43a0d6" opacity="0.92" />
      <text x={5} y={11.5} textAnchor="middle" fontSize={7} fontWeight="800" fill="#ffffff">2</text>

      {/* CPR compression-sensor puck (protrudes top-left) */}
      <g transform="translate(-12,-12) rotate(-12)" filter={`url(#sh-${uid})`}>
        <rect x={-10} y={-7.5} width={20} height={15} rx={7.5} fill={`url(#puck-${uid})`} stroke="#b7bcc1" strokeWidth={1} />
      </g>
      {/* target cross-hair (clean plus, screen-aligned) */}
      <g stroke="#cf3b3b" strokeWidth={1.6} strokeLinecap="round">
        <line x1={-19} y1={-12} x2={-5} y2={-12} />
        <line x1={-12} y1={-19} x2={-12} y2={-5} />
      </g>
    </g>
  )
}

/**
 * Rectangular ZOLL OneStep standard pad ("1"): a white rounded-rectangle body
 * with a red placement label (torso + "1") and a red connector tab. Modeled on
 * the real pad; drawn centred on (0,0), ~28×36.
 */
export function RectanglePadArt({ uid = 'rect' }) {
  const W = 28, H = 36
  return (
    <g>
      <defs>
        <linearGradient id={`shellr-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f3f3f1" />
          <stop offset="1" stopColor="#e2e2df" />
        </linearGradient>
        <filter id={`shr-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.7" stdDeviation="1" floodColor="#2a2f36" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* red connector tab */}
      <rect x={-4.5} y={H / 2 - 3} width={9} height={9} rx={2} fill="#d5342b" stroke="#a82920" strokeWidth={0.8} />

      {/* white shell */}
      <g filter={`url(#shr-${uid})`}>
        <rect x={-(W / 2)} y={-(H / 2)} width={W} height={H} rx={8} fill={`url(#shellr-${uid})`} stroke="#c2c5c8" strokeWidth={1} />
      </g>

      {/* red placement label with torso + "1" */}
      <rect x={-9} y={-13} width={18} height={20} rx={2.5} fill="#cc2e2a" />
      {/* torso silhouette (light) */}
      <g fill="#f4dcd8">
        <circle cx={0} cy={-9} r={2.6} />
        <path d="M-6,-1 C-6,-5 -3,-6.5 0,-6.5 C3,-6.5 6,-5 6,-1 L6,3 L-6,3 Z" />
      </g>
      {/* pad on the torso */}
      <rect x={-2.5} y={-3} width={5} height={5.5} rx={1} fill="#cc2e2a" />
      {/* "1" badge */}
      <circle cx={0} cy={9} r={4} fill="#cc2e2a" />
      <text x={0} y={11.4} textAnchor="middle" fontSize={6.5} fontWeight="800" fill="#ffffff">1</text>
    </g>
  )
}
