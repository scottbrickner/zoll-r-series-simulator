import { Link } from 'react-router-dom'
import { useSimulator } from '../sync/SimulatorContext'
import { buildSessionData, eventAction, iso } from '../sync/report'

const fmt = (t) => (t ? new Date(t).toLocaleString([], { hour12: false }) : '—')
const clock = (t) => (t ? new Date(t).toLocaleTimeString([], { hour12: false }) : '')
const dur = (a, b) => {
  if (!a) return '—'
  const s = Math.max(0, Math.round(((b || Date.now()) - a) / 1000))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

/**
 * Printable validation report. Reads the shared session state and renders a
 * print-friendly summary. Open via the facilitator "Print Report" button.
 */
export default function Report() {
  const { state } = useSimulator()
  const data = buildSessionData(state)
  const log = state.eventLog || []
  const by = (pred) => log.filter(pred)

  const shocks = by((e) => e.type === 'shock' || e.type === 'sync_shock')
  const pacing = by((e) => ['capture_achieved', 'loss_of_capture', 'output_change', 'rate_change', 'four_to_one', 'capture_mode'].includes(e.type))
  const cprEvents = by((e) => e.type.startsWith('cpr'))
  const alarmEvents = by((e) => e.type.startsWith('alarm') || e.type === 'connection')
  const timeline = by((e) =>
    ['session_started', 'scenario_loaded', 'scenario_step', 'scenario_outcome', 'force_deteriorate', 'force_rosc',
      'charge_attempt', 'analyze_result', 'shock', 'sync_shock', 'shock_failed', 'capture_achieved', 'loss_of_capture',
      'cpr_started', 'cpr_stopped', 'alarm_triggered'].includes(e.type))

  const cprStarts = cprEvents.filter((e) => e.type === 'cpr_started').length
  const poorRelease = cprEvents.filter((e) => e.type === 'cpr_poor_release').length
  const lastCpr = [...cprEvents].reverse().find((e) => e.ctx)
  const passed = state.scenarioOutcome === 'PASSED'
  const failed = state.scenarioOutcome === 'FAILED'

  return (
    <div className="report">
      <div className="report__toolbar no-print">
        <button className="btn btn--primary" onClick={() => window.print()}>Print</button>
        <Link className="btn btn--ghost" to={`/facilitator?session=${state.sessionId}`}>Back</Link>
      </div>

      <h1 className="report__title">ZOLL R Series — Training Session Report</h1>
      {data.validationMode && <div className="report__badge">VALIDATION MODE SESSION</div>}

      <section className="report__sec">
        <h2>Session summary</h2>
        <table className="report__kv">
          <tbody>
            <tr><th>Session ID</th><td>{data.sessionId || '—'}</td><th>Scenario</th><td>{data.scenarioName || '—'}</td></tr>
            <tr><th>Start</th><td>{fmt(state.sessionStart)}</td><th>End</th><td>{fmt(state.sessionEnded)}</td></tr>
            <tr><th>Duration</th><td>{dur(state.sessionStart, state.sessionEnded)}</td><th>Mode</th><td>{data.learnerMode}</td></tr>
            <tr><th>Learner</th><td>{data.learnerName || '________________'}</td><th>Evaluator</th><td>{data.evaluatorName || '________________'}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="report__sec">
        <h2>Validation checklist</h2>
        {data.checklist.length ? (
          <table className="report__table">
            <thead><tr><th>Item</th><th>Result</th></tr></thead>
            <tbody>
              {data.checklist.map((c) => (
                <tr key={c.id}>
                  <td>{c.label}</td>
                  <td className={c.done ? 'ok' : 'miss'}>{c.done ? 'PASS' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted">No checklist (load a scenario).</p>}
        <p className="report__outcome">
          Final outcome:{' '}
          <strong className={passed ? 'ok' : failed ? 'miss' : ''}>{state.scenarioOutcome || 'Not marked'}</strong>
        </p>
      </section>

      <section className="report__sec">
        <h2>Critical actions timeline</h2>
        {timeline.length ? (
          <table className="report__table">
            <thead><tr><th>Time</th><th>Event</th><th>Detail</th></tr></thead>
            <tbody>
              {timeline.map((e) => (
                <tr key={e.id}><td>{clock(e.t)}</td><td>{e.type}</td><td>{eventAction(e)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted">No critical actions recorded.</p>}
      </section>

      <div className="report__cols">
        <section className="report__sec">
          <h2>Shocks delivered ({shocks.length})</h2>
          {shocks.length ? (
            <ul>{shocks.map((e) => <li key={e.id}>{clock(e.t)} — {e.energy}J {e.sync ? 'synchronized' : 'unsynchronized'} ({e.rhythm})</li>)}</ul>
          ) : <p className="muted">None.</p>}
        </section>

        <section className="report__sec">
          <h2>Pacing actions ({pacing.length})</h2>
          {pacing.length ? (
            <ul>{pacing.map((e) => <li key={e.id}>{clock(e.t)} — {e.type} {eventAction(e)}</li>)}</ul>
          ) : <p className="muted">None.</p>}
        </section>
      </div>

      <section className="report__sec">
        <h2>CPR performance</h2>
        {cprEvents.length ? (
          <p>
            CPR episodes: {cprStarts} · poor-release events: {poorRelease}
            {lastCpr && lastCpr.ctx ? ` · last rate ${lastCpr.ctx.cprRate}/min, depth ${(lastCpr.ctx.cprDepth / 10).toFixed(1)} cm` : ''}
          </p>
        ) : <p className="muted">No CPR recorded.</p>}
      </section>

      <section className="report__sec">
        <h2>Alarms & disconnects ({alarmEvents.length})</h2>
        {alarmEvents.length ? (
          <ul>{alarmEvents.map((e) => <li key={e.id}>{clock(e.t)} — {e.type} {eventAction(e)}</li>)}</ul>
        ) : <p className="muted">None.</p>}
      </section>

      <section className="report__sec">
        <h2>Facilitator notes</h2>
        {data.facilitatorNotes.length ? (
          <ul>{data.facilitatorNotes.map((n, i) => <li key={i}>{clock(state.facilitatorNotes[i].t)} — {n.text}</li>)}</ul>
        ) : <p className="muted">No notes.</p>}
      </section>

      <p className="report__foot">
        Generated {fmt(Date.now())} · {iso(Date.now())}<br />
        Training simulation only. Not for clinical use.
      </p>
    </div>
  )
}
