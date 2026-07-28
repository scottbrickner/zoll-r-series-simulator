import { useState } from 'react'

/**
 * NurseCallouts — verbal-callout reminder buttons for the device stage.
 *
 * Real code-team communication is verbal (announcing a rhythm check, a pulse
 * check, clearing the patient) — these buttons don't gate anything on the
 * high-fidelity device (only "Clear" feeds the separate clear-before-shock
 * safety gate upstream); they're a trigger/reminder for what the learner
 * should say out loud to the team. Every press is logged (via onSay) so the
 * debrief can confirm CLEAR was announced before the shock was delivered.
 *
 * `rhythm`/`pulse`/`epi` are deliberate confounders — plausible-sounding but
 * not the required pre-shock callout. `pulse` and `epi` carry corrective
 * `feedback` text (shown when `feedback` is true, i.e. Practice/Guided mode —
 * silent in Validation, matching BlsSurvey/DecisionStage's convention).
 * `rhythm` has no feedback text; clicking it just clears any prior flash.
 */
const PHRASES = [
  { id: 'rhythm', text: '“Let’s check a rhythm”', correct: false },
  {
    id: 'pulse', text: '“Is there a pulse?”', correct: false,
    feedback: 'You already established pulselessness during the BLS survey — no need to check again here.',
  },
  {
    id: 'epi', text: '“Give 1mg of epi”', correct: false,
    feedback: 'Not the priority right now — consider a higher-priority intervention before this: confirm the rhythm and get the shock delivered first.',
  },
  {
    id: 'clear', text: '“I’m clear, you’re clear, oxygen clear, everybody clear!”', correct: true,
    feedback: 'Correct — always announce this before defibrillating.',
  },
]

export default function NurseCallouts({ onSay, feedback = true }) {
  const [said, setSaid] = useState({}) // id -> true once pressed at least once
  const [flash, setFlash] = useState(null) // { tone, text } | null

  const press = (p) => {
    setSaid((s) => ({ ...s, [p.id]: true }))
    onSay?.(p.id)
    if (!feedback) return
    setFlash(p.feedback ? { tone: p.correct ? 'ok' : 'bad', text: p.feedback } : null)
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.82rem' }}>
        Announce to the code team as you go — especially <strong>“Clear”</strong> before you press SHOCK:
      </p>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {PHRASES.map((p) => (
          <button
            key={p.id}
            className={`btn ${said[p.id] ? 'btn--primary' : ''}`}
            style={{ fontSize: '0.86rem' }}
            onClick={() => press(p)}
          >
            🗣️ {p.text}
          </button>
        ))}
      </div>
      {feedback && flash && (
        <p role="status" className={`g-flash g-flash--${flash.tone}`} style={{ marginTop: 8 }}>
          {flash.text}
        </p>
      )}
    </div>
  )
}
