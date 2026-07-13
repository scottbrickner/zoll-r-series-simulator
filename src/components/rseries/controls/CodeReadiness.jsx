/**
 * Code Readiness Window — reusable self-test indicator (Industrial Design
 * Pass 2F). Reconstructs the ZOLL R Series code-readiness / self-test window.
 *
 * Two parts:
 *   • PHYSICAL asset — a black recessed window in a dark-gray satin molded bezel.
 *     Fixed geometry; footprint matches the locked master layer 17 (116 × 68).
 *   • REACT states — only the DISPLAY inside the window changes:
 *       status 'blank'    → empty window
 *       status 'ready'    → green check (device ready for use)
 *       status 'notReady' → red X (not ready)
 *       status 'testing'  → self-test running (rotating amber spinner)
 *     `flashing` optionally pulses the content (e.g. an attention state).
 *
 * Returns a <g> (a part); the consumer supplies the enclosing <svg viewBox>.
 * The SVG geometry NEVER changes — React changes only the status display.
 * A facilitator can later drive `status` (no simulator logic wired here yet).
 *
 * Props: status; flashing; x, y, w, h (default 116 × 68); idPrefix.
 */
export default function CodeReadiness({
  status = 'blank',
  flashing = false,
  x = 0,
  y = 0,
  w = 116,
  h = 68,
  idPrefix = 'cr',
}) {
  const bezelId = `${idPrefix}-bez`
  const cx = x + w / 2
  const cy = y + h / 2
  // check / X positioned relative to the window (master layer 17 proportions)
  const checkPath = `M${x + 32},${y + 36} L${x + 46},${y + 54} L${x + 78},${y + 12}`
  const xPath = `M${x + 34},${y + 18} L${x + 82},${y + 50} M${x + 82},${y + 18} L${x + 34},${y + 50}`

  return (
    <g id="code_readiness_window">
      <defs>
        <linearGradient id={bezelId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="1" stopColor="#242424" />
        </linearGradient>
      </defs>

      {/* ── PHYSICAL window (fixed geometry) ── */}
      {/* dark-gray satin molded bezel */}
      <rect x={x} y={y} width={w} height={h} rx="5" fill={`url(#${bezelId})`} stroke="#1a1a1a" strokeWidth="1" />
      {/* recessed light periwinkle window (per the manufacturer photo) */}
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx="3" fill="#9296c6" stroke="#5a5d8c" strokeWidth="1" />
      {/* subtle inner top shadow (recess) + minimal satin highlight */}
      <rect x={x + 4} y={y + 4} width={w - 8} height="12" rx="3" fill="#000000" opacity="0.18" pointerEvents="none" />
      <rect x={x + 3} y={y + 1} width={w - 6} height="4" rx="2" fill="#ffffff" opacity="0.05" pointerEvents="none" />

      {/* ── REACT status display (only this changes) ── */}
      <g id="code_readiness_content" pointerEvents="none">
        {flashing && status !== 'blank' && (
          <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
        )}
        {status === 'ready' && (
          <path d={checkPath} fill="none" stroke="#00ff66" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {status === 'notReady' && (
          <path d={xPath} fill="none" stroke="#ff3830" strokeWidth="11" strokeLinecap="round" />
        )}
        {status === 'testing' && (
          <circle cx={cx} cy={cy} r="15" fill="none" stroke="#ffb84d" strokeWidth="5" strokeLinecap="round" strokeDasharray="68 34">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    </g>
  )
}
