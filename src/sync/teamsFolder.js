/**
 * teamsFolder — saves signed-off records directly into a local folder (e.g. a
 * Microsoft Teams channel's Files folder, kept in sync locally via the
 * OneDrive/Teams desktop client) using the File System Access API, instead of
 * a browser download.
 *
 * Chromium-only (Chrome/Edge) — the API doesn't exist in Safari/Firefox, so
 * callers must check `isFolderSaveSupported()` and fall back to a download.
 * The chosen folder's handle is remembered in IndexedDB so only the first
 * sign-off on a given browser needs the folder picker; later ones save
 * silently as long as permission is still granted.
 */
const DB_NAME = 'guided-signoff-fs'
const STORE = 'handles'
const KEY = 'teamsFolder'

export function isFolderSaveSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key, value) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** The remembered folder handle, if permission is still granted — else null (no picker prompt). */
export async function getSavedFolder() {
  const handle = await idbGet(KEY)
  if (!handle) return null
  try {
    return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted' ? handle : null
  } catch {
    return null
  }
}

/** Opens the folder picker (requires a user gesture) and remembers the choice for next time. */
export async function pickTeamsFolder() {
  const handle = await window.showDirectoryPicker({ id: 'guided-signoff-teams-folder', mode: 'readwrite' })
  await idbSet(KEY, handle)
  return handle
}

export async function writeFileToFolder(folderHandle, filename, contents) {
  const fileHandle = await folderHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(contents)
  await writable.close()
}
