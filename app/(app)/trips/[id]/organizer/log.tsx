import { useEffect, useMemo, useState } from 'react'
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
  Avatar,
  Button,
  Card,
  Divider,
  Icon,
  IconButton,
  Input,
  MoneyInput,
  Splash,
  Text,
} from '@/components/atoms'
import { MemberPickerSheet } from '@/components/molecules'
import { parseBackendError } from '@/lib/api/errors'
import {
  useCreateContribution,
  useTrip,
  useTripSchedules,
  type PaymentSchedule,
  type TripMember,
} from '@/lib/api/queries'
import {
  findActivePurchasePlan,
  resolveMemberName,
} from '@/lib/trips/helpers'
import { flattenZodErrors } from '@/lib/forms'
import { formatMxn } from '@/lib/money'
import { colors } from '@/theme/colors'

type Draft = {
  amount: string
  notes: string
}

type FieldErrors = Partial<Record<keyof Draft, string>>

function buildSchema(t: (k: string) => string) {
  return z.object({
    amount: z
      .string()
      .refine(
        (v) => Number(v) > 0,
        t('trips.organizer.log.error.amountZero'),
      )
      .refine(
        (v) => Number(v) < 10_000_000,
        t('trips.organizer.log.error.amountMax'),
      ),
    notes: z
      .string()
      .max(500, t('trips.organizer.log.error.notesTooLong')),
  })
}

function formatShortDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
  }).format(d)
}

function getMemberRemainingForSchedule(
  schedule: PaymentSchedule,
  memberId: string,
): { remaining: string; isPaid: boolean } | null {
  const my = schedule.derivedStatus.perMember.find(
    (p) => p.memberId === memberId,
  )
  if (!my) return null
  return { remaining: my.remaining, isPaid: my.state === 'paid' }
}

function firstUnpaidForMember(
  schedules: PaymentSchedule[],
  memberId: string,
): PaymentSchedule | null {
  for (const s of schedules) {
    const my = s.derivedStatus.perMember.find((p) => p.memberId === memberId)
    if (my && my.state !== 'paid') return s
  }
  return null
}

export default function LogOnBehalfScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const trip = useTrip(tripId)
  const activePlan = trip.data ? findActivePurchasePlan(trip.data) : null
  const schedules = useTripSchedules(tripId, activePlan?.id)
  const create = useCreateContribution(tripId ?? '')

  const [selectedMember, setSelectedMember] = useState<TripMember | null>(null)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    amount: '',
    notes: '',
  })
  const [touched, setTouched] = useState<Set<keyof Draft>>(new Set())
  const [submitError, setSubmitError] = useState<string | null>(null)

  const eligibleMembers = useMemo(
    () => (trip.data?.members ?? []).filter((m) => m.status === 'active'),
    [trip.data],
  )

  const scheduleItems = schedules.data?.items ?? []

  useEffect(() => {
    if (!selectedMember || scheduleItems.length === 0) return
    if (
      selectedScheduleId &&
      scheduleItems.some((s) => s.id === selectedScheduleId)
    ) {
      return
    }
    const first = firstUnpaidForMember(scheduleItems, selectedMember.id)
    if (first) setSelectedScheduleId(first.id)
  }, [selectedMember, scheduleItems, selectedScheduleId])

  useEffect(() => {
    if (!selectedMember || !selectedScheduleId) return
    const schedule = scheduleItems.find((s) => s.id === selectedScheduleId)
    if (!schedule) return
    const info = getMemberRemainingForSchedule(schedule, selectedMember.id)
    if (!info) return
    setDraft((prev) => ({ ...prev, amount: info.remaining }))
  }, [selectedMember, selectedScheduleId, scheduleItems])

  useEffect(() => {
    if (!selectedMember) return
    setDraft((prev) =>
      prev.notes ? prev : { ...prev, notes: t('trips.organizer.log.notesDefault') },
    )
  }, [selectedMember, t])

  const schema = useMemo(() => buildSchema(t), [t])
  const parsed = schema.safeParse(draft)
  const errors: FieldErrors = parsed.success
    ? {}
    : flattenZodErrors(parsed.error)
  const canSubmit =
    parsed.success &&
    selectedMember !== null &&
    selectedScheduleId !== null

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

  async function onSubmit() {
    setTouched(new Set(['amount', 'notes']))
    if (!canSubmit || !selectedMember || !selectedScheduleId) return
    setSubmitError(null)
    try {
      await create.mutateAsync({
        paymentScheduleId: selectedScheduleId,
        tripMemberId: selectedMember.id,
        amount: Number(draft.amount).toFixed(2),
        reportedNotes: draft.notes.trim() ? draft.notes.trim() : undefined,
        onBehalf: true,
      })
      router.back()
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  if (trip.isLoading || schedules.isLoading) return <Splash />

  if (!trip.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ModalHeader onClose={() => router.back()} />
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="title">{t('common.error')}</Text>
          <Button
            label={t('common.back')}
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const planLocked =
    !activePlan ||
    (activePlan.status !== 'active' && activePlan.status !== 'paused')

  if (planLocked || eligibleMembers.length === 0) {
    const message = planLocked
      ? t('trips.organizer.log.planLocked')
      : t('trips.organizer.log.noMembers')
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ModalHeader onClose={() => router.back()} />
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ModalHeader onClose={() => router.back()} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-1">
            <Text variant="display">{t('trips.organizer.log.title')}</Text>
            <Text variant="body" tone="secondary">
              {trip.data.name}
            </Text>
          </View>

          <View className="gap-2">
            <Text variant="body-em">
              {t('trips.organizer.log.memberLabel')}
            </Text>
            <Pressable
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('trips.organizer.log.memberLabel')}
              className="flex-row items-center gap-3 rounded-card border-hairline border-muted bg-background px-3 py-3"
            >
              {selectedMember ? (
                <>
                  <Avatar
                    uri={selectedMember.user?.avatarUrl}
                    name={resolveMemberName(selectedMember)}
                    size={32}
                  />
                  <Text variant="body-em" className="flex-1" numberOfLines={1}>
                    {resolveMemberName(selectedMember) || '—'}
                  </Text>
                </>
              ) : (
                <Text variant="body" tone="secondary" className="flex-1">
                  {t('trips.organizer.log.memberPlaceholder')}
                </Text>
              )}
              <Icon
                name="expand-more"
                size={20}
                color={colors.secondary}
              />
            </Pressable>
          </View>

          <View className="gap-2">
            <Text variant="body-em">
              {t('trips.organizer.log.installmentLabel')}
            </Text>
            {!selectedMember ? (
              <Text variant="caption" tone="secondary">
                {t('trips.organizer.log.selectMemberHelper')}
              </Text>
            ) : (
              <Card className="gap-0 p-0">
                {scheduleItems.map((s, idx) => {
                  const info = getMemberRemainingForSchedule(
                    s,
                    selectedMember.id,
                  )
                  if (!info) return null
                  const isSelected = s.id === selectedScheduleId
                  const isDisabled = info.isPaid
                  const label = info.isPaid
                    ? t('trips.organizer.log.installmentRowPaid', {
                        n: s.installmentNumber,
                        date: formatShortDate(s.dueDate, i18n.language),
                      })
                    : t('trips.organizer.log.installmentRow', {
                        n: s.installmentNumber,
                        date: formatShortDate(s.dueDate, i18n.language),
                        remaining: formatMxn(info.remaining),
                      })
                  return (
                    <View key={s.id}>
                      {idx > 0 ? <Divider /> : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: isSelected,
                          disabled: isDisabled,
                        }}
                        accessibilityLabel={label}
                        onPress={() =>
                          isDisabled
                            ? undefined
                            : setSelectedScheduleId(s.id)
                        }
                        className={`flex-row items-center gap-3 px-4 py-3 ${
                          isDisabled ? 'opacity-50' : ''
                        }`}
                      >
                        <Icon
                          name={
                            info.isPaid
                              ? 'check-circle'
                              : isSelected
                                ? 'radio-button-checked'
                                : 'radio-button-unchecked'
                          }
                          size={20}
                          color={
                            isSelected || info.isPaid
                              ? colors.primary
                              : colors.secondary
                          }
                        />
                        <Text
                          variant={isSelected ? 'body-em' : 'body'}
                          tone={isSelected ? 'primary' : 'foreground'}
                          className="flex-1"
                        >
                          {label}
                        </Text>
                      </Pressable>
                    </View>
                  )
                })}
              </Card>
            )}
          </View>

          <MoneyInput
            label={t('trips.organizer.log.amountLabel')}
            value={draft.amount}
            onChangeText={(amount) => {
              setDraft((prev) => ({ ...prev, amount }))
              touch('amount')
            }}
            error={visibleError('amount')}
            editable={selectedMember !== null && selectedScheduleId !== null}
          />

          <Input
            label={t('trips.organizer.log.notesLabel')}
            value={draft.notes}
            onChangeText={(notes) => {
              setDraft((prev) => ({ ...prev, notes }))
              touch('notes')
            }}
            multiline
            numberOfLines={3}
            maxLength={500}
            accessibilityLabel={t('trips.organizer.log.notesLabel')}
            error={visibleError('notes')}
          />

          <Text variant="caption" tone="secondary">
            {t('trips.organizer.log.helper')}
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
            label={t('trips.organizer.log.submit')}
            onPress={onSubmit}
            size="lg"
            disabled={!canSubmit || create.isPending}
            loading={create.isPending}
          />
        </View>
      </KeyboardAvoidingView>

      <MemberPickerSheet
        open={pickerOpen}
        members={eligibleMembers}
        selectedMemberId={selectedMember?.id ?? null}
        onSelect={(m) => {
          setSelectedMember(m)
          setSelectedScheduleId(null)
          setDraft((prev) => ({ ...prev, amount: '' }))
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  )
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <View className="flex-row items-center justify-between gap-2 px-2 py-2">
      <View className="w-11" />
      <View className="flex-1 items-center">
        <Text variant="body-em" numberOfLines={1}>
          {t('trips.organizer.log.headerTitle')}
        </Text>
      </View>
      <IconButton
        name="close"
        variant="ghost"
        accessibilityLabel={t('common.close')}
        onPress={onClose}
      />
    </View>
  )
}
