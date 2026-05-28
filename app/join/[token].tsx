import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { useTranslation } from 'react-i18next'

import {
  Button,
  EmptyState,
  ErrorState,
  Splash,
  Text,
} from '@/components/atoms'
import { InvitationPreviewCard } from '@/components/molecules'
import { ApiError } from '@/lib/api/client'
import { parseBackendError } from '@/lib/api/errors'
import {
  useAcceptInvitation,
  useInvitationPreview,
} from '@/lib/api/queries'
import {
  clearPendingInvitation,
  savePendingInvitation,
} from '@/lib/invitations/pending'

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404
}

function isAlreadyMember(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false
  if (err.status !== 409) return false
  const body = err.body as { message?: string } | null
  return (
    typeof body?.message === 'string' &&
    body.message.toLowerCase().includes('parte')
  )
}

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const preview = useInvitationPreview(token)
  const accept = useAcceptInvitation()
  const [acceptError, setAcceptError] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn) {
      clearPendingInvitation().catch(() => undefined)
    }
  }, [isSignedIn])

  if (!isLoaded || preview.isLoading) return <Splash />

  if (preview.error) {
    if (isNotFound(preview.error)) {
      return (
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 justify-center p-4">
            <EmptyState
              icon="link-off"
              title={t('invitations.join.notFound.title')}
              body={t('invitations.join.notFound.body')}
              cta={{
                label: t('common.back'),
                onPress: () => router.replace('/'),
              }}
            />
          </View>
        </SafeAreaView>
      )
    }
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center p-4">
          <ErrorState
            title={t('invitations.join.error.title')}
            body={t('states.error.defaultBody')}
            retryLabel={t('common.retry')}
            onRetry={() => preview.refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!preview.data) return null

  const { trip, invitation, invitedName } = preview.data
  const state: 'ready' | 'expired' | 'accepted' = invitation.isAccepted
    ? 'accepted'
    : invitation.isExpired
      ? 'expired'
      : 'ready'

  async function onAccept() {
    if (!token) return
    setAcceptError(null)
    try {
      const acceptedTrip = await accept.mutateAsync(token)
      router.replace({
        pathname: '/(app)/trips/[id]',
        params: { id: acceptedTrip.id },
      })
    } catch (err) {
      if (isAlreadyMember(err)) {
        router.replace({
          pathname: '/(app)/trips/[id]',
          params: { id: trip.id },
        })
        return
      }
      setAcceptError(parseBackendError(err))
    }
  }

  async function onContinueToAccept() {
    if (!token) return
    await savePendingInvitation(token)
    router.push('/(auth)/sign-in')
  }

  async function onGoToSignUp() {
    if (!token) return
    await savePendingInvitation(token)
    router.push('/(auth)/sign-up')
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="display">{t('invitations.join.title')}</Text>

        <InvitationPreviewCard
          trip={trip}
          invitedName={invitedName}
          state={state}
        />

        {state === 'accepted' ? (
          <Text variant="caption" tone="secondary">
            {t('invitations.join.alreadyAcceptedByOther')}
          </Text>
        ) : null}

        {state === 'expired' ? (
          <Text variant="caption" tone="secondary">
            {t('invitations.join.expiredHint')}
          </Text>
        ) : null}

        {state === 'ready' && isSignedIn ? (
          <View className="gap-3">
            {acceptError ? (
              <View className="rounded-card border-hairline border-primary p-3">
                <Text variant="caption" tone="primary">
                  {acceptError}
                </Text>
              </View>
            ) : null}
            <Button
              label={t('invitations.join.accept')}
              onPress={onAccept}
              loading={accept.isPending}
            />
          </View>
        ) : null}

        {state === 'ready' && !isSignedIn ? (
          <View className="gap-3">
            <Button
              label={t('invitations.join.continueToAccept')}
              onPress={onContinueToAccept}
            />
            <View className="flex-row items-center justify-center gap-2">
              <Text tone="secondary">{t('invitations.join.noAccount')}</Text>
              <Link href="/(auth)/sign-up" onPress={onGoToSignUp}>
                <Text tone="primary" variant="body-em">
                  {t('invitations.join.goToSignUp')}
                </Text>
              </Link>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
