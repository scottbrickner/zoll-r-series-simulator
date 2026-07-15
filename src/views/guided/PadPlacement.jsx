import { useState } from 'react'
import {
  PAD_TYPES, PAD_POSITIONS, getPadType, getPadPosition,
  isPadAllowed, isPlacementComplete, placementConfigName, padRejectReason,
} from '../../sync/guidedScenarios'

/**
 * PadPlacement — Phase 4 of the guided arrest module.
 *
 * The learner (1) picks a pad TYPE — the triangular OneStep CPR-feedback pad or
 * the rectangular standard pad — then (2) taps a body position. The CPR pad may
 * only go on the anterior chest (right upper / left anterior); the standard pad
 * only on the left lateral / posterior. Placing both types in an allowed
 * position completes the stage. `placement` ({triangle,rectangle}) and `passed`
 * are lifted to the runner so they survive back/next navigation.
 */
export default function PadPlacement({ placement, passed, onPlace, onReset, onPass, onEvent }) {
  const [selected, setSelected] = useState(null) // pad type "in hand"
  const [flash, setFlash] = useState(null) // { tone, text }

  const posOfType = (typeId) => placement[typeId]
  const typeAtPos = (posId) => PAD_TYPES.find((t) => placement[t.id] === posId)?.id || null

  const pickUp = (typeId) => {
    if (passed) return
    setSelected((s) => (s === typeId ? null : typeId))
    setFlash(null)
  }

  const place = (posId) => {
    if (passed) return
    if (!selected) { setFlash({ tone: 'warn', text: 'Pick up a pad first — choose the CPR-feedback or the standard pad.' }); return }
    const occupant = typeAtPos(posId)
    if (occupant && occupant !== selected) { setFlash({ tone: 'warn', text: 'That site is taken by the other pad — remove it or choose another site.' }); return }
    if (!isPadAllowed(selected, posId)) {
      setFlash({ tone: 'bad', text: padRejectReason(selected) })
      onEvent?.({ type: 'pads_wrong', pad: selected, pos: posId })
      return
    }
    const next = { ...placement, [selected]: posId }
    onPlace(next)
    onEvent?.({ type: 'pads_place', pad: selected, pos: posId })
    setSelected(null)
    if (isPlacementComplete(next)) {
      const config = placementConfigName(next)
      setFlash({ tone: 'ok', text: `Correct — ${config} placement. Pads are on; the ZOLL can now see the rhythm.` })
      onEvent?.({ type: 'pads_ok', config })
      onPass()
    } else {
      setFlash(null)
    }
  }

  const reset = () => { onReset(); setSelected(null); setFlash(null) }

  return (
    <>
      <h2>Pad placement</h2>
      <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
        The crash cart is here. <strong>Pick up a pad</strong>, then tap where it goes on the patient. Place both pads correctly to continue.
      </p>

      {/* pad tray */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        {PAD_TYPES.map((t) => {
          const at = posOfType(t.id)
          const isSel = selected === t.id
          return (
            <button
              key={t.id}
              className={`pad-tray-card ${isSel ? 'is-selected' : ''} ${at ? 'is-placed' : ''}`}
              disabled={passed}
              onClick={() => pickUp(t.id)}
            >
              <svg viewBox="-24 -24 48 48" width="46" height="46" aria-hidden="true">
                {t.id === 'triangle' ? <TrianglePadArt /> : <RectanglePadArt />}
              </svg>
              <span className="pad-tray-card__text">
                <strong>{t.label}</strong>
                <span className="muted" style={{ display: 'block', fontSize: '0.76rem' }}>
                  {at ? `Placed: ${getPadPosition(at).label}` : isSel ? 'In hand — tap a position' : `Allowed: ${t.allowed.map((p) => getPadPosition(p).label).join(' / ')}`}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(210px, 280px)', gap: 20, alignItems: 'start' }}>
        <PadFigure placement={placement} selected={selected} passed={passed} onPlace={place} />

        <div>
          <p className="muted" style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Positions</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            {PAD_POSITIONS.map((p) => {
              const occ = typeAtPos(p.id)
              return (
                <li key={p.id}>
                  <button
                    className={`btn ${occ ? 'btn--primary' : ''}`}
                    disabled={passed}
                    style={{ width: '100%', textAlign: 'left', padding: '7px 10px', height: 'auto', whiteSpace: 'normal', lineHeight: 1.35 }}
                    onClick={() => place(p.id)}
                  >
                    <strong>{p.n}. {p.label}</strong>
                    <span className="muted" style={{ display: 'block', fontSize: '0.78rem' }}>
                      {occ ? `${getPadType(occ).short} placed` : p.sub}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {(placement.triangle || placement.rectangle) && !passed && (
            <button className="btn btn--ghost" style={{ marginTop: 8, fontSize: '0.82rem' }} onClick={reset}>Reset pads</button>
          )}
        </div>
      </div>

      {flash && <p role="status" className={`g-flash g-flash--${flash.tone}`}>{flash.text}</p>}
    </>
  )
}

/* ---------------- figure ---------------- */

function PadFigure({ placement, selected, passed, onPlace }) {
  const typeAtPos = (posId) => PAD_TYPES.find((t) => placement[t.id] === posId)?.id || null
  return (
    <svg viewBox="0 0 500 350" width="100%" style={{ maxWidth: 500, background: '#fffdfa', borderRadius: 14, border: '1px solid #e7e2da' }} role="group" aria-label="Mannequin pad placement">
      <Torso x={12} view="front" />
      <Torso x={262} view="back" />

      {PAD_POSITIONS.map((p) => (
        <PadZone
          key={p.id}
          pos={p}
          placedType={typeAtPos(p.id)}
          armed={!!selected && !passed}
          passed={passed}
          onPlace={onPlace}
        />
      ))}
    </svg>
  )
}

/**
 * Anatomical upper-body illustration with sternal delineation and nipple/areola
 * detail (so the anterior placement sites read clearly).
 */
function Torso({ x, view }) {
  const OUTLINE = '#8a7f6d' // body outline
  const LINE = '#b3a794' // primary anatomical detail (clavicle, sternum, pecs)
  const FAINT = '#ccc3b2' // secondary shading
  const FILL = '#fdfbf7'
  const HAIR = '#b09a7d'
  const AREOLA = '#d7b9a3'
  const NIPPLE = '#a07f68'

  // Upper-body silhouette (neck → sloped shoulders → arms → tapered torso).
  const body =
    'M86,58 C83,69 80,74 73,80 C62,87 50,91 41,101 C33,110 30,120 30,132 L31,208 ' +
    'C31,219 40,225 51,220 C59,216 61,206 62,193 C63,177 64,165 66,153 ' +
    'C68,183 74,221 82,253 C86,266 114,266 118,253 C126,221 132,183 134,153 ' +
    'C136,165 137,177 138,193 C139,206 141,216 149,220 C160,225 169,219 169,208 ' +
    'L170,132 C170,120 167,110 159,101 C150,91 138,87 127,80 C120,74 117,69 114,58 Z'

  return (
    <g transform={`translate(${x},22)`}>
      <text x={100} y={-4} textAnchor="middle" fill="#5b5750" fontSize="13" fontWeight="700">
        {view === 'front' ? 'Anterior (front)' : 'Posterior (back)'}
      </text>

      {/* hair */}
      {view === 'back'
        ? <path d="M70,33 C70,12 130,12 130,33 C130,49 124,57 115,60 L85,60 C76,57 70,49 70,33 Z" fill={HAIR} />
        : <path d="M73,29 C76,11 124,11 127,29 C117,19 83,19 73,29 Z" fill={HAIR} />}
      {/* neck (with trapezius sweep into shoulders) */}
      <path d="M87,53 C87,64 85,72 82,79 L118,79 C115,72 113,64 113,53 Z" fill={FILL} stroke={OUTLINE} strokeWidth={1.5} />
      {/* head */}
      <circle cx={100} cy={34} r={24} fill={FILL} stroke={OUTLINE} strokeWidth={1.7} />
      {/* body */}
      <path d={body} fill={FILL} stroke={OUTLINE} strokeWidth={1.9} strokeLinejoin="round" />

      {view === 'front' ? (
        <>
          {/* clavicles */}
          <g fill="none" stroke={LINE} strokeWidth={1.7} strokeLinecap="round">
            <path d="M99,71 C89,72 79,77 67,86" />
            <path d="M101,71 C111,72 121,77 133,86" />
          </g>
          {/* sternum delineation (manubrium notch → xiphoid) */}
          <path d="M100,73 L100,151" fill="none" stroke={LINE} strokeWidth={2} strokeLinecap="round" />
          {/* pectoral lower borders (define the two pec masses) */}
          <g fill="none" stroke={LINE} strokeWidth={1.6} strokeLinecap="round">
            <path d="M60,116 C70,146 88,150 99,143" />
            <path d="M140,116 C130,146 112,150 101,143" />
          </g>
          {/* costal margin + linea alba (below the sternum) */}
          <g fill="none" stroke={FAINT} strokeWidth={1.4} strokeLinecap="round">
            <path d="M100,151 C92,161 85,165 78,167" />
            <path d="M100,151 C108,161 115,165 122,167" />
            <path d="M100,151 L100,190" />
          </g>
          {/* nipples + areola (placement landmarks) */}
          <g>
            <circle cx={74} cy={130} r={6} fill={AREOLA} />
            <circle cx={126} cy={130} r={6} fill={AREOLA} />
            <circle cx={74} cy={130} r={2.4} fill={NIPPLE} />
            <circle cx={126} cy={130} r={2.4} fill={NIPPLE} />
          </g>
        </>
      ) : (
        <>
          {/* spine groove */}
          <path d="M100,66 L100,250" fill="none" stroke={LINE} strokeWidth={2} strokeLinecap="round" />
          <g fill="none" stroke={LINE} strokeWidth={1.6} strokeLinecap="round">
            {/* scapular (shoulder-blade) borders */}
            <path d="M73,90 C66,113 73,135 91,128" />
            <path d="M127,90 C134,113 127,135 109,128" />
            {/* trapezius sweep from the neck */}
            <path d="M83,61 C88,77 92,85 100,87" />
            <path d="M117,61 C112,77 108,85 100,87" />
          </g>
          {/* lower-back crease */}
          <path d="M79,235 C89,245 111,245 121,235" fill="none" stroke={FAINT} strokeWidth={1.4} strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

/** A body position: dashed numbered target when empty, the pad art when filled. */
function PadZone({ pos, placedType, armed, passed, onPlace }) {
  return (
    <g
      className={`pad-zone ${armed ? 'is-armed' : ''}`}
      transform={`translate(${pos.cx},${pos.cy})`}
      onClick={() => onPlace(pos.id)}
      style={{ cursor: passed ? 'default' : 'pointer' }}
      role="button"
      aria-label={`${pos.label}${placedType ? ' (pad placed)' : ''}`}
    >
      {placedType ? (
        <g>
          <circle r={24} fill="none" stroke="rgba(153,0,0,0.4)" strokeWidth={2} />
          {placedType === 'triangle' ? <TrianglePadArt /> : <RectanglePadArt />}
        </g>
      ) : (
        <g className="pad-target">
          <circle r={12} fill="rgba(153,0,0,0.05)" stroke="#b9723f" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#a2622f" fontWeight="700">{pos.n}</text>
        </g>
      )}
    </g>
  )
}

/* ---------------- pad artwork (shared by tray + figure) ---------------- */

/** Triangular OneStep CPR-feedback pad with the compression-sensor puck. */
function TrianglePadArt() {
  return (
    <g>
      <path
        d="M-11,-15 L11,-15 Q18,-15 15,-8 L4,15 Q0,21 -4,15 L-15,-8 Q-18,-15 -11,-15 Z"
        fill="#c6cad0" stroke="#8f97a1" strokeWidth={1.2} strokeLinejoin="round"
      />
      {/* connector tab */}
      <rect x={-4} y={16} width={8} height={7} rx={2} fill="#d64535" stroke="#b23a2c" strokeWidth={0.7} />
      {/* CPR compression sensor puck */}
      <ellipse cx={0} cy={-3} rx={8.5} ry={9.5} fill="#eef1f4" stroke="#9aa2ac" strokeWidth={1.1} />
      <g stroke="#d64535" strokeWidth={1.4} strokeLinecap="round">
        <line x1={-6} y1={-3} x2={6} y2={-3} />
        <line x1={0} y1={-11} x2={0} y2={5} />
      </g>
    </g>
  )
}

/** Rectangular standard defibrillation gel pad. */
function RectanglePadArt() {
  const W = 26, H = 34
  const cols = [-7, 0, 7]
  const rows = [-11, -5.5, 0, 5.5, 11]
  return (
    <g>
      <rect x={-4} y={H / 2 - 2} width={8} height={7} rx={2} fill="#d64535" stroke="#b23a2c" strokeWidth={0.7} />
      <rect x={-(W / 2)} y={-(H / 2)} width={W} height={H} rx={7} fill="#c6cad0" stroke="#8f97a1" strokeWidth={1.2} />
      <rect x={-(W / 2) + 3} y={-(H / 2) + 3} width={W - 6} height={H - 6} rx={5} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      {rows.map((ry) => cols.map((cx) => (
        <circle key={`${ry}-${cx}`} cx={cx} cy={ry} r={1.2} fill="rgba(255,255,255,0.7)" />
      )))}
    </g>
  )
}
