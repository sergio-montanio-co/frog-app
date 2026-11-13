import { z } from 'zod'

const schema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_API_BASE_URL: z.string().url(),
  EXPO_PUBLIC_EAS_PROJECT_ID: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // Email de la cuenta de prueba (no es secreto; el código lo teclea el
  // usuario). Default a test@frg.lat si no se define en el entorno.
  EXPO_PUBLIC_TEST_ACCOUNT_EMAIL: z.string().min(1).catch('test@frg.lat'),
})

// Cada variable debe referenciarse con dot-notation literal para que Metro la
// inyecte en el bundle de producción. Pasar `process.env` entero NO funciona:
// en release el objeto llega vacío y la validación falla al arrancar (SIGABRT).
// https://docs.expo.dev/guides/environment-variables/
const parsed = schema.safeParse({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_EAS_PROJECT_ID: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
  EXPO_PUBLIC_TEST_ACCOUNT_EMAIL: process.env.EXPO_PUBLIC_TEST_ACCOUNT_EMAIL,
})
if (!parsed.success) {
  throw new Error(
    `Faltan variables de entorno: ${parsed.error.issues
      .map((i) => i.path.join('.'))
      .join(', ')}`,
  )
}

export const env = parsed.data
