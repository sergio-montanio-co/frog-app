import { useMemo } from 'react'
import { useAuth } from '@clerk/expo'
import createClient, { type Middleware } from 'openapi-fetch'

import { env } from '@/lib/env'
import type { paths } from './schema.gen'

export type ApiClient = ReturnType<typeof createClient<paths>>

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`)
  }
}

export function useApiClient(): ApiClient {
  const { getToken } = useAuth()

  return useMemo(() => {
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = await getToken()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
        return request
      },
    }

    const client = createClient<paths>({
      baseUrl: env.EXPO_PUBLIC_API_BASE_URL,
    })
    client.use(authMiddleware)
    return client
  }, [getToken])
}
