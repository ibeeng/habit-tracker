#!/usr/bin/env bash
# Deploy bot rootine ke VPS + restart service.
# Prasyarat: SSH key ke ubuntu@43.157.204.194 udah jalan (BatchMode).
set -euo pipefail

VPS=ubuntu@43.157.204.194
REMOTE_DIR=/home/ubuntu/rootine-bot
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/bot"

echo "==> upload bot code"
ssh "$VPS" "mkdir -p $REMOTE_DIR"
scp -q "$LOCAL_DIR/rootine-bot.py" "$VPS:$REMOTE_DIR/"

echo "==> upload config (.env + qris.png) kalau ada lokal"
[ -f "$LOCAL_DIR/.env" ] && scp -q "$LOCAL_DIR/.env" "$VPS:$REMOTE_DIR/.env" || echo "    (no local .env — skip)"
[ -f "$LOCAL_DIR/qris.png" ] && scp -q "$LOCAL_DIR/qris.png" "$VPS:$REMOTE_DIR/qris.png" || echo "    (no local qris.png — skip)"

echo "==> install systemd unit"
scp -q "$LOCAL_DIR/rootine-bot.service" "$VPS:/tmp/rootine-bot.service"
ssh "$VPS" "sudo mv /tmp/rootine-bot.service /etc/systemd/system/rootine-bot.service \
  && sudo systemctl daemon-reload \
  && sudo systemctl enable rootine-bot \
  && sudo systemctl restart rootine-bot"

sleep 2
echo "==> status:"
ssh "$VPS" "systemctl is-active rootine-bot && journalctl -u rootine-bot -n 5 --no-pager"
