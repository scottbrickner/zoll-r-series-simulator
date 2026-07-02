import { useState } from 'react'
import { Link } from 'react-router-dom'
import background from '../assets/rseries/controls/mode_selector_background.svg'
import labels from '../assets/rseries/controls/mode_selector_labels.svg'
import knob from '../assets/rseries/controls/mode_selector_knob.svg'
import indicatorDot from '../assets/rseries/controls/mode_selector_indicator_dot.svg'
import ModeSelector, { MODE_ANGLE } from '../components/rseries/controls/ModeSelector'

/**
 * TEMPORARY Controls Review page for Industrial Design Pass 2 (Controls Library).
 * Shows ONLY the Mode Selector — reference vs. current vs. updated, the four
 * selected states, every approved part exploded, and a live props demo. No other
 * controls, no monitor assembly, no LCD, no body parts. Not part of the shipping
 * simulator. Parts share one crop window into the locked master space
 * (viewBox 980 438 420 224) so they line up when stacked.
 */
const PARTS = [
  { name: 'Background base plate', file: 'controls/mode_selector_background.svg', src: background },
  { name: 'Printed labels / colored sections (OFF / MONITOR / PACER / DEFIB)', file: 'controls/mode_selector_labels.svg', src: labels },
  { name: 'Knob (approved — black, recessed, diagonal grip, white insert)', file: 'controls/mode_selector_knob.svg', src: knob },
  { name: 'Position dots (one per mode section — fixed, never rotate)', file: 'controls/mode_selector_indicator_dot.svg', src: indicatorDot },
]

const MODES = ['Off', 'Monitor', 'Defib', 'Pacer']

// the four selectable states + the o'clock position the line/dot align to
const POSITIONS = [
  { mode: 'Off', clock: '9 o’clock' },
  { mode: 'Monitor', clock: '11 o’clock' },
  { mode: 'Defib', clock: '1 o’clock' },
  { mode: 'Pacer', clock: '7 o’clock' },
]

/** Manufacturer reference crop — loads public/mode_selector_reference.png if present. */
function RefCrop() {
  const [ok, setOk] = useState(true)
  return ok ? (
    <img className="artpreview__layer" src="/mode_selector_reference.png"
      alt="Manufacturer reference — Mode Selector" style={{ objectFit: 'contain' }}
      onError={() => setOk(false)}
      onLoad={(e) => { if (e.target.naturalWidth === 0) setOk(false) }} />
  ) : (
    <div className="msc__placeholder">
      <strong>Reference photo not found</strong>
      <span>Save the mode-selector crop to <code>public/mode_selector_reference.png</code>.</span>
    </div>
  )
}

/** Static render of the Mode Selector BEFORE this label pass (for comparison). */
function BeforeMS() {
  return (
    <svg className="artpreview__layer" viewBox="980 438 420 224"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mode selector — before this pass"
      fontFamily="'Segoe UI','Helvetica Neue',system-ui,sans-serif">
      <defs>
        <radialGradient id="bfk" cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#545454" /><stop offset="0.5" stopColor="#2c2c2c" /><stop offset="1" stopColor="#101010" />
        </radialGradient>
        <linearGradient id="bfg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f8f8f" /><stop offset="1" stopColor="#565656" />
        </linearGradient>
      </defs>
      <circle cx="1210" cy="556" r="96" fill="#dcded9" stroke="#c1c3bf" />
      {/* old wrapping arcs */}
      <g fill="none" strokeWidth="16" strokeLinecap="round">
        <path d="M1276.9,476.3 A104,104 0 0 1 1310.0,527.3" stroke="#d4271b" />
        <path d="M1161.2,647.8 A104,104 0 0 1 1111.1,588.1" stroke="#0ba199" />
      </g>
      {/* old labels (larger/darker MONITOR, chunkier PACER/DEFIB) */}
      <text x="1050" y="490" fill="#6f757c" fontSize="22" fontWeight="700">MONITOR</text>
      <rect x="1008" y="540" width="86" height="32" rx="16" fill="#101316" />
      <text x="1030" y="563" fill="#f1f4f7" fontSize="20" fontWeight="800">OFF</text>
      <path d="M994,594 h76 q12,0 12,12 v18 q0,12 -12,12 h-42 Z" fill="#0f9c97" />
      <text x="1008" y="618" fill="#f1f4f7" fontSize="20" fontWeight="800">PACER</text>
      <path d="M1288,486 h78 q14,0 14,14 v14 q0,14 -14,14 h-78 Z" fill="#cf2a20" />
      <text x="1302" y="516" fill="#f1f4f7" fontSize="20" fontWeight="800">DEFIB</text>
      {/* knob (unchanged) at Monitor */}
      <circle cx="1210" cy="556" r="82" fill="#161616" />
      <circle cx="1210" cy="556" r="77" fill="url(#bfk)" stroke="#0b0b0b" strokeWidth="2" />
      <circle cx="1210" cy="556" r="75" fill="none" stroke="#000000" strokeOpacity="0.3" strokeWidth="3" />
      <ellipse cx="1194" cy="528" rx="44" ry="28" fill="#ffffff" opacity="0.16" />
      <g transform="rotate(150 1210 556)">
        <rect x="1200" y="548" width="20" height="84" rx="10" fill="url(#bfg)" stroke="#3a3a3a" strokeWidth="0.75" />
        <rect x="1204" y="564" width="12" height="70" rx="6" fill="#f4f6f8" />
      </g>
      <circle cx="1210" cy="556" r="10" fill="#232323" stroke="#3a3a3a" />
      {/* fixed dots */}
      <g>
        <circle cx="1121" cy="556" r="5" fill="#ffffff" stroke="#9a9d99" strokeWidth="1.2" />
        <circle cx="1166" cy="633" r="5" fill="#ffffff" stroke="#9a9d99" strokeWidth="1.2" />
        <circle cx="1254" cy="479" r="5" fill="#ffffff" stroke="#9a9d99" strokeWidth="1.2" />
        <circle cx="1166" cy="479" r="5" fill="#ffffff" stroke="#9a9d99" strokeWidth="1.2" />
      </g>
    </svg>
  )
}

function Tile({ label, sub, children, aspect = '420 / 224' }) {
  return (
    <figure className="msc__griditem">
      <div className="artpreview__frame" style={{ aspectRatio: aspect }}>{children}</div>
      <figcaption><strong>{label}</strong>{sub && <span className="artpreview__file">{sub}</span>}</figcaption>
    </figure>
  )
}

export default function ControlsReview() {
  const [mode, setMode] = useState('Monitor')
  const [override, setOverride] = useState(false)
  const [angle, setAngle] = useState(MODE_ANGLE.Monitor)
  const [activeMode, setActiveMode] = useState('Monitor')

  const selectMode = (m) => {
    setMode(m)
    setActiveMode(m)
    if (!override) setAngle(MODE_ANGLE[m])
  }

  const liveSvg = (m, active, prefix) => (
    <svg className="artpreview__layer" viewBox="980 438 420 224"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Mode selector — ${m}`}>
      <ModeSelector mode={m} activeMode={active} idPrefix={prefix} />
    </svg>
  )

  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Controls Review — Mode Selector (Pass 2)</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__note">
        Industrial Design Pass 2 — label alignment pass. Only the printed labels /
        colored sections changed this pass (the knob is approved and unchanged).
        Colour now lives in the printed sections (no wrapping arcs); MONITOR is a
        subtle light gray; PACER/DEFIB are flatter, printed-style. Dots stay fixed
        and <strong>only the knob rotates</strong>.
      </p>

      {/* ---------- reference → current → updated ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Reference → current → updated</h2>
        <div className="msc__grid msc__grid--3">
          <Tile label="Manufacturer reference" sub="public/mode_selector_reference.png"><RefCrop /></Tile>
          <Tile label="Current (before this pass)" sub="wrapping arcs · dark MONITOR"><BeforeMS /></Tile>
          <Tile label="Updated (this pass)" sub="printed sections · subtle MONITOR">{liveSvg('Monitor', 'Monitor', 'upd')}</Tile>
        </div>
      </section>

      {/* ---------- four mode positions (acceptance demonstration) ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Four positions — line points to the matching dot</h2>
        <div className="msc__grid">
          {POSITIONS.map((p) => (
            <Tile key={p.mode} label={p.mode.toUpperCase()} sub={`line → ${p.clock} dot`}>
              {liveSvg(p.mode, p.mode, `pos-${p.mode}`)}
            </Tile>
          ))}
        </div>
      </section>

      {/* ---------- exploded assets ---------- */}
      <div className="artpreview__explode">
        {PARTS.map((p, i) => (
          <div key={p.file}>
            <figure className="artpreview__tile">
              <div className="artpreview__frame" style={{ aspectRatio: '420 / 224' }}>
                <img className="artpreview__layer" src={p.src} alt={p.name} />
              </div>
              <figcaption>
                <strong>{p.name}</strong>
                <span className="artpreview__file">{p.file}</span>
              </figcaption>
            </figure>
            {i < PARTS.length - 1 && <div className="artpreview__arrow">↓</div>}
          </div>
        ))}
      </div>

      {/* ---------- assembled component + live props ---------- */}
      <section className="ctrlreview__assembled">
        <h2>Assembled — live props</h2>
        <p className="artpreview__note">
          The reusable <code>&lt;ModeSelector&gt;</code> component. Confirms the
          props <code>mode</code>, <code>knobAngle</code>, and{' '}
          <code>activeMode</code>, and that only the knob rotates (the dots stay fixed).
        </p>

        <figure className="artpreview__tile ctrlreview__assembled-tile">
          <div className="artpreview__frame" style={{ aspectRatio: '420 / 224' }}>
            {liveSvg(mode, activeMode, 'live')}
          </div>
        </figure>

        <div className="ctrlreview__controls">
          <div className="ctrlreview__row">
            <span className="ctrlreview__label">mode</span>
            <div className="ctrlreview__seg">
              {MODES.map((m) => (
                <button key={m} className={`btn btn--sm ${mode === m ? 'btn--primary' : 'btn--ghost'}`} onClick={() => selectMode(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="ctrlreview__row">
            <span className="ctrlreview__label">activeMode</span>
            <div className="ctrlreview__seg">
              {MODES.map((m) => (
                <button key={m} className={`btn btn--sm ${activeMode === m ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setActiveMode(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="ctrlreview__row">
            <label className="ctrlreview__label">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />{' '}
              knobAngle override
            </label>
            <input type="range" min="-180" max="180" step="1" value={angle} disabled={!override}
              onChange={(e) => setAngle(Number(e.target.value))} />
            <span className="ctrlreview__val">{override ? `${angle}°` : `${MODE_ANGLE[mode]}° (from mode)`}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
