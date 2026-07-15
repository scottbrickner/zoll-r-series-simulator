import { useEffect, useRef, useState } from 'react'
import { ecgFor, FLAT } from '../../components/rseries/waveforms'

/**
 * DeviceStage — Phase 5 of the guided arrest module: the ZOLL interaction.
 *
 * A focused, gated device sequence: power on → identify the shockable rhythm →
 * (BLS: ANALYZE for the shock advisory · ACLS: confirm the 120 J preset) →
 * charge → announce "CLEAR!" → shock. The time-to-shock clock runs in the
 * runner; this stage calls onShock() when the shock is delivered. Device flags
 * are lifted to the runner so they survive back/next navigation.
 */
export default function DeviceStage({ level, scenario, device, onDevice, onShock, onEvent }) {
  const [charging, setCharging] = useState(false)
  const [flash, setFlash] = useState(null) // { tone, text }
  const chargeTimer = useRef(null)
  useEffect(() => () => clearTimeout(chargeTimer.current), [])

  const energy = scenario.energy // 120
  const set = (patch) => onDevice({ ...device, ...patch })

  // current step from the flags
  const step = !device.powered ? 'power'
    : !device.identified ? 'identify'
      : !device.branch ? (level === 'BLS' ? 'analyze' : 'energy')
        : !device.charged ? (charging ? 'charging' : 'charge')
          : !device.cleared ? 'clear'
            : !device.shocked ? 'shock' : 'done'

  const ok = (text) => setFlash({ tone: 'ok', text })
  const bad = (text) => setFlash({ tone: 'bad', text })

  const charge = () => {
    setCharging(true); setFlash(null)
    onEvent?.({ type: 'dev_charge' })
    chargeTimer.current = setTimeout(() => { setCharging(false); set({ charged: true }) }, 1300)
  }
  const shock = () => {
    set({ shocked: true }); onEvent?.({ type: 'dev_shock' })
    onShock?.()
    ok('Shock delivered. Resume compressions immediately.')
  }

  // monitor status line
  const status = !device.powered ? '— OFF —'
    : device.shocked ? 'SHOCK DELIVERED'
      : charging ? 'CHARGING…'
        : device.charged ? `CHARGED · ${energy} J`
          : level === 'BLS' && device.branch ? 'SHOCK ADVISED'
            : `DEFIB · ${energy} J`

  return (
    <>
      <h2>Defibrillate</h2>
      <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
        {scenario.title} — the patient is pulseless. Operate the ZOLL R Series to deliver a shock. Target: within <strong>2:00</strong> of recognizing the rhythm.
      </p>

      <Monitor powered={device.powered} rhythm={scenario.rhythm} status={status} energy={energy} charged={device.charged} shocked={device.shocked} />

      {/* current instruction + controls */}
      <div style={{ marginTop: 14 }}>
        {step === 'power' && (
          <Controls prompt="Turn on the defibrillator.">
            <DevBtn onClick={() => { set({ powered: true }); onEvent?.({ type: 'dev_power' }); setFlash(null) }}>Power on — DEFIB</DevBtn>
          </Controls>
        )}

        {step === 'identify' && (
          <Controls prompt="Interpret the rhythm on the monitor.">
            <DevBtn tone="cardinal" onClick={() => { set({ identified: true }); onEvent?.({ type: 'dev_rhythm_ok' }); ok(`${scenario.rhythm} — a shockable rhythm. Prepare to defibrillate.`) }}>Shockable (VF / pulseless VT)</DevBtn>
            <DevBtn tone="plain" onClick={() => { onEvent?.({ type: 'dev_rhythm_wrong' }); bad(`This is ${scenario.rhythm} — a shockable rhythm. Look again: coarse, disorganized, no pulse.`) }}>Not shockable</DevBtn>
          </Controls>
        )}

        {step === 'analyze' && (
          <Controls prompt="BLS: let the device analyze the rhythm.">
            <DevBtn tone="yellow" onClick={() => { set({ branch: true }); onEvent?.({ type: 'dev_analyze' }); ok('“SHOCK ADVISED.” Charge the defibrillator.') }}>ANALYZE</DevBtn>
          </Controls>
        )}

        {step === 'energy' && (
          <Controls prompt="ACLS: select the initial energy for VF / pulseless VT.">
            {[120, 150, 200].map((j) => (
              <DevBtn key={j} tone={j === energy ? 'yellow' : 'plain'} onClick={() => {
                if (j === energy) { set({ branch: true }); onEvent?.({ type: 'dev_energy_ok' }); ok(`${energy} J selected — the recommended initial biphasic energy. Charge the defibrillator.`) }
                else { onEvent?.({ type: 'dev_energy_wrong', j }); bad(`For VF / pulseless VT the recommended initial biphasic dose is ${energy} J.`) }
              }}>{j} J</DevBtn>
            ))}
          </Controls>
        )}

        {(step === 'charge' || step === 'charging') && (
          <Controls prompt={charging ? 'Charging…' : `Charge to ${energy} J.`}>
            <DevBtn tone="yellow" disabled={charging} onClick={charge}>{charging ? 'CHARGING…' : 'CHARGE'}</DevBtn>
          </Controls>
        )}

        {step === 'clear' && (
          <Controls prompt="The defibrillator is charged. Before you shock — clear the patient.">
            <DevBtn tone="cardinal" onClick={() => { set({ cleared: true }); onEvent?.({ type: 'dev_clear' }); ok('“CLEAR! I’m clear, you’re clear, everyone clear.” Deliver the shock.') }}>State “CLEAR — everyone clear!”</DevBtn>
          </Controls>
        )}

        {step === 'shock' && (
          <Controls prompt="Everyone is clear. Deliver the shock.">
            <DevBtn tone="shock" onClick={shock}>SHOCK</DevBtn>
          </Controls>
        )}

        {step === 'done' && (
          <p role="status" className="g-flash g-flash--ok" style={{ marginTop: 0 }}>Shock delivered. Move on to the next action.</p>
        )}
      </div>

      {flash && step !== 'done' && <p role="status" className={`g-flash g-flash--${flash.tone}`}>{flash.text}</p>}
    </>
  )
}

function Controls({ prompt, children }) {
  return (
    <div>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{prompt}</p>
      <div className="row" style={{ flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

/** A ZOLL-style device button. */
function DevBtn({ tone = 'plain', disabled, onClick, children }) {
  const styles = {
    plain: { background: '#fff', color: '#1a1a1a', border: '1px solid #cfc9bd' },
    yellow: { background: '#f2d024', color: '#4a3d00', border: '1px solid #d8b400' },
    shock: { background: '#e8792b', color: '#fff', border: '1px solid #c9631a' },
    cardinal: { background: '#990000', color: '#fff', border: '1px solid #7a0000' },
  }[tone]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles, padding: '0.6rem 1.1rem', borderRadius: 9, fontWeight: 700, fontSize: '0.92rem',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, letterSpacing: 0.2,
      }}
    >
      {children}
    </button>
  )
}

/** Simplified ZOLL monitor: status + energy readout + a live rhythm strip. */
function Monitor({ powered, rhythm, status, energy, charged, shocked }) {
  const path = powered && !shocked ? ecgFor(rhythm) : FLAT
  return (
    <div style={{ background: '#0d1117', border: '1px solid #2b3340', borderRadius: 12, padding: '10px 12px', color: '#e6edf3' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'ui-monospace, monospace' }}>
        <span style={{ fontWeight: 700, letterSpacing: 0.5, color: status.includes('ADVISED') || status.includes('CHARGED') ? '#f2d024' : status.includes('DELIVERED') ? '#e8792b' : '#8b97a7' }}>{status}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {powered && <span style={{ color: '#3fb950' }}>PADS</span>}
          {powered && <span style={{ fontWeight: 700 }}>{energy} <span style={{ fontSize: '0.7em', color: '#8b97a7' }}>J</span></span>}
          <span title="charge state" style={{ width: 12, height: 12, borderRadius: '50%', background: charged ? '#f2d024' : '#39414d', boxShadow: charged ? '0 0 6px #f2d024' : 'none' }} />
        </span>
      </div>
      {/* rhythm strip */}
      <svg viewBox="0 0 300 66" width="100%" height="72" preserveAspectRatio="none" style={{ display: 'block', marginTop: 6 }}>
        {powered && !shocked ? (
          <g>
            <path d={path} fill="none" stroke="#3fb950" strokeWidth="1.4" vectorEffect="non-scaling-stroke" transform="translate(0,-7)">
              <animateTransform attributeName="transform" type="translate" from="0,-7" to="-300,-7" dur="5s" repeatCount="indefinite" />
            </path>
            <path d={path} fill="none" stroke="#3fb950" strokeWidth="1.4" vectorEffect="non-scaling-stroke" transform="translate(300,-7)">
              <animateTransform attributeName="transform" type="translate" from="300,-7" to="0,-7" dur="5s" repeatCount="indefinite" />
            </path>
          </g>
        ) : (
          <path d={FLAT} fill="none" stroke={shocked ? '#3fb950' : '#39414d'} strokeWidth="1.4" vectorEffect="non-scaling-stroke" transform="translate(0,-7)" />
        )}
      </svg>
    </div>
  )
}
