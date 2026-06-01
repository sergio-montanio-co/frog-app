import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Icon, Input, Text } from '@/components/atoms'
import { WizardStep } from '@/components/molecules'
import { formatMxn } from '@/lib/money'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'
import { clabeState, resolveBankFromClabe } from '@/lib/banks'

import type { StepProps } from './StepBasics'

export type StepReviewProps = StepProps & {
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

export function StepReview({ draft, onChange, submitError }: StepReviewProps) {
  const { t } = useTranslation()

  const cs = clabeState(draft.account.clabe)

  const clabeError =
    !draft.skipAccount && cs.kind === 'invalid'
      ? t('trips.new.step5.errors.clabeInvalid')
      : undefined

  const clabeHelper =
    !draft.skipAccount && cs.kind === 'partial'
      ? 18 - cs.digits === 1
        ? t('trips.new.step5.clabeHelperPartialOne', { count: 1 })
        : t('trips.new.step5.clabeHelperPartialMany', {
            count: 18 - cs.digits,
          })
      : undefined

  const reviewBank = resolveBankFromClabe(draft.account.clabe) ?? draft.account.bank

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
              leadingIcon="person-outline"
            />
            <Input
              label={t('trips.new.step5.clabeLabel')}
              placeholder={t('trips.new.step5.clabePlaceholder')}
              value={draft.account.clabe}
              onChangeText={(raw) => {
                const digits = raw.replace(/\D/g, '').slice(0, 18)
                onChange({
                  ...draft,
                  account: { ...draft.account, clabe: digits, bank: '' },
                })
              }}
              keyboardType="number-pad"
              maxLength={18}
              error={clabeError}
              helperText={clabeHelper}
              leadingIcon="account-balance"
            />

            {cs.kind === 'resolved' ? (
              <View className="flex-row items-center gap-3 rounded-card bg-foreground/[0.03] p-3">
                <Icon name="check-circle" size={20} color={colors.primary} />
                <View className="flex-1">
                  <Text variant="caption" tone="secondary">
                    {t('trips.new.step5.bankLabel')}
                  </Text>
                  <Text variant="body-em">{cs.bank}</Text>
                </View>
              </View>
            ) : null}

            {cs.kind === 'unknownBank' ? (
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon name="info-outline" size={16} color={colors.secondary} />
                  <Text variant="caption" tone="secondary" className="flex-1">
                    {t('trips.new.step5.bankNotRecognized')}
                  </Text>
                </View>
                <Input
                  label={t('trips.new.step5.bankNameLabel')}
                  placeholder={t('trips.new.step5.bankNamePlaceholder')}
                  value={draft.account.bank}
                  onChangeText={(bank) =>
                    onChange({
                      ...draft,
                      account: {
                        ...draft.account,
                        bank: bank.slice(0, 60),
                      },
                    })
                  }
                  autoCapitalize="words"
                  maxLength={60}
                  leadingIcon="account-balance"
                />
              </View>
            ) : null}

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
              : reviewBank && draft.account.holderName
                ? `${reviewBank} · ${draft.account.holderName}`
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
