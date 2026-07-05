import { Link } from 'react-router-dom'
import RSeriesLabel from '../components/rseries/typography/RSeriesLabel'
import RSeriesLCDText from '../components/rseries/typography/RSeriesLCDText'
import { fontFamily, fontSize, fontWeight, letterSpacing, color } from '../components/rseries/typography/typographyTokens'

/**
 * TEMPORARY Typography Library review (Package 3). Demonstrates the reusable
 * typography tokens and the two label primitives — RSeriesLabel (printed hardware
 * legends) and RSeriesLCDText (LCD-style screen text). Typography only: no device
 * assembly, no LCD framework, no simulator behaviour. Not part of the shipping app.
 */

const FACEPLATE = '#e5e6e2' // housing colour, for printed-legend chips
const LCD_BG = '#06120b' // dark phosphor screen, for LCD-text chips

/** A printed hardware legend on a faceplate chip. */
function PrintedChip({ caption, note, preset, text, lines, bg = FACEPLATE, w = 170, h = 72 }) {
  const two = lines && lines.length > 1
  const y = two ? h / 2 - 9 : h / 2
  return (
    <figure className="msc__griditem">
      <div className="artpreview__frame" style={{ aspectRatio: `${w} / ${h}` }}>
        <svg className="artpreview__layer" viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={caption}>
          <rect x="0" y="0" width={w} height={h} fill={bg} />
          <RSeriesLabel preset={preset} lines={lines} x={w / 2} y={y} dominantBaseline={two ? undefined : 'central'}>
            {text}
          </RSeriesLabel>
        </svg>
      </div>
      <figcaption><strong>{caption}</strong><span className="artpreview__file">{note || `preset="${preset}"`}</span></figcaption>
    </figure>
  )
}

/** An LCD-style label on a dark phosphor chip. */
function LcdChip({ caption, note, preset, text, lines, fill, size, w = 230, h = 72 }) {
  const two = lines && lines.length > 1
  const y = two ? h / 2 - 9 : h / 2
  return (
    <figure className="msc__griditem">
      <div className="artpreview__frame" style={{ aspectRatio: `${w} / ${h}` }}>
        <svg className="artpreview__layer" viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={caption}>
          <rect x="0" y="0" width={w} height={h} fill={LCD_BG} />
          <RSeriesLCDText preset={preset} lines={lines} fill={fill} size={size} x={w / 2} y={y} dominantBaseline={two ? undefined : 'central'}>
            {text}
          </RSeriesLCDText>
        </svg>
      </div>
      <figcaption><strong>{caption}</strong><span className="artpreview__file">{note || `preset="${preset}"`}</span></figcaption>
    </figure>
  )
}

/** The white softkey label strip along the bottom of the display. */
function SoftkeyStrip() {
  const keys = [
    ['Options'],
    ['Param'],
    ['Code', 'Marker'],
    ['Report', 'Data'],
    ['Alarms'],
    ['Sync', 'On/Off'],
    ['Async Pace', 'On/Off'],
  ]
  const W = 742
  const H = 96
  const pitch = W / keys.length
  return (
    <div className="artpreview__frame" style={{ aspectRatio: `${W} / ${H}`, maxWidth: '880px', margin: '0.4rem auto 0' }}>
      <svg className="artpreview__layer" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LCD softkey label strip">
        <rect x="0" y="0" width={W} height={H} fill={LCD_BG} />
        {/* separator rule above the softkey labels (as on the R Series display) */}
        <line x1="0" y1="10" x2={W} y2="10" stroke="#1c2a22" strokeWidth="1.5" />
        {keys.map((lines, i) => (
          <g key={i}>
            {i > 0 && <line x1={i * pitch} y1="14" x2={i * pitch} y2={H - 8} stroke="#14201a" strokeWidth="1" />}
            <RSeriesLCDText preset="softkey" lines={lines} x={i * pitch + pitch / 2} y={lines.length > 1 ? H / 2 - 6 : H / 2 + 2} dominantBaseline={lines.length > 1 ? undefined : 'central'} />
          </g>
        ))}
      </svg>
    </div>
  )
}

/** A compact token legend. */
function Tokens() {
  const rows = [
    ['fontFamily.printed', fontFamily.printed],
    ['fontFamily.lcd', fontFamily.lcd],
    ['fontSize', Object.entries(fontSize).map(([k, v]) => `${k} ${v}`).join(' · ')],
    ['fontWeight', Object.entries(fontWeight).map(([k, v]) => `${k} ${v}`).join(' · ')],
    ['letterSpacing', Object.entries(letterSpacing).map(([k, v]) => `${k} ${v}`).join(' · ')],
  ]
  const swatches = Object.entries(color)
  return (
    <div style={{ maxWidth: '880px', margin: '0.5rem auto 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} style={{ borderTop: '1px solid #2a2f36' }}>
              <td style={{ padding: '4px 10px 4px 0', color: '#9aa', whiteSpace: 'nowrap', verticalAlign: 'top' }}><code>{k}</code></td>
              <td style={{ padding: '4px 0', fontFamily: 'ui-monospace, monospace', color: '#cdd' }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
        {swatches.map(([k, hex]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#bcc' }}>
            <span style={{ width: 18, height: 18, borderRadius: 3, background: hex, border: '1px solid #0006', display: 'inline-block' }} />
            <code>{k}</code>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TypographyReview() {
  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Typography Review — Package 3</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__note">
        The reusable typography system for the ZOLL R Series: shared tokens
        (<code>typographyTokens.js</code>) plus two SVG label primitives —
        <code> RSeriesLabel</code> for <strong>printed hardware legends</strong>
        (compact, bold, device-like sans) and <code>RSeriesLCDText</code> for
        <strong> LCD-style screen text</strong> (monospaced phosphor, distinct from
        the housing legends). System-safe fonts only — no external font files.
        Typography only: this is not the LCD framework and not simulator behaviour,
        and it changes no locked asset.
      </p>

      <section className="ctrlreview__assembled">
        <h2>Design tokens</h2>
        <p className="artpreview__note">family · size · weight · letter-spacing · colour · line-height — the single source of truth both primitives read from.</p>
        <Tokens />
      </section>

      {/* ---------- Printed hardware labels ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Printed hardware labels</h2>
        <p className="artpreview__note">Housing legends on the faceplate — neutral bold sans, dark ink, slightly tracked. The mode legends carry their printed colour (MONITOR deliberately low-contrast, DEFIB red, PACER teal).</p>
        <div className="msc__grid msc__grid--3">
          <PrintedChip caption="LEAD" preset="control" text="LEAD" />
          <PrintedChip caption="SIZE" preset="control" text="SIZE" />
          <PrintedChip caption="ALARM SUSPEND" preset="control" lines={['ALARM', 'SUSPEND']} note="preset=control · 2 lines" />
          <PrintedChip caption="RECORDER" preset="control" text="RECORDER" />
          <PrintedChip caption="ENERGY SELECT" preset="controlSmall" lines={['ENERGY', 'SELECT']} note="preset=controlSmall · 2 lines" />
          <PrintedChip caption="MONITOR" preset="modeMonitor" text="MONITOR" />
          <PrintedChip caption="DEFIB" preset="modeDefib" text="DEFIB" />
          <PrintedChip caption="PACER" preset="modePacer" text="PACER" />
          <PrintedChip caption="OFF" preset="modeOff" text="OFF" />
        </div>
      </section>

      {/* ---------- Therapy labels ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Therapy labels</h2>
        <p className="artpreview__note">ANALYZE / CHARGE printed red; SHOCK is a heavy tracked light legend shown on its orange button.</p>
        <div className="msc__grid msc__grid--3">
          <PrintedChip caption="ANALYZE" preset="therapy" text="ANALYZE" />
          <PrintedChip caption="CHARGE" preset="therapy" text="CHARGE" />
          <PrintedChip caption="SHOCK" preset="shock" text="SHOCK" bg="#ef7d22" note="preset=shock · on orange" />
        </div>
      </section>

      {/* ---------- Pacer labels ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Pacer labels</h2>
        <p className="artpreview__note">Small tracked legends beneath the pacer knobs and the 4:1 button.</p>
        <div className="msc__grid msc__grid--3">
          <PrintedChip caption="OUTPUT mA" preset="controlSmall" text="OUTPUT mA" />
          <PrintedChip caption="RATE ppm" preset="controlSmall" text="RATE ppm" />
          <PrintedChip caption="4:1" preset="control" text="4:1" />
        </div>
      </section>

      {/* ---------- Indicator labels ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Indicator labels</h2>
        <p className="artpreview__note">The small gray legends above the AC power and Battery indicator lenses.</p>
        <div className="msc__grid msc__grid--3">
          <PrintedChip caption="AC" preset="indicator" text="AC" w={110} />
          <PrintedChip caption="BATT" preset="indicator" text="BATT" w={110} />
        </div>
      </section>

      {/* ---------- LCD softkey labels ---------- */}
      <section className="ctrlreview__assembled">
        <h2>LCD softkey labels</h2>
        <p className="artpreview__note">
          White monospaced labels along the bottom of the display, one above each
          physical softkey. This is the white LCD label style — distinct from the
          printed housing legends above.
        </p>
        <SoftkeyStrip />
      </section>

      {/* ---------- LCD status / message labels ---------- */}
      <section className="ctrlreview__assembled">
        <h2>LCD status / message labels</h2>
        <p className="artpreview__note">On-screen phosphor text: mode/therapy status words, the DEFIB READY / selected-energy readouts, and attention prompts. Monospaced, LCD-like — never the printed housing sans.</p>
        <div className="msc__grid msc__grid--3">
          <LcdChip caption="MONITOR" preset="status" text="MONITOR" />
          <LcdChip caption="PACE" preset="status" text="PACE" />
          <LcdChip caption="DEFIB" preset="status" text="DEFIB" />
          <LcdChip caption="SYNC" preset="status" fill="lcdAmber" text="SYNC" note="preset=status · amber" />
          <LcdChip caption="DEFIB READY" preset="ready" text="DEFIB READY" />
          <LcdChip caption="SYNC XXXJ SEL." preset="select" text="SYNC 120J SEL." note="preset=select" />
          <LcdChip caption="DEFIB XXXJ SEL." preset="select" text="DEFIB 200J SEL." note="preset=select" />
          <LcdChip caption="CHECK CPR PUCK" preset="alert" text="CHECK CPR PUCK" />
          <LcdChip caption="SET PACE MA" preset="prompt" text="SET PACE MA" />
        </div>
      </section>

      <p className="artpreview__note" style={{ opacity: 0.7 }}>
        Package 3 (Typography Library) — reusable tokens + label primitives only.
        Wiring these into the assembled device and the LCD framework are later
        phases (Master Assembly, Display Operating Framework).
      </p>
    </div>
  )
}
