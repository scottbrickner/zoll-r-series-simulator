import { useState } from 'react'
import { Link } from 'react-router-dom'
import energySelectAsset from '../assets/rseries/controls/energy_select_button.svg'
import EnergySelect from '../components/rseries/controls/EnergySelect'

/**
 * TEMPORARY Energy Select Review page (Industrial Design Pass 2C). Shows the
 * reusable Energy Select control: blank shell, default / pressed / disabled
 * states, and a range of example energies. Not wired into the shipping
 * simulator; not part of the shipping app.
 */
const EXAMPLES = [30, 50, 70, 100, 120, 150, 200, 360]

// frame one EnergySelect (default footprint 96 x 150) with padding
const VB = '-12 -12 120 174'
const AR = '120 / 174'

function Cell({ label, sub, children }) {
  return (
    <figure className="msc__griditem">
      <div className="artpreview__frame" style={{ aspectRatio: AR }}>{children}</div>
      <figcaption><strong>{label}</strong>{sub && <span className="artpreview__file">{sub}</span>}</figcaption>
    </figure>
  )
}

function ESvg({ children, aria }) {
  return (
    <svg className="artpreview__layer" viewBox={VB} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={aria}>
      {children}
    </svg>
  )
}

/** Manufacturer reference — loads public/energy_select_reference.png if present. */
function RefImg() {
  const [ok, setOk] = useState(true)
  return ok ? (
    <img className="artpreview__layer" src="/energy_select_reference.png" alt="Manufacturer reference — Energy Select"
      style={{ objectFit: 'contain' }} onError={() => setOk(false)}
      onLoad={(e) => { if (e.target.naturalWidth === 0) setOk(false) }} />
  ) : (
    <div className="msc__placeholder">
      <strong>Reference not found</strong>
      <span>Save the manufacturer crop to <code>public/energy_select_reference.png</code>.</span>
    </div>
  )
}

export default function EnergySelectReview() {
  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Energy Select Review (Pass 2C)</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__note">
        Reusable warm-beige molded Energy Select control — a vertical rocker
        (▲ / ENERGY / SELECT / ▼), not a generic push button. Refined to the
        manufacturer photo: the content is <strong>vertically centered</strong>
        with balanced spacing and <strong>larger red triangles</strong>. Per the
        real device, the selected energy is shown on the LCD (not on the button
        face), so no number is printed on the button — the example captions below
        label each energy setting. Outer dimensions, corner radius, plastic colour,
        and bevel are unchanged. Not wired into the shipping simulator.
      </p>

      {/* ---------- reference + shell + states ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Reference · shell &amp; states</h2>
        <div className="msc__grid msc__grid--4">
          <Cell label="Manufacturer reference" sub="public/energy_select_reference.png">
            <RefImg />
          </Cell>
          <Cell label="Blank reusable component" sub="controls/energy_select_button.svg">
            <img className="artpreview__layer" src={energySelectAsset} alt="Energy Select — blank reusable asset" />
          </Cell>
          <Cell label="Default" sub="enabled · 150 J">
            <ESvg aria="Energy Select — default"><EnergySelect energyValue={150} energyUnits="J" idPrefix="es-def" /></ESvg>
          </Cell>
          <Cell label="Pressed" sub="pushed in">
            <ESvg aria="Energy Select — pressed"><EnergySelect energyValue={150} energyUnits="J" pressed idPrefix="es-prs" /></ESvg>
          </Cell>
          <Cell label="Disabled" sub="enabled = false">
            <ESvg aria="Energy Select — disabled"><EnergySelect energyValue={150} energyUnits="J" enabled={false} idPrefix="es-dis" /></ESvg>
          </Cell>
        </div>
      </section>

      {/* ---------- example values ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Example values</h2>
        <div className="msc__grid msc__grid--4">
          {EXAMPLES.map((j) => (
            <Cell key={j} label={`${j} J`}>
              <ESvg aria={`Energy Select — ${j} J`}>
                <EnergySelect energyValue={j} energyUnits="J" highlighted={j === 150} idPrefix={`es-${j}`} />
              </ESvg>
            </Cell>
          ))}
        </div>
        <p className="artpreview__note">The 150 J example shows the <code>highlighted</code> emphasis ring.</p>
      </section>
    </div>
  )
}
