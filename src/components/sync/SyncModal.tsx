import { useEffect, useRef, useState } from 'react'
import { X, HardDrive, Send, Link2, Unlink, RefreshCw, Check } from 'lucide-react'
import { useSync } from '../../store/sync'
import { requestGdriveToken } from '../../lib/sync/gdrive'
import { discoverChatId, validateBot } from '../../lib/sync/telegram'
import type { SyncProviderId } from '../../lib/sync/types'
import { cn } from '../../lib/utils'

type View = 'pick' | 'gdrive' | 'telegram' | 'telegram-wait'

export function SyncModal() {
  const { modalOpen, setModalOpen, settings, setSettings, disconnect, syncPush, syncPull, status, error, lastSyncAt } =
    useSync()
  const [view, setView] = useState<View>('pick')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [botToken, setBotToken] = useState('')
  const [botUsername, setBotUsername] = useState<string | null>(null)
  const [pollMs, setPollMs] = useState(0)
  const pollRef = useRef(false)

  useEffect(() => {
    if (modalOpen) {
      setLocalError(null)
      setView(settings ? 'pick' : 'pick')
      setBotToken('')
      setBotUsername(null)
      setPollMs(0)
    } else {
      pollRef.current = false
    }
  }, [modalOpen, settings])

  if (!modalOpen) return null

  const close = () => {
    pollRef.current = false
    setModalOpen(false)
  }

  const connectGdrive = async () => {
    setBusy(true)
    setLocalError(null)
    try {
      const creds = await requestGdriveToken(true)
      setSettings({ provider: 'gdrive', gdrive: creds, lastPushAt: settings?.lastPushAt })
      await syncPush()
      close()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'gagal hubungkan Google Drive')
    } finally {
      setBusy(false)
    }
  }

  const startTelegram = async () => {
    setBusy(true)
    setLocalError(null)
    try {
      const username = await validateBot(botToken.trim())
      setBotUsername(username)
      setView('telegram-wait')
      pollRef.current = true
      const chatId = await discoverChatId(botToken.trim(), {
        timeoutMs: 90_000,
        onTick: (ms) => {
          if (pollRef.current) setPollMs(ms)
        },
      })
      if (!pollRef.current) return
      setSettings({
        provider: 'telegram',
        telegram: { botToken: botToken.trim(), botUsername: username, chatId },
        lastPushAt: settings?.lastPushAt,
      })
      await syncPush()
      close()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'gagal hubungkan Telegram')
      setView(botUsername ? 'telegram-wait' : 'telegram')
    } finally {
      setBusy(false)
      pollRef.current = false
    }
  }

  const providerLabel: Record<SyncProviderId, string> = {
    gdrive: 'google drive',
    telegram: 'telegram',
  }

  const relTime = (t: number) => {
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in"
      onClick={close}
    >
      <div
        className="bg-panel border border-border rounded-t-md sm:rounded-sm max-w-md w-full p-4 sm:p-5 shadow-2xl max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-accent font-bold text-sm">
            $ sync
            {settings ? ` --${settings.provider}` : ' --setup'}
            <span className="cursor-blink">_</span>
          </h2>
          <button onClick={close} className="text-dim hover:text-fg p-1" aria-label="close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(localError || error) && (
          <p className="text-xs text-danger mb-3 border border-danger/40 bg-danger/10 rounded-sm px-2 py-1.5">
            {localError ?? error}
          </p>
        )}

        {settings && view === 'pick' && (
          <div className="space-y-3">
            <div className="border border-border bg-bg2 rounded-sm p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-fg font-bold">terhubung · {providerLabel[settings.provider]}</span>
                {settings.provider === 'telegram' && settings.telegram?.botUsername && (
                  <span className="text-dim">@{settings.telegram.botUsername}</span>
                )}
              </div>
              <div className="text-[11px] text-dim tnum">
                {status === 'syncing' ? (
                  <span className="text-accent">syncing…</span>
                ) : status === 'error' ? (
                  <span className="text-danger">error</span>
                ) : lastSyncAt ? (
                  <>last sync {relTime(lastSyncAt)}</>
                ) : (
                  <>siap · auto-sync aktif</>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void syncPush()}
                disabled={status === 'syncing'}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-sm border border-border text-dim hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', status === 'syncing' && 'animate-spin')} />
                push sekarang
              </button>
              <button
                onClick={() => void syncPull()}
                disabled={status === 'syncing'}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-sm border border-border text-dim hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', status === 'syncing' && 'animate-spin')} />
                pull sekarang
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm('putuskan sync? data lokal tetap aman.')) disconnect()
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-sm border border-border text-danger hover:bg-danger/10 transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" /> disconnect
            </button>
          </div>
        )}

        {view === 'pick' && !settings && (
          <div className="space-y-2">
            <p className="text-xs text-dim mb-3">
              {'// data tersimpan lokal — pilih tempat sync (opsional)'}
            </p>
            <button
              onClick={() => setView('gdrive')}
              className="w-full text-left px-3 py-3 rounded-sm border border-border bg-bg2 hover:border-accent transition-colors flex items-start gap-3"
            >
              <HardDrive className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <span>
                <span className="block text-xs font-bold text-fg">Google Drive</span>
                <span className="block text-[11px] text-dim mt-0.5">
                  file privat di Drive kamu · auto-sync lintas device
                </span>
              </span>
            </button>
            <button
              onClick={() => setView('telegram')}
              className="w-full text-left px-3 py-3 rounded-sm border border-border bg-bg2 hover:border-accent transition-colors flex items-start gap-3"
            >
              <Send className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <span>
                <span className="block text-xs font-bold text-fg">Telegram</span>
                <span className="block text-[11px] text-dim mt-0.5">
                  simpan backup ke chat bot kamu sendiri
                </span>
              </span>
            </button>
          </div>
        )}

        {view === 'gdrive' && (
          <div className="space-y-3">
            <p className="text-xs text-dim leading-relaxed">
              Rootine minta izin akses <span className="text-accent">appDataFolder</span> di Google
              Drive kamu (file nggak keliatan di My Drive, cuma app ini).
            </p>
            <button
              onClick={() => void connectGdrive()}
              disabled={busy}
              className="w-full px-3 py-2.5 text-xs rounded-sm bg-accent text-bg font-bold hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'membuka google…' : 'hubungkan Google Drive'}
            </button>
            <button onClick={() => setView('pick')} className="w-full text-xs text-dim hover:text-fg py-1">
              ← kembali
            </button>
          </div>
        )}

        {view === 'telegram' && (
          <div className="space-y-3">
            <ol className="text-xs text-dim space-y-1.5 list-decimal list-inside">
              <li>
                Buka{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  @BotFather
                </a>{' '}
                → /newbot → copy <span className="text-fg">token</span>
              </li>
              <li>Kirim pesan apa saja (atau <span className="text-fg">/start</span>) ke bot kamu</li>
              <li>Tempel token di bawah</li>
            </ol>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="w-full px-2.5 py-2 text-xs rounded-sm border border-border bg-bg2 text-fg focus:border-accent focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => void startTelegram()}
              disabled={busy || !botToken.trim()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs rounded-sm bg-accent text-bg font-bold hover:opacity-90 disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              {busy ? 'validasi bot…' : 'hubungkan Telegram'}
            </button>
            <button onClick={() => setView('pick')} className="w-full text-xs text-dim hover:text-fg py-1">
              ← kembali
            </button>
          </div>
        )}

        {view === 'telegram-wait' && botUsername && (
          <div className="space-y-3 text-center">
            <p className="text-xs text-dim">kirim pesan ke</p>
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-accent font-bold text-sm underline underline-offset-2"
            >
              @{botUsername}
            </a>
            <p className="text-xs text-dim">
              {busy ? (
                <span className="text-accent">
                  menunggu pesan… {Math.floor(pollMs / 1000)}s
                </span>
              ) : (
                'lalu kembali ke sini'
              )}
            </p>
            <button
              onClick={() => {
                pollRef.current = false
                setView('telegram')
              }}
              className="w-full text-xs text-dim hover:text-fg py-1"
            >
              ← batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
