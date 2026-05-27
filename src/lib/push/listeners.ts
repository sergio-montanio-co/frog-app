import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'

import { queryClient } from '@/lib/api/query-client'

export type PushData = {
  type?: string
  tripId?: string
  contributionId?: string
}

const handledResponseIds = new Set<string>()

function readPushData(notification: Notifications.Notification): PushData {
  const raw = notification.request.content.data
  if (raw && typeof raw === 'object') return raw as PushData
  return {}
}

export function navigateFromPushData(data: PushData): void {
  if (!data.tripId) return
  switch (data.type) {
    case 'contribution_reported':
      router.push(`/trips/${data.tripId}/organizer/pending`)
      return
    case 'contribution_confirmed':
    case 'contribution_rejected':
      router.push(`/trips/${data.tripId}/contributions`)
      return
    default:
      router.push(`/trips/${data.tripId}`)
  }
}

export function useHandlePushTaps(): void {
  const lastResponse = Notifications.useLastNotificationResponse()

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        void queryClient.invalidateQueries({
          queryKey: ['me', 'notifications'],
        })
        void queryClient.invalidateQueries({
          queryKey: ['me', 'notifications', 'unread-count'],
        })
        const data = readPushData(notification)
        if (data.tripId) {
          void queryClient.invalidateQueries({
            queryKey: ['trip', data.tripId],
          })
        }
      },
    )
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!lastResponse) return
    const id = lastResponse.notification.request.identifier
    if (handledResponseIds.has(id)) return
    handledResponseIds.add(id)
    navigateFromPushData(readPushData(lastResponse.notification))
  }, [lastResponse])
}
