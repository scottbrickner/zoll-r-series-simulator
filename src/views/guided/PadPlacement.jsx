import { useState } from 'react'
import { PAD_ZONES, PAD_CONFIGS, getPadZone, validatePads } from '../../sync/guidedScenarios'

/**
 * PadPlacement — Phase 4 of the guided arrest module.
 *
 * The learner places exactly two defib pads on a two-view mannequin (front /
 * back) by clicking placement zones (or the legend rows). Confirm validates the
 * pair: a valid anterolateral or anterior–posterior configuration passes and
 * unlocks the stage; anything else is rejected with feedback. State (`ids`,
 * `passed`) is lifted to the runner so it survives back/next navigation.
 */
export default function PadPlacement({ ids, passed, onToggle, onPass, onEvent }) {
  const [flash, setFlash] = useState(null) // { tone, text }

  const toggle = (id) => {
    if (passed) return
    if (ids.includes(id)) { onToggle(id); setFlash(null); return }
    if (ids.length >= 2) { setFlash({ tone: 'warn', text: 'Only two pads — remove one first.' }); return }
    onToggle(id)
    setFlash(null)
  }

  const confirm = () => {
    const res = validatePads(ids)
    if (res.ok) {
      setFlash({ tone: 'ok', text: `Correct — ${res.config} placement. Pads are on; the ZOLL can now see the rhythm.` })
      onEvent?.({ type: 'pads_ok', ids: [...ids], config: res.config })
      onPass()
    } else {
      setFlash({ tone: 'bad', text: res.reason })
      onEvent?.({ type: 'pads_wrong', ids: [...ids] })
    }
  }

  return (
    <>
      <h2>Pad placement</h2>
      <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
        The crash cart is here. Apply the OneStep defibrillation pads — place <strong>two</strong> pads in a valid
        configuration, then confirm.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(230px, 300px)', gap: 20, alignItems: 'start' }}>
        <PadFigure ids={ids} passed={passed} onToggle={toggle} />

        <div>
          <p className="muted" style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Placement zones</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            {PAD_ZONES.map((z) => {
              const on = ids.includes(z.id)
              return (
                <li key={z.id}>
                  <button
                    className={`btn ${on ? 'btn--primary' : ''}`}
                    disabled={passed}
                    style={{ width: '100%', textAlign: 'left', padding: '7px 10px', height: 'auto', whiteSpace: 'normal', lineHeight: 1.35 }}
                    onClick={() => toggle(z.id)}
                  >
                    <strong>{z.n}. {z.label}</strong>
                    <span className="muted" style={{ display: 'block', fontSize: '0.78rem' }}>{z.sub}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="muted" style={{ margin: '0.9rem 0 0.3rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Valid configurations</p>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', lineHeight: 1.55 }}>
            {PAD_CONFIGS.map((c, i) => (
              <li key={i}>{c.name}: {c.pads.map((p) => getPadZone(p).label).join(' + ')}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="row" style={{ marginTop: '1rem' }}>
        <button className="btn btn--primary" disabled={ids.length !== 2 || passed} onClick={confirm}>Confirm placement</button>
        <span className="muted" style={{ alignSelf: 'center' }}>{ids.length}/2 pads placed</span>
      </div>

      {flash && <p role="status" className={`g-flash g-flash--${flash.tone}`}>{flash.text}</p>}
    </>
  )
}

/* ---------------- figure ---------------- */

/** Two anatomical torsos (anterior + posterior) with clickable pad zones. */
function PadFigure({ ids, passed, onToggle }) {
  return (
    <svg viewBox="0 0 460 340" width="100%" style={{ maxWidth: 480, background: '#fffdfa', borderRadius: 14, border: '1px solid #e7e2da' }} role="group" aria-label="Mannequin pad placement">
      <Torso x={10} view="front" />
      <Torso x={250} view="back" />

      {PAD_ZONES.map((z) => (
        <PadZone
          key={z.id}
          zone={z}
          placed={ids.includes(z.id)}
          passed={passed}
          onToggle={onToggle}
        />
      ))}
    </svg>
  )
}

/** One anatomical upper-body silhouette with light interior detail lines. */
function Torso({ x, view }) {
  const OUTLINE = '#a89e8f'
  const DETAIL = '#d3ccbf'
  const FILL = '#fdfcfa'
  const silhouette =
    'M81,60 C78,72 66,74 52,86 C39,97 30,107 28,126 L25,206 C24,220 32,226 43,224 ' +
    'C53,222 57,212 58,196 C60,178 63,166 68,150 C72,180 76,224 80,258 C83,270 107,270 110,258 ' +
    'C114,224 118,180 122,150 C127,166 130,178 132,196 C133,212 137,222 147,224 C158,226 166,220 165,206 ' +
    'L162,126 C160,107 151,97 138,86 C124,74 112,72 109,60 Z'
  return (
    <g transform={`translate(${x},20)`}>
      <text x={95} y={-2} textAnchor="middle" fill="#5b5750" fontSize="12.5" fontWeight="700">
        {view === 'front' ? 'Anterior (front)' : 'Posterior (back)'}
      </text>

      {/* hair cap: fuller on the back of the head */}
      {view === 'back'
        ? <path d="M70,34 C70,16 120,16 120,34 C120,46 116,52 110,56 L80,56 C74,52 70,46 70,34 Z" fill="#cbb89c" />
        : <path d="M72,30 C74,16 116,16 118,30 C110,22 80,22 72,30 Z" fill="#cbb89c" />}
      <circle cx={95} cy={36} r={25} fill={FILL} stroke={OUTLINE} strokeWidth={1.6} />

      {/* body */}
      <path d={silhouette} fill={FILL} stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />

      {/* interior detail */}
      <g fill="none" stroke={DETAIL} strokeWidth={1.2} strokeLinecap="round">
        {view === 'front' ? (
          <>
            {/* clavicles */}
            <path d="M95,68 C82,72 72,78 62,86" />
            <path d="M95,68 C108,72 118,78 128,86" />
            {/* sternum */}
            <path d="M95,70 L95,150" />
            {/* pectoral folds */}
            <path d="M63,112 C74,132 86,134 95,128" />
            <path d="M127,112 C116,132 104,134 95,128" />
            {/* nipples */}
            <circle cx={75} cy={128} r={2.1} fill={DETAIL} stroke="none" />
            <circle cx={115} cy={128} r={2.1} fill={DETAIL} stroke="none" />
          </>
        ) : (
          <>
            {/* spine */}
            <path d="M95,66 L95,252" />
            {/* scapular borders */}
            <path d="M72,92 C66,112 72,132 86,126" />
            <path d="M118,92 C124,112 118,132 104,126" />
            {/* neck / trapezius */}
            <path d="M82,62 C86,76 90,84 95,86" />
            <path d="M108,62 C104,76 100,84 95,86" />
          </>
        )}
      </g>

      {/* heart guide (front): shows why the shock vector must cross it */}
      {view === 'front' && (
        <path
          d="M104,150 C104,150 78,131 78,112 C78,102 86,96 94,96 C100,96 104,101 104,104 C104,101 108,96 114,96 C122,96 130,102 130,112 C130,131 104,150 104,150 Z"
          fill="rgba(198,40,40,0.10)"
          stroke="rgba(178,45,45,0.4)"
          strokeWidth={1.2}
        />
      )}
    </g>
  )
}

/** A pad zone: a small dashed target when empty, a realistic gel pad when placed. */
function PadZone({ zone, placed, passed, onToggle }) {
  return (
    <g
      className="pad-zone"
      transform={`translate(${zone.cx},${zone.cy})`}
      onClick={() => onToggle(zone.id)}
      style={{ cursor: passed ? 'default' : 'pointer' }}
      role="button"
      aria-label={`${zone.label}${placed ? ' (pad placed)' : ''}`}
    >
      {placed ? <GelPad n={zone.n} /> : (
        <g className="pad-target">
          <circle r={11} fill="rgba(153,0,0,0.05)" stroke="#b9723f" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#a2622f" fontWeight="700">{zone.n}</text>
        </g>
      )}
    </g>
  )
}

/** A realistic OneStep gel electrode (dotted gel, red connector tab, numbered). */
function GelPad({ n }) {
  const W = 30, H = 40
  const cols = [-8, 0, 8]
  const rows = [-13, -6.5, 0, 6.5, 13]
  return (
    <g>
      {/* selected glow */}
      <rect x={-(W / 2) - 3} y={-(H / 2) - 3} width={W + 6} height={H + 6} rx={11} fill="none" stroke="rgba(153,0,0,0.45)" strokeWidth={2} />
      {/* connector tab */}
      <rect x={-5} y={H / 2 - 2} width={10} height={9} rx={2.5} fill="#d64535" stroke="#b23a2c" strokeWidth={0.8} />
      {/* gel body */}
      <rect x={-(W / 2)} y={-(H / 2)} width={W} height={H} rx={8} fill="#c6cad0" stroke="#8f97a1" strokeWidth={1.2} />
      <rect x={-(W / 2) + 3} y={-(H / 2) + 3} width={W - 6} height={H - 6} rx={6} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      {/* perforated gel dots */}
      {rows.map((ry) => cols.map((cx) => (
        <circle key={`${ry}-${cx}`} cx={cx} cy={ry} r={1.35} fill="rgba(255,255,255,0.7)" />
      )))}
      {/* number badge */}
      <circle cx={-(W / 2) + 6} cy={-(H / 2) + 6} r={7} fill="#990000" />
      <text x={-(W / 2) + 6} y={-(H / 2) + 6.5} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#fff" fontWeight="800">{n}</text>
    </g>
  )
}
