import { Link } from 'react-router-dom'
import bumper from '../assets/rseries/body/bumper.svg'
import connectorBump from '../assets/rseries/body/connector-bump.svg'
import faceplate from '../assets/rseries/body/faceplate.svg'
import outerBezel from '../assets/rseries/body/screen_outer_bezel.svg'
import innerBezel from '../assets/rseries/body/screen_inner_bezel.svg'
import lcdOpening from '../assets/rseries/body/lcd_opening.svg'
import lcdGlass from '../assets/rseries/body/lcd_glass.svg'
import lowerCradle from '../assets/rseries/body/lower-cradle.svg'
import screwCover from '../assets/rseries/body/screw-cover.svg'

/**
 * TEMPORARY exploded CAD review for the body rebuild (Pass 1.5).
 * Shows EVERY body component individually and labeled — no assembly, no
 * controls, no LCD content, no graphics. Not part of the shipping simulator.
 */
const PARTS = [
  { name: 'Bumper', file: 'body/bumper.svg', src: bumper },
  { name: 'Connector bump', file: 'body/connector-bump.svg', src: connectorBump },
  { name: 'Faceplate', file: 'body/faceplate.svg', src: faceplate },
  { name: 'Screen — outer bezel', file: 'body/screen_outer_bezel.svg', src: outerBezel },
  { name: 'Screen — inner bezel', file: 'body/screen_inner_bezel.svg', src: innerBezel },
  { name: 'LCD opening (behind glass)', file: 'body/lcd_opening.svg', src: lcdOpening },
  { name: 'LCD glass (front)', file: 'body/lcd_glass.svg', src: lcdGlass },
  { name: 'Lower cradle', file: 'body/lower-cradle.svg', src: lowerCradle },
  { name: 'Screw cover (reusable ×2)', file: 'body/screw-cover.svg', src: screwCover, small: true },
]

export default function ArtPreview() {
  return (
    <div className="artpreview">
      <header className="artpreview__bar">
        <h1>Art Preview — Exploded Body (Pass 1.5)</h1>
        <Link className="btn btn--ghost" to="/">Home</Link>
      </header>

      <p className="artpreview__note">
        Industrial CAD review. Every body component shown individually — no
        assembly, no controls, no knobs, no labels, no LEDs, no softkeys, no LCD
        content. Large parts are in the 1440×1120 master space; the screw cover
        is a reusable local-space part.
      </p>

      <div className="artpreview__explode">
        {PARTS.map((p, i) => (
          <div key={p.file}>
            <figure className="artpreview__tile">
              <div
                className={`artpreview__frame ${p.small ? 'is-small' : ''}`}
                style={{ aspectRatio: p.small ? '1 / 1' : '1440 / 1120' }}
              >
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
    </div>
  )
}
