import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Card, Icon, Text } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { formatMxn } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { UpcomingSchedule } from '@/lib/api/queries'

export type UpcomingInstallmentBannerProps = {
  upcoming: UpcomingSchedule
  onReport: () => void
  className?: string
}

export function UpcomingInstallmentBanner({
  upcoming,
  onReport,
  className,
}: UpcomingInstallmentBannerProps) {
  const { t } = useTranslation()
  const days = upcoming.daysUntilDue
  const overdue = days < 0

  const remaining = formatMxn(upcoming.myStatus.remaining)
  const subtitle = overdue
    ? t('trips.dashboard.upcoming.overdue', { count: Math.abs(days) })
    : days === 0
      ? t('trips.deadlineToday')
      : days === 1
        ? t('trips.dashboard.upcoming.daysLeft.one', { count: days })
        : t('trips.dashboard.upcoming.daysLeft.other', { count: days })

  return (
    <Card className={cn('gap-3', className)}>
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 rounded-full bg-primary items-center justify-center">
          <Icon name="payments" size={20} color={colors.background} />
        </View>
        <View className="flex-1 gap-1">
          <Text variant="body-em">
            {t('trips.dashboard.upcoming.title', {
              amount: remaining,
            })}
          </Text>
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        </View>
      </View>
      <Button
        label={t('trips.dashboard.upcoming.cta')}
        variant="primary"
        onPress={onReport}
      />
    </Card>
  )
}

