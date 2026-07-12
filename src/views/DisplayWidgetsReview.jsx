import { useState } from 'react'
import { Link } from 'react-router-dom'
import DisplayFramework from '../components/rseries/display/DisplayFramework'
import FirmwareReference from '../components/rseries/display/FirmwareReference'
import { mountWidgets, softkeysForMode } from '../components/rseries/display/DisplayWidgets'
import { lcd } from '../components/rseries/display/DisplayLayoutTokens'

/**
 * TEMPORARY Display Widgets review (Package 5). Shows the reusable LCD widgets filling
 * the firmware skeleton's injection slots: three populated mode screens (MONITOR /
 * DEFIB / PACER) + a CPR/arrest screen, a manufacturer-overlay alignment check, and a
 * per-widget gallery over the empty skeleton. Presentational parts driven by sample
 * models — no simulator logic, no live state. Not part of the shipping app.
 */

const VB = `0 0 ${lcd.width} ${lcd.height}`

// Sample display models — representative values, NOT live state.
const MODELS = {
  monitor: {
    label: 'MONITOR',
    sub: 'normal sinus, all parameters',
    model: {
      spo2: 98,
      nibp: { sys: 122, dia: 78, mean: 93, time: '13:36' },
      co2: { etco2: 38, rr: 16 },
      mode: 'MONITOR',
      hr: 72, lead: 'II', gain: 'x1',
      waveform: { rhythm: 'Normal Sinus', lead: 'II', pleth: true, capno: true },
      message: { text: 'MONITOR', tone: 'status' },
      readout: { time: '0:14:22' },
      softkeys: softkeysForMode('MONITOR'),
    },
  },
  defib: {
    label: 'DEFIB',
    sub: 'VF via CPR pads, charged and ready',
    model: {
      spo2: '- -',
      nibp: { sys: null, dia: null, time: '13:39' },
      co2: { etco2: 11, rr: 3 },
      mode: 'DEFIB',
      hr: '- -', lead: 'PADS', gain: 'x1',
      waveform: { rhythm: 'Ventricular Fibrillation', pads: true, filtered: 'Ventricular Fibrillation', capno: true },
      message: { text: 'DEFIB 200J READY', tone: 'ready' },
      readout: { time: '0:03:11', center: '200 J SEL.', right: 'CHARGED' },
      softkeys: softkeysForMode('DEFIB'),
      highlightLastKey: false,
    },
  },
  pacer: {
    label: 'PACER',
    sub: 'demand pacing with capture (lead P3)',
    model: {
      spo2: 95,
      nibp: { sys: 108, dia: 64, mean: 79, time: '13:40' },
      co2: { etco2: 34, rr: 14 },
      mode: 'PACER',
      hr: 70, lead: 'P3', gain: 'x1',
      waveform: { rhythm: 'Paced (Capture)', lead: 'P3', pleth: true, capno: true },
      message: { text: 'PACE', tone: 'status' },
      readout: { time: '0:08:47', center: '40 mA', right: '70 PPM' },
      softkeys: softkeysForMode('PACER'),
      highlightLastKey: true,
    },
  },
  arrest: {
    label: 'CPR / ARREST',
    sub: 'Real CPR Help — PPI + release bar + rate/depth (voice prompts are auditory)',
    model: {
      spo2: '- -',
      nibp: { sys: null, dia: null },
      co2: { etco2: 18, rr: 8 },
      mode: 'MONITOR',
      hr: '- -', lead: 'PADS', gain: 'x1',
      cpr: { release: 'full', perfusion: 0.82, active: true },
      waveform: { rhythm: 'CPR Artifact', pads: true, filtered: 'Ventricular Fibrillation', capno: true },
      // No message banner: CPR feedback is the PPI diamond + release bar + the rate/depth
      // readout (Real CPR Help field). "Push Harder" / "Good Compressions" are VOICE
      // prompts (auditory), not screen text — R Series Operator's Guide §6.
      readout: { time: '0:01:52', center: '110 / min', right: '5.4 cm' },
      softkeys: softkeysForMode('MONITOR'),
    },
  },
}

function Panel({ title, sub, children, maxWidth = 620 }) {
  return (
    <figure style={{ margin: '0 auto', maxWidth }}>
      <figcaption style={{ textAlign: 'center', color: '#cfe', fontWeight: 700, marginBottom: 4 }}>
        {title}
        {sub && <span style={{ color: '#89a', fontWeight: 400, fontSize: '0.85rem' }}> — {sub}</span>}
      </figcaption>
      <div style={{ aspectRatio: `${lcd.width} / ${lcd.height}`, background: '#000', border: '10px solid #15181c', borderRadius: 10, boxShadow: '0 10px 26px rgba(0,0,0,0.5)', padding: 3 }}>
        <svg viewBox={VB} style={{ width: '100%', height: '100%', display: 'block' }} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${title} — populated LCD`}>
          {children}
        </svg>
      </div>
    </figure>
  )
}

/** A populated firmware screen: skeleton chrome (no placeholders) + injected widgets. */
function PopulatedScreen({ model, idPrefix }) {
  return <DisplayFramework mode="clean" showPlaceholders={false} slots={mountWidgets(model)} idPrefix={idPrefix} />
}

// A single widget in isolation, mounted over the empty skeleton with its region boxed.
const GALLERY = [
  { key: 'spo2', title: 'SpO₂', pick: (m) => ({ spo2: m.spo2 }) },
  { key: 'nibp', title: 'NIBP', pick: (m) => ({ nibp: m.nibp }) },
  { key: 'co2', title: 'CO₂ / RR', pick: (m) => ({ co2: m.co2 }) },
  { key: 'mode', title: 'Mode / Status', pick: (m) => ({ mode: m.mode }) },
  { key: 'cpr', title: 'CPR release + PPI', pick: () => ({ cpr: { release: 'full', perfusion: 0.82, active: true } }) },
  { key: 'ecghr', title: 'Lead / Gain / HR', pick: (m) => ({ hr: m.hr, lead: m.lead, gain: m.gain }) },
  { key: 'waveform', title: 'Waveform field', pick: (m) => ({ waveform: m.waveform }) },
  { key: 'message', title: 'Message banner', pick: (m) => ({ message: m.message }) },
  { key: 'readout', title: 'Readout row (elapsed time)', pick: (m) => ({ readout: m.readout }) },
  { key: 'softkeys', title: 'Softkey labels', pick: (m) => ({ softkeys: m.softkeys }) },
]

export default function DisplayWidgetsReview() {
  const [overlayPct, setOverlayPct] = useState(55)
  const [showRegions, setShowRegions] = useState(false)
  const [galleryMode, setGalleryMode] = useState('monitor')
  const gm = MODELS[galleryMode].model

  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Display Widgets Review — Package 5</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__file" style={{ textAlign: 'center', maxWidth: 840, margin: '0.2rem auto 0.8rem' }}>
        The reusable LCD widgets filling the firmware skeleton's injection slots — parameter numerics (SpO₂ / NIBP / CO₂·RR),
        the top status band (mode, CPR release + PPI, lead·gain·HR), the three-trace waveform field (mode-dependent channels —
        ECG/Pleth/CO₂ in MONITOR, PADS + FIL in DEFIB/CPR per the R Series manual), the message banner, the readout row (elapsed
        time, bottom-left), and mode-dependent softkey labels. Presentational parts driven by sample models — no simulator logic.
      </p>

      {/* Populated mode screens */}
      <section className="ctrlreview__assembled">
        <h2>Populated screens</h2>
        <p className="artpreview__note">The skeleton with <code>showPlaceholders={'{false}'}</code> and widgets injected via <code>mountWidgets(model)</code>.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: '0.6rem' }}>
          {Object.entries(MODELS).map(([key, { label, sub, model }]) => (
            <Panel key={key} title={label} sub={sub} maxWidth={620}>
              <PopulatedScreen model={model} idPrefix={`scr-${key}`} />
            </Panel>
          ))}
        </div>
      </section>

      {/* Manufacturer overlay alignment check */}
      <section className="ctrlreview__assembled" style={{ marginTop: '1.4rem' }}>
        <h2>Manufacturer overlay</h2>
        <p className="artpreview__note">The populated MONITOR screen over the manufacturer reconstruction — confirm the widget values land on the firmware anchors.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', margin: '6px 0' }}>
          <label style={{ color: '#bcd', fontSize: '0.85rem' }}>
            Widgets opacity{' '}
            <input type="range" min="0" max="100" value={overlayPct} onChange={(e) => setOverlayPct(Number(e.target.value))} style={{ verticalAlign: 'middle' }} />{' '}
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>{overlayPct}%</span>
          </label>
        </div>
        <Panel title="MONITOR over manufacturer" sub={`widgets at ${overlayPct}%`} maxWidth={760}>
          <FirmwareReference />
          <g opacity={overlayPct / 100}>
            <DisplayFramework mode="clean" showChrome={false} showBackground={false} slots={mountWidgets(MODELS.monitor.model)} idPrefix="ov" />
          </g>
        </Panel>
      </section>

      {/* Per-widget gallery */}
      <section className="ctrlreview__assembled" style={{ marginTop: '1.4rem' }}>
        <h2>Widget gallery</h2>
        <p className="artpreview__note">Each widget in isolation, mounted over the empty skeleton. Toggle region boxes to see the injection slot each fills.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', margin: '6px 0' }}>
          <label style={{ color: '#bcd', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} /> region boxes
          </label>
          <label style={{ color: '#bcd', fontSize: '0.85rem' }}>
            values from{' '}
            <select value={galleryMode} onChange={(e) => setGalleryMode(e.target.value)}>
              {Object.entries(MODELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: '0.6rem' }}>
          {GALLERY.map(({ key, title, pick }) => (
            <Panel key={key} title={title} maxWidth={360}>
              <DisplayFramework mode="clean" showPlaceholders={false} showRegions={showRegions} slots={mountWidgets(pick(gm))} idPrefix={`gal-${key}`} />
            </Panel>
          ))}
        </div>
      </section>

      <p className="artpreview__note" style={{ opacity: 0.75, marginTop: '1.2rem' }}>
        Widgets are pure presentational parts driven by props — they read no app state and do not animate. Binding live simulator
        state (rhythm, vitals, mode, charge, CPR feedback) to these parts, plus sweep animation, is the later React Wiring phase.
      </p>
    </div>
  )
}
