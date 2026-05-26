import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/atoms'

export default function AlertsScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4 pt-4 gap-4">
        <Text variant="display">{t('alerts.title')}</Text>
        <Text variant="body" tone="secondary">
          {t('alerts.empty')}
        </Text>
      </View>
    </SafeAreaView>
  )
}
