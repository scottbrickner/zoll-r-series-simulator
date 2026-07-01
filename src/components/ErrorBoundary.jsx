import { Component } from 'react'
import { storageKeyFor } from '../sync/sessionKeys'

/**
 * Catches render-time crashes (e.g. from a corrupted/incompatible stored
 * session) and offers a recovery action that clears the affected session's
 * persisted state and reloads.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  recover = () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const session = params.get('session') || 'default'
      localStorage.removeItem(storageKeyFor(session))
    } catch {
      // ignore
    }
    window.location.reload()
  }

  recoverAll = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('zoll-r-series-sim:'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="errboundary">
        <h1>Something went wrong</h1>
        <p>
          The simulator hit an unexpected error. This can happen if a stored
          session became corrupted or incompatible after an update.
        </p>
        <pre className="errboundary__msg">{String(this.state.error)}</pre>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn--primary" onClick={this.recover}>Reset this session &amp; reload</button>
          <button className="btn btn--ghost" onClick={this.recoverAll}>Clear all sessions &amp; reload</button>
        </div>
        <p className="safety-inline">Training simulation only. Not for clinical use.</p>
      </div>
    )
  }
}
