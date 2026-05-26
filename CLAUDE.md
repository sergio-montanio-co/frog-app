# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Read `guidelines/` first — always, no excepción

Antes de tocar **cualquier** archivo de este repo (código, config, docs), abre cada archivo en [`guidelines/`](./guidelines) y léelo completo. Empieza por [`guidelines/README.md`](./guidelines/README.md), que indexa el resto en orden de prioridad.

Estas guidelines son el contrato del proyecto:
- Son **obligatorias**, no sugerencias.
- Aplican aunque la tarea parezca trivial (un texto nuevo en pantalla también necesita revisar las reglas de localización; un botón nuevo también pasa por las reglas de estilo).
- Si descubres una regla nueva durante el trabajo (por feedback mío o de revisión), proponla como un archivo nuevo en `guidelines/` antes de seguir.

### Si la sesión choca con una guideline

Si la tarea que te pedí entra en conflicto con una guideline existente, **párate antes de escribir código**:

1. Identifica exactamente qué regla choca y por qué.
2. Propón el cambio concreto al archivo de `guidelines/` (diff o texto nuevo) y explica la razón.
3. **Espera a que yo lo acepte explícitamente** antes de continuar. No actualices la guideline ni rompas la regla unilateralmente.
4. Una vez aceptado, actualiza el archivo de `guidelines/` en el mismo commit que la tarea.

Reglas vigentes (revisa el índice para la lista completa):
- **Localización** → todo texto visible al usuario empieza en español y pasa por `i18next`; nada de strings hardcodeados. Detalles en [`guidelines/01-localization.md`](./guidelines/01-localization.md).
- **Estilo visual** → NativeWind only (sin `StyleSheet.create` ni inline styles), paleta Arquitectura, tipografía Quicksand, Material Icons (no Ionicons), radius `12`, hairlines `0.5px`, sin sombras. Detalles en [`guidelines/02-style.md`](./guidelines/02-style.md).
- **Componentes** → atomic design pragmático: `atoms → molecules → organisms` (sin `templates/` ni `screens/` como carpetas — Expo Router maneja eso vía `app/`). Atoms reciben todo por props, nunca estado de servidor. Detalles en [`guidelines/03-components.md`](./guidelines/03-components.md).
- **Copy** → sentence case, sin emojis en la UI, español neutral, acciones en infinitivo, errores empiezan con el problema. Detalles en [`guidelines/04-copy.md`](./guidelines/04-copy.md).
- **Accesibilidad** → área tocable mínima 44×44, `accessibilityLabel` en iconos accionables e inputs, contraste WCAG AA. Detalles en [`guidelines/05-accessibility.md`](./guidelines/05-accessibility.md).

## Stack

Expo SDK 56 + React 19.2 + React Native 0.85, TypeScript en strict mode. SDK 56 es reciente — confirma APIs contra https://docs.expo.dev/versions/v56.0.0/ antes de escribir código, no contra memoria ni guías viejas.

## Commands

- `npm start` — Expo dev server (Metro + QR para Expo Go)
- `npm run ios` / `npm run android` / `npm run web` — lanza directamente en una plataforma

No hay test runner, linter ni formatter configurados. No inventes `npm test` ni `npm run lint`; si la sesión los necesita, configurálos explícitamente.

## Entry point

`index.ts` → `registerRootComponent(App)` → `App.tsx`. `app.json` es la configuración de Expo (nombre, slug, iconos, ajustes por plataforma). El repo está en estado de scaffold inicial; las guidelines describen la estructura objetivo (`src/components/atoms`, `src/screens`, `src/i18n/locales`, rutas en `app/`, etc.), no la actual.
