import { useEffect, useRef, useState } from 'react'
import { Sprout } from 'lucide-react'
import { loadGoogleSdk, renderGoogleButton } from '../../lib/auth'
import { useAuth } from '../../store/auth'

export function LoginScreen() {
  const { clientId, signIn } = useAuth()
  const mountRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID belum di-set — cek .env / GitHub secret')
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        await loadGoogleSdk()
        if (cancelled) return
        const mount = mountRef.current
        if (!mount) return
        // clear any prior GIS nodes (StrictMode double-effect / remount)
        mount.replaceChildren()
        renderedRef.current = true
        renderGoogleButton(
          mount,
          clientId,
          (user) => signIn(user),
          (msg) => {
            if (!cancelled) setError(msg)
          },
        )
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError('gagal load Google Sign-In — cek koneksi')
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clientId, signIn])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg text-fg font-mono px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sprout className="w-6 h-6 text-accent" />
            <span className="text-2xl font-bold text-accent tracking-tight">rootine</span>
          </div>
          <p className="text-xs text-dim">// terminal habit tracker PWA</p>
        </div>

        <div className="border border-border bg-panel rounded-sm p-5 space-y-4">
          <div className="text-[11px] text-muted leading-relaxed">
            <div>
              <span className="text-accent">$</span> rootine --login
            </div>
            <div className="text-dim mt-1">{'// akses terbatas — sign in dulu ya'}</div>
          </div>

          {/* loading is a SIBLING of the GIS mount node — React never owns GIS children */}
          <div className="flex justify-center min-h-11">
            {loading && !error && (
              <span className="text-[11px] text-dim animate-pulse self-center">
                loading google sign-in…
              </span>
            )}
            <div ref={mountRef} />
          </div>

          {error && <p className="text-xs text-danger text-center break-words">{error}</p>}

          <p className="text-[10px] text-muted text-center leading-relaxed">
            data disimpan lokal di browser kamu
          </p>
        </div>

        <p className="text-center text-[10px] text-muted">v0.1.0</p>
      </div>
    </div>
  )
}
