import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  Badge,
  Card,
  Divider,
  Icon,
  Text,
  type IconName,
} from '@/components/atoms'
import { cn } from '@/lib/cn'
import { formatMxn } from '@/lib/money'
import { colors } from '@/theme/colors'
import type { InvitationPreviewTripDto } from '@/lib/api/queries'

export type InvitationPreviewCardProps = {
  trip: InvitationPreviewTripDto
  invitedName: string | null
  state: 'ready' | 'expired' | 'accepted'
  className?: string
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function InvitationPreviewCard({
  trip,
  invitedName,
  state,
  className,
}: InvitationPreviewCardProps) {
  const { t, i18n } = useTranslation()
  const muted = state !== 'ready'

  return (
    <Card className={cn('gap-4', muted && 'opacity-60', className)}>
      <View className="gap-1">
        <Text variant="caption" tone="secondary">
          {trip.organizerDisplayName
            ? t('invitations.preview.invitedBy', {
                name: trip.organizerDisplayName,
              })
            : t('invitations.preview.invitedByGeneric')}
        </Text>
        <Text variant="display" numberOfLines={2}>
          {trip.name}
        </Text>
        <View className="flex-row items-center gap-1.5 pt-1">
          <Icon name="flight-takeoff" size={16} color={colors.secondary} />
          <Text variant="body" tone="secondary" numberOfLines={1}>
            {trip.destination}
          </Text>
        </View>
      </View>

      <Divider />

      <View className="gap-2">
        <PreviewRow
          icon="payments"
          label={t('invitations.preview.costPerPerson')}
          value={formatMxn(trip.estimatedCostPerPerson)}
        />
        <PreviewRow
          icon="event"
          label={t('invitations.preview.deadline')}
          value={formatDate(trip.purchaseDeadline, i18n.language)}
        />
        <PreviewRow
          icon="groups"
          label={t('invitations.preview.members')}
          value={String(trip.membersCount)}
        />
      </View>

      {invitedName ? (
        <Text variant="caption" tone="secondary">
          {t('invitations.preview.invitedAs', { name: invitedName })}
        </Text>
      ) : null}

      {state !== 'ready' ? (
        <Badge
          tone="subtle"
          label={
            state === 'accepted'
              ? t('invitations.preview.acceptedBadge')
              : t('invitations.preview.expiredBadge')
          }
        />
      ) : null}
    </Card>
  )
}

function PreviewRow({
  icon,
  label,
  value,
}: {
  icon: IconName
  label: string
  value: string
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Icon name={icon} size={20} color={colors.secondary} />
      <Text variant="body" tone="secondary" className="flex-1">
        {label}
      </Text>
      <Text variant="body-em">{value}</Text>
    </View>
  )
}
