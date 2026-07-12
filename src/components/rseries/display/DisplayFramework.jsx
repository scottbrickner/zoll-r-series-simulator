/**
 * DisplayFramework — the permanent FIRMWARE SKELETON (Package 4A).
 *
 * A reconstruction of the ZOLL R Series firmware LCD layout in the locked 673 × 515
 * logical space — the operating-system layout every future screen and widget fits
 * inside. It renders like a firmware screenshot with all dynamic values removed:
 * thin hairline rules, a narrow left parameter column of thin-divider modules, a
 * compressed top status band that hugs the top, ONE continuous waveform field with
 * three baseline reference lines (ECG / Pleth / CO₂), a time / readout row, and a
 * LABEL-ONLY softkey strip (no button chrome). It is NOT a dashboard.
 *
 * Layout only — NO waveforms, NO vitals, NO patient data, NO messages, NO logic.
 * Static chrome (parameter labels, channel tags, softkey labels) stays; dynamic
 * values are shown as dim placeholders. Each region is exposed as an injection SLOT.
 *
 * Returns a <g> in 673 × 515 space; the consumer supplies the enclosing <svg>.
 *
 * Props:
 *   mode         — 'clean' (firmware skeleton) | 'debug' (region overlay). Default 'clean'.
 *   showChrome   — draw the firmware chrome (rules, labels, baselines). Default true.
 *   showPlaceholders — draw the dim dynamic value stand-ins (SpO₂/NIBP/CO₂/clock/HR/
 *                  readouts/softkey labels). Default true. Set false when live widgets
 *                  fill the slots so the placeholders don't show through.
 *   showBackground — draw the LCD glass (set false to overlay another render). Default true.
 *   showRegions  — draw the coloured region boxes (default: on in debug).
 *   showNames    — region name labels in the overlay (default true).
 *   showCoords   — per-region x,y·w×h in the overlay (default: on in debug).
 *   slots        — { [regionId]: ReactNode } injected content, clipped to bounds.
 *   idPrefix     — unique clipPath id prefix.
 */
import { lcd, anchors, waveform, phosphor, frame, displayType, LAYERS, debugColors, lcdBoundaryColor } from './DisplayLayoutTokens'
import { REGIONS, regionsInLayer, childRegions } from './DisplayRegions'

const T = displayType.family
const DIV = anchors.paramDividerX
const TOP = anchors.topRuleY
const WB = waveform.bottom
const SK = anchors.softkeyRuleY
const COLS = anchors.softkeyColumns
const PITCH = anchors.softkeyPitch
const SOFTKEYS = ['Options', 'Param', 'Code Marker', 'Report Data', 'Alarms', 'Sync On/Off']

/** The firmware chrome — the skeleton drawn as thin lines + static labels.
 *  `ph` gates the dim dynamic value stand-ins (off when live widgets fill the slots). */
function SkeletonChrome({ ph = true }) {
  const L = frame.label
  const P = frame.placeholder
  const R = frame.rule
  return (
    <g fontFamily={T}>
      {/* ── firmware hairline rules ── */}
      <g stroke={R} strokeWidth="1">
        <line x1={DIV} y1="0" x2={DIV} y2={WB} /> {/* left column divider */}
        <line x1={DIV} y1={TOP} x2={lcd.width} y2={TOP} /> {/* under top status */}
        <line x1="0" y1={TOP} x2={DIV} y2={TOP} /> {/* SpO₂ module bottom */}
        <line x1="0" y1="232" x2={DIV} y2="232" /> {/* NIBP | CO₂ divider */}
        <line x1="0" y1={WB} x2={lcd.width} y2={WB} /> {/* above readout row */}
        <line x1="0" y1={SK} x2={lcd.width} y2={SK} /> {/* above softkeys */}
      </g>

      {/* ── left parameter column: static unit labels (+ value placeholders) ── */}
      <g>
        <text x="8" y="24" fill={phosphor.cyan} fillOpacity="0.75" fontSize="16">SpO₂ %</text>
        <text x="8" y="152" fill={L} fontSize="15">NIBP <tspan fontSize="11">mmHg</tspan></text>
        <text x="8" y="272" fill={phosphor.amber} fillOpacity="0.65" fontSize="15">CO₂ <tspan fontSize="11">mmHg</tspan></text>
        {ph && (
          <g fill={P}>
            <text x="12" y="66" fontSize="30">- - -</text>
            <text x="12" y="186" fontSize="22">- - -</text>
            <text x="12" y="306" fontSize="24">- -</text>
            <text x="12" y="336" fontSize="14">RR - -</text>
          </g>
        )}
      </g>

      {/* ── compressed top status band: static furniture (+ placeholders) ── */}
      <g>
        {/* mode / status placeholders (elapsed-time clock is in the readout row, not here) */}
        {ph && (
          <g>
            <text x={DIV + 8} y="30" fill={L} fontSize="13">MODE</text>
            <text x={DIV + 8} y="66" fill={P} fontSize="26">- - - -</text>
          </g>
        )}
        {/* CPR release bar + PPI diamond outlines (firmware furniture — always) */}
        <text x="304" y="22" fill={L} fontSize="12">CPR</text>
        <rect x="304" y="30" width="12" height="42" fill="none" stroke={R} strokeWidth="1" />
        <path d="M360,32 L382,52 L360,72 L338,52 Z" fill="none" stroke={R} strokeWidth="1" />
        <text x="300" y="88" fill={L} fontSize="10">Release</text>
        <text x="352" y="88" fill={L} fontSize="10">PPI</text>
        {/* lead / gain / heart / HR placeholders */}
        {ph && (
          <g>
            <text x="458" y="22" fill={phosphor.green} fillOpacity="0.7" fontSize="13">ECG</text>
            <text x="458" y="42" fill={L} fontSize="12">II</text>
            <text x="486" y="42" fill={L} fontSize="12">x1</text>
            <text x="524" y="24" fill={L} fontSize="14">♥</text>
            <text x="664" y="72" textAnchor="end" fill={P} fontSize="46">- -</text>
          </g>
        )}
      </g>

      {/* ── continuous waveform field: three thin baselines (structure) ── */}
      <g>
        {Object.entries(waveform.baselines).map(([k, y]) => (
          <line key={k} x1={DIV + 6} y1={y} x2={lcd.width - 6} y2={y} stroke={frame.ruleDim} strokeWidth="1" strokeDasharray="3 4" />
        ))}
        {/* default channel tags — placeholders; the waveform widget draws mode-specific
            tags (e.g. PADS / FIL in DEFIB / CPR) when it fills the slot */}
        {ph && (
          <g>
            <text x={DIV + 6} y={waveform.baselines.ecg - 30} fill={phosphor.green} fillOpacity="0.7" fontSize="13">ECG</text>
            <text x={DIV + 6} y={waveform.baselines.pleth - 30} fill={phosphor.cyan} fillOpacity="0.6" fontSize="13">Pleth</text>
            <text x={DIV + 6} y={waveform.baselines.co2 - 30} fill={phosphor.amber} fillOpacity="0.6" fontSize="13">CO₂</text>
          </g>
        )}
      </g>

      {/* ── time / readout row: time at far left + readout placeholders ── */}
      {ph && (
        <g fill={P}>
          <text x="8" y={WB + 30} fontSize="18">--:--</text>
          <text x="300" y={WB + 30} fontSize="16">- - -</text>
          <text x="470" y={WB + 30} fontSize="16">- - -</text>
        </g>
      )}

      {/* ── softkey strip: thin column separators (+ default labels) ── */}
      <g>
        {Array.from({ length: COLS - 1 }, (_, i) => (
          <line key={i} x1={(i + 1) * PITCH} y1={SK + 4} x2={(i + 1) * PITCH} y2={lcd.height - 3} stroke={frame.rule} strokeWidth="1" />
        ))}
        {ph &&
          SOFTKEYS.map((label, i) => (
            <text key={i} x={i * PITCH + PITCH / 2} y={SK + 32} textAnchor="middle" fill={frame.labelBright} fontSize="12">
              {label}
            </text>
          ))}
      </g>
    </g>
  )
}

/** A single region box for the DEBUG overlay. */
function RegionBox({ region, showNames, showCoords, slot, clipId }) {
  const { x, y, w, h } = region.rect
  const overlay = region.layer === LAYERS.OVERLAY
  const nested = !!region.parent
  const container = childRegions(region.id).length > 0
  const col = debugColors[region.id] || '#8fd9bb'
  const small = h <= 24
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={slot ? 'none' : col}
        fillOpacity={slot ? 0 : overlay ? 0.12 : nested ? 0.16 : 0.1}
        stroke={col}
        strokeWidth={nested ? 1.25 : 2}
        strokeDasharray={overlay ? '5 3' : nested ? '2 2' : 'none'}
        rx="1"
      />
      {slot ? (
        <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(${x} ${y})`}>{slot}</g>
        </g>
      ) : (
        <>
          {showNames && (
            <text x={container ? x + w - 5 : x + 5} y={y + (small ? h / 2 + 4 : 13)} textAnchor={container ? 'end' : 'start'} fontFamily={T} fontSize={small ? displayType.hintSize : displayType.nameSize} fontWeight="700" fill={col}>
              {region.name}
            </text>
          )}
          {showCoords && !small && (
            <text x={x + 5} y={y + 24} fontFamily={T} fontSize={displayType.coordSize} fill={col} fillOpacity="0.75">
              {x},{y}·{w}×{h}
            </text>
          )}
        </>
      )}
    </g>
  )
}

export default function DisplayFramework({
  mode = 'clean',
  showChrome = true,
  showPlaceholders = true,
  showBackground = true,
  showRegions,
  showNames = true,
  showCoords,
  slots = {},
  idPrefix = 'df',
}) {
  const debug = mode === 'debug'
  const regionsOn = showRegions ?? debug
  const coords = showCoords ?? debug
  const persistent = regionsInLayer(LAYERS.REGION)
  const overlay = regionsInLayer(LAYERS.OVERLAY)
  const hasSlots = Object.keys(slots).length > 0

  return (
    <g className="display-framework">
      {showBackground && <rect x="0" y="0" width={lcd.width} height={lcd.height} fill={frame.background} />}

      {showChrome && <SkeletonChrome ph={showPlaceholders} />}

      {/* injected content (clipped per region) — even without the debug overlay */}
      {!regionsOn && hasSlots &&
        REGIONS.filter((r) => slots[r.id]).map((r) => (
          <g key={r.id} clipPath={`url(#${idPrefix}-clip-${r.id})`}>
            <defs>
              <clipPath id={`${idPrefix}-clip-${r.id}`}>
                <rect x={r.rect.x} y={r.rect.y} width={r.rect.w} height={r.rect.h} />
              </clipPath>
            </defs>
            <g transform={`translate(${r.rect.x} ${r.rect.y})`}>{slots[r.id]}</g>
          </g>
        ))}

      {/* debug region overlay */}
      {regionsOn && (
        <>
          {persistent.map((r) => (
            <RegionBox key={r.id} region={r} showNames={showNames} showCoords={coords} slot={slots[r.id]} clipId={`${idPrefix}-clip-${r.id}`} />
          ))}
          {overlay.map((r) => (
            <RegionBox key={r.id} region={r} showNames={showNames} showCoords={coords} slot={slots[r.id]} clipId={`${idPrefix}-clip-${r.id}`} />
          ))}
          <rect x="1" y="1" width={lcd.width - 2} height={lcd.height - 2} fill="none" stroke={lcdBoundaryColor} strokeWidth="2" />
        </>
      )}
    </g>
  )
}
