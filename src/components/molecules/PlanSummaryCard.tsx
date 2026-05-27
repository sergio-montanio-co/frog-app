import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Card, Divider, Icon, Text } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { formatMxn } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { TripSavingsPlan } from '@/lib/api/queries'

export type PlanSummaryCardProps = {
  plan: TripSavingsPlan
  className?: string
}

function formatDate(iso: string, locale = 'es-MX'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function PlanSummaryCard({ plan, className }: PlanSummaryCardProps) {
  const { t } = useTranslation()
  const frequencyLabel = t(`trips.plan.frequency.${plan.frequency}`)

  return (
    <Card className={cn('gap-3', className)}>
      <View className="flex-row items-center gap-2">
        <Icon name="savings" size={20} color={colors.primary} />
        <Text variant="title">{t('trips.dashboard.planSummary.title')}</Text>
      </View>
      <View className="gap-1">
        <Text variant="body">
          {t('trips.dashboard.planSummary.frequencyLine', {
            frequency: frequencyLabel,
          })}
        </Text>
        <Text variant="body">
          {t('trips.dashboard.planSummary.installmentsLine', {
            amount: formatMxn(plan.installmentAmount),
            count: plan.numberOfInstallments,
          })}
        </Text>
      </View>
      <Divider />
      <View className="gap-1">
        <Text variant="caption" tone="secondary">
          {t('trips.dashboard.planSummary.startsAt', {
            date: formatDate(plan.startDate),
          })}
        </Text>
        <Text variant="caption" tone="secondary">
          {t('trips.dashboard.planSummary.endsAt', {
            date: formatDate(plan.targetDate),
          })}
        </Text>
      </View>
    </Card>
  )
}
