import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Icon, Text } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/dates'
import {
  getTemplateConfig,
  type TemplateTone,
} from '@/lib/notifications/template-config'
import {
  navigateFromPushData,
  type PushData,
} from '@/lib/push/listeners'
import {
  useMarkNotificationRead,
  type NotificationDto,
} from '@/lib/api/queries'

export type NotificationItemProps = {
  notification: NotificationDto
  className?: string
}

const iconColorByTone: Record<TemplateTone, string> = {
  primary: colors.primary,
  default: colors.foreground,
  subtle: colors.secondary,
}

export function NotificationItem({
  notification,
  className,
}: NotificationItemProps) {
  const { t, i18n } = useTranslation()
  const markRead = useMarkNotificationRead()

  const cfg = getTemplateConfig(notification.templateKey)
  const isUnread = notification.status !== 'read' && !notification.readAt

  const title = notification.subject ?? t('notifications.fallback.title')
  const relative = formatRelativeTime(
    notification.createdAt,
    t,
    i18n.language,
  )

  const onPress = () => {
    if (isUnread) markRead.mutate(notification.id)
    const data: PushData = {
      type: notification.templateKey,
      tripId: notification.relatedTripId ?? undefined,
      contributionId: notification.relatedContributionId ?? undefined,
    }
    navigateFromPushData(data)
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={cn(
        'flex-row gap-3 p-3 rounded-card',
        isUnread && 'bg-muted/10',
        className,
      )}
    >
      <View className="w-10 h-10 rounded-full bg-background border-hairline border-muted items-center justify-center">
        <Icon name={cfg.icon} size={20} color={iconColorByTone[cfg.tone]} />
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            variant="body-em"
            tone={isUnread ? 'foreground' : 'secondary'}
            numberOfLines={2}
            className="flex-1"
          >
            {title}
          </Text>
          {isUnread ? (
            <View className="w-2 h-2 rounded-full bg-primary" />
          ) : null}
        </View>
        {notification.body ? (
          <Text variant="caption" tone="secondary" numberOfLines={3}>
            {notification.body}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {relative}
        </Text>
      </View>
    </Pressable>
  )
}
