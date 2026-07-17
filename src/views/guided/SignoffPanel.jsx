import { useState, useEffect } from 'react'
import { isKeckEmail, signoffFiles, exportSignoffJSON, exportSignoffCSV } from '../../sync/guidedSignoff'
import { isFolderSaveSupported, getSavedFolder, pickTeamsFolder, writeFileToFolder } from '../../sync/teamsFolder'

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
 * attestation locks and the record is saved directly into a local Teams-
 * synced folder via the File System Access API (Chrome/Edge — the first
 * sign-off on a given browser prompts for the folder once, then later ones
 * save silently); browsers without that API fall back to a download.
 */
export default function SignoffPanel({ autoSuggested, signed, onSign, onRevise }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [outcome, setOutcome] = useState(autoSuggested)
  const emailOk = isKeckEmail(email)
  const [folderState, setFolderState] = useState({ status: 'idle' })

  useEffect(() => {
    if (!signed || !isFolderSaveSupported()) return
    let cancelled = false
    ;(async () => {
      setFolderState({ status: 'checking' })
      const handle = await getSavedFolder().catch(() => null)
      if (cancelled) return
      if (!handle) { setFolderState({ status: 'need-picker' }); return }
      try {
        const files = signoffFiles(signed)
        await writeFileToFolder(handle, files.json.name, files.json.contents)
        await writeFileToFolder(handle, files.csv.name, files.csv.contents)
        if (!cancelled) setFolderState({ status: 'saved', folderName: handle.name })
      } catch {
        if (!cancelled) setFolderState({ status: 'error' })
      }
    })()
    return () => { cancelled = true }
  }, [signed])

  const chooseFolder = async () => {
    setFolderState({ status: 'saving' })
    try {
      const handle = await pickTeamsFolder()
      const files = signoffFiles(signed)
      await writeFileToFolder(handle, files.json.name, files.json.contents)
      await writeFileToFolder(handle, files.csv.name, files.csv.contents)
      setFolderState({ status: 'saved', folderName: handle.name })
    } catch (err) {
      setFolderState({ status: err?.name === 'AbortError' ? 'need-picker' : 'error' })
    }
  }

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

        {isFolderSaveSupported() ? (
          <div style={{ marginTop: '0.8rem' }}>
            {(folderState.status === 'checking' || folderState.status === 'saving') && (
              <p className="muted" style={{ margin: 0 }}>Saving to the Teams folder…</p>
            )}
            {folderState.status === 'saved' && (
              <p className="muted" style={{ margin: 0 }}>Saved to the “{folderState.folderName}” folder.</p>
            )}
            {(folderState.status === 'need-picker' || folderState.status === 'error') && (
              <div className="row">
                <button className="btn btn--primary" onClick={chooseFolder}>
                  {folderState.status === 'error' ? 'Couldn’t save — retry ▸' : 'Save to Teams folder ▸'}
                </button>
              </div>
            )}
            <div className="row" style={{ marginTop: 6 }}>
              {folderState.status === 'saved' && (
                <button className="btn btn--ghost" onClick={chooseFolder}>Change folder</button>
              )}
              <button className="btn btn--ghost" onClick={() => exportSignoffJSON(signed)}>Download JSON instead</button>
              <button className="btn btn--ghost" onClick={() => exportSignoffCSV(signed)}>Download CSV instead</button>
            </div>
          </div>
        ) : (
          <div className="row" style={{ marginTop: '0.8rem' }}>
            <button className="btn btn--primary" onClick={() => exportSignoffJSON(signed)}>Download record (JSON)</button>
            <button className="btn" onClick={() => exportSignoffCSV(signed)}>Download record (CSV)</button>
          </div>
        )}

        <div className="row" style={{ marginTop: '0.6rem' }}>
          <button className="btn btn--ghost" onClick={onRevise}>Revise sign-off</button>
        </div>
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
