import { Link } from 'react-router-dom'
import SoftKeyRow from '../components/rseries/controls/SoftKeyRow'
import { makeSoftKey } from '../components/rseries/controls/SoftKey'
import { getLayout, SOFTKEY_LAYOUT_NAMES } from '../components/rseries/controls/softkeyLayouts'
import softkeyBlankAsset from '../assets/rseries/controls/softkey_blank.svg'
import softkeyRowAsset from '../assets/rseries/controls/softkey_row.svg'

/**
 * TEMPORARY Softkey Framework review (Package 4). Demonstrates the reusable
 * six-key row: the physical keys, the four example mode layouts, and the
 * per-key states. Not wired into the shipping simulator.
 */
const BLANK = Array.from({ length: 6 }, (_, i) => makeSoftKey(`b${i}`, ''))

// one of each React-driven state on a single row
const STATES = [
  makeSoftKey('s1', 'Default'),
  makeSoftKey('s2', 'Highlighted', { highlighted: true }),
  makeSoftKey('s3', 'Pressed', { pressed: true }),
  makeSoftKey('s4', 'Disabled', { enabled: false }),
  makeSoftKey('s5', 'Hidden', { visible: false }),
  makeSoftKey('s6', 'Sync On/Off'),
]

function Row({ keys }) {
  return (
    <div className="artpreview__frame" style={{ aspectRatio: '732 / 70', maxWidth: '860px', margin: '0.35rem auto 0' }}>
      <svg className="artpreview__layer" viewBox="-6 -6 732 70" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="softkey row">
        <SoftKeyRow keys={keys} />
      </svg>
    </div>
  )
}

function Section({ title, sub, keys }) {
  return (
    <div style={{ margin: '1.2rem auto 0', maxWidth: '860px' }}>
      <h3 style={{ fontSize: '1rem', margin: '0 0 0.1rem' }}>{title}</h3>
      {sub && <p className="artpreview__file" style={{ margin: 0 }}>{sub}</p>}
      <Row keys={keys} />
    </div>
  )
}

export default function SoftkeyReview() {
  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Softkey Framework Review (Package 4)</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__note">
        A programmable six-softkey system — <strong>not six separate buttons</strong>.
        The physical keys (locked body layer 07) never change; React drives each
        key's <code>label</code>, <code>enabled</code>, <code>visible</code>,
        <code> highlighted</code>, and <code>pressed</code>, and swaps the whole
        layout per operating mode. Monitor uses the R Series baseline labels; the
        other layouts are examples the framework supports.
      </p>

      {/* ---------- Physical Softkey Assembly (Pass 2G) ---------- */}
      <div style={{ margin: '1.2rem auto 0', maxWidth: '860px' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.2rem' }}>Physical Softkey Assembly (Pass 2G)</h2>
        <p className="artpreview__file" style={{ margin: 0 }}>
          Warm-gray molded plastic · six identical keys · no labels (the LCD provides labels)
        </p>

        <h3 style={{ fontSize: '1rem', margin: '1rem 0 0.1rem' }}>Single key</h3>
        <figure className="msc__griditem" style={{ maxWidth: '180px', margin: '0.35rem 0 0' }}>
          <div className="artpreview__frame" style={{ aspectRatio: '122 / 74' }}>
            <img className="artpreview__layer" src={softkeyBlankAsset} alt="Single molded softkey" />
          </div>
          <figcaption><span className="artpreview__file">controls/softkey_blank.svg</span></figcaption>
        </figure>

        <div className="artpreview__arrow" style={{ textAlign: 'center' }}>↓</div>

        <h3 style={{ fontSize: '1rem', margin: '0.3rem 0 0.1rem' }}>Six-key row</h3>
        <div className="artpreview__frame" style={{ aspectRatio: '732 / 74', margin: '0.35rem 0 0' }}>
          <img className="artpreview__layer" src={softkeyRowAsset} alt="Six-key softkey row" />
        </div>
        <p className="artpreview__file" style={{ margin: '0.2rem 0 0' }}>controls/softkey_row.svg · pitch 122 (layer 07 spacing)</p>

        <div className="artpreview__arrow" style={{ textAlign: 'center' }}>↓</div>

        <h3 style={{ fontSize: '1rem', margin: '0.3rem 0 0.1rem' }}>Mounted beneath LCD</h3>
        <div className="artpreview__frame" style={{ aspectRatio: '732 / 208' }}>
          <div className="artpreview__layer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
            <svg viewBox="0 0 732 116" style={{ width: '100%', flex: 1 }} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LCD (labels shown here)">
              <rect x="2" y="2" width="728" height="112" rx="8" fill="#0a0a0a" stroke="#2a2a2a" />
              <text x="14" y="24" fill="#3a5f4f" fontFamily="ui-monospace, monospace" fontSize="13">LCD — softkey labels rendered here</text>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={19 + i * 122} y="86" width="84" height="16" rx="3" fill="#0f9c97" opacity="0.35" />
              ))}
            </svg>
            <img src={softkeyRowAsset} alt="softkey row beneath LCD" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
        <p className="artpreview__file" style={{ margin: '0.2rem 0 0' }}>
          The six physical keys sit beneath the display; the LCD paints each key's label above it.
        </p>
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '1.6rem auto 0', maxWidth: '860px' }}>Software framework (Package 4)</h2>
      <Section title="Physical softkeys" sub="six keys, blank framework (no labels)" keys={BLANK} />

      {SOFTKEY_LAYOUT_NAMES.map((name) => (
        <Section key={name} title={`${name} layout`} sub={getLayout(name).filter((k) => k.visible).map((k) => k.label).join(' · ')} keys={getLayout(name)} />
      ))}

      <Section title="Per-key states" sub="default · highlighted · pressed · disabled · hidden" keys={STATES} />
    </div>
  )
}
