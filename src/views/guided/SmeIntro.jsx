import { useState } from 'react'
import { isKeckEmail } from '../../sync/guidedSignoff'

const inputStyle = {
  width: '100%', background: '#ffffff', color: '#1a1a1a', border: '1px solid #e7e2da',
  borderRadius: 8, padding: '0.5rem 0.6rem', fontSize: '0.92rem',
}
const labelStyle = { display: 'block', fontSize: '0.78rem', color: '#5b5750', marginBottom: 4, fontWeight: 600 }

/**
 * SmeIntro — the CODE BLUE shell's opening screen: the facilitator/SME
 * running the session enters their own info FIRST, before any learner
 * touches the device. That identity carries through to the debrief and
 * pre-fills (and locks) the sign-off's evaluator fields, so the person who
 * ran the session is the one who's recorded as having signed it.
 */
export default function SmeIntro({ onSubmit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const emailOk = isKeckEmail(email)

  return (
    <>
      <h2>Facilitator check-in</h2>
      <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
        Enter your information before handing the device to a learner. You'll review and sign off their session at the end.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(200px, 1fr) minmax(140px, 180px)', gap: 10, maxWidth: 620, marginBottom: 4 }}>
        <label>
          <span style={labelStyle}>Your (SME) name</span>
          <input type="text" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </label>
        <label>
          <span style={labelStyle}>Your email</span>
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

      <div className="row" style={{ marginTop: '1rem' }}>
        <button
          className="btn btn--primary"
          disabled={!name.trim() || !emailOk}
          onClick={() => onSubmit({ name: name.trim(), email: email.trim(), title: title.trim() })}
        >
          Continue — hand off to learner ▸
        </button>
      </div>
    </>
  )
}
