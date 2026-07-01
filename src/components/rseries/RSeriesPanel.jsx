import RSeriesDevice from './RSeriesDevice'

/**
 * Wrapper that frames the master SVG device recreation. The SVG itself is the
 * single source of truth for all geometry; this component only sizes it.
 */
export default function RSeriesPanel({ state, elapsed, flash, actions }) {
  return (
    <div className="rs-panel-wrap">
      <RSeriesDevice state={state} elapsed={elapsed} flash={flash} actions={actions} />
    </div>
  )
}
