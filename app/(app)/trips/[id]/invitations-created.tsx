import { useState } from 'react'
import { Alert, FlatList, Share, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import * as Clipboard from 'expo-clipboard'

import {
  Button,
  Card,
  Icon,
  IconButton,
  Text,
} from '@/components/atoms'
import { useTrip } from '@/lib/api/queries'
import { colors } from '@/theme/colors'

import { pickInvitations } from '@/lib/trips/wizard'

type InvitationItem = ReturnType<typeof pickInvitations>[number]

export default function InvitationsCreatedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useTrip(id)

  const invitations = data ? pickInvitations(data.members) : []

  function goToTrip() {
    router.replace({ pathname: '/trips/[id]', params: { id } })
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('trips.new.created.headerTitle'),
          headerBackVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: 'Quicksand_600SemiBold' },
        }}
      />
      <View className="flex-1 px-4 pt-4">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text variant="body" tone="secondary">
              {t('common.loading')}
            </Text>
          </View>
        ) : isError || !data ? (
          <View className="flex-1 items-center justify-center gap-4">
            <Text variant="title">{t('common.error')}</Text>
            <Button
              label={t('common.retry')}
              variant="secondary"
              onPress={() => refetch()}
            />
          </View>
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(it) => it.memberId}
            contentContainerStyle={{ paddingBottom: 96, gap: 12 }}
            ListHeaderComponent={
              <View className="gap-2 pb-4">
                <Text variant="display">
                  {t('trips.new.created.title')}
                </Text>
                <Text variant="body" tone="secondary">
                  {data.name}
                </Text>
                <Text variant="body" tone="secondary">
                  {t('trips.new.created.subtitle')}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View className="rounded-card border-hairline border-muted p-6 items-center">
                <Text variant="body" tone="secondary" className="text-center">
                  {t('trips.new.created.noInvitations')}
                </Text>
              </View>
            }
            renderItem={({ item }) => <InvitationCard item={item} />}
          />
        )}
      </View>

      <View className="border-t-hairline border-muted bg-background p-4">
        <Button
          label={t('trips.new.created.goToTrip')}
          onPress={goToTrip}
          size="lg"
          disabled={!data}
        />
      </View>
    </SafeAreaView>
  )
}

function InvitationCard({ item }: { item: InvitationItem }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function copy() {
    await Clipboard.setStringAsync(item.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function share() {
    try {
      await Share.share({ message: item.shareUrl })
    } catch (err) {
      Alert.alert(t('common.error'))
    }
  }

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text variant="body-em">{item.name || '—'}</Text>
        <Text variant="caption" tone="secondary">
          {item.email ?? item.phone ?? ''}
        </Text>
      </View>
      <View className="flex-row items-center gap-2 rounded-card border-hairline border-muted bg-background px-3 py-2">
        <View className="flex-1">
          <Text variant="caption" numberOfLines={1} className="font-medium">
            {item.shareUrl}
          </Text>
        </View>
        <IconButton
          name="content-copy"
          variant="ghost"
          accessibilityLabel={t('trips.new.created.copyLink')}
          onPress={copy}
        />
        <IconButton
          name="share"
          variant="ghost"
          accessibilityLabel={t('trips.new.created.share')}
          onPress={share}
        />
      </View>
      {copied ? (
        <View className="flex-row items-center gap-1.5">
          <Icon name="check" size={16} color={colors.primary} />
          <Text variant="caption" tone="primary">
            {t('trips.new.created.linkCopied')}
          </Text>
        </View>
      ) : null}
    </Card>
  )
}
