import type { ZodError } from 'zod'

export function flattenZodErrors(err: ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of err.issues) {
    const path = issue.path.join('.')
    if (!result[path]) result[path] = issue.message
  }
  return result
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      if (!deepEqual(a[k], b[k])) return false
    }
    return true
  }
  return false
}

export function computeDiff<T extends Record<string, unknown>>(
  draft: T,
  original: Partial<T>,
): Partial<T> {
  const diff: Partial<T> = {}
  for (const key of Object.keys(draft) as Array<keyof T>) {
    if (!deepEqual(draft[key], original[key])) {
      diff[key] = draft[key]
    }
  }
  return diff
}
