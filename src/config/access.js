/**
 * Facilitator role gate.
 *
 * IMPORTANT: this is CLIENT-SIDE DETERRENCE ONLY. The app is a static front-end with
 * no backend, so the passcode ships in the bundle and a determined user could bypass
 * it via the URL or devtools. It keeps casual / bedside users out of the full
 * facilitator tools — it is NOT real authentication. For true per-user auth you'd
 * need to add a backend.
 *
 * Change the passcode by editing DEFAULT_PASSCODE, or set VITE_FACILITATOR_PASSCODE
 * at build time (e.g. in an .env file) so it isn't hard-coded here.
 */
const DEFAULT_PASSCODE = 'npd-defib'
export const FACILITATOR_PASSCODE = import.meta.env.VITE_FACILITATOR_PASSCODE || DEFAULT_PASSCODE

const ROLE_KEY = 'zoll-rs:facilitator-role'

/** 'educator' (full tools) once unlocked on this browser, else 'sme' (locked). */
export function getFacilitatorRole() {
  try {
    return localStorage.getItem(ROLE_KEY) === 'educator' ? 'educator' : 'sme'
  } catch {
    return 'sme'
  }
}

/** Returns true and persists the unlock if the code matches. */
export function unlockFacilitator(code) {
  if (String(code).trim() === FACILITATOR_PASSCODE) {
    try {
      localStorage.setItem(ROLE_KEY, 'educator')
    } catch {
      /* storage unavailable — unlock is not persisted */
    }
    return true
  }
  return false
}

/** Re-lock (back to SME) on this browser. */
export function lockFacilitator() {
  try {
    localStorage.removeItem(ROLE_KEY)
  } catch {
    /* ignore */
  }
}

// ── SME scenario allowlist ────────────────────────────────────────────────
// Which scenario ids the basic (SME) facilitator may run. Educators set this in
// the full console; it persists per browser/station (same deterrence caveat — no
// backend, so it's a per-device setting, not a synced/enforced policy).
const ALLOWLIST_KEY = 'zoll-rs:sme-scenarios'

/** Stored allowlist (array of scenario ids), or null to use the default. */
export function getSmeScenarioIds() {
  try {
    const raw = localStorage.getItem(ALLOWLIST_KEY)
    if (raw) {
      const ids = JSON.parse(raw)
      if (Array.isArray(ids)) return ids
    }
  } catch {
    /* ignore */
  }
  return null
}

/** Persist the SME scenario allowlist for this browser/station. */
export function setSmeScenarioIds(ids) {
  try {
    localStorage.setItem(ALLOWLIST_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}
