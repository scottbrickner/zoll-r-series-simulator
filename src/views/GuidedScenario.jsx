import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GUIDED_STAGES, SHOCK_TARGET_S, BLS_SEQUENCE, matchedPair, getGuided, GUIDED_SCENARIO_IDS } from '../sync/guidedScenarios'
import GuidedShell from './guided/GuidedShell'
import BlsSurvey from './guided/BlsSurvey'
import PadPlacement from './guided/PadPlacement'
import GuidedDeviceHiFi from './guided/GuidedDeviceHiFi'
import NurseCallouts from './guided/NurseCallouts'
import DecisionStage from './guided/DecisionStage'
import SelfTestWalkthrough from './guided/SelfTestWalkthrough'
import ScoreRow from './guided/ScoreRow'

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
  const [deviceShocked, setDeviceShocked] = useState(false) // first shock delivered on the hi-fi device
  const [shockEnergy, setShockEnergy] = useState(null) // energy at first shock
  const [shockUsedAnalyze, setShockUsedAnalyze] = useState(false) // ANALYZE pressed before first shock
  const [shockElapsed, setShockElapsed] = useState(null) // frozen time-to-shock at delivery
  const [decisionOk, setDecisionOk] = useState(false) // Phase 6 post-shock decision
  const [events, setEvents] = useState([]) // attempt log, feeds the debrief
  const tick = useRef(null)

  const stageId = GUIDED_STAGES[stage].id
  const blsComplete = blsDone.length === BLS_SEQUENCE.length
  const padsPlaced = !!placement.triangle && !!placement.rectangle

  // Log events; the time-to-shock clock starts the instant the learner confirms
  // pulselessness (the carotid-pulse step of the BLS survey).
  const logEvent = (e) => {
    setEvents((v) => [...v, e])
    if (e.type === 'bls_correct' && e.id === 'pulse' && shockStart == null) setShockStart(Date.now())
  }

  const onDeviceShock = useCallback(({ energy, usedAnalyze }) => {
    setDeviceShocked(true)
    setShockEnergy(energy)
    setShockUsedAnalyze(usedAnalyze)
    setShockElapsed((prev) => (prev != null ? prev : Math.max(0, (Date.now() - shockStart) / 1000)))
    logEvent({ type: 'dev_shock', energy, usedAnalyze })
  }, [shockStart])

  // Tick the clock display while running — until the shock is delivered (frozen)
  // or the debrief is reached.
  useEffect(() => {
    if (shockStart == null || shockElapsed != null || stageId === 'debrief') return
    tick.current = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(tick.current)
  }, [shockStart, shockElapsed, stageId])

  // The first shock should move the learner on to the post-shock decision
  // right away — they need to choose to check rhythm/pulse or resume CPR
  // immediately, so linger only long enough to register the shock flash.
  useEffect(() => {
    if (!deviceShocked) return
    const t = setTimeout(() => next(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceShocked])

  const liveElapsed = shockStart == null ? 0 : Math.max(0, (now - shockStart) / 1000)
  const elapsed = shockElapsed != null ? shockElapsed : liveElapsed // freeze at shock
  const overTarget = elapsed > SHOCK_TARGET_S

  const next = () => setStage((s) => Math.min(GUIDED_STAGES.length - 1, s + 1))
  const back = () => setStage((s) => Math.max(0, s - 1))
  const restart = () => { setStage(0); setLevel(null); setShockStart(null); setNow(Date.now()); setBlsDone([]); setPlacement({ triangle: null, rectangle: null }); setPadPassed(false); setDeviceShocked(false); setShockEnergy(null); setShockUsedAnalyze(false); setShockElapsed(null); setDecisionOk(false); setEvents([]) }

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
            <p className="muted" style={{ marginTop: 0 }}>{level} provider</p>
            <div className="score-list">
              <ScoreRow tone={overTarget ? 'bad' : 'good'} title={`Time to shock: ${clock(elapsed)}`}>
                {overTarget ? `over the ${clock(SHOCK_TARGET_S)} target` : `within the ${clock(SHOCK_TARGET_S)} target`}
              </ScoreRow>

              {(() => {
                const missteps = events.filter((e) => e.type === 'bls_wrong' || e.type === 'bls_out_of_order').length
                return (
                  <ScoreRow tone={!blsComplete ? 'bad' : missteps === 0 ? 'good' : 'coach'} title="BLS primary survey">
                    {!blsComplete ? 'not completed' : missteps === 0
                      ? 'correct sequence, first attempt'
                      : `completed with ${missteps} misstep${missteps === 1 ? '' : 's'} (wrong or out-of-order selection)`}
                  </ScoreRow>
                )
              })()}

              {(() => {
                const pair = matchedPair(placement)
                const placed = !!placement.triangle && !!placement.rectangle
                return (
                  <ScoreRow tone={!placed ? 'bad' : pair ? 'good' : 'bad'} title="Pad placement">
                    {!placed ? 'not placed' : pair ? `correct — ${pair.name}` : 'placed, but the configuration was incorrect'}
                  </ScoreRow>
                )
              })()}

              <ScoreRow tone={deviceShocked ? 'good' : 'bad'} title="Defibrillation">
                {deviceShocked ? `shock delivered${shockEnergy != null ? ` at ${shockEnergy} J` : ''}` : 'no shock delivered'}
              </ScoreRow>

              {deviceShocked && shockEnergy != null && (
                <ScoreRow tone={shockEnergy === 120 ? 'good' : 'coach'} title="Initial energy selection">
                  {shockEnergy === 120
                    ? '120 J — the recommended initial biphasic dose'
                    : `${shockEnergy} J — 120 J is the recommended initial dose for VF / pulseless VT (not unsafe, just above standard)`}
                </ScoreRow>
              )}

              {deviceShocked && (() => {
                const mismatch = (level === 'BLS' && !shockUsedAnalyze) || (level === 'ACLS' && shockUsedAnalyze)
                return (
                  <ScoreRow tone={mismatch ? 'coach' : 'good'} title="Device workflow">
                    {level === 'BLS'
                      ? (shockUsedAnalyze ? 'used ANALYZE for the shock advisory' : 'charged directly — as a BLS provider, press ANALYZE first for the shock advisory')
                      : (shockUsedAnalyze ? 'used ANALYZE — as an ACLS provider you can identify the rhythm and charge directly' : 'identified the rhythm and charged directly')}
                  </ScoreRow>
                )
              })()}

              {(() => {
                const shockIdx = events.findIndex((e) => e.type === 'dev_shock')
                const clearIdx = events.findIndex((e) => e.type === 'callout' && e.id === 'clear')
                const clearedFirst = shockIdx !== -1 && clearIdx !== -1 && clearIdx < shockIdx
                return (
                  <ScoreRow tone={clearIdx === -1 ? 'bad' : clearedFirst ? 'good' : 'coach'} title="Verbal callouts">
                    {clearIdx === -1
                      ? '“Clear” was not announced'
                      : clearedFirst ? '“Clear” announced before the shock' : '“Clear” announced, but after the shock'}
                  </ScoreRow>
                )
              })()}

              {(() => {
                const wrong = events.filter((e) => e.type === 'decision_wrong').length
                return (
                  <ScoreRow tone={!decisionOk ? 'bad' : wrong === 0 ? 'good' : 'coach'} title="Post-shock decision">
                    {!decisionOk ? 'not completed' : wrong === 0
                      ? 'resumed CPR immediately, first attempt'
                      : `resumed CPR immediately, after ${wrong} incorrect attempt${wrong === 1 ? '' : 's'}`}
                  </ScoreRow>
                )
              })()}
            </div>
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
              feedback={false}
              onPlace={setPlacement}
              onReset={() => { setPlacement({ triangle: null, rectangle: null }); setPadPassed(false) }}
              onPass={() => setPadPassed(true)}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!padsPlaced} onClick={next}>
                Pads on — go to the ZOLL ▸
              </button>
            </div>
          </>
        ) : stageId === 'device' ? (
          <>
            <h2>Defibrillate</h2>
            <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
              {sc.title} — the patient is pulseless. <strong>Turn on the monitor</strong>, identify the rhythm, and deliver the first shock on the ZOLL. Target: within <strong>{clock(SHOCK_TARGET_S)}</strong> of recognizing pulselessness.
            </p>
            <NurseCallouts onSay={(id) => logEvent({ type: 'callout', id })} />
            <GuidedDeviceHiFi scenario={sc} onShock={onDeviceShock} />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!deviceShocked} onClick={next}>
                {deviceShocked ? 'Advancing…' : 'Shock delivered — next action ▸'}
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
