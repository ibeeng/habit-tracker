export const AUTH_STORAGE_KEY = 'rootine:auth:v1'

export interface AuthUser {
  sub: string
  email: string
  name: string
  picture?: string
  exp: number
}

// OAuth client ID is public by design (embedded in frontend).
// VITE_GOOGLE_CLIENT_ID overrides when set (local .env / CI secret).
const FALLBACK_CLIENT_ID =
  '561242860865-dvvp42mpaumgvdln8k4odjt09kgtn0bc.apps.googleusercontent.com'

export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID

interface GoogleAccountsId {
  initialize: (cfg: Record<string, unknown>) => void
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
      }
    }
  }
}

function b64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return atob(padded + pad)
}

export function parseJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = decodeURIComponent(
      b64UrlDecode(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    const p = JSON.parse(json) as {
      sub?: string
      email?: string
      name?: string
      picture?: string
      exp?: number
    }
    if (!p.sub || typeof p.exp !== 'number') return null
    return {
      sub: p.sub,
      email: p.email ?? '',
      name: p.name ?? p.email ?? 'user',
      picture: p.picture,
      exp: p.exp,
    }
  } catch {
    return null
  }
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    if (!user?.sub || typeof user.exp !== 'number' || user.exp * 1000 < Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return user
  } catch {
    return null
  }
}

export function saveSession(user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    window.google?.accounts.id.disableAutoSelect()
  } catch {
    /* ignore */
  }
}

export function loadGoogleSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error(' gsi load error')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.gsi = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(' gsi load error'))
    document.head.appendChild(script)
  })
}

export function renderGoogleButton(
  el: HTMLElement,
  clientId: string,
  onSuccess: (user: AuthUser) => void,
  onError: (message: string) => void,
): void {
  const google = window.google
  if (!google?.accounts?.id) {
    onError('google sdk belum siap')
    return
  }

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp: { credential?: string }) => {
      if (!resp.credential) {
        onError('login gagal — credential kosong')
        return
      }
      const user = parseJwt(resp.credential)
      if (!user) {
        onError('login gagal — token tidak valid')
        return
      }
      onSuccess(user)
    },
    error_callback: (err: { type?: string }) => {
      if (err?.type === 'popup_closed' || err?.type === 'skip_by_user') return
      onError('login dibatalkan')
    },
  })

  google.accounts.id.renderButton(el, {
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    width: 280,
  })
}
