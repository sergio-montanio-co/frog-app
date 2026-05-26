type ClerkError = { code?: string; longMessage?: string; message?: string }
type ClerkErrorEnvelope = { errors?: ClerkError[] }

function isClerkErrorEnvelope(value: unknown): value is ClerkErrorEnvelope {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { errors?: unknown }
  return Array.isArray(maybe.errors)
}

export function firstClerkErrorCode(err: unknown): string | null {
  if (!isClerkErrorEnvelope(err)) return null
  const code = err.errors?.[0]?.code
  return typeof code === 'string' ? code : null
}
