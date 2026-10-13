import { useEffect, useState } from 'react'
import { X, Download, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  bundleState,
  checkForUpdate,
  currentVersion,
  downloadAndApply,
  resetToBuiltin,
  type OtaCheck,
} from '../../lib/ota'
import { cn } from '../../lib/utils'

/**
 * Update screen (Settings → cek update).
 *
 * Nothing updates on its own: this panel only *asks* the server, and a single
 * tap on "update sekarang" downloads + applies the new bundle. The app then
 * reloads on the new code.
 */

type Phase =
  | { kind: 'checking' }
  | { kind: 'result'; check: OtaCheck }
  | { kind: 'downloading'; percent: number; version: string }
  | { kind: 'applying'; version: string }
  | { kind: 'failed'; message: string }

export function UpdateModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' })
  const [installed, setInstalled] = useState<string | null>(null)
  const [fromOta, setFromOta] = useState(false)
  const [builtinVer, setBuiltinVer] = useState<string | null>(null)
  const [confirmRollback, setConfirmRollback] = useState(false)

  const runCheck = async () => {
    setPhase({ kind: 'checking' })
    setConfirmRollback(false)
    const [cur, st, res] = await Promise.all([
      currentVersion(),
      bundleState(),
      checkForUpdate(),
    ])
    setInstalled(cur)
    setFromOta(!st.isBuiltin)
    setBuiltinVer(st.builtinVersion)
    setPhase({ kind: 'result', check: res })
  }

  useEffect(() => {
    void runCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const apply = async (version: string, url: string, checksum?: string) => {
    setPhase({ kind: 'downloading', percent: 0, version })
    try {
      await downloadAndApply({ version, url, checksum }, (percent) =>
        setPhase({ kind: 'downloading', percent, version }),
      )
      // reload() is already in flight — the app restarts on the new bundle
      setPhase({ kind: 'applying', version })
    } catch (err) {
      setPhase({
        kind: 'failed',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const rollback = async () => {
    setPhase({ kind: 'applying', version: installed ?? '?' })
    try {
      await resetToBuiltin()
    } catch (err) {
      setPhase({
        kind: 'failed',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const busy = phase.kind === 'downloading' || phase.kind === 'applying'
  // `const` keeps the narrowing inside the click closures below
  const avail =
    phase.kind === 'result' && phase.check.state === 'available' ? phase.check : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/70" onClick={busy ? undefined : onClose} />
      <div className="relative w-full sm:max-w-md bg-panel border border-border rounded-t-sm sm:rounded-sm shadow-xl fade-in max-h-[90dvh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border sticky top-0 bg-panel z-10">
          <RefreshCw className="w-4 h-4 text-accent shrink-0" />
          <span className="font-bold text-sm text-fg">update aplikasi</span>
          <button
            onClick={onClose}
            disabled={busy}
            className="ml-auto p-1.5 -mr-1 rounded-sm text-dim hover:text-fg disabled:opacity-40"
            aria-label="tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 text-xs">
          {/* installed version */}
          <div className="flex items-center justify-between gap-2 text-dim">
            <span>versi terpasang</span>
            <span className="tnum text-fg">{installed ?? __APP_VERSION__}</span>
          </div>

          {phase.kind === 'checking' && (
            <div className="py-6 text-center text-dim">memeriksa update…</div>
          )}

          {phase.kind === 'result' && phase.check.state === 'current' && (
            <div className="border border-border rounded-sm p-3 flex items-start gap-2">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="text-fg">aplikasi sudah versi terbaru</div>
                <div className="text-dim mt-0.5 tnum">v{phase.check.version}</div>
              </div>
            </div>
          )}

          {avail && (
            <>
              <div className="border border-accent rounded-sm p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-fg font-bold">update tersedia</div>
                    <div className="text-dim mt-0.5 tnum">
                      v{installed ?? __APP_VERSION__} → v{avail.version}
                    </div>
                  </div>
                </div>
                {avail.notes && (
                  <div className="text-dim border-t border-border pt-2 whitespace-pre-wrap">
                    {avail.notes}
                  </div>
                )}
              </div>

              <p className="text-dim leading-relaxed">
                Satu klik: bundle baru diunduh, diverifikasi, lalu app restart sendiri
                pakai versi baru. Data habit kamu tidak terpengaruh.
              </p>

              <button
                onClick={() => void apply(avail.version, avail.url, avail.checksum)}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-sm bg-accent text-bg font-bold hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" /> update sekarang
              </button>
            </>
          )}

          {phase.kind === 'result' && phase.check.state === 'unsupported' && (
            <div className="border border-border rounded-sm p-3 text-dim">
              Update otomatis hanya tersedia di aplikasi Android. Di browser, cukup
              refresh halaman untuk versi terbaru.
            </div>
          )}

          {phase.kind === 'result' && phase.check.state === 'error' && (
            <div className="border border-danger rounded-sm p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-danger">gagal memeriksa update</div>
                <div className="text-dim mt-0.5 break-words">{phase.check.message}</div>
              </div>
            </div>
          )}

          {phase.kind === 'downloading' && (
            <div className="space-y-2 py-2">
              <div className="text-fg">
                mengunduh v{phase.version}… <span className="tnum text-accent">{phase.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-heat0 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, phase.percent))}%` }}
                />
              </div>
            </div>
          )}

          {phase.kind === 'applying' && (
            <div className="py-6 text-center text-fg">menerapkan v{phase.version}…</div>
          )}

          {phase.kind === 'failed' && (
            <>
              <div className="border border-danger rounded-sm p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-danger">update gagal</div>
                  <div className="text-dim mt-0.5 break-words">{phase.message}</div>
                </div>
              </div>
              <p className="text-dim">
                Versi lama kamu tetap jalan normal. Coba lagi nanti atau saat sinyal
                lebih stabil.
              </p>
            </>
          )}

          {/* footer actions */}
          <div className="flex items-center gap-2 pt-1">
            {!busy && (
              <button
                onClick={() => void runCheck()}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm border border-border text-dim hover:text-accent hover:border-accent transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> cek ulang
              </button>
            )}
            {!busy && phase.kind === 'result' && phase.check.state === 'current' && (
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 rounded-sm bg-accent text-bg font-bold hover:opacity-90 transition-opacity"
              >
                tutup
              </button>
            )}
          </div>

          {/* escape hatch: only when a downloaded bundle is actually running
              (detected from the native bundle id, not from version strings) */}
          {!busy && fromOta && (
            <div className="border-t border-border pt-3">
              {confirmRollback ? (
                <div className="space-y-2">
                  <div className="text-dim">
                    Balik ke versi bawaan APK (v{builtinVer ?? '?'})? Hanya kalau update
                    terasa bermasalah.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRollback(false)}
                      className="flex-1 px-3 py-2 rounded-sm border border-border text-dim hover:text-fg"
                    >
                      batal
                    </button>
                    <button
                      onClick={() => void rollback()}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-sm border border-danger text-danger',
                        'hover:bg-danger hover:text-bg transition-colors',
                      )}
                    >
                      ya, balikin
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRollback(true)}
                  className="w-full text-center text-dim hover:text-danger transition-colors py-1"
                >
                  balik ke versi bawaan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
