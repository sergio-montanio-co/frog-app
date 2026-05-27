import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import * as Clipboard from 'expo-clipboard'
import { z } from 'zod'

import {
  Button,
  Card,
  Icon,
  IconButton,
  MoneyInput,
  Splash,
  Text,
} from '@/components/atoms'
import { BankAccountInfo } from '@/components/molecules'
import { parseBackendError } from '@/lib/api/errors'
import {
  useCreateContribution,
  useTrip,
  useUpcomingInstallment,
} from '@/lib/api/queries'
import {
  findActivePurchasePlan,
  getResponsibleAccount,
} from '@/lib/trips/helpers'
import { flattenZodErrors } from '@/lib/forms'
import { formatMxn } from '@/lib/money'
import { colors } from '@/theme/colors'

type Draft = {
  amount: string
  reportedNotes: string
}

type FieldErrors = Partial<Record<keyof Draft, string>>

function buildSchema(t: (k: string) => string) {
  return z.object({
    amount: z
      .string()
      .refine((v) => Number(v) > 0, t('trips.contributions.new.error.amountZero'))
      .refine(
        (v) => Number(v) < 10_000_000,
        t('trips.contributions.new.error.amountMax'),
      ),
    reportedNotes: z
      .string()
      .max(500, t('trips.contributions.new.error.notesTooLong'))
      .optional(),
  })
}

function formatDueDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export default function ReportContributionScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const trip = useTrip(tripId)
  const upcoming = useUpcomingInstallment(tripId)
  const create = useCreateContribution(tripId ?? '')

  const activePlan = trip.data ? findActivePurchasePlan(trip.data) : null
  const account = trip.data ? getResponsibleAccount(trip.data) : null

  const remaining = upcoming.data?.myStatus.remaining ?? '0.00'
  const target = upcoming.data?.myStatus.effectiveTarget ?? '0.00'

  const [draft, setDraft] = useState<Draft>({
    amount: '',
    reportedNotes: '',
  })
  const [initialized, setInitialized] = useState(false)
  const [touched, setTouched] = useState<Set<keyof Draft>>(new Set())
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (upcoming.data && !initialized) {
    setDraft((prev) => ({ ...prev, amount: remaining }))
    setInitialized(true)
  }

  const schema = useMemo(() => buildSchema(t), [t])
  const result = schema.safeParse(draft)
  const errors: FieldErrors = result.success
    ? {}
    : flattenZodErrors(result.error)
  const isValid = result.success

  function touch(field: keyof Draft) {
    setTouched((prev) => {
      if (prev.has(field)) return prev
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  function visibleError(field: keyof Draft): string | undefined {
    return touched.has(field) ? errors[field] : undefined
  }

  async function submit() {
    setTouched(new Set(['amount', 'reportedNotes']))
    if (!isValid || !upcoming.data) return
    setSubmitError(null)
    try {
      await create.mutateAsync({
        paymentScheduleId: upcoming.data.scheduleId,
        amount: Number(draft.amount).toFixed(2),
        reportedNotes: draft.reportedNotes.trim()
          ? draft.reportedNotes.trim()
          : undefined,
      })
      router.back()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  async function copyAll() {
    if (!account || !trip.data) return
    const text = t('trips.contributions.new.account.copyTemplate', {
      tripName: trip.data.name,
      holder: account.holderName,
      bank: account.bank,
      clabe: account.clabe,
      amount: formatMxn(draft.amount || remaining),
    })
    await Clipboard.setStringAsync(text)
  }

  if (trip.isLoading || upcoming.isLoading) return <Splash />

  if (trip.isError || !trip.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header
          title={t('trips.contributions.new.headerTitle')}
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="title">{t('common.error')}</Text>
          <Button
            label={t('common.retry')}
            variant="secondary"
            onPress={() => trip.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const planLocked =
    activePlan != null &&
    activePlan.status !== 'active' &&
    activePlan.status !== 'paused'

  if (!upcoming.data || !activePlan || planLocked) {
    const message = planLocked
      ? t('trips.contributions.new.planLocked')
      : t('trips.contributions.new.noUpcoming')
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header
          title={t('trips.contributions.new.headerTitle')}
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Icon name="info-outline" size={32} color={colors.secondary} />
          <Text variant="body" tone="secondary" className="text-center">
            {message}
          </Text>
          <Button
            label={t('common.back')}
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const days = upcoming.data.daysUntilDue
  const dueLabel =
    days < 0
      ? t('trips.contributions.new.overdueDays', {
          count: Math.abs(days),
        })
      : days === 0
        ? t('trips.contributions.new.dueToday')
        : t('trips.contributions.new.dueOn', {
            date: formatDueDate(upcoming.data.dueDate, i18n.language),
          })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Header
          title={t('trips.contributions.new.headerTitle')}
          onBack={() => router.back()}
        />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-1">
            <Text variant="display">{t('trips.contributions.new.title')}</Text>
            <Text variant="body" tone="secondary">
              {trip.data.name}
            </Text>
          </View>

          <Card className="gap-2">
            <View className="flex-row items-center gap-2">
              <Icon name="payments" size={20} color={colors.primary} />
              <Text variant="body-em">
                {t('trips.contributions.new.installmentLabel', {
                  n: upcoming.data.installmentNumber,
                })}
              </Text>
            </View>
            <Text variant="caption" tone="secondary">
              {dueLabel}
            </Text>
            <Text variant="body" tone="secondary">
              {t('trips.contributions.new.remainingHint', {
                remaining: formatMxn(remaining),
                target: formatMxn(target),
              })}
            </Text>
          </Card>

          <MoneyInput
            label={t('trips.contributions.new.amountLabel')}
            value={draft.amount}
            onChangeText={(amount) => {
              setDraft((prev) => ({ ...prev, amount }))
              touch('amount')
            }}
            helperText={t('trips.contributions.new.amountHelper')}
            error={visibleError('amount')}
          />

          <View className="gap-2">
            <Text variant="body-em">
              {t('trips.contributions.new.account.title')}
            </Text>
            <BankAccountInfo account={account} />
            {account ? (
              <Pressable
                onPress={copyAll}
                accessibilityRole="button"
                accessibilityLabel={t('trips.contributions.new.account.copyAll')}
                className="self-start flex-row items-center gap-2 px-2 py-2"
              >
                <Icon name="content-copy" size={16} color={colors.primary} />
                <Text variant="body-em" tone="primary">
                  {t('trips.contributions.new.account.copyAll')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View className="gap-2">
            <Text variant="body-em">
              {t('trips.contributions.new.notesLabel')}
            </Text>
            <TextInput
              value={draft.reportedNotes}
              onChangeText={(reportedNotes) => {
                setDraft((prev) => ({ ...prev, reportedNotes }))
                touch('reportedNotes')
              }}
              placeholder={t('trips.contributions.new.notesPlaceholder')}
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
              accessibilityLabel={t('trips.contributions.new.notesLabel')}
              className="min-h-[96px] rounded-card border-hairline border-muted bg-background p-3 text-base font-sans text-foreground"
              textAlignVertical="top"
            />
            <Text variant="caption" tone="secondary" className="self-end">
              {t('trips.contributions.new.notesCount', {
                count: draft.reportedNotes.length,
              })}
            </Text>
            {visibleError('reportedNotes') ? (
              <Text variant="caption" tone="primary">
                {visibleError('reportedNotes')}
              </Text>
            ) : null}
          </View>

          <Text variant="caption" tone="secondary">
            {t('trips.contributions.new.disclaimer')}
          </Text>

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
            label={t('trips.contributions.new.submit')}
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

function Header({ title, onBack }: { title: string; onBack: () => void }) {
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
          {title}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  )
}
