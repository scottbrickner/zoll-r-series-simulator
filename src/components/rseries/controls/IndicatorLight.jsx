/**
 * Indicator Light — reusable round lens indicator (Industrial Design Pass 2J).
 * Reconstructs the small AC-power / Battery status lenses that sit just left of
 * the Code Readiness window (master layer 16_LEDIndicators — AC · BATT). One
 * reusable physical lens serves both indicators; only the illumination differs.
 *
 * Two parts, kept strictly separate:
 *   • PHYSICAL lens (fixed geometry) — a thin gray molded rim, a recessed seat,
 *     and a translucent unlit lens with one restrained satin reflection. This is a
 *     molded plastic lens, NOT a web-style LED, and NO illumination is baked in.
 *   • REACT illumination (state only) — a coloured lit-lens overlay composited on
 *     top of the unlit lens. Never a large bloom/halo — the lens itself lights up.
 *
 * Returns a <g> (a part); the consumer supplies the enclosing <svg viewBox>.
 * The SVG geometry NEVER changes — React changes only the illumination.
 *
 * Manual behaviour (R Series) the consumer drives via `status`:
 *   • AC indicator      — illuminates green when connected to AC power.
 *   • Battery indicator — steady yellow = charging; steady green = charged;
 *                         alternating yellow/green = no battery or charging fault.
 *
 * Props:
 *   type      — 'ac' | 'battery' (semantic / accessible label; lens is identical).
 *   status    — 'off' | 'green' | 'yellow' | 'fault' | 'charging'.
 *               'charging' → steady yellow; 'fault' → alternating yellow/green.
 *   flashing  — pulse a steady lit lens (ignored for 'off' and 'fault').
 *   enabled   — false → muted/dimmed lens, illumination suppressed (disabled).
 *   cx, cy, r — center + rim radius (default 50, 50, 28).
 *   idPrefix  — unique gradient id prefix (needed when many render in one <svg>).
 */

// Lit-lens colour ramps (center highlight → saturated core → darker edge).
const LIT = {
  green: { hi: '#d9ffe0', core: '#35e055', edge: '#1f9a35' },
  yellow: { hi: '#fff4c2', core: '#ffd21e', edge: '#c9960a' },
}

export default function IndicatorLight({
  type = 'ac',
  status = 'off',
  flashing = false,
  enabled = true,
  cx = 50,
  cy = 50,
  r = 28,
  icon, // 'battery' | 'plug' → green rounded-rect icon indicator (per the R Series photo)
  idPrefix = 'il',
}) {
  // Icon-pill variant: a green glossy rounded-rect with a white battery/plug glyph.
  if (icon) {
    const w = r * 2.4
    const h = r * 1.7
    const x = cx - w / 2
    const y = cy - h / 2
    const on = enabled && status !== 'off'
    const gid = `${idPrefix}-pill`
    const glyph = icon === 'battery' ? (
      <g fill="none" stroke="#ffffff" strokeWidth={r * 0.11} strokeLinejoin="round">
        <rect x={cx - r * 0.62} y={cy - r * 0.4} width={r * 1.15} height={r * 0.8} rx={r * 0.12} />
        <line x1={cx + r * 0.6} y1={cy - r * 0.16} x2={cx + r * 0.6} y2={cy + r * 0.16} />
      </g>
    ) : (
      <g fill="#ffffff">
        {/* AC plug: two prongs + body */}
        <rect x={cx - r * 0.4} y={cy - r * 0.12} width={r * 0.8} height={r * 0.5} rx={r * 0.08} />
        <rect x={cx - r * 0.28} y={cy - r * 0.5} width={r * 0.14} height={r * 0.42} rx={r * 0.05} />
        <rect x={cx + r * 0.14} y={cy - r * 0.5} width={r * 0.14} height={r * 0.42} rx={r * 0.05} />
        <rect x={cx - r * 0.08} y={cy + r * 0.34} width={r * 0.16} height={r * 0.34} rx={r * 0.05} />
      </g>
    )
    return (
      <g id="indicator_light" role="img" aria-label={`${type === 'battery' ? 'Battery' : 'AC power'} indicator — ${on ? status : 'off'}`} opacity={enabled ? 1 : 0.5}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={on ? LIT.green.hi : '#c3c5c0'} />
            <stop offset="0.5" stopColor={on ? LIT.green.core : '#a9aba6'} />
            <stop offset="1" stopColor={on ? LIT.green.edge : '#8b8d88'} />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={w} height={h} rx={r * 0.3} fill={`url(#${gid})`} stroke={on ? LIT.green.edge : '#7d7f7a'} strokeWidth="1" />
        {glyph}
        {/* glossy top highlight */}
        <rect x={x + 2} y={y + 2} width={w - 4} height={h * 0.4} rx={r * 0.22} fill="#ffffff" opacity="0.22" pointerEvents="none" />
      </g>
    )
  }
  const dim = !enabled
  const rimId = `${idPrefix}-rim`
  const lensId = `${idPrefix}-lens`
  const grnId = `${idPrefix}-grn`
  const ylwId = `${idPrefix}-ylw`

  const rRecess = r * 0.82
  const rLens = r * 0.75

  // 'charging' is steady yellow; 'fault' alternates; everything else is literal.
  const lit = dim || status === 'off' ? null : status === 'fault' ? 'fault' : status === 'charging' ? 'yellow' : status
  const label = type === 'battery' ? 'Battery indicator' : 'AC power indicator'

  // One lit-lens overlay for a given colour ramp (radial fill + thin lit rim).
  const LitLens = ({ ramp, gid }) => (
    <>
      <circle cx={cx} cy={cy} r={rLens} fill={`url(#${gid})`} />
      {/* thin brighter lit rim — reads as an illuminated lens edge, not a halo */}
      <circle cx={cx} cy={cy} r={rLens} fill="none" stroke={ramp.hi} strokeOpacity="0.5" strokeWidth={r * 0.05} />
    </>
  )

  return (
    <g id="indicator_light" role="img" aria-label={`${label} — ${dim ? 'disabled' : status}`} opacity={dim ? 0.5 : 1}>
      <defs>
        <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d0d2cd" />
          <stop offset="1" stopColor="#a7a9a4" />
        </linearGradient>
        <radialGradient id={lensId} cx="0.42" cy="0.38" r="0.78">
          <stop offset="0" stopColor="#dfe1dc" />
          <stop offset="0.55" stopColor="#c3c5c0" />
          <stop offset="1" stopColor="#9a9c97" />
        </radialGradient>
        <radialGradient id={grnId} cx="0.5" cy="0.46" r="0.62">
          <stop offset="0" stopColor={LIT.green.hi} />
          <stop offset="0.55" stopColor={LIT.green.core} />
          <stop offset="1" stopColor={LIT.green.edge} />
        </radialGradient>
        <radialGradient id={ylwId} cx="0.5" cy="0.46" r="0.62">
          <stop offset="0" stopColor={LIT.yellow.hi} />
          <stop offset="0.55" stopColor={LIT.yellow.core} />
          <stop offset="1" stopColor={LIT.yellow.edge} />
        </radialGradient>
      </defs>

      {/* ── PHYSICAL lens (fixed geometry) ── */}
      {/* molded side depth */}
      <circle cx={cx} cy={cy + r * 0.05} r={r} fill={dim ? '#bcbeb9' : '#b6b8b3'} />
      {/* thin gray molded rim / bezel */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${rimId})`} stroke="#9a9c97" strokeWidth="1" />
      {/* recessed lens seat */}
      <circle cx={cx} cy={cy} r={rRecess} fill="#8b8d88" />
      {/* translucent unlit lens */}
      <circle cx={cx} cy={cy} r={rLens} fill={`url(#${lensId})`} />

      {/* ── REACT illumination (only this changes) ── */}
      {lit === 'green' && (
        <g pointerEvents="none">
          {flashing && <animate attributeName="opacity" values="1;0.22;1" dur="0.7s" repeatCount="indefinite" />}
          <LitLens ramp={LIT.green} gid={grnId} />
        </g>
      )}
      {lit === 'yellow' && (
        <g pointerEvents="none">
          {flashing && <animate attributeName="opacity" values="1;0.22;1" dur="0.7s" repeatCount="indefinite" />}
          <LitLens ramp={LIT.yellow} gid={ylwId} />
        </g>
      )}
      {lit === 'fault' && (
        <g pointerEvents="none">
          {/* alternating yellow/green — one fully on while the other is off */}
          <g>
            <animate attributeName="opacity" values="1;0" keyTimes="0;0.5" dur="1.2s" calcMode="discrete" repeatCount="indefinite" />
            <LitLens ramp={LIT.green} gid={grnId} />
          </g>
          <g opacity="0">
            <animate attributeName="opacity" values="0;1" keyTimes="0;0.5" dur="1.2s" calcMode="discrete" repeatCount="indefinite" />
            <LitLens ramp={LIT.yellow} gid={ylwId} />
          </g>
        </g>
      )}

      {/* ── restrained satin reflection (physical; sits over the lit lens) ── */}
      <ellipse cx={cx - r * 0.25} cy={cy - r * 0.27} rx={r * 0.27} ry={r * 0.16} fill="#ffffff" opacity={dim ? 0.28 : 0.4} pointerEvents="none" />
      {/* inner rim shadow (recess depth) */}
      <circle cx={cx} cy={cy} r={rLens} fill="none" stroke="#000000" strokeOpacity="0.12" strokeWidth="1.5" pointerEvents="none" />
    </g>
  )
}
