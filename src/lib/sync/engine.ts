import type { AppState } from '../models'
import { loadSyncSettings, saveSyncSettings } from './settings'
import { telegramBackend } from './telegram'
import type { SyncBackend, SyncEnvelope, SyncSettings } from './types'

export function makeEnvelope(state: AppState): SyncEnvelope {
  return {
    v: 1,
    updatedAt: new Date().toISOString(),
    state: { ...state, updatedAt: new Date().toISOString() },
  }
}

export function pickNewer(local: AppState, remote: AppState): AppState {
  const lt = Date.parse(local.updatedAt ?? '0') || 0
  const rt = Date.parse(remote.updatedAt ?? '0') || 0
  return rt > lt ? remote : local
}

function backendFor(settings: SyncSettings): SyncBackend {
  if (settings.provider === 'telegram') {
    if (!settings.telegram) throw new Error('Telegram belum terhubung')
    return telegramBackend(() => {
      const s = loadSyncSettings()
      if (!s?.telegram) throw new Error('Telegram belum terhubung')
      return s.telegram
    })
  }
  throw new Error('sync belum diatur')
}

export async function pushState(state: AppState): Promise<void> {
  const settings = loadSyncSettings()
  if (!settings) return
  const backend = backendFor(settings)
  await backend.push(makeEnvelope(state))
  saveSyncSettings({ ...settings, lastPushAt: Date.now() })
}

export async function pullState(): Promise<AppState | null> {
  const settings = loadSyncSettings()
  if (!settings) return null
  const backend = backendFor(settings)
  const envelope = await backend.pull()
  saveSyncSettings({ ...settings, lastPullAt: Date.now() })
  if (!envelope?.state) return null
  return envelope.state
}
