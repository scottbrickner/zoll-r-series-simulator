/**
 * Energy Select — reusable warm-beige molded control (Industrial Design Pass 2C,
 * refined 2C.1 to match the manufacturer screenshot).
 *
 * A vertical rocker-style control, NOT a generic push button:
 *   ▲ (red) / ENERGY / SELECT / ▼ (red)
 * The content block is vertically CENTERED with balanced spacing and larger solid
 * red triangles, matching the manufacturer photo. Per the real device, the
 * selected energy is shown on the LCD, not on the button face — so no numeric
 * value is printed on the button.
 *
 * Returns a <g> (a part); the consumer supplies the enclosing <svg viewBox>.
 * The GEOMETRY (footprint 96×150, corner radius 16), the plastic colour system,
 * and the bevel/side-edge never change. React changes only pressed, enabled, and
 * highlighted state.
 *
 * Props:
 *   x, y, w, h  — footprint (approved design: 96 x 150).
 *   energyValue — retained for API compatibility / labelling (the real device
 *   energyUnits   shows this on the LCD; it is NOT printed on the button face).
 *   pressed     — pushed-in (darker beige + deeper lower shadow).
 *   enabled     — false → dimmed / disabled.
 *   highlighted — subtle emphasis ring (e.g. the active energy).
 *   onClick     — optional; makes it a hit target.
 *   idPrefix    — unique gradient id prefix (many instances per <svg>).
 */
const RX = 16 // larger molded corner radius (vs the Function Button's 9) — LOCKED
const AW = 30 // triangle width (enlarged to match the reference)
const AH = 22 // triangle height (enlarged to match the reference)

export default function EnergySelect({
  x = 0,
  y = 0,
  w = 96,
  h = 150,
  // eslint-disable-next-line no-unused-vars
  energyValue,
  // eslint-disable-next-line no-unused-vars
  energyUnits = 'J',
  pressed = false,
  enabled = true,
  highlighted = false,
  onClick,
  idPrefix = 'es',
}) {
  const faceId = `${idPrefix}-face`
  const hiId = `${idPrefix}-hi`
  const lowId = `${idPrefix}-low`
  const cx = x + w / 2
  const cy = y + h / 2 // content is centered on the button centre
  const dy = pressed ? 3 : 0
  const dim = !enabled

  // warm-beige palette (dim = desaturated when disabled) — LOCKED colour system
  const edge = dim ? '#c1beb4' : '#c9bd9c'
  const stroke = dim ? '#bdbab0' : '#bdb49d'
  const red = dim ? '#b3a89a' : '#cf2a20' // triangles
  const redText = dim ? '#aca596' : '#c4231a' // ENERGY / SELECT

  // centered content block: ▲ (apex cy-48, base cy-26) / ENERGY / SELECT / ▼
  const up = `M${cx},${cy - 48} L${cx + AW / 2},${cy - 26} L${cx - AW / 2},${cy - 26} Z`
  const down = `M${cx},${cy + 48} L${cx + AW / 2},${cy + 26} L${cx - AW / 2},${cy + 26} Z`

  return (
    <g id="energy_select_button" className={onClick ? 'rs-hit' : undefined} onClick={onClick}
      opacity={dim ? 0.72 : 1}>
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          {dim ? (
            <>
              <stop offset="0" stopColor="#ece7da" />
              <stop offset="0.5" stopColor="#e2ddce" />
              <stop offset="1" stopColor="#d3cdbc" />
            </>
          ) : pressed ? (
            <>
              <stop offset="0" stopColor="#e6dcc2" />
              <stop offset="1" stopColor="#cabd99" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#f3ecda" />
              <stop offset="0.5" stopColor="#e8dcc0" />
              <stop offset="1" stopColor="#d8c9a6" />
            </>
          )}
        </linearGradient>
        {/* very slight satin sheen (not glossy) */}
        <linearGradient id={hiId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* pressed: shadow pooling toward the lower edge */}
        <linearGradient id={lowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* highlighted: subtle warm emphasis ring */}
      {highlighted && (
        <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={RX + 3} fill="none" stroke="#e0a92b" strokeWidth="2.5" opacity="0.9" />
      )}

      {/* deeper molded side edge (depth beneath the face) — LOCKED */}
      <rect x={x} y={y + 4} width={w} height={h} rx={RX} fill={edge} />

      {/* molded satin face — seats down when pressed */}
      <g transform={dy ? `translate(0 ${dy})` : undefined}>
        <rect x={x} y={y} width={w} height={h} rx={RX} fill={`url(#${faceId})`} stroke={stroke} strokeWidth="1" />
        {!pressed && (
          <rect x={x + 4} y={y + 3} width={w - 8} height={Math.round(h * 0.3)} rx={RX - 4} fill={`url(#${hiId})`} pointerEvents="none" />
        )}
        {pressed && (
          <rect x={x + 3} y={y + h - 22} width={w - 6} height="19" rx={RX - 6} fill={`url(#${lowId})`} pointerEvents="none" />
        )}

        {/* up triangle (flat printed red, enlarged) */}
        <path d={up} fill={red} pointerEvents="none" />

        {/* ENERGY / SELECT — red uppercase, compact, centered */}
        <text x={cx} y={cy - 7} textAnchor="middle" fill={redText} fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif" fontSize="15" fontWeight="800" letterSpacing="0.2" pointerEvents="none">ENERGY</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={redText} fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif" fontSize="15" fontWeight="800" letterSpacing="0.2" pointerEvents="none">SELECT</text>

        {/* down triangle (flat printed red, enlarged) */}
        <path d={down} fill={red} pointerEvents="none" />
      </g>
    </g>
  )
}
