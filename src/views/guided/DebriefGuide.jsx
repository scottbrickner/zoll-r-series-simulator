/**
 * DebriefGuide — the structured verbal-debrief script for the SME running this
 * session, adapted from the Annual Skills facilitator blueprint (Gather →
 * Analyze → Summarize). It's a conversation aid, not scored content — the
 * learner's actual performance is the ScoreRow checklist above it.
 */
export default function DebriefGuide({ level }) {
  return (
    <details style={{ marginTop: '1rem', border: '1px solid #e7e2da', borderRadius: 12, padding: '0.7rem 1.1rem', background: '#fffdf7' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Facilitator debrief guide</summary>
      <p className="muted" style={{ marginTop: '0.6rem', marginBottom: '0.9rem' }}>
        Run a short, structured debrief. Lead with the learner's own read, reinforce what met standard, and target one or two gaps — don't re-teach the whole algorithm.
      </p>

      <h4 style={{ margin: '0 0 4px' }}>Gather — learner first</h4>
      <ul className="muted" style={{ margin: '0 0 0.8rem', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
        <li>"Walk me through what you did from the moment you found the patient."</li>
        <li>"How did it feel — what were you confident about, what felt shaky?"</li>
      </ul>

      <h4 style={{ margin: '0 0 4px' }}>Analyze — target the high-yield points</h4>
      <ul className="muted" style={{ margin: '0 0 0.8rem', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
        <li>Time to first shock — what helped or delayed it?</li>
        <li>What did you do the instant the shock was delivered, and why does that order matter?</li>
        <li>Talk me through your pad placement and how you cleared before shocking.</li>
        <li>{level === 'ACLS'
          ? 'How did you know the rhythm was shockable, and how did you pick the energy?'
          : 'Why hands off during ANALYZE?'}</li>
        <li>At the device: what does a red Code Readiness X mean, and what would you do about it before your shift?</li>
      </ul>

      <h4 style={{ margin: '0 0 4px' }}>Summarize — learner restates</h4>
      <ul className="muted" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
        <li>"Name one thing you'll keep doing and one thing you'll change next time."</li>
      </ul>
    </details>
  )
}
