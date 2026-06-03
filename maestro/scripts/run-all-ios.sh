#!/usr/bin/env bash
# Corre los flows de Maestro en un iPhone 17 y deja las screenshots en
# screenshots/ios/iphone-17/ ya redimensionadas al tamaño 6.5" de App Store
# (1284 x 2778 px portrait).
#
# Pre-requisitos:
#   - App instalada en el simulator. Idealmente un build standalone
#     (eas build --profile preview --local + xcrun simctl install) para que
#     Maestro pueda hacer launchApp/clearState. Con un dev client hay que
#     cargar Metro a mano (no lo cubre este script).
#   - Backend con la cuenta de prueba habilitada (ver maestro/seed/README.md).
set -euo pipefail

# --- toolchain (Maestro necesita un JDK; openjdk@17 vía brew) ---
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# Único device para iOS: iPhone 17. Output: screenshots/ios/iphone-17/.
DEVICE_NAME="iPhone 17"
FOLDER="iphone-17"
# Tamaño exacto que pide App Store Connect (slot 6.5"). Cambia a 1242x2688
# si lo prefieres; ambos son válidos para 6.5".
TARGET_W=1284
TARGET_H=2778

FLOWS=(
  "01-mis-viajes"
  "02-dashboard"
  "03-crear-viaje"
  "04-reportar-pago"
  "05-aprobar-pagos"
)

# Resolver el primer UDID disponible con ese nombre (hay nombres duplicados).
UDID=$(xcrun simctl list devices available \
  | grep -F "$DEVICE_NAME (" \
  | head -1 \
  | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}')

if [ -z "${UDID:-}" ]; then
  echo "❌ No encontré un simulator '$DEVICE_NAME'. Revisa: xcrun simctl list devices available"
  exit 1
fi
echo "===== iOS: $DEVICE_NAME ($UDID) ====="

xcrun simctl shutdown all 2>/dev/null || true
xcrun simctl boot "$UDID"
sleep 5

# La app sigue el idioma del device y sólo cae a español si NO está en inglés.
# Forzamos es-MX y rebooteamos para aplicarlo (si no, los flows en español fallan).
xcrun simctl spawn "$UDID" defaults write -g AppleLanguages -array "es-MX" || true
xcrun simctl spawn "$UDID" defaults write -g AppleLocale -string "es_MX" || true
xcrun simctl shutdown "$UDID"
xcrun simctl boot "$UDID"
open -a Simulator
sleep 8

# Status bar limpio que pide Apple (hora 9:41, batería y señal llenas).
xcrun simctl status_bar "$UDID" override \
  --time "9:41" \
  --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 \
  --wifiMode active --wifiBars 3 || true

OUT_DIR="screenshots/ios/$FOLDER"
mkdir -p "$OUT_DIR"

for FLOW in "${FLOWS[@]}"; do
  echo "  Running $FLOW.yaml..."
  maestro --device "$UDID" test "maestro/flows/$FLOW.yaml"
done

# Maestro escribe los PNG en el CWD (repo root). Los movemos y redimensionamos
# al tamaño exacto de App Store (scale-to-fill al ancho + center-crop al alto,
# así no se distorsiona, sólo se recorta margen vacío).
for FLOW in "${FLOWS[@]}"; do
  [ -f "$FLOW.png" ] || continue
  mv -f "$FLOW.png" "$OUT_DIR/"
  sips --resampleWidth "$TARGET_W" "$OUT_DIR/$FLOW.png" >/dev/null
  sips -c "$TARGET_H" "$TARGET_W" "$OUT_DIR/$FLOW.png" >/dev/null
done

xcrun simctl status_bar "$UDID" clear || true
xcrun simctl shutdown "$UDID" || true

echo "✅ Listo. Screenshots ${TARGET_W}x${TARGET_H} en $OUT_DIR/"
