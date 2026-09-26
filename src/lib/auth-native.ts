import { SocialLogin } from '@capgo/capacitor-social-login'
import { parseJwt, type AuthUser } from './auth'

// the id token audience must be a **web** client id; Play Services authorises the
// app itself through the Android client (package name + signing cert)
const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/** true when running inside the Capacitor shell (web build keeps GIS) */
export function isNative(): boolean {
  return import.meta.env.VITE_NATIVE === '1'
}

let ready: Promise<void> | null = null

function ensureInit(): Promise<void> {
  ready ??= SocialLogin.initialize({ google: { webClientId: WEB_CLIENT_ID } })
  return ready
}

/**
 * Google blocks the OAuth consent screen inside a WebView, so the Android build
 * signs in through the native Google Identity API (Play Services / Credential
 * Manager) via @capgo/capacitor-social-login. Needs an OAuth client of type
 * "Android" (package com.waalid.rootine + this app's SHA-1) in Google Cloud.
 */
export async function signInWithGoogleNative(): Promise<AuthUser> {
  if (!WEB_CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID belum di-set')
  await ensureInit()

  const raw = (await SocialLogin.login({ provider: 'google', options: {} })) as {
    result?: {
      idToken?: string | null
      profile?: { email?: string | null; givenName?: string | null; familyName?: string | null }
    }
    idToken?: string | null
    profile?: { email?: string | null; givenName?: string | null; familyName?: string | null }
  }
  // the native side wraps the payload: { provider, result: { idToken, profile, ... } }
  const res = raw.result ?? raw

  if (res.idToken) {
    const user = parseJwt(res.idToken)
    if (user) return user
  }

  // authentication-only fallback when no id token comes back
  const email = res.profile?.email
  if (!email) throw new Error('login gagal — google gak mengembalikan email')
  const name = [res.profile?.givenName, res.profile?.familyName].filter(Boolean).join(' ')
  return {
    sub: email,
    email,
    name: name || email.split('@')[0],
    exp: Math.floor(Date.now() / 1000) + 30 * 86400,
  }
}
