import { useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth, useUser } from '@clerk/expo'
import { useRouter } from 'expo-router'

import { Text, Card, Button, Icon } from '@/components/atoms'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const emailAddress = user?.primaryEmailAddress?.emailAddress ?? ''

  async function onSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/(auth)/sign-in')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4 pt-4 gap-6">
        <Text variant="display">{t('profile.title')}</Text>

        <Card>
          <View className="flex-row items-center gap-3">
            <Icon name="person" size={24} />
            <View className="flex-1">
              <Text variant="body-em">{user?.firstName ?? ''}</Text>
              {emailAddress ? (
                <Text variant="caption" tone="secondary">
                  {emailAddress}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Button
          variant="secondary"
          label={t('profile.signOut')}
          onPress={onSignOut}
          loading={signingOut}
        />
      </View>
    </SafeAreaView>
  )
}
