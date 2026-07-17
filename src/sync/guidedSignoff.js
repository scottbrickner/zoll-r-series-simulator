/**
 * guidedSignoff — scored criteria + SME sign-off record for the guided
 * defibrillation validation module (GuidedScenario.jsx).
 *
 * The guided module runs entirely on local component state (it never touches
 * SimulatorContext), so this is a parallel, self-contained record — not the
 * older facilitator/SimulatorContext validation system in report.js. It DOES
 * reuse report.js's generic, state-agnostic export helpers (download/csvCell/iso)
 * rather than duplicating them.
 *
 * `buildCriteria` is the single source of truth for the debrief's scored
 * checklist: GuidedScenario renders one ScoreRow per entry AND feeds the same
 * list into `suggestOutcome` for the sign-off's auto-suggested PASS/FAIL, so
 * the on-screen checklist and the pass/fail suggestion can never drift apart.
 */
import { matchedPair } from './guidedScenarios'
import { download, csvCell, iso } from './report'

/**
 * @param {object} ctx
 * @param {string} ctx.elapsedLabel - formatted time-to-shock (e.g. "1:24")
 * @param {string} ctx.targetLabel - formatted target (e.g. "2:00")
 * @param {boolean} ctx.overTarget
 * @param {boolean} ctx.blsComplete
 * @param {Array} ctx.events - the attempt/event log
 * @param {{triangle: string|null, rectangle: string|null}} ctx.placement
 * @param {boolean} ctx.deviceShocked
 * @param {number|null} ctx.shockEnergy
 * @param {boolean} ctx.shockUsedAnalyze
 * @param {'BLS'|'ACLS'} ctx.level
 * @param {boolean} ctx.decisionOk
 * @returns {Array<{key:string, title:string, tone:'good'|'coach'|'bad', detail:string}>}
 */
export function buildCriteria(ctx) {
  const { elapsedLabel, targetLabel, overTarget, blsComplete, events, placement, deviceShocked, shockEnergy, shockUsedAnalyze, level, decisionOk } = ctx

  const missteps = events.filter((e) => e.type === 'bls_wrong' || e.type === 'bls_out_of_order').length
  const pair = matchedPair(placement)
  const placed = !!placement.triangle && !!placement.rectangle
  const shockIdx = events.findIndex((e) => e.type === 'dev_shock')
  const clearIdx = events.findIndex((e) => e.type === 'callout' && e.id === 'clear')
  const clearedFirst = shockIdx !== -1 && clearIdx !== -1 && clearIdx < shockIdx
  const wrongDecision = events.filter((e) => e.type === 'decision_wrong').length
  const analyzeMismatch = (level === 'BLS' && !shockUsedAnalyze) || (level === 'ACLS' && shockUsedAnalyze)

  const criteria = [
    {
      key: 'time_to_shock', title: `Time to shock: ${elapsedLabel}`,
      tone: overTarget ? 'bad' : 'good',
      detail: overTarget ? `over the ${targetLabel} target` : `within the ${targetLabel} target`,
    },
    {
      key: 'bls_survey', title: 'BLS primary survey',
      tone: !blsComplete ? 'bad' : missteps === 0 ? 'good' : 'coach',
      detail: !blsComplete ? 'not completed' : missteps === 0
        ? 'correct sequence, first attempt'
        : `completed with ${missteps} misstep${missteps === 1 ? '' : 's'} (wrong or out-of-order selection)`,
    },
    {
      key: 'pad_placement', title: 'Pad placement',
      tone: !placed ? 'bad' : pair ? 'good' : 'bad',
      detail: !placed ? 'not placed' : pair ? `correct — ${pair.name}` : 'placed, but the configuration was incorrect',
    },
    {
      key: 'defibrillation', title: 'Defibrillation',
      tone: deviceShocked ? 'good' : 'bad',
      detail: deviceShocked ? `shock delivered${shockEnergy != null ? ` at ${shockEnergy} J` : ''}` : 'no shock delivered',
    },
  ]

  if (deviceShocked && shockEnergy != null) {
    criteria.push({
      key: 'initial_energy', title: 'Initial energy selection',
      tone: shockEnergy === 120 ? 'good' : 'coach',
      detail: shockEnergy === 120
        ? '120 J — the recommended initial biphasic dose'
        : `${shockEnergy} J — 120 J is the recommended initial dose for VF / pulseless VT (not unsafe, just above standard)`,
    })
  }

  if (deviceShocked) {
    criteria.push({
      key: 'device_workflow', title: 'Device workflow',
      tone: analyzeMismatch ? 'coach' : 'good',
      detail: level === 'BLS'
        ? (shockUsedAnalyze ? 'used ANALYZE for the shock advisory' : 'charged directly — as a BLS provider, press ANALYZE first for the shock advisory')
        : (shockUsedAnalyze ? 'used ANALYZE — as an ACLS provider you can identify the rhythm and charge directly' : 'identified the rhythm and charged directly'),
    })
  }

  criteria.push({
    key: 'verbal_callouts', title: 'Verbal callouts',
    tone: clearIdx === -1 ? 'bad' : clearedFirst ? 'good' : 'coach',
    detail: clearIdx === -1
      ? '“Clear” was not announced'
      : clearedFirst ? '“Clear” announced before the shock' : '“Clear” announced, but after the shock',
  })

  criteria.push({
    key: 'post_shock_decision', title: 'Post-shock decision',
    tone: !decisionOk ? 'bad' : wrongDecision === 0 ? 'good' : 'coach',
    detail: !decisionOk ? 'not completed' : wrongDecision === 0
      ? 'resumed CPR immediately, first attempt'
      : `resumed CPR immediately, after ${wrongDecision} incorrect attempt${wrongDecision === 1 ? '' : 's'}`,
  })

  return criteria
}

/** PASS unless any criterion needs review (red) — the SME can still override. */
export function suggestOutcome(criteria) {
  return criteria.some((c) => c.tone === 'bad') ? 'FAIL' : 'PASS'
}

/** Build the exportable sign-off record from the runner's state + SME attestation. */
export function buildSignoffRecord({ scenario, level, learnerName, criteria, autoSuggested, finalOutcome, evaluatorName, evaluatorTitle, signedAt, timeToShockSeconds, shockEnergy }) {
  return {
    recordType: 'guided-defib-signoff',
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    rhythm: scenario.rhythm,
    level,
    learnerName,
    timeToShockSeconds: timeToShockSeconds != null ? Math.round(timeToShockSeconds) : null,
    shockEnergyJ: shockEnergy,
    criteria: criteria.map(({ key, title, tone, detail }) => ({ key, title, tone, detail })),
    autoSuggestedOutcome: autoSuggested,
    finalOutcome,
    evaluatorName,
    evaluatorTitle,
    signedAt: iso(signedAt),
  }
}

const SIGNOFF_CSV_COLUMNS = [
  'scenarioTitle', 'level', 'learnerName', 'timeToShockSeconds', 'shockEnergyJ',
  'evaluatorName', 'evaluatorTitle', 'signedAt', 'autoSuggestedOutcome', 'finalOutcome',
  'criterionKey', 'criterionTitle', 'tone', 'detail',
]

/** One CSV row per criterion (session fields repeated) — easy to aggregate across many sign-offs. */
export function signoffToCSV(record) {
  const rows = [SIGNOFF_CSV_COLUMNS.join(',')]
  for (const c of record.criteria) {
    const row = {
      scenarioTitle: record.scenarioTitle, level: record.level, learnerName: record.learnerName,
      timeToShockSeconds: record.timeToShockSeconds, shockEnergyJ: record.shockEnergyJ,
      evaluatorName: record.evaluatorName, evaluatorTitle: record.evaluatorTitle, signedAt: record.signedAt,
      autoSuggestedOutcome: record.autoSuggestedOutcome, finalOutcome: record.finalOutcome,
      criterionKey: c.key, criterionTitle: c.title, tone: c.tone, detail: c.detail,
    }
    rows.push(SIGNOFF_CSV_COLUMNS.map((k) => csvCell(row[k])).join(','))
  }
  return rows.join('\n')
}

const slug = (s) => String(s || 'learner').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'learner'

export function exportSignoffJSON(record) {
  download(`guided-signoff-${record.scenarioId}-${slug(record.learnerName)}-${Date.now()}.json`, JSON.stringify(record, null, 2), 'application/json')
}

export function exportSignoffCSV(record) {
  download(`guided-signoff-${record.scenarioId}-${slug(record.learnerName)}-${Date.now()}.csv`, signoffToCSV(record), 'text/csv')
}
