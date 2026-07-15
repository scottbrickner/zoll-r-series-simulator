import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GUIDED_STAGES, SHOCK_CLOCK_STAGE, SHOCK_TARGET_S, BLS_SEQUENCE, getGuided, GUIDED_SCENARIO_IDS } from '../sync/guidedScenarios'
import GuidedShell from './guided/GuidedShell'
import BlsSurvey from './guided/BlsSurvey'
import PadPlacement from './guided/PadPlacement'
import DeviceStage from './guided/DeviceStage'
import DecisionStage from './guided/DecisionStage'
import SelfTestWalkthrough from './guided/SelfTestWalkthrough'

const DEVICE0 = { powered: false, identified: false, branch: false, charged: false, cleared: false, shocked: false }

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
  const [placement, setPlacement] = useState({ triangle: null, rectangle: null }) // pad type → position
  const [padPassed, setPadPassed] = useState(false) // valid placement confirmed
  const [device, setDevice] = useState(DEVICE0) // Phase 5 device flags
  const [shockElapsed, setShockElapsed] = useState(null) // frozen time-to-shock at delivery
  const [decisionOk, setDecisionOk] = useState(false) // Phase 6 post-shock decision
  const [events, setEvents] = useState([]) // attempt log, feeds the debrief
  const tick = useRef(null)

  const stageId = GUIDED_STAGES[stage].id
  const logEvent = (e) => setEvents((v) => [...v, e])
  const blsComplete = blsDone.length === BLS_SEQUENCE.length

  // Start the time-to-shock clock when we reach the device stage (rhythm ID).
  useEffect(() => {
    if (stageId === SHOCK_CLOCK_STAGE && shockStart == null) setShockStart(Date.now())
  }, [stageId, shockStart])

  // Tick the clock display while running — until the shock is delivered (frozen)
  // or the debrief is reached.
  useEffect(() => {
    if (shockStart == null || shockElapsed != null || stageId === 'debrief') return
    tick.current = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(tick.current)
  }, [shockStart, shockElapsed, stageId])

  const liveElapsed = shockStart == null ? 0 : Math.max(0, (now - shockStart) / 1000)
  const elapsed = shockElapsed != null ? shockElapsed : liveElapsed // freeze at shock
  const overTarget = elapsed > SHOCK_TARGET_S

  const next = () => setStage((s) => Math.min(GUIDED_STAGES.length - 1, s + 1))
  const back = () => setStage((s) => Math.max(0, s - 1))
  const restart = () => { setStage(0); setLevel(null); setShockStart(null); setNow(Date.now()); setBlsDone([]); setPlacement({ triangle: null, rectangle: null }); setPadPassed(false); setDevice(DEVICE0); setShockElapsed(null); setDecisionOk(false); setEvents([]) }

  const clockChip = shockStart != null && (
    <span className={`guided-clock ${overTarget ? 'guided-clock--over' : ''}`} title="Time since shockable rhythm identified">
      ⏱ {clock(elapsed)} / {clock(SHOCK_TARGET_S)}
    </span>
  )

  return (
    <GuidedShell
      title={`${sc.title} — Guided Session`}
      subtitle={`Annual Defibrillation Skill Validation${level ? ` · ${level}` : ''}`}
      clock={clockChip}
    >
      {/* progress chips */}
      <ol className="guided-steps">
        {GUIDED_STAGES.map((st, i) => (
          <li
            key={st.id}
            className={`guided-step ${i === stage ? 'guided-step--active' : i < stage ? 'guided-step--done' : ''}`}
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
            {(() => {
              const pass = events.find((e) => e.type === 'pads_ok')
              const wrong = events.filter((e) => e.type === 'pads_wrong').length
              return (
                <p><strong>Pad placement:</strong> {padPassed ? `valid (${pass?.config || '—'})` : 'not confirmed'}{wrong > 0 ? ` · ${wrong} rejected attempt${wrong === 1 ? '' : 's'}` : padPassed ? ' — first attempt ✓' : ''}</p>
              )
            })()}
            {(() => {
              const cleared = events.some((e) => e.type === 'dev_clear')
              return (
                <p><strong>Defibrillation:</strong> {device.shocked ? `shock delivered (${level === 'BLS' ? 'ANALYZE → advisory' : `${sc.energy} J`})` : 'no shock delivered'}{device.shocked ? ` · CLEAR ${cleared ? 'stated ✓' : 'not stated'}` : ''}</p>
              )
            })()}
            {(() => {
              const wrong = events.filter((e) => e.type === 'decision_wrong').length
              return (
                <p><strong>Post-shock action:</strong> {decisionOk ? 'resumed CPR immediately' : 'not completed'}{wrong > 0 ? ` · ${wrong} incorrect attempt${wrong === 1 ? '' : 's'}` : decisionOk ? ' — first attempt ✓' : ''}</p>
              )
            })()}
            <SelfTestWalkthrough />
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
        ) : stageId === 'pads' ? (
          <>
            <PadPlacement
              placement={placement}
              passed={padPassed}
              onPlace={setPlacement}
              onReset={() => { setPlacement({ triangle: null, rectangle: null }); setPadPassed(false) }}
              onPass={() => setPadPassed(true)}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!padPassed} onClick={next}>
                Pads on — go to the ZOLL ▸
              </button>
            </div>
          </>
        ) : stageId === 'device' ? (
          <>
            <DeviceStage
              level={level}
              scenario={sc}
              device={device}
              onDevice={setDevice}
              onShock={() => setShockElapsed(liveElapsed)}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!device.shocked} onClick={next}>
                Shock delivered — next action ▸
              </button>
            </div>
          </>
        ) : stageId === 'decision' ? (
          <>
            <DecisionStage done={decisionOk} onCorrect={() => setDecisionOk(true)} onEvent={logEvent} />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!decisionOk} onClick={next}>
                Continue to debrief ▸
              </button>
            </div>
          </>
        ) : null}
      </section>
    </GuidedShell>
  )
}
