import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { useTranslation } from 'react-i18next'

export default function AuthLayout() {
  const { t } = useTranslation()
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return null
  if (isSignedIn) return <Redirect href="/(app)/(tabs)" />
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: t('common.back'),
      }}
    />
  )
}
