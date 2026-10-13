import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { isNative } from './auth-native'

/**
 * Live updates (self-hosted), **manual mode**.
 *
 * The app ships a web bundle inside the APK. Our own endpoint
 * (`https://telba.xyz/rootine-ota/updates`) tells us when a newer bundle
 * exists. Nothing is downloaded or swapped behind the user's back:
 * `autoUpdate` is OFF, so the check is passive and the swap only happens
 * after an explicit tap in Settings.
 *
 * Flow:
 *   1. `notifyAppReady()` on every launch — without it the native plugin
 *      assumes the bundle is broken and rolls back to the previous one.
 *   2. `checkForUpdate()` — pure read, asks the server what's out there.
 *   3. `downloadAndApply()` — only from a user tap: download → stage → reload.
 *
 * Only web assets travel this way. New native plugins or permissions still
 * need a fresh APK.
 */

export const UPDATE_URL = 'https://telba.xyz/rootine-ota/updates'

/** Live updates only exist inside the Android shell, not in the browser build. */
export function isUpdateSupported(): boolean {
  return isNative()
}

export type OtaCheck =
  /** running as a plain web app — no updater available */
  | { state: 'unsupported' }
  | { state: 'current'; version: string }
  | {
      state: 'available'
      version: string
      url: string
      checksum?: string
      notes?: string
      link?: string
    }
  | { state: 'error'; message: string }

function log(...args: unknown[]) {
  if (import.meta.env.DEV) console.log('[ota]', ...args)
}

/** Version of the bundle currently running (an OTA bundle or the APK's builtin one). */
export async function currentVersion(): Promise<string> {
  if (!isNative()) return __APP_VERSION__
  try {
    const res = await CapacitorUpdater.current()
    return res.bundle?.version ?? __APP_VERSION__
  } catch (err) {
    log('current() failed', err)
    return __APP_VERSION__
  }
}

/**
 * Which bundle is actually running — the APK's builtin one or a downloaded
 * OTA bundle — plus the builtin version for rollback labels.
 *
 * NOTE: `__APP_VERSION__` of the *running* bundle is useless here: after an
 * OTA apply the downloaded bundle's baked version equals its own installed
 * version, so comparing those never detects an OTA run (that bug hid the
 * rollback button). The native `id`/`native` fields are the source of truth.
 */
export async function bundleState(): Promise<{
  isBuiltin: boolean
  builtinVersion: string
}> {
  if (!isNative()) return { isBuiltin: true, builtinVersion: __APP_VERSION__ }
  try {
    const res = await CapacitorUpdater.current()
    return {
      isBuiltin: res.bundle?.id === 'builtin',
      builtinVersion: res.native || __APP_VERSION__,
    }
  } catch (err) {
    log('current() failed', err)
    return { isBuiltin: true, builtinVersion: __APP_VERSION__ }
  }
}

/**
 * Wire up the plugin. Must run before React renders, because `notifyAppReady()`
 * decides whether this bundle is kept or rolled back by the native watchdog.
 * Deliberately does NOT check for updates — that happens when the user asks.
 */
export async function initOta(): Promise<void> {
  if (!isNative()) return
  try {
    await CapacitorUpdater.notifyAppReady()
    log('notifyAppReady ok')
  } catch (err) {
    // a broken updater must never stop the app from working
    log('notifyAppReady failed', err)
  }
}

/**
 * Ask the server whether a newer bundle exists. Read-only: nothing is
 * downloaded here, so it is safe to call on demand from Settings.
 */
export async function checkForUpdate(): Promise<OtaCheck> {
  if (!isNative()) return { state: 'unsupported' }

  try {
    const cur = await currentVersion()
    const latest = await CapacitorUpdater.getLatest()

    // the plugin reports "no new version available" through `message`
    const noUpdate =
      !latest?.version ||
      latest.version === cur ||
      /no new version/i.test(latest.message ?? '')

    if (noUpdate) return { state: 'current', version: cur }

    // without a URL there is nothing we could download
    if (!latest.url) return { state: 'current', version: cur }

    return {
      state: 'available',
      version: latest.version,
      url: latest.url,
      checksum: latest.checksum,
      notes: latest.comment,
      link: latest.link,
    }
  } catch (err) {
    return { state: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Download the new bundle and switch to it. **Only call this from a user tap.**
 *
 * The download is verified by the native plugin against the server checksum
 * (SHA-256) before it is staged, and `reload()` restarts the WebView on the new
 * code. If anything fails the current bundle keeps running untouched.
 */
export async function downloadAndApply(
  update: { version: string; url: string; checksum?: string },
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (!isNative()) throw new Error('update hanya tersedia di aplikasi Android')

  const handle = await CapacitorUpdater.addListener('download', (e) => {
    onProgress?.(Math.round(e.percent ?? 0))
  })

  try {
    const bundle = await CapacitorUpdater.download({
      url: update.url,
      version: update.version,
      checksum: update.checksum,
    })
    // stage it; reload() below applies it immediately
    await CapacitorUpdater.next({ id: bundle.id })
  } finally {
    await handle.remove()
  }

  await CapacitorUpdater.reload()
}

/** Roll back to the bundle that shipped inside the APK (escape hatch). */
export async function resetToBuiltin(): Promise<void> {
  if (!isNative()) return
  await CapacitorUpdater.reset()
  await CapacitorUpdater.reload()
}
