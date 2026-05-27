import { useState } from 'react'
import { FlatList, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  EmptyState,
  Icon,
  Text,
  TogglePill,
} from '@/components/atoms'
import { TripCard } from '@/components/molecules/TripCard'
import { useTrips, type TripsTab } from '@/lib/api/queries'
import { colors } from '@/theme/colors'

export default function MyTripsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [tab, setTab] = useState<TripsTab>('active')
  const { data, isLoading, isError, refetch } = useTrips(tab)

  const items = data?.items ?? []
  const showEmpty = !isLoading && !isError && items.length === 0
  const showList = !isLoading && !isError && items.length > 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4 pt-4 gap-4">
        <Text variant="display">{t('trips.title')}</Text>

        <View className="flex-row gap-2">
          <TogglePill
            label={t('trips.tabActive')}
            active={tab === 'active'}
            onPress={() => setTab('active')}
          />
          <TogglePill
            label={t('trips.tabPast')}
            active={tab === 'past'}
            onPress={() => setTab('past')}
          />
        </View>

        <View className="flex-1">
          {isLoading && <SkeletonList />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {showEmpty && <TripsEmpty tab={tab} />}
          {showList && (
            <FlatList
              data={items}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => <TripCard trip={item} />}
              ItemSeparatorComponent={() => <View className="h-3" />}
              contentContainerStyle={{ paddingBottom: 96 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <View className="absolute bottom-6 left-4 right-4">
        <Button
          label={t('trips.newTrip')}
          onPress={() => router.push('/trips/new')}
        />
      </View>
    </SafeAreaView>
  )
}

function SkeletonList() {
  return (
    <View className="gap-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  )
}

function SkeletonCard() {
  return (
    <Card className="gap-3">
      <View className="h-5 w-2/3 rounded-full bg-muted/30" />
      <View className="h-3 w-1/2 rounded-full bg-muted/30" />
      <View className="h-1.5 w-full rounded-full bg-muted/30" />
      <View className="h-3 w-2/3 rounded-full bg-muted/30" />
    </Card>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <Icon name="error-outline" size={32} color={colors.secondary} />
      <Text variant="title" tone="foreground">
        {t('trips.errorTitle')}
      </Text>
      <Button label={t('common.retry')} variant="secondary" onPress={onRetry} />
    </View>
  )
}

function TripsEmpty({ tab }: { tab: TripsTab }) {
  const { t } = useTranslation()
  const title =
    tab === 'active' ? t('trips.emptyActiveTitle') : t('trips.emptyPastTitle')
  const body =
    tab === 'active' ? t('trips.emptyActiveBody') : t('trips.emptyPastBody')
  return (
    <View className="flex-1 items-center justify-center px-2">
      <EmptyState
        icon={tab === 'active' ? 'flight-takeoff' : 'history'}
        title={title}
        body={body}
        className="self-stretch"
      />
    </View>
  )
}
