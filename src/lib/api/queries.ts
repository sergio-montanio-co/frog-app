import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient, ApiError } from './client'
import type { components } from './schema.gen'

export type UserDto = components['schemas']['UserDto']
export type UpdateMeDto = components['schemas']['UpdateMeDto']
export type TripListItem = components['schemas']['TripListItemDto']
export type TripStatus = TripListItem['status']
export type CreateTripBody = components['schemas']['CreateTripDto']
export type CreatedTripResponse = components['schemas']['TripDto']
export type TripMember = components['schemas']['TripMemberDto']

const ACTIVE_STATUSES: TripStatus[] = [
  'draft',
  'collecting',
  'purchase_ready',
  'in_viaticos',
  'in_progress',
]
const PAST_STATUSES: TripStatus[] = ['completed', 'cancelled']

export type TripsTab = 'active' | 'past'

function statusesFor(tab: TripsTab): TripStatus[] {
  return tab === 'active' ? ACTIVE_STATUSES : PAST_STATUSES
}

function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error != null || result.data === undefined) {
    throw new ApiError(result.response.status, result.error)
  }
  return result.data
}

export function useMe() {
  const client = useApiClient()
  return useQuery({
    queryKey: ['me'] as const,
    queryFn: () => client.GET('/me').then(unwrap),
  })
}

export function useUpdateMe() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMeDto) =>
      client.PATCH('/me', { body }).then(unwrap),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
    },
  })
}

export function useTrips(tab: TripsTab) {
  const client = useApiClient()
  const statuses = statusesFor(tab)
  return useQuery({
    queryKey: ['trips', tab] as const,
    queryFn: () =>
      client
        .GET('/trips', {
          params: {
            query: {
              status: statuses.join(','),
              limit: 50,
            },
          },
        })
        .then(unwrap),
  })
}

export function useTrip(id: string | undefined) {
  const client = useApiClient()
  return useQuery({
    enabled: Boolean(id),
    queryKey: ['trip', id] as const,
    queryFn: () =>
      client
        .GET('/trips/{id}', { params: { path: { id: id as string } } })
        .then(unwrap),
  })
}

export function useCreateTrip() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTripBody) =>
      client.POST('/trips', { body }).then(unwrap),
    onSuccess: (trip) => {
      qc.setQueryData(['trip', trip.id], trip)
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
