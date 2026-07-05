/**
 * Softkey Framework — the model for a single programmable softkey (Package 4).
 *
 * The R Series has SIX physical softkeys along the bottom of the display; the
 * physical keys are part of the LOCKED body geometry (master layer 07_Softkeys)
 * and never change. This framework is the *programmable* layer: React drives each
 * key's label and state, and the layout changes per operating mode.
 *
 * React controls ONLY these fields — never the physical key geometry.
 */
export interface SoftKey {
  /** stable identifier (used for keys/actions). */
  id: string
  /** printed legend; '' renders a blank key. */
  label: string
  /** false → shown but not selectable (dimmed). */
  enabled: boolean
  /** false → the key slot is empty (no legend, no background). */
  visible: boolean
  /** true → active/selected accent (e.g. a toggle that is ON). */
  highlighted: boolean
  /** true → momentarily pressed. */
  pressed: boolean
}

/** The R Series has six physical softkeys. */
export const SOFTKEY_COUNT = 6

/** Build a softkey with sensible defaults; override any field. */
export function makeSoftKey(id: string, label: string, overrides: Partial<SoftKey> = {}): SoftKey {
  return {
    id,
    label,
    enabled: true,
    visible: true,
    highlighted: false,
    pressed: false,
    ...overrides,
  }
}

/**
 * Normalize a layout to exactly SOFTKEY_COUNT slots so the six physical keys
 * always line up. Extra keys are dropped; short rows are padded with hidden
 * blank slots.
 */
export function normalizeRow(keys: SoftKey[]): SoftKey[] {
  const row = keys.slice(0, SOFTKEY_COUNT)
  while (row.length < SOFTKEY_COUNT) {
    row.push(makeSoftKey(`blank-${row.length}`, '', { visible: false }))
  }
  return row
}
