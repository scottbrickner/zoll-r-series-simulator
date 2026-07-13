import './rseries.css'
import DisplayFramework from './display/DisplayFramework'
import { mountWidgets } from './display/DisplayWidgets'
import { displayModel } from './display/displayModel'
// ── Master Assembly (Milestone 24): approved modular parts replace the inline
// artwork layer-by-layer, at identical geometry. Phase A — indicators. ──
import IndicatorLight from './controls/IndicatorLight'
import CodeReadiness from './controls/CodeReadiness'
import NIBPButton from './controls/NIBPButton'
import FunctionButton from './controls/FunctionButton'
import TherapyButton from './controls/TherapyButton'
import EnergySelect from './controls/EnergySelect'
import ModeSelector from './controls/ModeSelector'
import PacerKnob from './controls/PacerKnob'
import FourToOneButton from './controls/FourToOneButton'
import SoftKeyRow from './controls/SoftKeyRow'
import { makeSoftKey } from './controls/SoftKey'

// Six physical softkeys are blank (labels live on the LCD, per the real device).
const BLANK_SOFTKEYS = Array.from({ length: 6 }, (_, i) => makeSoftKey(`sk${i}`, ''))

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

// Mode-selector rotation/labels/dots now live in the ModeSelector part (layers
// 11–14); it owns MODE_ANGLE / MODE_DOTS internally.
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
        {/* Display Operating Framework (skeleton) + live widgets, bound to state
            via displayModel() (Master Assembly Phase E — replaces LcdScreen). The
            screen is dark when the mode selector is OFF (device powered down). */}
        {state.mode !== 'Off' && (
          <DisplayFramework mode="clean" showPlaceholders={false} slots={mountWidgets(displayModel(state, elapsed))} idPrefix="lcd" />
        )}
        {flash && <rect x="0" y="0" width="673" height="515" className="rs-flash-rect" />}
      </g>

      {/* ===== 07_Softkeys — SoftKeyRow part (six blank physical keys) =====
           Labels live on the LCD; only the 6th key (Sync On/Off) is interactive. */}
      <g id="07_Softkeys">
        <g transform="translate(186 772)">
          <SoftKeyRow keys={BLANK_SOFTKEYS} />
        </g>
        <rect x={796} y={772} width={110} height={58} rx={6} fill="transparent" className="rs-hit" onClick={a.onSyncToggle} />
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
        {/* selected energy is shown on the LCD readout ("120 J SEL."), not the button */}
        <rect x="1268" y="312" width="88" height="34" fill="transparent" className="rs-hit" onClick={a.onEnergyUp} />
        <rect x="1268" y="390" width="88" height="34" fill="transparent" className="rs-hit" onClick={a.onEnergyDown} />
      </g>

      {/* ===== 11–14 ModeSelector — ModeSelector part (base · labels · rotating knob · dots) =====
           Art-only part; a transparent hit target over the knob cycles the mode. Shifted
           down so the dial's "MONITOR" label clears the RECORDER function button above. */}
      <g transform="translate(0 26)">
        <ModeSelector mode={state.mode} activeMode={state.mode} idPrefix="ms" />
        <circle cx={KX} cy={KY} r={KR} fill="transparent" className="rs-hit" onClick={a.onModeCycle} />
      </g>

      {/* ===== 15_PacerKnobs — PacerKnob ×2 + FourToOneButton (OUTPUT mA · 4:1 · RATE ppm) =====
           4:1 is momentary (press-and-hold); the part is art, the wrapper holds the handlers. */}
      <g id="15_PacerKnobs">
        <PacerKnob cx={OUT.x} cy={OUT.y} r={OUT.r} rotationAngle={knobAngle(state.pacerOutput, 140)} onClick={a.onOutputAdjust} idPrefix="pk-out" />
        <PacerKnob cx={RATE.x} cy={RATE.y} r={RATE.r} rotationAngle={knobAngle(state.pacerRate, 180)} onClick={a.onRateAdjust} idPrefix="pk-rate" />
        <g
          className="rs-hit"
          onMouseDown={a.onFourToOneDown}
          onMouseUp={a.onFourToOneUp}
          onMouseLeave={a.onFourToOneUp}
          onTouchStart={a.onFourToOneDown}
          onTouchEnd={a.onFourToOneUp}
        >
          <FourToOneButton cx={1192} cy={810} r={24} active={state.fourToOne} pressed={state.fourToOne} idPrefix="ftob" />
        </g>
        <text x="1108" y="884" textAnchor="middle" className="rs-teal-label" fontSize="20" fontWeight="700">OUTPUT</text>
        <text x="1108" y="906" textAnchor="middle" className="rs-teal-label" fontSize="18" fontWeight="700">mA</text>
        <text x="1276" y="884" textAnchor="middle" className="rs-teal-label" fontSize="20" fontWeight="700">RATE</text>
        <text x="1276" y="906" textAnchor="middle" className="rs-teal-label" fontSize="18" fontWeight="700">ppm</text>
      </g>

      {/* ===== 16_LEDIndicators (BATT · AC) — IndicatorLight icon pills ===== */}
      <g id="16_LEDIndicators">
        <IndicatorLight type="battery" icon="battery" status="green" cx={950} cy={100} r={16} idPrefix="led-batt" />
        <IndicatorLight type="ac" icon="plug" status="green" cx={1000} cy={100} r={16} idPrefix="led-ac" />
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

