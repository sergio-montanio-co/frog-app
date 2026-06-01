import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Button,
  DateField,
  IconButton,
  MoneyInput,
  SegmentedControl,
  Text,
} from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import {
  useCreateSavingsPlan,
  useTrip,
  type CreateSavingsPlanBody,
} from '@/lib/api/queries'
import { todayIsoStart } from '@/lib/trips/helpers'

type Frequency = CreateSavingsPlanBody['frequency']

const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
}

type DraftPlan = {
  frequency: Frequency
  startDate: string
  targetDate: string
  targetAmountPerPerson: string
}

type FieldErrors = Partial<Record<keyof DraftPlan, string>>

function normalizeAmount(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

function isFutureOrToday(iso: string): boolean {
  if (!iso) return false
  const start = new Date(iso)
  const today = new Date(todayIsoStart())
  return start.getTime() >= today.getTime()
}

function validate(draft: DraftPlan, t: (k: string) => string): FieldErrors {
  const errors: FieldErrors = {}
  if (!isFutureOrToday(draft.startDate)) {
    errors.startDate = t('trips.plan.error.startPast')
  }
  if (
    !draft.targetDate ||
    new Date(draft.targetDate).getTime() <= new Date(draft.startDate).getTime()
  ) {
    errors.targetDate = t('trips.plan.error.targetBeforeStart')
  }
  const amount = Number(draft.targetAmountPerPerson)
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.targetAmountPerPerson = t('trips.plan.error.zeroAmount')
  }
  return errors
}

function estimateInstallments(draft: DraftPlan): number {
  if (!draft.startDate || !draft.targetDate) return 0
  const start = new Date(draft.startDate).getTime()
  const end = new Date(draft.targetDate).getTime()
  if (end <= start) return 0
  const days = Math.ceil((end - start) / 86_400_000)
  const step = FREQUENCY_DAYS[draft.frequency]
  return Math.max(1, Math.ceil(days / step))
}

export default function CreateSavingsPlanScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const trip = useTrip(tripId)
  const create = useCreateSavingsPlan(tripId ?? '')

  const today = todayIsoStart()
  const purchaseDeadline = trip.data?.purchaseDeadline ?? today
  const estimatedCost = trip.data?.estimatedCostPerPerson ?? ''

  const [draft, setDraft] = useState<DraftPlan>(() => ({
    frequency: 'biweekly',
    // Usamos la hora actual real (no 00:00 local) para que el backend reciba
    // un timestamp >= now en su huso. `todayIsoStart()` normalizado al inicio
    // del día local cruza al día anterior en UTC tras las 18:00 MX y dispara
    // un falso "fecha en el pasado".
    startDate: new Date().toISOString(),
    targetDate: purchaseDeadline,
    targetAmountPerPerson: estimatedCost,
  }))
  const [submitError, setSubmitError] = useState<string | null>(null)

  const errors = useMemo(() => validate(draft, t), [draft, t])
  const isValid = Object.keys(errors).length === 0
  const installments = estimateInstallments(draft)

  const purchaseDeadlineDate = useMemo(
    () => (trip.data ? new Date(trip.data.purchaseDeadline) : undefined),
    [trip.data],
  )
  const startDateMin = useMemo(() => new Date(todayIsoStart()), [])

  function patch(p: Partial<DraftPlan>) {
    setDraft((prev) => {
      const next = { ...prev, ...p }
      if (
        p.startDate &&
        next.targetDate &&
        new Date(next.targetDate).getTime() <=
          new Date(p.startDate).getTime()
      ) {
        next.targetDate = p.startDate
      }
      return next
    })
  }

  async function submit() {
    if (!isValid || !tripId) return
    setSubmitError(null)
    try {
      await create.mutateAsync({
        type: 'trip_purchase',
        frequency: draft.frequency,
        startDate: draft.startDate,
        targetDate: draft.targetDate,
        targetAmountPerPerson: normalizeAmount(draft.targetAmountPerPerson),
        currency: 'MXN',
      })
      router.back()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-2 py-2">
          <IconButton
            name="close"
            variant="ghost"
            accessibilityLabel={t('trips.plan.cancel')}
            onPress={() => router.back()}
          />
          <Text variant="body-em" numberOfLines={1}>
            {t('trips.plan.headerTitle')}
          </Text>
          <View className="w-11" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text variant="display">{t('trips.plan.title')}</Text>
            <Text variant="body" tone="secondary">
              {t('trips.plan.subtitle')}
            </Text>
          </View>

          <View className="gap-2">
            <Text variant="body-em">{t('trips.plan.frequency.label')}</Text>
            <SegmentedControl<Frequency>
              options={[
                {
                  value: 'weekly',
                  label: t('trips.plan.frequency.weekly'),
                },
                {
                  value: 'biweekly',
                  label: t('trips.plan.frequency.biweekly'),
                },
                {
                  value: 'monthly',
                  label: t('trips.plan.frequency.monthly'),
                },
              ]}
              value={draft.frequency}
              onChange={(frequency) => patch({ frequency })}
              accessibilityLabel={t('trips.plan.frequency.label')}
            />
          </View>

          <DateField
            label={t('trips.plan.startDate.label')}
            value={draft.startDate}
            onChange={(iso) => iso && patch({ startDate: iso })}
            minimumDate={startDateMin}
            maximumDate={purchaseDeadlineDate}
            helperText={t('trips.plan.startDate.helper')}
            error={errors.startDate}
          />

          <DateField
            label={t('trips.plan.targetDate.label')}
            value={draft.targetDate}
            onChange={(iso) => iso && patch({ targetDate: iso })}
            minimumDate={
              draft.startDate ? new Date(draft.startDate) : startDateMin
            }
            maximumDate={purchaseDeadlineDate}
            helperText={t('trips.plan.targetDate.helper')}
            error={errors.targetDate}
          />

          <MoneyInput
            label={t('trips.plan.amount.label')}
            value={draft.targetAmountPerPerson}
            onChangeText={(targetAmountPerPerson) =>
              patch({ targetAmountPerPerson })
            }
            error={errors.targetAmountPerPerson}
            helperText={
              installments > 0
                ? t('trips.plan.amount.helper', { count: installments })
                : undefined
            }
          />

          {submitError ? (
            <View className="rounded-card border-hairline border-primary p-3">
              <Text variant="caption" tone="primary">
                {submitError}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t-hairline border-muted bg-background p-4">
          <Button
            label={t('trips.plan.submit')}
            onPress={submit}
            size="lg"
            disabled={!isValid || create.isPending}
            loading={create.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
