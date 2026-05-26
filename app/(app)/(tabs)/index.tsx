import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useUser } from '@clerk/expo'

import { Text, Card, Button, Icon } from '@/components/atoms'
import { useMe } from '@/lib/api/use-me'

export default function HomeScreen() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { data, isLoading, isError } = useMe()

  const displayName = data?.firstName ?? user?.firstName ?? ''
  const orgName = data?.defaultOrganization?.name ?? null

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4 pt-4 gap-6">
        <Text variant="display">{t('home.title')}</Text>

        <Card>
          <View className="flex-row items-center gap-3">
            <Icon name="person" size={24} accessibilityLabel={t('tabs.profile')} />
            <Text variant="body">
              {isLoading || isError
                ? t('common.loading')
                : t('home.greeting', { name: displayName })}
            </Text>
          </View>
          {orgName ? (
            <Text variant="caption" tone="secondary" className="mt-2">
              {orgName}
            </Text>
          ) : null}
        </Card>

        <Text variant="body" tone="secondary">
          {t('home.placeholder')}
        </Text>

        <Button label={t('home.newTrip')} onPress={() => undefined} />
      </View>
    </SafeAreaView>
  )
}
