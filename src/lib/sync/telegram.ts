import type { SyncBackend, SyncEnvelope, TelegramCreds } from './types'

function base(token: string): string {
  return `https://api.telegram.org/bot${token}/`
}

async function tg<T>(token: string, method: string, params?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${base(token)}${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
  })
  if (!res.ok) throw new Error(`Telegram ${method} HTTP ${res.status}`)
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string }
  if (!data.ok) throw new Error(data.description ?? `Telegram ${method} gagal`)
  return data.result as T
}

export async function validateBot(botToken: string): Promise<string> {
  const me = await tg<{ username?: string }>(botToken, 'getMe')
  if (!me?.username) throw new Error('token bot tidak valid')
  return me.username
}

/** Poll getUpdates until user sends any message → capture chat_id */
export async function discoverChatId(
  botToken: string,
  opts?: { timeoutMs?: number; onTick?: (elapsedMs: number) => void },
): Promise<number> {
  const timeoutMs = opts?.timeoutMs ?? 90_000
  const start = Date.now()
  let offset = 0

  while (Date.now() - start < timeoutMs) {
    opts?.onTick?.(Date.now() - start)
    try {
      const updates = await tg<{ update_id: number; message?: { chat?: { id?: number } } }[]>(
        botToken,
        'getUpdates',
        { timeout: 5, offset, allowed_updates: ['message'] },
      )
      for (const u of updates) {
        offset = u.update_id + 1
        const chatId = u.message?.chat?.id
        if (typeof chatId === 'number' && chatId > 0) return chatId
      }
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('timeout — pastikan kamu sudah kirim /start ke bot')
}

/** Pointer: bot description stores latest document file_id (max 512 chars) */
async function setPointer(token: string, fileId: string): Promise<void> {
  const description = fileId.length <= 512 ? fileId : `rootine:${fileId}`.slice(0, 512)
  await tg(token, 'setMyDescription', { description })
}

async function getPointer(token: string): Promise<string | null> {
  const result = await tg<{ description?: string }>(token, 'getMyDescription')
  const d = (result?.description ?? '').trim()
  if (!d) return null
  return d.startsWith('rootine:') ? d.slice(8) : d
}

export function telegramBackend(getCreds: () => TelegramCreds): SyncBackend {
  return {
    async push(envelope) {
      const { botToken, chatId } = getCreds()
      const body = JSON.stringify(envelope, null, 2)
      const fd = new FormData()
      fd.append('chat_id', String(chatId))
      fd.append('document', new Blob([body], { type: 'application/json' }), 'rootine.json')
      fd.append('caption', `rootine sync ${envelope.updatedAt}`)

      const res = await fetch(`${base(botToken)}sendDocument`, { method: 'POST', body: fd })
      const data = (await res.json()) as {
        ok: boolean
        result?: { document?: { file_id?: string } }
        description?: string
      }
      if (!data.ok) throw new Error(data.description ?? 'sendDocument gagal')
      const fileId = data.result?.document?.file_id
      if (fileId) await setPointer(botToken, fileId)
    },
    async pull() {
      const { botToken } = getCreds()
      const fileId = await getPointer(botToken)
      if (!fileId) return null
      const file = await tg<{ file_path?: string }>(botToken, 'getFile', { file_id: fileId })
      if (!file?.file_path) throw new Error('file sync tidak ditemukan')
      const res = await fetch(`https://api.telegram.org/file/bot${botToken}/${file.file_path}`)
      if (!res.ok) throw new Error(`download file gagal (${res.status})`)
      const parsed = JSON.parse(await res.text()) as SyncEnvelope
      if (!parsed?.state || !parsed?.updatedAt) return null
      return parsed
    },
  }
}
