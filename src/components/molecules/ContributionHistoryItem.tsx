import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Badge, IconButton, Text } from '@/components/atoms'
import type { BadgeTone } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { formatMxn } from '@/lib/money'
import type { ContributionDto, ContributionStatus } from '@/lib/api/queries'

export type ContributionHistoryItemProps = {
  contribution: ContributionDto
  canEdit?: boolean
  onEdit?: () => void
  onCancel?: () => void
  className?: string
}

type StatusMeta = {
  i18nKey: string
  tone: BadgeTone
}

const STATUS_META: Record<ContributionStatus, StatusMeta> = {
  reported: {
    i18nKey: 'trips.contributions.status.reported',
    tone: 'subtle',
  },
  confirmed: {
    i18nKey: 'trips.contributions.status.confirmed',
    tone: 'primary',
  },
  failed: {
    i18nKey: 'trips.contributions.status.failed',
    tone: 'subtle',
  },
  refunded: {
    i18nKey: 'trips.contributions.status.refunded',
    tone: 'subtle',
  },
  pending: {
    i18nKey: 'trips.contributions.status.reported',
    tone: 'subtle',
  },
  late: {
    i18nKey: 'trips.contributions.status.reported',
    tone: 'subtle',
  },
}

function formatReportedAt(iso: string | null, locale: string): string {
  const fallbackIso = iso ?? null
  if (!fallbackIso) return ''
  const d = new Date(fallbackIso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function ContributionHistoryItem({
  contribution,
  canEdit,
  onEdit,
  onCancel,
  className,
}: ContributionHistoryItemProps) {
  const { t, i18n } = useTranslation()
  const meta = STATUS_META[contribution.status]
  const dateLabel = formatReportedAt(
    contribution.reportedAt ?? contribution.createdAt,
    i18n.language,
  )
  const showActions = canEdit && contribution.status === 'reported'

  return (
    <View className={cn('flex-row items-start gap-3 py-3', className)}>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text variant="body-em">{formatMxn(contribution.amount)}</Text>
          <Badge label={t(meta.i18nKey)} tone={meta.tone} />
        </View>
        {dateLabel ? (
          <Text variant="caption" tone="secondary">
            {t('trips.contributions.history.reportedOn', { date: dateLabel })}
          </Text>
        ) : null}
        {contribution.rejectionReason ? (
          <Text variant="caption" tone="secondary">
            {contribution.rejectionReason}
          </Text>
        ) : null}
        {contribution.reportedNotes ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {contribution.reportedNotes}
          </Text>
        ) : null}
      </View>
      {showActions ? (
        <View className="flex-row gap-1">
          <IconButton
            name="edit"
            variant="ghost"
            accessibilityLabel={t('common.edit')}
            onPress={onEdit}
          />
          <IconButton
            name="delete-outline"
            variant="ghost"
            accessibilityLabel={t('common.delete')}
            onPress={onCancel}
          />
        </View>
      ) : null}
    </View>
  )
}
