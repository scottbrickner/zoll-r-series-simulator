/**
 * Visible safety label shown on every view.
 * This is a training tool, not a medical device.
 */
export default function SafetyLabel() {
  return (
    <div className="safety-label" role="note">
      Training simulation only. Not for clinical use.
    </div>
  )
}
