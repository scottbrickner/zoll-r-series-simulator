/**
 * Pure session-scope helpers (no React / JSX), so they can be imported by
 * Node smoke tests as well as the React app.
 */

const BASE = 'zoll-r-series-sim'
export const DEFAULT_SESSION = 'default'

/** BroadcastChannel name scoped to a session id. */
export const channelName = (sessionId) => `${BASE}:${sessionId || DEFAULT_SESSION}`

/** localStorage key scoped to a session id. */
export const storageKeyFor = (sessionId) => `${BASE}:state:${sessionId || DEFAULT_SESSION}`

/** Generate a short, URL-safe, reasonably unique session id. */
let _idSeq = 0
export function newSessionId() {
  _idSeq += 1
  return (Date.now().toString(36) + _idSeq.toString(36)).slice(-7)
}
