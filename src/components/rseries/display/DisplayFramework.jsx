/**
 * DisplayFramework — the reusable FIRMWARE LCD OPERATING FRAMEWORK (Package 4).
 *
 * A traced reconstruction of the firmware LCD layout (see `DisplayRegions.js`) in the
 * locked 673 × 515 logical space — NOT a modern dashboard. It renders the LCD glass,
 * the firmware hairline rules, and every fixed region as a labeled placeholder:
 *   • a narrow left parameter column,
 *   • a tightly packed top status strip,
 *   • ONE continuous waveform plotting area (no boxed lanes),
 *   • a value / readout row,
 *   • a firmware softkey strip (thin column rules + centered labels, NO buttons),
 *   • therapy / alarm messages as transient overlays within the waveform area.
 *
 * It carries NO patient data, NO waveforms, NO values, and NO simulator logic — only
 * labeled placeholders. Each region is exposed as an injection SLOT so React can
 * LATER render real content clipped to its bounds. It modifies no locked asset.
 *
 * Returns a <g> in 673 × 515 space; the consumer supplies the enclosing <svg
 * viewBox="0 0 673 515">.
 *
 * Props:
 *   mode           — 'clean' | 'debug' (default 'clean').
 *                    • clean — subtle firmware skeleton: rules + faint region
 *                              boundaries + names + inject hints.
 *                    • debug — high-contrast colour per region, semi-transparent
 *                              fills, bold outlines, names + coordinates, LCD boundary.
 *   showBoundaries — draw region boundary rectangles (default true).
 *   showNames      — draw region name labels (default true).
 *   showHints      — draw the "inject: …" hints (default true; auto-off in debug).
 *   showStructure  — draw the firmware hairline rules (default true).
 *   showCoords     — draw per-region x,y·w×h (default: on in debug).
 *   slots          — { [regionId]: ReactNode } injected content, clipped to bounds.
 *   idPrefix       — unique clipPath id prefix.
 */
import { lcd, anchors, frame, displayType, LAYERS, debugColors, lcdBoundaryColor } from './DisplayLayoutTokens'
import { regionsInLayer, childRegions } from './DisplayRegions'

function RegionBox({ region, mode, showBoundaries, showNames, showHints, showCoords, slot, clipId }) {
  const { x, y, w, h } = region.rect
  const overlay = region.layer === LAYERS.OVERLAY
  const nested = !!region.parent
  const debug = mode === 'debug'
  const container = childRegions(region.id).length > 0

  const col = debugColors[region.id] || frame.regionStroke
  const stroke = debug ? col : overlay ? frame.overlayStroke : nested ? frame.nestedStroke : frame.regionStroke
  const fill = debug ? col : overlay ? frame.overlayFill : frame.regionFill
  const fillOpacity = debug ? (overlay ? 0.13 : nested ? 0.2 : 0.15) : nested ? 0.3 : 0.5
  const strokeWidth = debug ? (nested ? 1.25 : 2) : nested ? 0.6 : 1
  const dash = overlay ? '5 3' : nested ? '2 2' : 'none'
  const nameFill = debug ? col : frame.name
  const small = h <= 22

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>

      {showBoundaries && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={slot ? 'none' : fill}
          fillOpacity={slot ? 0 : fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          rx={nested ? 1 : 2}
        />
      )}

      {slot ? (
        <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(${x} ${y})`}>{slot}</g>
        </g>
      ) : (
        <>
          {showNames && (
            <text
              x={container ? x + w - 5 : x + 5}
              y={y + (small ? h / 2 + 4 : 14)}
              textAnchor={container ? 'end' : 'start'}
              fontFamily={displayType.family}
              fontSize={small ? displayType.hintSize : displayType.nameSize}
              fontWeight="700"
              fill={nameFill}
            >
              {region.name}
            </text>
          )}
          {showCoords && !small && (
            <text x={x + 5} y={y + 25} fontFamily={displayType.family} fontSize={displayType.coordSize} fill={nameFill} fillOpacity="0.75">
              {x},{y}·{w}×{h}
            </text>
          )}
          {showHints && !debug && h > 40 && region.injects?.length > 0 && (
            <text x={x + w / 2} y={y + h - 7} textAnchor="middle" fontFamily={displayType.family} fontSize={displayType.hintSize} fill={frame.hint}>
              inject: {region.injects.join(' · ')}
            </text>
          )}
        </>
      )}
    </g>
  )
}

export default function DisplayFramework({
  mode = 'clean',
  showBoundaries = true,
  showNames = true,
  showHints = true,
  showStructure = true,
  showBackground = true,
  showCoords,
  slots = {},
  idPrefix = 'df',
}) {
  const debug = mode === 'debug'
  const coords = showCoords ?? debug
  const cols = anchors.softkeyColumns
  const pitch = anchors.softkeyPitch

  const persistent = regionsInLayer(LAYERS.REGION)
  const overlay = regionsInLayer(LAYERS.OVERLAY)

  const renderRegion = (region) => (
    <RegionBox
      key={region.id}
      region={region}
      mode={mode}
      showBoundaries={showBoundaries}
      showNames={showNames}
      showHints={showHints}
      showCoords={coords}
      slot={slots[region.id]}
      clipId={`${idPrefix}-clip-${region.id}`}
    />
  )

  return (
    <g className="display-framework">
      {/* ── BASE: LCD glass (skipped when overlaying another render) ── */}
      {showBackground && <rect x="0" y="0" width={lcd.width} height={lcd.height} fill={frame.background} />}

      {/* ── STRUCTURE: firmware hairline rules ── */}
      {showStructure && (
        <g stroke={frame.rule} strokeWidth="1">
          {/* left parameter-column divider */}
          <line x1={anchors.paramDividerX} y1="0" x2={anchors.paramDividerX} y2="452" />
          {/* under the top status strip */}
          <line x1={anchors.paramDividerX} y1={anchors.topRuleY} x2={lcd.width} y2={anchors.topRuleY} />
          {/* above the softkey strip */}
          <line x1="0" y1={anchors.softkeyRuleY} x2={lcd.width} y2={anchors.softkeyRuleY} />
          {/* firmware softkey column rules (no button chrome) */}
          {Array.from({ length: cols - 1 }, (_, i) => (
            <line key={i} x1={(i + 1) * pitch} y1={anchors.softkeyRuleY + 3} x2={(i + 1) * pitch} y2={lcd.height - 2} />
          ))}
        </g>
      )}

      {/* ── REGION layer (persistent) ── */}
      {persistent.map(renderRegion)}

      {/* ── OVERLAY layer (transient, on top) ── */}
      {overlay.map(renderRegion)}

      {/* ── LCD outer boundary highlight (debug) ── */}
      {debug && <rect x="1" y="1" width={lcd.width - 2} height={lcd.height - 2} fill="none" stroke={lcdBoundaryColor} strokeWidth="2" />}
    </g>
  )
}
