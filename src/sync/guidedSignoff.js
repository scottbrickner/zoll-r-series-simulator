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
 * list into `suggestOutcome` for the sign-off's auto-suggested Competent/NYDC
 * outcome, so the on-screen checklist and the suggestion can never drift apart.
 */
import { matchedPair, SHOCK_TARGET_S, SHOCK_FAIL_CUSHION_S } from './guidedScenarios'
import { download, csvCell, iso } from './report'

/** Institutional email check — Keck/USC med.usc.edu addresses only. */
export function isKeckEmail(s) {
  return /^[^\s@]+@med\.usc\.edu$/i.test(String(s || '').trim())
}

/**
 * @param {object} ctx
 * @param {string} ctx.elapsedLabel - formatted time-to-shock (e.g. "1:24")
 * @param {string} ctx.targetLabel - formatted target (e.g. "2:00")
 * @param {number} ctx.elapsedSeconds - raw time-to-shock, for the fail-cushion tiering
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
  const { elapsedLabel, targetLabel, elapsedSeconds, blsComplete, events, placement, deviceShocked, shockEnergy, shockUsedAnalyze, level, decisionOk } = ctx

  const overTarget = elapsedSeconds > SHOCK_TARGET_S
  const overCushion = elapsedSeconds > SHOCK_TARGET_S + SHOCK_FAIL_CUSHION_S
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
      tone: overCushion ? 'bad' : overTarget ? 'coach' : 'good',
      detail: overCushion
        ? `over the ${targetLabel} target by more than the ${SHOCK_FAIL_CUSHION_S}s cushion`
        : overTarget
          ? `over the ${targetLabel} target, within the ${SHOCK_FAIL_CUSHION_S}s cushion`
          : `within the ${targetLabel} target`,
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
    // In Practice, a wrong pick is rejected and retried, so decisionOk is only ever false if the
    // stage was skipped entirely; in Validation, a single wrong pick also leaves decisionOk false
    // but the stage WAS completed — "not completed" would misdescribe that case, so branch on it.
    detail: decisionOk
      ? (wrongDecision === 0
        ? 'resumed CPR immediately, first attempt'
        : `resumed CPR immediately, after ${wrongDecision} incorrect attempt${wrongDecision === 1 ? '' : 's'}`)
      : (wrongDecision === 0 ? 'not completed' : 'did not choose to resume CPR immediately'),
  })

  return criteria
}

/** COMPETENT unless any criterion needs review (red) — the SME can still override. */
export function suggestOutcome(criteria) {
  return criteria.some((c) => c.tone === 'bad') ? 'NYDC' : 'COMPETENT'
}

/** Build the exportable sign-off record from the runner's state + SME attestation. */
export function buildSignoffRecord({ scenario, level, sessionType, learnerName, learnerEmail, criteria, autoSuggested, finalOutcome, evaluatorName, evaluatorEmail, evaluatorTitle, signedAt, timeToShockSeconds, shockEnergy, selfTestCompleted }) {
  return {
    recordType: 'guided-defib-signoff',
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    rhythm: scenario.rhythm,
    level,
    sessionType,
    learnerName,
    learnerEmail,
    timeToShockSeconds: timeToShockSeconds != null ? Math.round(timeToShockSeconds) : null,
    shockEnergyJ: shockEnergy,
    criteria: criteria.map(({ key, title, tone, detail }) => ({ key, title, tone, detail })),
    autoSuggestedOutcome: autoSuggested,
    finalOutcome,
    selfTestCompleted: !!selfTestCompleted,
    evaluatorName,
    evaluatorEmail,
    evaluatorTitle,
    signedAt: iso(signedAt),
  }
}

/**
 * Build the record sent to the Power Automate telemetry endpoint (see
 * telemetry.js) for EVERY attempt — Practice and Validation alike, so usage
 * can actually be counted. Practice attempts have no `signoff` (fires once
 * the debrief renders); Validation attempts pass the SME's attestation once
 * they sign (reusing the same fields buildSignoffRecord captures).
 *
 * `attemptId` must be generated ONCE per attempt by the caller (a stable
 * per-debrief id, not regenerated here) and passed in — GuidedScenario holds
 * it in state so a Validation "Revise sign-off" re-send still ties back to
 * the same attempt rather than minting a new one. `criteria` is the full
 * per-criterion array (not just a summary) so a "which skill fails most"
 * root-cause view is possible in Power BI — each entry fans out into its own
 * row in a separate criteria table by the Power Automate flow.
 *
 * Deliberately carries no unit/department field — the learner only ever
 * types name + email. Unit is resolved downstream, in the Power Automate
 * flow, via a Graph lookup on `learnerEmail` (the same Office 365 Users
 * "Send an HTTP request" pattern already used by the ROUNDS platform),
 * not captured here — keeps the app dumb and the roster/department mapping
 * in one place instead of two.
 */
export function buildAttemptRecord({ attemptId, scenario, level, sessionType, learnerName, learnerEmail, criteria, autoSuggested, timeToShockSeconds, shockEnergy, signoff }) {
  return {
    recordType: 'guided-defib-attempt',
    attemptId,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    rhythm: scenario.rhythm,
    level,
    sessionType,
    learnerName,
    learnerEmail,
    timeToShockSeconds: timeToShockSeconds != null ? Math.round(timeToShockSeconds) : null,
    shockEnergyJ: shockEnergy,
    autoSuggestedOutcome: autoSuggested,
    reviewCount: criteria.filter((c) => c.tone === 'bad').length,
    coachCount: criteria.filter((c) => c.tone === 'coach').length,
    finalOutcome: signoff?.finalOutcome ?? null,
    selfTestCompleted: signoff ? !!signoff.selfTestCompleted : null,
    evaluatorName: signoff?.evaluatorName ?? null,
    evaluatorEmail: signoff?.evaluatorEmail ?? null,
    evaluatorTitle: signoff?.evaluatorTitle ?? null,
    recordedAt: iso(Date.now()),
    criteria: criteria.map(({ key, title, tone, detail }) => ({ key, title, tone, detail })),
  }
}

const SIGNOFF_CSV_COLUMNS = [
  'scenarioTitle', 'level', 'sessionType', 'learnerName', 'learnerEmail', 'timeToShockSeconds', 'shockEnergyJ',
  'selfTestCompleted', 'evaluatorName', 'evaluatorEmail', 'evaluatorTitle', 'signedAt', 'autoSuggestedOutcome', 'finalOutcome',
  'criterionKey', 'criterionTitle', 'tone', 'detail',
]

/** One CSV row per criterion (session fields repeated) — easy to aggregate across many sign-offs. */
export function signoffToCSV(record) {
  const rows = [SIGNOFF_CSV_COLUMNS.join(',')]
  for (const c of record.criteria) {
    const row = {
      scenarioTitle: record.scenarioTitle, level: record.level, sessionType: record.sessionType, learnerName: record.learnerName, learnerEmail: record.learnerEmail,
      timeToShockSeconds: record.timeToShockSeconds, shockEnergyJ: record.shockEnergyJ, selfTestCompleted: record.selfTestCompleted,
      evaluatorName: record.evaluatorName, evaluatorEmail: record.evaluatorEmail, evaluatorTitle: record.evaluatorTitle, signedAt: record.signedAt,
      autoSuggestedOutcome: record.autoSuggestedOutcome, finalOutcome: record.finalOutcome,
      criterionKey: c.key, criterionTitle: c.title, tone: c.tone, detail: c.detail,
    }
    rows.push(SIGNOFF_CSV_COLUMNS.map((k) => csvCell(row[k])).join(','))
  }
  return rows.join('\n')
}

const slug = (s) => String(s || 'learner').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'learner'

/** Filenames + contents for both export formats — shared by the download and Teams-folder-save paths. */
export function signoffFiles(record) {
  const base = `guided-signoff-${record.scenarioId}-${slug(record.learnerName)}-${Date.now()}`
  return {
    json: { name: `${base}.json`, contents: JSON.stringify(record, null, 2), mime: 'application/json' },
    csv: { name: `${base}.csv`, contents: signoffToCSV(record), mime: 'text/csv' },
  }
}

export function exportSignoffJSON(record) {
  const { json } = signoffFiles(record)
  download(json.name, json.contents, json.mime)
}

export function exportSignoffCSV(record) {
  const { csv } = signoffFiles(record)
  download(csv.name, csv.contents, csv.mime)
}
