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
