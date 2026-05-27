import { useEffect } from 'react'

import { useApiClient } from '@/lib/api/client'
import { useMe } from '@/lib/api/queries'
import { ensurePushTokenAndRegister } from './permissions'

export function useSyncPushToken() {
  const me = useMe()
  const client = useApiClient()

  const userId = me.data?.id
  const remoteToken = me.data?.expoPushToken ?? null

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    void (async () => {
      try {
        const token = await ensurePushTokenAndRegister()
        if (cancelled || !token) return
        if (token === remoteToken) return
        await client.POST('/me/expo-push-token', {
          body: { expoPushToken: token },
        })
      } catch (err) {
        console.warn('[push] sync failed', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, remoteToken, client])
}
