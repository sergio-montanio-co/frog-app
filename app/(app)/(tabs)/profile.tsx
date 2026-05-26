import { useState } from 'react'
import { Pressable, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'

import { Avatar, Button, Card, Icon, Text } from '@/components/atoms'
import { useMe, useUpdateMe, type UpdateMeDto } from '@/lib/api/queries'
import { colors } from '@/theme/colors'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const router = useRouter()
  const me = useMe()
  const updateMe = useUpdateMe()

  const [signingOut, setSigningOut] = useState(false)

  if (!me.data) return null

  const user = me.data
  const headline = user.displayName?.trim() || user.fullName?.trim() || user.email || ''
  const subline = user.email || user.phone || ''

  async function onSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/(auth)/sign-in')
    } finally {
      setSigningOut(false)
    }
  }

  function togglePref(key: keyof UpdateMeDto, value: boolean) {
    if (updateMe.isPending) return
    updateMe.mutate({ [key]: value } satisfies UpdateMeDto)
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4 pt-4 gap-6">
        <Text variant="display">{t('profile.title')}</Text>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar
              uri={user.avatarUrl}
              name={headline}
              size={56}
              accessibilityLabel={headline}
            />
            <View className="flex-1">
              <Text variant="title" numberOfLines={1}>
                {headline}
              </Text>
              {subline ? (
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {subline}
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/profile/edit')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.editProfile')}
            className="h-11 flex-row items-center justify-between"
          >
            <Text variant="body-em" tone="primary">
              {t('profile.editProfile')}
            </Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
        </Card>

        <Card className="gap-3">
          <Text variant="title">{t('profile.preferencesTitle')}</Text>

          <PrefRow
            label={t('profile.notifyByEmail')}
            value={user.notifyByEmail}
            onChange={(v) => togglePref('notifyByEmail', v)}
          />
          <PrefRow
            label={t('profile.notifyByWhatsapp')}
            value={user.notifyByWhatsapp}
            disabled
            disabledHint={t('common.comingSoon')}
          />
          <PrefRow
            label={t('profile.notifyByPush')}
            value={user.notifyByPush}
            onChange={(v) => togglePref('notifyByPush', v)}
          />
        </Card>

        <View className="flex-1" />

        <Button
          variant="ghost"
          label={t('profile.signOut')}
          onPress={onSignOut}
          loading={signingOut}
        />
      </View>
    </SafeAreaView>
  )
}

function PrefRow({
  label,
  value,
  onChange,
  disabled,
  disabledHint,
}: {
  label: string
  value: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <View className="h-11 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text variant="body-em" tone={disabled ? 'secondary' : 'foreground'}>
          {label}
        </Text>
        {disabled && disabledHint ? (
          <Text variant="caption" tone="secondary">
            {disabledHint}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={colors.background}
      />
    </View>
  )
}
