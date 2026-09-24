import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  clearSession,
  GOOGLE_CLIENT_ID,
  loadSession,
  saveSession,
  type AuthUser,
} from '../lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  clientId: string
  signIn: (user: AuthUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession())

  const signIn = useCallback((next: AuthUser) => {
    saveSession(next)
    setUser(next)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, clientId: GOOGLE_CLIENT_ID, signIn, signOut }),
    [user, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
