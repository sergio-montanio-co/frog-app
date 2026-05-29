import { useState } from 'react'
import { Pressable, Switch, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Icon,
  MoneyInput,
  Text,
} from '@/components/atoms'
import { CostBreakdownRow, WizardStep } from '@/components/molecules'
import type { CostCategory } from '@/components/molecules'
import { colors } from '@/theme/colors'

import { validateStep } from '@/lib/trips/wizard'

import type { StepProps } from './StepBasics'

function categoryLabels(t: (k: string) => string): Record<CostCategory, string> {
  return {
    flight: t('trips.new.step3.category.flight'),
    lodging: t('trips.new.step3.category.lodging'),
    transport: t('trips.new.step3.category.transport'),
    activity: t('trips.new.step3.category.activity'),
    other: t('trips.new.step3.category.other'),
  }
}

export function StepCost({ draft, onChange }: StepProps) {
  const { t } = useTranslation()
  const [showBreakdown, setShowBreakdown] = useState(
    draft.costBreakdown.length > 0,
  )

  const validation = validateStep(2, draft)
  const issues = validation.success ? {} : validation.issues
  const costErrorCode = issues['estimatedCostPerPerson']
  const costError = draft.estimatedCostPerPerson
    ? costErrorCode === 'cost_too_high'
      ? t('trips.new.step3.errors.costTooHigh')
      : costErrorCode === 'cost_invalid'
        ? t('trips.new.step3.errors.costInvalid')
        : undefined
    : undefined
  const viaticosError =
    draft.enableViaticos && issues['viaticosTargetPerPerson']
      ? t('trips.new.step3.errors.viaticosRequired')
      : undefined

  return (
    <WizardStep
      title={t('trips.new.step3.title')}
      subtitle={t('trips.new.step3.subtitle')}
    >
      <MoneyInput
        label={t('trips.new.step3.costLabel')}
        placeholder={t('trips.new.step3.costPlaceholder')}
        value={draft.estimatedCostPerPerson}
        onChangeText={(v) =>
          onChange({ ...draft, estimatedCostPerPerson: v })
        }
        error={costError}
      />

      <View className="rounded-card border-hairline border-muted">
        <Pressable
          onPress={() => setShowBreakdown((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={t('trips.new.step3.breakdownToggle')}
          accessibilityState={{ expanded: showBreakdown }}
          className="flex-row items-center justify-between p-4"
        >
          <Text variant="body-em">
            {t('trips.new.step3.breakdownToggle')}
          </Text>
          <Icon
            name={showBreakdown ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.secondary}
          />
        </Pressable>
        {showBreakdown ? (
          <View className="border-t-hairline border-muted p-4 gap-3">
            {draft.costBreakdown.map((item, i) => (
              <CostBreakdownRow
                key={i}
                category={item.category}
                amount={item.amount}
                notes={item.notes}
                categoryLabels={categoryLabels(t)}
                amountLabel={t('trips.new.step3.amountLabel')}
                notesPlaceholder={t('trips.new.step3.notesPlaceholder')}
                removeAccessibilityLabel={t('trips.new.step3.removeItem')}
                onChangeCategory={(category) => {
                  const next = [...draft.costBreakdown]
                  next[i] = { ...next[i], category }
                  onChange({ ...draft, costBreakdown: next })
                }}
                onChangeAmount={(amount) => {
                  const next = [...draft.costBreakdown]
                  next[i] = { ...next[i], amount }
                  onChange({ ...draft, costBreakdown: next })
                }}
                onChangeNotes={(notes) => {
                  const next = [...draft.costBreakdown]
                  next[i] = { ...next[i], notes }
                  onChange({ ...draft, costBreakdown: next })
                }}
                onRemove={() => {
                  const next = draft.costBreakdown.filter((_, idx) => idx !== i)
                  onChange({ ...draft, costBreakdown: next })
                }}
              />
            ))}
            <Button
              label={t('trips.new.step3.addItem')}
              variant="secondary"
              onPress={() =>
                onChange({
                  ...draft,
                  costBreakdown: [
                    ...draft.costBreakdown,
                    { category: 'flight', amount: '', notes: undefined },
                  ],
                })
              }
            />
          </View>
        ) : null}
      </View>

      <View className="rounded-card border-hairline border-muted p-4 gap-4">
        <View className="flex-row items-start gap-3">
          <View className="flex-1 gap-1">
            <Text variant="body-em">
              {t('trips.new.step3.viaticosLabel')}
            </Text>
            <Text variant="caption" tone="secondary">
              {t('trips.new.step3.viaticosHelp')}
            </Text>
          </View>
          <Switch
            value={draft.enableViaticos}
            onValueChange={(enableViaticos) =>
              onChange({
                ...draft,
                enableViaticos,
                viaticosTargetPerPerson: enableViaticos
                  ? draft.viaticosTargetPerPerson
                  : undefined,
              })
            }
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={colors.background}
            accessibilityLabel={t('trips.new.step3.viaticosLabel')}
          />
        </View>
        {draft.enableViaticos ? (
          <>
            <MoneyInput
              label={t('trips.new.step3.viaticosAmountLabel')}
              value={draft.viaticosTargetPerPerson ?? ''}
              onChangeText={(v) =>
                onChange({
                  ...draft,
                  viaticosTargetPerPerson: v || undefined,
                })
              }
              error={viaticosError}
            />
            <Text variant="caption" tone="secondary">
              {t('trips.new.step3.viaticosNeedsStartDate')}
            </Text>
          </>
        ) : null}
      </View>
    </WizardStep>
  )
}
