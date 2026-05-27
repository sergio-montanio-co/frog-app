import { Stack } from 'expo-router'

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="plan/new"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="invitations-created" />
      <Stack.Screen name="contributions/new" />
      <Stack.Screen name="contributions/index" />
      <Stack.Screen
        name="contributions/[contributionId]/edit"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  )
}
