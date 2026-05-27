import { useEffect, useState } from 'react'
import { AppState, Linking, View, type AppStateStatus } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useTranslation } from 'react-i18next'

import { Button, Card, Icon, Text } from '@/components/atoms'
import { cn } from '@/lib/cn'

export type PushPermissionPromptProps = {
  className?: string
}

export function PushPermissionPrompt({ className }: PushPermissionPromptProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(
    null,
  )
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const result = await Notifications.getPermissionsAsync()
      if (!cancelled) setStatus(result.status)
    }
    void refresh()
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void refresh()
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => {
      cancelled = true
      sub.remove()
    }
  }, [])

  if (dismissed) return null
  if (status === null) return null
  if (status === 'granted') return null

  const onEnable = async () => {
    if (status === 'undetermined') {
      const requested = await Notifications.requestPermissionsAsync()
      setStatus(requested.status)
      return
    }
    await Linking.openSettings()
  }

  return (
    <Card className={cn('gap-3', className)}>
      <View className="flex-row items-center gap-2">
        <Icon name="notifications-off" size={20} />
        <Text variant="body-em">{t('notifications.prompt.title')}</Text>
      </View>
      <Text variant="caption" tone="secondary">
        {t('notifications.prompt.body')}
      </Text>
      <View className="flex-row gap-2">
        <Button
          label={t('notifications.prompt.notNow')}
          variant="ghost"
          onPress={() => setDismissed(true)}
          className="flex-1"
        />
        <Button
          label={t('notifications.prompt.enable')}
          variant="primary"
          onPress={onEnable}
          className="flex-1"
        />
      </View>
    </Card>
  )
}
