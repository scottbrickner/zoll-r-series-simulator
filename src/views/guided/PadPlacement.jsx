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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(240px, 320px)', gap: 20, alignItems: 'start' }}>
        <PadFigure ids={ids} passed={passed} onToggle={toggle} />

        <div>
          <p className="muted" style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>Placement zones</p>
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

          <p className="muted" style={{ margin: '0.9rem 0 0.3rem', fontSize: '0.8rem' }}>
            Valid configurations
          </p>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', lineHeight: 1.5 }}>
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

      {flash && (
        <p
          role="status"
          style={{
            marginTop: '1rem', padding: '8px 12px', borderRadius: 8,
            background: flash.tone === 'ok' ? '#1d3a28' : flash.tone === 'warn' ? '#3a3320' : '#3a2020',
            color: flash.tone === 'ok' ? '#8fe3ab' : flash.tone === 'warn' ? '#e6d08a' : '#e79a9a',
            border: `1px solid ${flash.tone === 'ok' ? '#2f6b45' : flash.tone === 'warn' ? '#6b5e2f' : '#6b2f2f'}`,
          }}
        >
          {flash.text}
        </p>
      )}
    </>
  )
}

/** Two schematic torsos (anterior + posterior) with numbered, clickable zones. */
function PadFigure({ ids, passed, onToggle }) {
  return (
    <svg viewBox="0 0 440 300" width="100%" style={{ maxWidth: 460, background: '#12161c', borderRadius: 12, border: '1px solid #262c35' }} role="group" aria-label="Mannequin pad placement">
      {[{ x: 0, label: 'Anterior (front)' }, { x: 220, label: 'Posterior (back)' }].map((fig) => (
        <g key={fig.x} transform={`translate(${fig.x},0)`}>
          <text x={110} y={22} textAnchor="middle" fill="#8b95a3" fontSize="12" fontWeight="600">{fig.label}</text>
          {/* body: head + torso + arms */}
          <g fill="#2a323d" stroke="#3a434f" strokeWidth="1.5">
            <circle cx="110" cy="52" r="18" />
            <rect x="66" y="74" width="88" height="132" rx="26" />
            <rect x="46" y="82" width="15" height="104" rx="7" />
            <rect x="159" y="82" width="15" height="104" rx="7" />
          </g>
        </g>
      ))}

      {/* zones */}
      {PAD_ZONES.map((z) => {
        const on = ids.includes(z.id)
        return (
          <g
            key={z.id}
            transform={`translate(${z.cx},${z.cy})`}
            onClick={() => onToggle(z.id)}
            style={{ cursor: passed ? 'default' : 'pointer' }}
            role="button"
            aria-label={`${z.label}${on ? ' (pad placed)' : ''}`}
          >
            {on ? (
              <>
                <rect x="-15" y="-15" width="30" height="30" rx="7" fill="#1f6f43" stroke="#48d68a" strokeWidth="2" />
                <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#d8ffe8" fontWeight="700">✓</text>
              </>
            ) : (
              <>
                <circle r="13" fill="rgba(90,150,240,0.14)" stroke="#5a96f0" strokeWidth="1.6" strokeDasharray="3 3" />
                <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#9fc0f2" fontWeight="700">{z.n}</text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
