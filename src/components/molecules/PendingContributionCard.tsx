import { useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  Avatar,
  Button,
  Card,
  Divider,
  Text,
} from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import {
  useConfirmContribution,
  type ContributionDto,
  type PaymentSchedule,
  type TripMember,
} from '@/lib/api/queries'
import { resolveMemberName } from '@/lib/trips/helpers'
import { formatMxn } from '@/lib/money'
import { cn } from '@/lib/cn'

export type PendingContributionCardProps = {
  contribution: ContributionDto
  member: TripMember | null
  schedule: PaymentSchedule | null
  tripId: string
  isSelf?: boolean
  onRejectPress: (contributionId: string) => void
  className?: string
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function PendingContributionCard({
  contribution,
  member,
  schedule,
  tripId,
  isSelf,
  onRejectPress,
  className,
}: PendingContributionCardProps) {
  const { t, i18n } = useTranslation()
  const confirm = useConfirmContribution(tripId)
  const [actionError, setActionError] = useState<string | null>(null)

  const baseName = member ? resolveMemberName(member) : ''
  const memberLabel = isSelf
    ? t('trips.organizer.pending.selfPrefix', { name: baseName || '—' })
    : baseName || t('trips.organizer.pending.installment', { n: '' }).trim()

  const reportedLabel = contribution.reportedAt
    ? t('trips.organizer.pending.reportedOn', {
        date: formatDate(contribution.reportedAt, i18n.language),
      })
    : null

  async function onApprove() {
    setActionError(null)
    try {
      await confirm.mutateAsync(contribution.id)
    } catch (err) {
      setActionError(parseBackendError(err))
    }
  }

  return (
    <Card className={cn('gap-3', className)}>
      <View className="flex-row items-center gap-3">
        <Avatar
          uri={member?.user?.avatarUrl}
          name={baseName}
          size={40}
        />
        <View className="flex-1 gap-0.5">
          <Text variant="body-em" numberOfLines={1}>
            {memberLabel}
          </Text>
          <Text variant="caption" tone="secondary">
            {schedule
              ? t('trips.organizer.pending.installment', {
                  n: schedule.installmentNumber,
                })
              : ''}
            {schedule && reportedLabel ? ' · ' : ''}
            {reportedLabel}
          </Text>
        </View>
        <Text variant="title">{formatMxn(contribution.amount)}</Text>
      </View>

      {contribution.reportedNotes ? (
        <View className="rounded-card border-hairline border-muted bg-muted/10 p-3">
          <Text variant="caption" tone="secondary">
            {t('trips.organizer.pending.notesLabel')}
          </Text>
          <Text variant="body">{contribution.reportedNotes}</Text>
        </View>
      ) : null}

      {actionError ? (
        <View className="rounded-card border-hairline border-primary p-3">
          <Text variant="caption" tone="primary">
            {actionError}
          </Text>
        </View>
      ) : null}

      <Divider />

      <View className="flex-row gap-2">
        <Button
          label={t('trips.organizer.pending.reject')}
          variant="ghost"
          onPress={() => onRejectPress(contribution.id)}
          disabled={confirm.isPending}
          className="flex-1"
        />
        <Button
          label={t('trips.organizer.pending.approve')}
          variant="primary"
          onPress={onApprove}
          loading={confirm.isPending}
          disabled={confirm.isPending}
          className="flex-1"
        />
      </View>
    </Card>
  )
}
