#!/usr/bin/env node
/**
 * Lightweight smoke / regression checks for the simulator's pure logic.
 * Run with:  node scripts/smoke.mjs   (or: npm run smoke)
 *
 * Covers the parts that are verifiable without a browser:
 *   - session-scope keying (shared by id; isolated across ids)
 *   - default session initialization keys
 *   - scenario presets load
 *   - waveform library produces valid paths
 *   - JSON / CSV export functions produce valid output
 *
 * Route rendering + live cross-window sync are verified via `npm run build`
 * and the manual QA in QA_CHECKLIST.md (browser-only behaviors).
 */
import { channelName, storageKeyFor, newSessionId, DEFAULT_SESSION } from '../src/sync/sessionKeys.js'
import { SCENARIOS, getScenario } from '../src/sync/scenarios.js'
import { buildSessionData, toCSV } from '../src/sync/report.js'
import { ecgFor, RHYTHM_KEYS, isSyncable, pacedPath, pacerSpikes, cprArtifactPath } from '../src/components/rseries/waveforms.js'

let pass = 0
let fail = 0
const ok = (name, cond) => {
  if (cond) { pass++; console.log('  ✓ ' + name) }
  else { fail++; console.error('  ✗ ' + name) }
}

console.log('\n1. Session scope keying')
ok('default session key is stable', storageKeyFor(DEFAULT_SESSION) === 'zoll-r-series-sim:state:default')
ok('same id → same storage key (shared scope)', storageKeyFor('abc') === storageKeyFor('abc'))
ok('different ids → different storage keys (isolated)', storageKeyFor('abc') !== storageKeyFor('xyz'))
ok('same id → same channel', channelName('abc') === channelName('abc'))
ok('different ids → different channels', channelName('abc') !== channelName('xyz'))
ok('newSessionId generates unique ids', new Set(Array.from({ length: 50 }, () => newSessionId())).size === 50)

console.log('\n2. Scenario presets')
const wantScenarios = ['vf-arrest', 'pulseless-vt', 'svt-cardioversion', 'brady-pacing', 'asystole-pea', 'rosc-monitoring', 'cpr-quality', 'monitor-unstable']
ok('all 8 scenarios present', wantScenarios.every((id) => getScenario(id)))
ok('scenarios carry initial + checklist + outcomes', SCENARIOS.every((s) => s.initial && Array.isArray(s.checklist) && Array.isArray(s.outcomes)))

console.log('\n3. Waveform library')
const validPath = (d) => typeof d === 'string' && d.startsWith('M') && d.length > 10 && !/NaN|undefined/.test(d)
ok('every rhythm path is valid', RHYTHM_KEYS.every((k) => validPath(ecgFor(k))))
ok('aliases resolve (VF, NSR)', validPath(ecgFor('VF')) && validPath(ecgFor('NSR')))
ok('NSR is syncable, VF is not', isSyncable('Normal Sinus') === true && isSyncable('Ventricular Fibrillation') === false)
ok('pacedPath / pacerSpikes / cprArtifact valid', validPath(pacedPath({ rate: 70, capture: true })) && validPath(pacerSpikes({ rate: 70 })) && validPath(cprArtifactPath({ rate: 110, intensity: 0.7 })))

console.log('\n4. Exports (JSON / CSV)')
const fakeState = {
  sessionId: 'TEST', sessionStart: 1000, sessionEnded: 2000, learnerMode: 'validation',
  scenarioId: 'vf-arrest', scenarioName: 'VF Arrest', scenarioStep: 0,
  learnerName: 'L', evaluatorName: 'E', scenarioOutcome: 'PASSED', shockCount: 1,
  checklist: [{ id: 'cpr', label: 'CPR', done: true }, { id: 'x', label: 'X', done: false }],
  facilitatorNotes: [{ t: 1500, text: 'note one' }],
  eventLog: [
    { id: 1, t: 1100, type: 'scenario_loaded', name: 'VF Arrest', ctx: { mode: 'Defib', rhythm: 'Ventricular Fibrillation', hr: 0, energy: 200, shockCount: 0, syncEnabled: false, pacerOutput: 0, pacerRate: 70, capture: false, cprRate: 110, cprDepth: 50, alarmsSuspended: false, scenarioStep: 0 } },
    { id: 2, t: 1200, type: 'shock', energy: 200, rhythm: 'Ventricular Fibrillation', sync: false, ctx: { mode: 'Defib', rhythm: 'Ventricular Fibrillation', hr: 0, energy: 200, shockCount: 1, syncEnabled: false, pacerOutput: 0, pacerRate: 70, capture: false, cprRate: 110, cprDepth: 50, alarmsSuspended: false, scenarioStep: 0 } },
    { id: 3, t: 1600, type: 'facilitator_note', text: 'has, comma "quote"', ctx: { mode: 'Defib' } },
  ],
}
const json = buildSessionData(fakeState)
const jsonKeys = ['sessionId', 'startTime', 'endTime', 'scenarioName', 'learnerName', 'evaluatorName', 'eventLog', 'checklist', 'facilitatorNotes', 'outcome', 'validationMode']
ok('JSON has all required keys', jsonKeys.every((k) => k in json))
ok('JSON round-trips (valid)', typeof JSON.parse(JSON.stringify(json)) === 'object')
ok('JSON flags validation mode', json.validationMode === true)
ok('JSON event count matches', json.eventLog.length === 3)

const csv = toCSV(fakeState)
const lines = csv.split('\n')
const wantHeader = 'timestamp,eventType,action,mode,rhythm,heartRate,energy,shockCount,syncEnabled,pacerOutput,pacerRate,capture,cprRate,cprDepth,alarmState,scenarioStep,note'
ok('CSV header matches required columns', lines[0] === wantHeader)
ok('CSV has one row per event', lines.length - 1 === fakeState.eventLog.length)
ok('CSV escapes commas/quotes', lines.some((l) => l.includes('"has, comma ""quote"""')))

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
