import './rseries.css'
import LcdScreen from './LcdScreen'
// ── Master Assembly (Milestone 24): approved modular parts replace the inline
// artwork layer-by-layer, at identical geometry. Phase A — indicators. ──
import IndicatorLight from './controls/IndicatorLight'
import CodeReadiness from './controls/CodeReadiness'
import NIBPButton from './controls/NIBPButton'
import FunctionButton from './controls/FunctionButton'
import TherapyButton from './controls/TherapyButton'
import EnergySelect from './controls/EnergySelect'

/**
 * RSeries_Master — PERMANENT master artwork for the ZOLL R Series front panel.
 *
 * This is the single source of truth for all learner-interface geometry
 * (viewBox 0 0 1440 1120). The artwork is LOCKED: React must never redraw it.
 * React only animates named layers via attributes/props:
 *   • LCD contents (the separate #LCD_Content overlay — NOT part of the artwork)
 *   • LEDs (#16_LEDIndicators)      • Self-test window (#17_SelfTestWindow)
 *   • Buttons (fill/glow state)     • Knob rotation (#13 / #14 transforms)
 *   • Softkey labels (in LCD)       • Waveforms (in LCD)
 *
 * The static neutral export lives at /public/RSeries_Master.svg.
 * Layers 01–22 are named per the Industrial Design Fidelity Guide v1.0.
 */

// White indicator line (canonical points DOWN) rotates to the fixed position
// dot for each mode: OFF 9 o'clock, PACER 7 o'clock, DEFIB 1 o'clock, MONITOR
// 11 o'clock. Fixed dots are printed in layer 14 (they do not rotate).
const MODE_ANGLE = { Off: 90, Monitor: 150, Defib: -150, Pacer: 30 }
const MODE_DOTS = [
  { m: 'Off', cx: 1121, cy: 556 },
  { m: 'Pacer', cx: 1166, cy: 633 },
  { m: 'Defib', cx: 1254, cy: 479 },
  { m: 'Monitor', cx: 1166, cy: 479 },
]
function knobAngle(v, max) {
  return -135 + (Math.min(Math.max(v, 0), max) / max) * 270
}

// LCD physical placement (logical content is 673 x 515, scaled to fit)
const LCD = { x: 204, y: 200, w: 697, h: 526 }

// mode-knob + pacer-knob centres (reference-derived, locked)
const KX = 1210
const KY = 556
const KR = 82
const OUT = { x: 1108, y: 780, r: 78 }
const RATE = { x: 1276, y: 780, r: 78 }

export default function RSeriesDevice({ state, elapsed, flash, actions = {} }) {
  const armed = state.shockReady
  const selfTest = state.selfTest || 'x' // 'blank' | 'x' | 'check'
  // Map the app's self-test value to the CodeReadiness part's status vocabulary.
  const crStatus = selfTest === 'check' ? 'ready' : selfTest === 'x' ? 'notReady' : 'blank'
  const modeRot = `rotate(${MODE_ANGLE[state.mode] ?? 90} ${KX} ${KY})`
  const a = actions
  return (
    <svg
      className="rs-svg"
      viewBox="0 0 1440 1120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ZOLL R Series defibrillator front panel"
    >
      <defs>
        {/* ZOLL Blue #0066B3 (slight molded texture via gradient) */}
        <linearGradient id="g-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a86c8" />
          <stop offset="0.5" stopColor="#0066b3" />
          <stop offset="1" stopColor="#004a82" />
        </linearGradient>
        {/* Faceplate Light Gray #E5E6E2 */}
        <linearGradient id="g-case" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0f1ee" />
          <stop offset="0.5" stopColor="#e5e6e2" />
          <stop offset="1" stopColor="#d6d8d3" />
        </linearGradient>
        <radialGradient id="g-case-hi" cx="0.5" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-cradle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfbfb" />
          <stop offset="0.4" stopColor="#eceeec" />
          <stop offset="1" stopColor="#cfd1ce" />
        </linearGradient>
        <linearGradient id="g-bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eceeeb" />
          <stop offset="1" stopColor="#d1d3cf" />
        </linearGradient>
        <linearGradient id="g-bezel-chamfer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a9d99" />
          <stop offset="1" stopColor="#eef0ec" />
        </linearGradient>
        {/* Warm Gray buttons #F2F2EF over shadow #D1D2CE */}
        <linearGradient id="g-key" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafaf8" />
          <stop offset="1" stopColor="#d1d2ce" />
        </linearGradient>
        <linearGradient id="g-beige" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3ecdb" />
          <stop offset="1" stopColor="#ddd0b3" />
        </linearGradient>
        <linearGradient id="g-peach" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbeede" />
          <stop offset="1" stopColor="#f3dcc4" />
        </linearGradient>
        <radialGradient id="g-shock" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f6a05a" />
          <stop offset="0.62" stopColor="#ef7d22" />
          <stop offset="1" stopColor="#cf6510" />
        </radialGradient>
        {/* Knob dark #2B2B2B / medium #424242 */}
        <radialGradient id="g-knob" cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#545454" />
          <stop offset="0.5" stopColor="#2c2c2c" />
          <stop offset="1" stopColor="#101010" />
        </radialGradient>
        {/* mode-knob molded finger grip (lighter satin gray, per reference photo) */}
        <linearGradient id="g-knobgrip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f8f8f" />
          <stop offset="1" stopColor="#565656" />
        </linearGradient>
        <radialGradient id="g-pacerknob" cx="0.4" cy="0.32" r="0.9">
          <stop offset="0" stopColor="#424242" />
          <stop offset="0.6" stopColor="#232323" />
          <stop offset="1" stopColor="#0d0d0d" />
        </radialGradient>
        <filter id="f-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* ===== 21_Shadows (minimal soft contact) ===== */}
      <g id="21_Shadows">
        <ellipse cx="720" cy="1096" rx="640" ry="26" fill="#000000" opacity="0.16" />
      </g>

      {/* ===== 19_Handle (lower molded cradle, embossed ZOLL) ===== */}
      <g id="19_Handle">
        <path
          d="M20,1000 Q20,908 96,898 Q150,892 196,914 Q440,938 720,940 Q1000,938 1244,914 Q1290,892 1344,898 Q1420,908 1420,1000
             V1064 Q1420,1112 1360,1112 H80 Q20,1112 20,1064 Z"
          fill="url(#g-cradle)"
          stroke="#b7b9b6"
          strokeWidth="1.5"
        />
        <path d="M150,926 Q720,962 1290,926" fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.6" />
        <text x="720" y="1048" textAnchor="middle" className="rs-emboss" fontSize="116">ZOLL</text>
        <ellipse cx="150" cy="1092" rx="34" ry="16" fill="#cbcdca" stroke="#a8aaa7" />
        <circle cx="150" cy="1090" r="9" fill="#95979a" />
        <ellipse cx="1290" cy="1092" rx="34" ry="16" fill="#cbcdca" stroke="#a8aaa7" />
        <circle cx="1290" cy="1090" r="9" fill="#95979a" />
      </g>

      {/* ===== 01_Bumper (blue molded rubber) ===== */}
      <g id="01_Bumper">
        <path
          d="M96,44 H840 Q940,44 992,22 Q1080,6 1200,18 Q1320,30 1360,56 Q1392,80 1392,124
             V884 Q1060,930 715,918 Q400,908 44,884 V116 Q44,44 96,44 Z"
          fill="url(#g-blue)"
          stroke="#004371"
          strokeWidth="2"
        />
        <rect x="1388" y="168" width="40" height="46" rx="11" fill="#15181c" />
        <rect x="1388" y="176" width="24" height="30" rx="7" fill="#33383e" />
      </g>

      {/* ===== 02_Faceplate (satin molded plastic) ===== */}
      <g id="02_Faceplate">
        <path
          d="M104,70 H1330 Q1372,70 1372,112 V846 Q1372,882 1336,882 H104 Q72,882 72,846 V108 Q72,70 104,70 Z"
          fill="url(#g-case)"
          stroke="#c6c8c4"
          strokeWidth="1.5"
        />
        <line x1="916" y1="120" x2="916" y2="820" stroke="#cbcdc9" strokeWidth="2" />
      </g>

      {/* ===== 22_Highlights (subtle CAD sheen over faceplate) ===== */}
      <g id="22_Highlights">
        <rect x="72" y="70" width="1300" height="812" rx="34" fill="url(#g-case-hi)" pointerEvents="none" />
        <line x1="918" y1="120" x2="918" y2="820" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
      </g>

      {/* ===== 03_ScreenBezel (deep recess, light gray) ===== */}
      <g id="03_ScreenBezel">
        <rect x="186" y="184" width="733" height="560" rx="16" fill="url(#g-bezel)" stroke="#b9bbb7" />
        <rect x="187" y="185" width="731" height="558" rx="16" fill="none" stroke="#ffffff" strokeOpacity="0.7" />
        <rect x={LCD.x - 16} y={LCD.y - 14} width={LCD.w + 32} height={LCD.h + 28} rx="10" fill="url(#g-bezel-chamfer)" />
      </g>

      {/* ===== 04_LCD_Window (glass frame) ===== */}
      <g id="04_LCD_Window">
        <rect x={LCD.x - 6} y={LCD.y - 6} width={LCD.w + 12} height={LCD.h + 12} rx="6" fill="#0a0a0a" />
      </g>

      {/* ===== 05_LCD_Glass (anti-glare, perfect digital) ===== */}
      <g id="05_LCD_Glass">
        <rect x={LCD.x - 2} y={LCD.y - 2} width={LCD.w + 4} height={LCD.h + 4} rx="4" fill="#000000" />
      </g>

      {/* ===== 06_LCD_Background (EMPTY — React overlays the digital display) ===== */}
      <g id="06_LCD_Background">
        <rect x={LCD.x} y={LCD.y} width={LCD.w} height={LCD.h} rx="3" fill="#000000" />
      </g>

      {/* ===== LCD_Content (React digital display — NOT part of the master artwork) ===== */}
      <g
        id="LCD_Content"
        transform={`translate(${LCD.x} ${LCD.y}) scale(${(LCD.w / 673).toFixed(4)} ${(LCD.h / 515).toFixed(4)})`}
        clipPath="url(#clip-lcd)"
      >
        <clipPath id="clip-lcd">
          <rect x="0" y="0" width="673" height="515" rx="3" />
        </clipPath>
        <LcdScreen state={state} elapsed={elapsed} />
        {flash && <rect x="0" y="0" width="673" height="515" className="rs-flash-rect" />}
      </g>

      {/* ===== 07_Softkeys (six pale physical keys) ===== */}
      <g id="07_Softkeys">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={186 + i * 122}
            y="772"
            width="110"
            height="58"
            rx="6"
            fill="url(#g-key)"
            stroke="#c2c3bf"
            strokeWidth="1.5"
            className={i === 5 ? 'rs-hit' : undefined}
            onClick={i === 5 ? a.onSyncToggle : undefined}
          />
        ))}
      </g>

      {/* ===== 08_FunctionButtons — FunctionButton parts (LEAD / SIZE / ALARM SUSPEND / RECORDER) ===== */}
      <g id="08_FunctionButtons">
        <FunctionButton x={980} y={200} w={110} h={60} lines={['LEAD']} onClick={a.onLead} idPrefix="fb-lead" />
        <FunctionButton x={980} y={270} w={110} h={60} lines={['SIZE']} onClick={a.onSize} idPrefix="fb-size" />
        <FunctionButton x={980} y={340} w={110} h={70} lines={['ALARM', 'SUSPEND']} onClick={a.onAlarmSuspend} active={state.alarmsSuspended} idPrefix="fb-alarm" />
        <FunctionButton x={980} y={420} w={110} h={60} lines={['RECORDER']} idPrefix="fb-rec" />
      </g>

      {/* ===== 09_TherapyButtons — TherapyButton parts (3 SHOCK · 2 ANALYZE / CHARGE) =====
           Step numbers (3/2/1) and the SHOCK word are printed labels and stay. The SHOCK
           glow is the armed cue (shockReady); the approved CHARGE part has no armed tint. */}
      <g id="09_TherapyButtons">
        <TherapyButton variant="shock" cx={1212} cy={120} r={46} shockReady={armed} onClick={a.onShock} idPrefix="tb-shock" />
        <text x="1270" y="130" className="rs-red" fontSize="32" fontWeight="800">3</text>
        <text x="1296" y="128" className="rs-red" fontSize="22" fontWeight="700">SHOCK</text>

        <text x="1238" y="196" className="rs-red" fontSize="28" fontWeight="800">2</text>
        <TherapyButton variant="action" label="ANALYZE" x={1150} y={210} w={94} h={58} onClick={a.onAnalyze} idPrefix="tb-analyze" />
        <TherapyButton variant="action" label="CHARGE" x={1252} y={210} w={94} h={58} onClick={a.onCharge} idPrefix="tb-charge" />
      </g>

      {/* ===== 10_EnergySelect — EnergySelect part (art) + value + up/down hit zones =====
           The approved part is art-only with one onClick; the master needs a two-way
           rocker + the live energy value, so both overlay the part at locked geometry. */}
      <g id="10_EnergySelect">
        <text x="1218" y="400" className="rs-red" fontSize="28" fontWeight="800">1</text>
        <EnergySelect x={1256} y={298} w={112} h={140} idPrefix="es" />
        <text x="1312" y="406" textAnchor="middle" className="rs-dark" fontSize="16" fontWeight="800" style={{ pointerEvents: 'none' }}>{state.energy}J</text>
        <rect x="1268" y="312" width="88" height="34" fill="transparent" className="rs-hit" onClick={a.onEnergyUp} />
        <rect x="1268" y="390" width="88" height="34" fill="transparent" className="rs-hit" onClick={a.onEnergyDown} />
      </g>

      {/* ===== 11_ModeSelector_Back (base plate) ===== */}
      <g id="11_ModeSelector_Back">
        <circle cx={KX} cy={KY} r={KR + 14} fill="#dcded9" stroke="#c1c3bf" />
      </g>

      {/* ===== 12_ModeSelector_Arcs (printed labels/sections, STATIC — never rotate) =====
           Colour lives in the printed sections (no wrapping arcs), per the
           manufacturer photo: OFF black rect, PACER flat teal (angled leading
           edge), DEFIB flat red (short inward tab), MONITOR subtle light gray. */}
      <g id="12_ModeSelector_Arcs">
        <text x="1050" y="489" className="rs-mono-label" fontSize="18" fontWeight="600">MONITOR</text>
        <rect x="1008" y="541" width="104" height="30" rx="15" fill="#101316" />
        <text x="1060" y="562" textAnchor="middle" className="rs-white" fontSize="18" fontWeight="800">OFF</text>
        <path d="M984,603 H1072 L1058,627 H984 Q979,627 979,622 V608 Q979,603 984,603 Z" fill="#0f9c97" />
        <text x="1024" y="620" textAnchor="middle" className="rs-white" fontSize="18" fontWeight="700">PACER</text>
        <path d="M1298,490 H1370 Q1375,490 1375,495 V511 Q1375,516 1370,516 H1298 L1286,503 Z" fill="#cf2a20" />
        <text x="1334" y="509" textAnchor="middle" className="rs-white" fontSize="18" fontWeight="800">DEFIB</text>
      </g>

      {/* ===== 13_ModeSelector_Knob (rotates: large black body, diagonal grip, white pointer insert) ===== */}
      <g id="13_ModeSelector_Knob">
        <circle cx={KX} cy={KY} r={KR} fill="#161616" />
        <circle cx={KX} cy={KY} r={KR - 5} fill="url(#g-knob)" stroke="#0b0b0b" strokeWidth="2" />
        {/* recessed inner shadow ring — deepens the seated/recessed knob depth */}
        <circle cx={KX} cy={KY} r={KR - 7} fill="none" stroke="#000000" strokeOpacity="0.30" strokeWidth="3" />
        <ellipse cx={KX - 16} cy={KY - 28} rx="44" ry="28" fill="#ffffff" opacity="0.16" />
        {/* rotating molded grip (lighter satin gray) + bold white pointer */}
        <g transform={modeRot}>
          <rect x={KX - 10} y={KY - 8} width="20" height={KR + 2} rx="10" fill="url(#g-knobgrip)" stroke="#3a3a3a" strokeWidth="0.75" />
          <rect x={KX - 6} y={KY + 8} width="12" height={KR - 12} rx="6" fill="#f4f6f8" />
        </g>
        <circle cx={KX} cy={KY} r="10" fill="#232323" stroke="#3a3a3a" />
        {/* click target to cycle Monitor → Defib → Pacer */}
        <circle cx={KX} cy={KY} r={KR} fill="transparent" className="rs-hit" onClick={a.onModeCycle} />
      </g>

      {/* ===== 14_ModeSelector_Dots (one fixed white dot per mode section — does NOT rotate) ===== */}
      <g id="14_ModeSelector_Dots" pointerEvents="none">
        {MODE_DOTS.map((d) => (
          <circle key={d.m} cx={d.cx} cy={d.cy} r="5" fill="#ffffff" stroke="#9a9d99" strokeWidth="1.2" />
        ))}
      </g>

      {/* ===== 15_PacerKnobs (OUTPUT mA · 4:1 · RATE ppm) ===== */}
      <g id="15_PacerKnobs">
        <g className="rs-hit" onClick={a.onOutputAdjust}>
          <PacerKnob c={OUT} angle={knobAngle(state.pacerOutput, 140)} />
        </g>
        <g className="rs-hit" onClick={a.onRateAdjust}>
          <PacerKnob c={RATE} angle={knobAngle(state.pacerRate, 180)} />
        </g>
        <circle
          cx="1192"
          cy="810"
          r="24"
          fill={state.fourToOne ? '#16b3ad' : '#0f9c97'}
          stroke="#0a716d"
          strokeWidth="2"
          className="rs-hit"
          onMouseDown={a.onFourToOneDown}
          onMouseUp={a.onFourToOneUp}
          onMouseLeave={a.onFourToOneUp}
          onTouchStart={a.onFourToOneDown}
          onTouchEnd={a.onFourToOneUp}
        />
        <text x="1192" y="817" textAnchor="middle" className="rs-white" fontSize="16" fontWeight="800" style={{ pointerEvents: 'none' }}>4:1</text>
        <text x="1108" y="884" textAnchor="middle" className="rs-teal-label" fontSize="20" fontWeight="700">OUTPUT</text>
        <text x="1108" y="906" textAnchor="middle" className="rs-teal-label" fontSize="18" fontWeight="700">mA</text>
        <text x="1276" y="884" textAnchor="middle" className="rs-teal-label" fontSize="20" fontWeight="700">RATE</text>
        <text x="1276" y="906" textAnchor="middle" className="rs-teal-label" fontSize="18" fontWeight="700">ppm</text>
      </g>

      {/* ===== 16_LEDIndicators (AC · BATT) — IndicatorLight parts ===== */}
      <g id="16_LEDIndicators">
        <text x="952" y="80" textAnchor="middle" className="rs-mini-label" fontSize="13" fontWeight="700">AC</text>
        <text x="996" y="80" textAnchor="middle" className="rs-mini-label" fontSize="13" fontWeight="700">BATT</text>
        <IndicatorLight type="ac" status="green" cx={952} cy={100} r={13} idPrefix="led-ac" />
        <IndicatorLight type="battery" status="green" cx={996} cy={100} r={13} idPrefix="led-batt" />
      </g>

      {/* ===== 17_SelfTestWindow — CodeReadiness part (blank | red X | green check) ===== */}
      <g id="17_SelfTestWindow">
        <CodeReadiness status={crStatus} x={1036} y={68} w={116} h={68} idPrefix="cr" />
      </g>

      {/* ===== 18_BP_Button — NIBPButton part (arm + cuff icon) ===== */}
      <g id="18_BP_Button">
        <NIBPButton cx={128} cy={792} r={32} idPrefix="nibp" />
      </g>

      {/* ===== 20_Labels (ZOLL wordmark) ===== */}
      <g id="20_Labels">
        <text x="560" y="120" textAnchor="middle" fill="#0066b3" fontSize="42" fontWeight="800" letterSpacing="2">ZOLL</text>
      </g>
    </svg>
  )
}

function PacerKnob({ c, angle }) {
  return (
    <g>
      <circle cx={c.x} cy={c.y} r={c.r} fill="#0f9c97" />
      <circle cx={c.x} cy={c.y} r={c.r - 6} fill="#0d0d0d" />
      <circle cx={c.x} cy={c.y} r={c.r - 9} fill="none" stroke="#16b3ad" strokeWidth="2" opacity="0.8" />
      {Array.from({ length: 32 }).map((_, i) => {
        const a = (i * 11.25 * Math.PI) / 180
        const r1 = c.r - 10
        const r2 = c.r - 19
        return (
          <line key={i} x1={c.x + r1 * Math.sin(a)} y1={c.y - r1 * Math.cos(a)} x2={c.x + r2 * Math.sin(a)} y2={c.y - r2 * Math.cos(a)} stroke="#2b2b2b" strokeWidth="2" />
        )
      })}
      <circle cx={c.x} cy={c.y} r={c.r - 19} fill="url(#g-pacerknob)" stroke="#080808" />
      <ellipse cx={c.x - 12} cy={c.y - 16} rx="22" ry="14" fill="#ffffff" opacity="0.1" />
      <g transform={`rotate(${angle} ${c.x} ${c.y})`}>
        <rect x={c.x - 3} y={c.y - (c.r - 24)} width="6" height="24" rx="3" fill="#e6e9ec" />
      </g>
      <circle cx={c.x} cy={c.y} r="7" fill="#161616" />
    </g>
  )
}
