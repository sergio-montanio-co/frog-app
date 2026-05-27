import { useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { Button, EmptyState, Splash, Text } from '@/components/atoms'
import {
  NotificationItem,
  PushPermissionPrompt,
} from '@/components/molecules'
import { colors } from '@/theme/colors'
import { daysSince } from '@/lib/dates'
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
  type NotificationDto,
} from '@/lib/api/queries'

type ListItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'item'; notification: NotificationDto }

type SectionKey = 'today' | 'yesterday' | 'thisWeek' | 'older'

export default function AlertsScreen() {
  const { t } = useTranslation()
  const notifications = useNotifications()
  const unread = useUnreadNotificationsCount()
  const markAll = useMarkAllNotificationsRead()

  const allItems = useMemo(
    () =>
      (notifications.data?.pages ?? [])
        .flatMap((p) => p.items)
        .filter((n) => n.status !== 'failed'),
    [notifications.data],
  )

  const listData = useMemo<ListItem[]>(() => {
    if (allItems.length === 0) return []
    const groups: Record<SectionKey, NotificationDto[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    }
    for (const n of allItems) {
      const created = new Date(n.createdAt)
      const days = daysSince(created)
      if (days <= 0) groups.today.push(n)
      else if (days === 1) groups.yesterday.push(n)
      else if (days < 7) groups.thisWeek.push(n)
      else groups.older.push(n)
    }
    const labels: Record<SectionKey, string> = {
      today: t('notifications.section.today'),
      yesterday: t('notifications.section.yesterday'),
      thisWeek: t('notifications.section.thisWeek'),
      older: t('notifications.section.older'),
    }
    const result: ListItem[] = []
    const order: SectionKey[] = ['today', 'yesterday', 'thisWeek', 'older']
    for (const key of order) {
      if (groups[key].length === 0) continue
      result.push({ kind: 'header', key, label: labels[key] })
      for (const n of groups[key]) {
        result.push({ kind: 'item', notification: n })
      }
    }
    return result
  }, [allItems, t])

  const unreadCount = unread.data ?? 0
  const showMarkAll = unreadCount > 0

  if (notifications.isLoading) return <Splash />

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between gap-2 px-4 pt-2 pb-3">
        <Text variant="display">{t('notifications.title')}</Text>
        {showMarkAll ? (
          <Button
            label={t('notifications.markAllRead')}
            variant="ghost"
            onPress={() => markAll.mutate(undefined)}
            disabled={markAll.isPending}
          />
        ) : null}
      </View>
      <FlatList
        data={listData}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: 32,
        }}
        keyExtractor={(item) =>
          item.kind === 'header' ? `h-${item.key}` : item.notification.id
        }
        ListHeaderComponent={
          <View className="px-1 pb-2">
            <PushPermissionPrompt />
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <SectionHeader label={item.label} />
          ) : (
            <NotificationItem notification={item.notification} />
          )
        }
        ListEmptyComponent={
          <View className="px-4 pt-6">
            <EmptyState
              icon="notifications"
              title={t('notifications.empty.title')}
              body={t('notifications.empty.body')}
            />
          </View>
        }
        ListFooterComponent={
          notifications.isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (
            notifications.hasNextPage &&
            !notifications.isFetchingNextPage
          ) {
            void notifications.fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={
              notifications.isRefetching &&
              !notifications.isFetchingNextPage
            }
            onRefresh={() => {
              void notifications.refetch()
            }}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View className="pt-4 pb-1 px-1">
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  )
}
