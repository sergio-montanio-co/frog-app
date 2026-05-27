import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  Button,
  DateField,
  Icon,
  IconButton,
  Input,
  Splash,
  Text,
} from '@/components/atoms'
import { cn } from '@/lib/cn'
import { parseBackendError } from '@/lib/api/errors'
import {
  useMe,
  useTrip,
  useUpdateTrip,
  type UpdateTripBody,
} from '@/lib/api/queries'
import { getResponsibleAccount, isOrganizer } from '@/lib/trips/helpers'
import { CLABE_RE, COMMON_BANKS } from '@/lib/trips/wizard'

type AccountDraft = {
  holderName: string
  clabe: string
  bank: string
  instructions: string
}

type EditDraft = {
  name: string
  description: string
  destination: string
  destinationCountry: string
  destinationCity: string
  tripStartDate: string
  tripEndDate: string
  account: AccountDraft
}

const editSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000),
    destination: z.string().trim().min(1).max(200),
    destinationCountry: z
      .string()
      .trim()
      .max(2)
      .refine((v) => v.length === 0 || v.length === 2, 'country_length'),
    destinationCity: z.string().trim().max(120),
    tripStartDate: z.string().trim(),
    tripEndDate: z.string().trim(),
    account: z.object({
      holderName: z.string().trim().max(100),
      clabe: z.string().trim(),
      bank: z.string().trim().max(60),
      instructions: z.string().trim().max(500),
    }),
  })
  .refine(
    ({ tripStartDate, tripEndDate }) =>
      !tripStartDate ||
      !tripEndDate ||
      new Date(tripEndDate).getTime() > new Date(tripStartDate).getTime(),
    { message: 'end_before_start', path: ['tripEndDate'] },
  )
  .refine(
    ({ account }) => {
      const partial =
        account.holderName ||
        account.clabe ||
        account.bank ||
        account.instructions
      if (!partial) return true
      return (
        account.holderName.length >= 1 &&
        account.bank.length >= 1 &&
        CLABE_RE.test(account.clabe)
      )
    },
    { message: 'account_incomplete', path: ['account'] },
  )

function buildInitialDraft(account: AccountDraft | null, trip: {
  name: string
  description: string | null
  destination: string
  destinationCountry: string | null
  destinationCity: string | null
  tripStartDate: string | null
  tripEndDate: string | null
}): EditDraft {
  return {
    name: trip.name,
    description: trip.description ?? '',
    destination: trip.destination,
    destinationCountry: trip.destinationCountry ?? '',
    destinationCity: trip.destinationCity ?? '',
    tripStartDate: trip.tripStartDate ?? '',
    tripEndDate: trip.tripEndDate ?? '',
    account: account ?? {
      holderName: '',
      clabe: '',
      bank: '',
      instructions: '',
    },
  }
}

function nullableString(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

function accountToPayload(
  account: AccountDraft,
): UpdateTripBody['responsibleAccountInfo'] | undefined {
  const holderName = account.holderName.trim()
  const clabe = account.clabe.trim()
  const bank = account.bank.trim()
  const instructions = account.instructions.trim()
  if (!holderName && !clabe && !bank && !instructions) return undefined
  if (!holderName || !clabe || !bank) return undefined
  return {
    holderName,
    clabe,
    bank,
    instructions: instructions || undefined,
  }
}

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const me = useMe()
  const trip = useTrip(id)
  const update = useUpdateTrip()

  const initialDraft = useMemo<EditDraft | null>(() => {
    if (!trip.data) return null
    const account = getResponsibleAccount(trip.data)
    return buildInitialDraft(
      account
        ? {
            holderName: account.holderName,
            clabe: account.clabe,
            bank: account.bank,
            instructions: account.instructions ?? '',
          }
        : null,
      trip.data,
    )
  }, [trip.data])

  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [touched, setTouched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const currentDraft = draft ?? initialDraft

  if (trip.isLoading || me.isLoading || !currentDraft) {
    return <Splash />
  }

  if (trip.isError || me.isError || !trip.data || !me.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="title">{t('trips.errorTitle')}</Text>
          <Button
            label={t('common.retry')}
            variant="secondary"
            onPress={() => trip.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!isOrganizer(trip.data, me.data.id)) {
    router.back()
    return null
  }

  const parsed = editSchema.safeParse(currentDraft)
  const issueMap: Record<string, string> = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!issueMap[path]) issueMap[path] = issue.message
    }
  }

  function updateField<K extends keyof EditDraft>(key: K, value: EditDraft[K]) {
    setDraft({ ...(currentDraft as EditDraft), [key]: value })
    setSubmitError(null)
  }

  function updateAccount<K extends keyof AccountDraft>(
    key: K,
    value: AccountDraft[K],
  ) {
    setDraft({
      ...(currentDraft as EditDraft),
      account: { ...(currentDraft as EditDraft).account, [key]: value },
    })
    setSubmitError(null)
  }

  const endBeforeStartError =
    touched && issueMap['tripEndDate'] === 'end_before_start'
      ? t('trips.new.step2.errors.endBeforeStart')
      : undefined
  const clabeError =
    currentDraft.account.clabe.length > 0 &&
    !CLABE_RE.test(currentDraft.account.clabe)
      ? t('trips.new.step5.errors.clabe')
      : undefined

  async function onSubmit() {
    setTouched(true)
    if (!parsed.success) return
    if (!currentDraft || !trip.data) return

    const original = trip.data
    const draftNow = currentDraft
    const accountPayload = accountToPayload(draftNow.account)
    const originalAccount = getResponsibleAccount(original)

    const next: UpdateTripBody = {}

    if (draftNow.name.trim() !== original.name) {
      next.name = draftNow.name.trim()
    }
    const descNext = nullableString(draftNow.description)
    if ((descNext ?? null) !== (original.description ?? null)) {
      if (descNext !== undefined) next.description = descNext
    }
    if (draftNow.destination.trim() !== original.destination) {
      next.destination = draftNow.destination.trim()
    }
    const countryNext = nullableString(draftNow.destinationCountry)
    if ((countryNext ?? null) !== (original.destinationCountry ?? null)) {
      if (countryNext !== undefined) next.destinationCountry = countryNext
    }
    const cityNext = nullableString(draftNow.destinationCity)
    if ((cityNext ?? null) !== (original.destinationCity ?? null)) {
      if (cityNext !== undefined) next.destinationCity = cityNext
    }
    const tripStartNext = nullableString(draftNow.tripStartDate)
    if ((tripStartNext ?? null) !== (original.tripStartDate ?? null)) {
      if (tripStartNext !== undefined) next.tripStartDate = tripStartNext
    }
    const tripEndNext = nullableString(draftNow.tripEndDate)
    if ((tripEndNext ?? null) !== (original.tripEndDate ?? null)) {
      if (tripEndNext !== undefined) next.tripEndDate = tripEndNext
    }

    const accountDiffers =
      JSON.stringify(accountPayload ?? null) !==
      JSON.stringify(
        originalAccount
          ? {
              holderName: originalAccount.holderName,
              clabe: originalAccount.clabe,
              bank: originalAccount.bank,
              instructions: originalAccount.instructions || undefined,
            }
          : null,
      )
    if (accountDiffers && accountPayload) {
      next.responsibleAccountInfo = accountPayload
    }

    if (Object.keys(next).length === 0) {
      router.back()
      return
    }

    setSubmitError(null)
    try {
      await update.mutateAsync({ id: original.id, body: next })
      router.back()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  const disableSubmit = update.isPending

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header onBack={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Section title={t('trips.edit.section.basics')}>
            <Input
              label={t('trips.new.step1.nameLabel')}
              value={currentDraft.name}
              onChangeText={(v) => updateField('name', v)}
              maxLength={100}
              autoCapitalize="words"
            />
            <Input
              label={t('trips.new.step1.descriptionLabel')}
              value={currentDraft.description}
              onChangeText={(v) => updateField('description', v)}
              maxLength={2000}
              multiline
              numberOfLines={3}
              className="h-24 pt-3"
            />
          </Section>

          <Section title={t('trips.edit.section.destination')}>
            <Input
              label={t('trips.new.step1.destinationLabel')}
              value={currentDraft.destination}
              onChangeText={(v) => updateField('destination', v)}
              maxLength={200}
            />
            <Input
              label={t('trips.new.step1.cityLabel')}
              value={currentDraft.destinationCity}
              onChangeText={(v) => updateField('destinationCity', v)}
              maxLength={120}
            />
            <Input
              label={t('trips.new.step1.countryLabel')}
              value={currentDraft.destinationCountry}
              onChangeText={(v) =>
                updateField('destinationCountry', v.toUpperCase().slice(0, 2))
              }
              maxLength={2}
              autoCapitalize="characters"
            />
          </Section>

          <Section title={t('trips.edit.section.dates')}>
            <DateField
              label={t('trips.new.step2.tripStartLabel')}
              value={currentDraft.tripStartDate || undefined}
              onChange={(iso) => updateField('tripStartDate', iso ?? '')}
            />
            <DateField
              label={t('trips.new.step2.tripEndLabel')}
              value={currentDraft.tripEndDate || undefined}
              onChange={(iso) => updateField('tripEndDate', iso ?? '')}
              error={endBeforeStartError}
            />
          </Section>

          <Section title={t('trips.edit.section.account')}>
            <Input
              label={t('trips.new.step5.holderLabel')}
              placeholder={t('trips.new.step5.holderPlaceholder')}
              value={currentDraft.account.holderName}
              onChangeText={(v) => updateAccount('holderName', v)}
              maxLength={100}
              autoCapitalize="words"
            />
            <Input
              label={t('trips.new.step5.clabeLabel')}
              placeholder={t('trips.new.step5.clabePlaceholder')}
              value={currentDraft.account.clabe}
              onChangeText={(raw) =>
                updateAccount('clabe', raw.replace(/\D/g, '').slice(0, 18))
              }
              keyboardType="number-pad"
              maxLength={18}
              error={clabeError}
            />

            <View className="gap-2">
              <Text variant="body-em">
                {t('trips.new.step5.bankLabel')}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {COMMON_BANKS.map((b) => {
                  const active = currentDraft.account.bank === b
                  return (
                    <BankPill
                      key={b}
                      label={b}
                      active={active}
                      onPress={() => updateAccount('bank', b)}
                    />
                  )
                })}
              </View>
              <Input
                value={currentDraft.account.bank}
                onChangeText={(v) => updateAccount('bank', v)}
                placeholder={t('trips.new.step5.bankPlaceholder')}
                autoCapitalize="words"
                maxLength={60}
              />
            </View>

            <Input
              label={t('trips.new.step5.instructionsLabel')}
              placeholder={t('trips.new.step5.instructionsPlaceholder')}
              value={currentDraft.account.instructions}
              onChangeText={(v) => updateAccount('instructions', v)}
              multiline
              numberOfLines={3}
              maxLength={500}
              className="h-24 pt-3"
            />
          </Section>

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
            label={t('trips.edit.submit')}
            onPress={onSubmit}
            disabled={disableSubmit}
            loading={update.isPending}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <View className="flex-row items-center gap-2 px-2 py-2">
      <IconButton
        name="close"
        variant="ghost"
        accessibilityLabel={t('common.close')}
        onPress={onBack}
      />
      <View className="flex-1">
        <Text variant="body-em" numberOfLines={1}>
          {t('trips.edit.title')}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View className="gap-3">
      <Text variant="title">{title}</Text>
      <View className="gap-3 rounded-card border-hairline border-muted p-4">
        {children}
      </View>
    </View>
  )
}

function BankPill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className={cn(
        'h-9 rounded-card px-3 items-center justify-center border-hairline',
        active ? 'bg-primary border-primary' : 'bg-background border-muted',
      )}
    >
      <Text
        variant="caption"
        tone={active ? 'background' : 'foreground'}
      >
        {label}
      </Text>
    </Pressable>
  )
}
