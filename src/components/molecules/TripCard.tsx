import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Card, Icon, ProgressBar, Text } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { formatMxn } from '@/lib/money'
import type { TripListItem } from '@/lib/api/queries'

export type TripCardProps = { trip: TripListItem }

export function TripCard({ trip }: TripCardProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const days = trip.progress.daysUntilDeadline
  const isLate = days < 0
  const deadlineText =
    days === 0
      ? t('trips.deadlineToday')
      : isLate
        ? Math.abs(days) === 1
          ? t('trips.daysLateOne', { count: Math.abs(days) })
          : t('trips.daysLateMany', { count: Math.abs(days) })
        : days === 1
          ? t('trips.daysRemainingOne', { count: days })
          : t('trips.daysRemainingMany', { count: days })
  const deadlineTone: 'primary' | 'secondary' =
    days <= 0 ? 'primary' : 'secondary'

  const membersText =
    trip.membersCount === 1
      ? t('trips.membersCountOne', { count: trip.membersCount })
      : t('trips.membersCountMany', { count: trip.membersCount })

  return (
    <Pressable
      onPress={() => router.push(`/trips/${trip.id}`)}
      accessibilityRole="button"
      accessibilityLabel={trip.name}
    >
      <Card className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="title" numberOfLines={1}>
              {trip.name}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {trip.destination}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 pt-1">
            <Icon name="groups" size={16} color={colors.secondary} />
            <Text variant="caption" tone="secondary">
              {membersText}
            </Text>
          </View>
        </View>

        <ProgressBar
          percent={trip.progress.percent}
          accessibilityLabel={`${Math.round(trip.progress.percent)}%`}
        />

        <View className="flex-row items-center justify-between gap-3">
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {t('trips.collectedOfTarget', {
              collected: formatMxn(trip.progress.collectedMxn, { compact: true }),
              target: formatMxn(trip.progress.totalTargetMxn, { compact: true }),
            })}
          </Text>
          <Text variant="caption" tone={deadlineTone}>
            {deadlineText}
          </Text>
        </View>
      </Card>
    </Pressable>
  )
}
