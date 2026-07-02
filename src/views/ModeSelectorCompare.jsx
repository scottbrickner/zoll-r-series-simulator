import { useState } from 'react'
import { Link } from 'react-router-dom'
import ModeSelector from '../components/rseries/controls/ModeSelector'

/**
 * Mode Selector — final fidelity comparison (Industrial Design Pass 2).
 * Four stacked panels: Manufacturer reference → Current SVG → Overlay →
 * Difference annotations. Dev/QA only; not part of the shipping simulator.
 *
 * The manufacturer reference photo is loaded from /mode_selector_reference.png
 * (drop the file in `public/`). If it is absent the reference + overlay panels
 * show a placeholder so the page still renders.
 */

// crop window into master space shared by every panel (matches the parts)
const VB = '980 438 420 224'

// numbered difference annotations (residual deltas after the final pass)
const DIFFS = [
  { n: 1, leftPct: 54.8, topPct: 52.7, title: 'Knob grip geometry',
    note: 'Lighter molded satin-gray grip (20×84). Residual: the real grip’s subtle two-tone end-molding is conveyed by a single flat gradient (accepted).' },
  { n: 2, leftPct: 54.8, topPct: 86, title: 'White pointer size',
    note: 'Bolder / longer pointer (12×66) reaching near the knob edge, per the photo.' },
  { n: 3, leftPct: 54.8, topPct: 40, title: 'Knob depth',
    note: 'Deeper dome gradient + recessed inner shadow ring. Residual: molded micro-texture is one gradient, not a texture map (accepted).' },
  { n: 4, leftPct: 75, topPct: 27, title: 'Printed arc saturation (DEFIB red)',
    note: 'Red arc saturation nudged up (#d4271b). Arc length/thickness measured from a low-res crop — approximate.' },
  { n: 5, leftPct: 37, topPct: 80, title: 'Printed arc saturation (PACER teal)',
    note: 'Teal arc saturation nudged up (#0ba199), concentrated at PACER.' },
  { n: 6, leftPct: 17, topPct: 21, title: 'MONITOR gray strip contrast',
    note: 'MONITOR gray darkened (#6f757c) for higher contrast against the faceplate.' },
]

function Frame({ children, aspect = '420 / 224' }) {
  return (
    <div className="artpreview__frame" style={{ aspectRatio: aspect }}>
      {children}
    </div>
  )
}

function RefImage({ onState }) {
  const [ok, setOk] = useState(true)
  return ok ? (
    <img
      className="artpreview__layer"
      src="/mode_selector_reference.png"
      alt="Manufacturer reference — Mode Selector"
      style={{ objectFit: 'contain' }}
      onError={() => { setOk(false); onState && onState(false) }}
      onLoad={(e) => {
        // dev server may return index.html (200) for a missing public file →
        // treat a zero-dimension image as "not found" so the placeholder shows.
        if (e.target.naturalWidth === 0) { setOk(false); onState && onState(false) }
        else onState && onState(true)
      }}
    />
  ) : (
    <div className="msc__placeholder">
      <strong>Manufacturer reference not found</strong>
      <span>Save the reference photo to <code>public/mode_selector_reference.png</code> to light up the Reference and Overlay panels.</span>
    </div>
  )
}

export default function ModeSelectorCompare() {
  const [angle, setAngle] = useState(-120) // roughly matches the photo's pointer
  const [opacity, setOpacity] = useState(0.55)
  const [scale, setScale] = useState(1)
  const [dx, setDx] = useState(0)
  const [dy, setDy] = useState(0)
  const [hasRef, setHasRef] = useState(true)

  const svg = (extra = {}) => (
    <svg className="artpreview__layer" viewBox={VB} xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="Current mode selector SVG" style={extra}>
      <ModeSelector mode="Monitor" knobAngle={angle} idPrefix="cmp" />
    </svg>
  )

  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Mode Selector — Final Fidelity Comparison</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>
      <p className="artpreview__note">
        Industrial Design Pass 2 — final pass. Reference → Current SVG → Overlay →
        difference annotations. After this pass the Mode Selector is
        <strong> permanently frozen</strong>. Use the controls to align the overlay
        against the photo.
      </p>

      <div className="artpreview__explode">
        {/* 1 — Manufacturer reference */}
        <figure className="artpreview__tile msc__tile">
          <Frame><RefImage onState={setHasRef} /></Frame>
          <figcaption><strong>Manufacturer reference</strong>
            <span className="artpreview__file">public/mode_selector_reference.png</span>
          </figcaption>
        </figure>
        <div className="artpreview__arrow">↓</div>

        {/* 2 — Current SVG (with numbered diff pins) */}
        <figure className="artpreview__tile msc__tile">
          <div className="msc__pinwrap">
            <Frame>{svg()}</Frame>
            {DIFFS.map((d) => (
              <span key={d.n} className="msc__pin" style={{ left: `${d.leftPct}%`, top: `${d.topPct}%` }}>{d.n}</span>
            ))}
          </div>
          <figcaption><strong>Current SVG</strong>
            <span className="artpreview__file">ModeSelector.jsx · knobAngle {angle}°</span>
          </figcaption>
        </figure>
        <div className="msc__controls">
          <label>knob angle
            <input type="range" min="-180" max="180" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
            <span className="artpreview__file">{angle}°</span>
          </label>
        </div>
        <div className="artpreview__arrow">↓</div>

        {/* 3 — Overlay */}
        <figure className="artpreview__tile msc__tile">
          <Frame>
            {hasRef && <RefImage onState={setHasRef} />}
            <div className="artpreview__layer" style={{ opacity, transform: `translate(${dx}%, ${dy}%) scale(${scale})`, transformOrigin: 'center' }}>
              {svg({ position: 'absolute', inset: 0, width: '100%', height: '100%' })}
            </div>
          </Frame>
          <figcaption><strong>Overlay</strong>
            <span className="artpreview__file">SVG over reference — align with the controls below</span>
          </figcaption>
        </figure>
        <div className="msc__controls">
          <label>overlay opacity
            <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
          </label>
          <label>scale
            <input type="range" min="0.6" max="1.4" step="0.01" value={scale} onChange={(e) => setScale(Number(e.target.value))} />
          </label>
          <label>x
            <input type="range" min="-30" max="30" step="0.5" value={dx} onChange={(e) => setDx(Number(e.target.value))} />
          </label>
          <label>y
            <input type="range" min="-30" max="30" step="0.5" value={dy} onChange={(e) => setDy(Number(e.target.value))} />
          </label>
        </div>
        <div className="artpreview__arrow">↓</div>

        {/* 4 — Difference annotations */}
        <figure className="artpreview__tile msc__tile msc__tile--wide">
          <figcaption className="msc__diffhead"><strong>Difference annotations</strong>
            <span className="artpreview__file">residual deltas after the final pass</span>
          </figcaption>
          <ol className="msc__difflist">
            {DIFFS.map((d) => (
              <li key={d.n}><span className="msc__pin msc__pin--inline">{d.n}</span>
                <span><strong>{d.title}.</strong> {d.note}</span>
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </div>
  )
}
