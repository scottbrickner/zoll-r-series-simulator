import { useState } from 'react'
import { BLS_OPTIONS, BLS_SEQUENCE, getBlsStep } from '../../sync/guidedScenarios'

/**
 * BlsSurvey — Phase 3 of the guided arrest module: the BLS primary survey.
 *
 * The learner must select the correct actions IN ORDER:
 *   responsiveness → central (carotid) pulse → Code Blue → CPR
 * Options are shuffled and mixed with distractors. Out-of-order or wrong picks
 * are rejected with feedback and do not advance; completing the full sequence
 * unlocks the stage. Reports each attempt to `onEvent` (for the debrief) and
 * signals completion via `onComplete`.
 */
export default function BlsSurvey({ done, onStep, onEvent }) {
  // `done` is the ordered list of completed step ids (lifted to the runner so it
  // survives back/next navigation); onStep(id) appends one.
  const [flash, setFlash] = useState(null) // { tone: 'ok'|'warn'|'bad', text }
  const nextExpected = BLS_SEQUENCE[done.length] // undefined once complete
  const complete = done.length === BLS_SEQUENCE.length

  const pick = (opt) => {
    if (done.includes(opt.id)) return
    if (opt.kind === 'distractor') {
      setFlash({ tone: 'bad', text: opt.reject })
      onEvent?.({ type: 'bls_wrong', id: opt.id })
      return
    }
    if (opt.id !== nextExpected) {
      const want = getBlsStep(nextExpected)
      setFlash({ tone: 'warn', text: `Not yet — do "${want.label}" first.` })
      onEvent?.({ type: 'bls_out_of_order', id: opt.id, expected: nextExpected })
      return
    }
    setFlash({ tone: 'ok', text: opt.feedback })
    onEvent?.({ type: 'bls_correct', id: opt.id })
    onStep(opt.id)
  }

  return (
    <>
      <h2>BLS primary survey</h2>
      <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
        You are alone at the bedside. Work through the primary survey in the correct order — select each action as you would perform it.
      </p>

      {/* completed steps, in the order performed */}
      <ol style={{ margin: '0 0 1rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
        {done.map((id) => {
          const st = getBlsStep(id)
          return (
            <li key={id} style={{ color: '#256b2a' }}>
              <strong>{st.label}</strong> — <span className="muted">{st.feedback}</span>
            </li>
          )
        })}
      </ol>

      {!complete && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {BLS_OPTIONS.filter((o) => !done.includes(o.id)).map((o) => (
            <button
              key={o.id}
              className="btn"
              style={{ textAlign: 'left', padding: '10px 12px', height: 'auto', whiteSpace: 'normal', lineHeight: 1.4 }}
              onClick={() => pick(o)}
            >
              <strong>{o.label}</strong>
              {o.detail && <span className="muted" style={{ display: 'block', fontSize: '0.8rem' }}>{o.detail}</span>}
            </button>
          ))}
        </div>
      )}

      {flash && (
        <p role="status" className={`g-flash g-flash--${flash.tone}`}>{flash.text}</p>
      )}

      {complete && (
        <p role="status" className="g-flash g-flash--ok">
          Primary survey complete — CPR is underway. The crash cart has arrived; move to pad placement.
        </p>
      )}
    </>
  )
}
