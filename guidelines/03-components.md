# Components — Architecture & conventions

Cómo estructuramos componentes en frog-app. Aplica a **todas** las sesiones del frontend. Si una sesión propone una estructura distinta, primero actualizamos este documento.

## Atomic design

Adoptamos una versión pragmática de Brad Frost. **No usamos "templates" ni "pages" como carpetas** porque Expo Router ya maneja eso vía `app/`.

```
src/components/
├── atoms/         primitivos visuales (Text, Button, Icon, Input, Card…)
├── molecules/     combinaciones pequeñas (FormField, ListRow, Avatar+Name…)
└── organisms/     bloques compuestos (Header, TripCard, MemberRow…)
```

### Reglas operativas

- Antes de crear un atom, `ls src/components/atoms/` y verificar si ya existe. Si existe pero te falta una variante, **extender el atom existente con una prop**, no crear un atom paralelo.
- Un **atom NO importa de molecules ni organisms**. Solo de `lib/`, `react-native`, librerías externas, y otros atoms.
- Una **molecule** puede importar atoms. **No otras molecules ni organisms.**
- Un **organism** puede importar atoms y molecules.
- Una **pantalla (`app/...`)** puede importar de cualquier nivel.
- Si un componente solo se usa en una pantalla y nunca se va a reusar, **vivir inline en la pantalla está bien**. No forzar la promoción a organism por ortodoxia.
- **Atoms NUNCA tienen estado de servidor** (no llaman a TanStack Query, no hablan con Clerk). Reciben todo por props.

### Atoms previstos para v0

Marcados como "necesarios desde sesión X" para no inflar el scope:

| Atom         | Sesión | Status   |
|--------------|--------|----------|
| Text         | 1      | creado   |
| Button       | 1      | creado   |
| Card         | 1      | creado   |
| Icon         | 1      | creado   |
| Input        | 1      | creado   |
| Avatar       | 2      | creado   |
| ProgressBar  | 2      | creado   |
| Splash       | 2      | creado   |
| Stepper      | 3      | creado   |
| IconButton   | 3      | creado   |
| DateField    | 3      | creado   |
| MoneyInput   | 3      | creado   |
| Badge        | 4      | pendiente |
| Divider      | 4      | pendiente |
| Checkbox     | 5      | pendiente |

Molecules creadas: `TripCard` (sesión 2), `WizardStep` · `MemberInputRow` · `CostBreakdownRow` (sesión 3).

## Convenciones de implementación

- **Variantes via prop, no via `className` suelto en la pantalla.**
  `<Button variant="primary" />` no `<View className="bg-primary p-3 rounded-xl">`.
- **Props con defaults razonables.** Un atom debe poder usarse sin pasar nada más que su contenido.
- **`className` siempre forwardeable.** Cada atom recibe `className` opcional para overrides en pantalla. Combinamos con `cn()` (helper basado en `clsx` + `tailwind-merge`).
- **TypeScript estricto.** Nada de `any`, nada de `// @ts-ignore` sin comentario que lo justifique.
- **Naming:** atoms en PascalCase (`Button.tsx`), helpers en camelCase (`cn.ts`), hooks `use*`, types en PascalCase.

## Cuándo crear vs reusar

Workflow al implementar una pantalla:

1. Listar los elementos visuales que necesita.
2. Para cada uno: ¿existe un atom? Si sí, usarlo.
3. ¿Necesito una variante nueva? Agregarla al atom existente.
4. ¿Es algo composicional (label + input + error)? Si lo voy a usar más de una vez → molecule. Si no → inline.
5. Si crece a algo grande con muchos atoms/molecules adentro y se reusa → organism.

Si una sesión cierra y se generaron componentes nuevos, terminar la sesión **actualizando la lista de atoms previstos** (arriba). El brief de cada sesión debe enumerar qué atoms/molecules/organisms espera dejar listos.
