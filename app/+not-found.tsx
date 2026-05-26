import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/atoms'

export default function NotFoundScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <Text variant="title">{t('notFound.title')}</Text>
        <Link href="/">
          <Text tone="primary" variant="body-em">
            {t('notFound.goHome')}
          </Text>
        </Link>
      </View>
    </SafeAreaView>
  )
}
