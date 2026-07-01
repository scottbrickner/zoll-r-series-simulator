import { useState } from 'react'
import { newSessionId } from '../sync/SimulatorContext'
import SafetyLabel from '../components/SafetyLabel'

/**
 * Session launcher. Creates session ids and opens session-scoped learner /
 * facilitator windows. Each session is an independent sync scope (?session=…)
 * so multiple SMEs on one machine or a deployed app never cross-sync.
 */
export default function Home() {
  const [session, setSession] = useState(newSessionId)
  const [copied, setCopied] = useState('')

  const linkFor = (role) => `${window.location.origin}${import.meta.env.BASE_URL}${role}?session=${session}`
  const open = (role) => window.open(linkFor(role), '_blank')
  const copy = async (role) => {
    try {
      await navigator.clipboard.writeText(linkFor(role))
      setCopied(role)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('')
    }
  }

  return (
    <div className="home">
      <h1>ZOLL R Series Simulator</h1>
      <p className="subtitle">
        Two-window training simulator. Create a session, then open the
        facilitator console and the learner device — windows that share the same
        session id stay in sync; different sessions stay completely independent.
      </p>

      <div className="launcher">
        <label className="launcher__field">
          <span>Session ID</span>
          <div className="launcher__row">
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value.trim())}
              placeholder="enter or create an id"
            />
            <button className="btn" onClick={() => setSession(newSessionId())}>New session</button>
          </div>
        </label>

        <div className="launcher__grid">
          <div className="launcher__card">
            <h3>Facilitator</h3>
            <p>Drive the scenario, alarms, and validation.</p>
            <div className="launcher__row">
              <button className="btn btn--primary" disabled={!session} onClick={() => open('facilitator')}>Open window</button>
              <button className="btn btn--ghost" disabled={!session} onClick={() => copy('facilitator')}>
                {copied === 'facilitator' ? 'Copied ✓' : 'Copy link'}
              </button>
            </div>
          </div>
          <div className="launcher__card">
            <h3>Learner</h3>
            <p>The device screen the trainee operates.</p>
            <div className="launcher__row">
              <button className="btn btn--primary" disabled={!session} onClick={() => open('learner')}>Open window</button>
              <button className="btn btn--ghost" disabled={!session} onClick={() => copy('learner')}>
                {copied === 'learner' ? 'Copied ✓' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        <p className="hint">
          Tip: open the facilitator on one screen and the learner on another (or a
          second monitor). Share a link to run the learner on a separate device on
          the same deployment.
        </p>
      </div>

      <SafetyLabel />
    </div>
  )
}
