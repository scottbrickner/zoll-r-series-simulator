import { useState } from 'react'

/**
 * DecisionStage — Phase 6a of the guided arrest module: the immediate post-shock
 * decision. The correct action is to resume compressions right away (no rhythm
 * or pulse check). Picking the correct action reveals the FIL-lead / EtCO₂
 * teaching points and unlocks the stage; wrong picks give corrective feedback.
 */
const DECISIONS = [
  {
    id: 'rhythm', correct: false,
    label: 'Stop and check the rhythm on the monitor',
    feedback:
      'Not yet — don’t interrupt compressions to read the rhythm right after the shock. Resume CPR; the FIL (filtered) lead lets you glimpse the underlying rhythm during compressions without stopping.',
  },
  {
    id: 'cpr', correct: true,
    label: 'Resume CPR immediately (2-minute cycle)',
    feedback:
      'Correct — resume high-quality compressions immediately. Do not pause for a rhythm or pulse check right after the shock; reassess at the end of the 2-minute cycle.',
  },
  {
    id: 'pulse', correct: false,
    label: 'Stop and check for a pulse',
    feedback:
      'Not yet — a pulse check right after the shock wastes compression time. Resume CPR and reassess the pulse/rhythm at the next 2-minute cycle.',
  },
]

export default function DecisionStage({ done, onCorrect, onEvent }) {
  const [flash, setFlash] = useState(null) // { tone, text }

  const pick = (d) => {
    if (done) return
    setFlash({ tone: d.correct ? 'ok' : 'bad', text: d.feedback })
    onEvent?.({ type: d.correct ? 'decision_ok' : 'decision_wrong', id: d.id })
    if (d.correct) onCorrect()
  }

  return (
    <>
      <h2>Immediately after the shock</h2>
      <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
        The shock is delivered. <strong>What is your immediate next action?</strong>
      </p>

      {!done && (
        <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
          {DECISIONS.map((d) => (
            <button
              key={d.id}
              className="btn"
              style={{ textAlign: 'left', padding: '10px 12px', height: 'auto', whiteSpace: 'normal', lineHeight: 1.4 }}
              onClick={() => pick(d)}
            >
              <strong>{d.label}</strong>
            </button>
          ))}
        </div>
      )}

      {flash && <p role="status" className={`g-flash g-flash--${flash.tone}`}>{flash.text}</p>}

      {done && (
        <div className="g-flash g-flash--ok" role="status" style={{ marginTop: '1rem' }}>
          <strong>CPR resumed.</strong> Two adjuncts worth noting:
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
            <li>The <strong>FIL (filtered) lead</strong> reveals the underlying rhythm through the CPR artifact — so you can see what you’re treating without stopping compressions.</li>
            <li>Initiate <strong>EtCO₂ (capnography)</strong> — it gauges CPR quality (target &gt; 10–20 mmHg) and flags ROSC as a sudden sustained rise, again without pausing compressions.</li>
          </ul>
        </div>
      )}
    </>
  )
}
