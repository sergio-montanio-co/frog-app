import { useState } from 'react'
import { Share, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  CopyableField,
  Text,
} from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import {
  useResendInvitation,
  type InvitationDto,
  type TripMember,
} from '@/lib/api/queries'
import { resolveMemberName } from '@/lib/trips/helpers'
import { cn } from '@/lib/cn'

export type InvitedMemberRowProps = {
  member: TripMember
  invitation: InvitationDto
  tripId: string
  tripName: string
  className?: string
}

export function InvitedMemberRow({
  member,
  invitation,
  tripId,
  tripName,
  className,
}: InvitedMemberRowProps) {
  const { t } = useTranslation()
  const resend = useResendInvitation(tripId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const baseName = resolveMemberName(member)
  const contact = member.invitedEmail ?? member.invitedPhone ?? ''
  const expired = invitation.isExpired

  async function onShare() {
    await Share.share({
      message: t('trips.invitedMembers.shareTemplate', {
        tripName,
        url: invitation.shareUrl,
      }),
    })
  }

  async function onConfirmResend() {
    setResendError(null)
    try {
      await resend.mutateAsync(invitation.id)
      setConfirmOpen(false)
    } catch (err) {
      setResendError(parseBackendError(err))
    }
  }

  return (
    <View className={cn('gap-3 py-2', className)}>
      <View className="flex-row items-center gap-3">
        <Avatar name={baseName} size={40} className="opacity-60" />
        <View className="flex-1 gap-0.5">
          <Text variant="body-em" numberOfLines={1}>
            {baseName || '—'}
          </Text>
          {contact ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {contact}
            </Text>
          ) : null}
        </View>
        <Badge
          tone="subtle"
          label={
            expired
              ? t('trips.invitedMembers.expired')
              : t('trips.invitedMembers.pending')
          }
        />
      </View>

      <CopyableField
        label={t('trips.invitedMembers.linkLabel')}
        value={invitation.shareUrl}
        copyLabel={t('trips.invitedMembers.copyLink')}
      />

      {resendError ? (
        <View className="rounded-card border-hairline border-primary p-3">
          <Text variant="caption" tone="primary">
            {resendError}
          </Text>
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Button
          label={t('trips.invitedMembers.share')}
          variant="ghost"
          onPress={onShare}
          className="flex-1"
        />
        <Button
          label={
            expired
              ? t('trips.invitedMembers.regenerate')
              : t('trips.invitedMembers.resend')
          }
          variant="secondary"
          onPress={() => setConfirmOpen(true)}
          loading={resend.isPending}
          className="flex-1"
        />
      </View>

      <ConfirmDialog
        open={confirmOpen}
        title={t('trips.invitedMembers.resendConfirm.title')}
        description={t('trips.invitedMembers.resendConfirm.body')}
        confirmLabel={t('trips.invitedMembers.resendConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        confirmLoading={resend.isPending}
        onConfirm={onConfirmResend}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  )
}
