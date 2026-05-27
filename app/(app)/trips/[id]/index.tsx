import { useEffect, useMemo } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Badge,
  Button,
  Card,
  Divider,
  Icon,
  IconButton,
  ProgressBar,
  Splash,
  Text,
} from '@/components/atoms'
import {
  Countdown,
  InvitedMemberRow,
  MemberStatusRow,
  PlanSummaryCard,
  UpcomingInstallmentBanner,
} from '@/components/molecules'
import { colors } from '@/theme/colors'
import { formatMxn } from '@/lib/money'
import {
  useMarkAllNotificationsRead,
  useMe,
  useMyContributions,
  usePendingContributions,
  useTrip,
  useTripSchedules,
  useUpcomingInstallment,
  type PaymentSchedule,
  type TripDto,
  type TripMember,
  type TripSavingsPlan,
} from '@/lib/api/queries'
import {
  findActivePurchasePlan,
  getMemberCurrentState,
  isOrganizer,
} from '@/lib/trips/helpers'

export default function TripDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const me = useMe()
  const trip = useTrip(id)
  const markAllRead = useMarkAllNotificationsRead()

  const tripId = trip.data?.id
  const markAllReadMutate = markAllRead.mutate
  useEffect(() => {
    if (!tripId) return
    markAllReadMutate(tripId)
  }, [tripId, markAllReadMutate])

  const activePlan = trip.data ? findActivePurchasePlan(trip.data) : null
  const schedules = useTripSchedules(id, activePlan?.id)
  const upcoming = useUpcomingInstallment(id)
  const myContribs = useMyContributions(id)
  const hasHistory = (myContribs.data?.items.length ?? 0) > 0
  const meIsOrganizerEarly =
    trip.data && me.data ? isOrganizer(trip.data, me.data.id) : false
  const pending = usePendingContributions(id, {
    enabled: Boolean(id) && meIsOrganizerEarly,
  })
  const pendingCount = pending.data?.items.length ?? 0

  if (trip.isLoading || me.isLoading) return <Splash />

  if (trip.isError || me.isError || !trip.data || !me.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <DashboardTopBar
          title={t('trips.dashboard.headerFallback')}
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="title">{t('trips.errorTitle')}</Text>
          <Button
            label={t('common.retry')}
            variant="secondary"
            onPress={() => trip.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const userIsOrganizer = isOrganizer(trip.data, me.data.id)
  const currentMember = trip.data.members.find(
    (m) => m.user?.id === me.data?.id && m.status === 'active',
  )

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <DashboardTopBar
        title={trip.data.name}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        <DashboardHero trip={trip.data} />

        {!activePlan && userIsOrganizer ? (
          <PlanEmptyStateOrganizer
            onPress={() =>
              router.push({
                pathname: '/trips/[id]/plan/new',
                params: { id: trip.data.id },
              })
            }
          />
        ) : null}
        {!activePlan && !userIsOrganizer ? <PlanEmptyStateMember /> : null}

        {activePlan ? (
          <>
            {upcoming.data ? (
              <UpcomingInstallmentBanner
                upcoming={upcoming.data}
                onReport={() =>
                  router.push(`/trips/${trip.data.id}/contributions/new`)
                }
              />
            ) : null}

            <GroupProgressCard trip={trip.data} />
            <PlanSummaryCard plan={activePlan} />
            {hasHistory ? (
              <Pressable
                onPress={() =>
                  router.push(`/trips/${trip.data.id}/contributions`)
                }
                accessibilityRole="button"
                accessibilityLabel={t('trips.dashboard.viewHistory')}
                className="flex-row items-center gap-2 self-start px-2 py-2"
              >
                <Icon name="history" size={20} color={colors.primary} />
                <Text variant="body-em" tone="primary">
                  {t('trips.dashboard.viewHistory')}
                </Text>
              </Pressable>
            ) : null}
            <MembersSection
              members={trip.data.members}
              schedules={schedules.data?.items ?? []}
              currentUserId={me.data.id}
              currentMemberId={currentMember?.id}
            />
            {userIsOrganizer ? (
              <PendingInvitesSection
                tripId={trip.data.id}
                tripName={trip.data.name}
                members={trip.data.members}
              />
            ) : null}
            {userIsOrganizer ? (
              <OrganizerActionsCard
                tripId={trip.data.id}
                pendingCount={pendingCount}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function OrganizerActionsCard({
  tripId,
  pendingCount,
}: {
  tripId: string
  pendingCount: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <Card className="gap-3">
      <Text variant="title">{t('trips.dashboard.organizer.title')}</Text>

      <Pressable
        onPress={() => router.push(`/trips/${tripId}/organizer/pending`)}
        accessibilityRole="button"
        accessibilityLabel={t('trips.dashboard.organizer.approve')}
        className="flex-row items-center justify-between gap-2 py-2"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Icon name="rule" size={20} color={colors.primary} />
          <Text variant="body-em">
            {t('trips.dashboard.organizer.approve')}
          </Text>
        </View>
        {pendingCount > 0 ? (
          <Badge tone="primary" label={String(pendingCount)} />
        ) : (
          <Icon
            name="chevron-right"
            size={20}
            color={colors.secondary}
          />
        )}
      </Pressable>

      <Divider />

      <Pressable
        onPress={() => router.push(`/trips/${tripId}/organizer/contributions`)}
        accessibilityRole="button"
        accessibilityLabel={t('trips.dashboard.organizer.allContribs')}
        className="flex-row items-center justify-between gap-2 py-2"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Icon name="receipt-long" size={20} color={colors.primary} />
          <Text variant="body-em">
            {t('trips.dashboard.organizer.allContribs')}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.secondary} />
      </Pressable>

      <Divider />

      <Pressable
        onPress={() => router.push(`/trips/${tripId}/organizer/log`)}
        accessibilityRole="button"
        accessibilityLabel={t('trips.dashboard.organizer.logManual')}
        className="flex-row items-center justify-between gap-2 py-2"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Icon name="payments" size={20} color={colors.primary} />
          <Text variant="body-em">
            {t('trips.dashboard.organizer.logManual')}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.secondary} />
      </Pressable>
    </Card>
  )
}

function DashboardTopBar({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  const { t } = useTranslation()
  return (
    <View className="flex-row items-center gap-2 px-2 py-2">
      <IconButton
        name="arrow-back"
        variant="ghost"
        accessibilityLabel={t('trips.dashboard.back')}
        onPress={onBack}
      />
      <View className="flex-1">
        <Text variant="body-em" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  )
}

function DashboardHero({ trip }: { trip: TripDto }) {
  const { t } = useTranslation()
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text variant="display" numberOfLines={2}>
          {trip.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Icon
            name="flight-takeoff"
            size={16}
            color={colors.secondary}
          />
          <Text variant="body" tone="secondary" numberOfLines={1}>
            {trip.destination}
          </Text>
        </View>
      </View>
      <Card>
        <Countdown
          targetIso={trip.purchaseDeadline}
          label={t('trips.dashboard.daysUntilDeadline.other')}
        />
      </Card>
    </View>
  )
}

function GroupProgressCard({ trip }: { trip: TripDto }) {
  const { t } = useTranslation()
  const progress = trip.progress
  const percent = progress?.percentConfirmed ?? 0
  const collected = formatMxn(progress?.confirmed ?? '0', { compact: true })
  const target = formatMxn(progress?.totalTarget ?? '0', { compact: true })
  const reportedPending = progress?.reportedPending
    ? Number(progress.reportedPending)
    : 0

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="title">{t('trips.dashboard.groupProgress.title')}</Text>
        <Text variant="body-em" tone="primary">
          {t('trips.dashboard.groupProgress.percent', {
            percent: Math.round(percent),
          })}
        </Text>
      </View>
      <ProgressBar
        percent={percent}
        accessibilityLabel={`${Math.round(percent)}%`}
      />
      <Text variant="caption" tone="secondary">
        {t('trips.dashboard.groupProgress.collected', {
          collected,
          target,
        })}
      </Text>
      {reportedPending > 0 ? (
        <Text variant="caption" tone="secondary">
          {t('trips.dashboard.groupProgress.reportedPending', {
            amount: formatMxn(progress!.reportedPending, { compact: true }),
          })}
        </Text>
      ) : null}
    </Card>
  )
}

function PlanEmptyStateOrganizer({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-4 items-center">
      <Icon name="savings" size={32} color={colors.primary} />
      <View className="gap-1 items-center">
        <Text variant="title">
          {t('trips.dashboard.planEmpty.organizerTitle')}
        </Text>
        <Text variant="body" tone="secondary" className="text-center">
          {t('trips.dashboard.planEmpty.organizerBody')}
        </Text>
      </View>
      <Button
        label={t('trips.dashboard.planEmpty.organizerCta')}
        size="lg"
        onPress={onPress}
        className="self-stretch"
      />
    </Card>
  )
}

function PlanEmptyStateMember() {
  const { t } = useTranslation()
  return (
    <Card className="gap-3 items-center">
      <Icon name="hourglass-empty" size={32} color={colors.secondary} />
      <View className="gap-1 items-center">
        <Text variant="title">
          {t('trips.dashboard.planEmpty.memberTitle')}
        </Text>
        <Text variant="body" tone="secondary" className="text-center">
          {t('trips.dashboard.planEmpty.memberBody')}
        </Text>
      </View>
    </Card>
  )
}

function PendingInvitesSection({
  tripId,
  tripName,
  members,
}: {
  tripId: string
  tripName: string
  members: TripMember[]
}) {
  const { t } = useTranslation()
  const pending = useMemo(
    () =>
      members.filter(
        (m) =>
          m.status === 'invited' &&
          m.invitation != null &&
          !m.invitation.isAccepted,
      ),
    [members],
  )

  if (pending.length === 0) return null

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        <Icon name="mail-outline" size={20} color={colors.primary} />
        <Text variant="title">{t('trips.invitedMembers.title')}</Text>
      </View>
      <Text variant="caption" tone="secondary">
        {t('trips.invitedMembers.subtitle')}
      </Text>
      {pending.map((m, idx) => (
        <View key={m.id} className="gap-3">
          {idx > 0 ? <Divider /> : null}
          <InvitedMemberRow
            member={m}
            invitation={m.invitation!}
            tripId={tripId}
            tripName={tripName}
          />
        </View>
      ))}
    </Card>
  )
}

function MembersSection({
  members,
  schedules,
  currentUserId,
  currentMemberId,
}: {
  members: TripMember[]
  schedules: PaymentSchedule[]
  currentUserId: string
  currentMemberId?: string
}) {
  const { t } = useTranslation()
  const visibleMembers = useMemo(
    () => members.filter((m) => m.status !== 'left' && m.status !== 'removed'),
    [members],
  )

  return (
    <Card className="gap-2">
      <Text variant="title" className="pb-2">
        {t('trips.dashboard.members.title')}
      </Text>
      {visibleMembers.map((m) => {
        const result = getMemberCurrentState(m.id, schedules)
        return (
          <MemberStatusRow
            key={m.id}
            member={m}
            status={result?.status ?? null}
            isCurrentUser={
              currentMemberId
                ? m.id === currentMemberId
                : m.user?.id === currentUserId
            }
          />
        )
      })}
    </Card>
  )
}
