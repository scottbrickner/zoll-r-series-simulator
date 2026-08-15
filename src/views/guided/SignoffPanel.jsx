import { useState } from 'react'
import { isKeckEmail } from '../../sync/guidedSignoff'

const inputStyle = {
  width: '100%', background: '#ffffff', color: '#1a1a1a', border: '1px solid #e7e2da',
  borderRadius: 8, padding: '0.5rem 0.6rem', fontSize: '0.92rem',
}
const labelStyle = { display: 'block', fontSize: '0.78rem', color: '#5b5750', marginBottom: 4, fontWeight: 600 }
const OUTCOME_LABEL = { COMPETENT: 'Competent', NYDC: 'NYDC (Not Yet Deemed Competent)' }

/**
 * SignoffPanel — the SME's formal attestation at the end of the debrief.
 *
 * Shows an auto-suggested Competent/NYDC outcome derived from the scored
 * checklist above it (zero "Review" criteria → Competent) that the SME can
 * override with their own clinical judgment. Requires a typed evaluator name
 * + Keck (@med.usc.edu) email — matching this app's existing client-side-
 * deterrence security model, no additional passcode. Once signed, the
 * attestation locks and is sent via the same fire-and-forget telemetry
 * beacon every attempt already uses (see telemetry.js) — no local file
 * export or Teams-folder save; the Power Automate flow on the receiving end
 * both logs the row into the master list AND (Competent outcomes only)
 * emails the learner a completion certificate. This panel can't confirm
 * that email actually sent (the beacon has no response to read), so it only
 * ever says the certificate "is being sent," never that it was delivered.
 *
 * `selfTestDone` gates the sign-off form itself: the SME can't complete the
 * attestation until the kinesthetic manual self-test walkthrough is done, so
 * that step can't be silently skipped and is captured in the signed record.
 *
 * `lockedEvaluator` (optional {name, email, title}) — when the SME's identity
 * was already captured up front (the CODE BLUE shell's SmeIntro screen), the
 * evaluator fields pre-fill from it and become read-only instead of asking
 * again, so the person who ran the session is the one who signs it.
 */
/** One-line pipe-delimited summary for manual paste into a Form/Excel/anywhere. */
function summaryLine(r) {
  return [r.learnerName, r.learnerEmail, OUTCOME_LABEL[r.finalOutcome], new Date(r.signedAt).toLocaleString(), r.scenarioTitle, r.level].join(' | ')
}

export default function SignoffPanel({ sessionType, autoSuggested, signed, selfTestDone, lockedEvaluator, onSign, onRevise }) {
  const [name, setName] = useState(lockedEvaluator?.name || '')
  const [email, setEmail] = useState(lockedEvaluator?.email || '')
  const [title, setTitle] = useState(lockedEvaluator?.title || '')
  const [outcome, setOutcome] = useState(autoSuggested)
  const emailOk = isKeckEmail(email)
  const [copied, setCopied] = useState(false)

  if (signed) {
    const competent = signed.finalOutcome === 'COMPETENT'
    return (
      <section
        role="status"
        style={{
          marginTop: '1rem', border: '1px solid #e7e2da', borderRadius: 12, padding: '1rem 1.1rem',
          background: competent ? '#eaf5ec' : '#fdecea',
        }}
      >
        <h3 style={{ margin: '0 0 4px' }}>Signed off — {OUTCOME_LABEL[signed.finalOutcome]}</h3>
        <p className="muted" style={{ margin: 0 }}>
          {signed.evaluatorName}{signed.evaluatorTitle ? `, ${signed.evaluatorTitle}` : ''} · {signed.evaluatorEmail} · {new Date(signed.signedAt).toLocaleString()}
        </p>

        {sessionType === 'validation' && signed.finalOutcome === 'NYDC' && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.88rem', color: '#8a2c26' }}>
            Recommend one or more Practice (Guided) sessions before the next Validation attempt.
          </p>
        )}

        <div style={{ marginTop: '0.8rem', border: '1px solid #e7e2da', borderRadius: 8, padding: '0.6rem 0.7rem', background: 'rgba(255,255,255,0.6)' }}>
          <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 600 }}>Quick copy — for pasting into a Form, Excel, or anywhere else</p>
          <code style={{ display: 'block', fontSize: '0.82rem', wordBreak: 'break-word', marginBottom: 6 }}>{summaryLine(signed)}</code>
          <button
            className="btn btn--ghost"
            onClick={() => {
              const done = () => { setCopied('ok'); setTimeout(() => setCopied(false), 2000) }
              const failed = () => { setCopied('failed'); setTimeout(() => setCopied(false), 4000) }
              if (navigator.clipboard?.writeText) navigator.clipboard.writeText(summaryLine(signed)).then(done, failed)
              else failed()
            }}
          >
            {copied === 'ok' ? 'Copied ✓' : 'Copy summary'}
          </button>
          {copied === 'failed' && (
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#8a2c26' }}>Couldn’t copy automatically — select the text above and copy it manually.</p>
          )}
        </div>

        <p className="muted" style={{ margin: '0.8rem 0 0', fontSize: '0.85rem' }}>
          This sign-off has been logged to the master completion list.
          {competent && ` A completion certificate is being emailed to ${signed.learnerEmail}.`}
        </p>

        <div className="row" style={{ marginTop: '0.6rem' }}>
          <button className="btn btn--ghost" onClick={onRevise}>Revise sign-off</button>
        </div>
      </section>
    )
  }

  if (!selfTestDone) {
    return (
      <section style={{ marginTop: '1rem', border: '1px solid #e7e2da', borderRadius: 12, padding: '1rem 1.1rem', background: '#fffdf7' }}>
        <h3 style={{ margin: '0 0 4px' }}>SME sign-off</h3>
        <p className="muted" style={{ margin: 0 }}>
          Complete the manual defibrillator self-test walkthrough above before signing off — the kinesthetic self-check is part of this validation.
        </p>
      </section>
    )
  }

  return (
    <section style={{ marginTop: '1rem', border: '1px solid #e7e2da', borderRadius: 12, padding: '1rem 1.1rem', background: '#fffdf7' }}>
      <h3 style={{ margin: '0 0 4px' }}>SME sign-off</h3>
      <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
        Suggested outcome based on the checklist above:{' '}
        <strong style={{ color: autoSuggested === 'COMPETENT' ? '#256b2a' : '#b23028' }}>{OUTCOME_LABEL[autoSuggested]}</strong>. Confirm or override, then sign.
      </p>

      {lockedEvaluator ? (
        <p className="muted" style={{ margin: '0 0 12px' }}>
          Signing as <strong>{name}</strong>{title ? `, ${title}` : ''} · {email}
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(200px, 1fr) minmax(140px, 180px)', gap: 10, marginBottom: 4 }}>
            <label>
              <span style={labelStyle}>Evaluator (SME) name</span>
              <input type="text" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </label>
            <label>
              <span style={labelStyle}>Evaluator email</span>
              <input
                type="email"
                style={{ ...inputStyle, borderColor: email && !emailOk ? '#c62828' : inputStyle.border }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@med.usc.edu"
              />
            </label>
            <label>
              <span style={labelStyle}>Credential / title</span>
              <input type="text" style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. RN, CCRN" />
            </label>
          </div>
          {email && !emailOk && (
            <p style={{ margin: '4px 0 10px', fontSize: '0.78rem', color: '#c62828' }}>Must be a Keck email address (ends in @med.usc.edu).</p>
          )}
        </>
      )}

      <div className="row" style={{ margin: '12px 0' }}>
        {['COMPETENT', 'NYDC'].map((o) => (
          <button key={o} className={`btn ${outcome === o ? 'btn--primary' : ''}`} onClick={() => setOutcome(o)}>{OUTCOME_LABEL[o]}</button>
        ))}
      </div>

      <button
        className="btn btn--primary"
        disabled={!name.trim() || !emailOk}
        onClick={() => onSign({ evaluatorName: name.trim(), evaluatorEmail: email.trim(), evaluatorTitle: title.trim(), outcome })}
      >
        Sign off ▸
      </button>
    </section>
  )
}
