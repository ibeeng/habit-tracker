import type { AppState } from '../models'

export type SyncProviderId = 'gdrive' | 'telegram'

export interface GdriveCreds {
  accessToken: string
  expiresAt: number
}

export interface TelegramCreds {
  botToken: string
  botUsername?: string
  chatId: number
}

export interface SyncSettings {
  provider: SyncProviderId
  gdrive?: GdriveCreds
  telegram?: TelegramCreds
  lastPushAt?: number
  lastPullAt?: number
}

export interface SyncEnvelope {
  v: 1
  updatedAt: string
  state: AppState
}

export type SyncStatus = 'idle' | 'syncing' | 'error'

export interface SyncBackend {
  push(envelope: SyncEnvelope): Promise<void>
  pull(): Promise<SyncEnvelope | null>
}
