import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/atoms'
import { colors } from '@/theme/colors'

export default function TripDetailStub() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('trips.stubTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: 'Quicksand_600SemiBold' },
        }}
      />
      <View className="flex-1 px-4 pt-4 gap-3">
        <Text variant="body" tone="secondary">
          {t('trips.stubBody')}
        </Text>
        <Text variant="caption" tone="muted">
          {t('trips.stubId', { id })}
        </Text>
      </View>
    </SafeAreaView>
  )
}
