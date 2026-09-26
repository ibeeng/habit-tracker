import { useEffect, useRef, useState } from 'react'
import { X, Send, Link2, Unlink, RefreshCw, Check } from 'lucide-react'
import { useSync } from '../../store/sync'
import { discoverChatId, validateBot } from '../../lib/sync/telegram'
import { cn } from '../../lib/utils'

type View = 'setup' | 'wait' | 'status'

export function SyncModal() {
  const {
    modalOpen,
    setModalOpen,
    settings,
    setSettings,
    disconnect,
    syncPush,
    syncPull,
    status,
    error,
    lastSyncAt,
  } = useSync()
  const [view, setView] = useState<View>('setup')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [botToken, setBotToken] = useState('')
  const [botUsername, setBotUsername] = useState<string | null>(null)
  const [pollMs, setPollMs] = useState(0)
  const pollRef = useRef(false)

  useEffect(() => {
    if (modalOpen) {
      setLocalError(null)
      setView(settings ? 'status' : 'setup')
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

  const startTelegram = async () => {
    setBusy(true)
    setLocalError(null)
    try {
      const username = await validateBot(botToken.trim())
      setBotUsername(username)
      setView('wait')
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
      setView(botUsername ? 'wait' : 'setup')
    } finally {
      setBusy(false)
      pollRef.current = false
    }
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
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 fade-in overflow-y-auto overscroll-contain modal-open"
      onClick={close}
    >
      <div
        className="bg-panel border border-border rounded-md sm:rounded-sm max-w-md w-full shadow-2xl flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'min(90dvh, calc(100dvh - 1.5rem))' }}
      >
        {/* header outside scroll — always visible on mobile */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-accent font-bold text-sm">
            {view === 'status' ? '$ sync --telegram' : '$ sync --setup'}
            <span className="cursor-blink">_</span>
          </h2>
          <button onClick={close} className="text-dim hover:text-fg p-1 -m-1" aria-label="close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="px-4 py-4 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'max(1rem, var(--sab))' }}
        >
        {(localError || error) && (
          <p className="text-xs text-danger mb-3 border border-danger/40 bg-danger/10 rounded-sm px-2 py-1.5">
            {localError ?? error}
          </p>
        )}

        {view === 'status' && settings && (
          <div className="space-y-3">
            <div className="border border-border bg-bg2 rounded-sm p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-fg font-bold">terhubung · telegram</span>
                {settings.telegram?.botUsername && (
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

        {view === 'setup' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 border border-border bg-bg2 rounded-sm p-3">
              <Send className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-fg">Sync via Telegram</div>
                <div className="text-dim mt-0.5 leading-relaxed">
                  data habit dikirim ke bot Telegram milikmu sendiri — aman, gratis, lintas device
                </div>
              </div>
            </div>

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

            <p className="text-[10px] text-muted text-center leading-relaxed">
              data lokal tetap utama · sync opsional · token disimpan di browser kamu
            </p>
          </div>
        )}

        {view === 'wait' && botUsername && (
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
                <span className="text-accent">menunggu pesan… {Math.floor(pollMs / 1000)}s</span>
              ) : (
                'lalu kembali ke sini'
              )}
            </p>
            <button
              onClick={() => {
                pollRef.current = false
                setView('setup')
              }}
              className="w-full text-xs text-dim hover:text-fg py-1"
            >
              ← batal
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
