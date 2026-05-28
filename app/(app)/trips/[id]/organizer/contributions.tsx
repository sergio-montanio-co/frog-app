import { useMemo, useState } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingSkeleton,
  Text,
  TogglePill,
} from '@/components/atoms'
import { colors } from '@/theme/colors'
import {
  ContributionHistoryItem,
  FilterBar,
  MemberPickerSheet,
  type StatusFilterValue,
} from '@/components/molecules'
import {
  useMe,
  useTrip,
  useTripContributions,
  type ContributionDto,
  type ContributionStatusFilter,
  type TripMember,
} from '@/lib/api/queries'
import { resolveMemberName } from '@/lib/trips/helpers'

type SortOrder = 'newest' | 'oldest'

function statusFilterToQuery(
  v: StatusFilterValue,
): ContributionStatusFilter | undefined {
  if (v === 'all') return undefined
  if (v === 'rejected') return 'failed'
  return v
}

function sortContributions(
  items: ContributionDto[],
  order: SortOrder,
): ContributionDto[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.reportedAt ?? a.createdAt).getTime()
    const bTime = new Date(b.reportedAt ?? b.createdAt).getTime()
    return order === 'newest' ? bTime - aTime : aTime - bTime
  })
}

export default function OrganizerAllContributionsScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const me = useMe()
  const trip = useTrip(tripId)

  const [status, setStatus] = useState<StatusFilterValue>('all')
  const [selectedMember, setSelectedMember] = useState<TripMember | null>(null)
  const [sort, setSort] = useState<SortOrder>('newest')
  const [pickerOpen, setPickerOpen] = useState(false)

  const contributions = useTripContributions(tripId, {
    status: statusFilterToQuery(status),
    memberId: selectedMember?.id,
  })

  const sortedItems = useMemo(() => {
    return sortContributions(contributions.data?.items ?? [], sort)
  }, [contributions.data, sort])

  const eligibleMembers = useMemo(
    () =>
      (trip.data?.members ?? []).filter(
        (m) => m.status !== 'left' && m.status !== 'removed',
      ),
    [trip.data],
  )

  if (trip.isLoading || me.isLoading || contributions.isLoading) {
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
            onRetry={() => contributions.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const hasActiveFilters = status !== 'all' || selectedMember !== null
  const memberLabel = selectedMember
    ? resolveMemberName(selectedMember)
    : t('trips.organizer.all.filter.allMembers')

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header onBack={() => router.back()} title={trip.data.name} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={contributions.isRefetching}
            onRefresh={() => contributions.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View className="gap-1">
          <Text variant="display">{t('trips.organizer.all.title')}</Text>
          <Text variant="body" tone="secondary">
            {trip.data.name}
          </Text>
        </View>

        <FilterBar
          status={status}
          onStatusChange={setStatus}
          memberLabel={memberLabel}
          memberActive={selectedMember !== null}
          onPressMember={() => setPickerOpen(true)}
        />

        <View className="flex-row gap-2 self-end">
          <TogglePill
            label={t('trips.organizer.all.sort.newest')}
            active={sort === 'newest'}
            onPress={() => setSort('newest')}
          />
          <TogglePill
            label={t('trips.organizer.all.sort.oldest')}
            active={sort === 'oldest'}
            onPress={() => setSort('oldest')}
          />
        </View>

        {sortedItems.length === 0 ? (
          <EmptyState
            icon="receipt-long"
            title={
              hasActiveFilters
                ? t('trips.organizer.all.emptyFilteredTitle')
                : t('trips.organizer.all.emptyTitle')
            }
            body={
              hasActiveFilters
                ? t('trips.organizer.all.emptyFilteredBody')
                : t('trips.organizer.all.emptyBody')
            }
            cta={
              hasActiveFilters
                ? {
                    label: t('trips.organizer.all.clearFilters'),
                    onPress: () => {
                      setStatus('all')
                      setSelectedMember(null)
                    },
                  }
                : undefined
            }
          />
        ) : (
          <View className="rounded-card border-hairline border-muted bg-background px-4">
            {sortedItems.map((c, idx) => {
              const member =
                trip.data.members.find((m) => m.id === c.tripMemberId) ?? null
              const memberName = member ? resolveMemberName(member) : ''
              const isSelf = member?.user?.id === me.data?.id
              const prefix = isSelf
                ? t('trips.organizer.all.memberSelfPrefix')
                : t('trips.organizer.all.memberPrefix', {
                    name: memberName || '—',
                  })
              return (
                <View key={c.id}>
                  {idx > 0 ? <Divider /> : null}
                  <ContributionHistoryItem
                    contribution={c}
                    memberName={prefix}
                  />
                </View>
              )
            })}
          </View>
        )}

        {contributions.isError ? (
          <ErrorState
            title={t('states.error.defaultTitle')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.retry')}
            onRetry={() => contributions.refetch()}
          />
        ) : null}
      </ScrollView>

      <MemberPickerSheet
        open={pickerOpen}
        members={eligibleMembers}
        selectedMemberId={selectedMember?.id ?? null}
        onSelect={(m) => setSelectedMember(m)}
        onClose={() => setPickerOpen(false)}
        title={t('trips.organizer.all.filter.memberLabel')}
        showAllOption
        allOptionLabel={t('trips.organizer.all.filter.allMembers')}
        onSelectAll={() => setSelectedMember(null)}
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
          {title ?? t('trips.organizer.all.headerTitle')}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  )
}
