import { useState } from 'react'
import { Modal, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingSkeleton,
  Text,
} from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import {
  useApproveJoinRequest,
  useJoinRequests,
  useMe,
  useRejectJoinRequest,
  useTrip,
  type JoinRequestDto,
} from '@/lib/api/queries'
import { formatRelativeTime } from '@/lib/dates'
import { isOrganizer } from '@/lib/trips/helpers'
import { colors } from '@/theme/colors'

const MAX_REASON_LENGTH = 500

export default function JoinRequestsScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const me = useMe()
  const trip = useTrip(tripId)
  const requests = useJoinRequests(tripId, {
    enabled: Boolean(tripId) && Boolean(me.data) && Boolean(trip.data),
  })
  const approve = useApproveJoinRequest(tripId ?? '')
  const reject = useRejectJoinRequest(tripId ?? '')

  const [actionError, setActionError] = useState<string | null>(null)
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<JoinRequestDto | null>(null)

  if (trip.isLoading || me.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 p-4">
          <LoadingSkeleton
            variant="list"
            lines={3}
            accessibilityLabel={t('states.loading.label')}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!trip.data || !me.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 justify-center p-4">
          <ErrorState
            title={t('states.error.defaultTitle')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.retry')}
            onRetry={() => trip.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!isOrganizer(trip.data, me.data.id)) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header onBack={() => router.back()} title={trip.data.name} />
        <View className="flex-1 justify-center p-4">
          <ErrorState
            title={t('states.error.defaultTitle')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.back')}
            onRetry={() => router.back()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const items = requests.data?.items ?? []

  async function onApprove(request: JoinRequestDto) {
    setActionError(null)
    setBusyRequestId(request.id)
    try {
      await approve.mutateAsync(request.id)
    } catch (err) {
      setActionError(parseBackendError(err) || t('trips.joinRequests.approveError'))
    } finally {
      setBusyRequestId(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header onBack={() => router.back()} title={trip.data.name} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={requests.isRefetching}
            onRefresh={() => requests.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View className="gap-1">
          <Text variant="display">{t('trips.joinRequests.title')}</Text>
          <Text variant="body" tone="secondary">
            {t('trips.joinRequests.subtitle')}
          </Text>
        </View>

        {actionError ? (
          <Card className="border-primary">
            <Text variant="caption" tone="primary">
              {actionError}
            </Text>
          </Card>
        ) : null}

        {requests.isLoading ? (
          <LoadingSkeleton
            variant="list"
            lines={2}
            accessibilityLabel={t('states.loading.label')}
          />
        ) : requests.isError ? (
          <ErrorState
            title={t('trips.joinRequests.errorTitle')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.retry')}
            onRetry={() => requests.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="hourglass-empty"
            title={t('trips.joinRequests.emptyTitle')}
            body={t('trips.joinRequests.emptyBody')}
          />
        ) : (
          items.map((request) => (
            <JoinRequestRow
              key={request.id}
              request={request}
              language={i18n.language}
              busy={busyRequestId === request.id}
              disabled={busyRequestId !== null && busyRequestId !== request.id}
              onApprove={() => onApprove(request)}
              onReject={() => {
                setActionError(null)
                setRejectTarget(request)
              }}
            />
          ))
        )}
      </ScrollView>

      <RejectJoinDialog
        open={rejectTarget !== null}
        request={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (reason) => {
          if (!rejectTarget) return
          setActionError(null)
          setBusyRequestId(rejectTarget.id)
          try {
            await reject.mutateAsync({
              requestId: rejectTarget.id,
              reason: reason || undefined,
            })
            setRejectTarget(null)
          } catch (err) {
            setActionError(
              parseBackendError(err) || t('trips.joinRequests.rejectError'),
            )
          } finally {
            setBusyRequestId(null)
          }
        }}
        loading={reject.isPending}
      />
    </SafeAreaView>
  )
}

function JoinRequestRow({
  request,
  language,
  busy,
  disabled,
  onApprove,
  onReject,
}: {
  request: JoinRequestDto
  language: string
  busy: boolean
  disabled: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const { t } = useTranslation()
  const user = request.user
  const displayName =
    user?.displayName?.trim() ||
    user?.email ||
    t('trips.joinRequests.requesterFallback')
  const requestedOn = t('trips.joinRequests.requestedOn', {
    date: formatRelativeTime(request.createdAt, t, language),
  })

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar uri={user?.avatarUrl ?? undefined} name={displayName} size={40} />
        <View className="flex-1">
          <Text variant="body-em" numberOfLines={1}>
            {displayName}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {requestedOn}
          </Text>
        </View>
      </View>

      {request.message ? (
        <View className="gap-1 rounded-card border-hairline border-muted p-3">
          <Text variant="caption" tone="secondary">
            {t('trips.joinRequests.messageLabel')}
          </Text>
          <Text variant="body">{request.message}</Text>
        </View>
      ) : null}

      <Divider />

      <View className="flex-row gap-2">
        <Button
          label={t('trips.joinRequests.reject')}
          variant="ghost"
          onPress={onReject}
          disabled={disabled || busy}
          className="flex-1"
        />
        <Button
          label={t('trips.joinRequests.approve')}
          variant="primary"
          onPress={onApprove}
          loading={busy}
          disabled={disabled}
          className="flex-1"
        />
      </View>
    </Card>
  )
}

function RejectJoinDialog({
  open,
  request,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean
  request: JoinRequestDto | null
  loading: boolean
  onConfirm: (reason: string) => Promise<void> | void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()
  const tooLong = trimmed.length > MAX_REASON_LENGTH

  function close() {
    setReason('')
    onClose()
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : close}
    >
      <View className="flex-1 items-center justify-center bg-foreground/40 px-6">
        <View className="w-full max-w-md gap-4 rounded-card border-hairline border-muted bg-background p-5">
          <Text variant="title">{t('trips.joinRequests.rejectDialog.title')}</Text>
          <Text variant="body" tone="secondary">
            {t('trips.joinRequests.rejectDialog.body')}
          </Text>

          <View className="gap-2">
            <Input
              label={t('trips.joinRequests.rejectDialog.reasonLabel')}
              value={reason}
              onChangeText={setReason}
              placeholder={t('trips.joinRequests.rejectDialog.reasonPlaceholder')}
              multiline
              numberOfLines={3}
              maxLength={MAX_REASON_LENGTH + 50}
              accessibilityLabel={t('trips.joinRequests.rejectDialog.reasonLabel')}
              error={
                tooLong
                  ? t('trips.joinRequests.rejectDialog.error.tooLong')
                  : undefined
              }
            />
            <Text variant="caption" tone="secondary" className="self-end">
              {t('trips.joinRequests.rejectDialog.counter', {
                count: reason.length,
              })}
            </Text>
          </View>

          <View className="gap-2 pt-2">
            <Button
              label={t('trips.joinRequests.rejectDialog.confirm')}
              variant="primary"
              onPress={() => {
                if (tooLong) return
                onConfirm(trimmed)
              }}
              loading={loading}
              disabled={tooLong || loading || !request}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={close}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

function Header({ onBack, title }: { onBack: () => void; title?: string }) {
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
          {title ?? t('trips.joinRequests.headerTitle')}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  )
}
