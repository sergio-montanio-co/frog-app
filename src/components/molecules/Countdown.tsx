import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/atoms'
import { daysUntil } from '@/lib/trips/helpers'
import { cn } from '@/lib/cn'

export type CountdownProps = {
  targetIso: string
  label: string
  className?: string
}

export function Countdown({ targetIso, label, className }: CountdownProps) {
  const { t } = useTranslation()
  const days = daysUntil(targetIso)
  const isPast = days < 0

  return (
    <View className={cn('gap-1', className)}>
      <Text
        variant="display"
        tone={isPast ? 'primary' : 'foreground'}
        accessibilityRole="text"
      >
        {isPast
          ? t('trips.dashboard.deadlinePassed')
          : days === 0
            ? t('trips.deadlineToday')
            : days}
      </Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  )
}
