import { Redirect, Stack, useLocalSearchParams } from 'expo-router'

import { Splash } from '@/components/atoms'
import { useMe, useTrip } from '@/lib/api/queries'
import { isOrganizer } from '@/lib/trips/helpers'

export default function OrganizerLayout() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useMe()
  const trip = useTrip(id)

  if (trip.isLoading || me.isLoading) return <Splash />
  if (!trip.data || !me.data) return <Redirect href={`/trips/${id}`} />
  if (!isOrganizer(trip.data, me.data.id)) {
    return <Redirect href={`/trips/${id}`} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pending" />
      <Stack.Screen name="contributions" />
      <Stack.Screen
        name="log"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  )
}
