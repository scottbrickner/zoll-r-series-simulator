/**
 * Softkey Framework — named per-mode layouts (Package 4).
 *
 * A layout is an ordered list of up to six {@link SoftKey}s mapped onto the six
 * physical softkeys. The MONITOR layout uses the R Series baseline labels; the
 * Pacer / Defib / Sync layouts are example baselines demonstrating that the
 * framework supports a different label set (and states) per operating mode —
 * confirm the exact per-mode legends against the R Series Operator's Guide before
 * wiring into the shipping device.
 *
 * React swaps the whole layout when the operating mode changes; the physical keys
 * never change.
 */
import type { SoftKey } from './SoftKey'
import { makeSoftKey } from './SoftKey'

export type SoftKeyLayoutName = 'Monitor' | 'Pacer' | 'Defib' | 'Sync'

export const SOFTKEY_LAYOUTS: Record<SoftKeyLayoutName, SoftKey[]> = {
  // R Series baseline (as specified).
  Monitor: [
    makeSoftKey('options', 'Options'),
    makeSoftKey('param', 'Param'),
    makeSoftKey('code-marker', 'Code Marker'),
    makeSoftKey('report-data', 'Report Data'),
    makeSoftKey('alarms', 'Alarms'),
    makeSoftKey('sync', 'Sync On/Off'),
  ],
  // Example: pacer mode swaps in the 4:1 softkey.
  Pacer: [
    makeSoftKey('options', 'Options'),
    makeSoftKey('param', 'Param'),
    makeSoftKey('code-marker', 'Code Marker'),
    makeSoftKey('4to1', '4:1'),
    makeSoftKey('report-data', 'Report Data'),
    makeSoftKey('alarms', 'Alarms'),
  ],
  // Example: defib mode keeps the Sync toggle available.
  Defib: [
    makeSoftKey('options', 'Options'),
    makeSoftKey('param', 'Param'),
    makeSoftKey('code-marker', 'Code Marker'),
    makeSoftKey('report-data', 'Report Data'),
    makeSoftKey('alarms', 'Alarms'),
    makeSoftKey('sync', 'Sync On/Off'),
  ],
  // Example: sync engaged → the Sync toggle is highlighted (active).
  Sync: [
    makeSoftKey('options', 'Options'),
    makeSoftKey('param', 'Param'),
    makeSoftKey('code-marker', 'Code Marker'),
    makeSoftKey('report-data', 'Report Data'),
    makeSoftKey('alarms', 'Alarms'),
    makeSoftKey('sync', 'Sync On/Off', { highlighted: true }),
  ],
}

export const SOFTKEY_LAYOUT_NAMES: SoftKeyLayoutName[] = ['Monitor', 'Pacer', 'Defib', 'Sync']

export function getLayout(name: SoftKeyLayoutName): SoftKey[] {
  return SOFTKEY_LAYOUTS[name]
}
