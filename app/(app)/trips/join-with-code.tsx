import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  EmptyState,
  Icon,
  IconButton,
  Input,
  LoadingSkeleton,
  Text,
  type IconName,
} from '@/components/atoms'
import { ApiError } from '@/lib/api/client'
import { parseBackendError } from '@/lib/api/errors'
import {
  normalizeInviteCode,
  useRequestJoin,
  useTripByCode,
  type JoinRequestPreviewStatus,
  type TripPreviewByCodeTripDto,
} from '@/lib/api/queries'
import { formatMxn } from '@/lib/money'
import { colors } from '@/theme/colors'

const MIN_CODE_LENGTH = 6
const MAX_MESSAGE_LENGTH = 500

export default function JoinWithCodeScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [rawCode, setRawCode] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [message, setMessage] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)

  const normalized = normalizeInviteCode(submitted)
  const preview = useTripByCode(submitted, {
    enabled: normalized.length >= MIN_CODE_LENGTH,
  })
  const requestJoin = useRequestJoin()

  const inputCodeLength = normalizeInviteCode(rawCode).length
  const canSubmitCode = inputCodeLength >= MIN_CODE_LENGTH
  const lookupError = preview.error
    ? lookupErrorMessage(preview.error, t)
    : null
  const messageTooLong = message.trim().length > MAX_MESSAGE_LENGTH

  function handleLookup() {
    if (!canSubmitCode) return
    setRequestError(null)
    setRequestSent(false)
    setSubmitted(rawCode)
  }

  function handleReset() {
    setSubmitted('')
    setRequestError(null)
    setRequestSent(false)
    setMessage('')
  }

  async function handleRequestJoin() {
    if (!preview.data) return
    setRequestError(null)
    try {
      await requestJoin.mutateAsync({
        code: submitted,
        message: message.trim() || undefined,
      })
      setRequestSent(true)
    } catch (err) {
      setRequestError(parseBackendError(err) || t('trips.joinWithCode.errors.requestGeneric'))
    }
  }

  function handleGoToTrip(tripId: string) {
    router.replace({
      pathname: '/(app)/trips/[id]',
      params: { id: tripId },
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header onBack={() => router.back()} title={t('trips.joinWithCode.headerTitle')} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text variant="display">{t('trips.joinWithCode.title')}</Text>
            <Text variant="body" tone="secondary">
              {t('trips.joinWithCode.subtitle')}
            </Text>
          </View>

          <View className="gap-3">
            <Input
              label={t('trips.joinWithCode.codeLabel')}
              placeholder={t('trips.joinWithCode.codePlaceholder')}
              value={rawCode}
              onChangeText={(value) => {
                setRawCode(value)
                if (submitted) {
                  setSubmitted('')
                  setRequestError(null)
                  setRequestSent(false)
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              returnKeyType="search"
              onSubmitEditing={handleLookup}
              helperText={t('trips.joinWithCode.codeHelper')}
              error={
                lookupError ??
                (inputCodeLength > 0 && !canSubmitCode
                  ? t('trips.joinWithCode.errors.tooShort')
                  : undefined)
              }
              leadingIcon="qr-code"
            />

            {!preview.data ? (
              <Button
                label={t('trips.joinWithCode.checkCta')}
                onPress={handleLookup}
                loading={preview.isFetching && Boolean(submitted)}
                disabled={!canSubmitCode}
              />
            ) : null}
          </View>

          {submitted && preview.isLoading ? (
            <LoadingSkeleton
              variant="card"
              accessibilityLabel={t('states.loading.label')}
            />
          ) : null}

          {preview.data ? (
            requestSent ? (
              <RequestSentCard
                onGoToTrip={() => handleGoToTrip(preview.data!.trip.id)}
                canGoToTrip={preview.data.requestStatus === 'already_member'}
              />
            ) : (
              <TripPreviewCard
                trip={preview.data.trip}
                status={preview.data.requestStatus}
                language={i18n.language}
                message={message}
                onMessageChange={setMessage}
                onRequest={handleRequestJoin}
                onGoToTrip={() => handleGoToTrip(preview.data!.trip.id)}
                onReset={handleReset}
                requesting={requestJoin.isPending}
                requestError={requestError}
                messageTooLong={messageTooLong}
              />
            )
          ) : null}
        </ScrollView>
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

function TripPreviewCard({
  trip,
  status,
  language,
  message,
  onMessageChange,
  onRequest,
  onGoToTrip,
  onReset,
  requesting,
  requestError,
  messageTooLong,
}: {
  trip: TripPreviewByCodeTripDto
  status: JoinRequestPreviewStatus
  language: string
  message: string
  onMessageChange: (value: string) => void
  onRequest: () => void
  onGoToTrip: () => void
  onReset: () => void
  requesting: boolean
  requestError: string | null
  messageTooLong: boolean
}) {
  const { t } = useTranslation()
  const deadline = useMemo(() => formatDeadline(trip.purchaseDeadline, language), [
    trip.purchaseDeadline,
    language,
  ])
  const membersKey =
    trip.membersCount === 1
      ? 'trips.joinWithCode.preview.members.one'
      : 'trips.joinWithCode.preview.members.other'

  const canRequest = status === 'can_request'

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text variant="title">{trip.name}</Text>
        <View className="flex-row items-center gap-1.5">
          <Icon name="flight-takeoff" size={16} color={colors.secondary} />
          <Text variant="body" tone="secondary" numberOfLines={1}>
            {trip.destination}
          </Text>
        </View>
      </View>

      <View className="gap-1.5">
        <PreviewMeta
          icon="person"
          label={t('trips.joinWithCode.preview.organizer', {
            name:
              trip.organizerDisplayName ??
              t('trips.joinWithCode.preview.organizerUnknown'),
          })}
        />
        <PreviewMeta
          icon="groups"
          label={t(membersKey, { count: trip.membersCount })}
        />
        {deadline ? (
          <PreviewMeta
            icon="event"
            label={t('trips.joinWithCode.preview.deadline', { date: deadline })}
          />
        ) : null}
        <PreviewMeta
          icon="payments"
          label={formatMxn(trip.estimatedCostPerPerson, {
            currency: trip.currency,
          })}
        />
      </View>

      {status !== 'can_request' ? (
        <View className="rounded-card border-hairline border-muted p-3">
          <Text variant="caption" tone="secondary">
            {t(statusKey(status))}
          </Text>
        </View>
      ) : null}


      {canRequest ? (
        <View className="gap-2">
          <Input
            label={t('trips.joinWithCode.messageLabel')}
            placeholder={t('trips.joinWithCode.messagePlaceholder')}
            value={message}
            onChangeText={onMessageChange}
            multiline
            maxLength={MAX_MESSAGE_LENGTH + 50}
            helperText={t('trips.joinWithCode.messageCounter', {
              count: message.trim().length,
            })}
            error={
              messageTooLong
                ? t('trips.joinWithCode.errors.messageTooLong')
                : undefined
            }
          />
        </View>
      ) : null}

      {requestError ? (
        <View className="rounded-card border-hairline border-primary p-3">
          <Text variant="caption" tone="primary">
            {requestError}
          </Text>
        </View>
      ) : null}

      <View className="gap-2">
        {canRequest ? (
          <Button
            label={t('trips.joinWithCode.requestJoin')}
            onPress={onRequest}
            loading={requesting}
            disabled={messageTooLong}
          />
        ) : null}
        {status === 'already_member' ? (
          <Button
            label={t('trips.joinWithCode.goToTrip')}
            onPress={onGoToTrip}
          />
        ) : null}
        <Button
          label={t('common.back')}
          variant="ghost"
          onPress={onReset}
        />
      </View>
    </Card>
  )
}

function RequestSentCard({
  onGoToTrip,
  canGoToTrip,
}: {
  onGoToTrip: () => void
  canGoToTrip: boolean
}) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="hourglass-empty"
      title={t('trips.joinWithCode.requestSuccessTitle')}
      body={t('trips.joinWithCode.requestSuccessBody')}
      cta={
        canGoToTrip
          ? {
              label: t('trips.joinWithCode.goToTrip'),
              onPress: onGoToTrip,
            }
          : undefined
      }
    />
  )
}

function PreviewMeta({
  icon,
  label,
}: {
  icon: IconName
  label: string
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={16} color={colors.secondary} />
      <Text variant="caption" tone="secondary" className="flex-1">
        {label}
      </Text>
    </View>
  )
}

function statusKey(
  status: Exclude<JoinRequestPreviewStatus, 'can_request'>,
): string {
  switch (status) {
    case 'already_member':
      return 'trips.joinWithCode.status.alreadyMember'
    case 'pending':
      return 'trips.joinWithCode.status.pending'
    case 'organizer':
      return 'trips.joinWithCode.status.organizer'
    case 'solo':
      return 'trips.joinWithCode.status.solo'
  }
}

function formatDeadline(iso: string, language: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function lookupErrorMessage(
  err: unknown,
  t: (key: string) => string,
): string {
  if (err instanceof ApiError && err.status === 404) {
    return t('trips.joinWithCode.errors.notFound')
  }
  const parsed = parseBackendError(err)
  if (parsed && parsed !== 'Algo salió mal. Intenta de nuevo.') return parsed
  return t('trips.joinWithCode.errors.generic')
}
