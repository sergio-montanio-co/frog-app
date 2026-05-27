import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient, ApiError } from './client'
import type { components } from './schema.gen'

export type UserDto = components['schemas']['UserDto']
export type UpdateMeDto = components['schemas']['UpdateMeDto']
export type TripListItem = components['schemas']['TripListItemDto']
export type TripStatus = TripListItem['status']
export type CreateTripBody = components['schemas']['CreateTripDto']
export type CreatedTripResponse = components['schemas']['TripDto']
export type TripDto = components['schemas']['TripDto']
export type TripMember = components['schemas']['TripMemberDto']
export type TripSavingsPlan = components['schemas']['TripSavingsPlanListItemDto']
export type CreateSavingsPlanBody =
  components['schemas']['CreateSavingsPlanDto']
export type SavingsPlanDto = components['schemas']['SavingsPlanDto']
export type PaymentSchedule = components['schemas']['PaymentScheduleDto']
export type MemberCuotaStatus = components['schemas']['MemberCuotaStatusDto']
export type UpcomingSchedule = components['schemas']['UpcomingScheduleDto']

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

export function useTripSchedules(
  tripId: string | undefined,
  planId: string | undefined,
) {
  const client = useApiClient()
  return useQuery({
    enabled: Boolean(tripId) && Boolean(planId),
    queryKey: ['trip', tripId, 'plan', planId, 'schedules'] as const,
    queryFn: () =>
      client
        .GET('/trips/{tripId}/savings-plans/{planId}/schedules', {
          params: {
            path: { tripId: tripId as string, planId: planId as string },
          },
        })
        .then(unwrap),
  })
}

export function useUpcomingInstallment(tripId: string | undefined) {
  const client = useApiClient()
  return useQuery({
    enabled: Boolean(tripId),
    queryKey: ['trip', tripId, 'upcoming'] as const,
    queryFn: async (): Promise<UpcomingSchedule | null> => {
      const { data, error, response } = await client.GET(
        '/trips/{tripId}/schedules/upcoming',
        { params: { path: { tripId: tripId as string } } },
      )
      if (response.status === 204) return null
      if (error != null || data === undefined) {
        throw new ApiError(response.status, error)
      }
      return data
    },
  })
}

export function useCreateSavingsPlan(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSavingsPlanBody) =>
      client
        .POST('/trips/{tripId}/savings-plans', {
          params: { path: { tripId } },
          body,
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
