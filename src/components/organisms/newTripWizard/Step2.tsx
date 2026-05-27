import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { DateField, Icon, Text } from '@/components/atoms'
import { WizardStep } from '@/components/molecules'
import { colors } from '@/theme/colors'

import {
  MAX_DEADLINE_DAYS,
  MIN_DEADLINE_DAYS,
  validateStep,
} from '@/lib/trips/wizard'

import type { StepProps } from './Step1'

export function Step2({ draft, onChange }: StepProps) {
  const { t } = useTranslation()
  const [showOptional, setShowOptional] = useState(
    Boolean(draft.tripStartDate || draft.tripEndDate),
  )

  const { minDeadline, maxDeadline } = useMemo(() => {
    const now = new Date()
    const min = new Date(now)
    min.setDate(min.getDate() + MIN_DEADLINE_DAYS)
    const max = new Date(now)
    max.setDate(max.getDate() + MAX_DEADLINE_DAYS)
    return { minDeadline: min, maxDeadline: max }
  }, [])

  const validation = validateStep(2, draft)
  const issues = validation.success ? {} : validation.issues
  const deadlineError =
    issues['purchaseDeadline'] === 'deadline_out_of_range'
      ? t('trips.new.step2.errors.deadline')
      : undefined
  const startError =
    issues['tripStartDate'] === 'trip_start_before_deadline'
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
          <View className="border-t-hairline border-muted p-4 gap-4">
            <DateField
              label={t('trips.new.step2.tripStartLabel')}
              value={draft.tripStartDate}
              onChange={(iso) => onChange({ ...draft, tripStartDate: iso })}
              minimumDate={minTripStart}
              error={startError}
            />
            <DateField
              label={t('trips.new.step2.tripEndLabel')}
              value={draft.tripEndDate}
              onChange={(iso) => onChange({ ...draft, tripEndDate: iso })}
              minimumDate={
                draft.tripStartDate ? new Date(draft.tripStartDate) : minTripStart
              }
              error={endError}
            />
          </View>
        ) : null}
      </View>
    </WizardStep>
  )
}
