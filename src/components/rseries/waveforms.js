/**
 * Waveform library (illustrative for training — NOT clinically exact).
 *
 * Every ECG path is generated in a 300 x 80 local coordinate space and is
 * stretched to fit the LCD trace via preserveAspectRatio="none". BASE (y=40)
 * is the isoelectric line; smaller y = upward deflection. Paths span the full
 * width so they read continuously when the sweep animation runs.
 *
 * This module is pure data generation. It does not import app state and has no
 * side effects, so it is safe to expand without touching the locked device
 * geometry or the sync logic.
 */

const BASE = 40
const W = 300
export const FLAT = `M0,${BASE} L${W},${BASE}`

// Angular frequency for exactly k whole cycles across the width W. Using integer
// cycle counts makes a sampled waveform PERIODIC over [0, W] — value(0) === value(W)
// — so the scrolling live trace tiles seamlessly with no visible seam / cutoff.
const cyc = (k) => (2 * Math.PI * k) / W

// ---- low-level builders -------------------------------------------------
const r1 = (n) => Math.round(n * 10) / 10
function path(pts) {
  return pts.map((p, i) => (i ? 'L' : 'M') + r1(p[0]) + ',' + r1(p[1])).join(' ')
}

/** Sample y=fn(x) across the width (for continuous / chaotic morphologies). */
function sampled(fn, step = 1.5) {
  const pts = []
  for (let x = 0; x <= W; x += step) pts.push([x, fn(x)])
  if (pts[pts.length - 1][0] !== W) pts.push([W, fn(W)])
  return path(pts)
}

/**
 * One PQRST-style complex occupying [x, x+w]. Morphology via `m`:
 *   p   P-wave amplitude (0 / hasP:false to omit)
 *   q,r,s   Q/R/S amplitudes (deflection from baseline)
 *   t   T-wave amplitude
 *   wide  widen the QRS (ventricular / paced beats)
 */
function complex(x, w, m) {
  const { p = 6, q = 4, r = 30, s = 14, t = 8, hasP = true, wide = false } = m
  const y = BASE
  const pts = [[x, y]]
  // P wave — rounded bump
  if (hasP && p > 0) {
    pts.push([x + 0.06 * w, y], [x + 0.10 * w, y - 0.6 * p], [x + 0.13 * w, y - p], [x + 0.16 * w, y - 0.6 * p], [x + 0.20 * w, y], [x + 0.26 * w, y])
  } else {
    pts.push([x + 0.26 * w, y])
  }
  if (wide) {
    // wide/ventricular QRS + broad, oppositely-directed T
    pts.push([x + 0.30 * w, y + q], [x + 0.42 * w, y - r], [x + 0.56 * w, y + s], [x + 0.66 * w, y])
    pts.push([x + 0.74 * w, y - 0.55 * t], [x + 0.82 * w, y - t], [x + 0.90 * w, y - 0.5 * t], [x + 1.0 * w, y])
  } else {
    // narrow QRS (sharp), a short ST segment, then a rounded T wave
    pts.push([x + 0.30 * w, y + q], [x + 0.33 * w, y - r], [x + 0.37 * w, y + s], [x + 0.42 * w, y])
    pts.push([x + 0.52 * w, y])
    pts.push([x + 0.58 * w, y - 0.5 * t], [x + 0.64 * w, y - t], [x + 0.70 * w, y - 0.5 * t], [x + 0.76 * w, y])
    pts.push([x + 1.0 * w, y])
  }
  return pts
}

/** Regular rhythm: nBeats evenly spaced complexes of morphology `m`. */
function regular(nBeats, m) {
  const w = W / nBeats
  let pts = [[0, BASE]]
  for (let i = 0; i < nBeats; i++) pts = pts.concat(complex(i * w, w, m))
  pts.push([W, BASE])
  return path(pts)
}

// ---- special / irregular morphologies ----------------------------------
function afib() {
  // irregular RR, no P waves, fibrillatory baseline between narrow QRS
  const qrs = [24, 70, 132, 176, 208, 262]
  const fib = (x) => BASE + 2.6 * Math.sin(cyc(9) * x) + 1.6 * Math.sin(cyc(17) * x + 0.8)
  const pts = []
  let x = 0
  while (x <= W) {
    const near = qrs.find((q) => Math.abs(x - q) < 2.2)
    if (near !== undefined) {
      pts.push([near - 3, fib(near - 3)], [near - 1, BASE + 5], [near, BASE - 26], [near + 1.5, BASE + 11], [near + 3.5, fib(near + 3.5)])
      x = near + 5
    } else {
      pts.push([x, fib(x)])
      x += 2.2
    }
  }
  return path(pts)
}

function pacedCapture() {
  const nb = 5
  const w = W / nb
  let pts = [[0, BASE]]
  for (let i = 0; i < nb; i++) {
    const x = i * w
    pts.push([x + 0.10 * w, BASE])
    // pacer spike
    pts.push([x + 0.12 * w, BASE], [x + 0.13 * w, BASE - 34], [x + 0.145 * w, BASE])
    // captured wide ventricular complex + T
    pts.push([x + 0.24 * w, BASE + 7], [x + 0.36 * w, BASE - 23], [x + 0.50 * w, BASE + 15], [x + 0.62 * w, BASE])
    pts.push([x + 0.78 * w, BASE - 7], [x + 1.0 * w, BASE])
  }
  pts.push([W, BASE])
  return path(pts)
}

function pacedNonCapture() {
  // pacer spikes with NO following depolarization (flat baseline after spike)
  const nb = 5
  const w = W / nb
  let pts = [[0, BASE]]
  for (let i = 0; i < nb; i++) {
    const x = i * w
    pts.push([x + 0.12 * w, BASE], [x + 0.13 * w, BASE - 34], [x + 0.145 * w, BASE], [x + 1.0 * w, BASE])
  }
  pts.push([W, BASE])
  return path(pts)
}

function postShock() {
  // large initial deflection that settles, brief wobble, then a recovering
  // near-flat baseline (transient artifact immediately after a discharge)
  return sampled((x) => {
    if (x < 16) return BASE - 36 * (1 - x / 16)
    if (x < 44) return BASE + 9 * Math.exp(-(x - 16) / 9) * Math.sin((x - 16) * 0.8)
    return BASE + 0.6 * Math.sin(x * 0.1)
  }, 1)
}

// ---- parametric pacing (PACER mode, rate/capture/4:1 aware) -------------
// Map a pacing rate (ppm) to a beat count across the ~4s trace window.
function paceBeats(rate, fourToOne) {
  const eff = fourToOne ? rate / 4 : rate
  return Math.min(12, Math.max(1, Math.round((eff * 4) / 60)))
}

/** Paced rhythm: a pacer spike per beat; captured beats add a wide paced QRS. */
export function pacedPath({ rate = 70, capture = true, fourToOne = false, intermittent = false } = {}) {
  const n = paceBeats(rate, fourToOne)
  const w = W / n
  let pts = [[0, BASE]]
  for (let i = 0; i < n; i++) {
    const x = i * w
    const cap = capture && (!intermittent || i % 2 === 0)
    // pacer spike
    pts.push([x + 0.10 * w, BASE], [x + 0.12 * w, BASE], [x + 0.13 * w, BASE - 34], [x + 0.145 * w, BASE])
    if (cap) {
      pts.push([x + 0.24 * w, BASE + 7], [x + 0.36 * w, BASE - 23], [x + 0.50 * w, BASE + 15], [x + 0.62 * w, BASE], [x + 0.78 * w, BASE - 7], [x + 1.0 * w, BASE])
    } else {
      pts.push([x + 1.0 * w, BASE])
    }
  }
  pts.push([W, BASE])
  return path(pts)
}

/**
 * CPR compression artifact, overlaid on the underlying rhythm during CPR.
 * Compression frequency follows the rate; amplitude scales with intensity.
 */
export function cprArtifactPath({ rate = 110, intensity = 0.7 } = {}) {
  const n = Math.min(14, Math.max(3, Math.round((rate * 4) / 60))) // compressions in window
  const k = (n * 2 * Math.PI) / W
  const amp = 6 + intensity * 22
  return sampled((x) => BASE + amp * Math.sin(x * k) + intensity * 3 * Math.sin(x * 0.9 + 0.5), 1.2)
}

/**
 * Raw ECG during CPR — a SINGLE trace: the chest-compression artifact with the
 * underlying rhythm buried in it. This is what the PADS (raw) lead shows; See-Thru
 * CPR filters it to reveal the clean rhythm on the FIL lead. Seamless (integer cycles).
 */
export function cprContaminatedEcg({ rate = 110 } = {}) {
  const n = Math.min(11, Math.max(5, Math.round((rate * 4) / 60))) // compressions across the window
  return sampled(
    (x) =>
      BASE +
      18 * Math.sin(cyc(n) * x) + // dominant compression artifact
      6 * Math.sin(cyc(n * 2) * x + 0.7) + // compression harmonic (shape)
      5 * Math.sin(cyc(29) * x + 1.1) + // buried cardiac-ish activity
      3 * Math.sin(cyc(53) * x + 0.4),
    1,
  )
}

/** Bare pacer spikes only (overlaid on the underlying rhythm when not captured). */
export function pacerSpikes({ rate = 70, fourToOne = false } = {}) {
  const n = paceBeats(rate, fourToOne)
  const w = W / n
  let pts = [[0, BASE]]
  for (let i = 0; i < n; i++) {
    const x = i * w
    pts.push([x + 0.12 * w, BASE], [x + 0.13 * w, BASE - 34], [x + 0.145 * w, BASE], [x + 1.0 * w, BASE])
  }
  pts.push([W, BASE])
  return path(pts)
}

// ---- the library --------------------------------------------------------
const WAVEFORMS = {
  'Normal Sinus': () => regular(5, { p: 6, q: 4, r: 30, s: 14, t: 8 }),
  'Sinus Bradycardia': () => regular(3, { p: 6, q: 4, r: 30, s: 14, t: 9 }),
  'Sinus Tachycardia': () => regular(8, { p: 4, q: 3, r: 28, s: 12, t: 6 }),
  SVT: () => regular(10, { hasP: false, p: 0, q: 2, r: 24, s: 9, t: 4 }),
  'Atrial Fibrillation': () => afib(),
  // Monomorphic VT — asymmetric "shark-fin": a fast rise to a narrow peak,
  // then a wide, deep, smoothly rounded trough back to the next beat. Built
  // via time-warped raised-cosine easing (not harmonic summing) so every
  // cycle has exactly one peak + one trough with no spurious secondary
  // bumps — matches reference monomorphic VT strips (narrow pointed
  // upstroke, broad rounded downstroke taking up most of the cycle). Still
  // fully periodic/monomorphic — that's what distinguishes it from VF/
  // torsades below, which are irregular beat-to-beat.
  'Ventricular Tachycardia': () => {
    const n = 6, peakFrac = 0.3, ampUp = 26, ampDown = 32
    const w = W / n
    return sampled((x) => {
      const t = (((x % w) + w) % w) / w // 0..1 progress from trough to trough
      const trough = BASE + ampDown
      const peak = BASE - ampUp
      if (t < peakFrac) {
        const p = t / peakFrac
        return trough - ((trough - peak) * (1 - Math.cos(p * Math.PI))) / 2
      }
      const p = (t - peakFrac) / (1 - peakFrac)
      return peak + ((trough - peak) * (1 - Math.cos(p * Math.PI))) / 2
    }, 1)
  },
  // Coarse VF — quasi-regular, fast, chaotic-but-not-busy undulation (fairly
  // uniform peak-to-peak spacing/height with mild irregularity, matching
  // reference coarse-VF strips, rather than a dense multi-frequency
  // scribble). Periodic over W (integer cycles → seamless scroll).
  'Ventricular Fibrillation': () =>
    sampled(
      (x) =>
        BASE +
        (0.85 + 0.15 * Math.sin(cyc(2) * x + 0.4)) * // mild amplitude wander so it isn't a perfect sine
          (18 * Math.sin(cyc(17) * x) + 6 * Math.sin(cyc(34) * x + 0.9) + 3 * Math.sin(cyc(11) * x + 2.4)),
      1,
    ),
  // Torsades — twisting spindle: an integer-cycle envelope modulating the carrier.
  'Torsades de Pointes': () =>
    sampled((x) => BASE + (6 + 22 * Math.abs(Math.sin(cyc(2) * x))) * Math.sin(cyc(25) * x), 1),
  Asystole: () => sampled((x) => BASE + 0.7 * Math.sin(cyc(5) * x) + 0.4 * Math.sin(cyc(11) * x + 0.6)),
  PEA: () => regular(4, { p: 5, q: 4, r: 16, s: 9, t: 6, wide: true }),
  'Paced (Capture)': () => pacedCapture(),
  'Paced (Non-Capture)': () => pacedNonCapture(),
  // CPR compression artifact — ~7 broad compressions across the width.
  'CPR Artifact': () => sampled((x) => BASE + 16 * Math.sin(cyc(7) * x) + 3 * Math.sin(cyc(43) * x + 0.4)),
  'Post-Shock Artifact': () => postShock(),
}

// Aliases for legacy / shorthand rhythm keys
const ALIASES = {
  NSR: 'Normal Sinus',
  Bradycardia: 'Sinus Bradycardia',
  Tachycardia: 'Sinus Tachycardia',
  AFib: 'Atrial Fibrillation',
  VT: 'Ventricular Tachycardia',
  VF: 'Ventricular Fibrillation',
  Torsades: 'Torsades de Pointes',
}

/** Rhythms with no organized / perfusing complexes (display HR as dashes). */
export const NON_PERFUSING = new Set([
  'Ventricular Fibrillation',
  'Torsades de Pointes',
  'Asystole',
  'PEA',
  'CPR Artifact',
  'Post-Shock Artifact',
  'Paced (Non-Capture)',
])

export function isNonPerfusing(rhythm) {
  return NON_PERFUSING.has(ALIASES[rhythm] ?? rhythm)
}

// ---- QRS marker positions (for sync markers + cardioversion timing) -----
function beats(n, frac) {
  const w = W / n
  return Array.from({ length: n }, (_, i) => +(i * w + frac * w).toFixed(1))
}
const MARKERS = {
  'Normal Sinus': beats(5, 0.34),
  'Sinus Bradycardia': beats(3, 0.34),
  'Sinus Tachycardia': beats(8, 0.34),
  SVT: beats(10, 0.34),
  'Atrial Fibrillation': [24, 70, 132, 176, 208, 262],
  'Ventricular Tachycardia': beats(6, 0.3), // matches peakFrac in the shark-fin generator above
  PEA: beats(4, 0.42),
  'Paced (Capture)': beats(5, 0.36),
}

/** R-wave x positions (0..300 local) for a rhythm, or [] if not syncable. */
export function qrsMarkers(rhythm) {
  return MARKERS[ALIASES[rhythm] ?? rhythm] || []
}

/** A rhythm is syncable (cardioversion) when it has discernible QRS complexes. */
export function isSyncable(rhythm) {
  return qrsMarkers(rhythm).length > 0
}

const _cache = {}
/** Return the ECG path string for a rhythm key (memoized). */
export function ecgFor(rhythm) {
  const key = ALIASES[rhythm] ?? rhythm
  if (_cache[key]) return _cache[key]
  const gen = WAVEFORMS[key] ?? WAVEFORMS['Normal Sinus']
  const d = gen()
  _cache[key] = d
  return d
}

/** All rhythm keys this library can render, in clinical-ish order. */
export const RHYTHM_KEYS = Object.keys(WAVEFORMS)

// ---- secondary traces (unchanged) --------------------------------------
function tile(seg, width) {
  let d = `M0,${BASE}`
  const reps = Math.ceil(W / width)
  for (let i = 0; i < reps; i++) d += ' ' + seg.replace(/L([\d.]+),([\d.]+)/g, (_, x, y) => `L${+x + i * width},${y}`)
  return d
}
// SpO2 pleth: systolic upstroke, dicrotic notch, diastolic decay.
export const PLETH_PATH = tile('L6,58 L12,16 L18,26 L22,22 L40,52 L50,58 L60,58', 60)
// EtCO2 capnogram: square-shouldered plateau.
export const CAPNO_PATH = tile('L14,58 L20,20 L58,16 L62,58 L75,58', 75)
