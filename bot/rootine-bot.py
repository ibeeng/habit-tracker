#!/usr/bin/env python3
"""Rootine support bot — kirim QRIS waktu orang nanya bayar.

Stdlib only, long polling. Config dari env:
  BOT_TOKEN   — token dari @BotFather (wajib)
  QRIS_IMAGE  — path gambar QRIS (wajib)
  BANK_TEXT   — opsional, teks transfer bank (pakai \n untuk baris baru)
"""
import json
import logging
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

TOKEN = os.environ.get("BOT_TOKEN", "").strip()
QRIS_IMAGE = os.environ.get("QRIS_IMAGE", "").strip()
BANK_TEXT = os.environ.get("BANK_TEXT", "").strip().replace("\\n", "\n")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("rootine-bot")

API = f"https://api.telegram.org/bot{TOKEN}"

WELCOME = (
    "Halo! Ini QRIS buat dukung Rootine 👇\n\n"
    "Rp49.000 sekali — atau seikhlasnya, nggak wajib.\n"
    "Scan pakai app bank / e-wallet kamu (GoPay, OVO, DANA, apa aja).\n\n"
    "Abis bayar kabarin aja di sini, makasih! 🙏"
)
HELP = (
    "Ketik /qris buat dapat QRIS-nya.\n"
    "Dukungan kamu dipakai buat terus update Rootine — makasih!"
)


def api(method: str, **params):
    """POST ke Bot API, balas result langsung (raise kalau error)."""
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(f"{API}/{method}", data=data)
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read())
    if not out.get("ok"):
        raise RuntimeError(f"{method} failed: {out}")
    return out["result"]


def send_photo_multipart(chat_id: int, path: str, caption: str):
    """sendPhoto dengan file — wajib multipart."""
    boundary = uuid.uuid4().hex
    ctype = mimetypes.guess_type(path)[0] or "image/png"
    with open(path, "rb") as f:
        payload = f.read()

    parts = []
    for name, value in (("chat_id", str(chat_id)), ("caption", caption)):
        parts.append(
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n".encode()
        )
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="photo"; filename="{os.path.basename(path)}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n".encode()
        + payload
        + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)

    req = urllib.request.Request(
        f"{API}/sendPhoto",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read())
    if not out.get("ok"):
        raise RuntimeError(f"sendPhoto failed: {out}")


def send_qris(chat_id: int):
    caption = WELCOME
    if BANK_TEXT:
        caption += f"\n\nAtau transfer bank:\n{BANK_TEXT}"
    try:
        send_photo_multipart(chat_id, QRIS_IMAGE, caption)
    except Exception as e:
        log.error("send photo gagal: %s", e)
        api("sendMessage", chat_id=chat_id, text=caption + "\n\n(gambar QRIS gagal dikirim)")


def handle(update: dict):
    msg = update.get("message") or {}
    chat_id = msg.get("chat", {}).get("id")
    if not chat_id:
        return
    text = (msg.get("text") or "").strip()

    if text.startswith("/start") or text.startswith("/donasi") or text.startswith("/dukung"):
        send_qris(chat_id)
    elif text.startswith("/qris") or text.startswith("/bayar") or text.startswith("/pay"):
        send_qris(chat_id)
    elif text.startswith("/help") or text.startswith("/bantuan"):
        api("sendMessage", chat_id=chat_id, text=HELP)
    elif text.startswith("/"):
        api("sendMessage", chat_id=chat_id, text="Perintah nggak dikenal. Coba /qris")
    else:
        # pesan bebas (mis. "mau bayar") — balas QRIS biar nggak perlu klik command
        send_qris(chat_id)


def main():
    if not TOKEN:
        sys.exit("BOT_TOKEN belum di-set")
    if not QRIS_IMAGE or not os.path.exists(QRIS_IMAGE):
        sys.exit(f"QRIS_IMAGE nggak ada: {QRIS_IMAGE!r}")

    me = api("getMe")
    log.info("bot online: @%s", me["username"])
    try:
        api(
            "setMyCommands",
            commands=[
                {"command": "qris", "description": "Dapatkan QRIS"},
                {"command": "start", "description": "Mulai"},
                {"command": "help", "description": "Bantuan"},
            ],
        )
    except Exception as e:
        log.warning("setMyCommands gagal: %s", e)

    offset = 0
    while True:
        try:
            updates = api("getUpdates", offset=offset, timeout=50, allowed_updates=["message"])
        except (urllib.error.URLError, TimeoutError, OSError, RuntimeError) as e:
            log.warning("getUpdates error: %s — retry 5s", e)
            time.sleep(5)
            continue
        for u in updates:
            offset = u["update_id"] + 1
            try:
                handle(u)
            except Exception as e:
                log.error("handle gagal: %s", e)


if __name__ == "__main__":
    main()
