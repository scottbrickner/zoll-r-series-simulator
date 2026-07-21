import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GUIDED_STAGES, SHOCK_TARGET_S, CRASH_CART_DELAY_MS, BLS_SEQUENCE, getGuided, GUIDED_SCENARIO_IDS, CODE_BLUE_SCENARIO_IDS } from '../sync/guidedScenarios'
import { buildCriteria, suggestOutcome, buildSignoffRecord, buildAttemptRecord, isKeckEmail } from '../sync/guidedSignoff'
import { reportAttempt } from '../sync/telemetry'
import GuidedShell from './guided/GuidedShell'
import SmeIntro from './guided/SmeIntro'
import BlsSurvey from './guided/BlsSurvey'
import PadPlacement from './guided/PadPlacement'
import GuidedDeviceHiFi from './guided/GuidedDeviceHiFi'
import NurseCallouts from './guided/NurseCallouts'
import DecisionStage from './guided/DecisionStage'
import SelfTestWalkthrough from './guided/SelfTestWalkthrough'
import DebriefGuide from './guided/DebriefGuide'
import ScoreRow from './guided/ScoreRow'
import SignoffPanel from './guided/SignoffPanel'

/**
 * GuidedScenario — the step-gated arrest validation runner (Phase 2 shell).
 *
 * Walks the learner through the arrest flow (intro → BLS survey → pad placement →
 * defibrillate → next action → debrief), with a level (BLS/ACLS) chosen up front and
 * a 2-minute time-to-shock clock that starts at rhythm identification. Stage bodies
 * are placeholders here; Phases 3–6 fill in the real interactive content.
 *
 * `mode="code-blue"` runs the streamlined CODE BLUE | Response Readiness shell,
 * Validation-only: the facilitator/SME enters their own info FIRST (`SmeIntro`,
 * pre-fills + locks the eventual sign-off), the scenario is always randomized
 * between VF arrest and pulseless VT (no scenario picker), and there's no route
 * out to the rest of the app — this exists so non-NPD SMEs get a single,
 * hard-to-deviate-from path through the annual skill sign-off workflow rather
 * than the full simulator.
 *
 * `mode="practice-open"` is the companion Practice-only surface meant for the
 * general Teams channel — no SME check-in, no Validation option, just an
 * open-ended, randomized-scenario practice loop anyone can run on their own.
 */
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const randomCodeBlueId = () => CODE_BLUE_SCENARIO_IDS[Math.floor(Math.random() * CODE_BLUE_SCENARIO_IDS.length)]

export default function GuidedScenario({ mode = 'full' }) {
  const codeBlue = mode === 'code-blue'
  const practiceOpen = mode === 'practice-open'
  const restricted = codeBlue || practiceOpen // randomized scenario, no scenario picker, no exit
  const showSessionToggle = mode === 'full' // only /guided lets the learner pick Practice vs Validation
  const [params] = useSearchParams()
  const [codeBlueScenarioId, setCodeBlueScenarioId] = useState(randomCodeBlueId)
  const scenarioId = restricted
    ? codeBlueScenarioId
    : (getGuided(params.get('scenario')) ? params.get('scenario') : GUIDED_SCENARIO_IDS[0])
  const sc = getGuided(scenarioId)

  const [smeInfo, setSmeInfo] = useState(null) // { name, email, title } — CODE BLUE only, captured before the learner starts
  const [stage, setStage] = useState(0)
  const [level, setLevel] = useState(null) // 'BLS' | 'ACLS'
  const [sessionType, setSessionType] = useState(codeBlue ? 'validation' : 'practice') // 'practice' (Guided) | 'validation' (SME-graded)
  const [attemptReported, setAttemptReported] = useState(false) // telemetry beacon fired once per attempt
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID()) // stable per attempt — survives a Validation revise+resign
  const [learnerName, setLearnerName] = useState('')
  const [learnerEmail, setLearnerEmail] = useState('')
  const [signoff, setSignoff] = useState(null) // signed record { evaluatorName, evaluatorTitle, finalOutcome, signedAt }
  const [shockStart, setShockStart] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [blsDone, setBlsDone] = useState([]) // ordered ids completed in the BLS survey
  const [placement, setPlacement] = useState({ triangle: null, rectangle: null }) // pad type → position
  const [padPassed, setPadPassed] = useState(false) // valid placement confirmed
  const [crashCartDelayApplied, setCrashCartDelayApplied] = useState(false) // one-time clock skip, BLS → pads
  const [deviceShocked, setDeviceShocked] = useState(false) // first shock delivered on the hi-fi device
  const [shockEnergy, setShockEnergy] = useState(null) // energy at first shock
  const [shockUsedAnalyze, setShockUsedAnalyze] = useState(false) // ANALYZE pressed before first shock
  const [shockElapsed, setShockElapsed] = useState(null) // frozen time-to-shock at delivery
  const [decisionAnswered, setDecisionAnswered] = useState(false) // a post-shock pick was made (any outcome)
  const [decisionOk, setDecisionOk] = useState(false) // whether that pick was correct
  const [clearSaid, setClearSaid] = useState(false) // "Clear" callout announced — required before SHOCK works
  const [selfTestDone, setSelfTestDone] = useState(false) // manual defib self-test walkthrough completed — gates sign-off
  const [events, setEvents] = useState([]) // attempt log, feeds the debrief
  const tick = useRef(null)

  const stageId = GUIDED_STAGES[stage].id
  const isValidation = sessionType === 'validation'
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

  // Single source of truth for the debrief's scored checklist + suggestion —
  // computed once here so both the on-screen ScoreRow list and the telemetry
  // beacon below use the exact same values.
  const criteria = useMemo(() => buildCriteria({
    elapsedLabel: clock(elapsed), targetLabel: clock(SHOCK_TARGET_S), elapsedSeconds: elapsed,
    blsComplete, events, placement, deviceShocked, shockEnergy, shockUsedAnalyze, level, decisionOk,
  }), [elapsed, blsComplete, events, placement, deviceShocked, shockEnergy, shockUsedAnalyze, level, decisionOk])
  const autoSuggested = useMemo(() => suggestOutcome(criteria), [criteria])

  // Practice attempts have no sign-off to hang a telemetry trigger off of, so
  // report as soon as the debrief is reached (once per attempt). Validation
  // attempts report at sign-off time instead (see `sign` below) — an
  // unsigned validation debrief isn't a completed record worth counting yet.
  useEffect(() => {
    if (stageId !== 'debrief' || isValidation || attemptReported) return
    reportAttempt(buildAttemptRecord({
      attemptId, scenario: sc, level, sessionType, learnerName, learnerEmail, criteria, autoSuggested,
      timeToShockSeconds: elapsed, shockEnergy,
    }))
    setAttemptReported(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, isValidation, attemptReported])

  const next = () => setStage((s) => Math.min(GUIDED_STAGES.length - 1, s + 1))
  const back = () => setStage((s) => Math.max(0, s - 1))
  const restart = () => {
    setStage(0); setLevel(null); setSessionType(codeBlue ? 'validation' : 'practice'); setLearnerName(''); setLearnerEmail('')
    setShockStart(null); setNow(Date.now()); setBlsDone([]); setPlacement({ triangle: null, rectangle: null }); setPadPassed(false)
    setCrashCartDelayApplied(false); setDeviceShocked(false); setShockEnergy(null); setShockUsedAnalyze(false); setShockElapsed(null)
    setDecisionAnswered(false); setDecisionOk(false); setClearSaid(false); setSelfTestDone(false); setSignoff(null); setEvents([])
    setAttemptReported(false); setAttemptId(crypto.randomUUID())
    if (restricted) setCodeBlueScenarioId(randomCodeBlueId()) // next attempt gets a fresh random rhythm; same SME (if any) stays checked in
  }
  // Ends the whole check-in — the next person to touch the device re-enters as a new facilitator.
  const switchFacilitator = () => { restart(); setSmeInfo(null) }

  const sign = ({ evaluatorName, evaluatorEmail, evaluatorTitle, outcome }) => {
    const signoffCtx = { finalOutcome: outcome, evaluatorName, evaluatorEmail, evaluatorTitle, selfTestCompleted: selfTestDone }
    const record = buildSignoffRecord({
      scenario: sc, level, sessionType, learnerName, learnerEmail, criteria, autoSuggested, finalOutcome: outcome,
      evaluatorName, evaluatorEmail, evaluatorTitle, signedAt: Date.now(), timeToShockSeconds: elapsed, shockEnergy,
      selfTestCompleted: selfTestDone,
    })
    setSignoff(record)
    reportAttempt(buildAttemptRecord({
      attemptId, scenario: sc, level, sessionType, learnerName, learnerEmail, criteria, autoSuggested,
      timeToShockSeconds: elapsed, shockEnergy, signoff: signoffCtx,
    }))
  }

  // The crash cart doesn't teleport in — add a one-time, randomized 15–25s to the
  // clock when leaving the BLS survey for pad placement, so the timer reflects
  // real-world time to get it to the bedside (both session types).
  const toPads = () => {
    if (!crashCartDelayApplied && shockStart != null) {
      const [min, max] = CRASH_CART_DELAY_MS
      setShockStart((t) => t - (min + Math.random() * (max - min)))
      setCrashCartDelayApplied(true)
    }
    next()
  }

  const clockChip = shockStart != null && (
    <span className={`guided-clock ${overTarget ? 'guided-clock--over' : ''}`} title="Time since shockable rhythm identified">
      ⏱ {clock(elapsed)} / {clock(SHOCK_TARGET_S)}
    </span>
  )

  return (
    <GuidedShell
      title={restricted ? 'CODE BLUE | Response Readiness' : `${sc.title} — Guided Session`}
      subtitle={`Annual Defibrillation Skill Validation${level ? ` · ${level}` : ''}${stage > 0 ? ` · ${isValidation ? 'Validation (graded)' : 'Practice'}` : ''}`}
      clock={codeBlue && !smeInfo ? null : clockChip}
      hideExit={restricted}
    >
      {codeBlue && !smeInfo ? (
        <section className="panel">
          <SmeIntro onSubmit={setSmeInfo} />
        </section>
      ) : (
        <>
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
            <h2>Annual Defibrillation Skill Validation</h2>

            <section style={{ border: '1px solid #e7e2da', borderRadius: 12, padding: '1rem 1.1rem', background: '#fffdf7', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 6px' }}>What this validates</h3>
              <ul className="muted" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>Recognizing and confirming a shockable rhythm (VF / pulseless VT) through the BLS primary survey</li>
                <li>Activating the emergency response system promptly</li>
                <li>Applying defibrillation pads in a correct configuration (anterolateral or anterior–posterior)</li>
                <li>Operating the ZOLL R Series appropriately for your provider level — BLS: ANALYZE for the shock advisory; ACLS: identify the rhythm and select the correct initial energy</li>
                <li>Delivering the first shock within <strong>2 minutes</strong> of identifying pulselessness</li>
                <li>Communicating safety callouts — including stating <strong>“Clear”</strong> before defibrillating</li>
                <li>Taking the correct action immediately after the shock</li>
              </ul>
            </section>

            <section style={{ border: '1px solid #e7e2da', borderRadius: 12, padding: '1rem 1.1rem', background: '#fffdf7', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 6px' }}>How to use this simulation</h3>
              <ul className="muted" style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>Work through the steps in order, shown as chips at the top (Case → BLS → Pads → Shock → Next → Debrief)</li>
                <li>{isValidation
                  ? 'This is a Validation session — every step is scored silently; no in-task feedback is given, only at the debrief'
                  : 'This is a Practice session — wrong or out-of-order picks are corrected right away so you can learn; get each step right before moving on'}</li>
                <li>Use <strong>◂ Back</strong> if you need to review a previous step</li>
                <li>On the ZOLL device, operate the controls exactly as you would on the real unit</li>
                <li>Say the callout phrases out loud as you would in a real code — “Clear” is required before SHOCK will work</li>
                <li>{isValidation
                  ? 'At the end, an SME reviews your performance and signs off on this session'
                  : 'At the end, you’ll see the same scored debrief — no SME sign-off, since this is just practice'}</li>
              </ul>
            </section>

            <h3 style={{ margin: '0 0 4px' }}>Case</h3>
            <p style={{ lineHeight: 1.6 }}>{sc.case}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(220px, 1fr)', gap: 10, maxWidth: 560, marginBottom: '0.9rem' }}>
              <label>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#5b5750', marginBottom: 4, fontWeight: 600 }}>Learner (nurse) name</span>
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  placeholder="Full name"
                  style={{ width: '100%', background: '#fff', color: '#1a1a1a', border: '1px solid #e7e2da', borderRadius: 8, padding: '0.5rem 0.6rem', fontSize: '0.92rem' }}
                />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#5b5750', marginBottom: 4, fontWeight: 600 }}>Learner email</span>
                <input
                  type="email"
                  value={learnerEmail}
                  onChange={(e) => setLearnerEmail(e.target.value)}
                  placeholder="you@med.usc.edu"
                  style={{ width: '100%', background: '#fff', color: '#1a1a1a', border: `1px solid ${learnerEmail && !isKeckEmail(learnerEmail) ? '#c62828' : '#e7e2da'}`, borderRadius: 8, padding: '0.5rem 0.6rem', fontSize: '0.92rem' }}
                />
              </label>
            </div>
            {learnerEmail && !isKeckEmail(learnerEmail) && (
              <p style={{ margin: '-4px 0 10px', fontSize: '0.78rem', color: '#c62828' }}>Must be a Keck email address (ends in @med.usc.edu).</p>
            )}

            {showSessionToggle && (
              <>
                <p className="muted">Choose how this session should run:</p>
                <div className="row">
                  <button className={`btn ${!isValidation ? 'btn--primary' : ''}`} onClick={() => setSessionType('practice')}>Practice (Guided)</button>
                  <button className={`btn ${isValidation ? 'btn--primary' : ''}`} onClick={() => setSessionType('validation')}>Validation (Graded)</button>
                </div>
              </>
            )}
            <p className="muted" style={{ fontSize: '0.82rem', marginTop: 4, marginBottom: '0.9rem' }}>
              {practiceOpen
                ? 'Learn at your own pace — wrong steps are corrected as you go. Ready for your SME-graded attempt? Ask your SME to open the Validation link on their channel.'
                : isValidation
                  ? 'An SME reviews this attempt and signs off at the debrief — no in-task feedback. If you’re not yet ready, tell your SME and switch to Practice first.'
                  : 'Learn at your own pace — wrong steps are corrected as you go. When you’re ready for your SME-graded attempt, tell your SME and switch to Validation.'}
              {codeBlue && ' Only one graded attempt is allowed before a Practice session is required — if you’ve already attempted Validation, please complete a Practice session first.'}
            </p>

            <p className="muted">Choose your provider level for this session:</p>
            <div className="row">
              {['BLS', 'ACLS'].map((lv) => (
                <button key={lv} className={`btn ${level === lv ? 'btn--primary' : ''}`} onClick={() => setLevel(lv)}>{lv}</button>
              ))}
            </div>
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--primary" disabled={!level || !learnerName.trim() || !isKeckEmail(learnerEmail)} onClick={next}>Begin — go to the patient ▸</button>
            </div>
          </>
        ) : stageId === 'debrief' ? (
          <>
            <h2>Debrief</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              {learnerName} · {learnerEmail} · {level} provider · {isValidation ? 'Validation session' : 'Practice session'}
            </p>
            <div className="score-list">
              {criteria.map((c) => (
                <ScoreRow key={c.key} tone={c.tone} title={c.title}>{c.detail}</ScoreRow>
              ))}
            </div>
            <DebriefGuide level={level} />
            <SelfTestWalkthrough onDone={() => setSelfTestDone(true)} />
            {isValidation ? (
              <SignoffPanel
                sessionType={sessionType}
                autoSuggested={autoSuggested}
                signed={signoff}
                selfTestDone={selfTestDone}
                lockedEvaluator={codeBlue ? smeInfo : undefined}
                onSign={sign}
                onRevise={() => setSignoff(null)}
              />
            ) : (
              <p className="muted" style={{ marginTop: '0.8rem' }}>
                {practiceOpen
                  ? 'This was a practice session — no SME sign-off is recorded here. Ready for a graded attempt? Ask your SME to open the Validation link.'
                  : 'This was a practice session — no SME sign-off is recorded. When you’re ready, restart and choose Validation for your graded attempt.'}
              </p>
            )}
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={restart}>{codeBlue ? 'Next learner ▸' : practiceOpen ? 'Practice again ▸' : 'Restart'}</button>
              {codeBlue ? (
                <button className="btn btn--ghost" onClick={switchFacilitator}>Switch facilitator</button>
              ) : !practiceOpen ? (
                <Link className="btn btn--ghost" to="/">Exit</Link>
              ) : null}
            </div>
          </>
        ) : stageId === 'bls' ? (
          <>
            <BlsSurvey
              done={blsDone}
              feedback={!isValidation}
              onStep={(id) => setBlsDone((d) => [...d, id])}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!blsComplete} onClick={toPads}>
                Crash cart is here — place pads ▸
              </button>
            </div>
          </>
        ) : stageId === 'pads' ? (
          <>
            <PadPlacement
              placement={placement}
              passed={padPassed}
              feedback={!isValidation}
              onPlace={setPlacement}
              onReset={() => { setPlacement({ triangle: null, rectangle: null }); setPadPassed(false) }}
              onPass={() => setPadPassed(true)}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={isValidation ? !padsPlaced : !padPassed} onClick={next}>
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
            <NurseCallouts onSay={(id) => { logEvent({ type: 'callout', id }); if (id === 'clear') setClearSaid(true) }} />
            <GuidedDeviceHiFi
              scenario={sc}
              clearAnnounced={clearSaid}
              onShock={onDeviceShock}
              onBlockedShock={() => logEvent({ type: 'shock_blocked' })}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!deviceShocked} onClick={next}>
                {deviceShocked ? 'Advancing…' : 'Shock delivered — next action ▸'}
              </button>
            </div>
          </>
        ) : stageId === 'decision' ? (
          <>
            <DecisionStage
              answered={decisionAnswered}
              feedback={!isValidation}
              onAnswer={(correct) => { setDecisionAnswered(true); setDecisionOk(correct) }}
              onEvent={logEvent}
            />
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn btn--ghost" onClick={back}>◂ Back</button>
              <button className="btn btn--primary" disabled={!decisionAnswered} onClick={next}>
                Continue to debrief ▸
              </button>
            </div>
          </>
        ) : null}
      </section>
        </>
      )}
    </GuidedShell>
  )
}
