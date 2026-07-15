import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GUIDED_STAGES, SHOCK_CLOCK_STAGE, SHOCK_TARGET_S, BLS_SEQUENCE, getGuided, GUIDED_SCENARIO_IDS } from '../sync/guidedScenarios'
import SafetyLabel from '../components/SafetyLabel'
import BlsSurvey from './guided/BlsSurvey'

/**
 * GuidedScenario — the step-gated arrest validation runner (Phase 2 shell).
 *
 * Walks the learner through the arrest flow (intro → BLS survey → pad placement →
 * defibrillate → next action → debrief), with a level (BLS/ACLS) chosen up front and
 * a 2-minute time-to-shock clock that starts at rhythm identification. Stage bodies
 * are placeholders here; Phases 3–6 fill in the real interactive content.
 */
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function GuidedScenario() {
  const [params] = useSearchParams()
  const scenarioId = getGuided(params.get('scenario')) ? params.get('scenario') : GUIDED_SCENARIO_IDS[0]
  const sc = getGuided(scenarioId)

  const [stage, setStage] = useState(0)
  const [level, setLevel] = useState(null) // 'BLS' | 'ACLS'
  const [shockStart, setShockStart] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [blsDone, setBlsDone] = useState([]) // ordered ids completed in the BLS survey
  const [events, setEvents] = useState([]) // attempt log, feeds the debrief
  const tick = useRef(null)

  const stageId = GUIDED_STAGES[stage].id
  const logEvent = (e) => setEvents((v) => [...v, e])
  const blsComplete = blsDone.length === BLS_SEQUENCE.length

  // Start the time-to-shock clock when we reach the device stage (rhythm ID).
  useEffect(() => {
    if (stageId === SHOCK_CLOCK_STAGE && shockStart == null) setShockStart(Date.now())
  }, [stageId, shockStart])

  // Tick the clock display once the clock is running (and not yet at debrief).
  useEffect(() => {
    if (shockStart == null || stageId === 'debrief') return
    tick.current = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(tick.current)
  }, [shockStart, stageId])

  const elapsed = shockStart == null ? 0 : Math.max(0, (now - shockStart) / 1000)
  const overTarget = elapsed > SHOCK_TARGET_S

  const next = () => setStage((s) => Math.min(GUIDED_STAGES.length - 1, s + 1))
  const back = () => setStage((s) => Math.max(0, s - 1))
  const restart = () => { setStage(0); setLevel(null); setShockStart(null); setNow(Date.now()); setBlsDone([]); setEvents([]) }

  return (
    <div className="facilitator">
      <header className="facilitator__header">
        <div>
          <h1>{sc.title} — Guided Session</h1>
          <p className="muted" style={{ margin: 0 }}>
            Annual defib skill validation {level ? `· ${level}` : ''}
          </p>
        </div>
        <div className="facilitator__header-actions">
          {shockStart != null && (
            <span className="btn" style={{ cursor: 'default', color: overTarget ? '#c0392b' : undefined }} title="Time since shockable rhythm identified">
              ⏱ {clock(elapsed)} / {clock(SHOCK_TARGET_S)}
            </span>
          )}
          <Link className="btn btn--ghost" to="/">Exit</Link>
        </div>
      </header>

      {/* progress chips */}
      <ol style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: '0 0 1rem', flexWrap: 'wrap' }}>
        {GUIDED_STAGES.map((st, i) => (
          <li
            key={st.id}
            style={{
              padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem',
              background: i === stage ? '#2a6df4' : i < stage ? '#274b32' : '#2a2f36',
              color: i <= stage ? '#fff' : '#9aa',
            }}
          >
            {i + 1}. {st.short}
          </li>
        ))}
      </ol>

      <section className="panel">
        {stageId === 'intro' ? (
          <>
            <h2>Case</h2>
            <p style={{ lineHeight: 1.6 }}>{sc.case}</p>
            <p className="muted">Choose your provider level for this session:</p>
            <div className="row">
              {['BLS', 'ACLS'].map((lv) => (
                <button key={lv} className={`btn ${level === lv ? 'btn--primary' : ''}`} onClick={() => setLevel(lv)}>{lv}</button>
              ))}
            </div>
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--primary" disabled={!level} onClick={next}>Begin — go to the patient ▸</button>
            </div>
          </>
        ) : stageId === 'debrief' ? (
          <>
            <h2>Debrief</h2>
            <p><strong>Level:</strong> {level} · <strong>Time to shock:</strong> {clock(elapsed)} {overTarget ? '(over 2:00 target)' : '(within target ✓)'}</p>
            {(() => {
              const missteps = events.filter((e) => e.type === 'bls_wrong' || e.type === 'bls_out_of_order').length
              return (
                <p><strong>BLS primary survey:</strong> {blsComplete ? 'completed' : 'incomplete'} · {missteps === 0
                  ? 'correct sequence on the first pass ✓'
                  : `${missteps} misstep${missteps === 1 ? '' : 's'} (wrong or out-of-order selection)`}</p>
              )
            })()}
            <p className="muted">{STUBS.debrief}</p>
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={restart}>Restart</button>
              <Link className="btn btn--ghost" to="/">Exit</Link>
            </div>
          </>
        ) : stageId === 'bls' ? (
          <>
            <BlsSurvey
              done={blsDone}
              onStep={(id) => setBlsDone((d) => [...d, id])}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!blsComplete} onClick={next}>
                Crash cart is here — place pads ▸
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{GUIDED_STAGES[stage].title}</h2>
            <p className="muted" style={{ lineHeight: 1.6 }}>{STUBS[stageId]}</p>
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" onClick={next}>Continue ▸</button>
            </div>
          </>
        )}
      </section>

      <footer style={{ marginTop: '1.5rem' }}>
        <SafetyLabel />
      </footer>
    </div>
  )
}

// Placeholder descriptions of what each stage WILL do (filled in Phases 3–6).
const STUBS = {
  bls: 'BLS primary survey (Phase 3): check responsiveness → check a central (carotid) pulse → activate the emergency response (Code Blue) → start CPR while awaiting the code team / crash cart.',
  pads: 'Pad placement (Phase 4): place the defib pads on the mannequin in a correct configuration — anterolateral (RUA / left-lateral) or anterior–posterior — before the ZOLL is used.',
  device: 'Defibrillate (Phase 5): turn on the monitor, identify the shockable rhythm, then — BLS: press ANALYZE for the shock advisory; ACLS: confirm the 120 J preset — charge, announce "CLEAR!", and shock. Time-to-shock target is 2:00.',
  decision: 'Immediately after the shock (Phase 6): what is your next action? Resume CPR (correct) vs. rhythm/pulse check — with feedback on the FIL lead and EtCO₂ monitoring.',
  debrief: 'Performance summary plus an educational walkthrough of the manual crash-cart self-test (defib cable → side port, DEFIB, 30 J, charge/shock, confirm self-test OK).',
}
