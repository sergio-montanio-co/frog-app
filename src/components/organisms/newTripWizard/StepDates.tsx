import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { DateField, DateRangeField, Icon, Text } from '@/components/atoms'
import { WizardStep } from '@/components/molecules'
import { colors } from '@/theme/colors'

import {
  MAX_DEADLINE_DAYS,
  MIN_DEADLINE_DAYS,
  validateStep,
} from '@/lib/trips/wizard'

import type { StepProps } from './StepBasics'

export function StepDates({ draft, onChange }: StepProps) {
  const { t } = useTranslation()
  const tripStartRequired = draft.enableViaticos
  const [showOptional, setShowOptional] = useState(
    Boolean(draft.tripStartDate || draft.tripEndDate || tripStartRequired),
  )

  useEffect(() => {
    if (tripStartRequired) setShowOptional(true)
  }, [tripStartRequired])

  const { minDeadline, maxDeadline } = useMemo(() => {
    const now = new Date()
    const min = new Date(now)
    min.setDate(min.getDate() + MIN_DEADLINE_DAYS)
    const max = new Date(now)
    max.setDate(max.getDate() + MAX_DEADLINE_DAYS)
    return { minDeadline: min, maxDeadline: max }
  }, [])

  const validation = validateStep(3, draft)
  const issues = validation.success ? {} : validation.issues
  const deadlineError =
    issues['purchaseDeadline'] === 'deadline_out_of_range'
      ? t('trips.new.step2.errors.deadline')
      : undefined
  const startMissingForViaticos =
    issues['tripStartDate'] === 'trip_start_required_for_viaticos'
  const startError = startMissingForViaticos
    ? t('trips.new.step2.errors.tripStartRequiredForViaticos')
    : issues['tripStartDate'] === 'trip_start_before_deadline'
      ? t('trips.new.step2.errors.startBeforeDeadline')
      : undefined
  const endError =
    issues['tripEndDate'] === 'trip_end_before_start'
      ? t('trips.new.step2.errors.endBeforeStart')
      : undefined

  const minTripStart = draft.purchaseDeadline
    ? new Date(draft.purchaseDeadline)
    : minDeadline

  return (
    <WizardStep
      title={t('trips.new.step2.title')}
      subtitle={t('trips.new.step2.subtitle')}
    >
      <DateField
        label={t('trips.new.step2.deadlineLabel')}
        helperText={t('trips.new.step2.deadlineHelp')}
        placeholder={t('trips.new.step2.deadlinePlaceholder')}
        value={draft.purchaseDeadline || undefined}
        onChange={(iso) =>
          onChange({ ...draft, purchaseDeadline: iso ?? '' })
        }
        minimumDate={minDeadline}
        maximumDate={maxDeadline}
        error={
          draft.purchaseDeadline && deadlineError ? deadlineError : undefined
        }
      />

      {tripStartRequired ? (
        <View className="rounded-card bg-foreground/[0.03] p-3 gap-1">
          <Text variant="body-em" tone="primary">
            {t('trips.new.step2.viaticosNoticeTitle')}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('trips.new.step2.viaticosNoticeBody')}
          </Text>
        </View>
      ) : null}

      {tripStartRequired ? (
        <View className="rounded-card border-hairline border-muted p-4 gap-4">
          <DateRangeField
            label={t('trips.new.step2.tripRangeLabel')}
            startValue={draft.tripStartDate}
            endValue={draft.tripEndDate}
            onChange={({ start, end }) =>
              onChange({
                ...draft,
                tripStartDate: start ?? '',
                tripEndDate: end ?? '',
              })
            }
            minimumDate={minTripStart}
            error={startError ?? endError}
          />
        </View>
      ) : (
        <View className="rounded-card border-hairline border-muted">
          <Pressable
            onPress={() => setShowOptional((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={t('trips.new.step2.realDatesLabel')}
            accessibilityState={{ expanded: showOptional }}
            className="flex-row items-center justify-between p-4"
          >
            <Text variant="body-em">
              {t('trips.new.step2.realDatesLabel')}
            </Text>
            <Icon
              name={showOptional ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.secondary}
            />
          </Pressable>
          {showOptional ? (
            <View className="border-t-hairline border-muted p-4">
              <DateRangeField
                label={t('trips.new.step2.tripRangeLabel')}
                startValue={draft.tripStartDate}
                endValue={draft.tripEndDate}
                onChange={({ start, end }) =>
                  onChange({
                    ...draft,
                    tripStartDate: start ?? '',
                    tripEndDate: end ?? '',
                  })
                }
                minimumDate={minTripStart}
                error={startError ?? endError}
              />
            </View>
          ) : null}
        </View>
      )}
    </WizardStep>
  )
}
