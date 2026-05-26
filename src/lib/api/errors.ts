import { ApiError } from './client'

const GENERIC_FALLBACK = 'Algo salió mal. Intenta de nuevo.'

type NestErrorBody = {
  message?: string | string[]
  error?: string
}

function isNestErrorBody(value: unknown): value is NestErrorBody {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { message?: unknown }
  return (
    typeof maybe.message === 'string' ||
    (Array.isArray(maybe.message) &&
      maybe.message.every((m) => typeof m === 'string'))
  )
}

export function parseBackendError(err: unknown): string {
  if (err instanceof ApiError) {
    if (isNestErrorBody(err.body)) {
      if (Array.isArray(err.body.message)) {
        return err.body.message[0] ?? GENERIC_FALLBACK
      }
      if (typeof err.body.message === 'string') return err.body.message
    }
    return GENERIC_FALLBACK
  }
  if (isNestErrorBody(err)) {
    if (Array.isArray(err.message)) {
      return err.message[0] ?? GENERIC_FALLBACK
    }
    if (typeof err.message === 'string') return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return GENERIC_FALLBACK
}
