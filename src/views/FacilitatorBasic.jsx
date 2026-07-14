import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSimulator } from '../sync/SimulatorContext'
import { SCENARIOS, DEFIB_SCENARIO_IDS, getScenario } from '../sync/scenarios'
import { unlockFacilitator, getSmeScenarioIds } from '../config/access'
import SafetyLabel from '../components/SafetyLabel'

/**
 * FacilitatorBasic — the locked "SME" facilitator for bedside-nurse subject-matter
 * experts. It exposes ONLY the prebuilt defib-skill scenarios: pick one, run it on
 * the learner, and step/reset. The full facilitator toolkit (alarms, notes,
 * validation, deterioration, reports) stays behind the educator passcode.
 */
export default function FacilitatorBasic({ onUnlock }) {
  const sim = useSimulator()
  const { state } = sim
  // Educator-configured allowlist (defaults to the built-in defib set).
  const allowedIds = getSmeScenarioIds() || DEFIB_SCENARIO_IDS
  const allowed = SCENARIOS.filter((s) => allowedIds.includes(s.id))
  const scenario = getScenario(state.scenarioId)
  const running = scenario && allowedIds.includes(scenario.id)
  const routeFor = (role) => `${import.meta.env.BASE_URL}${role}?session=${state.sessionId}`

  const [showUnlock, setShowUnlock] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)
  const tryUnlock = () => {
    if (unlockFacilitator(code)) onUnlock()
    else { setErr(true); setCode('') }
  }

  return (
    <div className="facilitator">
      <header className="facilitator__header">
        <div>
          <h1>Defib Skills — Facilitator</h1>
          <p className="muted" style={{ margin: 0 }}>Session <strong>{state.sessionId}</strong> · basic (SME) mode</p>
        </div>
        <div className="facilitator__header-actions">
          <button className="btn" onClick={() => window.open(routeFor('learner'), '_blank')}>Open learner window</button>
          <Link className="btn btn--ghost" to="/">Exit</Link>
        </div>
      </header>

      <div className="facilitator__grid">
        <Panel title="Choose a defib skill scenario">
          <p className="muted" style={{ marginTop: 0 }}>
            Open the learner device (button above), then pick a scenario to run it. Use Next step / Reset to drive it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
            {allowed.length === 0 && <p className="muted">No scenarios enabled for SME access. Ask an educator to enable some.</p>}
            {allowed.map((s) => {
              const active = state.scenarioId === s.id
              return (
                <button
                  key={s.id}
                  className={`btn ${active ? 'btn--primary' : ''}`}
                  style={{ textAlign: 'left', padding: '10px 12px', height: 'auto', whiteSpace: 'normal' }}
                  onClick={() => sim.loadScenario(s.id)}
                >
                  <strong>{s.name}</strong>
                  <span className="muted" style={{ display: 'block', fontSize: '0.8rem' }}>
                    {s.level} · {s.expectedActions?.[0] || ''}
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        {running ? (
          <Panel title={`Running — ${scenario.name}`}>
            <div className="row">
              <button className="btn btn--primary" onClick={sim.advanceStep}>Next step ▸</button>
              <button className="btn btn--ghost" onClick={sim.resetScenario}>Reset</button>
            </div>
            {scenario.expectedActions?.length > 0 && (
              <>
                <p className="muted" style={{ margin: '0.8rem 0 0.3rem' }}>Expected actions</p>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                  {scenario.expectedActions.map((a, i) => <li key={i}>{a}</li>)}
                </ol>
              </>
            )}
          </Panel>
        ) : (
          <Panel title="Running">
            <p className="muted" style={{ margin: 0 }}>No scenario loaded — pick one to begin.</p>
          </Panel>
        )}
      </div>

      <footer style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SafetyLabel />
        {showUnlock ? (
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <input
              type="password"
              placeholder="Educator passcode"
              value={code}
              autoFocus
              onChange={(e) => { setCode(e.target.value); setErr(false) }}
              onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
              style={{ padding: '4px 8px' }}
            />
            <button className="btn btn--primary" onClick={tryUnlock}>Unlock</button>
            <button className="btn btn--ghost" onClick={() => { setShowUnlock(false); setErr(false); setCode('') }}>Cancel</button>
            {err && <span className="muted" style={{ color: '#c0392b' }}>Incorrect code</span>}
          </span>
        ) : (
          <button className="btn btn--ghost" onClick={() => setShowUnlock(true)}>Educator access (NPD/NE)</button>
        )}
      </footer>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
