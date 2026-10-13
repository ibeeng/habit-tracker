// Rootine dukungan bot — Telegram webhook (@ibedestudio_bot)
// Deploy: npx wrangler deploy (dari folder bot/)
// Secrets: BOT_TOKEN, WEBHOOK_SECRET — vars: BANK_TEXT, PHOTO_URL

const TMAPI = 'https://api.telegram.org/bot';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (request.method !== 'POST' || pathname !== '/telegram-webhook') {
      return new Response(pathname === '/' ? 'rootine-bot: telegram webhook' : 'not found', {
        status: pathname === '/' ? 200 : 404,
      });
    }
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 });
    }
    let update;
    try {
      update = await request.json();
    } catch {
      return new Response('bad json', { status: 400 });
    }
    ctx.waitUntil(handle(update, env));
    return new Response('ok');
  },
};

function caption(env) {
  let t =
    'Halo! Ini cara dukung Rootine 👇\n\n' +
    'Rp49.000 sekali — atau seikhlasnya, nggak wajib.\n';
  if (env.PHOTO_URL) {
    t += '\nScan QRIS di atas pakai app bank / e-wallet apa aja (GoPay, OVO, DANA...).';
  } else {
    t += '\nScan QRIS pakai app bank / e-wallet apa aja (GoPay, OVO, DANA...).';
  }
  if (env.BANK_TEXT) t += `\n\nAtau transfer:\n${env.BANK_TEXT}`;
  t += '\n\nAbis bayar kabarin aja di sini, makasih! 🙏';
  return t;
}

async function sendPay(env, chatId) {
  const cap = caption(env);
  if (env.PHOTO_URL) {
    const r = await api(env, 'sendPhoto', {
      chat_id: chatId,
      photo: env.PHOTO_URL,
      caption: cap,
    });
    if (r.ok) return;
    console.error('sendPhoto gagal:', JSON.stringify(r));
  }
  await api(env, 'sendMessage', { chat_id: chatId, text: cap });
}

async function handle(update, env) {
  const msg = update.message;
  if (!msg?.chat?.id) return;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  try {
    if (/^\/(start|qris|bayar|pay|donasi|dukung)(\s|$)/.test(text)) {
      await sendPay(env, chatId);
    } else if (/^\/(help|bantuan)(\s|$)/.test(text)) {
      await api(env, 'sendMessage', {
        chat_id: chatId,
        text: 'Ketik /qris buat cara dukungnya. Makasih! 🙏',
      });
    } else if (text.startsWith('/')) {
      await api(env, 'sendMessage', {
        chat_id: chatId,
        text: 'Perintah nggak dikenal. Coba /qris',
      });
    } else {
      // pesan bebas ("mau bayar", dll) — langsung kirim cara bayar
      await sendPay(env, chatId);
    }
  } catch (e) {
    console.error('handle error:', e);
  }
}

function api(env, method, params) {
  return fetch(TMAPI + env.BOT_TOKEN + '/' + method, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  }).then((r) => r.json());
}
