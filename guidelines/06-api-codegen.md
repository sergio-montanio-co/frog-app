# API codegen — notas y quirks

Notas operativas que aparecen al correr `npm run types:api` contra el
backend deployed. No son blockers pero conviene tenerlas escritas para
sesiones futuras.

## Cómo regeneramos

```bash
# Default: backend Railway
npm run types:api

# Local (frog-api corriendo en :3000)
npm run types:api:local
```

El archivo generado `src/lib/api/schema.gen.ts` **se commitea**. Si TS
empieza a quejarse sin que tú lo hayas tocado, es porque el backend
cambió — regenera y resuelve los errores.

## Cert mismatch en `api.frg.lat` (sesión 2)

Railway está sirviendo el cert default (`*.up.railway.app`) en lugar de
uno emitido para el custom domain `frg.lat`. Esto rompe:

- `npm run types:api` con `ERR_TLS_CERT_ALTNAME_INVALID`.
- Cualquier `fetch()` desde un cliente que valide certs estrictamente
  (iOS/Android nativo lo hará).

Workaround temporal usado en sesión 2: bajar el JSON con
`curl -sk https://api.frg.lat/docs-json -o /tmp/frog-openapi.json` y
correr `npx openapi-typescript /tmp/frog-openapi.json`.

**TODO antes de testear en device:** configurar el SSL del custom
domain en Railway o cambiar `EXPO_PUBLIC_API_BASE_URL` al hostname
`*.up.railway.app` que sí tiene cert válido.

## Quirks del schema

### `GET /trips` — `query.status` tipado como `Object[]`

El backend declara el query param `status` como `type: object` en lugar
de string en su Swagger, así que openapi-typescript lo emite como
`components["schemas"]["Object"][]` (donde `Object = Record<string, never>`).

En la práctica el backend lo parsea como string comma-separated
(`"draft,collecting,..."`). En `lib/api/queries.ts` mandamos un string
y hacemos `as never` para satisfacer al type-checker; cuando el backend
arregle el decorador del DTO (probablemente `@ApiQuery({ type: String })`),
regeneramos y quitamos el cast.

## Reglas

- **Nunca editar `schema.gen.ts` a mano.** Si TS protesta, regenera o
  arregla el código.
- Cuando el backend agregue nuevos endpoints o cambie shapes, alguien
  corre `npm run types:api` antes del PR del frontend.
