# Style — Visual design

Diseño visual canónico de frog-app. Aplica a **todas** las sesiones del frontend, no solo a la sesión 1. Si una sesión propone algo que choca con esto, primero actualizamos este documento.

## Filosofía

**Minimalista.** Restraint visual. Mucha tipografía, poca decoración. Sin sombras, sin gradientes, sin animaciones gratuitas. Bordes finos (`0.5px`), radius parejo (`12px`), spacing generoso.

**Semántico.** Los tokens de color tienen nombres de uso (`primary`, `foreground`, `muted`), no nombres descriptivos (`brown`, `cream`). Cambiar la paleta debe ser una edición en un solo archivo.

**Sentence case y sin emojis en toda la UI.** WhatsApp/email pueden tener emojis cuando el copy lo amerite, pero la app no. Reglas detalladas en [`04-copy.md`](./04-copy.md).

**Atomic.** Antes de escribir markup nuevo, revisar si ya existe un atom. Reglas detalladas en [`03-components.md`](./03-components.md).

### Divergencias contra el handoff original

El `frog-context-handoff.md` (secciones 2 y 8) prescribía:

- Color primario verde `#639922`.
- Tipografía default de iOS/Android, sin custom fonts en v0.
- Iconos: Lucide React Native.

Estas guidelines **anulan** esas decisiones. La identidad visual ahora es la paleta **Arquitectura** (tonos tierra), la tipografía es **Quicksand**, y los iconos son **Material Icons** vía `@expo/vector-icons`. La mascota sapo y el tagline siguen iguales.

## Styling: NativeWind

Todo el styling se hace con **NativeWind** (Tailwind CSS para React Native). Usar el prop `className` exclusivamente — no usar `StyleSheet.create()` ni objetos `style` inline.

## Paleta de color — Arquitectura

| Token         | Hex       | Uso                                              |
|---------------|-----------|--------------------------------------------------|
| `primary`     | `#594731` | Acciones clave, encabezados, links, focal points |
| `background`  | `#F2EFEB` | Fondo de la app, surfaces                        |
| `foreground`  | `#0D0D0D` | Texto body, iconos                               |
| `secondary`   | `#736A62` | Texto secundario, UI sutil                       |
| `muted`       | `#A69C94` | Disabled, placeholders, borders                  |

### Reglas

- La mayoría de la UI vive en `background`, `foreground` y `muted`.
- `primary` se reserva para focal points: botones primarios, links, el "siguiente paso" obvio. Si tres cosas en una pantalla son `primary`, ninguna lo es.
- `secondary` es para texto que apoya, no que compite. Subtítulos, metadata, ayuda contextual.
- Borders y dividers siempre `muted`. Nunca `foreground`.
- **No agregamos colores semánticos de estado (success/warning/error) todavía.** Cuando llegue el momento de cuotas atrasadas o errores de validación lo discutimos. Propuesta cuando llegue: tres tonos derivados del mismo ramp neutral, no rojo/amarillo/verde brillantes.

### En Tailwind config

```js
colors: {
  primary:    '#594731',
  background: '#F2EFEB',
  foreground: '#0D0D0D',
  secondary:  '#736A62',
  muted:      '#A69C94',
}
```

Uso: `bg-background`, `text-foreground`, `text-secondary`, `border-muted`, `bg-primary`, `text-primary`, etc.

## Tipografía — Quicksand

Quicksand es un sans-serif redondeado, ligero y amigable. Pega bien con la paleta Arquitectura: cálida sin ser infantil.

### Pesos cargados

| Peso         | Uso                                       |
|--------------|-------------------------------------------|
| 400 Regular  | Body, captions, texto largo               |
| 500 Medium   | Énfasis ligero, labels                    |
| 600 SemiBold | Títulos de sección, botones primarios     |
| 700 Bold     | Solo si lo necesitamos, evitar en general |

Cargados vía `@expo-google-fonts/quicksand`. **NO bajamos los TTF a mano.**

### Escala tipográfica

| Variante  | Tamaño / line-height | Peso | Uso                                            |
|-----------|----------------------|------|------------------------------------------------|
| display   | 28 / 36              | 600  | H1 de pantalla (un solo display por pantalla)  |
| title     | 20 / 28              | 600  | Encabezados de sección                         |
| body      | 16 / 24              | 400  | Texto general                                  |
| body-em   | 16 / 24              | 500  | Texto general con énfasis                      |
| caption   | 13 / 18              | 400  | Metadata, hints                                |
| button    | 16 / 20              | 600  | Solo dentro de `<Button>`                      |

Color por default: `foreground`. `secondary` solo para body apoyo y caption.

### Tailwind config

```js
fontFamily: {
  sans:     ['Quicksand_400Regular'],
  medium:   ['Quicksand_500Medium'],
  semibold: ['Quicksand_600SemiBold'],
  bold:     ['Quicksand_700Bold'],
}
```

Uso: `font-sans` (default), `font-medium`, `font-semibold`, `font-bold`.

El atom `<Text variant="...">` debería ser el camino principal — escribir las clases tipográficas a mano debe ser excepción.

## Iconos — Material Icons

Usamos `MaterialIcons` de `@expo/vector-icons` (ya viene con Expo).

### Reglas

- **Solo `MaterialIcons`** (la familia clásica filled). No mezclamos con `MaterialCommunityIcons` ni con outlined a menos que sea necesario y esté justificado.
- **Tamaños canónicos:** `16` (inline en texto pequeño), `20` (default), `24` (botones, navegación), `32` (estados vacíos).
- **Color por default:** `foreground`. Iconos sobre `bg-primary` usan `background` (claro sobre oscuro).
- El atom `<Icon name="..." size={20} />` es la única forma de meter un icono. **No `<MaterialIcons>` directo en pantallas.**

### Iconos típicos

`add`, `arrow-back`, `arrow-forward`, `check`, `close`, `more-vert`, `flight-takeoff`, `savings`, `notifications`, `person`, `groups`, `content-copy`, `info-outline`, `error-outline`.

Lista completa en [fonts.google.com/icons](https://fonts.google.com/icons) (filtrar a **"Material Icons"**, no "Material Symbols").

## Spacing y radius

- **Padding mínimo de contenedor:** `16`.
- **Gap entre elementos relacionados:** `8` o `12`.
- **Gap entre secciones:** `24` o `32`.
- **Radius de cards y botones:** `12` (`rounded-card` o `rounded-xl`).
- **Radius de inputs:** `12`.
- **Hairlines:** `0.5px` con `border-muted`.
- **Sin sombras.** Si necesitamos elevación visual, usamos un border ligeramente más oscuro, no `shadow-*`.
