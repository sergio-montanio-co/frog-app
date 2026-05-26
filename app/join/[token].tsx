import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/atoms'

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const { t } = useTranslation()
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-4">
        <Text variant="body">{t('join.received', { token })}</Text>
      </View>
    </SafeAreaView>
  )
}
