import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/lib/api/client'

export type Me = {
  id: string
  firstName: string | null
  defaultOrganization?: {
    id: string
    name: string
  } | null
}

export function useMe() {
  const api = useApi()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me'),
  })
}
