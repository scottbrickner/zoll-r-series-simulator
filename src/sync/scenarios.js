/**
 * Predefined facilitator-driven training scenarios.
 *
 * Each scenario carries the initial device/patient state plus the teaching and
 * validation metadata (expected actions, education notes, protocol hints,
 * validation checklist, outcome options). Only `initial` is applied to the
 * shared simulator state on load; the metadata is looked up by id by both the
 * learner (education guidance) and facilitator (checklist) views.
 */

export const SCENARIOS = [
  {
    id: 'vf-arrest',
    name: 'VF Arrest',
    level: 'ALS',
    initial: {
      mode: 'Defib', rhythm: 'Ventricular Fibrillation', hr: 0, spo2: 0,
      nibp: { sys: 0, dia: 0, mean: 0 }, etco2: 18, rr: 0,
      energy: 200, shockable: true, postShockRhythm: 'Normal Sinus',
      autoConvert: true, shockOutcome: 'convert',
      cprActive: true, cprRate: 110, cprDepth: 50, cprReleaseQuality: 'full',
    },
    expectedActions: [
      'Confirm pulselessness and start CPR',
      'Select DEFIB and charge to 200 J',
      'Clear and deliver unsynchronized shock',
      'Immediately resume CPR for 2 minutes',
    ],
    educationNotes: [
      'VF is a shockable rhythm — defibrillate as soon as possible.',
      'Minimize interruptions in compressions; resume CPR right after the shock.',
    ],
    protocolHints: ['ACLS: CPR → Shock → CPR → Epinephrine → consider amiodarone'],
    checklist: [
      { id: 'cpr', label: 'High-quality CPR started promptly' },
      { id: 'analyze', label: 'Rhythm correctly identified as shockable' },
      { id: 'energy', label: 'Appropriate energy selected (≥120 J biphasic)' },
      { id: 'clear', label: 'Stated "clear" before shock' },
      { id: 'resume', label: 'Resumed CPR immediately after shock' },
    ],
    outcomes: ['ROSC achieved', 'Refractory VF', 'Asystole'],
    steps: [
      { label: 'Initial VF' },
      { label: 'Persistent VF after 1st shock', apply: { rhythm: 'Ventricular Fibrillation' } },
      { label: 'ROSC after 2nd shock', apply: { rhythm: 'Normal Sinus', hr: 88, spo2: 94, nibp: { sys: 104, dia: 66, mean: 79 }, cprActive: false } },
    ],
  },
  {
    id: 'pulseless-vt',
    name: 'Pulseless VT',
    level: 'ALS',
    initial: {
      mode: 'Defib', rhythm: 'Ventricular Tachycardia', hr: 0, spo2: 0,
      nibp: { sys: 0, dia: 0, mean: 0 }, etco2: 16, rr: 0,
      energy: 200, shockable: true, postShockRhythm: 'Normal Sinus',
      autoConvert: true, shockOutcome: 'convert', cprActive: true,
    },
    expectedActions: [
      'Confirm no pulse with wide-complex tachycardia',
      'Treat as VF — charge and defibrillate (unsynchronized)',
      'Resume CPR immediately',
    ],
    educationNotes: [
      'Pulseless VT is treated like VF: unsynchronized shock, not cardioversion.',
    ],
    protocolHints: ['Pulseless VT/VF → defibrillate'],
    checklist: [
      { id: 'pulse', label: 'Confirmed pulselessness' },
      { id: 'unsync', label: 'Delivered UNSYNCHRONIZED shock' },
      { id: 'resume', label: 'Resumed CPR after shock' },
    ],
    outcomes: ['ROSC achieved', 'Degenerated to VF'],
    steps: [{ label: 'Pulseless VT' }, { label: 'ROSC', apply: { rhythm: 'Normal Sinus', hr: 90, spo2: 95, cprActive: false } }],
  },
  {
    id: 'svt-cardioversion',
    name: 'Unstable SVT — Cardioversion',
    level: 'ALS',
    initial: {
      mode: 'Defib', rhythm: 'SVT', hr: 190, spo2: 92,
      nibp: { sys: 78, dia: 48, mean: 58 }, etco2: 34, rr: 22,
      energy: 100, syncEnabled: true, shockable: true,
      postShockRhythm: 'Normal Sinus', autoConvert: true, shockOutcome: 'convert',
    },
    expectedActions: [
      'Recognize unstable SVT (hypotension)',
      'Enable SYNC for synchronized cardioversion',
      'Select 50–100 J and deliver synchronized shock',
    ],
    educationNotes: [
      'Synchronized cardioversion times the shock to the R wave — enable SYNC first.',
      'Unstable = hypotension, altered mental status, ischemia, or shock.',
    ],
    protocolHints: ['Unstable SVT → synchronized cardioversion'],
    checklist: [
      { id: 'unstable', label: 'Identified instability' },
      { id: 'sync', label: 'Enabled SYNC before shock' },
      { id: 'energy', label: 'Selected appropriate energy (50–100 J)' },
      { id: 'sync-shock', label: 'Delivered synchronized shock' },
    ],
    outcomes: ['Converted to sinus', 'Remained in SVT', 'Degenerated to VF'],
    steps: [{ label: 'Unstable SVT' }, { label: 'Sinus rhythm restored', apply: { rhythm: 'Normal Sinus', hr: 92, nibp: { sys: 112, dia: 70, mean: 84 } } }],
  },
  {
    id: 'brady-pacing',
    name: 'Symptomatic Bradycardia — Pacing',
    level: 'ALS',
    initial: {
      mode: 'Pacer', rhythm: 'Sinus Bradycardia', hr: 38, spo2: 93,
      nibp: { sys: 84, dia: 52, mean: 63 }, etco2: 36, rr: 16,
      underlyingRhythm: 'Sinus Bradycardia', captureMode: 'auto',
      captureThreshold: 60, pacerRate: 70, pacerOutput: 0, intermittentCapture: false,
    },
    expectedActions: [
      'Recognize symptomatic bradycardia',
      'Select PACER, set rate ~70 ppm',
      'Increase output (mA) until electrical + mechanical capture',
      'Confirm capture and patient perfusion',
    ],
    educationNotes: [
      'Capture = each pacer spike followed by a wide QRS; confirm a pulse with it.',
      'Increase mA gradually until consistent capture, then a small safety margin.',
    ],
    protocolHints: ['Symptomatic bradycardia → atropine → transcutaneous pacing'],
    checklist: [
      { id: 'rate', label: 'Set appropriate pacing rate' },
      { id: 'output', label: 'Titrated output to capture' },
      { id: 'capture', label: 'Confirmed electrical capture' },
      { id: 'perfusion', label: 'Confirmed mechanical capture (pulse)' },
    ],
    outcomes: ['Capture achieved', 'Failure to capture', 'Deteriorated to arrest'],
    steps: [{ label: 'Bradycardia, not paced' }, { label: 'Pacing with capture', apply: { captureMode: 'on', pacerOutput: 70 } }],
  },
  {
    id: 'asystole-pea',
    name: 'Asystole / PEA Arrest',
    level: 'ALS',
    initial: {
      mode: 'Defib', rhythm: 'Asystole', hr: 0, spo2: 0,
      nibp: { sys: 0, dia: 0, mean: 0 }, etco2: 12, rr: 0,
      shockable: false, cprActive: true, cprRate: 110, cprDepth: 50,
    },
    expectedActions: [
      'Confirm asystole in two leads / check leads',
      'Recognize NON-shockable rhythm — do not shock',
      'High-quality CPR + epinephrine, treat reversible causes (H/T)',
    ],
    educationNotes: [
      'Asystole and PEA are NOT shockable — focus on CPR, epinephrine, and Hs & Ts.',
      'If "asystole", verify leads connected and gain is adequate.',
    ],
    protocolHints: ['Non-shockable → CPR + epinephrine q3–5 min + reversible causes'],
    checklist: [
      { id: 'noshock', label: 'Did NOT shock a non-shockable rhythm' },
      { id: 'cpr', label: 'High-quality CPR maintained' },
      { id: 'causes', label: 'Considered reversible causes (Hs & Ts)' },
    ],
    outcomes: ['ROSC achieved', 'Remained asystolic', 'PEA'],
    steps: [{ label: 'Asystole' }, { label: 'PEA', apply: { rhythm: 'PEA' } }, { label: 'ROSC', apply: { rhythm: 'Normal Sinus', hr: 76, spo2: 92, cprActive: false } }],
  },
  {
    id: 'rosc-monitoring',
    name: 'ROSC Monitoring',
    level: 'ALS',
    initial: {
      mode: 'Monitor', rhythm: 'Normal Sinus', hr: 96, spo2: 93,
      nibp: { sys: 98, dia: 60, mean: 73 }, etco2: 40, rr: 18,
      cprActive: false, shockable: false,
      alarmLimits: { spo2Low: 92, nibpSysLow: 90 },
    },
    expectedActions: [
      'Confirm ROSC (pulse + organized rhythm)',
      'Optimize oxygenation and blood pressure',
      'Set appropriate alarm limits and monitor for re-arrest',
    ],
    educationNotes: [
      'Post-ROSC: avoid hypotension and hypoxia; titrate to SpO₂ 94–98%.',
      'Watch EtCO₂ and the monitor for re-arrest.',
    ],
    protocolHints: ['Post-cardiac-arrest care bundle'],
    checklist: [
      { id: 'confirm', label: 'Confirmed ROSC' },
      { id: 'alarms', label: 'Set appropriate alarm limits' },
      { id: 'bp', label: 'Addressed blood pressure' },
    ],
    outcomes: ['Stable', 'Re-arrest', 'Deteriorating'],
    steps: [{ label: 'Early ROSC, marginal BP' }, { label: 'Re-arrest (VF)', apply: { mode: 'Defib', rhythm: 'Ventricular Fibrillation', hr: 0, cprActive: true, shockable: true } }],
  },
  {
    id: 'cpr-quality',
    name: 'CPR Quality Validation',
    level: 'BLS',
    initial: {
      mode: 'Monitor', rhythm: 'Asystole', hr: 0, spo2: 0,
      nibp: { sys: 0, dia: 0, mean: 0 }, etco2: 14, rr: 0,
      cprActive: true, cprRate: 90, cprDepth: 38, cprReleaseQuality: 'leaning',
      cprArtifactIntensity: 0.7,
    },
    expectedActions: [
      'Compress at 100–120/min',
      'Compress 5–6 cm (50–60 mm) deep',
      'Allow full chest recoil between compressions',
      'Minimize interruptions',
    ],
    educationNotes: [
      'Target rate 100–120/min, depth 5–6 cm, full recoil, <10 s interruptions.',
      'Watch the perfusion indicator and EtCO₂ as quality feedback.',
    ],
    protocolHints: ['High-quality CPR is the foundation of resuscitation'],
    checklist: [
      { id: 'rate', label: 'Rate within 100–120/min' },
      { id: 'depth', label: 'Depth within 5–6 cm' },
      { id: 'recoil', label: 'Full chest recoil (no leaning)' },
      { id: 'fraction', label: 'Minimized hands-off time' },
    ],
    outcomes: ['Met quality targets', 'Did not meet targets'],
    steps: [{ label: 'Poor-quality CPR (coach to improve)' }],
  },
  {
    id: 'monitor-unstable',
    name: 'Monitor-only Unstable Patient',
    level: 'BLS/ALS',
    initial: {
      mode: 'Monitor', rhythm: 'Sinus Tachycardia', hr: 138, spo2: 89,
      nibp: { sys: 84, dia: 54, mean: 64 }, etco2: 30, rr: 28,
      cprActive: false, shockable: false,
    },
    expectedActions: [
      'Recognize instability (hypotension, hypoxia, tachypnea)',
      'Apply oxygen and obtain IV access',
      'Set alarm limits and escalate care',
    ],
    educationNotes: [
      'Not every unstable patient needs a shock — assess and treat the cause.',
      'Use the monitor: trend HR, SpO₂, NIBP, EtCO₂, and RR.',
    ],
    protocolHints: ['Assess ABCs; identify and treat the underlying cause'],
    checklist: [
      { id: 'recognize', label: 'Recognized instability' },
      { id: 'oxygen', label: 'Applied oxygen / support' },
      { id: 'alarms', label: 'Configured monitoring alarms' },
      { id: 'noshock', label: 'Avoided inappropriate shock' },
    ],
    outcomes: ['Stabilized', 'Deteriorated', 'Arrested'],
    steps: [{ label: 'Unstable sinus tach' }, { label: 'Deteriorates to VT', apply: { rhythm: 'Ventricular Tachycardia', hr: 180 } }],
  },
]

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id) || null
}
