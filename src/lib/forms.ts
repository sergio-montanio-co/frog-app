import type { ZodError } from 'zod'

export function flattenZodErrors(err: ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of err.issues) {
    const path = issue.path.join('.')
    if (!result[path]) result[path] = issue.message
  }
  return result
}
