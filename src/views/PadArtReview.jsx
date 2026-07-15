import { Torso, TrianglePadArt, RectanglePadArt } from './guided/padArt'

/**
 * PadArtReview — direct-URL review page (/pad-art-review) for iterating on the
 * guided pad-placement artwork at large scale. Not linked from Home.
 */
export default function PadArtReview() {
  return (
    <div style={{ background: '#faf8f5', minHeight: '100dvh', padding: '2rem', color: '#1a1a1a', fontFamily: 'Montserrat, system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Pad-placement artwork review</h1>

      <h2>Torsos (2×)</h2>
      <svg viewBox="0 0 460 320" width="920" style={{ background: '#fffdfa', border: '1px solid #e7e2da', borderRadius: 14 }}>
        <Torso x={10} view="front" />
        <Torso x={240} view="back" />
      </svg>

      <h2 style={{ marginTop: '2rem' }}>Pads (large + at body scale)</h2>
      <svg viewBox="0 0 360 160" width="720" style={{ background: '#fffdfa', border: '1px solid #e7e2da', borderRadius: 14 }}>
        {/* large */}
        <g transform="translate(70,80) scale(2.4)"><TrianglePadArt uid="rev-tri-lg" /></g>
        <g transform="translate(180,80) scale(2.4)"><RectanglePadArt uid="rev-rect-lg" /></g>
        {/* body scale (as they appear on the torso) */}
        <g transform="translate(280,70)"><TrianglePadArt uid="rev-tri-sm" /></g>
        <g transform="translate(330,70)"><RectanglePadArt uid="rev-rect-sm" /></g>
        <text x="70" y="150" textAnchor="middle" fontSize="11" fill="#5b5750">CPR (triangle)</text>
        <text x="180" y="150" textAnchor="middle" fontSize="11" fill="#5b5750">Standard (rect)</text>
        <text x="305" y="150" textAnchor="middle" fontSize="11" fill="#5b5750">body scale</text>
      </svg>
    </div>
  )
}
