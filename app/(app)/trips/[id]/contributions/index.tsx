import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Button,
  ConfirmDialog,
  Divider,
  EmptyState,
  IconButton,
  Splash,
  Text,
} from '@/components/atoms'
import { ContributionHistoryItem } from '@/components/molecules'
import { parseBackendError } from '@/lib/api/errors'
import {
  useDeleteContribution,
  useMe,
  useMyContributions,
  useTrip,
  useTripSchedules,
  type ContributionDto,
  type PaymentSchedule,
} from '@/lib/api/queries'
import { findActivePurchasePlan } from '@/lib/trips/helpers'
import { formatMxn } from '@/lib/money'

type Group = {
  scheduleId: string
  installmentNumber: number | null
  dueDate: string | null
  items: ContributionDto[]
}

function groupByInstallment(
  contributions: ContributionDto[],
  schedules: PaymentSchedule[],
): Group[] {
  const scheduleMap = new Map(schedules.map((s) => [s.id, s]))
  const groups = new Map<string, Group>()
  for (const c of contributions) {
    const schedule = scheduleMap.get(c.paymentScheduleId)
    const existing = groups.get(c.paymentScheduleId)
    if (existing) {
      existing.items.push(c)
    } else {
      groups.set(c.paymentScheduleId, {
        scheduleId: c.paymentScheduleId,
        installmentNumber: schedule?.installmentNumber ?? null,
        dueDate: schedule?.dueDate ?? null,
        items: [c],
      })
    }
  }
  const arr = Array.from(groups.values())
  arr.sort((a, b) => {
    const aN = a.installmentNumber ?? Number.MAX_SAFE_INTEGER
    const bN = b.installmentNumber ?? Number.MAX_SAFE_INTEGER
    return aN - bN
  })
  for (const g of arr) {
    g.items.sort((a, b) => {
      const aTime = new Date(a.reportedAt ?? a.createdAt).getTime()
      const bTime = new Date(b.reportedAt ?? b.createdAt).getTime()
      return bTime - aTime
    })
  }
  return arr
}

function formatShortDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
  }).format(d)
}

export default function ContributionHistoryScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const me = useMe()
  const trip = useTrip(tripId)
  const contributions = useMyContributions(tripId)
  const activePlan = trip.data ? findActivePurchasePlan(trip.data) : null
  const schedules = useTripSchedules(tripId, activePlan?.id)
  const remove = useDeleteContribution()

  const [pendingCancel, setPendingCancel] = useState<ContributionDto | null>(
    null,
  )
  const [cancelError, setCancelError] = useState<string | null>(null)

  const visibleItems = useMemo(() => {
    if (!contributions.data) return []
    return contributions.data.items.filter(
      (c) => c.status !== 'pending' && c.status !== 'late',
    )
  }, [contributions.data])

  const groups = useMemo(
    () => groupByInstallment(visibleItems, schedules.data?.items ?? []),
    [visibleItems, schedules.data],
  )

  if (trip.isLoading || contributions.isLoading || me.isLoading)
    return <Splash />

  const tripName = trip.data?.name ?? ''

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-2 px-2 py-2">
        <IconButton
          name="arrow-back"
          variant="ghost"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        />
        <View className="flex-1">
          <Text variant="body-em" numberOfLines={1}>
            {t('trips.contributions.history.headerTitle')}
          </Text>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      >
        <View className="gap-1">
          <Text variant="display">
            {t('trips.contributions.history.title')}
          </Text>
          {tripName ? (
            <Text variant="body" tone="secondary">
              {tripName}
            </Text>
          ) : null}
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="history"
            title={t('trips.contributions.history.empty')}
          />
        ) : (
          groups.map((g) => (
            <View key={g.scheduleId} className="gap-2">
              <Text variant="title">
                {g.installmentNumber != null && g.dueDate
                  ? t('trips.contributions.history.installmentHeader', {
                      n: g.installmentNumber,
                      date: formatShortDate(g.dueDate, i18n.language),
                    })
                  : g.installmentNumber != null
                    ? t(
                        'trips.contributions.history.installmentHeaderNoDate',
                        { n: g.installmentNumber },
                      )
                    : ''}
              </Text>
              <View className="rounded-card border-hairline border-muted bg-background px-4">
                {g.items.map((c, idx) => {
                  const canEdit =
                    c.status === 'reported' &&
                    c.reportedByUserId === me.data?.id
                  return (
                    <View key={c.id}>
                      {idx > 0 ? <Divider /> : null}
                      <ContributionHistoryItem
                        contribution={c}
                        canEdit={canEdit}
                        onEdit={() =>
                          router.push(
                            `/trips/${tripId}/contributions/${c.id}/edit`,
                          )
                        }
                        onCancel={() => {
                          setCancelError(null)
                          setPendingCancel(c)
                        }}
                      />
                    </View>
                  )
                })}
              </View>
            </View>
          ))
        )}

        {cancelError ? (
          <View className="rounded-card border-hairline border-primary p-3">
            <Text variant="caption" tone="primary">
              {cancelError}
            </Text>
          </View>
        ) : null}

        {contributions.isError ? (
          <View className="items-center gap-2">
            <Text variant="body" tone="secondary">
              {t('common.error')}
            </Text>
            <Button
              label={t('common.retry')}
              variant="secondary"
              onPress={() => contributions.refetch()}
            />
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        open={pendingCancel != null}
        title={t('trips.contributions.cancel.title')}
        description={
          pendingCancel
            ? t('trips.contributions.cancel.body', {
                amount: formatMxn(pendingCancel.amount),
              })
            : undefined
        }
        confirmLabel={t('trips.contributions.cancel.confirm')}
        cancelLabel={t('common.cancel')}
        destructive
        confirmLoading={remove.isPending}
        onCancel={() => {
          if (remove.isPending) return
          setPendingCancel(null)
        }}
        onConfirm={async () => {
          if (!pendingCancel) return
          setCancelError(null)
          try {
            await remove.mutateAsync(pendingCancel.id)
            setPendingCancel(null)
          } catch (err) {
            setCancelError(parseBackendError(err))
            setPendingCancel(null)
          }
        }}
      />
    </SafeAreaView>
  )
}
