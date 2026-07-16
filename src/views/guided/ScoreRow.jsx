/**
 * ScoreRow — one line of the debrief's scored checklist.
 *
 * `tone` drives both a colored dot and a text tag (never color alone):
 *   'good'  — green  · did it correctly
 *   'coach' — amber  · okay, but a coaching opportunity
 *   'bad'   — red    · did not do this / needs correction
 */
const TAG = { good: 'Good', coach: 'Coach', bad: 'Review' }

export default function ScoreRow({ tone, title, children }) {
  return (
    <div className={`score-row score-row--${tone}`}>
      <span className={`score-row__dot score-row__dot--${tone}`} aria-hidden="true">●</span>
      <span>
        <span className={`score-row__tag score-row__tag--${tone}`}>{TAG[tone]}</span>{' '}
        <strong>{title}</strong>
        {children != null && <> — {children}</>}
      </span>
    </div>
  )
}
