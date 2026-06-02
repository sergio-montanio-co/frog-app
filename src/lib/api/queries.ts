import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useApiClient, ApiError } from './client'
import type { components } from './schema.gen'

export type UserDto = components['schemas']['UserDto']
export type UpdateMeDto = components['schemas']['UpdateMeDto']
export type TripListItem = components['schemas']['TripListItemDto']
export type TripStatus = TripListItem['status']
export type CreateTripBody = components['schemas']['CreateTripDto']
export type CreatedTripResponse = components['schemas']['TripDto']
export type TripDto = components['schemas']['TripDto']
export type UpdateTripBody = components['schemas']['UpdateTripDto']
export type InviteMemberBody = components['schemas']['InviteMemberDto']
export type ReleaseSavingsPlanBody =
  components['schemas']['ReleaseSavingsPlanDto']
export type UpdateSavingsPlanBody =
  components['schemas']['UpdateSavingsPlanDto']
export type TripMember = components['schemas']['TripMemberDto']
export type TripSavingsPlan = components['schemas']['TripSavingsPlanListItemDto']
export type CreateSavingsPlanBody =
  components['schemas']['CreateSavingsPlanDto']
export type SavingsPlanDto = components['schemas']['SavingsPlanDto']
export type PaymentSchedule = components['schemas']['PaymentScheduleDto']
export type MemberCuotaStatus = components['schemas']['MemberCuotaStatusDto']
export type UpcomingSchedule = components['schemas']['UpcomingScheduleDto']
export type ContributionDto = components['schemas']['ContributionDto']
export type ContributionStatus = ContributionDto['status']
export type CreateContributionDto =
  components['schemas']['CreateContributionDto']
export type UpdateContributionDto =
  components['schemas']['UpdateContributionDto']
export type ContributionListResponse =
  components['schemas']['ContributionListResponseDto']
export type RejectContributionBody =
  components['schemas']['RejectContributionDto']
export type ResponsibleAccount = components['schemas']['ResponsibleAccountDto']
export type TripPreviewByCodeDto =
  components['schemas']['TripPreviewByCodeDto']
export type TripPreviewByCodeTripDto =
  components['schemas']['TripPreviewByCodeTripDto']
export type JoinRequestDto = components['schemas']['JoinRequestDto']
export type JoinRequestUserDto = components['schemas']['JoinRequestUserDto']
export type JoinRequestListResponseDto =
  components['schemas']['JoinRequestListResponseDto']
export type JoinRequestPreviewStatus = TripPreviewByCodeDto['requestStatus']
export type JoinRequestStatus = JoinRequestDto['status']
export type JoinRequestListStatus = 'pending' | 'approved' | 'rejected'
export type NotificationDto = components['schemas']['NotificationDto']
export type NotificationListResponse =
  components['schemas']['NotificationListResponse']

export type ContributionStatusFilter = 'reported' | 'confirmed' | 'failed'

export type TripContributionFilters = {
  status?: ContributionStatusFilter
  memberId?: string
}

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

export function useMe(opts?: { enabled?: boolean }) {
  const client = useApiClient()
  return useQuery({
    enabled: opts?.enabled ?? true,
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

export function useMyContributions(tripId: string | undefined) {
  const client = useApiClient()
  return useQuery({
    enabled: Boolean(tripId),
    queryKey: ['me', 'contributions', tripId] as const,
    queryFn: () =>
      client
        .GET('/me/contributions', {
          params: { query: { tripId: tripId as string } },
        })
        .then(unwrap),
  })
}

export function useCreateContribution(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContributionDto) =>
      client
        .POST('/trips/{tripId}/contributions', {
          params: { path: { tripId } },
          body,
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trip', tripId, 'upcoming'] })
      qc.invalidateQueries({ queryKey: ['me', 'contributions', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateContribution() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: UpdateContributionDto
    }) =>
      client
        .PATCH('/contributions/{id}', {
          params: { path: { id } },
          body,
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'contributions'] })
      qc.invalidateQueries({ queryKey: ['trip'] })
    },
  })
}

export function useDeleteContribution() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await client.DELETE('/contributions/{id}', {
        params: { path: { id } },
      })
      if (error != null) throw new ApiError(response.status, error)
      if (response.status !== 204) {
        throw new ApiError(response.status, null)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'contributions'] })
      qc.invalidateQueries({ queryKey: ['trip'] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function usePendingContributions(
  tripId: string | undefined,
  opts?: { enabled?: boolean },
) {
  const client = useApiClient()
  return useQuery({
    enabled: (opts?.enabled ?? true) && Boolean(tripId),
    queryKey: ['trip', tripId, 'contributions', 'pending'] as const,
    queryFn: () =>
      client
        .GET('/trips/{tripId}/contributions/pending', {
          params: { path: { tripId: tripId as string } },
        })
        .then(unwrap),
  })
}

export function useTripContributions(
  tripId: string | undefined,
  filters: TripContributionFilters,
) {
  const client = useApiClient()
  return useQuery({
    enabled: Boolean(tripId),
    queryKey: [
      'trip',
      tripId,
      'contributions',
      'all',
      filters.status ?? 'any',
      filters.memberId ?? 'any',
    ] as const,
    queryFn: () =>
      client
        .GET('/trips/{tripId}/contributions', {
          params: {
            path: { tripId: tripId as string },
            query: {
              status: filters.status,
              memberId: filters.memberId,
            },
          },
        })
        .then(unwrap),
  })
}

export function useConfirmContribution(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      client
        .POST('/contributions/{id}/confirm', {
          params: { path: { id } },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['me', 'contributions'] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useRejectContribution(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      client
        .POST('/contributions/{id}/reject', {
          params: { path: { id } },
          body: { reason },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['me', 'contributions'] })
      qc.invalidateQueries({ queryKey: ['trips'] })
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

export function useNotifications() {
  const client = useApiClient()
  return useInfiniteQuery({
    queryKey: ['me', 'notifications'] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      client
        .GET('/me/notifications', {
          params: {
            // El feed in-app es su propio canal lógico (body corto, sin
            // links). Emails y push externos no se muestran aquí.
            query: { channel: 'in_app', limit: 30, cursor: pageParam },
          },
        })
        .then(unwrap),
    getNextPageParam: (last: NotificationListResponse) =>
      last.nextCursor ?? undefined,
  })
}

export function useUnreadNotificationsCount() {
  const client = useApiClient()
  return useQuery({
    queryKey: ['me', 'notifications', 'unread-count'] as const,
    queryFn: () =>
      client.GET('/me/notifications/unread-count').then(unwrap),
    refetchOnWindowFocus: true,
    select: (data) => data.unread,
  })
}

export function useMarkNotificationRead() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      client
        .POST('/me/notifications/{id}/mark-read', {
          params: { path: { id } },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'notifications'] })
      qc.invalidateQueries({
        queryKey: ['me', 'notifications', 'unread-count'],
      })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tripId?: string) =>
      client
        .POST('/me/notifications/mark-all-read', {
          params: { query: { tripId } },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'notifications'] })
      qc.invalidateQueries({
        queryKey: ['me', 'notifications', 'unread-count'],
      })
    },
  })
}

export function useUpdateTrip() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTripBody }) =>
      client
        .PATCH('/trips/{id}', { params: { path: { id } }, body })
        .then(unwrap),
    onSuccess: (trip) => {
      qc.setQueryData(['trip', trip.id], trip)
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useInviteMember(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InviteMemberBody) =>
      client
        .POST('/trips/{tripId}/members', {
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

export function useRemoveMember(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (memberId: string) => {
      const result = await client.DELETE(
        '/trips/{tripId}/members/{memberId}',
        { params: { path: { tripId, memberId } } },
      )
      if (result.response.status !== 204) {
        throw new ApiError(result.response.status, null)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useLeaveTrip() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error, response } = await client.POST(
        '/trips/{tripId}/members/leave',
        { params: { path: { tripId } } },
      )
      if (error != null) throw new ApiError(response.status, error)
      if (response.status !== 204) {
        throw new ApiError(response.status, null)
      }
      return tripId
    },
    onSuccess: (tripId) => {
      qc.removeQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useReleaseSavingsPlan(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      notes,
    }: {
      planId: string
      notes?: string
    }) =>
      client
        .POST('/trips/{tripId}/savings-plans/{planId}/release', {
          params: { path: { tripId, planId } },
          body: { notes },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateSavingsPlan(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      status,
    }: {
      planId: string
      status: 'active' | 'paused'
    }) =>
      client
        .PATCH('/trips/{tripId}/savings-plans/{planId}', {
          params: { path: { tripId, planId } },
          body: { status },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useCancelSavingsPlan(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) =>
      client
        .POST('/trips/{tripId}/savings-plans/{planId}/cancel', {
          params: { path: { tripId, planId } },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteTrip() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await client.DELETE('/trips/{id}', {
        params: { path: { id } },
      })
      if (error != null) throw new ApiError(response.status, error)
      if (response.status !== 204) {
        throw new ApiError(response.status, null)
      }
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: ['trip', id] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

export function useTripByCode(
  code: string,
  opts?: { enabled?: boolean },
) {
  const client = useApiClient()
  const normalized = normalizeInviteCode(code)
  return useQuery({
    enabled: (opts?.enabled ?? true) && normalized.length >= 6,
    retry: false,
    queryKey: ['trip-by-code', normalized] as const,
    queryFn: () =>
      client
        .GET('/trips/by-code/{code}', {
          params: { path: { code: normalized } },
        })
        .then(unwrap),
  })
}

export function useRequestJoin() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      code,
      message,
    }: {
      code: string
      message?: string
    }) =>
      client
        .POST('/trips/by-code/{code}/request-join', {
          params: { path: { code: normalizeInviteCode(code) } },
          body: { message },
        })
        .then(unwrap),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ['trip-by-code', normalizeInviteCode(vars.code)],
      })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useJoinRequests(
  tripId: string | undefined,
  opts?: { enabled?: boolean; status?: JoinRequestListStatus },
) {
  const client = useApiClient()
  const status = opts?.status ?? 'pending'
  return useQuery({
    enabled: (opts?.enabled ?? true) && Boolean(tripId),
    queryKey: ['trip', tripId, 'join-requests', status] as const,
    queryFn: () =>
      client
        .GET('/trips/{tripId}/join-requests', {
          params: {
            path: { tripId: tripId as string },
            query: { status },
          },
        })
        .then(unwrap),
  })
}

export function useApproveJoinRequest(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) =>
      client
        .POST('/join-requests/{requestId}/approve', {
          params: { path: { requestId } },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trip', tripId, 'join-requests'] })
      qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useRejectJoinRequest(tripId: string) {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string
      reason?: string
    }) =>
      client
        .POST('/join-requests/{requestId}/reject', {
          params: { path: { requestId } },
          body: { reason },
        })
        .then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId, 'join-requests'] })
    },
  })
}
