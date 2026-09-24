import { GOOGLE_CLIENT_ID, loadGoogleSdk } from '../auth'
import type { GdriveCreds, SyncBackend, SyncEnvelope } from './types'

const FILE_NAME = 'rootine.json'
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const API = 'https://www.googleapis.com/drive/v3'

async function api(token: string, path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  return res
}

export async function requestGdriveToken(interactive = true): Promise<GdriveCreds> {
  await loadGoogleSdk()
  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) throw new Error('Google SDK oauth2 belum siap')
  if (!GOOGLE_CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID belum di-set')

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? 'gagal dapat token Drive'))
          return
        }
        resolve({
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000,
        })
      },
    })
    try {
      client.requestAccessToken(interactive ? undefined : { prompt: '' })
    } catch (e) {
      reject(e instanceof Error ? e : new Error('token request gagal'))
    }
  })
}

async function ensureToken(creds: GdriveCreds): Promise<GdriveCreds> {
  if (creds.expiresAt - Date.now() > 60_000) return creds
  return requestGdriveToken(true)
}

async function findFileId(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${FILE_NAME}' and spaces='appDataFolder' and trashed=false`)
  const res = await api(token, `/files?q=${q}&fields=files(id,name)&spaces=appDataFolder`)
  if (!res.ok) throw new Error(`Drive list gagal (${res.status})`)
  const data = (await res.json()) as { files?: { id: string }[] }
  return data.files?.[0]?.id ?? null
}

async function uploadNew(token: string, body: string): Promise<string> {
  const boundary = 'rootinebound'
  const meta = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })
  const payload =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${meta}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`

  const res = await api(token, '/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: payload,
  })
  if (!res.ok) throw new Error(`Drive upload gagal (${res.status})`)
  const data = (await res.json()) as { id: string }
  return data.id
}

async function patchFile(token: string, id: string, body: string): Promise<void> {
  const res = await api(token, `/files/${id}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) throw new Error(`Drive update gagal (${res.status})`)
}

async function downloadFile(token: string, id: string): Promise<string> {
  const res = await api(token, `/files/${id}?alt=media`)
  if (!res.ok) throw new Error(`Drive download gagal (${res.status})`)
  return res.text()
}

export function gdriveBackend(getCreds: () => GdriveCreds, setCreds: (c: GdriveCreds) => void): SyncBackend {
  return {
    async push(envelope) {
      const creds = await ensureToken(getCreds())
      if (creds !== getCreds()) setCreds(creds)
      const body = JSON.stringify(envelope)
      const id = await findFileId(creds.accessToken)
      if (id) await patchFile(creds.accessToken, id, body)
      else await uploadNew(creds.accessToken, body)
    },
    async pull() {
      const creds = await ensureToken(getCreds())
      if (creds !== getCreds()) setCreds(creds)
      const id = await findFileId(creds.accessToken)
      if (!id) return null
      const text = await downloadFile(creds.accessToken, id)
      const parsed = JSON.parse(text) as SyncEnvelope
      if (!parsed?.state || !parsed?.updatedAt) return null
      return parsed
    },
  }
}
