import { useState } from 'react'
import { Link } from 'react-router-dom'
import DisplayFramework from '../components/rseries/display/DisplayFramework'
import FirmwareReference from '../components/rseries/display/FirmwareReference'
import { lcd, LAYERS, LAYER_ORDER, debugColors } from '../components/rseries/display/DisplayLayoutTokens'
import { REGIONS, regionsInLayer, childRegions } from '../components/rseries/display/DisplayRegions'

/**
 * TEMPORARY Firmware Skeleton review (Package 4A). Three views to check the skeleton
 * against the manufacturer firmware: (1) Manufacturer, (2) Framework Overlay with an
 * opacity slider, (3) Framework Only — plus a region legend and layer hierarchy.
 * Layout only; no patient data, no simulator logic. Not part of the shipping app.
 */

const VB = `0 0 ${lcd.width} ${lcd.height}`

function Panel({ title, sub, children, maxWidth = 760 }) {
  return (
    <figure style={{ margin: '0 auto', maxWidth }}>
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

/** Manufacturer: a real screenshot if dropped in, else the reconstruction. */
function Manufacturer() {
  const [imgOk, setImgOk] = useState(true)
  return (
    <>
      {imgOk ? (
        <image href="/lcd_reference.png" x="0" y="0" width={lcd.width} height={lcd.height} preserveAspectRatio="xMidYMid slice" onError={() => setImgOk(false)} />
      ) : (
        <FirmwareReference />
      )}
    </>
  )
}

const LAYER_LABEL = {
  [LAYERS.BASE]: 'Base — LCD glass',
  [LAYERS.STRUCTURE]: 'Structure — firmware hairline rules + baselines',
  [LAYERS.REGION]: 'Region — persistent firmware regions',
  [LAYERS.OVERLAY]: 'Overlay — messages inside the waveform field',
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
  const [overlayPct, setOverlayPct] = useState(50)
  const [showRegions, setShowRegions] = useState(false)

  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Firmware Skeleton Review — Package 4A</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__file" style={{ textAlign: 'center', maxWidth: 840, margin: '0.2rem auto 0.8rem' }}>
        The permanent firmware skeleton reconstructed from the manufacturer LCD — narrow ~20% left parameter column with thin-divider
        modules, one continuous waveform field (ECG / Pleth / CO₂ baselines), compressed top status hugging the edge, messages inside the
        waveform field, and a label-only softkey strip. A firmware screenshot with the dynamic values removed — not a dashboard.
      </p>

      {/* 1 — Manufacturer */}
      <Panel title="1 · Manufacturer" sub="firmware LCD (reference / reconstruction)">
        <Manufacturer />
      </Panel>

      {/* 2 — Framework overlay with opacity slider */}
      <div style={{ margin: '1rem auto 0', maxWidth: 760 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
          <label style={{ color: '#bcd', fontSize: '0.85rem' }}>
            Framework opacity{' '}
            <input type="range" min="0" max="100" value={overlayPct} onChange={(e) => setOverlayPct(Number(e.target.value))} style={{ verticalAlign: 'middle' }} />{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>{overlayPct}%</span>
          </label>
          <label style={{ color: '#bcd', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} /> region boxes
          </label>
        </div>
        <Panel title="2 · Framework Overlay" sub={`skeleton over the manufacturer at ${overlayPct}%`}>
          <Manufacturer />
          <g opacity={overlayPct / 100}>
            <DisplayFramework mode="clean" showBackground={false} showRegions={showRegions} idPrefix="ov" />
          </g>
        </Panel>
      </div>

      {/* 3 — Framework only */}
      <div style={{ margin: '1rem auto 0' }}>
        <Panel title="3 · Framework Only" sub="the empty firmware skeleton (injection slots)">
          <DisplayFramework mode="clean" showRegions={showRegions} idPrefix="fw" />
        </Panel>
      </div>

      {/* legend + hierarchy */}
      <section className="ctrlreview__assembled" style={{ marginTop: '1.4rem' }}>
        <h2>Region legend</h2>
        <p className="artpreview__note">Each firmware region, its overlay colour, its rectangle (<code>x,y·w×h</code> in {lcd.width}×{lcd.height} space), and the content it exposes for later injection.</p>
        <Legend />
      </section>

      <section className="ctrlreview__assembled">
        <h2>Layer hierarchy</h2>
        <p className="artpreview__note">Bottom → top. Persistent regions render first; messages draw inside the waveform field.</p>
        <LayerHierarchy />
      </section>

      <p className="artpreview__note" style={{ opacity: 0.75 }}>
        The <strong>Manufacturer</strong> panel is a firmware-layout reconstruction; no manufacturer screenshot ships in the repo. Drop a
        real capture at <code>public/lcd_reference.png</code> to overlay the skeleton against the genuine article. Binding real widgets into
        the skeleton slots is a later phase — no waveforms, vitals, patient data, or messages are added here.
      </p>
    </div>
  )
}
