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
 * Anatomical upper body drawn in a local 200×290 box (call inside an <svg>,
 * positioned by the caller via `x`). Clean medical line-art with soft volume
 * shading, sternal delineation, defined pectorals and nipple/areola landmarks.
 */
export function Torso({ x = 0, view }) {
  const uid = view
  const OUTLINE = '#877a63'
  const LINE = '#a7997e'
  const FAINT = '#c7bca7'
  const HAIR = '#ad9578'
  const AREOLA = '#dcc0a8'
  const NIPPLE = '#a67f66'
  const SHADE = '#d8c7ac'

  // Silhouette: neck → rounded deltoids → upper arms held at the sides → chest,
  // tapering to a waist crop. Arms are short and full (not thin/long).
  const body =
    'M87,56 C86,66 84,72 80,77 C71,80 59,82 48,90 C37,98 30,110 29,123 ' +
    'C28,141 31,166 35,188 C37,199 42,207 50,208 C58,209 61,201 62,188 ' +
    'C63,167 63,150 64,137 C63,166 60,206 66,240 C70,252 130,252 134,240 ' +
    'C140,206 137,166 136,137 C137,150 137,167 138,188 C139,201 142,209 150,208 ' +
    'C158,207 163,199 165,188 C169,166 172,141 171,123 C170,110 163,98 152,90 ' +
    'C141,82 129,80 120,77 C116,72 114,66 113,56 Z'

  return (
    <g transform={`translate(${x},20)`}>
      <defs>
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fefdfa" />
          <stop offset="0.55" stopColor="#f8f0e4" />
          <stop offset="1" stopColor="#efe4d3" />
        </linearGradient>
        <radialGradient id={`pec-${uid}`} cx="0.5" cy="0.42" r="0.72">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.65" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor={SHADE} stopOpacity="0.32" />
        </radialGradient>
      </defs>

      <text x={100} y={4} textAnchor="middle" fill="#5b5750" fontSize="13" fontWeight="700">
        {view === 'front' ? 'Anterior (front)' : 'Posterior (back)'}
      </text>

      {/* hair */}
      {view === 'back'
        ? <path d="M70,33 C70,12 130,12 130,33 C130,49 124,57 115,60 L85,60 C76,57 70,49 70,33 Z" fill={HAIR} />
        : <path d="M73,29 C76,11 124,11 127,29 C117,19 83,19 73,29 Z" fill={HAIR} />}

      {/* neck */}
      <path d="M87,52 C87,64 85,72 82,79 L118,79 C115,72 113,64 113,52 Z" fill={`url(#skin-${uid})`} stroke={OUTLINE} strokeWidth={1.5} strokeLinejoin="round" />
      {/* neck shadow under the jaw */}
      <path d="M84,66 C90,74 110,74 116,66 C112,76 88,76 84,66 Z" fill={SHADE} opacity="0.4" />

      {/* head */}
      <circle cx={100} cy={34} r={24} fill={`url(#skin-${uid})`} stroke={OUTLINE} strokeWidth={1.7} />

      {/* body */}
      <path d={body} fill={`url(#skin-${uid})`} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />

      {view === 'front' ? (
        <>
          {/* pectoral volume (soft, flattened shading) */}
          <ellipse cx={77} cy={123} rx={27} ry={17} fill={`url(#pec-${uid})`} />
          <ellipse cx={123} cy={123} rx={27} ry={17} fill={`url(#pec-${uid})`} />

          {/* clavicles */}
          <g fill="none" stroke={LINE} strokeWidth={1.8} strokeLinecap="round">
            <path d="M99,70 C89,71 79,76 67,85" />
            <path d="M101,70 C111,71 121,76 133,85" />
          </g>
          {/* sternum groove + subtle highlight */}
          <path d="M100,72 L100,150" fill="none" stroke={LINE} strokeWidth={2.1} strokeLinecap="round" />
          <path d="M102,76 L102,146" fill="none" stroke="#fffdf8" strokeWidth={1} strokeLinecap="round" opacity="0.8" />
          {/* pectoral lower borders */}
          <g fill="none" stroke={LINE} strokeWidth={1.7} strokeLinecap="round">
            <path d="M58,116 C69,148 88,151 99,143" />
            <path d="M142,116 C131,148 112,151 101,143" />
          </g>
          {/* costal margin + linea alba */}
          <g fill="none" stroke={FAINT} strokeWidth={1.4} strokeLinecap="round">
            <path d="M100,150 C92,161 85,165 78,168" />
            <path d="M100,150 C108,161 115,165 122,168" />
            <path d="M100,150 L100,192" />
          </g>
          {/* nipples + areola */}
          <g>
            <circle cx={76} cy={130} r={6.2} fill={AREOLA} />
            <circle cx={124} cy={130} r={6.2} fill={AREOLA} />
            <circle cx={76} cy={130} r={2.5} fill={NIPPLE} />
            <circle cx={124} cy={130} r={2.5} fill={NIPPLE} />
          </g>
        </>
      ) : (
        <>
          {/* scapular volume */}
          <ellipse cx={75} cy={112} rx={20} ry={22} fill={`url(#pec-${uid})`} />
          <ellipse cx={125} cy={112} rx={20} ry={22} fill={`url(#pec-${uid})`} />
          {/* spine groove + highlight */}
          <path d="M100,66 L100,250" fill="none" stroke={LINE} strokeWidth={2.1} strokeLinecap="round" />
          <path d="M102,72 L102,244" fill="none" stroke="#fffdf8" strokeWidth={1} strokeLinecap="round" opacity="0.7" />
          <g fill="none" stroke={LINE} strokeWidth={1.7} strokeLinecap="round">
            {/* scapular (shoulder-blade) borders */}
            <path d="M72,90 C64,114 73,137 92,129" />
            <path d="M128,90 C136,114 127,137 108,129" />
            {/* trapezius */}
            <path d="M83,60 C88,77 92,85 100,88" />
            <path d="M117,60 C112,77 108,85 100,88" />
          </g>
          {/* lower-back crease */}
          <path d="M79,235 C89,245 111,245 121,235" fill="none" stroke={FAINT} strokeWidth={1.4} strokeLinecap="round" />
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
