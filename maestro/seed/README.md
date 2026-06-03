# Cuenta de prueba para screenshots y E2E

Los flows de Maestro entran con la **cuenta de prueba unificada**
`test@frg.lat`, que bypassa el OTP usando un código fijo y **auto-puebla
datos demo** en su primer login. Funciona en producción (no necesita el
truco `+clerk_test` ni un seed externo).

## 1. Cómo funciona el bypass

`00-login.yaml`: la app detecta el email de la cuenta de prueba y, en
lugar del OTP por correo, pide un "código de acceso". El backend
(`POST /auth/test-signin`) valida email+código contra env vars y devuelve
un Clerk sign-in token (ticket) que la app canjea para iniciar sesión.

Implementado en:
- Backend (`frog-api`): `src/modules/auth/*` + `src/modules/seed/*`.
- Frontend (`frog-app`): stage `test-code` en `app/(auth)/sign-in.tsx`.

## 2. Env vars en el backend (Railway)

El endpoint queda **inerte** salvo que estén configuradas:

```
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNT_EMAIL=test@frg.lat
TEST_ACCOUNT_CODE=314159
```

El código se puede rotar sin redeploy. Para desactivar la cuenta tras el
release público, pon `TEST_ACCOUNT_ENABLED=false`.

> Sobrescribir email/código en Maestro sin editar archivos:
> `maestro test -e EMAIL=test@frg.lat -e CODE=314159 maestro/flows/01-mis-viajes.yaml`

## 3. Idioma del device → español

La app sigue el idioma del sistema (`expo-localization`) y sólo cae a
español si el device **no** está en inglés. Los flows asertan textos en
español:

- **iOS:** `run-all-ios.sh` ya fuerza `AppleLanguages = es-MX` + reboot.
- **Android:** pon el AVD en Español (México) manualmente.

## 4. Datos demo (auto-seed)

En el primer `test-signin`, el backend siembra 3 viajes para que las
pantallas se vean reales (idempotente: sólo si la cuenta no tiene viajes):

- **"Cancún todo incluido"** — viaje en grupo `collecting`, plan activo,
  miembros, y **1 pago pendiente** → "Aprobar pagos" no vacío y banner
  "Reportar pago" visible.
- **"Colombia con amigos"** — viaje en grupo `purchase_ready` (liberado).
- **"Escapada Oaxaca"** — viaje solo con cuotas confirmadas.

Si el estado se ensucia entre corridas, borra los viajes del test user en
la DB; el gate de idempotencia volverá a sembrar en el siguiente login.

`appId` real: **`com.montanio.frg`**. Prereqs para screenshots reales:
build EAS `preview` instalado en el simulator/emulator + las env vars de
arriba en el backend al que apunta la app.
