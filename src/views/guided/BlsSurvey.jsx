import { useState } from 'react'
import { BLS_OPTIONS, BLS_SEQUENCE, getBlsStep } from '../../sync/guidedScenarios'

/**
 * BlsSurvey — Phase 3 of the guided arrest module: the BLS primary survey.
 *
 * The learner selects the correct actions IN ORDER: responsiveness → central
 * (carotid) pulse → Code Blue → CPR. Options are shuffled and mixed with
 * distractors.
 *
 * `feedback=true` (Practice/Guided sessions): out-of-order or wrong picks are
 * rejected with corrective text and don't advance — the learner must find the
 * correct next step to proceed. `feedback=false` (Validation sessions): any
 * pick is accepted immediately (no rejection, no explanation) and silently
 * logged for the debrief — the sequence is graded, not coached, matching
 * PadPlacement's existing no-feedback mode. Either way, `onEvent` gets the
 * same `bls_correct`/`bls_wrong`/`bls_out_of_order` events the debrief scores.
 */
export default function BlsSurvey({ done, feedback = true, onStep, onEvent }) {
  // `done` is the ordered list of completed step ids (lifted to the runner so it
  // survives back/next navigation); onStep(id) appends one.
  const [flash, setFlash] = useState(null) // { tone: 'ok'|'warn'|'bad', text }
  const [attempted, setAttempted] = useState([]) // distractors tried, no-feedback mode only
  const nextExpected = BLS_SEQUENCE[done.length] // undefined once complete
  const complete = done.length === BLS_SEQUENCE.length

  const pick = (opt) => {
    if (done.includes(opt.id) || attempted.includes(opt.id)) return
    if (opt.kind === 'distractor') {
      onEvent?.({ type: 'bls_wrong', id: opt.id })
      if (!feedback) { setAttempted((a) => [...a, opt.id]); return }
      setFlash({ tone: 'bad', text: opt.reject })
      return
    }
    if (!feedback) {
      // Always log bls_correct (by id) so id-specific consumers — e.g. the time-to-shock
      // clock starting on the "pulse" step — fire regardless of order; log bls_out_of_order
      // too when it doesn't match the sequence, so the debrief still counts the misstep.
      if (opt.id !== nextExpected) onEvent?.({ type: 'bls_out_of_order', id: opt.id, expected: nextExpected })
      onEvent?.({ type: 'bls_correct', id: opt.id })
      onStep(opt.id)
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
        You are alone at the bedside. Work through the primary survey{feedback ? ' in the correct order' : ''} — select each action as you would perform it.
      </p>

      {/* completed steps, in the order performed */}
      <ol style={{ margin: '0 0 1rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
        {done.map((id) => {
          const st = getBlsStep(id)
          return (
            <li key={id} style={feedback ? { color: '#256b2a' } : undefined}>
              <strong>{st.label}</strong>{feedback && <> — <span className="muted">{st.feedback}</span></>}
            </li>
          )
        })}
      </ol>

      {!complete && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {BLS_OPTIONS.filter((o) => !done.includes(o.id) && !attempted.includes(o.id)).map((o) => (
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

      {feedback && flash && (
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
