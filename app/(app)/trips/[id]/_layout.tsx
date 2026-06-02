import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'

export default function TripLayout() {
  const { t } = useTranslation()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: t('common.back'),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="plan/new"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="join-requests" />
      <Stack.Screen
        name="edit"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="contributions/new" />
      <Stack.Screen name="contributions/index" />
      <Stack.Screen
        name="contributions/[contributionId]/edit"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="organizer" />
    </Stack>
  )
}
