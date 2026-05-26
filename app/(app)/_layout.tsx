import { View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { useTranslation } from 'react-i18next'

import { Splash, Text, Button } from '@/components/atoms'
import { useMe } from '@/lib/api/queries'

export default function AppLayout() {
  const { t } = useTranslation()
  const { isLoaded, isSignedIn } = useAuth()
  const me = useMe()

  if (!isLoaded) return <Splash />
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />
  if (me.isLoading) return <Splash />
  if (me.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text variant="title">{t('common.error')}</Text>
        <Button
          label={t('common.retry')}
          variant="secondary"
          onPress={() => me.refetch()}
        />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
