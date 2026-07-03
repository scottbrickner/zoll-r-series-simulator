/**
 * Therapy Button family — reusable molded therapy controls (Industrial Design
 * Pass 2D, finalized 2D.1). ONE component, two variants:
 *
 *   variant 'action' → small warm-peach molded rectangular button with a red
 *     uppercase label (ANALYZE, CHARGE). Footprint matches the locked master
 *     layer 09 (94 × 58, corner radius 6).
 *   variant 'shock'  → molded orange circular button (SHOCK) — satin finish,
 *     shallow recessed centre, subtle molded outer lip, reduced gloss. NOT an
 *     arcade/glowing button. Radius 46 per the master.
 *
 * ── PHYSICAL vs BEHAVIOUR ────────────────────────────────────────────────────
 * The button geometry/material is the PHYSICAL control. The SHOCK charged-ready
 * illumination is BEHAVIOUR: a **separate React-controlled glow overlay layer**
 * (`shockReady`) — it is NOT baked into the physical button or the SVG asset. The
 * glow extinguishes immediately when pressed or disabled.
 *
 * Returns a <g> (a part); the consumer supplies the enclosing <svg viewBox>.
 * Factory-new satin molded plastic, minimal shadows.
 *
 * Props:
 *   variant    — 'action' | 'shock'.
 *   label      — action label (e.g. 'ANALYZE'); ignored for 'shock'.
 *   x, y, w, h — action footprint (default 94 × 58).
 *   cx, cy, r  — shock circle (default r 46).
 *   pressed    — pushed-in state (glow extinguishes).
 *   enabled    — false → dimmed / disabled (no glow).
 *   shockReady — shock only: overlay the charged-ready glow (soft pulsing halo).
 *   glowOnly   — shock only: render ONLY the glow overlay (for the review demo).
 *   onClick    — optional; makes it a hit target.
 *   idPrefix   — unique gradient id prefix (many instances per <svg>).
 */
const RX = 6

export default function TherapyButton({
  variant = 'action',
  label = '',
  x = 0,
  y = 0,
  w = 94,
  h = 58,
  cx = 58,
  cy = 58,
  r = 46,
  pressed = false,
  enabled = true,
  shockReady = false,
  glowOnly = false,
  onClick,
  idPrefix = 'tb',
}) {
  const dim = !enabled
  const hit = onClick ? 'rs-hit' : undefined

  // ---- SHOCK: physical molded orange button + separate glow overlay ----
  if (variant === 'shock') {
    const faceId = `${idPrefix}-sf`
    const recessId = `${idPrefix}-rc`
    const glowId = `${idPrefix}-gl`
    const dy = pressed ? 2 : 0
    // glow is BEHAVIOUR — only while charged-ready, not pressed, not disabled
    const showGlow = glowOnly || (shockReady && !pressed && enabled)
    const face = dim
      ? ['#d8c1a8', '#c8b096']
      : pressed
        ? ['#dd6f16', '#c8620f']
        : ['#ef8636', '#dd6f16']
    const rim = dim ? '#b3a08c' : '#a8540b'
    const edge = dim ? '#bda78f' : '#c2600d'
    const lip = dim ? '#d9c3ac' : '#f5a45c'
    return (
      <g id="shock_button" className={hit} onClick={onClick} opacity={dim ? 0.72 : 1}>
        <defs>
          <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={face[0]} />
            <stop offset="1" stopColor={face[1]} />
          </linearGradient>
          {/* shallow recessed centre */}
          <radialGradient id={recessId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="0.65" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {/* charged-ready glow bloom (React overlay only) */}
          <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.42" stopColor="#ffb15a" stopOpacity="0.9" />
            <stop offset="0.72" stopColor="#ff8a2e" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ff8a2e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── separate glow overlay layer (behind the button) ── */}
        {showGlow && (
          <g id="shock_glow" pointerEvents="none">
            <circle cx={cx} cy={cy} r={r + 18} fill={`url(#${glowId})`}>
              <animate attributeName="opacity" values="0.9;0.45;0.9" dur="1.3s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* ── physical molded button (unchanged by behaviour) ── */}
        {!glowOnly && (
          <>
            {/* molded side edge (depth) */}
            <circle cx={cx} cy={cy + 3} r={r} fill={edge} />
            <g transform={dy ? `translate(0 ${dy})` : undefined}>
              <circle cx={cx} cy={cy} r={r} fill={`url(#${faceId})`} stroke={rim} strokeWidth="2.5" />
              {/* subtle molded outer lip */}
              <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke={lip} strokeOpacity="0.35" strokeWidth="2" />
              {/* shallow recessed centre */}
              <circle cx={cx} cy={cy} r={r * 0.66} fill={`url(#${recessId})`} />
              {/* very reduced satin sheen (not a glossy hotspot) */}
              {!pressed && <ellipse cx={cx} cy={cy - r * 0.34} rx={r * 0.5} ry={r * 0.2} fill="#ffffff" opacity="0.07" pointerEvents="none" />}
              {/* pressed: deeper lower shadow */}
              {pressed && <ellipse cx={cx} cy={cy + r * 0.42} rx={r * 0.72} ry={r * 0.34} fill="#000000" opacity="0.16" pointerEvents="none" />}
            </g>
          </>
        )}
      </g>
    )
  }

  // ---- ANALYZE / CHARGE: warm-peach molded rectangle, red label ----
  const faceId = `${idPrefix}-af`
  const hiId = `${idPrefix}-ah`
  const lowId = `${idPrefix}-al`
  const dy = pressed ? 2 : 0
  const edge = dim ? '#d8cdba' : '#e3c9a6'
  const stroke = dim ? '#cdc2b0' : '#d8bfa0'
  const textCol = dim ? '#ad9a8b' : '#c4231a'
  const ccx = x + w / 2

  return (
    <g id="therapy_button" className={hit} onClick={onClick} opacity={dim ? 0.72 : 1}>
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          {dim ? (
            <>
              <stop offset="0" stopColor="#eee6da" />
              <stop offset="1" stopColor="#ddd2c0" />
            </>
          ) : pressed ? (
            <>
              <stop offset="0" stopColor="#eed9bd" />
              <stop offset="1" stopColor="#e3c9a2" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#fdf0e0" />
              <stop offset="0.5" stopColor="#f6e6d0" />
              <stop offset="1" stopColor="#f2dcc0" />
            </>
          )}
        </linearGradient>
        {/* minimal satin highlight (shallow molded bevel) */}
        <linearGradient id={hiId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* pressed: deeper lower shadow */}
        <linearGradient id={lowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.26" />
        </linearGradient>
      </defs>

      {/* darker peach molded side edge (depth beneath the face) */}
      <rect x={x} y={y + 3} width={w} height={h} rx={RX} fill={edge} />

      {/* molded peach face — seats down when pressed */}
      <g transform={dy ? `translate(0 ${dy})` : undefined}>
        <rect x={x} y={y} width={w} height={h} rx={RX} fill={`url(#${faceId})`} stroke={stroke} strokeWidth="1" />
        {!pressed && <rect x={x + 3} y={y + 2} width={w - 6} height={Math.round(h * 0.38)} rx={RX - 2} fill={`url(#${hiId})`} pointerEvents="none" />}
        {pressed && <rect x={x + 2} y={y + h - 15} width={w - 4} height="13" rx={RX - 2} fill={`url(#${lowId})`} pointerEvents="none" />}
        <text x={ccx} y={y + h / 2 + 6} textAnchor="middle" fill={textCol} fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif" fontSize="17" fontWeight="700" letterSpacing="0.2" pointerEvents="none">{label}</text>
      </g>
    </g>
  )
}
