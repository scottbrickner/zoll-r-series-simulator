import { useState } from 'react'

/**
 * SelfTestWalkthrough — the debrief's educational (non-scored) walkthrough of the
 * MANUAL defibrillator self-test on the crash cart. It's here because staff often
 * rely only on the OneStep pad auto-self-test and never learn the manual check.
 * A simple reveal-stepper; not part of the validation score.
 */
const STEPS = [
  'Plug the defibrillation test cable / connector into the side TEST port.',
  'Turn the mode selector to DEFIB.',
  'Set the energy to 30 J.',
  'Press CHARGE and wait for the ready tone.',
  'Press SHOCK to discharge into the internal test load.',
  'Confirm the display reads “TEST OK” — the manual self-test has passed.',
]

export default function SelfTestWalkthrough() {
  const [shown, setShown] = useState(1) // steps revealed so far
  const done = shown >= STEPS.length

  return (
    <section style={{ marginTop: '1.25rem', border: '1px solid #e7e2da', borderRadius: 12, padding: '1rem 1.1rem', background: '#fffdf7' }}>
      <h3 style={{ margin: '0 0 0.3rem' }}>Manual defibrillator self-test <span className="muted" style={{ fontWeight: 400 }}>· educational, not scored</span></h3>
      <p className="muted" style={{ marginTop: 0, lineHeight: 1.55 }}>
        The OneStep pads run an auto-self-test, but you should also know the <strong>manual</strong> self-test for the crash-cart defibrillator. Walk through it:
      </p>

      <ol style={{ margin: '0 0 0.8rem', paddingLeft: '1.3rem', lineHeight: 1.7 }}>
        {STEPS.slice(0, shown).map((s, i) => (
          <li key={i} style={{ color: i === STEPS.length - 1 ? '#256b2a' : undefined, fontWeight: i === STEPS.length - 1 ? 600 : 400 }}>{s}</li>
        ))}
      </ol>

      {!done ? (
        <button className="btn btn--primary" onClick={() => setShown((n) => Math.min(STEPS.length, n + 1))}>Next step ▸</button>
      ) : (
        <p role="status" className="g-flash g-flash--ok" style={{ margin: 0 }}>
          ✓ Self-test complete. Run this manual check per your unit’s schedule — don’t rely on the pad auto-test alone.
        </p>
      )}
    </section>
  )
}
