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

  // One continuous silhouette (rounded bald head → short neck → broad deltoids →
  // arms held at the sides → chest), shared by both views; interior anatomy
  // differs. Cropped flat across the lower chest (no abdomen / lower limbs).
  const body =
    'M100,8 C120,8 132,22 132,40 C132,48 131,53 130,57 C136,56 139,61 136,65 ' +
    'C133,68 130,66 129,64 C127,71 122,76 116,81 C113,85 113,89 114,93 ' +
    'C117,100 125,103 134,106 C147,110 157,116 165,124 C173,131 176,141 175,152 ' +
    'C174,165 173,178 171,191 L171,197 L155,197 C154,183 154,166 154,150 ' +
    'C153,140 152,133 151,128 C149,144 146,169 145,183 L144,197 L56,197 L55,183 ' +
    'C54,169 51,144 49,128 C48,133 47,140 46,150 C46,166 46,183 45,197 ' +
    'L29,197 L29,191 C27,178 26,165 25,152 C24,141 27,131 35,124 ' +
    'C43,116 53,110 66,106 C75,103 83,100 86,93 C87,89 87,85 84,81 ' +
    'C78,76 73,71 71,64 C70,66 67,68 64,65 C61,61 64,56 70,57 ' +
    'C69,53 68,48 68,40 C68,22 80,8 100,8 Z'

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
          <ellipse cx={78} cy={130} rx={27} ry={14} fill={`url(#pec-${uid})`} />
          <ellipse cx={122} cy={130} rx={27} ry={14} fill={`url(#pec-${uid})`} />
          <ellipse cx={40} cy={135} rx={12} ry={20} fill={`url(#pec-${uid})`} />
          <ellipse cx={160} cy={135} rx={12} ry={20} fill={`url(#pec-${uid})`} />

          <g fill="none" stroke={LINE} strokeLinecap="round">
            {/* clavicles (gentle, slight dip at the sternal notch) */}
            <path d="M100,111 C87,112 74,114 62,118" strokeWidth={1.7} />
            <path d="M100,111 C113,112 126,114 138,118" strokeWidth={1.7} />
            {/* deltoid separation */}
            <path d="M47,122 C41,134 43,146 52,153" strokeWidth={1.5} />
            <path d="M153,122 C159,134 157,146 148,153" strokeWidth={1.5} />
            {/* pectoral lower borders (flat, athletic) */}
            <path d="M60,124 C74,138 90,140 100,136" strokeWidth={1.7} />
            <path d="M140,124 C126,138 110,140 100,136" strokeWidth={1.7} />
            {/* sternum (between the pecs) */}
            <path d="M100,112 L100,138" strokeWidth={1.8} />
          </g>
          {/* sternum highlight */}
          <path d="M102,114 L102,135" fill="none" stroke="#fffdf8" strokeWidth={1} strokeLinecap="round" opacity="0.8" />
          {/* nipples + areola */}
          <g>
            <circle cx={78} cy={132} r={5.5} fill={AREOLA} />
            <circle cx={122} cy={132} r={5.5} fill={AREOLA} />
            <circle cx={78} cy={132} r={2.3} fill={NIPPLE} />
            <circle cx={122} cy={132} r={2.3} fill={NIPPLE} />
          </g>
        </>
      ) : (
        <>
          {/* trapezius + scapular volume shading */}
          <ellipse cx={100} cy={118} rx={32} ry={26} fill={`url(#pec-${uid})`} />
          <ellipse cx={40} cy={135} rx={12} ry={20} fill={`url(#pec-${uid})`} />
          <ellipse cx={160} cy={135} rx={12} ry={20} fill={`url(#pec-${uid})`} />

          <g fill="none" stroke={LINE} strokeLinecap="round">
            {/* spine groove */}
            <path d="M100,104 L100,190" strokeWidth={2} />
            {/* upper trapezius (nape → shoulders) */}
            <path d="M100,105 C110,111 120,117 130,123" strokeWidth={1.5} />
            <path d="M100,105 C90,111 80,117 70,123" strokeWidth={1.5} />
            {/* scapular (shoulder-blade) medial borders */}
            <path d="M82,127 C76,141 80,159 94,155" strokeWidth={1.6} />
            <path d="M118,127 C124,141 120,159 106,155" strokeWidth={1.6} />
            {/* deltoid separation */}
            <path d="M47,122 C41,134 43,146 52,153" strokeWidth={1.5} />
            <path d="M153,122 C159,134 157,146 148,153" strokeWidth={1.5} />
          </g>
          {/* spine highlight */}
          <path d="M102,108 L102,186" fill="none" stroke="#fffdf8" strokeWidth={1} strokeLinecap="round" opacity="0.6" />
        </>
      )}
    </g>
  )
}

/* ---------------- pads ---------------- */

/**
 * Triangular OneStep CPR-feedback pad — rounded "pick" shape with the raised
 * compression-sensor puck (target cross-hair) and a red connector tab.
 * Drawn centred on (0,0); ~46×44 in local units.
 */
export function TrianglePadArt({ uid = 'tri' }) {
  return (
    <g>
      <defs>
        <linearGradient id={`gel-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef1f4" />
          <stop offset="1" stopColor="#c9ced5" />
        </linearGradient>
        <radialGradient id={`puck-${uid}`} cx="0.42" cy="0.34" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#e9edf1" />
          <stop offset="1" stopColor="#cdd3da" />
        </radialGradient>
        <filter id={`sh-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.6" stdDeviation="0.9" floodColor="#33404f" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* connector tab (behind, at the apex) */}
      <rect x={-4.5} y={15} width={9} height={8} rx={2.5} fill="#d64535" stroke="#ad3629" strokeWidth={0.8} />

      {/* rounded-triangle gel body */}
      <path
        d="M-13,-16 L13,-16 Q20.5,-16 17,-8.5 L4,15 Q0,21 -4,15 L-17,-8.5 Q-20.5,-16 -13,-16 Z"
        fill={`url(#gel-${uid})`} stroke="#8f97a1" strokeWidth={1.2} strokeLinejoin="round"
      />
      {/* inner bevel highlight */}
      <path
        d="M-11,-13 L11,-13 Q16,-13 13.5,-8 L3,11 Q0,15.5 -3,11 L-13.5,-8 Q-16,-13 -11,-13 Z"
        fill="none" stroke="#ffffff" strokeWidth={0.9} strokeLinejoin="round" opacity="0.6"
      />

      {/* CPR compression-sensor puck (raised) */}
      <g filter={`url(#sh-${uid})`}>
        <ellipse cx={0} cy={-3.5} rx={9.5} ry={8.8} fill={`url(#puck-${uid})`} stroke="#9aa2ac" strokeWidth={1.1} />
      </g>
      <ellipse cx={0} cy={-3.5} rx={6.4} ry={5.9} fill="none" stroke="#b9c0c9" strokeWidth={0.9} />
      {/* target cross-hair */}
      <g stroke="#c0453f" strokeWidth={1.5} strokeLinecap="round">
        <line x1={-7.5} y1={-3.5} x2={7.5} y2={-3.5} />
        <line x1={0} y1={-11.5} x2={0} y2={4.5} />
      </g>
      <circle cx={0} cy={-3.5} r={1.5} fill="#c0453f" />
    </g>
  )
}

/**
 * Rectangular standard defibrillation gel pad — gel body with perforation dots,
 * inner bevel and a red connector tab. Drawn centred on (0,0); ~28×36.
 */
export function RectanglePadArt({ uid = 'rect' }) {
  const W = 27, H = 35
  const cols = [-7, 0, 7]
  const rows = [-12, -6, 0, 6, 12]
  return (
    <g>
      <defs>
        <linearGradient id={`gelr-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef1f4" />
          <stop offset="1" stopColor="#c9ced5" />
        </linearGradient>
      </defs>
      {/* connector tab */}
      <rect x={-4.5} y={H / 2 - 2} width={9} height={8} rx={2.5} fill="#d64535" stroke="#ad3629" strokeWidth={0.8} />
      {/* gel body */}
      <rect x={-(W / 2)} y={-(H / 2)} width={W} height={H} rx={7.5} fill={`url(#gelr-${uid})`} stroke="#8f97a1" strokeWidth={1.2} />
      {/* inner bevel */}
      <rect x={-(W / 2) + 3} y={-(H / 2) + 3} width={W - 6} height={H - 6} rx={5.5} fill="none" stroke="#ffffff" strokeWidth={0.9} opacity="0.6" />
      {/* perforation dots */}
      {rows.map((ry) => cols.map((cx) => (
        <circle key={`${ry}-${cx}`} cx={cx} cy={ry} r={1.25} fill="#aab0b8" opacity="0.75" />
      )))}
    </g>
  )
}
