import { useState } from 'react'

/**
 * NurseCallouts — verbal-callout reminder buttons for the device stage.
 *
 * Real code-team communication is verbal (announcing a rhythm check, a pulse
 * check, clearing the patient) — these buttons don't gate anything on the
 * high-fidelity device; they're a trigger/reminder for what the learner should
 * say out loud to the team, especially "Clear!" before pressing SHOCK. Each
 * press is logged (via onSay) so the debrief can confirm CLEAR was announced
 * before the shock was delivered.
 */
const PHRASES = [
  { id: 'rhythm', text: '“Let’s check a rhythm”' },
  { id: 'pulse', text: '“Is there a pulse?”' },
  { id: 'clear', text: '“Clear! Clear! Everybody clear!”' },
]

export default function NurseCallouts({ onSay }) {
  const [said, setSaid] = useState({}) // id -> true once pressed at least once

  const press = (id) => {
    setSaid((s) => ({ ...s, [id]: true }))
    onSay?.(id)
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
            onClick={() => press(p.id)}
          >
            🗣️ {p.text}
          </button>
        ))}
      </div>
    </div>
  )
}
