import { useMemo, useState } from 'react'
import { Pressable, Switch, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Icon, Input, Text } from '@/components/atoms'
import { WizardStep } from '@/components/molecules'
import { formatMxn } from '@/lib/money'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'

import {
  CLABE_RE,
  COMMON_BANKS,
} from '@/lib/trips/wizard'

import type { StepProps } from './Step1'

const OTHER_BANK = '__other__'

export type Step5Props = StepProps & {
  submitError?: string | null
}

function formatDate(iso: string | undefined, locale = 'es-MX'): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function Step5({ draft, onChange, submitError }: Step5Props) {
  const { t } = useTranslation()

  const bankInList = useMemo(
    () => COMMON_BANKS.includes(draft.account.bank as (typeof COMMON_BANKS)[number]),
    [draft.account.bank],
  )
  const [bankMode, setBankMode] = useState<'list' | 'other'>(
    draft.account.bank && !bankInList ? 'other' : 'list',
  )

  const clabeError =
    !draft.skipAccount &&
    draft.account.clabe.length > 0 &&
    !CLABE_RE.test(draft.account.clabe)
      ? t('trips.new.step5.errors.clabe')
      : undefined

  return (
    <WizardStep
      title={t('trips.new.step5.title')}
      subtitle={t('trips.new.step5.subtitle')}
    >
      <View className="rounded-card border-hairline border-muted p-4 gap-4">
        <Text variant="title">{t('trips.new.step5.accountSectionTitle')}</Text>

        <Pressable
          onPress={() =>
            onChange({ ...draft, skipAccount: !draft.skipAccount })
          }
          accessibilityRole="checkbox"
          accessibilityLabel={t('trips.new.step5.skipAccount')}
          accessibilityState={{ checked: draft.skipAccount }}
          className="flex-row items-center gap-3"
        >
          <View
            className={cn(
              'h-6 w-6 items-center justify-center rounded-card border-hairline',
              draft.skipAccount
                ? 'bg-primary border-primary'
                : 'bg-background border-muted',
            )}
          >
            {draft.skipAccount ? (
              <Icon name="check" size={16} color={colors.background} />
            ) : null}
          </View>
          <Text variant="body">{t('trips.new.step5.skipAccount')}</Text>
        </Pressable>

        {!draft.skipAccount ? (
          <View className="gap-4">
            <Input
              label={t('trips.new.step5.holderLabel')}
              placeholder={t('trips.new.step5.holderPlaceholder')}
              value={draft.account.holderName}
              onChangeText={(holderName) =>
                onChange({
                  ...draft,
                  account: { ...draft.account, holderName },
                })
              }
              autoCapitalize="words"
              maxLength={100}
            />
            <Input
              label={t('trips.new.step5.clabeLabel')}
              placeholder={t('trips.new.step5.clabePlaceholder')}
              value={draft.account.clabe}
              onChangeText={(raw) =>
                onChange({
                  ...draft,
                  account: {
                    ...draft.account,
                    clabe: raw.replace(/\D/g, '').slice(0, 18),
                  },
                })
              }
              keyboardType="number-pad"
              maxLength={18}
              error={clabeError}
            />

            <View className="gap-2">
              <Text variant="body-em">{t('trips.new.step5.bankLabel')}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {COMMON_BANKS.map((b) => {
                  const active = bankMode === 'list' && draft.account.bank === b
                  return (
                    <Pressable
                      key={b}
                      onPress={() => {
                        setBankMode('list')
                        onChange({
                          ...draft,
                          account: { ...draft.account, bank: b },
                        })
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={b}
                      accessibilityState={{ selected: active }}
                      className={cn(
                        'h-9 rounded-card px-3 items-center justify-center border-hairline',
                        active
                          ? 'bg-primary border-primary'
                          : 'bg-background border-muted',
                      )}
                    >
                      <Text
                        variant="caption"
                        tone={active ? 'background' : 'foreground'}
                      >
                        {b}
                      </Text>
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={() => {
                    setBankMode('other')
                    onChange({
                      ...draft,
                      account: { ...draft.account, bank: '' },
                    })
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('trips.new.step5.bankOther')}
                  accessibilityState={{ selected: bankMode === 'other' }}
                  className={cn(
                    'h-9 rounded-card px-3 items-center justify-center border-hairline',
                    bankMode === 'other'
                      ? 'bg-primary border-primary'
                      : 'bg-background border-muted',
                  )}
                >
                  <Text
                    variant="caption"
                    tone={bankMode === 'other' ? 'background' : 'foreground'}
                  >
                    {t('trips.new.step5.bankOther')}
                  </Text>
                </Pressable>
              </View>
              {bankMode === 'other' ? (
                <Input
                  value={draft.account.bank}
                  onChangeText={(bank) =>
                    onChange({
                      ...draft,
                      account: { ...draft.account, bank },
                    })
                  }
                  placeholder={t('trips.new.step5.bankPlaceholder')}
                  autoCapitalize="words"
                  maxLength={60}
                />
              ) : null}
            </View>

            <Input
              label={t('trips.new.step5.instructionsLabel')}
              placeholder={t('trips.new.step5.instructionsPlaceholder')}
              value={draft.account.instructions ?? ''}
              onChangeText={(instructions) =>
                onChange({
                  ...draft,
                  account: {
                    ...draft.account,
                    instructions: instructions || undefined,
                  },
                })
              }
              multiline
              numberOfLines={3}
              maxLength={500}
              className="h-24 pt-3"
            />
          </View>
        ) : null}
      </View>

      <View className="rounded-card border-hairline border-muted p-4 gap-3">
        <Text variant="title">{t('trips.new.step5.reviewTitle')}</Text>
        <ReviewRow
          label={t('trips.new.step5.summaryTripLabel')}
          value={draft.name}
        />
        <ReviewRow
          label={t('trips.new.step5.summaryDestinationLabel')}
          value={[draft.destination, draft.destinationCity]
            .filter(Boolean)
            .join(' · ')}
        />
        <ReviewRow
          label={t('trips.new.step5.summaryDeadlineLabel')}
          value={formatDate(draft.purchaseDeadline)}
        />
        <ReviewRow
          label={t('trips.new.step5.summaryCostLabel')}
          value={
            draft.estimatedCostPerPerson
              ? formatMxn(draft.estimatedCostPerPerson)
              : ''
          }
        />
        <ReviewRow
          label={t('trips.new.step5.summaryViaticosLabel')}
          value={
            draft.enableViaticos && draft.viaticosTargetPerPerson
              ? formatMxn(draft.viaticosTargetPerPerson)
              : t('trips.new.step5.summaryNoViaticos')
          }
        />
        <ReviewRow
          label={t('trips.new.step5.summaryMembersLabel')}
          value={
            draft.isSolo
              ? t('trips.new.step5.summarySolo')
              : draft.members.length === 1
                ? t('trips.membersCountOne', { count: 1 })
                : t('trips.membersCountMany', {
                    count: draft.members.length,
                  })
          }
        />
        <ReviewRow
          label={t('trips.new.step5.summaryAccountLabel')}
          value={
            draft.skipAccount
              ? t('trips.new.step5.summaryAccountPending')
              : draft.account.bank
                ? `${draft.account.bank} · ${draft.account.holderName}`
                : t('trips.new.step5.summaryAccountPending')
          }
        />
      </View>

      {submitError ? (
        <Text variant="body" tone="primary">
          {submitError}
        </Text>
      ) : null}
    </WizardStep>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text
        variant="body-em"
        className="flex-1 text-right"
        numberOfLines={2}
      >
        {value || '—'}
      </Text>
    </View>
  )
}
