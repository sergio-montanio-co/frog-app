import { useMemo, useState } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  EmptyState,
  ErrorState,
  IconButton,
  LoadingSkeleton,
  Text,
} from '@/components/atoms'
import { colors } from '@/theme/colors'
import {
  PendingContributionCard,
  RejectDialog,
} from '@/components/molecules'
import {
  useMe,
  usePendingContributions,
  useTrip,
  useTripSchedules,
  type ContributionDto,
} from '@/lib/api/queries'
import { findActivePurchasePlan } from '@/lib/trips/helpers'

export default function OrganizerPendingScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const me = useMe()
  const trip = useTrip(tripId)
  const activePlan = trip.data ? findActivePurchasePlan(trip.data) : null
  const schedules = useTripSchedules(tripId, activePlan?.id)
  const pending = usePendingContributions(tripId)

  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const sortedItems = useMemo<ContributionDto[]>(() => {
    const items = pending.data?.items ?? []
    return [...items].sort((a, b) => {
      const aTime = new Date(a.reportedAt ?? a.createdAt).getTime()
      const bTime = new Date(b.reportedAt ?? b.createdAt).getTime()
      return aTime - bTime
    })
  }, [pending.data])

  const scheduleById = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<typeof schedules.data>['items'][number]
    >()
    for (const s of schedules.data?.items ?? []) map.set(s.id, s)
    return map
  }, [schedules.data])

  if (trip.isLoading || pending.isLoading || me.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 p-4">
          <LoadingSkeleton
            variant="list"
            lines={3}
            accessibilityLabel={t('states.loading.label')}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!trip.data || !me.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 justify-center p-4">
          <ErrorState
            title={t('states.error.defaultTitle')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              trip.refetch()
              pending.refetch()
            }}
          />
        </View>
      </SafeAreaView>
    )
  }

  const tripName = trip.data.name
  const myMemberId = trip.data.members.find(
    (m) => m.user?.id === me.data?.id && m.status === 'active',
  )?.id

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header onBack={() => router.back()} title={tripName} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={pending.isRefetching}
            onRefresh={() => pending.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View className="gap-1">
          <Text variant="display">{t('trips.organizer.pending.title')}</Text>
          <Text variant="body" tone="secondary">
            {tripName}
          </Text>
        </View>

        {sortedItems.length === 0 ? (
          <EmptyState
            icon="rule"
            title={t('trips.organizer.pending.emptyTitle')}
            body={t('trips.organizer.pending.emptyBody')}
          />
        ) : (
          sortedItems.map((c) => {
            const member = trip.data.members.find(
              (m) => m.id === c.tripMemberId,
            ) ?? null
            const schedule =
              scheduleById.get(c.paymentScheduleId) ?? null
            const isSelf = member?.id === myMemberId
            return (
              <PendingContributionCard
                key={c.id}
                contribution={c}
                member={member}
                schedule={schedule}
                tripId={trip.data.id}
                isSelf={isSelf}
                onRejectPress={(id) => setRejectingId(id)}
              />
            )
          })
        )}
      </ScrollView>

      <RejectDialog
        open={rejectingId !== null}
        tripId={trip.data.id}
        contributionId={rejectingId}
        onClose={() => setRejectingId(null)}
      />
    </SafeAreaView>
  )
}

function Header({ onBack, title }: { onBack: () => void; title?: string }) {
  const { t } = useTranslation()
  return (
    <View className="flex-row items-center gap-2 px-2 py-2">
      <IconButton
        name="arrow-back"
        variant="ghost"
        accessibilityLabel={t('common.back')}
        onPress={onBack}
      />
      <View className="flex-1">
        <Text variant="body-em" numberOfLines={1}>
          {title ?? t('trips.organizer.pending.headerTitle')}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  )
}
