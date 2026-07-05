import { useState } from 'react'
import { Link } from 'react-router-dom'
import DisplayFramework from '../components/rseries/display/DisplayFramework'
import FirmwareReference from '../components/rseries/display/FirmwareReference'
import { lcd, LAYERS, LAYER_ORDER, debugColors } from '../components/rseries/display/DisplayLayoutTokens'
import { REGIONS, regionsInLayer, childRegions } from '../components/rseries/display/DisplayRegions'

/**
 * TEMPORARY Display Operating Framework review (Package 4 — firmware rebuild).
 * Shows the framework as a traced reconstruction of the firmware LCD, with the
 * requested comparison: Manufacturer → Overlay → Framework. No patient data, no
 * simulator logic. Not part of the shipping app.
 */

const VB = `0 0 ${lcd.width} ${lcd.height}`

/** A titled LCD panel (673×515) in a dark bezel. */
function Panel({ title, sub, children }) {
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ textAlign: 'center', color: '#cfe', fontWeight: 700, marginBottom: 4 }}>
        {title}
        {sub && <span style={{ color: '#89a', fontWeight: 400, fontSize: '0.85rem' }}> — {sub}</span>}
      </figcaption>
      <div style={{ aspectRatio: `${lcd.width} / ${lcd.height}`, background: '#000', border: '10px solid #15181c', borderRadius: 10, boxShadow: '0 10px 26px rgba(0,0,0,0.5)', padding: 3 }}>
        <svg viewBox={VB} style={{ width: '100%', height: '100%', display: 'block' }} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${title} — firmware LCD`}>
          {children}
        </svg>
      </div>
    </figure>
  )
}

function Arrow() {
  return <div style={{ textAlign: 'center', color: '#6cf', fontSize: '1.6rem', lineHeight: 1, margin: '6px 0' }}>↓</div>
}

/** Manufacturer panel: a real screenshot if dropped in, else the reconstruction. */
function ManufacturerPanel() {
  const [imgOk, setImgOk] = useState(true)
  return (
    <Panel title="Manufacturer" sub="firmware LCD (traced reconstruction)">
      {imgOk ? (
        <image
          href="/lcd_reference.png"
          x="0"
          y="0"
          width={lcd.width}
          height={lcd.height}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setImgOk(false)}
        />
      ) : (
        <FirmwareReference />
      )}
    </Panel>
  )
}

const LAYER_LABEL = {
  [LAYERS.BASE]: 'Base — LCD glass',
  [LAYERS.STRUCTURE]: 'Structure — firmware hairline rules',
  [LAYERS.REGION]: 'Region — persistent firmware regions',
  [LAYERS.OVERLAY]: 'Overlay — transient messages over the waveform area',
}

function Legend() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8, marginTop: '0.5rem' }}>
      {REGIONS.map((r) => (
        <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8rem', padding: '3px 0' }}>
          <span style={{ flex: '0 0 auto', width: 14, height: 14, marginTop: 2, borderRadius: 3, background: debugColors[r.id], border: '1px solid #0006' }} />
          <div>
            <div style={{ color: '#dfe', fontWeight: 600 }}>
              {r.parent ? '· ' : ''}{r.name}
              <span style={{ color: '#7a9', fontWeight: 400, fontFamily: 'ui-monospace, monospace' }}> — {r.rect.x},{r.rect.y}·{r.rect.w}×{r.rect.h}</span>
            </div>
            <div style={{ color: '#89a' }}>{r.layer === LAYERS.OVERLAY ? '(overlay) ' : ''}inject: {r.injects?.join(' · ') || '—'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LayerHierarchy() {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0.4rem 0 0', fontSize: '0.86rem', lineHeight: 1.5 }}>
      {LAYER_ORDER.map((layer) => {
        const tops = layer === LAYERS.REGION || layer === LAYERS.OVERLAY ? regionsInLayer(layer).filter((r) => !r.parent) : []
        return (
          <li key={layer} style={{ marginTop: '0.5rem' }}>
            <strong style={{ color: '#cfe' }}>{LAYER_LABEL[layer]}</strong>
            {tops.length > 0 && (
              <ul style={{ listStyle: 'none', paddingLeft: '1.1rem', margin: '0.15rem 0 0' }}>
                {tops.map((r) => {
                  const kids = childRegions(r.id)
                  return (
                    <li key={r.id} style={{ margin: '0.1rem 0' }}>
                      <span style={{ color: debugColors[r.id] || '#9ad' }}>▸ {r.name}</span>
                      {kids.length > 0 && (
                        <ul style={{ listStyle: 'none', paddingLeft: '1.2rem', margin: 0 }}>
                          {kids.map((k) => (
                            <li key={k.id} style={{ color: debugColors[k.id] || '#7bd', opacity: 0.9 }}>· {k.name}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function DisplayFrameworkReview() {
  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Display Framework Review — Package 4 (firmware)</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__file" style={{ textAlign: 'center', maxWidth: 820, margin: '0.2rem auto 0.8rem' }}>
        A traced reconstruction of the firmware LCD layout in the locked {lcd.width} × {lcd.height} space — narrow left parameter column,
        tightly packed top status, one continuous waveform plotting area, therapy messages over the waveform, and a firmware softkey strip. Not a dashboard.
      </p>

      {/* ---- Manufacturer → Overlay → Framework ---- */}
      <div style={{ maxWidth: 'min(760px, 96vw)', margin: '0 auto' }}>
        <ManufacturerPanel />
        <Arrow />
        <Panel title="Overlay" sub="framework regions traced onto the firmware">
          <FirmwareReference />
          <DisplayFramework mode="debug" showBackground={false} showHints={false} idPrefix="dfr-ov" />
        </Panel>
        <Arrow />
        <Panel title="Framework" sub="the empty firmware skeleton (injection slots)">
          <DisplayFramework mode="clean" idPrefix="dfr-fw" />
        </Panel>
      </div>

      {/* ---- legend ---- */}
      <section className="ctrlreview__assembled" style={{ marginTop: '1.4rem' }}>
        <h2>Region legend</h2>
        <p className="artpreview__note">Each firmware region, its overlay colour, its rectangle (<code>x,y·w×h</code> in {lcd.width}×{lcd.height} space), and the content it exposes for later injection.</p>
        <Legend />
      </section>

      {/* ---- layer hierarchy ---- */}
      <section className="ctrlreview__assembled">
        <h2>Layer hierarchy</h2>
        <p className="artpreview__note">Bottom → top. Persistent regions render first; transient messages draw above the waveform area.</p>
        <LayerHierarchy />
      </section>

      <p className="artpreview__note" style={{ opacity: 0.75 }}>
        The <strong>Manufacturer</strong> panel is a firmware-layout reconstruction from the documented reference
        (<code>visual-alignment-report.md §1</code> + the firmware-accurate <code>LcdScreen.jsx</code> coordinates) — no
        manufacturer screenshot ships in the repo. Drop a real capture at <code>public/lcd_reference.png</code> to trace
        against it exactly. Binding real widgets into the framework slots is a later phase. No patient data, waveforms,
        values, or simulator behaviour are wired here.
      </p>
    </div>
  )
}
