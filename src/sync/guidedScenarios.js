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
 * Pad placement (Phase 4). Placement zones on a two-view mannequin (front /
 * back); the learner places exactly two pads. `cx/cy` are coordinates in the
 * PadFigure SVG space (front figure left, back figure right).
 */
export const PAD_ZONES = [
  { id: 'ra', n: 1, view: 'front', label: 'Right upper chest', sub: 'below the right clavicle', cx: 88, cy: 104 },
  { id: 'sternum', n: 2, view: 'front', label: 'Center anterior', sub: 'mid-sternum', cx: 110, cy: 122 },
  { id: 'precordium', n: 3, view: 'front', label: 'Left anterior', sub: 'left of the sternum', cx: 130, cy: 138 },
  { id: 'apex', n: 4, view: 'front', label: 'Left lateral (apex)', sub: 'left mid-axillary line', cx: 152, cy: 162 },
  { id: 'post', n: 5, view: 'back', label: 'Posterior', sub: 'left infrascapular (back)', cx: 320, cy: 126 },
]

/** Valid two-pad configurations (order-independent). */
export const PAD_CONFIGS = [
  { name: 'Anterolateral', pads: ['ra', 'apex'] },
  { name: 'Anterior–posterior', pads: ['precordium', 'post'] },
  { name: 'Anterior–posterior', pads: ['sternum', 'post'] },
]

export const getPadZone = (id) => PAD_ZONES.find((z) => z.id === id) || null

/** Validate a two-pad selection → {ok, config} or {ok:false, reason}. */
export function validatePads(ids) {
  if (ids.length !== 2) return { ok: false, reason: 'Place exactly two pads before confirming.' }
  const key = [...ids].sort().join('+')
  const match = PAD_CONFIGS.find((c) => [...c.pads].sort().join('+') === key)
  if (match) return { ok: true, config: match.name }
  const zones = ids.map(getPadZone)
  if (zones.every((z) => z.view === 'front')) {
    return {
      ok: false,
      reason:
        'Both pads are on the anterior chest and too close — the shock vector won’t cross the heart. ' +
        'Use anterolateral (right upper chest + left apex), or move one pad to the back (anterior–posterior).',
    }
  }
  return {
    ok: false,
    reason:
      'Not a standard configuration. Valid options are anterolateral (right upper chest + left apex) ' +
      'or anterior–posterior (an anterior pad + the posterior/back pad).',
  }
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
