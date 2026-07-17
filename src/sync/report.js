/**
 * Session export + validation report helpers.
 * Builds a structured session object (JSON), a flattened CSV of the event log,
 * and shared formatting used by the facilitator log viewer and the report view.
 */

export function iso(t) {
  return t ? new Date(t).toISOString() : null
}

/** Compact human-readable action description for one event. */
export function eventAction(e) {
  const bits = []
  if (e.rhythm) bits.push(e.rhythm)
  if (e.energy != null) bits.push(e.energy + 'J')
  if (e.sync != null) bits.push(e.sync ? 'SYNC' : 'unsync')
  if (e.outcome) bits.push('→ ' + e.outcome)
  if (e.result) bits.push(e.result)
  if (e.reason) bits.push(e.reason)
  if (e.mode) bits.push(e.mode)
  if (e.quality) bits.push(e.quality)
  if (e.message) bits.push(e.message)
  if (e.seconds != null) bits.push(e.seconds + 's')
  if (e.value != null) bits.push(String(e.value))
  if (e.enabled != null) bits.push(e.enabled ? 'on' : 'off')
  if (e.state) bits.push(e.state)
  if (e.response) bits.push(e.response)
  if (e.name) bits.push(e.name)
  if (e.label) bits.push(e.label)
  if (e.step != null) bits.push('step ' + (e.step + 1))
  if (e.item) bits.push(e.item + (e.done != null ? (e.done ? ' ✓' : ' ✗') : ''))
  if (e.text) bits.push('“' + e.text + '”')
  if (e.cable) bits.push(e.cable)
  return bits.join(' · ')
}

/** Full session data object for JSON export. */
export function buildSessionData(state) {
  return {
    sessionId: state.sessionId,
    startTime: iso(state.sessionStart),
    endTime: iso(state.sessionEnded || Date.now()),
    exportedAt: iso(Date.now()),
    validationMode: state.learnerMode === 'validation',
    learnerMode: state.learnerMode,
    scenarioId: state.scenarioId,
    scenarioName: state.scenarioName,
    scenarioStep: state.scenarioStep,
    learnerName: state.learnerName || '',
    evaluatorName: state.evaluatorName || '',
    outcome: state.scenarioOutcome || null,
    shockCount: state.shockCount,
    checklist: (state.checklist || []).map((c) => ({ id: c.id, label: c.label, done: !!c.done })),
    facilitatorNotes: (state.facilitatorNotes || []).map((n) => ({ time: iso(n.t), text: n.text })),
    eventLog: state.eventLog || [],
  }
}

const CSV_COLUMNS = [
  'timestamp', 'eventType', 'action', 'mode', 'rhythm', 'heartRate', 'energy',
  'shockCount', 'syncEnabled', 'pacerOutput', 'pacerRate', 'capture',
  'cprRate', 'cprDepth', 'alarmState', 'scenarioStep', 'note',
]

function alarmState(e) {
  if (e.type === 'alarm_triggered') return 'triggered'
  if (e.type === 'alarm_suspended') return 'suspended'
  if (e.type === 'alarm_resumed') return 'resumed'
  return e.ctx && e.ctx.alarmsSuspended ? 'suspended' : ''
}

export function csvCell(v) {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/** One CSV row per event, flattening the standard columns. */
export function toCSV(state) {
  const rows = [CSV_COLUMNS.join(',')]
  for (const e of state.eventLog || []) {
    const c = e.ctx || {}
    const row = {
      timestamp: iso(e.t),
      eventType: e.type,
      action: eventAction(e),
      mode: c.mode,
      rhythm: c.rhythm,
      heartRate: c.hr,
      energy: e.energy != null ? e.energy : c.energy,
      shockCount: c.shockCount,
      syncEnabled: c.syncEnabled,
      pacerOutput: e.type === 'output_change' ? e.value : c.pacerOutput,
      pacerRate: e.type === 'rate_change' ? e.value : c.pacerRate,
      capture: c.capture,
      cprRate: e.type === 'cpr_rate' ? e.value : c.cprRate,
      cprDepth: e.type === 'cpr_depth' ? e.value : c.cprDepth,
      alarmState: alarmState(e),
      scenarioStep: c.scenarioStep,
      note: e.text || '',
    }
    rows.push(CSV_COLUMNS.map((k) => csvCell(row[k])).join(','))
  }
  return rows.join('\n')
}

export function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSessionJSON(state) {
  const data = buildSessionData(state)
  download(`rseries-session-${state.sessionId || Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export function exportEventCSV(state) {
  download(`rseries-eventlog-${state.sessionId || Date.now()}.csv`, toCSV(state), 'text/csv')
}
