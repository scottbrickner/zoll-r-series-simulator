import { useState } from 'react'
import {
  PAD_TYPES, PAD_POSITIONS, getPadType, getPadPosition,
  isPadAllowed, isPlacementComplete, placementConfigName, padRejectReason, pairingRejectReason,
} from '../../sync/guidedScenarios'
import { Torso, TrianglePadArt, RectanglePadArt } from './padArt'

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
    if (next.triangle && next.rectangle) {
      // both pads placed — check that they form a valid pairing
      if (isPlacementComplete(next)) {
        const config = placementConfigName(next)
        setFlash({ tone: 'ok', text: `Correct — ${config} placement. Pads are on; the ZOLL can now see the rhythm.` })
        onEvent?.({ type: 'pads_ok', config })
        onPass()
      } else {
        setFlash({ tone: 'bad', text: pairingRejectReason() })
        onEvent?.({ type: 'pads_wrong', pad: selected, pos: posId, pairing: `${next.triangle}+${next.rectangle}` })
      }
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
                {t.id === 'triangle' ? <TrianglePadArt uid="tray-tri" /> : <RectanglePadArt uid="tray-rect" />}
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
          {placedType === 'triangle' ? <TrianglePadArt uid={pos.id} /> : <RectanglePadArt uid={pos.id} />}
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
