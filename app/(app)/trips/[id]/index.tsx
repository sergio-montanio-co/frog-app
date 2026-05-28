import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  ErrorState,
  Icon,
  IconButton,
  LoadingSkeleton,
  ProgressBar,
  Text,
} from '@/components/atoms'
import {
  CancelPlanDialog,
  Countdown,
  DeleteTripDialog,
  InvitedMemberRow,
  InviteLateDialog,
  MemberStatusRow,
  PlanSummaryCard,
  ReleaseDialog,
  UpcomingInstallmentBanner,
} from '@/components/molecules'
import { colors } from '@/theme/colors'
import { parseBackendError } from '@/lib/api/errors'
import { formatMxn } from '@/lib/money'
import {
  useLeaveTrip,
  useMarkAllNotificationsRead,
  useMe,
  useMyContributions,
  usePendingContributions,
  useRemoveMember,
  useTrip,
  useTripSchedules,
  useUpcomingInstallment,
  useUpdateSavingsPlan,
  type PaymentSchedule,
  type TripDto,
  type TripMember,
} from '@/lib/api/queries'
import {
  canCancelPlan,
  canDeleteTrip,
  canPausePlan,
  canResumePlan,
  canReleasePlan,
  findActivePurchasePlan,
  findCancelledPurchasePlan,
  getMemberCurrentState,
  isOrganizer,
  resolveMemberName,
} from '@/lib/trips/helpers'

export default function TripDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const me = useMe()
  const trip = useTrip(id)
  const markAllRead = useMarkAllNotificationsRead()
  const leave = useLeaveTrip()
  const remove = useRemoveMember(id ?? '')

  const tripId = trip.data?.id
  const markAllReadMutate = markAllRead.mutate
  useEffect(() => {
    if (!tripId) return
    markAllReadMutate(tripId)
  }, [tripId, markAllReadMutate])

  const activePlan = trip.data ? findActivePurchasePlan(trip.data) : null
  const cancelledPlan = trip.data
    ? findCancelledPurchasePlan(trip.data)
    : null
  const releasablePlan = canReleasePlan(activePlan) ? activePlan : null
  const updatePlan = useUpdateSavingsPlan(id ?? '')
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
  const purchaseReady = trip.data?.status === 'purchase_ready'

  const [releaseOpen, setReleaseOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [cancelPlanOpen, setCancelPlanOpen] = useState(false)
  const [deleteTripOpen, setDeleteTripOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TripMember | null>(null)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [pauseError, setPauseError] = useState<string | null>(null)

  if (trip.isLoading || me.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <DashboardTopBar
          title={t('trips.dashboard.headerFallback')}
          onBack={() => router.back()}
        />
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

  if (trip.isError || me.isError || !trip.data || !me.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <DashboardTopBar
          title={t('trips.dashboard.headerFallback')}
          onBack={() => router.back()}
        />
        <View className="flex-1 justify-center p-4">
          <ErrorState
            title={t('trips.errorTitle')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.retry')}
            onRetry={() => trip.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const userIsOrganizer = isOrganizer(trip.data, me.data.id)
  const currentMember = trip.data.members.find(
    (m) => m.user?.id === me.data?.id && m.status === 'active',
  )
  const canDelete = userIsOrganizer && canDeleteTrip(trip.data)
  const showCancelledBanner =
    cancelledPlan != null && activePlan == null && !purchaseReady
  const showPauseControl = userIsOrganizer && canPausePlan(activePlan)
  const showResumeControl = userIsOrganizer && canResumePlan(activePlan)

  async function onConfirmLeave() {
    setLeaveError(null)
    try {
      await leave.mutateAsync(trip.data!.id)
      setLeaveOpen(false)
      router.replace('/(app)/(tabs)/')
    } catch (err) {
      setLeaveError(parseBackendError(err))
    }
  }

  async function onConfirmRemove() {
    if (!removeTarget) return
    setRemoveError(null)
    try {
      await remove.mutateAsync(removeTarget.id)
      setRemoveTarget(null)
    } catch (err) {
      setRemoveError(parseBackendError(err))
    }
  }

  async function onTogglePause() {
    if (!activePlan) return
    setPauseError(null)
    try {
      await updatePlan.mutateAsync({
        planId: activePlan.id,
        status: activePlan.status === 'active' ? 'paused' : 'active',
      })
    } catch (err) {
      setPauseError(parseBackendError(err))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <DashboardTopBar
        title={trip.data.name}
        onBack={() => router.back()}
        rightSlot={
          userIsOrganizer ? (
            <View className="flex-row items-center">
              <IconButton
                name="edit"
                variant="ghost"
                accessibilityLabel={t('trips.admin.editTrip.cta')}
                onPress={() =>
                  router.push({
                    pathname: '/trips/[id]/edit',
                    params: { id: trip.data.id },
                  })
                }
              />
              {canDelete ? (
                <IconButton
                  name="more-vert"
                  variant="ghost"
                  accessibilityLabel={t('trips.admin.menu.open')}
                  onPress={() => setMenuOpen(true)}
                />
              ) : null}
            </View>
          ) : null
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          gap: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={trip.isRefetching}
            onRefresh={() => trip.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <DashboardHero trip={trip.data} />

        {purchaseReady ? <PurchaseReadyBanner /> : null}

        {showCancelledBanner ? <CancelledPlanBanner /> : null}

        {pauseError ? (
          <Card className="border-primary">
            <Text variant="caption" tone="primary">
              {pauseError}
            </Text>
          </Card>
        ) : null}

        {!activePlan && !cancelledPlan && userIsOrganizer ? (
          <PlanEmptyStateOrganizer
            onPress={() =>
              router.push({
                pathname: '/trips/[id]/plan/new',
                params: { id: trip.data.id },
              })
            }
          />
        ) : null}
        {!activePlan && !cancelledPlan && !userIsOrganizer ? (
          <PlanEmptyStateMember />
        ) : null}

        {activePlan ? (
          <>
            {!purchaseReady && upcoming.data ? (
              <UpcomingInstallmentBanner
                upcoming={upcoming.data}
                onReport={() =>
                  router.push(`/trips/${trip.data.id}/contributions/new`)
                }
              />
            ) : null}

            <GroupProgressCard trip={trip.data} />
            <PlanSummaryCard plan={activePlan} />

            {userIsOrganizer && releasablePlan ? (
              <View className="flex-row items-center gap-2">
                <Button
                  label={t('trips.admin.release.cta')}
                  variant="primary"
                  className="flex-1"
                  onPress={() => setReleaseOpen(true)}
                />
                {showPauseControl ? (
                  <IconButton
                    name="pause"
                    variant="secondary"
                    accessibilityLabel={t('trips.admin.pausePlan.cta')}
                    onPress={onTogglePause}
                    disabled={updatePlan.isPending}
                  />
                ) : null}
                {showResumeControl ? (
                  <IconButton
                    name="play-arrow"
                    variant="secondary"
                    accessibilityLabel={t('trips.admin.resumePlan.cta')}
                    onPress={onTogglePause}
                    disabled={updatePlan.isPending}
                  />
                ) : null}
              </View>
            ) : null}

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
              trip={trip.data}
              canRemove={userIsOrganizer}
              onRemove={(m) => {
                setRemoveError(null)
                setRemoveTarget(m)
              }}
            />
            {userIsOrganizer ? (
              <PendingInvitesSection
                tripId={trip.data.id}
                tripName={trip.data.name}
                members={trip.data.members}
                onInvite={() => setInviteOpen(true)}
              />
            ) : null}
            {userIsOrganizer && !purchaseReady ? (
              <OrganizerActionsCard
                tripId={trip.data.id}
                pendingCount={pendingCount}
                canCancel={canCancelPlan(activePlan)}
                onCancelPlan={() => setCancelPlanOpen(true)}
              />
            ) : null}
            {!userIsOrganizer ? (
              <LeaveTripCard onPress={() => setLeaveOpen(true)} />
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {userIsOrganizer && releasablePlan ? (
        <ReleaseDialog
          open={releaseOpen}
          tripId={trip.data.id}
          tripName={trip.data.name}
          planId={releasablePlan.id}
          pendingCount={pendingCount}
          onClose={() => setReleaseOpen(false)}
          onReviewPending={() =>
            router.push(`/trips/${trip.data.id}/organizer/pending`)
          }
        />
      ) : null}

      {userIsOrganizer ? (
        <InviteLateDialog
          open={inviteOpen}
          tripId={trip.data.id}
          onClose={() => setInviteOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={leaveOpen}
        destructive
        title={t('trips.admin.leave.title', { tripName: trip.data.name })}
        description={leaveError ?? t('trips.admin.leave.body')}
        confirmLabel={t('trips.admin.leave.confirm')}
        cancelLabel={t('common.cancel')}
        confirmLoading={leave.isPending}
        onConfirm={onConfirmLeave}
        onCancel={() => {
          setLeaveError(null)
          setLeaveOpen(false)
        }}
      />

      <ConfirmDialog
        open={removeTarget != null}
        destructive
        title={t('trips.admin.removeMember.title', {
          name: removeTarget ? resolveMemberName(removeTarget) : '',
        })}
        description={removeError ?? t('trips.admin.removeMember.body')}
        confirmLabel={t('trips.admin.removeMember.confirm')}
        cancelLabel={t('common.cancel')}
        confirmLoading={remove.isPending}
        onConfirm={onConfirmRemove}
        onCancel={() => {
          setRemoveError(null)
          setRemoveTarget(null)
        }}
      />

      {userIsOrganizer && activePlan ? (
        <CancelPlanDialog
          open={cancelPlanOpen}
          tripId={trip.data.id}
          planId={activePlan.id}
          onClose={() => setCancelPlanOpen(false)}
        />
      ) : null}

      <DeleteTripDialog
        open={deleteTripOpen}
        tripId={trip.data.id}
        tripName={trip.data.name}
        onClose={() => setDeleteTripOpen(false)}
        onDeleted={() => router.replace('/(app)/(tabs)/')}
      />

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          className="flex-1 bg-foreground/40"
          accessibilityLabel={t('common.close')}
        >
          <View className="absolute right-4 top-16 w-56 gap-1 rounded-card border-hairline border-muted bg-background p-2">
            {canDelete ? (
              <Pressable
                onPress={() => {
                  setMenuOpen(false)
                  setDeleteTripOpen(true)
                }}
                accessibilityRole="button"
                accessibilityLabel={t('trips.admin.deleteTrip.cta')}
                className="flex-row items-center gap-2 px-3 py-3"
              >
                <Icon
                  name="delete-outline"
                  size={20}
                  color={colors.secondary}
                />
                <Text variant="body-em" tone="secondary">
                  {t('trips.admin.deleteTrip.cta')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function PurchaseReadyBanner() {
  const { t } = useTranslation()
  return (
    <Card className="gap-2">
      <View className="flex-row items-center gap-2">
        <Icon name="check-circle" size={20} color={colors.primary} />
        <Text variant="title">{t('trips.admin.purchaseReady.title')}</Text>
      </View>
      <Text variant="body" tone="secondary">
        {t('trips.admin.purchaseReady.body')}
      </Text>
    </Card>
  )
}

function CancelledPlanBanner() {
  const { t } = useTranslation()
  return (
    <Card className="gap-2">
      <View className="flex-row items-center gap-2">
        <Icon name="block" size={20} color={colors.secondary} />
        <Text variant="title">{t('trips.admin.cancelPlan.cancelledTitle')}</Text>
      </View>
      <Text variant="body" tone="secondary">
        {t('trips.admin.cancelPlan.cancelledBody')}
      </Text>
    </Card>
  )
}

function LeaveTripCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <Card className="gap-3 items-start">
      <Button
        label={t('trips.admin.leave.cta')}
        variant="ghost"
        onPress={onPress}
      />
    </Card>
  )
}

function OrganizerActionsCard({
  tripId,
  pendingCount,
  canCancel,
  onCancelPlan,
}: {
  tripId: string
  pendingCount: number
  canCancel: boolean
  onCancelPlan: () => void
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

      {canCancel ? (
        <>
          <Divider />
          <Pressable
            onPress={onCancelPlan}
            accessibilityRole="button"
            accessibilityLabel={t('trips.admin.cancelPlan.cta')}
            className="flex-row items-center justify-between gap-2 py-2"
          >
            <View className="flex-1 flex-row items-center gap-2">
              <Icon name="block" size={20} color={colors.secondary} />
              <Text variant="body-em" tone="secondary">
                {t('trips.admin.cancelPlan.cta')}
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={20}
              color={colors.secondary}
            />
          </Pressable>
        </>
      ) : null}
    </Card>
  )
}

function DashboardTopBar({
  title,
  onBack,
  rightSlot,
}: {
  title: string
  onBack: () => void
  rightSlot?: React.ReactNode
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
      {rightSlot ?? <View className="w-11" />}
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
  onInvite,
}: {
  tripId: string
  tripName: string
  members: TripMember[]
  onInvite: () => void
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

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        <Icon name="mail-outline" size={20} color={colors.primary} />
        <Text variant="title">{t('trips.invitedMembers.title')}</Text>
      </View>
      {pending.length > 0 ? (
        <>
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
        </>
      ) : null}
      <Button
        label={t('trips.admin.inviteLate.cta')}
        variant="secondary"
        onPress={onInvite}
      />
    </Card>
  )
}

function MembersSection({
  members,
  schedules,
  currentUserId,
  currentMemberId,
  trip,
  canRemove,
  onRemove,
}: {
  members: TripMember[]
  schedules: PaymentSchedule[]
  currentUserId: string
  currentMemberId?: string
  trip: TripDto
  canRemove: boolean
  onRemove: (m: TripMember) => void
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
        const isCreator = m.user?.id === trip.createdByUserId
        const isOrganizerMember = m.role === 'organizer'
        const removable =
          canRemove && !isCreator && !isOrganizerMember && m.status !== 'invited'
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
            onRemove={removable ? () => onRemove(m) : undefined}
          />
        )
      })}
    </Card>
  )
}
