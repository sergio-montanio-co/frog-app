import { Pressable, ScrollView, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Icon, Text, TogglePill } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'

export type StatusFilterValue = 'all' | 'reported' | 'confirmed' | 'rejected'

export type FilterBarProps = {
  status: StatusFilterValue
  onStatusChange: (value: StatusFilterValue) => void
  memberLabel: string
  onPressMember: () => void
  memberActive?: boolean
  className?: string
}

const STATUS_OPTIONS: Array<{
  value: StatusFilterValue
  i18nKey: string
}> = [
  { value: 'all', i18nKey: 'trips.organizer.all.filter.allStatuses' },
  { value: 'reported', i18nKey: 'trips.organizer.all.filter.reported' },
  { value: 'confirmed', i18nKey: 'trips.organizer.all.filter.confirmed' },
  { value: 'rejected', i18nKey: 'trips.organizer.all.filter.rejected' },
]

export function FilterBar({
  status,
  onStatusChange,
  memberLabel,
  onPressMember,
  memberActive,
  className,
}: FilterBarProps) {
  const { t } = useTranslation()

  return (
    <View className={cn('gap-3', className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <TogglePill
            key={opt.value}
            label={t(opt.i18nKey)}
            active={status === opt.value}
            onPress={() => onStatusChange(opt.value)}
          />
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          'trips.organizer.all.filter.memberLabel',
        )}
        onPress={onPressMember}
        className={cn(
          'flex-row items-center gap-2 self-start rounded-card border-hairline px-3 py-2',
          memberActive ? 'border-primary' : 'border-muted',
        )}
      >
        <Icon
          name="filter-list"
          size={20}
          color={memberActive ? colors.primary : colors.secondary}
        />
        <Text
          variant="body-em"
          tone={memberActive ? 'primary' : 'foreground'}
          numberOfLines={1}
        >
          {memberLabel}
        </Text>
      </Pressable>
    </View>
  )
}
