import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { MaterialIcons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { useUnreadNotificationsCount } from '@/lib/api/queries'

export default function TabsLayout() {
  const { t } = useTranslation()
  const unread = useUnreadNotificationsCount()
  const unreadCount = unread.data ?? 0
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.muted,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontFamily: 'Quicksand_500Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.trips'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="flight-takeoff" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t('tabs.alerts'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" color={color} size={size} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.background,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
