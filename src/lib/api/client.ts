import { useAuth } from '@clerk/expo'
import { env } from '@/lib/env'

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`)
  }
}

function joinUrl(base: string, path: string) {
  if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

export function useApi() {
  const { getToken } = useAuth()

  return async function fetcher<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await getToken()
    const res = await fetch(joinUrl(env.EXPO_PUBLIC_API_BASE_URL, path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
    const text = await res.text()
    const body = text ? JSON.parse(text) : null
    if (!res.ok) throw new ApiError(res.status, body)
    return body as T
  }
}
