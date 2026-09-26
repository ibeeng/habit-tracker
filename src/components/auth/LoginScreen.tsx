import { useEffect, useRef, useState } from 'react'
import { Sprout } from 'lucide-react'
import { loadGoogleSdk, renderGoogleButton } from '../../lib/auth'
import { isNative, signInWithGoogleNative } from '../../lib/auth-native'
import { useAuth } from '../../store/auth'

export function LoginScreen() {
  const { clientId, signIn } = useAuth()
  const mountRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [armed, setArmed] = useState(false)
  const [gisReady, setGisReady] = useState(false)

  // Android: Google blocks the consent screen inside a WebView, so the flow runs
  // in a Custom Tab and returns through the app scheme (see lib/auth-native)
  const startNativeLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      signIn(await signInWithGoogleNative())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'login gagal')
    } finally {
      setLoading(false)
    }
  }

  // GIS is a heavy third-party script — only pulled after the user asks for
  // it, so the app shell paints without waiting on accounts.google.com
  useEffect(() => {
    if (!armed || isNative()) return
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID belum di-set — cek .env / GitHub secret')
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        await loadGoogleSdk()
        if (cancelled) return
        const mount = mountRef.current
        if (!mount) return
        // clear any prior GIS nodes (StrictMode double-effect / remount)
        mount.replaceChildren()
        setGisReady(true)
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
  }, [armed, clientId, signIn])

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
                {isNative() ? 'opening google sign-in…' : 'loading google sign-in…'}
              </span>
            )}
            <div ref={mountRef} />
            {!gisReady && !loading && !error && (
              <button
                onClick={() => (isNative() ? startNativeLogin() : setArmed(true))}
                className="w-full px-4 py-2.5 text-xs font-bold rounded-sm bg-accent text-bg hover:opacity-90 transition-opacity"
              >
                continue with google
              </button>
            )}
          </div>

          {error && <p className="text-xs text-danger text-center break-words">{error}</p>}

          <p className="text-[10px] text-muted text-center leading-relaxed">
            {isNative() ? 'data disimpan lokal di perangkat kamu' : 'data disimpan lokal di browser kamu'}
          </p>
        </div>

        <p className="text-center text-[10px] text-muted leading-relaxed">
          v0.1.0 ·{' '}
          <a href="./privacy.html" className="underline underline-offset-2 hover:text-accent" target="_blank" rel="noreferrer">
            privacy
          </a>{' '}
          ·{' '}
          <a href="./terms.html" className="underline underline-offset-2 hover:text-accent" target="_blank" rel="noreferrer">
            terms
          </a>
        </p>
      </div>
    </div>
  )
}
