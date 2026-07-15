/**
 * Guided arrest scenarios — the step-gated validation flow (VF arrest, pulseless VT).
 * Distinct from the free-operation learner: the learner is walked through a fixed
 * sequence of stages (BLS survey → pad placement → defibrillate → next action →
 * debrief), with a 2-minute time-to-shock objective from rhythm identification.
 *
 * Phase 2 defines the data + stage sequence; each stage's real content is filled in
 * by later phases. Shared stage list, parameterized per scenario.
 */

export const GUIDED_STAGES = [
  { id: 'intro', title: 'Case', short: 'Case' },
  { id: 'bls', title: 'BLS survey', short: 'BLS' },
  { id: 'pads', title: 'Pad placement', short: 'Pads' },
  { id: 'device', title: 'Defibrillate', short: 'Shock' },
  { id: 'decision', title: 'Next action', short: 'Next' },
  { id: 'debrief', title: 'Debrief', short: 'Debrief' },
]

/** The stage where the time-to-shock clock starts (rhythm identification). */
export const SHOCK_CLOCK_STAGE = 'device'
/** Target time-to-shock (seconds). */
export const SHOCK_TARGET_S = 120

/**
 * BLS primary survey — the ordered set of actions the learner must select IN
 * SEQUENCE. `correct` items form the graded sequence (order = the answer key);
 * `distractor` items are plausible wrong choices that must never be selected.
 * Presented to the learner shuffled by `slot` so the sequence can't be read off
 * top-to-bottom.
 */
export const BLS_SURVEY = [
  {
    id: 'responsiveness', slot: 2, kind: 'correct',
    label: 'Check responsiveness',
    detail: 'Tap the shoulders and shout — "Are you okay?"',
    feedback: 'Unresponsive — no response to voice or touch.',
  },
  {
    id: 'pulse', slot: 0, kind: 'correct',
    label: 'Check a central (carotid) pulse',
    detail: 'Palpate the carotid for no more than 10 seconds.',
    feedback: 'No pulse in 10 seconds — this is cardiac arrest.',
  },
  {
    id: 'code', slot: 4, kind: 'correct',
    label: 'Activate emergency response (Code Blue)',
    detail: 'Call a Code Blue and ask for the crash cart + defibrillator.',
    feedback: 'Code Blue activated — the team and crash cart are on the way.',
  },
  {
    id: 'cpr', slot: 1, kind: 'correct',
    label: 'Start CPR (chest compressions)',
    detail: 'High-quality compressions, 100–120/min, while awaiting the cart.',
    feedback: 'CPR in progress — continue until the defibrillator is ready.',
  },
  {
    id: 'bp', slot: 3, kind: 'distractor',
    label: 'Take a blood pressure',
    reject: 'Not now — in an unresponsive, pulseless patient, do not delay CPR to measure a BP.',
  },
  {
    id: 'epi', slot: 5, kind: 'distractor',
    label: 'Give epinephrine',
    reject: 'Too early — epinephrine is an ACLS medication given after CPR is underway and IV/IO access exists, not part of the BLS survey.',
  },
]

/** The graded correct sequence (ids in order). */
export const BLS_SEQUENCE = BLS_SURVEY.filter((a) => a.kind === 'correct').map((a) => a.id)
/** Options in display order (shuffled by slot). */
export const BLS_OPTIONS = [...BLS_SURVEY].sort((a, b) => a.slot - b.slot)
export const getBlsStep = (id) => BLS_SURVEY.find((a) => a.id === id) || null

/**
 * Pad placement (Phase 4). The learner picks a pad TYPE, then a position.
 * The OneStep CPR pad (triangle, with the compression-sensor puck) only goes on
 * the anterior chest; the standard rectangular pad only goes on the left lateral
 * or posterior site. Placing both types in an allowed position completes the
 * stage. `cx/cy` are coordinates in the PadFigure SVG space.
 */
export const PAD_TYPES = [
  {
    id: 'triangle',
    label: 'CPR-feedback pad',
    short: 'Triangle · CPR sensor',
    desc: 'Triangular OneStep pad with the CPR compression sensor — goes on the anterior chest.',
    allowed: ['rua', 'la'],
  },
  {
    id: 'rectangle',
    label: 'Standard pad',
    short: 'Rectangle',
    desc: 'Rectangular defibrillation pad — goes on the left lateral or posterior site.',
    allowed: ['ll', 'lp'],
  },
]

export const PAD_POSITIONS = [
  { id: 'rua', n: 1, view: 'front', label: 'Right upper anterior', sub: 'below the right clavicle', cx: 86, cy: 148 },
  { id: 'la', n: 2, view: 'front', label: 'Left anterior', sub: 'just below the left nipple', cx: 133, cy: 172 },
  { id: 'll', n: 3, view: 'front', label: 'Left lateral', sub: 'left mid-axillary line', cx: 158, cy: 186 },
  { id: 'lp', n: 4, view: 'back', label: 'Left posterior', sub: 'left infrascapular (back)', cx: 340, cy: 173 },
]

export const getPadType = (id) => PAD_TYPES.find((t) => t.id === id) || null
export const getPadPosition = (id) => PAD_POSITIONS.find((p) => p.id === id) || null
export const isPadAllowed = (typeId, posId) => {
  const t = getPadType(typeId)
  return !!t && t.allowed.includes(posId)
}

/** placement = { triangle: posId|null, rectangle: posId|null } */
export const isPlacementComplete = (pl) =>
  !!pl.triangle && !!pl.rectangle && isPadAllowed('triangle', pl.triangle) && isPadAllowed('rectangle', pl.rectangle)

/** Name the resulting configuration (by where the standard pad sits). */
export function placementConfigName(pl) {
  if (!isPlacementComplete(pl)) return null
  return pl.rectangle === 'lp' ? 'Anterior–posterior' : 'Anterolateral'
}

/** Why a pad type can't go on a position (used for rejection feedback). */
export function padRejectReason(typeId) {
  return typeId === 'triangle'
    ? 'The CPR-feedback (triangle) pad must go on the anterior chest — right upper anterior or left anterior. The lateral and posterior sites are for the standard pad.'
    : 'The standard (rectangle) pad goes on the left lateral or left posterior site. The anterior chest is reserved for the CPR-feedback pad.'
}

export const GUIDED_SCENARIOS = {
  'vf-arrest': {
    id: 'vf-arrest',
    title: 'VF Arrest',
    rhythm: 'Ventricular Fibrillation',
    energy: 120,
    case:
      'You are the bedside nurse. During rounds you find your patient — a 64-year-old admitted for chest pain — ' +
      'slumped and unresponsive in bed. No one else is in the room. Assess the patient.',
  },
  'pulseless-vt': {
    id: 'pulseless-vt',
    title: 'Pulseless VT Arrest',
    rhythm: 'Ventricular Tachycardia',
    energy: 120,
    case:
      'You are the bedside nurse. Your patient — a 58-year-old on a cardiac monitor — has just triggered a ' +
      'monitor alarm and looks unresponsive. You step to the bedside to assess.',
  },
}

export const GUIDED_SCENARIO_IDS = Object.keys(GUIDED_SCENARIOS)

export function getGuided(id) {
  return GUIDED_SCENARIOS[id] || null
}
