#!/usr/bin/env bash
# Run gradle for the Android app with the local SDK/JDK wired up.
# Usage: scripts/android-build.sh [assembleRelease|installDebug|clean|...]
#   defaults to assembleRelease when no task is given
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"

# JDK 21 is required (Capacitor targets Java 21). Prefer a local Temurin install.
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME:-}/bin/javac" ]; then
  for candidate in "$HOME"/jdk/jdk-21* "$HOME"/jdk/jdk21* /usr/lib/jvm/java-21-openjdk-amd64; do
    if [ -x "$candidate/bin/javac" ]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME:-}/bin/javac" ]; then
  echo "!! JDK 21 with javac not found — set JAVA_HOME (see README)" >&2
  exit 1
fi
echo "→ JAVA_HOME=$JAVA_HOME"
echo "→ ANDROID_HOME=$ANDROID_HOME"

cd "$ROOT/android"
if [ "$#" -eq 0 ]; then
  set -- assembleRelease
fi
exec ./gradlew "$@"
