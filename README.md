# Frog app

App móvil de Frog (Expo SDK 56, React Native 0.85, TypeScript estricto).

## Antes de empezar

Lee primero las [`guidelines/`](./guidelines) — son **obligatorias** antes
de tocar cualquier archivo. Empieza por [`guidelines/README.md`](./guidelines/README.md).

Cualquier sesión activa vive en [`docs/`](./docs) (ignorado por git).

## Setup

1. **Node 20 LTS.** `node -v` debe imprimir `v20.x`.
2. **Xcode** (para correr iOS) con un simulador instalado.
3. **Variables de entorno.** Copia `.env.example` a `.env.local` y
   llena los valores:

   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   EXPO_PUBLIC_API_BASE_URL=https://api.frg.lat
   ```

   La key de Clerk sale del dashboard del proyecto Frog (Development).
   El API base es el backend de Railway.

4. **Instala deps:**

   ```bash
   npm install
   ```

   El repo trae `.npmrc` con `legacy-peer-deps=true` para resolver un
   peer transitivo de `react-dom` que Radix arrastra vía `expo-router`.

## Comandos

| Comando                  | Qué hace                                            |
|--------------------------|-----------------------------------------------------|
| `npm start`              | Metro + QR para Expo Go                             |
| `npm run ios`            | Abre el simulador de iOS                            |
| `npm run android`        | Abre el emulador de Android                         |
| `npm run web`            | Versión web (no soportada en v0)                    |
| `npm run typecheck`      | Type-check del proyecto (`tsc --noEmit`)            |
| `npm run types:api`      | Regenera `src/lib/api/schema.gen.ts` desde el OpenAPI del backend |
| `npm run types:api:local`| Igual pero contra `http://localhost:3000`           |
| `npx expo-doctor`        | Salud del setup vs SDK 56                           |

No hay linter ni test runner configurados — la sesión 1 no los pide.

### Tipos del backend

`src/lib/api/schema.gen.ts` se genera desde el OpenAPI del backend y **se commitea**. Cuando el backend cambia (sea cualquier endpoint, DTO o enum), corre `npm run types:api` y commitéa el diff. Nunca editar el archivo a mano. Quirks y notas en [`guidelines/06-api-codegen.md`](./guidelines/06-api-codegen.md).

## Estructura

```
frog-app/
├── app/                      # rutas (Expo Router file-based)
│   ├── _layout.tsx           # Clerk + Query + i18n + Quicksand + splash
│   ├── index.tsx             # redirect según auth state
│   ├── (auth)/               # sign-in, sign-up
│   ├── (app)/                # autenticados (preloadea /me)
│   │   ├── (tabs)/           # trips, alerts, profile
│   │   ├── profile/edit.tsx  # form de displayName
│   │   └── trips/[id].tsx    # stub del detalle (sesión 4)
│   ├── join/[token].tsx      # target de deep links de invitación
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   ├── atoms/            # Text, Button, Card, Icon, Input, Avatar, ProgressBar, Splash
│   │   └── molecules/        # TripCard
│   ├── lib/
│   │   ├── api/              # client (openapi-fetch), queries, schema.gen.ts (codegen)
│   │   ├── clerk/            # token cache, helpers de errores
│   │   ├── env.ts            # validación zod de EXPO_PUBLIC_*
│   │   ├── money.ts          # formatMxn (Intl.NumberFormat)
│   │   └── cn.ts             # clsx + tailwind-merge
│   ├── theme/colors.ts       # tokens en JS (para nav, status bar)
│   └── i18n/                 # i18next + locales es/en
├── guidelines/               # reglas vigentes del proyecto
├── docs/                     # briefs de sesión (ignorado por git)
└── ...                       # tailwind/babel/metro config, app.json
```

Path alias: `@/*` → `./src/*`.

## Auth

- Login solo con **email + OTP** vía Clerk (Development).
- Clerk package: `@clerk/expo` (renombrado desde `@clerk/clerk-expo`).
  Los hooks `useSignIn` / `useSignUp` se importan de
  `@clerk/expo/legacy` porque la nueva API "Future" requiere rewrite.
- Token cache: `SecureStore` vía `@clerk/expo/token-cache`.

## Estilos

- **NativeWind** (Tailwind para RN). Solo `className`, no `StyleSheet`.
- Paleta **Arquitectura** + tipografía **Quicksand** (4 pesos).
- Atom `<Icon>` envuelve `MaterialIcons` de `@expo/vector-icons`.

Detalles en [`guidelines/02-style.md`](./guidelines/02-style.md).

## Localización

- `i18next` + `react-i18next` + `expo-localization`.
- Default `es`, fallback `es`. `en` cargado para device language inglés.
- Todo texto pasa por `t('key')`. Nada hardcodeado.

Locales: `src/i18n/locales/{es,en}.ts`.

## Deep links

Esquema custom: `frog://` (configurado en `app.json`).
Universal links HTTPS: `https://app.frg.lat/join/<token>` (AASA y
`assetlinks.json` se hostean en sesión 7).

### Probar deep link en iOS simulator

```bash
xcrun simctl openurl booted "frog://join/test-token-123"
```

### Probar en emulador Android

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "frog://join/test-token-123" com.montanio.frg
```

Ambos deben abrir `app/join/[token].tsx` y mostrar
`Invitación recibida: test-token-123`.

## Bundle identifiers

- iOS: `com.montanio.frg`
- Android: `com.montanio.frg`
- Universal links: `app.frg.lat`
