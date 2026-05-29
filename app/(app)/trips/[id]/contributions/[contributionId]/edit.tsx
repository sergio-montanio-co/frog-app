import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  Button,
  IconButton,
  Input,
  MoneyInput,
  Splash,
  Text,
} from '@/components/atoms'
import { ApiError } from '@/lib/api/client'
import { parseBackendError } from '@/lib/api/errors'
import {
  useMyContributions,
  useUpdateContribution,
} from '@/lib/api/queries'
import { flattenZodErrors } from '@/lib/forms'

type Draft = {
  amount: string
  reportedNotes: string
}

type FieldErrors = Partial<Record<keyof Draft, string>>

function buildSchema(t: (k: string) => string) {
  return z.object({
    amount: z
      .string()
      .refine(
        (v) => Number(v) > 0,
        t('trips.contributions.new.error.amountZero'),
      )
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

export default function EditContributionScreen() {
  const { id: tripId, contributionId } = useLocalSearchParams<{
    id: string
    contributionId: string
  }>()
  const router = useRouter()
  const { t } = useTranslation()

  const myContributions = useMyContributions(tripId)
  const update = useUpdateContribution()

  const contribution = myContributions.data?.items.find(
    (c) => c.id === contributionId,
  )

  const [draft, setDraft] = useState<Draft>({
    amount: '',
    reportedNotes: '',
  })
  const [initialized, setInitialized] = useState(false)
  const [touched, setTouched] = useState<Set<keyof Draft>>(new Set())
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (contribution && !initialized) {
      setDraft({
        amount: contribution.amount,
        reportedNotes: contribution.reportedNotes ?? '',
      })
      setInitialized(true)
    }
  }, [contribution, initialized])

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
    if (!isValid || !contributionId) return
    setSubmitError(null)
    try {
      await update.mutateAsync({
        id: contributionId,
        body: {
          amount: Number(draft.amount).toFixed(2),
          reportedNotes: draft.reportedNotes.trim()
            ? draft.reportedNotes.trim()
            : undefined,
        },
      })
      router.back()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError(t('trips.contributions.edit.notEditable'))
        return
      }
      setSubmitError(parseBackendError(err))
    }
  }

  if (myContributions.isLoading) return <Splash />

  if (!contribution) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header
          title={t('trips.contributions.edit.headerTitle')}
          onClose={() => router.back()}
        />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="body" tone="secondary" className="text-center">
            {t('common.error')}
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

  if (contribution.status !== 'reported') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header
          title={t('trips.contributions.edit.headerTitle')}
          onClose={() => router.back()}
        />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="body" tone="secondary" className="text-center">
            {t('trips.contributions.edit.notEditable')}
          </Text>
          <Button
            label={t('common.back')}
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Header
          title={t('trips.contributions.edit.headerTitle')}
          onClose={() => router.back()}
        />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="display">
            {t('trips.contributions.edit.title')}
          </Text>

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
            <Input
              label={t('trips.contributions.new.notesLabel')}
              value={draft.reportedNotes}
              onChangeText={(reportedNotes) => {
                setDraft((prev) => ({ ...prev, reportedNotes }))
                touch('reportedNotes')
              }}
              placeholder={t('trips.contributions.new.notesPlaceholder')}
              multiline
              numberOfLines={3}
              maxLength={500}
              accessibilityLabel={t('trips.contributions.new.notesLabel')}
              error={visibleError('reportedNotes')}
            />
            <Text variant="caption" tone="secondary" className="self-end">
              {t('trips.contributions.new.notesCount', {
                count: draft.reportedNotes.length,
              })}
            </Text>
          </View>

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
            label={t('trips.contributions.edit.submit')}
            onPress={submit}
            size="lg"
            disabled={!isValid || update.isPending}
            loading={update.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <View className="flex-row items-center justify-between px-2 py-2">
      <IconButton
        name="close"
        variant="ghost"
        accessibilityLabel={t('common.cancel')}
        onPress={onClose}
      />
      <Text variant="body-em" numberOfLines={1}>
        {title}
      </Text>
      <View className="w-11" />
    </View>
  )
}
