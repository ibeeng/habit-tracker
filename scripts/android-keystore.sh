#!/usr/bin/env bash
# Create (once) the release keystore for the Android app and wire it for gradle.
# The keystore lives OUTSIDE android/ so `rm -rf android && cap add android` is safe.
# BACK IT UP — losing it means you can never ship an update to the installed app.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_DIR="${ROOT}/.keys"
KS="${KEY_DIR}/rootine-release.jks"
PROPS="${ROOT}/android/keystore.properties"
ALIAS="rootine"

if [ ! -f "$KS" ]; then
  mkdir -p "$KEY_DIR"
  PASS="$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | cut -c1-24)"
  keytool -genkeypair -v \
    -keystore "$KS" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" \
    -dname "CN=Rootine, OU=Rootine, O=Rootine, L=Jakarta, S=DKI, C=ID"
  mkdir -p "$(dirname "$PROPS")"
  cat > "$PROPS" <<EOF
storeFile=$KS
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF
  chmod 600 "$KS" "$PROPS"
  echo "created $KS"
else
  echo "keystore exists: $KS"
fi

PASS="$(grep -oP 'storePassword=\K.*' "$PROPS")"
echo "→ gradle signing config: $PROPS"
keytool -list -v -keystore "$KS" -alias "$ALIAS" -storepass "$PASS" 2>/dev/null \
  | grep -iE "SHA256|Valid from" || true
