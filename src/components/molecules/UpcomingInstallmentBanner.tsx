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
  isSolo?: boolean
  className?: string
}

export function UpcomingInstallmentBanner({
  upcoming,
  onReport,
  isSolo,
  className,
}: UpcomingInstallmentBannerProps) {
  const { t } = useTranslation()

  if (upcoming.planType === 'viaticos') {
    // Viáticos es wallet libre: sin "vence en X días" ni urgencia. El usuario
    // aporta cuanto/cuando quiera hasta que el organizador libere la caja.
    const confirmed = upcoming.myStatus.confirmed
    const target = upcoming.myStatus.effectiveTarget
    const empty = Number(confirmed) === 0
    const subtitle = empty
      ? t('trips.dashboard.viaticosWallet.empty', {
          target: formatMxn(target),
        })
      : t('trips.dashboard.viaticosWallet.progress', {
          confirmed: formatMxn(confirmed),
          target: formatMxn(target),
        })

    return (
      <Card className={cn('gap-3', className)}>
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 rounded-full bg-primary items-center justify-center">
            <Icon name="savings" size={20} color={colors.background} />
          </View>
          <View className="flex-1 gap-1">
            <Text variant="body-em">
              {t('trips.dashboard.viaticosWallet.title')}
            </Text>
            <Text variant="caption" tone="secondary">
              {subtitle}
            </Text>
          </View>
        </View>
        <Button
          label={t('trips.dashboard.viaticosWallet.cta')}
          variant="primary"
          onPress={onReport}
        />
      </Card>
    )
  }

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
        label={t(
          isSolo
            ? 'trips.dashboard.upcoming.ctaSolo'
            : 'trips.dashboard.upcoming.cta',
        )}
        variant="primary"
        onPress={onReport}
      />
    </Card>
  )
}

