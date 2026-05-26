# API codegen — reglas y operación

Cómo regeneramos los tipos del backend en el frontend. Aplica a todas
las sesiones; si una sesión propone otra forma de consumir el API,
primero actualizamos este documento.

## Cómo regeneramos

```bash
# Default: backend Railway (https://api.frg.lat)
npm run types:api

# Local (frog-api corriendo en :3000)
npm run types:api:local

# Override puntual:
API_DOCS_URL=https://otro.host/docs-json npm run types:api
```

El archivo generado `src/lib/api/schema.gen.ts` **se commitea**. Si TS
empieza a quejarse sin que tú lo hayas tocado, es porque el backend
cambió — regenera y resuelve los errores en el código consumidor.

## Reglas

- **Nunca editar `schema.gen.ts` a mano.** Si TS protesta, regenera o
  arregla el código que llama al cliente.
- **Cuando el backend agregue/cambie endpoints o DTOs**, alguien corre
  `npm run types:api` y commitéa el diff antes (o en) el PR del frontend.
- **El cliente HTTP se construye desde `paths`** (`useApiClient()` en
  `src/lib/api/client.ts`). No usar `fetch` directo contra el backend.
- **Sin `any`, sin `as never`, sin `// @ts-ignore`** para "callar" el
  type-checker. Si el schema generado no expresa bien algo, el fix vive
  del lado backend (mejor decorador en el DTO) — propón el cambio y
  regenera.

## Quirks vigentes

_Ningún quirk activo._

(Cuando aparezca uno nuevo: documéntalo aquí con el shape exacto que
emite el codegen, el workaround usado y cómo se elimina del lado
backend cuando sea posible.)

## Quirks resueltos (registro)

- **`GET /trips` `query.status` tipado como `Object[]` (sesión 2).** El
  backend emitía `type: object` en Swagger; el frontend mandaba string
  comma-separated con `as never`. Resuelto cuando el backend cambió el
  decorador del DTO a string.
- **Cert TLS roto en `api.frg.lat` (sesión 2).** Railway servía el cert
  default `*.up.railway.app` en lugar de uno para el custom domain, lo
  que rompía `npm run types:api` con `ERR_TLS_CERT_ALTNAME_INVALID` y
  cualquier `fetch()` nativo desde iOS/Android. Resuelto al configurar
  el SSL del custom domain en Railway.
