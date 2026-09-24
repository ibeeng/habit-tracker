import type { SyncSettings } from './types'

const KEY = 'rootine:sync:v1'

export function loadSyncSettings(): SyncSettings | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SyncSettings
    if (!s?.provider) return null
    return s
  } catch {
    return null
  }
}

export function saveSyncSettings(s: SyncSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearSyncSettings(): void {
  localStorage.removeItem(KEY)
}
