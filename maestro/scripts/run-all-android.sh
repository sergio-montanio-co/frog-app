#!/usr/bin/env bash
# Corre los flows de Maestro en un emulator de teléfono y uno de tablet 7",
# y deja las screenshots en screenshots/android/<form-factor>/ redimensionadas
# a 9:16 (lo que pide Google Play: 16:9 ó 9:16, cada lado 320–3840 px).
#
# Pre-requisitos (NINGUNO está instalado en esta máquina todavía):
#   - Android SDK + platform-tools (adb) + emulator.
#   - AVDs creados: un teléfono y una tablet de 7" (ajusta los nombres abajo).
#   - APK de la app instalado en cada emulator (eas build -p android
#     --profile preview --local + adb install), o dev client + Metro.
set -euo pipefail

# --- toolchain ---
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# Cada entrada: "AVD_NAME|carpeta|ancho|alto" (ancho/alto = target 9:16).
DEVICES=(
  "Pixel_7_API_34|phone|1080|1920"
  "Pixel_Tablet_7_API_34|tablet-7|1242|2208"
)

FLOWS=(
  "01-mis-viajes"
  "02-dashboard"
  "03-crear-viaje"
  "04-reportar-pago"
  "05-aprobar-pagos"
)

if ! command -v emulator >/dev/null 2>&1; then
  echo "❌ No hay 'emulator' en el PATH. Instala el Android SDK primero"
  echo "   (ANDROID_HOME=$ANDROID_HOME). Ver maestro/seed/README.md."
  exit 1
fi

for ENTRY in "${DEVICES[@]}"; do
  IFS='|' read -r AVD FOLDER TARGET_W TARGET_H <<< "$ENTRY"
  echo "===== Android: $AVD → $FOLDER (${TARGET_W}x${TARGET_H}) ====="

  if ! emulator -list-avds | grep -qx "$AVD"; then
    echo "  ⚠️  No encontré el AVD '$AVD'. Créalo o ajusta DEVICES. Saltando."
    continue
  fi

  emulator -avd "$AVD" -no-snapshot -no-audio >/dev/null 2>&1 &
  EMU_PID=$!
  echo "  Esperando boot..."
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done

  OUT_DIR="screenshots/android/$FOLDER"
  mkdir -p "$OUT_DIR"

  for FLOW in "${FLOWS[@]}"; do
    echo "  Running $FLOW.yaml..."
    maestro test "maestro/flows/$FLOW.yaml"
  done

  # Mover del CWD + redimensionar a 9:16 (scale-to-fill ancho + center-crop alto).
  for FLOW in "${FLOWS[@]}"; do
    [ -f "$FLOW.png" ] || continue
    mv -f "$FLOW.png" "$OUT_DIR/"
    sips --resampleWidth "$TARGET_W" "$OUT_DIR/$FLOW.png" >/dev/null
    sips -c "$TARGET_H" "$TARGET_W" "$OUT_DIR/$FLOW.png" >/dev/null
  done

  adb emu kill 2>/dev/null || kill "$EMU_PID" 2>/dev/null || true
  sleep 5
done

echo "✅ Listo. Screenshots en screenshots/android/{phone,tablet-7}/"
