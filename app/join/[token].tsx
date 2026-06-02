import { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { useTranslation } from 'react-i18next'

import { EmptyState, Splash } from '@/components/atoms'
import { clearPendingInvitation } from '@/lib/invitations/pending'

export default function LegacyJoinScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    if (isSignedIn) {
      clearPendingInvitation().catch(() => undefined)
    }
  }, [isSignedIn])

  if (!isLoaded) return <Splash />

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center p-4">
        <EmptyState
          icon="link-off"
          title={t('invitations.join.legacy.title')}
          body={t('invitations.join.legacy.body')}
          cta={{
            label: isSignedIn
              ? t('invitations.join.legacy.cta')
              : t('common.back'),
            onPress: () => {
              if (isSignedIn) {
                router.replace('/(app)/trips/join-with-code')
              } else {
                router.replace('/(auth)/sign-in')
              }
            },
          }}
        />
      </View>
    </SafeAreaView>
  )
}
