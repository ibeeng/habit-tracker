import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSyncSettings,
  loadSyncSettings,
  saveSyncSettings,
} from '../lib/sync/settings'
import { pullState, pushState } from '../lib/sync/engine'
import type { SyncSettings, SyncStatus } from '../lib/sync/types'
import { useHabits } from './useHabits'
import { useAuth } from './auth'

interface SyncContextValue {
  settings: SyncSettings | null
  status: SyncStatus
  error: string | null
  lastSyncAt: number | null
  modalOpen: boolean
  setModalOpen: (v: boolean) => void
  setSettings: (s: SyncSettings) => void
  disconnect: () => void
  syncPush: () => Promise<void>
  syncPull: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

const PUSH_DEBOUNCE_MS = 8000

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { state, applyRemoteState, toast } = useHabits()
  const [settings, setSettingsState] = useState<SyncSettings | null>(() =>
    user ? loadSyncSettings() : null,
  )
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const skipNextPush = useRef(false)
  const bootedPull = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const busy = useRef(false)

  // reload settings when login state changes
  useEffect(() => {
    if (user) {
      setSettingsState(loadSyncSettings())
    } else {
      setSettingsState(null)
      setModalOpen(false)
    }
    bootedPull.current = false
  }, [user])

  const setSettings = useCallback((s: SyncSettings) => {
    saveSyncSettings(s)
    setSettingsState(s)
  }, [])

  const disconnect = useCallback(() => {
    clearSyncSettings()
    setSettingsState(null)
    setError(null)
    setStatus('idle')
    toast('[ok] sync disconnected')
  }, [toast])

  const syncPush = useCallback(async () => {
    const s = settingsRef.current
    if (!s || busy.current) return
    busy.current = true
    setStatus('syncing')
    setError(null)
    try {
      await pushState(stateRef.current)
      setLastSyncAt(Date.now())
      setStatus('idle')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'sync push gagal')
    } finally {
      busy.current = false
    }
  }, [])

  const syncPull = useCallback(async () => {
    const s = settingsRef.current
    if (!s || busy.current) return
    busy.current = true
    setStatus('syncing')
    setError(null)
    try {
      const remote = await pullState()
      if (remote) {
        const lt = Date.parse(stateRef.current.updatedAt ?? '0') || 0
        const rt = Date.parse(remote.updatedAt ?? '0') || 0
        if (rt > lt) {
          skipNextPush.current = true
          applyRemoteState(remote)
        }
      }
      setLastSyncAt(Date.now())
      setStatus('idle')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'sync pull gagal')
    } finally {
      busy.current = false
    }
  }, [applyRemoteState])

  // boot pull (once after login if configured)
  useEffect(() => {
    if (!user || !settings || bootedPull.current) return
    bootedPull.current = true
    void (async () => {
      await syncPull()
    })()
  }, [user, settings, syncPull])

  // debounced auto-push on state change
  useEffect(() => {
    if (!user || !settings) return
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    const t = setTimeout(() => {
      void syncPush()
    }, PUSH_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user, settings])

  const value = useMemo(
    () => ({
      settings,
      status,
      error,
      lastSyncAt,
      modalOpen,
      setModalOpen,
      setSettings,
      disconnect,
      syncPush,
      syncPull,
    }),
    [settings, status, error, lastSyncAt, modalOpen, setSettings, disconnect, syncPush, syncPull],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync outside provider')
  return ctx
}

// re-export for convenience
export type { SyncSettings }
