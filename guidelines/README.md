# Guidelines

Reglas del proyecto que Claude **debe leer antes de tocar código**. Cada archivo cubre un tema. Si una guideline entra en conflicto con la tarea pedida, párate y propónme actualizarla — no la rompas en silencio.

Convenciones del folder:
- Archivos numerados en orden de prioridad de lectura (`01-`, `02-`, ...).
- Cada guideline es un Markdown corto y escaneable. Si crece demasiado, divídelo.
- Todo cambio aquí queda en git — no son notas efímeras.

## Índice

| # | Tema | Archivo |
| - | ---- | ------- |
| 01 | Localización (i18next + expo-localization, español como idioma default) | [01-localization.md](./01-localization.md) |
| 02 | Estilo visual (filosofía, paleta Arquitectura, Quicksand, Material Icons, spacing/radius) | [02-style.md](./02-style.md) |
| 03 | Componentes (atomic design, convenciones, cuándo crear vs reusar) | [03-components.md](./03-components.md) |
| 04 | Copy (sentence case, sin emojis, español neutral, infinitivo) | [04-copy.md](./04-copy.md) |
| 05 | Accesibilidad mínima (área tocable, labels, contraste) | [05-accessibility.md](./05-accessibility.md) |
| 06 | API codegen (cómo regeneramos `schema.gen.ts`, quirks vigentes) | [06-api-codegen.md](./06-api-codegen.md) |
