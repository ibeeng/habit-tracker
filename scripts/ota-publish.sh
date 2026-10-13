#!/usr/bin/env bash
# Publish a live (OTA) update bundle for the Rootine Android app.
#
#   ./scripts/ota-publish.sh                      # build bundle + write it locally
#   ./scripts/ota-publish.sh --notes "fix X"      # attach notes shown in the app
#   ./scripts/ota-publish.sh --upload             # ALSO push to the hosted endpoint
#
# Nothing is pushed anywhere unless you pass --upload, so this is safe to run.
# The app never auto-installs: it only *asks* the endpoint whether something
# newer exists, then offers one tap in Settings → cek update (plus a passive
# banner on launch).
#
# What it does:
#   1. builds the Android web bundle (same build the APK ships)
#   2. zips the dist *contents* — index.html must sit at the zip root
#   3. hashes the zip (SHA-256) — the checksum the native plugin verifies
#   4. writes bundle + version.json into ./ota-out (or uploads them with --upload)
#   5. verifies the result (locally by default, over HTTP when uploading)
set -euo pipefail

cd "$(dirname "$0")/.."

VPS_HOST="${OTA_HOST:-ubuntu@43.157.204.194}"
OTA_REMOTE_ROOT="/var/www/telba.xyz/rootine-ota"
OTA_PUBLIC="${OTA_PUBLIC_URL:-https://telba.xyz/rootine-ota}"
OUT_DIR="${OTA_OUT_DIR:-$PWD/ota-out}"
VERSION="$(python3 -c "import json;print(json.load(open('package.json'))['version'])")"

UPLOAD=0
NOTES=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --upload) UPLOAD=1; shift ;;
    --notes) NOTES="${2:-}"; shift 2 ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
done

echo "==> publishing bundle v${VERSION}"

# 1. build the native web bundle
echo "==> building (VITE_NATIVE=1 APP_BASE=./)"
npm run build:android >/dev/null

test -f dist/index.html || { echo "FAIL: dist/index.html missing"; exit 1; }

# 2. zip contents with index.html at the root
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
ZIP="$WORK/rootine-${VERSION}.zip"
( cd dist && zip -qr "$ZIP" . -x '*.map' )

# 3. checksum over the zip file itself (plugin requirement)
CHECKSUM="$(sha256sum "$ZIP" | cut -d' ' -f1)"
SIZE="$(stat -c%s "$ZIP")"
echo "==> bundle: $(basename "$ZIP") (${SIZE} bytes)"
echo "==> sha256: ${CHECKSUM}"

# 4. manifest (comment/notes are surfaced by the update screen)
python3 - "$WORK/version.json" "$VERSION" "$OTA_PUBLIC" "$CHECKSUM" "$SIZE" "$NOTES" <<'PY'
import json, sys, datetime
path, version, public, checksum, size, notes = sys.argv[1:7]
data = {
    "version": version,
    "url": f"{public}/rootine-{version}.zip",
    "checksum": checksum,
    "publishedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "size": int(size),
}
if notes:
    data["comment"] = notes
json.dump(data, open(path, "w"), indent=2)
PY

# 5. stage locally, and only leave the machine with --upload
mkdir -p "$OUT_DIR"
cp "$ZIP" "$WORK/version.json" "$OUT_DIR/"
echo "==> staged in ${OUT_DIR}"

if [[ "$UPLOAD" -eq 1 ]]; then
  echo "==> uploading to ${VPS_HOST}:${OTA_REMOTE_ROOT}"
  scp -q -o StrictHostKeyChecking=no "$ZIP" "$WORK/version.json" "${VPS_HOST}:${OTA_REMOTE_ROOT}/"

  echo "==> verifying endpoint"
  sleep 1
  RESP="$(curl -fsS "${OTA_PUBLIC}/updates?version=0.0.0&platform=android")"
  echo "    ${RESP}"
  if ! grep -q "\"version\":\"${VERSION}\"" <<<"${RESP// /}"; then
    echo "FAIL: endpoint did not report v${VERSION}"
    exit 1
  fi

  SAME="$(curl -fsS "${OTA_PUBLIC}/updates?version=${VERSION}&platform=android")"
  echo "    up-to-date check: ${SAME}"
  if ! grep -q "\"version\":\"${VERSION}\"" <<<"${SAME// /}"; then
    echo "FAIL: up-to-date client would be offered an update"
    exit 1
  fi
  echo "==> OK: v${VERSION} is live for updates"
else
  # offline self-check: manifest must describe the zip we just wrote
  python3 - "$OUT_DIR/version.json" "$CHECKSUM" "$VERSION" <<'PY'
import json, sys
manifest, checksum, version = sys.argv[1:4]
d = json.load(open(manifest))
assert d["version"] == version, d
assert d["checksum"] == checksum, d
assert d["url"].endswith(f"rootine-{version}.zip"), d
print(f"==> manifest OK: v{d['version']} -> {d['url']}")
PY
  echo "==> not uploaded (pass --upload to publish it)."
fi
