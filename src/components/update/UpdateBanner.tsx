import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpCircle, X } from 'lucide-react'
import { checkForUpdate, isUpdateSupported } from '../../lib/ota'
import { UpdateModal } from '../update/UpdateModal'

/**
 * Passive update notice.
 *
 * On launch (Android only) the app quietly asks the server whether a newer
 * bundle exists. If it does, a single-line banner appears — nothing is
 * downloaded until the user taps it, which opens the update screen.
 *
 * The check is deliberately fire-and-forget: any failure is silent, because a
 * broken update server must never get in the way of using the app.
 */

const DISMISS_KEY = 'rootine.updateDismissed'

export function UpdateBanner() {
  const [version, setVersion] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isUpdateSupported()) return
    let alive = true

    void (async () => {
      const res = await checkForUpdate()
      if (!alive || res.state !== 'available') return
      // don't nag about a version the user already dismissed
      try {
        if (localStorage.getItem(DISMISS_KEY) === res.version) return
      } catch {
        /* private mode — show it anyway */
      }
      setVersion(res.version)
    })()

    return () => {
      alive = false
    }
  }, [])

  const dismiss = () => {
    if (version) {
      try {
        localStorage.setItem(DISMISS_KEY, version)
      } catch {
        /* ignore */
      }
    }
    setVersion(null)
  }

  return (
    <>
      {version &&
        createPortal(
          <div
            className="fixed left-3 right-3 z-40 fade-in"
            style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-2.5 rounded-sm border border-accent bg-panel shadow-lg">
              <ArrowUpCircle className="w-4 h-4 text-accent shrink-0" />
              <button
                onClick={() => setOpen(true)}
                className="flex-1 text-left text-xs text-fg hover:text-accent transition-colors min-w-0"
              >
                update <span className="tnum text-accent">v{version}</span> tersedia
                <span className="text-dim"> — ketuk untuk pasang</span>
              </button>
              <button
                onClick={dismiss}
                className="p-1 -mr-1 text-dim hover:text-fg shrink-0"
                aria-label="tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {open &&
        createPortal(
          <UpdateModal
            onClose={() => {
              setOpen(false)
              setVersion(null)
            }}
          />,
          document.body,
        )}
    </>
  )
}
