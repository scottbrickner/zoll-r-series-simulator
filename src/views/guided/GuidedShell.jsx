import { Link } from 'react-router-dom'
import './guided.css'

/**
 * GuidedShell — USC-branded chrome for the guided validation module.
 *
 * A friendly, branded frame (sticky Cardinal header + Gold accent, warm surface,
 * training-disclaimer footer) matching the Vasoactive Titration Simulator shell.
 * The scoped `.guided-shell` theme keeps this off the dark device UI.
 */
export default function GuidedShell({ title, subtitle, clock, hideExit, children }) {
  return (
    <div className="guided-shell">
      <header className="guided-header">
        <div className="guided-header__in">
          <div className="guided-brand">
            <span className="guided-badge" aria-hidden="true">USC</span>
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <div className="guided-header__actions">
            {clock}
            {!hideExit && <Link className="guided-exit" to="/">Exit</Link>}
          </div>
        </div>
      </header>

      <main className="guided-main">{children}</main>

      <footer className="guided-foot">
        <div className="guided-foot__in">
          <span>Training simulation · not for clinical use.</span>
          <span aria-hidden="true">·</span>
          <span>USC · Annual Defibrillation Skill Validation</span>
        </div>
      </footer>
    </div>
  )
}
