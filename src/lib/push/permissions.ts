import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'

import { env } from '@/lib/env'

export async function getPushPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync()
  return status
}

export async function ensurePushTokenAndRegister(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let final = existing
  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync()
    final = requested
  }
  if (final !== 'granted') return null

  const projectId = env.EXPO_PUBLIC_EAS_PROJECT_ID
  const tokenData = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync()
  return tokenData.data
}
